import { sentenceWordEntries, type SentenceWordEntry } from "@/lib/voice/sentence-word-plan";
import { TaskScheduler, type TaskOutcome } from "@/lib/voice/task-scheduler";

/**
 * Loads a lesson's isolated-word clips AHEAD of the learner, in the order they
 * will be needed, so a word click plays from memory instead of waiting on the
 * network. No React, no DOM: everything environment-specific comes in through
 * `WordAudioPreloaderDeps`, so the ordering rules below are unit-tested.
 *
 * The rule: the sentence the learner is on loads first; the next sentence loads
 * right behind it, while the learner is still typing the current one; and when
 * the learner gets there, it is promoted and whatever comes after it starts.
 * Each sentence goes through three steps:
 *   1. URLs    — one batched request for all of the sentence's words (instead of
 *                a Server Action per word, which Next.js runs strictly one at a
 *                time and which every click then queued behind);
 *   2. bytes   — every known clip downloaded into a Blob, so playback needs no
 *                network at all;
 *   3. missing — words no clip exists for yet are generated server-side, in one
 *                request, so they are ready before anyone clicks them.
 */

export type WordAudioPriority = "now" | "next";

export interface WordAudioRequest {
  sentenceId: string;
  /** The sentence's English text — the words are derived from it here, exactly as the server derives them. */
  text: string;
  /** The lesson's narrator voice; the server maps it to the voice the word clips live under. */
  voiceId: string;
  /** URLs the server already resolved while rendering the page (first sentence only). Skips step 1 for the words they cover. */
  knownUrls?: Record<string, string>;
}

export interface WordAudioWindowRequest extends WordAudioRequest {
  priority: WordAudioPriority;
}

export interface SentenceWordsResponse {
  urls: Record<string, string>;
  missing: string[];
}

export interface WordAudioPreloaderDeps {
  /** GET (cache-only) or, with `generate`, POST (synthesizes what's missing). null when the server doesn't know the sentence or voice. */
  fetchSentenceWords: (
    request: { sentenceId: string; voiceId: string },
    options: { generate: boolean },
  ) => Promise<SentenceWordsResponse | null>;
  /** The clip's bytes, or null if it couldn't be fetched (the caller then plays the plain URL). */
  fetchClip: (url: string) => Promise<Blob | null>;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  /** Called for every word URL learned — the shared resolved-audio cache lives with the caller. */
  onWordUrl: (contentId: string, url: string) => void;
  /** A word's URL if the shared cache already has it. */
  getWordUrl: (contentId: string) => string | undefined;
  /** Longest a click waits on a sentence's URLs before giving up on them. */
  settleTimeoutMs?: number;
}

type JobPriority = WordAudioPriority | "stale";

interface Job {
  key: string;
  request: WordAudioRequest;
  entries: SentenceWordEntry[];
  priority: JobPriority;
  /** Settles once step 1 is over — the batched lookup answered, failed, or was dropped. */
  lookupDone: Promise<void>;
  /** Settles once every URL this sentence will get is known (step 3 over too). Clip downloads may still be running. */
  urlsReady: Promise<void>;
  /** True once the server has answered every question about this sentence (lookup, and generation if anything was missing) — so a word still without a URL is one the server couldn't make, not one we never asked about. */
  answered: boolean;
}

const RANK: Record<WordAudioPriority, number> = { now: 0, next: 1 };

/** Requests for URLs are small JSON calls; two at a time keeps the current and next sentence moving together. */
const LOOKUP_CONCURRENCY = 2;
/** Clip downloads — 5–15KB each. Under a browser's per-origin limit so the sentence's own narration is never starved. */
const CLIP_CONCURRENCY = 4;
/** Generation is real synthesis on the server; one request at a time. */
const GENERATE_CONCURRENCY = 1;
/** Oldest clips are released past this many, so a very long session can't grow without bound (~10KB each). */
const MAX_CACHED_CLIPS = 600;
const DEFAULT_SETTLE_TIMEOUT_MS = 9_000;

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function jobKey(request: { sentenceId: string; voiceId: string }): string {
  return `${request.sentenceId}|${request.voiceId}`;
}

export class WordAudioPreloader {
  private readonly jobs = new Map<string, Job>();
  private readonly lookups = new TaskScheduler(LOOKUP_CONCURRENCY);
  private readonly clipDownloads = new TaskScheduler(CLIP_CONCURRENCY);
  private readonly generations = new TaskScheduler(GENERATE_CONCURRENCY);
  /** clip URL -> Blob URL once downloaded. A URL that failed maps to null so it is never retried. */
  private readonly clips = new Map<string, string | null>();
  private readonly clipsInFlight = new Set<string>();

  constructor(private readonly deps: WordAudioPreloaderDeps) {}

  /**
   * Declares which sentences the learner needs, most urgent first: normally the
   * current sentence ("now") and the one after it ("next"). Anything asked for
   * earlier and not listed here becomes stale — work that hasn't started is
   * dropped, so a learner who jumped ahead (resume, back/forward) never waits
   * behind sentences they've left.
   */
  setWindow(requests: readonly WordAudioWindowRequest[]): void {
    const wanted = new Map(requests.map((request) => [jobKey(request), request]));
    for (const job of this.jobs.values()) {
      job.priority = wanted.get(job.key)?.priority ?? "stale";
    }
    for (const request of requests) {
      const job = this.ensureJob(request);
      job.priority = request.priority;
    }
  }

