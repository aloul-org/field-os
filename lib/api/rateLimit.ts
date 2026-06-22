/**
 * Minimal in-memory fixed-window rate limiter for public endpoints (widget,
 * inbound webhooks). Best-effort only: serverless instances don't share memory,
 * so this throttles per-instance bursts rather than guaranteeing a global limit.
 * For hard limits, move to Upstash/Redis — noted as a deliberate v1 simplification.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// Opportunistic cleanup so the map doesn't grow unbounded on long-lived instances.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    buckets.forEach((bucket, key) => {
      if (now > bucket.resetAt) buckets.delete(key);
    });
  }, 5 * 60_000);
  // Don't keep the process alive just for cleanup.
  if (typeof timer.unref === "function") timer.unref();
}
