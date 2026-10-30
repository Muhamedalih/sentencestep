/**
 * Turns a transcript pasted from YouTube ("Show transcript" under a video, or a .vtt / .srt file)
 * into sentences with start and end times, for the admin timing tool. Only the times of the cues
 * are known, so a sentence that sits inside a cue, or runs over two, gets its time spread over the
 * letters of the text: a good first guess that the admin then nudges while the video plays.
 */

export interface TranscriptCue {
  startSeconds: number;
  /** Null when the paste only has start times (the usual "Show transcript" copy). */
  endSeconds: number | null;
  text: string;
}

export interface DraftSentence {
  id: string;
  startSeconds: number;
  endSeconds: number;
  en: string;
}

const TIMESTAMP = /^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/;
const TIME_LINE = /^(?:\d+:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?$/;

/** "1:05", "0:03.5", "1:02:03" or "00:00:03,000" in seconds, or null when it is not a time. */
export function parseTimestamp(raw: string): number | null {
  const match = TIMESTAMP.exec(raw.trim());
  if (!match) return null;
  const hours = match[1] === undefined ? null : Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (seconds >= 60 || (hours !== null && minutes >= 60)) return null;
  const fraction = match[4] ? Number(match[4].padEnd(3, "0")) / 1000 : 0;
  return (hours ?? 0) * 3600 + minutes * 60 + seconds + fraction;
}

/** A cue's words: sound tags like [Music] and speaker marks removed, spaces collapsed. */
function cleanCueText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[♪♫]/g, " ")
    .replace(/^\s*>>\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCueFile(text: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n").map((line) => line.trim());
    const arrowAt = lines.findIndex((line) => line.includes("-->"));
    if (arrowAt < 0) continue;
    const [from, to] = (lines[arrowAt] ?? "")
      .split("-->")
      .map((part) => part.trim().split(/\s+/)[0] ?? "");
    const startSeconds = parseTimestamp(from ?? "");
    const endSeconds = parseTimestamp(to ?? "");
    if (startSeconds === null) continue;
    const cleaned = cleanCueText(lines.slice(arrowAt + 1).join(" "));
    if (cleaned) cues.push({ startSeconds, endSeconds, text: cleaned });
  }
  return cues;
}

function parseTimestampedLines(text: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  let current: { startSeconds: number; parts: string[] } | null = null;
  const close = () => {
    if (!current) return;
    const cleaned = cleanCueText(current.parts.join(" "));
    if (cleaned) cues.push({ startSeconds: current.startSeconds, endSeconds: null, text: cleaned });
    current = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (TIME_LINE.test(line)) {
      close();
      const startSeconds = parseTimestamp(line);
      if (startSeconds !== null) current = { startSeconds, parts: [] };
      continue;
    }
    const sameLine = /^((?:\d+:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s+(.+)$/.exec(line);
    if (sameLine) {
      close();
      const startSeconds = parseTimestamp(sameLine[1] ?? "");
      if (startSeconds !== null) current = { startSeconds, parts: [sameLine[2] ?? ""] };
      continue;
    }
    // A line of the transcript's own header ("Transcript", "Search in video"...) before the first time is not text.
    if (current) current.parts.push(line);
  }
  close();
  return cues;
}

/** Reads a pasted transcript: "0:03" on a line then the text, "0:03 text" on one line, or a .vtt / .srt file. */
export function parseTranscript(input: string): TranscriptCue[] {
  const text = input.replace(/\r\n?/g, "\n").trim();
  if (!text) return [];
  const cues = text.includes("-->") ? parseCueFile(text) : parseTimestampedLines(text);
  cues.sort((a, b) => a.startSeconds - b.startSeconds);
  return cues.map((cue, index) => ({
    ...cue,
    endSeconds: cue.endSeconds ?? cues[index + 1]?.startSeconds ?? null,
  }));
}

const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "st",
  "vs",
  "etc",
  "e.g",
  "i.e",
  "u.s",
]);
const CLOSERS = new Set(['"', "'", "”", "’", ")", "]"]);

