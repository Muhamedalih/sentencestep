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
 *   1. URLs    — one batched, CACHE-ONLY request for all of the sentence's words
 *                (instead of a Server Action per word, which Next.js runs
 *                strictly one at a time and which every click then queued
 *                behind). The single-word inventory already holds almost every
 *                word, so this step is usually the whole story;
 *   2. bytes   — every known clip downloaded into a Blob, so playback needs no
 *                network at all;
 *   3. missing — a word the inventory truly lacks is made on the server ONE
 *                WORD PER REQUEST, one request at a time, current sentence
 *                first. Never in bulk and never on a deadline: production's
 *                backend doesn't reliably finish a burst of syntheses inside one
 *                request, and a word given up on as "missing" for good left the
 *                learner with no sound at all. A failed attempt is forgotten, so
 *                the next tap tries again.
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
  /** Cache-only lookup of the sentence's clips. null when the server doesn't know the sentence or voice; throws when it couldn't be reached. */
  fetchSentenceWords: (request: {
    sentenceId: string;
    voiceId: string;
  }) => Promise<SentenceWordsResponse | null>;
  /** Makes (or finds) ONE word's clip. null when the server has none and couldn't make one; throws when it couldn't be reached. `key` is the normalized word. */
  generateWord: (request: {
    sentenceId: string;
    voiceId: string;
    key: string;
  }) => Promise<string | null>;
  /** The clip's bytes, or null if it couldn't be fetched (the caller then plays the plain URL). */
  fetchClip: (url: string) => Promise<Blob | null>;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  /** Called for every word URL learned — the shared resolved-audio cache lives with the caller. */
  onWordUrl: (contentId: string, url: string) => void;
  /** A word's URL if the shared cache already has it. */
  getWordUrl: (contentId: string) => string | undefined;
  /** Longest a tap waits for its word before giving up on the preloader (the caller has its own fallback). */
  settleTimeoutMs?: number;
}

/** What a tap learned: the clip is ready; the server answered but has no clip; or it never answered at all. */
export type WordAudioStatus = "ready" | "missing" | "unreachable";

type JobPriority = WordAudioPriority | "stale";

interface Job {
  key: string;
  request: WordAudioRequest;
  entries: SentenceWordEntry[];
  priority: JobPriority;
  /** Settles once step 1 is over — the batched lookup answered, failed, or was dropped. */
  lookupDone: Promise<void>;
  /** True once the batched lookup answered (even "unknown sentence"). */
  lookedUp: boolean;
  /** True while steps 2 and 3 are running for this job — guards against starting a second pass. */
  filling: boolean;
  /** Words a tap is waiting on: they jump the queue. */
  urgent: Set<string>;
  /** One in-flight single-word generation per word — a tap joins it instead of starting a second. */
  generating: Map<string, Promise<WordAudioStatus | "dropped">>;
}

const RANK: Record<WordAudioPriority, number> = { now: 0, next: 1 };
/** A word somebody is waiting on goes before everything else. */
const URGENT_RANK = -1;

