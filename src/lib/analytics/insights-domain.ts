// Pure arithmetic for the insights layer — no I/O, so it's directly
// unit-testable (see insights-domain.test.ts) without a database. insights.ts
// is the thin wrapper that fetches analytics_events rows and hands the
// numbers here.

export function computeCompletionRate(started: number, completed: number): number {
  if (started <= 0) return 0;
  return Math.min(completed / started, 1);
}

export function computeAbandonmentRate(started: number, completed: number): number {
  return 1 - computeCompletionRate(started, completed);
}

export function computeAverageDurationSeconds(durationsSeconds: number[]): number | null {
  if (durationsSeconds.length === 0) return null;
  const total = durationsSeconds.reduce((sum, value) => sum + value, 0);
  return Math.round(total / durationsSeconds.length);
}

/**
 * Pairs each completion timestamp with the most recent start timestamp
 * before it (same user+lesson, already filtered by the caller) and returns
 * the elapsed seconds for each pair — the basis for "average lesson
 * duration" without ever having modified the typing engine to track time
 * itself. A completion with no prior start (shouldn't normally happen) is
 * simply skipped rather than guessed at.
 */
export function pairDurationsSeconds(startedAtMs: number[], completedAtMs: number[]): number[] {
  const sortedStarts = [...startedAtMs].sort((a, b) => a - b);
  const durations: number[] = [];

  for (const completedAt of completedAtMs) {
    let matchedStart: number | null = null;
    for (const startedAt of sortedStarts) {
      if (startedAt <= completedAt) {
        matchedStart = startedAt;
      } else {
        break;
      }
    }
    if (matchedStart !== null) {
      durations.push((completedAt - matchedStart) / 1000);
    }
  }

  return durations;
}
