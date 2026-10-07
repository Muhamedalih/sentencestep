/**
 * Keeps the payment system's own alerts from flooding the admins when the same
 * thing keeps happening (a webhook retried five times, a provider outage that
 * fails every order for an hour). In memory, per server instance, so it is a
 * best-effort brake rather than a guarantee; the alerts it holds back are
 * still written to the server log and to Sentry.
 */

const DEFAULT_REPEAT_WINDOW_MS = 30 * 60_000;
const DEFAULT_CAP_WINDOW_MS = 10 * 60_000;
const DEFAULT_CAP = 10;
const MAX_REMEMBERED_KEYS = 500;

export interface AlertThrottle {
  /** True when this alert should go out now; records it as sent when it does. */
  shouldSend(key: string, now: number): boolean;
}

export function createAlertThrottle(
  options: { repeatWindowMs?: number; capWindowMs?: number; cap?: number } = {},
): AlertThrottle {
  const repeatWindowMs = options.repeatWindowMs ?? DEFAULT_REPEAT_WINDOW_MS;
  const capWindowMs = options.capWindowMs ?? DEFAULT_CAP_WINDOW_MS;
  const cap = options.cap ?? DEFAULT_CAP;

  const lastSentByKey = new Map<string, number>();
  let recent: number[] = [];

  return {
    shouldSend(key, now) {
      const last = lastSentByKey.get(key);
      if (last !== undefined && now - last < repeatWindowMs) return false;

      recent = recent.filter((time) => now - time < capWindowMs);
      if (recent.length >= cap) return false;

      if (lastSentByKey.size >= MAX_REMEMBERED_KEYS) {
        for (const [oldKey, time] of lastSentByKey) {
          if (now - time >= repeatWindowMs) lastSentByKey.delete(oldKey);
        }
        if (lastSentByKey.size >= MAX_REMEMBERED_KEYS) lastSentByKey.clear();
      }

      lastSentByKey.set(key, now);
      recent.push(now);
      return true;
    },
  };
}