/** Requests for URLs are small JSON calls; two at a time keeps the current and next sentence moving together. */
const LOOKUP_CONCURRENCY = 2;
/** Clip downloads — 5–15KB each. Under a browser's per-origin limit so the sentence's own narration is never starved. */
const CLIP_CONCURRENCY = 4;
/** Generation is real synthesis on the server; one word at a time. */
const GENERATE_CONCURRENCY = 1;
/** Background generation pauses this long after this many failures in a row (the server can't synthesize right now) — a tap still tries. */
const BACKGROUND_FAILURE_LIMIT = 2;
const BACKGROUND_PAUSE_MS = 60_000;
/** Oldest clips are released past this many, so a very long session can't grow without bound (~10KB each). */
const MAX_CACHED_CLIPS = 600;
const DEFAULT_SETTLE_TIMEOUT_MS = 20_000;

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
  private consecutiveGenerationFailures = 0;
  private backgroundPausedUntil = 0;

  constructor(
    private readonly deps: WordAudioPreloaderDeps,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Declares which sentences the learner needs, most urgent first: normally the
   * current sentence ("now") and the one after it ("next"). Anything asked for
   * earlier and not listed here becomes stale — work that hasn't started is
   * dropped, so a learner who jumped ahead (resume, back/forward) never waits
   * behind sentences they've left.
   */
  setWindow(requests: readonly WordAudioWindowRequest[]): void {
    const wanted = new Map(requests.map((request) => [jobKey(request), request]));
    const revived: Job[] = [];
    for (const job of this.jobs.values()) {
      const previous = job.priority;
      job.priority = wanted.get(job.key)?.priority ?? "stale";
      if (previous === "stale" && job.priority !== "stale") revived.push(job);
    }
    for (const request of requests) {
      const job = this.ensureJob(request);
      job.priority = request.priority;
    }
    // A sentence the learner walked away from and came back to: what was
    // dropped while it was stale (its downloads, its missing words) resumes.
    for (const job of revived) this.resume(job);
  }

  /**
   * What a tap awaits when the word's URL isn't cached yet: makes sure the
   * sentence is loading, moves it — and this word — to the front, and resolves
   * as soon as the word's URL is known. Joins the work already under way (the
   * batched lookup, or the word's own generation) rather than starting a
   * second, duplicate request. Resolves with why it stopped waiting:
   *  - "ready"       the word's URL is now in the shared cache;
   *  - "missing"     the server answered and has no clip for it (and couldn't make one);
   *  - "unreachable" the server never answered (network error, timeout).
   */
  async ensureWord(request: WordAudioRequest, contentId: string): Promise<WordAudioStatus> {
    const job = this.ensureJob(request);
    const wasStale = job.priority === "stale";
    job.priority = "now";
    if (wasStale) this.resume(job);
    const timeout = new TimeoutRace(this.deps.settleTimeoutMs ?? DEFAULT_SETTLE_TIMEOUT_MS);
    try {
      await timeout.race(job.lookupDone);
      if (this.deps.getWordUrl(contentId)) return "ready";
      if (!job.lookedUp) return "unreachable";

      const entry = job.entries.find((candidate) => candidate.contentId === contentId);
      if (!entry) return "missing";
      job.urgent.add(contentId);
      const status = await timeout.race(this.generateWord(job, entry));
      if (this.deps.getWordUrl(contentId)) return "ready";
      // Out of time while the server was still working on it: it answered nothing
      // yet, but asking the per-word action as well would only queue a second
      // synthesis of the same word behind it.
      return status === undefined || status === "dropped" ? "missing" : status;
    } finally {
      timeout.clear();
    }
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
      lookedUp: false,
      filling: false,
      urgent: new Set(),
      generating: new Map(),
    };
    this.jobs.set(key, job);
    void this.run(job, lookup.resolve);
    return job;
  }

  private rankOf(job: Job, contentId?: string): () => number | null {
    return () => {
      if (contentId !== undefined && job.urgent.has(contentId)) return URGENT_RANK;
      return job.priority === "stale" ? null : RANK[job.priority];
    };
  }

  /** Like rankOf, for background generation: also dropped while the server is failing to synthesize (a tap, being urgent, still goes through). */
  private generationRankOf(job: Job, contentId: string): () => number | null {
    const rank = this.rankOf(job, contentId);
    return () => {
      const value = rank();
      return value !== null && value !== URGENT_RANK && this.backgroundPaused() ? null : value;
    };
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

      // 1. URLs — one cache-only request for the whole sentence.
      if (this.missingWords(job).length > 0) {
        const outcome = await this.lookups.schedule(
          () => this.deps.fetchSentenceWords({ sentenceId, voiceId }),
          this.rankOf(job),
        );
        if (!this.adopt(job, outcome)) return;
      }
      job.lookedUp = true;
      lookupFinished();
      await this.fill(job);
    } finally {
      lookupFinished();
    }
  }

  /** Starts steps 2 and 3 again for a job that has already looked its sentence up. */
  private resume(job: Job): void {
    if (job.lookedUp && !job.filling) void this.fill(job);
  }

  /** Steps 2 and 3: the known clips' bytes, then the words the inventory lacks. */
  private async fill(job: Job): Promise<void> {
    if (job.filling) return;
    job.filling = true;
    try {
      // 2. Bytes for everything known so far, in reading order.
      void this.downloadClips(job);

      // 3. Words the inventory truly lacks. All are queued at once, in reading
      // order, but the lane runs ONE synthesis at a time and re-ranks between
      // them — so the current sentence's words go before the next sentence's,
      // and a tapped word before both. Queued work is dropped, not run, once the
      // sentence goes stale or the server keeps failing.
      await Promise.all(this.missingWords(job).map((entry) => this.generateWord(job, entry)));
    } finally {
      job.filling = false;
    }
  }

  private missingWords(job: Job): SentenceWordEntry[] {
    return job.entries.filter((entry) => !this.deps.getWordUrl(entry.contentId));
  }

  private backgroundPaused(): boolean {
    return this.now() < this.backgroundPausedUntil;
  }

  /**
   * Takes the batched lookup's URLs into the shared cache. Returns false when
   * the job should stop: it was dropped as stale, or its request failed —
   * either way the job is forgotten, so the next request for this sentence
   * starts fresh.
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

  /**
   * Makes one word's clip, joining an attempt already under way. A failed
   * attempt is forgotten as soon as it settles (so the next tap tries again)
   * and only counts toward pausing the BACKGROUND work — a tap always tries.
   */
  private generateWord(job: Job, entry: SentenceWordEntry): Promise<WordAudioStatus | "dropped"> {
    const existing = job.generating.get(entry.contentId);
    if (existing) return existing;

    const { sentenceId, voiceId } = job.request;
    const attempt = this.generations
      .schedule(
        async () => {
          // Counted here, inside the task, so the tally is right before the lane
          // picks its next word — counting after the task settles would let one
          // more word start first.
          try {
            const url = await this.deps.generateWord({ sentenceId, voiceId, key: entry.key });
            this.noteGeneration(url !== null);
            return url;
          } catch (error) {
            this.noteGeneration(false);
            throw error;
          }
        },
        this.generationRankOf(job, entry.contentId),
      )
      .then((outcome): WordAudioStatus | "dropped" => {
        job.generating.delete(entry.contentId);
        if (outcome.status === "dropped") return "dropped";
        if (outcome.status === "done" && outcome.value) {
          this.deps.onWordUrl(entry.contentId, outcome.value);
          void this.downloadClips(job);
          return "ready";
        }
        return outcome.status === "done" ? "missing" : "unreachable";
      });
    job.generating.set(entry.contentId, attempt);
    return attempt;
  }

  private noteGeneration(succeeded: boolean): void {
    if (succeeded) {
      this.consecutiveGenerationFailures = 0;
      return;
    }
    this.consecutiveGenerationFailures += 1;
    if (this.consecutiveGenerationFailures >= BACKGROUND_FAILURE_LIMIT) {
      this.backgroundPausedUntil = this.now() + BACKGROUND_PAUSE_MS;
    }
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
          .schedule(() => this.deps.fetchClip(url), this.rankOf(job, entry.contentId))
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

/** One deadline shared by several awaits: each `race` resolves early (to undefined) if the deadline has passed. */
class TimeoutRace {
  private readonly expired: Promise<undefined>;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(ms: number) {
    this.expired = new Promise<undefined>((resolve) => {
      this.timer = setTimeout(() => resolve(undefined), ms);
    });
  }

  race<T>(promise: Promise<T>): Promise<T | undefined> {
    return Promise.race([promise, this.expired]);
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
