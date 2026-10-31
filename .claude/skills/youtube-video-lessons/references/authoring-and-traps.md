# Writing the lesson text, and the traps met so far

## `<slug>.ar.txt` (UTF-8, in the drafts folder). `yvl fill --id <slug> --list` prints the numbered sentences to translate.
```
level: B1
textSource: public-domain
durationSeconds: 91
sourceNote: One line. Who made it; the rights basis with a link; where the text came from (manual captions as the player shows them, date; numbers spelled out; edits); how the stops were found (loudness in the official embed, IFrame verification); "a first version, to be checked by ear".

1
ar: the whole sentence in Arabic
g: NASA=ناسا|has=قد|observed=رصدت|the=الـ|earth=الأرض|getting=تصبح|warmer...=أدفأ

2
ar: ...
g: ...
```
Header keys: level, textSource, sourceNote, title, channel, channelUrl, durationSeconds, clipStart, clipEnd (title/channel/channelUrl come from `inspect`; `plan` fills the clip). Arabic and meanings are written by Claude directly in one pass, never through an API.

**`g`**: exactly one `word=meaning` per whitespace-separated word of the English sentence, in order, the word copied as it appears (punctuation may stay). A shifted pair would label every later word wrongly, so `fill` refuses a count or key mismatch and names the sentence. Conventions of the existing lessons: `the=الـ`, `a=واحد`, `has=قد`, `to=إلى` (or `أن`/`لـ` by use). Give the meaning *in this sentence*: `solar=الشمسية`, phrasal verbs on the verb and a short marker on the particle (`ends=ينتهي|up=به المطاف`). Aim for the Arabic a learner would read, not word-for-word. About 2-3k tokens for 20 sentences.

## Text rules `split` already applies (check the NOTEs it prints)
Straight apostrophes and quotes; sound tags `[Music]`, notes and `>>` removed; lone dashes glued to a word; numbers and `%` spelled as said (`90%` -> `ninety percent`; a year is converted in the usual way and flagged); a caption left without its final period gets one; `...` at a cue end is kept and the next cue starts a new sentence (the caption writer marked a pause there); `--fix fixes.txt` (`old => new` per line) corrects words the captions got wrong; `--join-ellipsis` joins instead. Punctuation and capitals are otherwise exactly the source's.

## Level (A1-B2)
By the text: A1 short present-tense lines; A2 everyday past/future and common words; B1 connected sentences with because/when/if and some abstract words (the NASA explainers); B2 idiom, long sentences, low-frequency words.

