import { generateBookVoice } from "@/lib/admin/voice-generation-actions";

/**
 * Safety valve, not a real limit on the book — mirrors
 * VoiceBulkGenerateControl's own MAX_ROUNDS_PER_CLICK (see that component's
 * doc comment for the same reasoning). generateBookVoice only ever
 * synthesizes MAX_SENTENCES_PER_BOOK_RUN sentences per call
 * (book-voice-generation.ts caps both the Voice Director call and the TTS
 * loop there to dodge a real platform 504 on long books), so a book with
 * hundreds of sentences needs several calls to finish — previously an admin
 * had to notice a "Done." message still left sentences pending and click
 * "Generate" again themselves, repeatedly, for every ~15 sentences. Sized
 * generously above the largest book measured in production so far (Atomic
 * Habits, 201 sentences ≈ 14 rounds at 15/round).
 */
const MAX_ROUNDS_PER_CLICK = 20;

/**
 * Each round is already sized (MAX_SENTENCES_PER_BOOK_RUN) to land under the
 * ~25s real platform ceiling documented in voice-generation-actions.ts, but
 * an individual round can still occasionally throw instead of returning — a
 * cold start, a dropped connection, the platform's own transient hiccup, not
 * this book's content. Retrying the *same* round a couple of times with a
 * short backoff before giving up turns an occasional transient failure into
 * a silent success instead of surfacing "Couldn't reach the server" and
 * making the admin click Generate again themselves — exactly the
 * one-batch-then-stop experience this whole loop exists to remove.
 */
const MAX_ATTEMPTS_PER_ROUND = 3;
const RETRY_BACKOFF_MS = [1000, 3000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BookVoiceRunSummary {
  generated: number;
  skipped: number;
  failed: number;
  error?: string;
}

/**
 * Calls generateBookVoice repeatedly — each call a separate network
 * round trip, exactly like VoiceBulkGenerateControl's own loop — until the
 * book has no more eligible sentences left (`moreWork` false), a round's
 * own outcome reports an error (a real, deterministic problem — e.g. no
 * voice configured — that retrying won't fix), or MAX_ROUNDS_PER_CLICK is
 * hit. Used by both the Book Preview page's "Generate book audio" button
 * and the dashboard's per-book "Generate" button so a single click finishes
 * a whole book instead of only ever advancing it by one
 * MAX_SENTENCES_PER_BOOK_RUN-sized batch.
 *
 * A round that throws instead of returning (network/platform hiccup) is
 * retried in place up to MAX_ATTEMPTS_PER_ROUND times before this gives up
 * — see that constant's own doc comment. Callers get one consistent result
 * shape either way, with whatever progress was made before a final failure
 * preserved in the counts.
 */
export async function generateBookVoiceUntilDone(bookId: string): Promise<BookVoiceRunSummary> {
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let rounds = 0; rounds < MAX_ROUNDS_PER_CLICK; rounds++) {
    let outcome: Awaited<ReturnType<typeof generateBookVoice>> | null = null;
    let networkError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_ROUND; attempt++) {
      try {
        outcome = await generateBookVoice(bookId);
        networkError = undefined;
        break;
      } catch (err) {
        networkError = err;
        if (attempt < MAX_ATTEMPTS_PER_ROUND - 1) {
          await sleep(RETRY_BACKOFF_MS[attempt] ?? 3000);
        }
      }
    }

    if (networkError !== undefined || !outcome) {
      return {
        generated,
        skipped,
        failed,
        error: `Couldn't reach the server after ${MAX_ATTEMPTS_PER_ROUND} attempts. ${generated} generated so far — safe to try again.`,
      };
    }

    if (outcome.error) {
      return {
        generated,
        skipped,
        failed,
        error:
          rounds > 0 ? `${outcome.error} (after ${generated} generated so far)` : outcome.error,
      };
    }

    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (!outcome.moreWork) break;
  }

  return { generated, skipped, failed };
}
