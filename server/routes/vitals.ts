import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/vitals?patientId=...
router.get('/', (req: Request, res: Response) => {
  const { patientId } = req.query as { patientId?: string };
  const vitals = db.getVitals(patientId);
  return res.json({ success: true, count: vitals.length, data: vitals });
});

// POST /api/vitals
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  try {
    const vitalData = req.body;
    const actorName = req.user?.fullName || 'Caregiver / Device';
    const vital = db.createVital(vitalData, actorName);
    return res.status(201).json({ success: true, data: vital });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
