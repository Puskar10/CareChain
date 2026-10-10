import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Demo accounts for fast 1-click testing & evaluation
const DEMO_ACCOUNTS = [
  {
    email: 'doctor@carechain.health',
    password: 'doctor123',
    role: 'doctor',
    name: 'Dr. Aarav Sharma, MD',
    title: 'Senior Attending Physician',
    description: 'Full clinical access: Verify events, review diagnostic reports, explainable AI reasoning'
  },
  {
    email: 'caregiver@carechain.health',
    password: 'caregiver123',
    role: 'family',
    name: 'Pooja Sharma',
    title: 'Primary Family Caregiver',
    description: 'Family delegation: Log vitals, manage medications, generate emergency transfer link'
  },
  {
    email: 'patient@carechain.health',
    password: 'patient123',
    role: 'patient',
    name: 'Rahul Sharma',
    title: 'Patient (Self Access)',
    description: 'Patient portal: Log subjective symptoms, review medication schedule, view personal timeline'
  },
  {
    email: 'paramedic@carechain.health',
    password: 'ems123',
    role: 'ems',
    name: 'Capt. Dave Miller',
    title: 'EMS Critical Care Paramedic',
    description: 'Emergency response: Instant triage telemetry, quick vitals upload in transit'
  }
];

// GET /api/auth/demo-accounts
router.get('/demo-accounts', (_req, res: Response) => {
  res.json({
    success: true,
    accounts: DEMO_ACCOUNTS
  });
});

// POST /api/auth/register
router.post('/register', (req, res: Response) => {
  try {
    const { email, password, fullName, role, phone, title, patientId } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, fullName, role'
      });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const user = db.createUser({
      email,
      password,
      fullName,
      role: role || 'patient',
      phone,
      title,
      patientId
    });

    const token = generateToken(user);

    // Auto-record audit log
    db.createAuditLog({
      actorName: user.fullName,
      actorRole: user.role === 'doctor' ? 'Doctor' : user.role === 'family' ? 'Family Member' : 'Patient',
      action: 'Account Registered',
      details: `New account created with role ${user.role}`
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(safeUser);

    db.createAuditLog({
      actorName: safeUser.fullName,
      actorRole: safeUser.role === 'doctor' ? 'Doctor' : safeUser.role === 'family' ? 'Family Member' : 'Patient',
      action: 'User Logged In',
      details: `Session initiated from CareChain Web Client`
    });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: safeUser
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user) {
    db.createAuditLog({
      actorName: req.user.fullName,
      actorRole: req.user.role === 'doctor' ? 'Doctor' : req.user.role === 'family' ? 'Family Member' : 'Patient',
      action: 'User Logged Out',
      details: 'Session terminated'
    });
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
