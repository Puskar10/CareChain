import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { canUserAccessPatient } from '../ai/authz';
import { createOverviewDeps, generatePatientOverview } from '../ai/overview';

const router = Router();

// GET /api/patients
router.get('/', optionalToken, (req: AuthRequest, res: Response) => {
  const allPatients = db.getPatients();

  // If user is not authenticated: do not return clinical patients
  if (!req.user) {
    return res.json({ success: true, count: 0, data: [] });
  }

  // If user is a demo account (e.g. email ends with @carechain.health):
  if (req.user.email.endsWith('@carechain.health')) {
    if (req.user.role === 'doctor') {
      return res.json({ success: true, count: allPatients.length, data: allPatients });
    }
    const filtered = allPatients.filter(p => p.id === req.user?.patientId);
    return res.json({ success: true, count: filtered.length, data: filtered });
  }

  // Real authenticated user:
  // Apply clinical authorization filters:
  if (req.user.role === 'doctor') {
    // Return patients assigned to this doctor, or clinic roster if on hospital medical staff
    const assigned = allPatients.filter(p =>
      (p as any).assignedDoctorId === req.user?.id ||
      (req.user?.fullName && p.primaryPhysician.toLowerCase().includes(req.user.fullName.toLowerCase()))
    );
    const result = assigned.length > 0 ? assigned : allPatients;
    return res.json({ success: true, count: result.length, data: result });
  }

  if (req.user.role === 'family') {
    // Only return patient assigned to this caregiver
    const assigned = req.user.patientId
      ? allPatients.filter(p => p.id === req.user?.patientId)
      : allPatients.slice(0, 1);
    return res.json({ success: true, count: assigned.length, data: assigned });
  }

  if (req.user.role === 'patient') {
    // Return verified patient record belonging to this patient
    if (!req.user.patientId) {
      const pat = db.ensurePatientForUser(req.user);
      req.user.patientId = pat.id;
    }
    let assigned = allPatients.filter(p => p.id === req.user?.patientId);
    if (assigned.length === 0) {
      const pat = db.ensurePatientForUser(req.user);
      assigned = [pat];
    }
    return res.json({ success: true, count: assigned.length, data: assigned });
  }

  if (req.user.role === 'ems') {
    // Return active emergency cases assigned to this paramedic
    const assigned = allPatients.filter(p => (p as any).assignedEmsUnit === req.user?.id);
    return res.json({ success: true, count: assigned.length, data: assigned });
  }

  return res.json({ success: true, count: 0, data: [] });
});

// GET /api/patients/:id
router.get('/:id', (req: Request, res: Response) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  return res.json({ success: true, data: patient });
});

// POST /api/patients
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  try {
    const patientData = req.body;
    if (!patientData.fullName) {
      return res.status(400).json({ success: false, error: 'fullName is required' });
    }

    const patient = db.createPatient(patientData);

    db.createAuditLog({
      patientId: patient.id,
      actorName: req.user?.fullName || 'Caregiver',
      actorRole: req.user?.role === 'doctor' ? 'Doctor' : 'Family Member',
      action: 'Created Patient Profile',
      details: `Profile created for ${patient.fullName}`
    });

    return res.status(201).json({ success: true, data: patient });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', optionalToken, (req: AuthRequest, res: Response) => {
  if (req.user && !canUserAccessPatient(req.user, req.params.id)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to update this patient' });
  }
  const updated = db.updatePatient(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  return res.json({ success: true, data: updated });
});

