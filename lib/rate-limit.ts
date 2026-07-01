// Best-effort in-memory sliding-window rate limiter. Adequate for a single
// instance / low volume; for production scale, back this with Upstash Redis or
// Vercel KV (see GO-LIVE.md). Supabase Auth already rate-limits sign-in itself.

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
