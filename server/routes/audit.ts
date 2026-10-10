import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/audit?patientId=...
router.get('/', (req: Request, res: Response) => {
  const { patientId } = req.query as { patientId?: string };
  const logs = db.getAuditLogs(patientId);
  return res.json({ success: true, count: logs.length, data: logs });
});

// POST /api/audit
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  const logData = req.body;
  const actorName = req.user?.fullName || logData.actorName || 'System';
  const actorRole = req.user?.role === 'doctor' ? 'Doctor' : req.user?.role === 'family' ? 'Family Member' : logData.actorRole || 'System';

  const log = db.createAuditLog({
    ...logData,
    actorName,
    actorRole
  });

  return res.status(201).json({ success: true, data: log });
});

export default router;
