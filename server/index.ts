import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import eventRoutes from './routes/events';
import medicationRoutes from './routes/medications';
import vitalRoutes from './routes/vitals';
import reportRoutes from './routes/reports';
import handoverRoutes from './routes/handover';
import auditRoutes from './routes/audit';
import shareRoutes from './routes/shares';
import { db } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logging in development
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[API ${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health & System status check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CareChain Clinical Intelligence API',
    version: '1.0.0',
    records: {
      users: db.getUsers().length,
      patients: db.getPatients().length,
      events: db.getEvents().length,
      medications: db.getMedications().length,
      vitals: db.getVitals().length,
      reports: db.getReports().length
    }
  });
});

// Reset database endpoint (for demo / testing purposes)
app.post('/api/reset', (_req, res) => {
  db.resetDefaults();
  res.json({ success: true, message: 'Database reset to default clinical dataset' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/share', shareRoutes);

// 404 Fallback for API
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CareChain Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔐 Auth Endpoints: /api/auth/login, /api/auth/register, /api/auth/demo-accounts`);
  console.log(`🏥 Health Status: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
