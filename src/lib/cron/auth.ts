import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison so a bearer-token guess can't be narrowed down
 * via response-timing differences. timingSafeEqual throws on mismatched
 * buffer lengths, so that case is checked upfront and short-circuited —
 * an outright length mismatch doesn't leak anything a timing attack could
 * use to recover the secret byte-by-byte. Pure and dependency-free (no
 * Next.js Request/Response types) so it's safely unit-testable without a
 * running server — see src/app/api/cron/inactive-learners/route.ts, the
 * only caller.
 */
export function isValidCronAuth(authHeader: string, cronSecret: string): boolean {
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(authHeader);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
