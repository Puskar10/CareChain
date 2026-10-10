import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports?patientId=...
router.get('/', (req: Request, res: Response) => {
  const { patientId } = req.query as { patientId?: string };
  const reports = db.getReports(patientId);
  return res.json({ success: true, count: reports.length, data: reports });
});

// POST /api/reports
router.post('/', optionalToken, (req: AuthRequest, res: Response) => {
  try {
    const reportData = req.body;
    if (!reportData.title) {
      return res.status(400).json({ success: false, error: 'Report title is required' });
    }

    const actorName = req.user?.fullName || 'Diagnostic Lab / Clinician';
    const report = db.createReport(reportData, actorName);

    db.createAuditLog({
      patientId: report.patientId,
      actorName,
      actorRole: req.user?.role === 'doctor' ? 'Doctor' : 'Family Member',
      action: 'Uploaded Diagnostic Report',
      details: `${report.title} (${report.reportType}) ingested with AI biomarker extraction`
    });

    return res.status(201).json({ success: true, data: report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
