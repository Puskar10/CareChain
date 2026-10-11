import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { canUserAccessPatient } from '../ai/authz';

const router = Router();

// GET /api/events?patientId=...&type=...&time=...
router.get('/', optionalToken, (req: AuthRequest, res: Response) => {
  const { patientId, type, time } = req.query as {
    patientId?: string;
    type?: string;
    time?: string;
  };

  // If user is authenticated and requesting a specific patient, enforce authorization
  if (req.user && patientId && !canUserAccessPatient(req.user, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view events for this patient' });
  }

  let events = db.getEvents({ patientId, type });

  // Optional time filtering (24h, 72h, 7d, 30d)
  if (time && time !== 'all') {
    const now = Date.now();
    const hoursMap: Record<string, number> = {
      '24h': 24,
      '72h': 72,
      '7d': 7 * 24,
      '30d': 30 * 24
    };
    const maxHours = hoursMap[time];
    if (maxHours) {
      const cutoff = now - maxHours * 3600 * 1000;
      events = events.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return isNaN(t) || t >= cutoff;
      });
    }
  }

  return res.json({ success: true, count: events.length, data: events });
});

// GET /api/events/:id
router.get('/:id', optionalToken, (req: AuthRequest, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Health event not found' });
  }
  if (req.user && !canUserAccessPatient(req.user, event.patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view this event' });
  }
  return res.json({ success: true, data: event });
});

// POST /api/events
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    console.log(`[MedicalEvent] submit started - user: ${req.user?.id || 'anonymous'}, role: ${req.user?.role || 'none'}`);

    let patientId = data.patientId;
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      if (req.user?.role === 'patient') {
        if (!req.user.patientId) {
          const pat = db.ensurePatientForUser(req.user);
          req.user.patientId = pat.id;
        }
        patientId = req.user.patientId;
      } else if (req.user?.role === 'family' && req.user.patientId) {
        patientId = req.user.patientId;
      } else if (req.user?.role === 'doctor') {
        patientId = db.getPatients()[0]?.id;
      }
    }

    if (!patientId) {
      console.warn(`[MedicalEvent] database insert failed - missing patientId`);
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }

    if (req.user && !canUserAccessPatient(req.user, patientId)) {
      console.warn(`[MedicalEvent] database insert failed - unauthorized user ${req.user.id} for patient ${patientId}`);
      return res.status(403).json({ success: false, error: 'Unauthorized to record events for this patient' });
    }

    console.log(`[MedicalEvent] payload validated for patient: ${patientId}`);

    // Role-enforced provenance
    const isDoctor = req.user?.role === 'doctor';
    const isCaregiver = req.user?.role === 'family';
    const isPatient = req.user?.role === 'patient';

    let source = data.source || 'Patient';
    let verified = false;

    if (isDoctor) {
      source = 'Clinician';
      verified = true;
    } else if (isCaregiver) {
      source = 'Family / Caregiver';
      verified = false;
    } else if (isPatient) {
      source = 'Patient';
      verified = false;
    }

    const createdBy = req.user?.fullName || data.createdBy || (isDoctor ? 'Attending Physician' : isCaregiver ? 'Caregiver' : 'Patient');

    console.log(`[MedicalEvent] database insert started for type: ${data.type || 'symptom'}`);

    const event = db.createEvent({
      ...data,
      patientId,
      createdBy,
      source,
      verified
    });

    console.log(`[MedicalEvent] database insert succeeded - event id: ${event.id}`);
    return res.status(201).json({ success: true, data: event });
  } catch (err: any) {
    console.error(`[MedicalEvent] database insert failed - error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', optionalToken, (req: AuthRequest, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  if (req.user && !canUserAccessPatient(req.user, event.patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to delete events for this patient' });
  }

  // Patients cannot delete clinician-verified events
  if (req.user?.role === 'patient' && event.verified) {
    return res.status(403).json({ success: false, error: 'Patients cannot delete doctor-verified events' });
  }

  const deleted = db.deleteEvent(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  db.createAuditLog({
    patientId: event.patientId,
    actorName: req.user?.fullName || 'Clinician',
    actorRole: req.user?.role === 'doctor' ? 'Doctor' : 'Family Member',
    action: 'Deleted Health Event',
    details: `Event ID ${req.params.id} (${event.title}) deleted`
  });

  return res.json({ success: true, message: 'Event deleted successfully' });
});

// PATCH /api/events/:id/verify (Doctor only)
router.patch('/:id/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({ success: false, error: 'Only doctors can verify clinical events' });
  }

  const event = db.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  if (!canUserAccessPatient(req.user, event.patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to verify events for this patient' });
  }

  const verifierName = req.user.fullName || 'Attending Physician';
  const verified = db.verifyEvent(req.params.id, verifierName);
  return res.json({ success: true, data: verified });
});

export default router;