## Traps
- **Wrong worktree.** `C:\Looma` lacks the video code; `C:/Looma-ytdict` may be in use. Work in your own worktree; every command reads `--repo` / the current folder.
- **Channel default.** The repo generator fills "VOA Learning English" when channel is missing: `check` makes channel and a youtube.com channelUrl mandatory.
- **Prettier-formatted data files are not JSON** (see project-audit.md): never `JSON.parse` a committed lesson.
- **Ads.** A pre-roll ad is possible; capture and verify wait it out (the page treats a different player length as an ad). Never skip or block it.
- **Captions off or automatic.** `capture` reports the track kinds (`en:manual`, `en:asr`). Automatic roll-up captions repeat lines and mishear words: use a creator script or type the text; mark the lesson `trial` if there is no permission.
- **Roll-up captions: type the final lines.** The player shows each line in several growing states, so `split` from the capture alone returns repeats and half sentences. Type each sentence once, in its final form (punctuation added, words corrected against the audio or the burned-in captions), as `<slug>.src.srt` (one cue per sentence; copy each cue's start from the first state of `caps` that shows it, rough is fine: `plan --anchors` takes every time from the capture's word onsets, not from the cues) and run `split --source <slug>.src.srt`, then `plan --anchors [--threshold -27]` when plain `plan` fails. Keep the captions' own words wherever they are right: the planner finds each sentence by matching its words to the captions (a corrected word is fine, its time is estimated and NOTEd; under 60% matched is an error).
- **The skill cannot hear.** Loudness has no words. After `plan --anchors`, every joined sentence (two caption sentences with no pause, or a held scream or mumble joined across a clear pause) and every uncaptioned sound (a "hmm", a laugh, a scream: the plan's NOTE and LISTEN list name the time) goes in the report for the owner's ear. A joined sentence is not a defect: the learner types it in one go.
- **Burned-in captions.** A Short often has its words drawn into the picture: an independent reading of the wording (on the ducks Short they confirmed every line, showed a "hmm" the automatic captions missed and corrected «God, praise God»). Read them without sound as below; use them to settle the text before `fill`.
- **Music bed.** `separability` under 0.5 means the pauses are not silent; expect shaky stops and a long LISTEN list, or choose another video.
- **Bot or consent pages** (error 153, "confirm you're not a bot"): re-run with `--headful`, from the owner's network; do not work around them.
- **A last sentence that runs to the last frame** (a closing chant). YouTube reports the length rounded up (a 42.54 s Short says 43) and `durationSeconds` must stay that reported number, but no stop may lie after the real last frame: `plan` keeps the last stop and the clip end 0.10 s before the picture's last frame when the capture ran to the end, `check` and `verify` treat a stop there as the end of the video, and the page takes the player's ENDED as the stop. But in some embed sessions (3 of the 8 flow runs that reached the last sentence of the Ducks Short, all in the first four) YouTube loops the Short: the playhead wraps from the last frame to 0 and plays on with no ENDED, so a stop past the last frame (`ducks-in-the-rain` as first built: 42.86 against 42.54) is never reached and the page waits for ever while the video repeats. `verify` and `flow` name it ("wrapped round ... lies after its last frame"); `verify --loop` makes the player loop on purpose, so the check is the same every time (that lesson FAILS with it, the same lesson with its last stop at 42.44 passes). Re-plan such a lesson so its last stop is 0.10 s before the last frame (`plan --anchors`, then `build --update`). The search window of `plan --anchors` ends 3 s after the last caption word: pass `--window` for a chant that goes on.
- **Rebuilding a lesson.** Edit the spec (or re-run `plan`/`fill`), then `build --id <slug> --update`: the lesson of the same id and video is the one being rebuilt, not a duplicate. Without `--update` `check` refuses its own id and video.
- **`flow` stuck at "dad, ".** Not key speed (90 and 150 ms both failed and passed): the first key was typed before the page had moved the keyboard from the player's frame to the sentence's input (a moment after the stop, longer on a cold dev server), so it was lost, and the typing engine then took whatever letters matched ("D" lost, then d-a-d and a space: the input stays "dad, " and the video never resumes). `flow` now waits for the page's own focus on the input before it types (it does not force the focus: a page that never focuses the sentence is a real defect and is reported). It also asks the dev server for `/learn/video` and the lesson page first (with the dev-admin and `ss_locale=ar` cookies) so the 30-90 s compile does not fall inside the browser's first navigation. `--type-delay N` (default 90) is still the key cadence: dev-mode React needs about 50 ms a key.
- **Throttled browser.** If `capture` warns the sampler is slow, close other Chrome windows, re-run with `--headful`; stops measured under a throttled page are 0.8-1.2 s late and meaningless.
- **Windows.** `node --test` takes a file path, not a folder; Bash halves backslashes (use forward slashes); PowerShell 5.1 shows UTF-8 files as mojibake (the files are fine; use `-Encoding UTF8`); `next dev` can leave an orphan on its port (`netstat -ano`, `taskkill /T /F /PID`); remove a worktree's `node_modules` junction with `cmd /c rmdir` before `git worktree remove`.
- **Shared index.** Other sessions share `C:\Looma`'s git index: commit with explicit paths (`git commit -- <paths>`), `git fetch` before pushing.
- **Unit tests of the skill:** `node --test .claude/skills/youtube-video-lessons/scripts/test/yvl.test.mjs`.

## Reading burned-in captions without sound (the owner's Chrome, Claude in Chrome)
Go to the live lesson page `/learn/video/<slug>` (its CSP allows the player; the embed URL opened alone in a tab shows Error 153) and, with `javascript_tool`, add a muted copy of the official embed to it:
```js
const f = document.createElement("iframe");
f.src = "https://www.youtube-nocookie.com/embed/<id>?enablejsapi=1&mute=1&origin=" + location.origin;
f.style = "position:fixed;inset:4vh 4vw;width:92vw;height:92vh;z-index:99999;border:0";
document.body.append(f);
window.cmd = (func, args = []) => f.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
```
Once the player has loaded (a couple of seconds), for each time `t` to read: `cmd("seekTo", [t, true]); cmd("playVideo")`, about 250 ms later `cmd("pauseVideo")`, then a plain screenshot at `scale` 0.5 (the `zoom` action timed out in `Page.captureScreenshot`; plain screenshots worked). Read the words only, keep no screenshot, `f.remove()` afterwards. It is the official embed, muted, in the owner's own browser: nothing is downloaded or stored.
