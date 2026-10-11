import { timingSafeEqual } from 'crypto';
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { canUserAccessPatient } from '../ai/authz';
import { getAIConfig } from '../ai/config';
import { getIndexer } from '../ai/indexer';
import { AIServiceError, createOverviewDeps, generatePatientOverview } from '../ai/overview';
import type { AIError, AIErrorCode, AIOverviewResponse } from '../ai/types';

const router = Router();

const STATUS_FOR: Record<AIErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  bad_request: 400,
  ai_not_configured: 503,
  rate_limited: 429,
  ai_unavailable: 503,
  invalid_ai_output: 502,
};

const fail = (res: Response, code: AIErrorCode, error: string) => {
  const body: AIError = { success: false, code, error };
  return res.status(STATUS_FOR[code]).json(body);
};

// Simple per-user limiter: model calls cost money and are slow, so cap bursts.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const recentCalls = new Map<string, number[]>();
function overRateLimit(userId: string): boolean {
  const now = Date.now();
  const calls = (recentCalls.get(userId) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (calls.length >= RATE_MAX) {
    recentCalls.set(userId, calls);
    return true;
  }
  calls.push(now);
  recentCalls.set(userId, calls);
  return false;
}

/**
 * POST /api/ai/patient-overview   { patientId }
 *
 * Doctor-only. The patient ID in the body is only a request: it is checked against the
 * authenticated user (resolved server-side from the token) before anything is retrieved.
 */
router.post('/patient-overview', authenticateToken, requireRole('doctor'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const patientId = typeof req.body?.patientId === 'string' ? req.body.patientId.trim() : '';
  if (!patientId) return fail(res, 'bad_request', 'patientId is required');

  // Same response for "no such patient" and "not yours", so patient IDs cannot be probed.
  if (!canUserAccessPatient(user, patientId)) return fail(res, 'forbidden', 'You are not authorized to view this patient.');

  if (overRateLimit(user.id)) return fail(res, 'rate_limited', 'Too many AI overview requests. Please wait a moment.');

  try {
    const data = await generatePatientOverview(createOverviewDeps(), patientId);
    db.createAuditLog({
      patientId,
      actorName: user.fullName,
      actorRole: 'Doctor',
      action: 'Generated AI patient overview',
      details: `AI summary of ${data.meta.recordsConsidered} recorded entries (${data.meta.retrieval} retrieval)`,
    });
    const body: AIOverviewResponse = { success: true, data };
    return res.json(body);
  } catch (err) {
    if (err instanceof AIServiceError) return fail(res, err.code, err.message);
    console.error('[AI] Unexpected overview failure:', err instanceof Error ? err.message : 'unknown');
    return fail(res, 'ai_unavailable', 'AI overview is temporarily unavailable.');
  }
});

const tokensMatch = (given: string, expected: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * POST /api/ai/reindex   { patientId?, retryFailed?, reset? }
 *
 * Operator-only (not for any CareChain user role): requires the AI_ADMIN_TOKEN secret in the
 * `x-admin-token` header, and is disabled entirely when that variable is not set.
 * Rebuilds the ChromaDB index from the authoritative store; safe to run repeatedly.
 */
router.post('/reindex', async (req: Request, res: Response) => {
  const expected = getAIConfig().adminToken;
  if (!expected) return res.status(404).json({ success: false, error: 'Endpoint not found' });
  const given = req.header('x-admin-token') ?? '';
  if (!given || !tokensMatch(given, expected)) return res.status(403).json({ success: false, error: 'Forbidden' });

  const indexer = getIndexer();
  if (!indexer) return fail(res, 'ai_not_configured', 'AI indexing is not configured.');

  try {
    const { patientId, retryFailed, reset } = (req.body ?? {}) as { patientId?: string; retryFailed?: boolean; reset?: boolean };
    if (retryFailed) return res.json({ success: true, data: await indexer.retryFailed() });
    const report = patientId ? await indexer.reindexPatient(patientId) : await indexer.reindexAll({ reset: Boolean(reset) });
    return res.json({ success: true, data: report });
  } catch (err) {
    console.error('[AI] Reindex failed:', err instanceof Error ? err.message : 'unknown');
    return fail(res, 'ai_unavailable', 'Reindex failed. See server logs.');
  }
});

export default router;
