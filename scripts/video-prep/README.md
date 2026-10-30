# Video prep: from a video file to a Video dictation lesson

Two small scripts that find the exact sentence times and leave only the Arabic to write.

## One-time setup

```
mkdir C:\Looma-tools\video-prep && cd C:\Looma-tools\video-prep
npm init -y && npm install @huggingface/transformers
```

Models download on first use into `C:\Looma-tools\video-prep\models`: `onnx-community/whisper-small.en_timestamped`
(about 250 MB, only to find the TEXT of a new video) and `Xenova/wav2vec2-base-960h` (about 95 MB, aligns text and audio).
ffmpeg is found on the PATH, in `FFMPEG`, or in `C:\Looma-video\node_modules\ffmpeg-static`. Another folder: set
`VIDEO_PREP_HOME`. `VIDEO_PREP_DEVICE=dml` runs Whisper on the GPU (about 3x faster than the CPU).

## A new video

1. Get the FILE from the publisher (VOA shows direct mp4 links on its pages) or from the Internet Archive or Wikimedia
   Commons. Only public-domain or Creative Commons media. Never a file taken from YouTube: its Terms forbid downloading.
2. `node scripts/video-prep/prepare.mjs <file-or-url> --id my-video --clip 3.5-57.9`
   - Whisper writes the text, the words are cut into sentences (at most 12 words), and the aligner gives every word its
     time. The table shows each sentence with its start, stop, the gap to the next and the number of words.
   - It writes `<id>.draft.json` and `<id>.spec.json` in `C:\Looma-tools\video-prep\drafts`.
3. Check the text against the video (VOA videos have the sentences burned in as captions: look at the caption frame of
   every sentence). Fix wrong sentences in the spec, then fill in `youtubeId`, `title`, `level`, `durationSeconds`,
   `sourceNote`, and for every sentence the Arabic (`ar`) and one `word=meaning` pair per word (`g`).
4. `node scripts/video-prep/build.mjs <spec.json>` (from the repo root) writes `src/data/videos/<id>.ts` and adds it to
   `src/data/videos/index.ts`. `npm run test:video` checks timings, overlaps and one meaning per word.

## Re-timing a video that already exists

`node scripts/video-prep/prepare.mjs <file> --id my-video --clip a-b --units-from src/data/videos/my-video.ts [--apply]`
aligns the sentences already in the data file with the audio and prints old and new times; `--apply` writes them.

## What to trust (measured on the first two videos, 2026-10-30)

No single measurement is exact. Four of them were compared (the waveform, Whisper's own word times, a voice detector and
the aligner) and they differed by up to 0.7 s at some sentence boundaries: Whisper's word times drift both ways, the
aligner can stretch a quiet last word over the pause that follows, a loudness threshold takes music for speech. What
worked: take the median of the estimates for each boundary, then stop a little after the median last sound and never
nearer than 0.08 s to the median next sound. Where the numbers still disagree by more than 0.3 s, ask somebody to listen
to that boundary once (`/admin/video` moves a stop by 0.1 s). On the learner's side the page measures how late its stops
really land and asks for the next one earlier (`nextLead` in `src/lib/video-dictation/segments.ts`).

Also check that every caption window of the video is covered by a sentence (read all of them, not samples): the first
version of one video lacked a whole sentence and the stop after the sentence before it came three seconds late.
