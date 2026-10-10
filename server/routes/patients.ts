import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

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
    // Only return patients assigned to this doctor
    const assigned = allPatients.filter(p =>
      (p as any).assignedDoctorId === req.user?.id ||
      (req.user?.fullName && p.primaryPhysician.toLowerCase().includes(req.user.fullName.toLowerCase()))
    );
    return res.json({ success: true, count: assigned.length, data: assigned });
  }

  if (req.user.role === 'family') {
    // Only return patient assigned to this caregiver
    const assigned = req.user.patientId
      ? allPatients.filter(p => p.id === req.user?.patientId)
      : [];
    return res.json({ success: true, count: assigned.length, data: assigned });
  }

  if (req.user.role === 'patient') {
    // Only return verified patient record belonging to this patient
    const assigned = req.user.patientId
      ? allPatients.filter(p => p.id === req.user?.patientId)
      : [];
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
  const updated = db.updatePatient(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  return res.json({ success: true, data: updated });
});

export default router;
