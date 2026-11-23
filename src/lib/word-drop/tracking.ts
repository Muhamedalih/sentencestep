/**
 * What Word Drop reports to the analytics, and the checks that decide whether a report is believed.
 * The game sends three kinds: a round started, a round finished, a round's picture or challenge link
 * shared. Counts and names of choices only: no word, no typed text, no friend's name or token.
 * The report arrives from the browser (a Server Action is reachable as a direct POST), so every value
 * is checked against what the game can produce and anything else is dropped.
 */

import type { AnalyticsEvent } from "@/lib/analytics/events";

import { MAX_ROUND_WORDS, WORD_DROP_MODES, type WordDropMode } from "./engine";
import { MAX_POINTS_PER_WORD } from "./scores";

/** Which kind of round: a free round, the daily challenge, or a friend's challenge link. */
export const ROUND_KINDS = ["free", "daily", "friend"] as const;
export type RoundKind = (typeof ROUND_KINDS)[number];

export type WordDropReport =
  | { event: "started"; mode: WordDropMode; kind: RoundKind; level: 1 | 2 | 3 }
  | {
      event: "finished";
      mode: WordDropMode;
      kind: RoundKind;
      level: 1 | 2 | 3;
      score: number;
      accuracy: number;
      words: number;
    }
  | { event: "shared"; how: "card" | "link"; kind: RoundKind };

function whole(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

function pickMode(value: unknown): WordDropMode | null {
  return typeof value === "string" && (WORD_DROP_MODES as readonly string[]).includes(value)
    ? (value as WordDropMode)
    : null;
}

function pickKind(value: unknown): RoundKind | null {
  return typeof value === "string" && (ROUND_KINDS as readonly string[]).includes(value)
    ? (value as RoundKind)
    : null;
}

/** A report as the game sends it, or null when it is not one the game could have sent. */
export function parseWordDropReport(input: unknown): { event: AnalyticsEvent } | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const kind = pickKind(raw.kind);
  if (kind === null) return null;
  if (raw.event === "shared") {
    if (raw.how !== "card" && raw.how !== "link") return null;
    return {
      event: {
        name: "WORD_DROP_SHARED",
        category: "ENGAGEMENT",
        properties: { how: raw.how, kind },
      },
    };
  }
  const mode = pickMode(raw.mode);
  const level = whole(raw.level, 1, 3) as 1 | 2 | 3 | null;
  if (mode === null || level === null) return null;
  if (raw.event === "started") {
    return {
      event: {
        name: "WORD_DROP_STARTED",
        category: "ENGAGEMENT",
        properties: { mode, kind, level },
      },
    };
  }
  if (raw.event === "finished") {
    const words = whole(raw.words, 0, MAX_ROUND_WORDS);
    const accuracy = whole(raw.accuracy, 0, 100);
    const score = whole(raw.score, 0, MAX_ROUND_WORDS * MAX_POINTS_PER_WORD * 3);
    if (words === null || accuracy === null || score === null) return null;
    return {
      event: {
        name: "WORD_DROP_FINISHED",
        category: "ENGAGEMENT",
        properties: { mode, kind, level, score, accuracy, words },
      },
    };
  }
  return null;
}
