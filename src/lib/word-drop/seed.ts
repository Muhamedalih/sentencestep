/**
 * Word Drop rounds that two people can play identically: the daily challenge (everyone at a level
 * gets the same words in the same order that day) and a friend's challenge (a link that deals the words
 * of the round the friend just played). A seed names the round; the same seed always deals the same
 * words, in the same order and at the same places. Pure and client-safe.
 */

export type SeedKind = "daily" | "friend";
/** The two modes a seeded round can be played in: Hard needs a clip for every word, which is not the same set for everyone. */
export type SeededMode = "easy" | "mid";

export interface RoundSeed {
  /** The seed exactly as it travels in a link. */
  raw: string;
  kind: SeedKind;
  /** The UTC day ("YYYY-MM-DD") of a daily round, or the friend's token. */
  key: string;
  level: 1 | 2 | 3;
  mode: SeededMode;
}

const SEED_PATTERN = /^(d|c)\.([a-z0-9-]{3,24})\.([123])\.([em])$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The UTC calendar day of a moment, "YYYY-MM-DD": the day the daily challenge is dealt for, the same everywhere. */
export function utcDay(moment: Date = new Date()): string {
  return moment.toISOString().slice(0, 10);
}

/** The daily challenge's seed: Medium (the meaning shown, the English word typed), at the learner's own level. */
export function dailySeed(day: string, level: 1 | 2 | 3): string {
  return `d.${day}.${level}.m`;
}

export function friendSeed(token: string, level: 1 | 2 | 3, mode: SeededMode): string {
  return `c.${token}.${level}.${mode === "easy" ? "e" : "m"}`;
}

/** A short random token for a friend's challenge. */
export function newToken(random: () => number = Math.random): string {
  let token = "";
  while (token.length < 8) token += Math.floor(random() * 36).toString(36);
  return token;
}

/** Turns whatever arrived in a link into a seed, or null. */
export function parseSeed(raw: unknown): RoundSeed | null {
  if (typeof raw !== "string") return null;
  const match = SEED_PATTERN.exec(raw);
  if (!match) return null;
  const key = match[2]!;
  const kind: SeedKind = match[1] === "d" ? "daily" : "friend";
  if (kind === "daily" && !DAY_PATTERN.test(key)) return null;
  return {
    raw,
    kind,
    key,
    level: Number(match[3]) as 1 | 2 | 3,
    mode: match[4] === "e" ? "easy" : "mid",
  };
}

/** A 32-bit hash of a text (FNV-1a). */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A repeatable random number generator (mulberry32): the same seed gives the same numbers, in [0, 1). */
export function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
