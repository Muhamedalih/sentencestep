# What the current system is (audited 2026-10-31 on origin/master b390f2d)

Read this instead of re-auditing. Nothing here may be changed by a lesson job.

## Files
| Path | Role |
| --- | --- |
| `src/data/videos/<id>.ts` + `index.ts` | one static lesson per file (about 13 KB), listed in `index.ts` in library order. No Supabase, no storage |
| `src/lib/video-dictation/types.ts` | `VideoLesson`, `VideoSentence`, `VideoWord`, `VideoTextSource` |
| `.../validate.ts` | `validateVideoLesson`: id slug, 11-char youtubeId, clip inside video, sentences sorted (overlap tolerance 0.05 s), one meaning per whitespace token in order |
| `.../segments.ts` | the stop rules: `POLL_MS` 30, `segmentTick`, `nextLead` (the page learns each device's stop delay), `replayPosition` (start - 0.2 s), `isSameVideo` (ad check, tolerance 1.5 s), speeds 1 / 0.75 / 0.5 |
| `.../words.ts` | `splitWords` (whitespace), `bareWord`, `MAX_COMFORTABLE_WORDS` = 12 |
| `.../transcript-import.ts` | `parseTranscript` (YouTube "Show transcript" paste, .vtt, .srt), `splitSentences`, `cuesToSentences` |
| `.../content.ts` | `getVideoLessons`, `visibleVideoLessons(admin)` hides `textSource: "trial"` from non-admins |
| `src/components/video-dictation/` | `video-session.tsx` (practice), `use-youtube-player.ts`, `youtube-api.ts`, `video-library.tsx`, `video-timing-tool.tsx` |
| `src/app/(app)/learn/(dashboard)/video/page.tsx`, `learn/video/[id]/page.tsx`, `admin/(console)/video/page.tsx` | library, practice (full screen), admin timing tool (`/admin/video?lesson=<id>`, Space marks an end, +-0.1 s nudges) |
| `scripts/video-prep/{prepare,build}.mjs`, `README.md` | file -> Whisper text -> wav2vec2 forced alignment; spec -> data file + index entry |
| `src/lib/video-dictation/video-dictation.test.ts` -> `npm run test:video` | validates every lesson in `src/data/videos` |

## Data semantics (`VideoLesson`)
- `youtubeId` 11 chars; `durationSeconds` = the video's length: the page treats a player reporting another length (+-1.5 s) as an ad and waits.
- `clipStartSeconds`: the player starts at `floor(clipStart)` (the `start` player variable is whole seconds). `clipEndSeconds`: end of the part used.
- `sentence.endSeconds` = where the page stops. `sentence.startSeconds` = only the replay point (replay seeks to start - 0.2 s). Between sentences the video continues from where it paused: no seek, so **what plays between two stops is whatever the audio holds**: a stop too early replays the end of a word, a stop too late lets the next sentence begin.
- `wordTranslations`: one `{en, ar}` per whitespace-separated token of `en`, same order, `en` without edge punctuation. A lone dash is a token that needs a meaning of its own: glue punctuation to a word.
- `textSource`: `public-domain | creative-commons | permission | own | trial`. `sourceNote` one line: who, rights basis + link, where the text and the stops came from.
- `channel`, `channelUrl`, `level` (A1-B2), `title` are shown on the page. `build.mjs` defaults channel to "VOA Learning English": always set both.

## Playback (what the page does)
Official player via IFrame API, host `youtube-nocookie.com`, vars `playsinline rel=0 disablekb=1 iv_load_policy=3 fs=0 start=floor(clipStart) origin`. First play = the learner pressing YouTube's own button (the view counts for the channel). Then: poll `getCurrentTime()` every 30 ms; stop at `end - lead` (`lead` starts 0.03, adapts to the measured overshoot, max 0.25); the learner types; on completion `playVideo()` with no seek; if the phone refuses autoplay a "continue" button appears after 1.2 s. Measured stop overshoot 0.02-0.05 s at 25-50 ms polling; resume to PLAYING about 0.28 s.

## Typing rules (`src/lib/typing.ts`)
Keystrokes are letters (`\p{L}`), digits and spaces only. Everything else (. , ! ? ' " - ... % &) is shown and auto-skipped. Comparison is case-insensitive, with NO accent folding: `cafe` with an accent cannot be typed on a US keyboard. Digits are typed as digits but heard as words: spell numbers and symbols the way they are said ("ninety percent").

## Constraints that bite
- **CSP is route-scoped** (`needsYouTube` in `src/middleware.ts`: `/learn/video` and `/admin/video` only) and a CSP belongs to the loaded document: every entry into the section must be a full page load (`fullLoad` links). Test the real click path, not only the URL.
- The whole section is behind the `videoDictation` rollout (Admins only by default, `src/lib/rollouts/catalog.ts`). Arabic UI only. No progress saving, no es/tr yet.
- Each lesson is code: a new lesson reaches learners only through a release publish (push to `release`, only on the owner's «انشر»).
- `npm run type-check` (tsc) and `npm run lint` (eslint .) cover the whole repo: do not add `.ts` files outside the app; the skill's scripts are `.mjs`. `.claude` is in `.prettierignore`.
- Committed data files are Prettier-formatted: keys are unquoted, so they are NOT valid JSON. Read them by evaluating the object literal (`readLessonFile` in `scripts/lib/util.mjs`). **Known defect:** `scripts/video-prep/prepare.mjs --units-from/--apply` still uses `JSON.parse` and fails on a committed file.
- `C:\Looma` is stale (92+ commits behind, other sessions' uncommitted files): never work or switch branches there. Make your own worktree from `origin/master`; `C:/Looma-ytdict` belongs to the video session.
- Local testing switches (no Supabase needed): `FEATURES_DEV_ALL_ON=true` turns every rollout on, cookie `sentencestep-dev-admin=true` makes the visitor an Admin, both non-production only.
- No YouTube Data API key exists; oEmbed (`https://www.youtube.com/oembed`) tells embeddable (200) / embedding off or private (401) / gone (404).
