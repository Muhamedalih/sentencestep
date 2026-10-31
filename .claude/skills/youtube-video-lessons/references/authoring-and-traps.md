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
- **Music bed.** `separability` under 0.5 means the pauses are not silent; expect shaky stops and a long LISTEN list, or choose another video.
- **Bot or consent pages** (error 153, "confirm you're not a bot"): re-run with `--headful`, from the owner's network; do not work around them.
- **Throttled browser.** If `capture` warns the sampler is slow, close other Chrome windows, re-run with `--headful`; stops measured under a throttled page are 0.8-1.2 s late and meaningless.
- **Windows.** `node --test` takes a file path, not a folder; Bash halves backslashes (use forward slashes); PowerShell 5.1 shows UTF-8 files as mojibake (the files are fine; use `-Encoding UTF8`); `next dev` can leave an orphan on its port (`netstat -ano`, `taskkill /T /F /PID`); remove a worktree's `node_modules` junction with `cmd /c rmdir` before `git worktree remove`.
- **Shared index.** Other sessions share `C:\Looma`'s git index: commit with explicit paths (`git commit -- <paths>`), `git fetch` before pushing.
- **Unit tests of the skill:** `node --test .claude/skills/youtube-video-lessons/scripts/test/yvl.test.mjs`.
