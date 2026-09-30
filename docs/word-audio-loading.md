# Word audio loading (lessons + Dictation)

How the single-word pronunciations of a lesson — a word click in the typing
view, and a tapped blank in Dictation — get from "nobody has made it yet" to
"plays the instant you tap it". Applies to Normal and Stories lessons
(Conversation has no per-word audio). Books keep their own per-page batching
(`book-audio-batch.ts`) and are unchanged.

## What was wrong

Found by tracing the code path and Next.js's own router source (not measured against production):

1. **Server Actions run one at a time.** Every word lookup was a Server Action
   (`resolvePronunciationAudioAction`). Next.js 15 queues client-side Server
   Actions in a single FIFO (`app-router-instance.js`, `actionQueue.pending.next`):
   a sentence's ten word lookups ran back to back, each costing four or five
   sequential Supabase round trips, and a learner's own tap waited behind every
   one of them — and behind the app's other actions. `MAX_CONCURRENT_PREFETCH_REQUESTS`
   could not give real parallelism: the queue, not the cap, was the bottleneck.
2. **The first sentence's words were never pre-resolved.** The lesson page looked
   them up under the narrator's voice id. Isolated words never live there: a
   Cartesia (Normal) or ElevenLabs (Stories) narrator never pays for a single
   word; its clips sit under a free gender-matched Edge-TTS voice. The lookup
   missed every time, so sentence 1 — the only sentence with no earlier sentence
   to load it during — had nothing ready. (Books already had this fixed.)
3. **Two spellings, one cache.** `voice_audio_cache` is keyed on the exact text.
   A click synthesized the raw token (`"Hello,"`, `"Went"`); the backfill script
   wrote the normalized word (`"hello"`). A lookup by either spelling alone
   missed the other's clips, so the capitalised first word and the punctuated
   last word of a sentence never found their backfilled clip and were
   synthesized from scratch, seconds after the tap.
4. **Nothing was in memory.** Even with a known URL the first play paid a cold
   download from Storage (~0.8s, measured earlier — see `runPrefetchTask`'s comment).
5. **Dictation had no preload at all** — only a per-blank hover warm-up — and a
   1s timer that spoke the word in the browser's own voice if the clip was late.

## How it works now

`LessonSession` declares a rolling **word-audio window** on every sentence change
(`setWordWindow`): the current sentence is `now`, the next is `next`.

```
lesson opens     →  sentence 1 words: load now   (URLs from the page, clips → memory)
                    sentence 2 words: load next  (while you type sentence 1)
reach sentence 2 →  sentence 2: promoted to now  (already loaded)
                    sentence 3 words: load next
```

`WordAudioPreloader` (`src/lib/voice/word-audio-preloader.ts`, no React/DOM,
unit-tested) loads a sentence in three steps:

1. **URLs** — one `GET /api/voice/sentence-words` for the whole sentence, a plain
   `fetch` (not a Server Action, so not in the queue). The server reads the
   sentence row, derives the words itself, and answers with two Supabase reads
   (`resolveWordAudioForText`), looking under the real word voice and under both
   spellings (`wordTextCandidates`). The first sentence's URLs come with the page
   and skip this step.
2. **Bytes** — every clip is downloaded into a Blob, so `getPlayableUrl(url)`
   hands the audio element a `blob:` URL and playback touches no network.
3. **Missing** — words with no clip yet are synthesized in one
   `POST /api/voice/sentence-words` (bounded: 3 at a time, 6s budget, the shared
   per-IP rate limit) under the canonical normalized spelling, so they are ready
   before anyone taps them.

Work is ranked by a small scheduler (`task-scheduler.ts`): `now` before `next`,
4 clip downloads and 2 lookups at a time, generation one request at a time.
Ranks are re-read when the queue picks the next task, so promoting a sentence
needs no re-queuing; a sentence the learner has left (resume, back/forward) is
dropped if its work hasn't started.

A tap/click goes through `resolveSentenceWord` (provider): cache hit → play;
otherwise join the sentence's in-flight load, promoted to the front; only if the
server never answered is the old per-word Server Action tried. Typing and
Dictation share this one path, so they sound and load identically.

The lesson page also emits `<link rel="preload" as="fetch">` for the first
sentence's clips, so they start downloading with the HTML, before the JS loads,
and runs its two lookups side by side instead of one after the other.

## Files

| File                                            | Role                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/voice/sentence-word-plan.ts`           | Pure: a sentence's words, content ids, candidate spellings, clip choice (shared by server and client)                                 |
| `src/lib/voice/task-scheduler.ts`               | Pure: ranked queue with a concurrency cap                                                                                             |
| `src/lib/voice/word-audio-preloader.ts`         | The three-step loader and the window logic                                                                                            |
| `src/lib/voice/word-audio-browser.ts`           | Browser wiring (`fetch`, Blob URLs)                                                                                                   |
| `src/lib/voice/isolated-word-audio.ts`          | Server: word voice (memoized), generation, batch resolver — moved out of the `"use server"` module so none of it is a public endpoint |
| `src/app/api/voice/sentence-words/route.ts`     | The batch endpoint                                                                                                                    |
| `pronunciation-settings-provider.tsx`           | `setWordWindow`, `resolveSentenceWord`, `getPlayableUrl`                                                                              |
| `lesson-session.tsx`                            | Drives the window                                                                                                                     |
| `typing-sentence.tsx`, `dictation-sentence.tsx` | Tap → `resolveSentenceWord`                                                                                                           |

## Tuning

All in `word-audio-preloader.ts`: `LOOKUP_CONCURRENCY`, `CLIP_CONCURRENCY`,
`GENERATE_CONCURRENCY`, `MAX_CACHED_CLIPS`, settle timeout. The server's
generation budget is `GENERATE_DEADLINE_MS` in `isolated-word-audio.ts`; keep it
under the platform's function timeout. Dictation's browser-voice fallback is
`WORD_FALLBACK_MS` in `dictation-sentence.tsx`.

## Operations

- Re-run `scripts/backfill-word-audio.ts` after adding lessons. Its clips are now
  found for every word (before, only lowercase words without punctuation were).
- Trying Dictation locally without a database: `FEATURES_DEV_ALL_ON=true npm run dev`.

## Not changed

- Books (`book-audio-batch.ts`, `BookSentenceReader`) still look up by raw token
  only and still use a Server Action per word on a miss; the same batch route
  would fit, it just needs a `book_sentences` variant.
- Fix Your Mistakes and Today's session resolve single words on demand through
  the original action (now with the two-spelling lookup and the memoized voice).
