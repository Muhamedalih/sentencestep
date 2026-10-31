---
name: youtube-video-lessons
description: Turn a YouTube video into a SentenceStep "Video dictation" lesson (src/data/videos): inspect the link, play it once in YouTube's official embed to record loudness and captions (numbers only), split the text into short sentences with punctuation kept, measure every sentence's start and end, write the Arabic and word meanings, gate the lesson, build it with the repo's own generator and prove every stop in YouTube's IFrame player and on the real practice page before anything is published. Use as soon as the user gives a YouTube link or id with any request to make it a lesson, even without naming this skill («سوي هذا الفيديو», «سوّي لي درس من هذا الرابط», «حوّل الفيديو لدرس», "do this video"), or asks to prepare, re-time, fix, verify or publish a video lesson, or mentions the «فيديو» section, إملاء الفيديو, درس فيديو.
---

# YouTube video lessons (SentenceStep «فيديو»)

Produces `src/data/videos/<slug>.ts` (plus its line in `index.ts`) through the repo's own `scripts/video-prep/build.mjs`, and the proof that each sentence stops in the right place. It never edits the page, `types.ts`, `validate.ts`, the CSP, rollouts or the database: a lesson is a static data file (about 13 KB). Facts of the current system: `references/project-audit.md`.

`Y="node .claude/skills/youtube-video-lessons/scripts/yvl.mjs"`, run from your own worktree (every Bash call restarts in `C:\Looma`: prefix `cd C:/Looma-yvl &&`, or the worktree you made, or add `--repo <worktree>`). Working files: `C:/Looma-tools/video-prep/drafts/<slug>.*` (outside the repo). Every command prints a short readout; read that, not the files.

## The owner's standing orders (2026-10-31, every chat)
- **A YouTube link plus anything like «سوي هذا الفيديو» is the whole request.** Start at once: no questions about the skill, options or rights. Ask only if truly blocked (embedding off, no usable text) or if his choice would change what is built.
- **Rights without asking:** `textSource` from evidence (NASA or US government = public-domain; a CC BY/CC0 licence shown = creative-commons; written permission = permission), otherwise `trial`. One line in the report says which and why.
- **Admins only, on its own.** The section sits behind the `videoDictation` Admins-only permission and a `trial` lesson stays hidden even after it opens: never touch a rollout, permission or setting.
- **Go live for Admins without waiting** (step 11) once steps 1-10 are green; the owner then listens and judges on the live site.
- **Everyone only on his word** (last section). If he asks to review before going live, stop after step 10 and wait for «انشر».

## Hard rules
1. **Rights first.** Embedding is not a licence; the text and our Arabic belong to the creator unless there is a basis. Choose `textSource` from evidence (public-domain, creative-commons CC BY/CC0 only, permission, own); unsure means `trial` (Admins only, hidden from learners) and you tell the owner. `sourceNote` names the basis with a link. `references/rights-and-policy.md`.
2. **Never download, store or re-host YouTube video or audio.** Play only through the official embed. `capture` records numbers only. Whisper and forced alignment (`scripts/video-prep/prepare.mjs`) only for a file we legitimately hold (ours, or a public-domain/CC file the owner supplied), never a URL, never a file taken from YouTube. Whisper only when no reliable text exists.
3. **No guessing times.** Every time comes from a measurement (creator `.srt`, forced alignment, loudness) or a person's mark. Caption cue times are hints only. Never type a time by hand.
4. **No parallel system.** New videos are data files through `build.mjs`; leave the app code alone.
5. **The section stays free** and gives no rewards for watching (YouTube policy III.F.3).
6. **Learners never see a lesson unless the owner says so.** Step 11 puts it live for Admins only; master alone deploys nothing. Opening the section to everyone is a permission change, only on his explicit word.
7. **Own worktree.** `C:\Looma` is stale and holds other sessions' files; `C:/Looma-ytdict` belongs to the video session. Reuse `C:/Looma-yvl` (the standing lesson workspace, `node_modules` junction included) when `git -C C:/Looma-yvl status --short` is empty: `git -C C:/Looma-yvl fetch -q && git -C C:/Looma-yvl switch -C lesson-<slug> origin/master`, then run everything from it. If it is dirty or in use: `git worktree add C:/Looma-yvl-<slug> -b lesson-<slug> origin/master` plus a junction (PowerShell `New-Item -ItemType Junction -Path <worktree>\node_modules -Target C:\Looma\node_modules`).