  /**
   * What a word click awaits when the word's URL isn't cached yet: makes sure
   * the sentence is loading, moves it to the front, and resolves as soon as
   * `contentId`'s URL is known — or every URL of the sentence has settled, or
   * the timeout passes. Joins the work already under way rather than starting a
   * second, duplicate request. Resolves with why it stopped waiting:
   *  - "ready"       the word's URL is now in the shared cache;
   *  - "missing"     the server answered and has no clip for it (and couldn't make one);
   *  - "unreachable" the server never answered (network error, timeout, dropped).
   */
  async ensureWord(
    request: WordAudioRequest,
    contentId: string,
  ): Promise<"ready" | "missing" | "unreachable"> {
    const job = this.ensureJob(request);
    job.priority = "now";
    const timeout = new TimeoutRace(this.deps.settleTimeoutMs ?? DEFAULT_SETTLE_TIMEOUT_MS);
    try {
      await timeout.race(job.lookupDone);
      if (!this.deps.getWordUrl(contentId)) await timeout.race(job.urlsReady);
    } finally {
      timeout.clear();
    }
    if (this.deps.getWordUrl(contentId)) return "ready";
    return job.answered ? "missing" : "unreachable";
  }

  /** The URL to actually play: the in-memory copy once the clip has downloaded, otherwise the network URL itself. */
  getPlayableUrl(url: string): string {
    return this.clips.get(url) ?? url;
  }

  /** Releases every downloaded clip. */
  dispose(): void {
    for (const blobUrl of this.clips.values()) if (blobUrl) this.deps.revokeObjectUrl(blobUrl);
    this.clips.clear();
    this.jobs.clear();
  }

  private ensureJob(request: WordAudioRequest): Job {
    const key = jobKey(request);
    const existing = this.jobs.get(key);
    if (existing) return existing;

    const lookup = deferred();
    const job: Job = {
      key,
      request,
      entries: sentenceWordEntries(request.sentenceId, request.text),
      priority: "stale", // the caller sets the real priority right away; a stale job never starts work
      lookupDone: lookup.promise,
      urlsReady: Promise.resolve(),
      answered: false,
    };
    this.jobs.set(key, job);
    return Object.assign(job, { urlsReady: this.run(job, lookup.resolve) });
  }

  private rankOf(job: Job): () => number | null {
    return () => (job.priority === "stale" ? null : RANK[job.priority]);
  }

  private async run(job: Job, lookupFinished: () => void): Promise<void> {
    try {
      // A job is created before its priority is set; let that happen first.
      await Promise.resolve();
      const { sentenceId, voiceId, knownUrls } = job.request;
      if (knownUrls) {
        for (const [contentId, url] of Object.entries(knownUrls)) {
          this.deps.onWordUrl(contentId, url);
        }
      }

      // 1. URLs — one request for the whole sentence.
      if (this.missingWords(job).length > 0) {
        const outcome = await this.lookups.schedule(
          () => this.deps.fetchSentenceWords({ sentenceId, voiceId }, { generate: false }),
          this.rankOf(job),
        );
        if (!this.adopt(job, outcome)) return;
      }
      lookupFinished();

      // 2. Bytes for everything known so far, in reading order.
      void this.downloadClips(job);

      // 3. Words nobody has made a clip for yet — generated in one request.
      if (this.missingWords(job).length > 0) {
        const outcome = await this.generations.schedule(
          () => this.deps.fetchSentenceWords({ sentenceId, voiceId }, { generate: true }),
          this.rankOf(job),
        );
        if (!this.adopt(job, outcome)) return;
        void this.downloadClips(job);
      }
      job.answered = true;
    } finally {
      lookupFinished();
    }
  }

  private missingWords(job: Job): SentenceWordEntry[] {
    return job.entries.filter((entry) => !this.deps.getWordUrl(entry.contentId));
  }

  /**
   * Takes a response's URLs into the shared cache. Returns false when the job
   * should stop: it was dropped as stale, or its request failed — either way
   * the job is forgotten, so the next request for this sentence starts fresh.
   */
  private adopt(job: Job, outcome: TaskOutcome<SentenceWordsResponse | null>): boolean {
    if (outcome.status !== "done") {
      this.jobs.delete(job.key);
      return false;
    }
    if (outcome.value) {
      for (const [contentId, url] of Object.entries(outcome.value.urls)) {
        this.deps.onWordUrl(contentId, url);
      }
    }
    return true;
  }

  /** Schedules a download for every known clip of the job that isn't loaded or loading. */
  private downloadClips(job: Job): Promise<unknown> {
    const downloads: Promise<unknown>[] = [];
    for (const entry of job.entries) {
      const url = this.deps.getWordUrl(entry.contentId);
      if (!url || this.clips.has(url) || this.clipsInFlight.has(url)) continue;
      this.clipsInFlight.add(url);
      downloads.push(
        this.clipDownloads
          .schedule(() => this.deps.fetchClip(url), this.rankOf(job))
          .then((outcome) => {
            this.clipsInFlight.delete(url);
            if (outcome.status === "dropped") return; // stale before it started — a later request retries
            const blob = outcome.status === "done" ? outcome.value : null;
            this.remember(url, blob ? this.deps.createObjectUrl(blob) : null);
          }),
      );
    }
    return Promise.all(downloads);
  }

  private remember(url: string, blobUrl: string | null): void {
    this.clips.set(url, blobUrl);
    while (this.clips.size > MAX_CACHED_CLIPS) {
      const oldest = this.clips.keys().next();
      if (oldest.done) break;
      const evicted = this.clips.get(oldest.value);
      this.clips.delete(oldest.value);
      if (evicted) this.deps.revokeObjectUrl(evicted);
    }
  }
}

/** One deadline shared by several awaits: each `race` resolves early if the deadline has passed. */
class TimeoutRace {
  private readonly expired: Promise<void>;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(ms: number) {
    this.expired = new Promise<void>((resolve) => {
      this.timer = setTimeout(resolve, ms);
    });
  }

  race(promise: Promise<void>): Promise<void> {
    return Promise.race([promise, this.expired]);
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
