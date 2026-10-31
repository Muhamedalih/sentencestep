# Rights and YouTube policy for video lessons

Embedding with YouTube's official player is allowed and gives the creator the view. **It is not a licence.** The sentences the learner types, and our Arabic, are the creator's text: a lesson needs a basis for showing them.

## `textSource` decision
| Value | Use only when | Evidence to put in `sourceNote` |
| --- | --- | --- |
| `public-domain` | NASA media (nasa.gov media guidelines: generally not subject to copyright in the US; credit NASA, never imply endorsement, check third-party music and logos per video), other US-government work, expired copyright, VOA Learning English (public domain, check third-party music/images) | link to the guideline page, what was checked |
| `creative-commons` | CC BY or CC0 only. Never NC, ND or SA (the product is paid). The video's licence line is shown on its YouTube page | licence name + version, creator credit line shown on the lesson page |
| `permission` | the owner of the text wrote that it may be shown to learners | who, when, where the message is kept |
| `own` | our production (our script, our voices) | what it is |
| `trial` | none of the above (a famous creator's Short, auto-captions...). Admins only: `visibleVideoLessons` hides it from everyone else, a test covers it | say TRIAL ONLY, why, that it must be cleared or removed before the section opens |

Unsure -> `trial`, and tell the owner in the report. Famous studio cartoons, late-night shows, Movieclips and similar are out without written permission. The owner's rule (2026-10-31): the section must have no rights problems; "famous creators" meant ones who allow reuse, never "ignore rights".

## What the skill may do with YouTube
- Play, pause, seek, read time through the IFrame Player API in YouTube's own embedded player, unmodified and not hidden (player at least 200x200).
- `capture` plays the clip once, muted, in that embed on a local test page and records **numbers only**: loudness every 20 ms and the caption words on screen. It reads the sound through the browser's debugging connection to the embed's frame. This is a gray area against the letter of the API policy (III.E.6, III.I.7: no scraping, no isolating audio) and of YouTube's terms on automated access: it is limited to the admin's own authoring session, one real-time playthrough, nothing stored but those numbers, never in the product. Prefer a creator's `.srt`/script (ask for it) when one can be had, and say in the report which method was used.
- Never: download or cache video or audio (III.E.1), a hidden or background player (III.I.9), block or change ads (the skill waits ads out), cover the player, use a file taken from YouTube for Whisper.
- Captions: `captions.download` needs edit rights on the video and the player API cannot read caption text, so the text of a YouTube-only video has no official source: it is the caption track the player shows (manual preferred; automatic ones can be wrong and need a human check), a creator's script, or typed text.
- The section must stay **free for everyone** and give **no rewards for watching** (III.F.3: no charge to watch in an embedded player, no gating, no incentives such as streaks or points). Stored YouTube API data (title, channel, duration) is refreshed or deleted within 30 days (III.E.4.d). Our Terms must link YouTube's ToS and our Privacy page Google's policy before the section opens to learners (not done yet).

## Whisper and forced alignment (`scripts/video-prep/prepare.mjs`)
They need audio, so they apply only to a file we legitimately hold: our own recording, or a public-domain/CC file the owner supplied from the publisher. Pass a local path, never a URL taken from YouTube. Use Whisper (text) only when no reliable text exists; with known text use `--units-from` (forced alignment only, about 0.03 s) and skip Whisper.

## Report these to the owner every time
The textSource chosen and why; whether captions were manual or automatic; which method gave the times; the LISTEN list; anything above that was a gray area.
