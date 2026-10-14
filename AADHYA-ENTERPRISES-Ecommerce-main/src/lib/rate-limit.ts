// ==============================================================================
// IN-MEMORY RATE LIMITER — SHOLKVEDA
// Fixed-window throttle for authentication and other abuse-prone endpoints.
//
// NOTE: this store lives in the memory of a single server process. On a
// multi-instance or serverless deployment each instance keeps its own counters,
// so this raises the cost of brute-force attacks but does not replace a shared
// store (Redis/Upstash) or the platform's own WAF/rate limiting.
// ==============================================================================

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  sholkVedaRateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets: Map<string, RateLimitBucket> =
  globalForRateLimit.sholkVedaRateLimitBuckets ?? (globalForRateLimit.sholkVedaRateLimitBuckets = new Map());

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Consume one unit from the bucket identified by `key`.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  };
}

/** Clear a bucket, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client identifier for a request. Prefers the proxy-supplied
 * address because serverless platforms do not expose a socket address.
 */
export function requestClientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip')?.trim() || 'unknown-ip';
  return ip;
}
