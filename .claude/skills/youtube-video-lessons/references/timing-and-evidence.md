# Where times come from, and how far to trust them

## Evidence ladder (best first). Say in `sourceNote` which one produced the stops.
1. **A creator's `.srt` / `.vtt` with cue ends** (ask for it; it also gives exact text): the cue ends are the sentence ends. `yvl split --source file.srt`, then still `verify`.
2. **A file we legitimately hold** (ours, or a public-domain/CC file the owner supplied): `scripts/video-prep/prepare.mjs` aligns text and audio letter by letter (about 0.03 s); Whisper only when no text exists. Never a file taken from YouTube.
3. **Loudness of the official embed** (`capture` then `plan`): the default for a YouTube-only video. Good where the pauses are clear; every other boundary goes on the LISTEN list.
4. **A person marks the ends** while listening: `/admin/video` (Space at each end, +-0.1 s). No tokens, 10-20 min.
5. **Never alone**: caption cue starts, a cue's time spread over its letters, a guess. Captions lead the voice by 0.1-1.2 s and now and then lag it by 0.4 s.

No single measurement is exact: Whisper word times, a voice detector, a waveform threshold and the aligner differed by up to 0.7 s on the first lessons. That is why a boundary is put in a *pause* (silence has room for error), not on a word edge.

## What `plan` does
1. Voice = the 300-3400 Hz level above a threshold chosen from the data (Otsu) with 3 dB hysteresis; dips under 0.12 s merge. `separability` (0..1) says how clearly voice and background are apart: under 0.5 (a music bed) expect shaky stops.
2. Sentence ends (. ! ?) go in increasing pauses. A sentence that starts exactly at a caption cue must start its first sound within [cue - 0.9 s, cue + 1.8 s]; inside that window the boundary prefers the pause that stands out; each sentence's speech should last about as long as its syllables need at the clip's speaking rate (judged per sentence, so drift does not pile up).
3. A cut **inside** a real sentence (only for sentences over 12 words) is kept only if its pause is at least `--min-pause` (default 0.45 s), the pieces fit their syllables, and no rival pause of 0.12 s lies within 0.45 s of it (two rivals = the cut could be one word off, which leaks or cuts a word). Otherwise the pieces join and the sentence stays whole, flagged long (precedent: the NASA lessons kept 16-19-word sentences). Trade-off: lower `--min-pause` gives shorter sentences and more risk; those cuts are always on the LISTEN list.
4. Stop = last sound + 0.30 s, never nearer than 0.10 s to the next sound; replay start = next sound - 0.10 s; first start = first sound - 0.10 s; last stop = last sound + 0.30 s. Clip start = `floor(first start - 0.15)` (the player starts on a whole second), clip end = last stop rounded up.
5. Flags: `NO-ROOM` (pause < 0.15 s: stop in its middle), `tight` (< 0.25 s), `shaky` (a nearly as good pause exists), `rate-off`, `inner-cut`, `no-cue-window`, `rate N` (syllables per second outside 3-8.5). Each goes on the LISTEN list as `time after #n`.

## What the gates prove, and what they cannot
- `check` (with the capture): every stop sits in silence with >= 0.04 s behind it and >= 0.08 s before the next sound; no speech between two sentences belongs to none; each sentence's speech duration fits its syllables (1.8-11 syllables/s; 3-8.5 normal); text equals the caption text except the edits listed.
- `verify`: in YouTube's player the app's own stop rule lands each stop within about 0.03 s of the asked time (measured -0.03...+0.02 s over 19 stops, mean 0) once the page's `nextLead` has settled; replays land 0.2 s after the target; the player length matches `durationSeconds`; an ad is waited out.
- `flow`: the practice page itself plays, stops, accepts the typed sentence, resumes and reaches the finish screen through the real click path.
- **Not provable without ears:** that the word right after a pause is the word the text says. Loudness cannot see words; a boundary that is one short word off (in a fast, pauseless stretch) passes every gate. Hence the LISTEN list: ask the owner to listen to those spots once and nudge in `/admin/video`.

## Fixing a stop afterwards
`/admin/video?lesson=<id>` plays the lesson and nudges a stop by 0.1 s; copy the JSON back. Or re-run `plan` with `--window a-b`, `--threshold dB`, `--min-pause`, `--clip-start`, then `fill`, `check`, `build --update`, `verify`.
