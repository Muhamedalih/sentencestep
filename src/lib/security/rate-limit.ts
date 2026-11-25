/**
 * A small in-memory limiter for the public actions a bot can hammer for free (a rating, a
 * password-reset e-mail, a push subscription). It costs the database nothing: the counters live in
 * the memory of the one running server process, so a restart or a deploy resets them, and the two
 * app copies (blue/green) never run side by side serving traffic. That is deliberate. It is a speed
 * bump for one source, not an accounting system, and every limit is set far above what a real
 * learner does (many learners share one address on a mobile network, so a per-address limit must be
 * generous).
 *
 * Fixed window per key. The map is swept when it grows, so a flood of one-off keys cannot grow
 * memory without bound.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Past this many live keys the next call sweeps the expired ones (and, if still huge, drops the oldest). */
const SWEEP_AT = 5_000;
const HARD_CAP = 50_000;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size > HARD_CAP) {
    // Still too many live keys (a flood): forget the oldest windows first.
    const excess = buckets.size - HARD_CAP;
    let dropped = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++dropped >= excess) break;
    }
  }
}

/**
 * True when this call is allowed (and counts it); false once `limit` calls were already made for
 * `key` in the current `windowMs`. `key` should name the action and the source together, for example
 * `rating:ip:1.2.3.4`.
 */
export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  if (buckets.size >= SWEEP_AT) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** For tests only: forgets every counter. */
export function resetRateLimits(): void {
  buckets.clear();
}
