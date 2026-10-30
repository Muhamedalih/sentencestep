"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  cuesToSentences,
  parseTranscript,
  splitSentences,
} from "@/lib/video-dictation/transcript-import";
import type { VideoLesson, VideoLevel } from "@/lib/video-dictation/types";
import { MAX_COMFORTABLE_WORDS, splitWords } from "@/lib/video-dictation/words";

import { useYouTubePlayer } from "./use-youtube-player";

interface Row {
  en: string;
  start: number | null;
  end: number | null;
}

const LEVELS: VideoLevel[] = ["A1", "A2", "B1", "B2"];
const FIELD = "border-border bg-background h-9 rounded-lg border px-2 text-sm";

function parseYouTubeId(text: string): string | null {
  const value = text.trim();
  const match = /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/.exec(value);
  if (match) return match[1] ?? null;
  return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const seconds = (value: number | null) => (value === null ? "—" : value.toFixed(1));
const slugOf = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "video";

/**
 * Admin tool for preparing a video: paste its link, set the part to use (the clip), paste the
 * transcript (YouTube's "Show transcript" copy, or a .vtt / .srt) or type the sentences, then play the
 * video and press Space at the end of every sentence. The result is a JSON block the team turns into
 * a prepared video (with the Arabic and the word meanings). Nothing is saved on the server: the draft
 * lives in this browser until the JSON is copied.
 */
export function VideoTimingTool({
  initial,
  lessons,
}: {
  initial: VideoLesson | null;
  lessons: { id: string; title: string }[];
}) {
  const [url, setUrl] = useState(initial?.youtubeId ?? "");
  const [youtubeId, setYoutubeId] = useState<string | null>(initial?.youtubeId ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "");
  const [level, setLevel] = useState<VideoLevel>(initial?.level ?? "A2");
  const [clipStart, setClipStart] = useState(String(initial?.clipStartSeconds ?? 0));
  const [clipEnd, setClipEnd] = useState(initial ? String(initial.clipEndSeconds) : "");
  const [loadedStart, setLoadedStart] = useState(initial?.clipStartSeconds ?? 0);
  const [transcript, setTranscript] = useState("");
  const [rows, setRows] = useState<Row[]>(
    initial?.sentences.map((s) => ({ en: s.en, start: s.startSeconds, end: s.endSeconds })) ?? [],
  );
  const [selected, setSelected] = useState(0);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(initial?.durationSeconds ?? 0);
  const [copied, setCopied] = useState(false);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const undoRef = useRef<Row[][]>([]);
  const cutTimerRef = useRef<number | null>(null);

  const { hostRef, failure, controls } = useYouTubePlayer({
    youtubeId,
    startSeconds: loadedStart,
    onState: () => {},
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(controls.getTime());
      const length = controls.getDuration();
      if (length > 0) setDuration(round1(length));
    }, 200);
    return () => window.clearInterval(timer);
  }, [controls]);

  const commit = useCallback((next: Row[]) => {
    undoRef.current.push(rowsRef.current);
    if (undoRef.current.length > 50) undoRef.current.shift();
    setRows(next);
  }, []);

  const mark = useCallback(() => {
    const at = round1(controls.getTime());
    const index = selectedRef.current;
    const next = rowsRef.current.map((row) => ({ ...row }));
    const row = next[index];
    if (!row) return;
    row.end = at;
    if (row.start === null)
      row.start = index === 0 ? round1(Number(clipStart) || 0) : (next[index - 1]?.end ?? at);
    const following = next[index + 1];
    if (following) following.start = at;
    commit(next);
    setSelected(Math.min(index + 1, next.length - 1));
  }, [clipStart, commit, controls]);

  const nudge = useCallback(
    (delta: number) => {
      const index = selectedRef.current;
      const next = rowsRef.current.map((row) => ({ ...row }));
      const row = next[index];
      if (!row || row.end === null) return;
      row.end = round1(row.end + delta);
      const following = next[index + 1];
      if (following) following.start = row.end;
      commit(next);
    },
    [commit],
  );

  const undo = useCallback(() => {
    const previous = undoRef.current.pop();
    if (previous) setRows(previous);
  }, []);

  const playCut = useCallback(
    (index: number) => {
      const row = rowsRef.current[index];
      if (!row || row.start === null || row.end === null) return;
      const end = row.end;
      if (cutTimerRef.current !== null) window.clearInterval(cutTimerRef.current);
      controls.seekTo(Math.max(0, row.start - 0.2));
      controls.play();
      cutTimerRef.current = window.setInterval(() => {
        if (controls.getTime() < end) return;
        controls.pause();
        if (cutTimerRef.current !== null) window.clearInterval(cutTimerRef.current);
        cutTimerRef.current = null;
      }, 50);
    },
    [controls],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === "Space") {
        event.preventDefault();
        mark();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(-0.1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudge(0.1);
      } else if (event.key === "z") {
        undo();
      } else if (event.key === "p") {
        playCut(selectedRef.current);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mark, nudge, playCut, undo]);

  useEffect(
    () => () => {
      if (cutTimerRef.current !== null) window.clearInterval(cutTimerRef.current);
    },
    [],
  );

  const loadVideo = () => {
    const id = parseYouTubeId(url);
    if (!id) return;
    setLoadedStart(Number(clipStart) || 0);
    setYoutubeId(id);
  };

  const build = () => {
    const start = Number(clipStart) || 0;
    const end = Number(clipEnd) || duration || 3600;
    const cues = parseTranscript(transcript);
    const slug = slugOf(title);
    if (cues.length > 0) {
      commit(
        cuesToSentences(cues, { clipStartSeconds: start, clipEndSeconds: end, idPrefix: slug }).map(
          (d) => ({ en: d.en, start: d.startSeconds, end: d.endSeconds }),
        ),
      );
    } else {
      commit(
        splitSentences(transcript.replace(/\s+/g, " ")).map((span) => ({
          en: span.text,
          start: null,
          end: null,
        })),
      );
    }
    setSelected(0);
  };

  const exportJson = useMemo(() => {
    const slug = slugOf(title);
    return JSON.stringify(
      {
        id: slug,
        youtubeId: youtubeId ?? "",
        title,
        channel,
        level,
        durationSeconds: duration,
        clipStartSeconds: Number(clipStart) || 0,
        clipEndSeconds: Number(clipEnd) || duration,
        sentences: rows.map((row, i) => ({
          id: `${slug}-s${i + 1}`,
          startSeconds: row.start,
          endSeconds: row.end,
          en: row.en,
        })),
      },
      null,
      2,
    );
  }, [channel, clipEnd, clipStart, duration, level, rows, title, youtubeId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // The text stays selectable in the box below.
    }
  };

  const updateRow = (index: number, patch: Partial<Row>) =>
    commit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const clipEndNumber = Number(clipEnd) || duration || 1;
  const timed = rows.filter((row) => row.start !== null && row.end !== null).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Video dictation · timing</h1>
        <span className="text-muted-foreground text-sm">
          {timed} of {rows.length} sentences timed
        </span>
        <span className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Open a prepared video</span>
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/admin/video?lesson=${lesson.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {lesson.title}
            </Link>
          ))}
        </span>
      </div>

      <div className="border-border mb-4 grid gap-3 rounded-2xl border p-4 sm:grid-cols-6">
        <input
          className={cn(FIELD, "sm:col-span-3")}
          placeholder="YouTube link or video ID"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className={FIELD}
          placeholder="Clip start (s)"
          inputMode="decimal"
          value={clipStart}
          onChange={(e) => setClipStart(e.target.value)}
        />
        <input
          className={FIELD}
          placeholder="Clip end (s)"
          inputMode="decimal"
          value={clipEnd}
          onChange={(e) => setClipEnd(e.target.value)}
        />
        <button type="button" className={buttonVariants({ size: "sm" })} onClick={loadVideo}>
          Load video
        </button>
        <input
          className={cn(FIELD, "sm:col-span-3")}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={cn(FIELD, "sm:col-span-2")}
          placeholder="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        />
        <select
          className={FIELD}
          value={level}
          onChange={(e) => setLevel(e.target.value as VideoLevel)}
        >
          {LEVELS.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <div ref={hostRef} className="absolute inset-0 [&_iframe]:size-full" />
            {!youtubeId && (
              <p className="text-muted-foreground absolute inset-0 grid place-items-center text-sm">
                Load a video to start
              </p>
            )}
            {failure && (
              <p className="absolute inset-0 grid place-items-center bg-black/70 p-4 text-center text-sm text-white">
                The player could not play this video ({failure}).
              </p>
            )}
          </div>
          <div className="relative mt-4 h-10" aria-hidden="true">
            <div className="bg-muted absolute inset-x-0 top-4 h-1.5 rounded-full" />
            {rows.map((row, i) =>
              row.end === null ? null : (
                <span
                  key={i}
                  className="bg-success absolute top-3 h-4 w-0.5 rounded-full"
                  style={{ left: `${Math.min(100, (row.end / clipEndNumber) * 100)}%` }}
                />
              ),
            )}
            <span
              className="bg-foreground absolute top-1 h-8 w-0.5"
              style={{ left: `${Math.min(100, (now / clipEndNumber) * 100)}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">
            {now.toFixed(1)} s of {clipEndNumber.toFixed(0)} s
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonVariants()}
              onClick={mark}
              disabled={rows.length === 0}
            >
              MARK the end{" "}
              <kbd className="border-primary-foreground/40 rounded border px-1.5 text-[11px]">
                Space
              </kbd>
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
              onClick={undo}
            >
              Undo
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
              onClick={() => nudge(-0.1)}
            >
              −0.1 s
            </button>
            <button
              type="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
              onClick={() => nudge(0.1)}
            >
              +0.1 s
            </button>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Play the video, press Space when the selected sentence ends. ← → nudge 0.1 s · Z undo ·
            P plays the selected cut.
          </p>
        </div>

        <div>
          <textarea
            className="border-border bg-background mb-2 h-24 w-full rounded-xl border p-3 text-sm"
            placeholder={
              "Paste the transcript here (YouTube's “Show transcript” copy, a .vtt or .srt), or just the sentences."
            }
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <button
            type="button"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={build}
            disabled={!transcript.trim()}
          >
            Build the sentences
          </button>
          <ol className="border-border mt-3 max-h-[420px] overflow-auto rounded-2xl border p-2">
            {rows.length === 0 && (
              <li className="text-muted-foreground p-3 text-sm">No sentences yet.</li>
            )}
            {rows.map((row, i) => {
              const words = splitWords(row.en).length;
              const bad = row.start !== null && row.end !== null && row.end <= row.start;
              return (
                <li
                  key={i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "grid grid-cols-[1.5rem_1fr_auto_auto] items-center gap-2 rounded-xl p-2 text-sm",
                    i === selected && "bg-brand-muted",
                  )}
                >
                  <span className="text-muted-foreground text-xs tabular-nums">{i + 1}</span>
                  <span>
                    <input
                      className={cn(FIELD, "w-full")}
                      value={row.en}
                      onChange={(e) => updateRow(i, { en: e.target.value })}
                    />
                    {words > MAX_COMFORTABLE_WORDS && (
                      <span className="text-danger text-xs">{words} words: split it</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-muted-foreground w-28 text-center text-xs tabular-nums",
                      bad && "text-danger",
                    )}
                  >
                    {seconds(row.start)} – {seconds(row.end)}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      onClick={() => playCut(i)}
                      disabled={row.start === null || row.end === null}
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                      onClick={() => commit(rows.filter((_, k) => k !== i))}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="font-semibold">Result</h2>
          <button
            type="button"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={copy}
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
        <textarea
          readOnly
          className="border-border bg-muted/30 h-56 w-full rounded-xl border p-3 font-mono text-xs"
          value={exportJson}
        />
      </div>
    </div>
  );
}
