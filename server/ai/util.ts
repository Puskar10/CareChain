/** Rejects if `promise` does not settle within `ms`. Used for calls whose SDK has no per-request timeout. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Short, secret-free description of an error for logs and the retry queue. */
export function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message
    .replace(/\s+/g, ' ')
    // Provider errors can echo credentials; never let them reach logs or the retry queue.
    .replace(/AIza[\w-]{10,}/g, '[redacted-key]')
    .replace(/\b(key|token|api[_-]?key|authorization)(=|:)\s*\S+/gi, '$1$2[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .slice(0, 200);
}