// GET /api/patients/:id/care-plans
router.get('/:id/care-plans', authenticateToken, (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  if (!canUserAccessPatient(req.user!, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view care plans for this patient' });
  }
  const plans = db.getCarePlans(patientId);
  return res.json({ success: true, count: plans.length, data: plans });
});

// POST /api/patients/:id/care-plans (Doctor only)
router.post('/:id/care-plans', authenticateToken, requireRole('doctor'), (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  if (!canUserAccessPatient(req.user!, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to add care plans for this patient' });
  }

  const { title, description, category, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  const doctorName = req.user!.fullName || 'Dr. Aarav Sharma, MD';
  const plan = db.createCarePlan({
    id: req.body.id,
    patientId,
    title,
    description: description || '',
    category: category || 'monitoring',
    status: status || 'active',
    prescribedBy: doctorName
  });

  // Persist corresponding timeline event
  db.createEvent({
    patientId,
    type: 'visit',
    title: `Care Plan Updated: ${plan.title}`,
    description: plan.description,
    severity: 'normal',
    source: 'Clinician',
    createdBy: doctorName,
    verified: true
  });

  db.createAuditLog({
    patientId,
    actorName: doctorName,
    actorRole: 'Doctor',
    action: 'Prescribed Care Plan Instruction',
    details: `${plan.title} (${plan.category})`
  });

  return res.status(201).json({ success: true, data: plan });
});

// GET /api/patients/:id/orders
router.get('/:id/orders', authenticateToken, (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  if (!canUserAccessPatient(req.user!, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view orders for this patient' });
  }
  const orders = db.getClinicalOrders(patientId);
  return res.json({ success: true, count: orders.length, data: orders });
});

// POST /api/patients/:id/orders (Doctor only)
router.post('/:id/orders', authenticateToken, requireRole('doctor'), (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  if (!canUserAccessPatient(req.user!, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to add orders for this patient' });
  }

  const { title, details, type, priority, status } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  const doctorName = req.user!.fullName || 'Dr. Aarav Sharma, MD';
  const order = db.createClinicalOrder({
    id: req.body.id,
    patientId,
    doctorName,
    type: type || 'medication',
    title,
    details: details || '',
    priority: priority || 'routine',
    status: status || 'ordered'
  });

  // Persist corresponding timeline event
  db.createEvent({
    patientId,
    type: 'visit',
    title: `Clinical Order: ${order.title}`,
    description: `${order.priority.toUpperCase()} priority order by ${doctorName}: ${order.details}`,
    severity: order.priority === 'stat' ? 'critical' : order.priority === 'urgent' ? 'moderate' : 'normal',
    source: 'Clinician',
    createdBy: doctorName,
    verified: true
  });

  db.createAuditLog({
    patientId,
    actorName: doctorName,
    actorRole: 'Doctor',
    action: 'Issued Clinical Order',
    details: `[${order.priority.toUpperCase()}] ${order.title}`
  });

  return res.status(201).json({ success: true, data: order });
});

// GET /api/patients/:id/ai-overview (Doctor only, generates live Gemini overview)
router.get('/:id/ai-overview', authenticateToken, requireRole('doctor'), async (req: AuthRequest, res: Response) => {
  const patientId = req.params.id;
  if (!canUserAccessPatient(req.user!, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to generate AI overview for this patient' });
  }

  const patient = db.getPatientById(patientId);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  try {
    const data = await generatePatientOverview(createOverviewDeps(), patientId);
    return res.json({
      success: true,
      summary: data.overview.summary,
      headline: data.overview.headline,
      keyAttentionPoints: data.overview.attention_points.map(ap => ({
        statement: ap.statement,
        urgency: ap.urgency,
        citations: ap.source_record_ids
      })),
      timelineSummary: [
        ...data.overview.recent_events.map(ev => ({ event: ev, citations: data.overview.source_record_ids })),
        ...data.overview.relevant_history.map(rh => ({ event: rh, citations: data.overview.source_record_ids }))
      ],
      rawOverview: data.overview,
      sourceRecords: data.records
    });
  } catch (err: any) {
    console.error('[AI] Overview error:', err?.message || err);
    return res.status(503).json({ success: false, error: 'AI overview is temporarily unavailable.' });
  }
});

// GET /api/patients/:id/handover
router.get('/:id/handover', optionalToken, (req: AuthRequest, res: Response) => {
  const { timespan } = req.query as { timespan?: string };
  const qs = timespan ? `?timespan=${timespan}` : '';
  res.redirect(307, `/api/handover/${req.params.id}${qs}`);
});

export default router;
