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

export interface BookVoiceRunSummary {
  generated: number;
  skipped: number;
  failed: number;
  error?: string;
}

/**
 * Calls generateBookVoice repeatedly — each call a separate network
 * round trip, exactly like VoiceBulkGenerateControl's own loop — until the
 * book has no more eligible sentences left (`moreWork` false), a round
 * reports an error, or MAX_ROUNDS_PER_CLICK is hit. Used by both the Book
 * Preview page's "Generate book audio" button and the dashboard's per-book
 * "Generate" button so a single click finishes a whole book instead of only
 * ever advancing it by one MAX_SENTENCES_PER_BOOK_RUN-sized batch.
 *
 * Catches its own network/platform hiccups (a Server Action call throwing
 * instead of returning, same class of failure VoiceBulkGenerateControl's
 * own try/catch guards against) so callers get one consistent result shape
 * either way, with whatever progress was made before the failure preserved
 * in the counts.
 */
export async function generateBookVoiceUntilDone(bookId: string): Promise<BookVoiceRunSummary> {
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (let rounds = 0; rounds < MAX_ROUNDS_PER_CLICK; rounds++) {
      const result = await generateBookVoice(bookId);
      if (result.error) {
        return {
          generated,
          skipped,
          failed,
          error:
            rounds > 0 ? `${result.error} (after ${generated} generated so far)` : result.error,
        };
      }
      generated += result.generated;
      skipped += result.skipped;
      failed += result.failed;
      if (!result.moreWork) break;
    }
  } catch {
    return {
      generated,
      skipped,
      failed,
      error: `Couldn't reach the server. ${generated} generated so far — safe to try again.`,
    };
  }

  return { generated, skipped, failed };
}
