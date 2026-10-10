import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/share
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  const { patientId, scope = '72h', expiryHours = 24 } = req.body;

  if (!patientId) {
    return res.status(400).json({ success: false, error: 'patientId is required' });
  }

  const share = db.createShare(patientId, scope, Number(expiryHours));

  db.createAuditLog({
    patientId,
    actorName: req.user?.fullName || 'Caregiver',
    actorRole: req.user?.role === 'doctor' ? 'Doctor' : 'Family Member',
    action: 'Generated Emergency Handover Link',
    details: `Scope: ${scope}, Token expires in ${expiryHours}h: ${share.shareToken}`
  });

  return res.status(201).json({
    success: true,
    data: {
      ...share,
      shareUrl: `/share/${share.shareToken}`
    }
  });
});

// GET /api/share/:token
router.get('/:token', (req: Request, res: Response) => {
  const share = db.getShare(req.params.token);
  if (!share) {
    return res.status(404).json({ success: false, error: 'Share link not found or expired' });
  }

  if (new Date(share.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ success: false, error: 'This emergency share link has expired' });
  }

  const patient = db.getPatientById(share.patientId);
  const events = db.getEvents({ patientId: share.patientId });
  const vitals = db.getVitals(share.patientId);
  const meds = db.getMedications(share.patientId);

  db.createAuditLog({
    patientId: share.patientId,
    actorName: 'Emergency Provider',
    actorRole: 'Emergency EMS',
    action: 'Accessed Emergency Share Link',
    details: `Token access count: ${share.accessCount}`
  });

  return res.json({
    success: true,
    data: {
      share,
      patient,
      events,
      vitals,
      medications: meds
    }
  });
});

export default router;
