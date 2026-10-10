import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/events?patientId=...&type=...&time=...
router.get('/', (req: Request, res: Response) => {
  const { patientId, type, time } = req.query as {
    patientId?: string;
    type?: string;
    time?: string;
  };

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
router.get('/:id', (req: Request, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Health event not found' });
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

    const createdBy = req.user?.fullName || data.createdBy || (req.user?.role === 'doctor' ? 'Dr. Sharma' : 'Caregiver');
    const source = req.user?.role === 'doctor' ? 'Clinician' : req.user?.role === 'family' ? 'Family / Caregiver' : data.source || 'Patient';

    const event = db.createEvent({
      ...data,
      createdBy,
      source,
      verified: req.user?.role === 'doctor' || !!data.verified
    });

    return res.status(201).json({ success: true, data: event });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', optionalToken, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteEvent(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  db.createAuditLog({
    actorName: req.user?.fullName || 'Clinician',
    actorRole: req.user?.role === 'doctor' ? 'Doctor' : 'Family Member',
    action: 'Deleted Health Event',
    details: `Event ID ${req.params.id} deleted`
  });

  return res.json({ success: true, message: 'Event deleted successfully' });
});

// PATCH /api/events/:id/verify
router.patch('/:id/verify', optionalToken, (req: AuthRequest, res: Response) => {
  const verifierName = req.user?.fullName || 'Attending Physician';
  const verified = db.verifyEvent(req.params.id, verifierName);
  if (!verified) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  return res.json({ success: true, data: verified });
});

export default router;
