import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/patients
router.get('/', (_req: Request, res: Response) => {
  const patients = db.getPatients();
  res.json({ success: true, count: patients.length, data: patients });
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
