import { VIDEO_KINDS } from "./types";
import type { VideoKind, VideoLesson, VideoLevel } from "./types";

/**
 * How the library of Video dictation is arranged: sections by kind, each with its videos in order. Plain
 * data and pure functions (no React, no Supabase), shared by the library page, the Admin's arrange mode,
 * the practice page's "next video" and the tests.
 */

/** One section of the library: a kind and its videos (their ids), in the order they are listed. */
export interface VideoSection {
  kind: VideoKind;
  ids: string[];
}

/** What an Admin saved: the sections in the order he chose, each with its videos in the order he chose. */
export interface VideoArrangement {
  sections: VideoSection[];
  /**
   * Videos an Admin deleted from the library: listed for nobody (not in a section, not as "next video", a
   * 404 for a learner who opens the link) and restorable from the arrange mode, because the video itself
   * stays in the code. Left out when nothing is deleted.
   */
  removed?: string[];
}

/**
 * The deleted videos travel inside the one stored list of sections, as one more entry under this name
 * (`{ kind: "removed", ids }`), so deleting needs no new column. encodeStored puts it there, decodeStored
 * takes it out again before the usual checks.
 */
export const REMOVED_ENTRY = "removed";

/** What goes into the `sections` column: the sections, plus the entry of the deleted videos when there are any. */
export function encodeStored(arrangement: VideoArrangement): unknown[] {
  const removed = arrangement.removed ?? [];
  return removed.length > 0
    ? [...arrangement.sections, { kind: REMOVED_ENTRY, ids: removed }]
    : [...arrangement.sections];
}

/** The inverse of encodeStored, for what the column holds: the input sanitizeArrangement expects. A value that is not a list is passed on as it is, so the check refuses it. */
export function decodeStored(stored: unknown): unknown {
  if (!Array.isArray(stored)) return { sections: stored };
  const isRemoved = (entry: unknown): boolean =>
    typeof entry === "object" &&
    entry !== null &&
    (entry as { kind?: unknown }).kind === REMOVED_ENTRY;
  const entry = stored.find(isRemoved) as { ids?: unknown } | undefined;
  return { sections: stored.filter((candidate) => !isRemoved(candidate)), removed: entry?.ids };
}

/** The most ids one saved section can hold: far more than there will ever be, a guard against a hostile request. */
const MAX_IDS_PER_SECTION = 1000;

const LEVEL_RANK: Record<VideoLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3 };

export function isVideoKind(value: unknown): value is VideoKind {
  return typeof value === "string" && (VIDEO_KINDS as readonly string[]).includes(value);
}

/** The section a video is listed under when nothing is saved for it: its entry in `kinds`, else "other". */
export function defaultKind(id: string, kinds: Readonly<Record<string, VideoKind>>): VideoKind {
  return kinds[id] ?? "other";
}

function clipLength(lesson: VideoLesson): number {
  return lesson.clipEndSeconds - lesson.clipStartSeconds;
}

/**
 * The sections of the library for the videos a viewer may open. With nothing saved: every kind in the
 * default order (comedy first), the easiest video first inside each (level, then length). With an
 * arrangement saved: its sections and its videos in the order saved; a video it does not mention (a new
 * one) goes to the end of its own section, in the same easiest-first order; a saved id this viewer cannot
 * open (an Admin-only trial video, for a learner) is skipped. Every kind is returned, empty ones too: the
 * library page hides them, the Admin's arrange mode shows them as places to drop a video. A video the
 * arrangement lists as removed is in no section at all.
 */
export function arrangeLessons(
  lessons: readonly VideoLesson[],
  kinds: Readonly<Record<string, VideoKind>>,
  saved: VideoArrangement | null,
): VideoSection[] {
  const known = new Set(lessons.map((lesson) => lesson.id));
  const removed = new Set(saved?.removed ?? []);
  const order: VideoKind[] = [];
  const lists = new Map<VideoKind, string[]>();
  const placed = new Set<string>();
  const open = (kind: VideoKind): string[] => {
    let list = lists.get(kind);
    if (!list) {
      list = [];
      lists.set(kind, list);
      order.push(kind);
    }
    return list;
  };

  for (const section of saved?.sections ?? []) {
    if (!isVideoKind(section.kind)) continue;
    const list = open(section.kind);
    for (const id of section.ids) {
      if (!known.has(id) || placed.has(id) || removed.has(id)) continue;
      placed.add(id);
      list.push(id);
    }
  }
  // A kind the saved arrangement does not mention follows in the default order.
  for (const kind of VIDEO_KINDS) open(kind);

  // Whatever nobody placed (every video when nothing is saved, a new one afterwards): easiest first.
  const rest = lessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => !placed.has(lesson.id) && !removed.has(lesson.id))
    .sort(
      (a, b) =>
        LEVEL_RANK[a.lesson.level] - LEVEL_RANK[b.lesson.level] ||
        clipLength(a.lesson) - clipLength(b.lesson) ||
        a.index - b.index,
    );
  for (const { lesson } of rest) open(defaultKind(lesson.id, kinds)).push(lesson.id);

  return order.map((kind) => ({ kind, ids: lists.get(kind) ?? [] }));
}