export interface SentenceSpan {
  text: string;
  /** Offsets into the text that was split: start inclusive, end exclusive. */
  start: number;
  end: number;
}

/** Splits text into sentences at . ! ? followed by a space, leaving numbers (3.5) and abbreviations (Mr.) alone. */
export function splitSentences(text: string): SentenceSpan[] {
  const spans: SentenceSpan[] = [];
  let begin = 0;
  const push = (end: number) => {
    const slice = text.slice(begin, end);
    const trimmedStart = begin + (slice.length - slice.trimStart().length);
    const trimmed = slice.trim();
    if (trimmed)
      spans.push({ text: trimmed, start: trimmedStart, end: trimmedStart + trimmed.length });
    begin = end;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i] ?? "";
    if (char !== "." && char !== "!" && char !== "?") continue;
    let end = i + 1;
    while (end < text.length && (".!?".includes(text[end] ?? "") || CLOSERS.has(text[end] ?? "")))
      end++;
    const next = text[end];
    if (next !== undefined && !/\s/.test(next)) {
      i = end - 1;
      continue;
    }
    if (char === ".") {
      const before = text.slice(begin, i).split(/\s+/).pop()?.toLowerCase() ?? "";
      if (ABBREVIATIONS.has(before)) {
        i = end - 1;
        continue;
      }
    }
    push(end);
    i = end - 1;
  }
  push(text.length);
  return spans;
}

interface Anchor {
  /** Where the cue's text starts in the joined text. */
  from: number;
  to: number;
  start: number;
  end: number;
}

/** Roughly how long a person takes to say one letter: used only for the last cue, whose end is unknown. */
const SECONDS_PER_LETTER = 0.065;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Merges cues into sentences and gives each a start and an end. Only the part of the video between
 * clipStartSeconds and clipEndSeconds is kept. A sentence's time is spread over the letters of the
 * cue it sits in, so it is a guess to be nudged, not a measurement.
 */
export function cuesToSentences(
  cues: readonly TranscriptCue[],
  options: { clipStartSeconds: number; clipEndSeconds: number; idPrefix: string },
): DraftSentence[] {
  const { clipStartSeconds, clipEndSeconds, idPrefix } = options;
  const usable = cues.filter(
    (cue) => cue.startSeconds < clipEndSeconds && (cue.endSeconds ?? Infinity) > clipStartSeconds,
  );
  if (usable.length === 0) return [];

  let joined = "";
  const anchors: Anchor[] = usable.map((cue, index) => {
    if (joined) joined += " ";
    const from = joined.length;
    joined += cue.text;
    const known = cue.endSeconds ?? usable[index + 1]?.startSeconds ?? null;
    const end =
      known ?? Math.min(clipEndSeconds, cue.startSeconds + cue.text.length * SECONDS_PER_LETTER);
    return {
      from,
      to: joined.length,
      start: cue.startSeconds,
      end: Math.max(end, cue.startSeconds),
    };
  });

  const timeAt = (offset: number): number => {
    const anchor =
      anchors.find((candidate) => offset <= candidate.to) ?? anchors[anchors.length - 1];
    if (!anchor) return clipStartSeconds;
    const length = Math.max(1, anchor.to - anchor.from);
    const share = Math.min(1, Math.max(0, (offset - anchor.from) / length));
    return anchor.start + share * (anchor.end - anchor.start);
  };

  const drafts: DraftSentence[] = [];
  let previousEnd = clipStartSeconds;
  for (const span of splitSentences(joined)) {
    const start = Math.max(previousEnd, clipStartSeconds, round1(timeAt(span.start)));
    const end = Math.min(clipEndSeconds, round1(timeAt(span.end)));
    if (end <= start) continue;
    drafts.push({
      id: `${idPrefix}-s${drafts.length + 1}`,
      startSeconds: round1(start),
      endSeconds: round1(end),
      en: span.text,
    });
    previousEnd = end;
  }
  return drafts;
}
