import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';
import { canUserAccessPatient } from '../ai/authz';

const router = Router();

// GET /api/vitals?patientId=...
router.get('/', optionalToken, (req: AuthRequest, res: Response) => {
  const { patientId } = req.query as { patientId?: string };
  if (req.user && patientId && !canUserAccessPatient(req.user, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view vitals for this patient' });
  }
  const vitals = db.getVitals(patientId);
  return res.json({ success: true, count: vitals.length, data: vitals });
});

// POST /api/vitals
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  try {
    const vitalData = req.body;
    const patientId = vitalData.patientId || (req.user?.role === 'patient' ? req.user.patientId : undefined);
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }

    if (req.user && !canUserAccessPatient(req.user, patientId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to record vitals for this patient' });
    }

    const actorName = req.user?.fullName || 'Caregiver / Device';
    const vital = db.createVital({ ...vitalData, patientId }, actorName);
    return res.status(201).json({ success: true, data: vital });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