/** Every video id in the order the library lists them, section after section: what "next video" follows. */
export function flattenSections(sections: readonly VideoSection[]): string[] {
  return sections.flatMap((section) => section.ids);
}

/**
 * Checks what an Admin's browser sends (or what the database returned) and cleans it: the sections must
 * be an array of at most one entry per kind, each with a known kind and a list of ids; an id that is not a
 * known video (one removed since) or is listed twice is dropped, the first place wins. Returns null when
 * the shape itself is wrong, so nothing half-right is ever saved. The optional `removed` list (the deleted
 * videos) is cleaned the same way, and a video in it is taken out of every section.
 */
export function sanitizeArrangement(
  input: unknown,
  knownIds: ReadonlySet<string>,
): VideoArrangement | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = (input as { sections?: unknown }).sections;
  if (!Array.isArray(raw) || raw.length > VIDEO_KINDS.length) return null;

  const removedInput = (input as { removed?: unknown }).removed;
  const removed: string[] = [];
  if (removedInput !== undefined && removedInput !== null) {
    if (!Array.isArray(removedInput) || removedInput.length > MAX_IDS_PER_SECTION) return null;
    for (const id of removedInput) {
      if (typeof id !== "string") return null;
      if (knownIds.has(id) && !removed.includes(id)) removed.push(id);
    }
  }

  const sections: VideoSection[] = [];
  const seenKinds = new Set<VideoKind>();
  const seenIds = new Set<string>(removed);
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;
    const { kind, ids } = entry as { kind?: unknown; ids?: unknown };
    if (!isVideoKind(kind) || seenKinds.has(kind)) return null;
    if (!Array.isArray(ids) || ids.length > MAX_IDS_PER_SECTION) return null;
    seenKinds.add(kind);
    const clean: string[] = [];
    for (const id of ids) {
      if (typeof id !== "string") return null;
      if (!knownIds.has(id) || seenIds.has(id)) continue;
      seenIds.add(id);
      clean.push(id);
    }
    sections.push({ kind, ids: clean });
  }
  return removed.length > 0 ? { sections, removed } : { sections };
}

function copySections(sections: readonly VideoSection[]): VideoSection[] {
  return sections.map((section) => ({ kind: section.kind, ids: [...section.ids] }));
}

/**
 * Moves one video to a place in the section `kind`, every other video staying where it was: `index` is
 * its position among the OTHER videos of that section (the end when left out). Returns a new list; an
 * unknown kind leaves the list as it was.
 */
export function moveVideo(
  sections: readonly VideoSection[],
  id: string,
  kind: VideoKind,
  index?: number,
): VideoSection[] {
  const next = copySections(sections);
  const target = next.find((section) => section.kind === kind);
  if (!target) return next;
  for (const section of next) section.ids = section.ids.filter((candidate) => candidate !== id);
  const at =
    index === undefined ? target.ids.length : Math.max(0, Math.min(index, target.ids.length));
  target.ids.splice(at, 0, id);
  return next;
}

/** One step up (-1) or down (+1) for a video inside its own section; unchanged when it is already at that end. */
export function shiftVideo(
  sections: readonly VideoSection[],
  id: string,
  delta: -1 | 1,
): VideoSection[] {
  const next = copySections(sections);
  for (const section of next) {
    const at = section.ids.indexOf(id);
    const to = at + delta;
    if (at < 0 || to < 0 || to >= section.ids.length) continue;
    const moved = section.ids[at] as string;
    section.ids[at] = section.ids[to] as string;
    section.ids[to] = moved;
  }
  return next;
}

/** One step up (-1) or down (+1) for a whole section; unchanged when it is already at that end. */
export function shiftSection(
  sections: readonly VideoSection[],
  kind: VideoKind,
  delta: -1 | 1,
): VideoSection[] {
  const next = copySections(sections);
  const at = next.findIndex((section) => section.kind === kind);
  const to = at + delta;
  if (at < 0 || to < 0 || to >= next.length) return next;
  const moved = next[at] as VideoSection;
  next[at] = next[to] as VideoSection;
  next[to] = moved;
  return next;
}

/** Every section without this video: where a deleted video leaves. */
export function withoutVideo(sections: readonly VideoSection[], id: string): VideoSection[] {
  return sections.map((section) => ({
    kind: section.kind,
    ids: section.ids.filter((candidate) => candidate !== id),
  }));
}

/** The section a restored video goes back to: the one the default arrangement lists it under. */
export function homeKind(defaults: readonly VideoSection[], id: string): VideoKind {
  return defaults.find((section) => section.ids.includes(id))?.kind ?? "other";
}

/** Whether two lists of ids hold the same videos, whatever their order. */
export function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}

/** Whether two lists of sections are the same arrangement (same kinds, same videos, same order). */
export function sameSections(a: readonly VideoSection[], b: readonly VideoSection[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
