# Word audio loading (lessons + Dictation)

How the single-word pronunciations of a lesson — a word click in the typing
view, and a tapped word in Dictation — get from "stored somewhere" to "plays the
instant you tap it". Applies to Normal and Stories lessons (Conversation has no
per-word audio). Books keep their own per-page batching (`book-audio-batch.ts`).

## The rules this design follows

1. **Use the single-word clips that already exist.** The inventory holds almost
   every word. It is found across _every_ Edge-TTS voice and every spelling a clip
   may be stored under — not under the one voice a rule predicted.
2. **One voice speaks a sentence.** The voice that covers most of the sentence's
   words is the primary; only a word it lacks is filled in from the next voice.
3. **Never synthesize inside a lookup, never in bulk, never on a deadline.**
   Production runs on a slow free-tier backend that does not reliably finish
   synthesis inside a request (see the Daily session commits #20 and #23). A
   missing word is made _one word per request_, one at a time.
4. **A tap is never silent and never a dead end.** Real clip → the browser's
   voice after `WORD_FALLBACK_MS` → and a failed word is retried on the next tap.

## What was wrong

1. **Server Actions run one at a time.** Every word lookup was a Server Action;
   Next.js 15 queues them in a single client-side FIFO
   (`app-router-instance.js`, `actionQueue.pending.next`). A sentence's words ran
   back to back and a tap waited behind all of them.
2. **The first sentence's words were never pre-resolved.** The page looked them up
   under the narrator's voice id; isolated words live under another voice.
3. **Lookups were too narrow.** `voice_audio_cache` is keyed on the exact text and
   words were stored raw (`"Hello,"`), normalized (`"hello"`) and Capitalized
   (`"Hello"`) by three different producers, under several voices. A lookup by one
   spelling under one voice reported "no audio" for a word that had a clip.
4. **Nothing was in memory**, and Dictation had no preload.

### What the first fix (#25) got wrong

It generated every missing word of a sentence in one request with a 6s budget, and
treated a word the server failed to make as "missing" for the rest of the session.
On the real backend that meant words with no clip stayed silent — worse than
before. It also ignored where the inventory actually lives. Both are fixed by the
rules above.

## How it works

`LessonSession` declares a rolling **word-audio window** on every sentence change
(`setWordWindow`): the current sentence is `now`, the next is `next`.

```
lesson opens     →  sentence 1: URLs from the page, clips → memory
                    sentence 2: URLs + clips             (while you type sentence 1)
reach sentence 2 →  sentence 2: promoted to now          (already loaded)
                    sentence 3: URLs + clips
```

`WordAudioPreloader` (`word-audio-preloader.ts`, no React/DOM, unit-tested) loads a
sentence in three steps:

1. **URLs** — one cache-only `GET /api/voice/sentence-words` for the whole
   sentence, a plain `fetch` (not a Server Action, so not in the queue). The first
   sentence's URLs come with the page and skip this.
2. **Bytes** — every clip downloaded into a Blob, so playback touches no network.
3. **Missing words** — `POST /api/voice/sentence-words {sentenceId, voiceId, key}`
   makes ONE word, under the voice that speaks the rest of the sentence. Words are
   queued in reading order but the lane runs one synthesis at a time and re-ranks
   between them: current sentence, then next, and a tapped word before both. After
   two failures in a row background generation pauses for a minute (a tap still
   tries). A failed word is forgotten, so the next tap retries.

A tap goes through `resolveSentenceWord` (provider): cache hit → play; otherwise
join the sentence's in-flight load and put _this word_ at the front; only if the
server never answered is the old per-word Server Action tried. Typing and
Dictation share this one path.

The lesson page also emits `<link rel="preload" as="fetch">` for the first
sentence's clips (they start downloading with the HTML), runs its lookups side by
side, and waits at most `WORD_LOOKUP_BUDGET_MS` for the word lookup — it is a head
start, never a requirement.

## Where the inventory is searched (server)

`resolveSentence` (`isolated-word-audio.ts`): `rankWordVoices` orders every
Edge-TTS voice — the lesson's word voice, then its gender (the Word Lists
pronunciation voice ahead of the rest), American before other accents, then the
rest, the paid narrator last. One query looks up every spelling
(`wordTextCandidates`: raw, normalized, Capitalized) under all of them;
`pickSentenceClips` chooses the primary voice by coverage.

`GET` logs a warning listing the words a sentence has no clip for and which voice
most of its clips come from, so the function logs show where the inventory really
lives.

## Files

| File                                            | Role                                                                                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/voice/sentence-word-plan.ts`           | Pure: a sentence's words, spellings, voice ranking, coverage-based clip choice, `WORD_FALLBACK_MS`                                                   |
| `src/lib/voice/task-scheduler.ts`               | Pure: ranked queue with a concurrency cap                                                                                                            |
| `src/lib/voice/word-audio-preloader.ts`         | The loader and the window logic                                                                                                                      |
| `src/lib/voice/word-audio-browser.ts`           | Browser wiring (`fetch`, Blob URLs)                                                                                                                  |
| `src/lib/voice/isolated-word-audio.ts`          | Server: voice lookup (memoized), inventory search, single-word generation — kept out of the `"use server"` module so none of it is a public endpoint |
| `src/app/api/voice/sentence-words/route.ts`     | GET (cache-only) and POST (one word)                                                                                                                 |
| `pronunciation-settings-provider.tsx`           | `setWordWindow`, `resolveSentenceWord`, `getPlayableUrl`                                                                                             |
| `lesson-session.tsx`                            | Drives the window                                                                                                                                    |
| `typing-sentence.tsx`, `dictation-sentence.tsx` | Tap → `resolveSentenceWord`, browser-voice fallback                                                                                                  |

## Tuning

`word-audio-preloader.ts`: `LOOKUP_CONCURRENCY`, `CLIP_CONCURRENCY`,
`GENERATE_CONCURRENCY`, `BACKGROUND_FAILURE_LIMIT`/`BACKGROUND_PAUSE_MS`,
`MAX_CACHED_CLIPS`. `WORD_FALLBACK_MS` in `sentence-word-plan.ts`. The synthesis
rate limit is `SYNTHESIS_RATE_LIMIT` in `isolated-word-audio.ts`.

## Operations

- Re-run `scripts/backfill-word-audio.ts` after adding lessons.
- Trying Dictation locally without a database: `FEATURES_DEV_ALL_ON=true npm run dev`.

## Not changed

- Books (`book-audio-batch.ts`) still look up by raw token only.
- Fix Your Mistakes and Today's session resolve single words through the original
  action (lesson words now share the inventory search and single-word generation).