## Steps (stop at the first FAIL; each command's readout tells the next step)
| # | Command | What you get |
| - | - | - |
| 1 | `$Y inspect <link> --id <slug>` | id, title, channel, embeddable (oEmbed 200/401/404), duplicate lesson?, suggested slug; saves the job. Decide `textSource` now |
| 2 | `$Y capture --id <slug> [--to 80]` | plays the clip once, muted, in the official embed (real time, an ad is waited out): loudness + caption cues -> `.capture.json`. Warns: no captions, automatic captions, music bed, slow sampler |
| 3 | `$Y split --id <slug> [--fix f.txt] [--source file.srt]` | short sentences, punctuation kept, numbers spelled, NOTEs for every change. Read the table: wrong caption words go in `f.txt` (`old => new`), then re-run |
| 4 | `$Y plan --id <slug>` | start/end of every sentence from the audio, `spec.json`, the **LISTEN list** (uncertain spots) |
| 5 | `$Y fill --id <slug> --list`, write `<slug>.ar.txt`, `$Y fill --id <slug>` | Arabic and one meaning per word, checked against the sentence (format: `references/authoring-and-traps.md`) |
| 6 | `$Y check --id <slug>` | gates: schema, rights fields, timeline, typing, meanings, text vs source, stops vs audio, duplicates. Errors block |
| 7 | `$Y build --id <slug>` | check again, repo generator, Prettier, `npm run test:video` |
| 8 | `$Y verify --id <slug>` | plays the lesson in YouTube's IFrame player with the app's own stop rules: where every stop lands, replays, resume, ad, length |
| 9 | `$Y flow --id <slug>` | the real practice page (dev server with the project's local switches, library click, YouTube's play button, every sentence typed at `--type-delay` 90 ms, resume, finish screen, CSP/console errors). Verdict PASS, FAIL or INCONCLUSIVE (the page's own timers were held up 1.5 s or more by machine load: close other Chrome/node jobs and re-run before blaming the lesson). Warns when the player shows captions by default (the answer is on screen; the page does not hide them: tell the owner) |
| 10 | finish | `$Y check --id <slug> --built --repo-tests`; in the worktree `npx tsc --noEmit` and `npx eslint src/data/videos/<slug>.ts`; commit only `src/data/videos/<slug>.ts` and `index.ts` (`git commit -- <paths>`; `git fetch`, then push `HEAD:master` only if it is a fast-forward) |
| 11 | go live for Admins | right after step 10 is green, publish ONLY this lesson's commit to `release` with the recipe in memory `publish-single-commits-to-release` (worktree on origin/release, cherry-pick, keep release's lines in conflicts and add only this lesson, `npm run type-check`, `npm run lint`, `npm test`, guarded push, watch the run and `/api/health` until the commit is live, merge back with `-s ours`, remove the worktrees). Never push master to release. Then give the owner: the link `/learn/video/<slug>` (as Admin), the rights/captions verdict in one line, the LISTEN spots |

A lesson is **done** only when: check PASS (0 errors), build + `test:video` pass, verify PASS, flow PASS, type-check and lint pass, it is live for Admins, and the report lists the LISTEN spots. It is **not** proven that the word after each pause is the right one (loudness cannot see words): ask the owner to listen to the LISTEN spots once and nudge in `/admin/video?lesson=<slug>` (`references/timing-and-evidence.md`).

## Decisions you make
- **Text source**, in order: creator's script/`.srt` (best, ask for it) > manual captions shown by the player (`capture` reports `en:manual`) > the description > typed by hand. Automatic captions (`en:asr`) mishear: correct them against the audio or mark `trial`.
- **Long sentences** stay whole when the speech has no clear pause (0.45 s) inside; `plan --min-pause 0.35` allows more cuts at more risk (listed on LISTEN).
- **Clip**: skip theme music and outros (`--clip-start`, `--clip-end`, or capture `--to`); about a minute is the owner's wish, a bit more is fine.
- **Level** A1-B2 by the text. **Slug** from the title (`inspect` suggests one).
- Several videos in one session: do steps 2 and 4 for all, then batch the Arabic.

## Opening to everyone (only when the owner asks: «انشر للكل», «افتح قسم الفيديو للجميع»)
It is the `videoDictation` permission (Admins only today) set to Everyone, done the project's way (rollouts, as for `dailyRule`), never unasked. Tell him first, in a few lines, what is still open: `trial` lessons stay hidden (clear or remove them), YouTube's Terms and Google's Privacy links are not yet on our Terms/Privacy pages, phones, in-app browsers and ads are untested, and nothing may reward or gate watching. Then do it if he still asks.

## Cost (a 20-sentence video)
Scripts do the work and print one-page readouts: about 1-2k tokens for steps 1-4, 6-9; the Arabic and meanings are the real cost (2-3k); real time is about the clip length three times over (capture, verify, flow) plus the dev server's first compile.

## Files
`scripts/yvl.mjs` (entry), `scripts/cmd/*.mjs` (one per step), `scripts/lib/*.mjs` (shared; `envelope`, `text`, `numbers` are pure and unit-tested: `node --test .claude/skills/youtube-video-lessons/scripts/test/yvl.test.mjs`). References: `project-audit.md` (system facts, constraints, known defects), `rights-and-policy.md`, `timing-and-evidence.md`, `authoring-and-traps.md`. Needs Node 24, Chrome, `puppeteer-core` in `C:/Looma-video` (or `PUPPETEER_HOME`/`VIDEO_PREP_HOME`), the repo's `node_modules` (junction).
