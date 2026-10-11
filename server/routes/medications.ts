import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';
import { canUserAccessPatient } from '../ai/authz';

const router = Router();

// GET /api/medications?patientId=...
router.get('/', optionalToken, (req: AuthRequest, res: Response) => {
  const { patientId } = req.query as { patientId?: string };
  if (req.user && patientId && !canUserAccessPatient(req.user, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view medications for this patient' });
  }
  const medications = db.getMedications(patientId);
  return res.json({ success: true, count: medications.length, data: medications });
});

// POST /api/medications
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  try {
    const medData = req.body;
    if (!medData.name) {
      return res.status(400).json({ success: false, error: 'Medication name is required' });
    }

    const patientId = medData.patientId || (req.user?.role === 'patient' ? req.user.patientId : undefined);
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }

    if (req.user && !canUserAccessPatient(req.user, patientId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to manage medications for this patient' });
    }

    const medication = db.createMedication({ ...medData, patientId });

    db.createAuditLog({
      patientId: medication.patientId,
      actorName: req.user?.fullName || 'Physician',
      actorRole: req.user?.role === 'doctor' ? 'Doctor' : 'Family Member',
      action: 'Prescribed Medication',
      details: `${medication.name} (${medication.dose}, ${medication.frequency}) added to active regimen`
    });

    return res.status(201).json({ success: true, data: medication });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/medications/:id/dose
router.patch('/:id/dose', optionalToken, (req: AuthRequest, res: Response) => {
  const { timeIdx, newStatus, reason } = req.body;

  if (typeof timeIdx !== 'number' || !newStatus) {
    return res.status(400).json({ success: false, error: 'timeIdx and newStatus are required' });
  }

  const existing = db.getMedications().find(m => m.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Medication not found' });
  }

  if (req.user && !canUserAccessPatient(req.user, existing.patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to update dose for this patient' });
  }

  const actorName = req.user?.fullName || 'Caregiver';
  const updated = db.updateMedicationDose(req.params.id, timeIdx, newStatus, reason, actorName);

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Medication not found' });
  }

  return res.json({ success: true, data: updated });
});

export default router;
