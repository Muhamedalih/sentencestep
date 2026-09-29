# Typing sound — sources and licenses

Every keystroke sound pack the app can play, where it comes from, and under
what license. Keep this file in sync with `SOUND_PACK_NAMES` in
`src/lib/typing-sound-packs.ts` — that list and this table describe the same
thirty-nine packs, in three collections (Premium Buttons, Classic tones, Sound Lab).

## Current state: no third-party audio is bundled

All thirty-nine packs are **synthesized at play time with the Web Audio API** from
the numbers in `src/lib/typing-sound-packs.ts` (the original ten),
`src/lib/typing-sound-button-packs.ts` (the nine Premium Buttons) and
`src/lib/typing-sound-layered-packs.ts` (the twenty Sound Lab packs), built with
the shared layer builders in `src/lib/typing-sound-layers.ts`. There are
no audio files in `public/`, nothing to download or decode, and no third-party
recordings, samples or presets were used, copied or imitated note-for-note.
The parameters are original to this project, so the sounds carry no
third-party license obligation: they are covered by the repository's own
license like the rest of the source.

| Pack        | Label         | Source                         | License / attribution               |
| ----------- | ------------- | ------------------------------ | ----------------------------------- |
| ceramic     | Ceramic       | Original synthesis (this repo) | Project-owned, no third-party audio |
| aluminum    | Aluminum      | Original synthesis (this repo) | Project-owned, no third-party audio |
| softTouch   | Soft-Touch    | Original synthesis (this repo) | Project-owned, no third-party audio |
| magnetic    | Magnetic Snap | Original synthesis (this repo) | Project-owned, no third-party audio |
| haptic      | Haptic        | Original synthesis (this repo) | Project-owned, no third-party audio |
| glassButton | Glass Button  | Original synthesis (this repo) | Project-owned, no third-party audio |
| pearl       | Pearl         | Original synthesis (this repo) | Project-owned, no third-party audio |
| toggle      | Toggle        | Original synthesis (this repo) | Project-owned, no third-party audio |
| microSwitch | Micro Switch  | Original synthesis (this repo) | Project-owned, no third-party audio |
| soft        | Soft          | Original synthesis (this repo) | Project-owned, no third-party audio |
| gentle      | Gentle        | Original synthesis (this repo) | Project-owned, no third-party audio |
| minimal     | Minimal       | Original synthesis (this repo) | Project-owned, no third-party audio |
| click       | Click         | Original synthesis (this repo) | Project-owned, no third-party audio |
| pop         | Pop           | Original synthesis (this repo) | Project-owned, no third-party audio |
| bubble      | Bubble        | Original synthesis (this repo) | Project-owned, no third-party audio |
| typewriter  | Typewriter    | Original synthesis (this repo) | Project-owned, no third-party audio |
| premium     | Premium       | Original synthesis (this repo) | Project-owned, no third-party audio |
| mechanical  | Mechanical    | Original synthesis (this repo) | Project-owned, no third-party audio |
| crystal     | Crystal       | Original synthesis (this repo) | Project-owned, no third-party audio |
| glass       | Glass         | Original synthesis (this repo) | Project-owned, no third-party audio |
| softTap     | Soft Tap      | Original synthesis (this repo) | Project-owned, no third-party audio |
| clean       | Clean         | Original synthesis (this repo) | Project-owned, no third-party audio |
| modern      | Modern        | Original synthesis (this repo) | Project-owned, no third-party audio |
| digital     | Digital       | Original synthesis (this repo) | Project-owned, no third-party audio |
| tactile     | Tactile       | Original synthesis (this repo) | Project-owned, no third-party audio |
| calm        | Calm          | Original synthesis (this repo) | Project-owned, no third-party audio |
| woodBlock   | Wood Block    | Original synthesis (this repo) | Project-owned, no third-party audio |
| marimba     | Marimba       | Original synthesis (this repo) | Project-owned, no third-party audio |
| kalimba     | Kalimba       | Original synthesis (this repo) | Project-owned, no third-party audio |
| pluck       | Harp Pluck    | Original synthesis (this repo) | Project-owned, no third-party audio |
| waterDrop   | Water Drop    | Original synthesis (this repo) | Project-owned, no third-party audio |
| thock       | Thock         | Original synthesis (this repo) | Project-owned, no third-party audio |
| clicky      | Clicky        | Original synthesis (this repo) | Project-owned, no third-party audio |
| analog      | Analog        | Original synthesis (this repo) | Project-owned, no third-party audio |
| handDrum    | Hand Drum     | Original synthesis (this repo) | Project-owned, no third-party audio |
| whisper     | Whisper       | Original synthesis (this repo) | Project-owned, no third-party audio |
| ticker      | Ticker        | Original synthesis (this repo) | Project-owned, no third-party audio |
| bamboo      | Bamboo        | Original synthesis (this repo) | Project-owned, no third-party audio |
| feltPiano   | Felt Piano    | Original synthesis (this repo) | Project-owned, no third-party audio |

The sentence-completion sounds (`src/lib/sentence-complete-sounds.ts`) and
lesson-end sounds (`src/lib/lesson-end-sounds.ts`) are synthesized the same
way and are equally original.

## If recorded audio files are ever added

Only add a file if its license is **unambiguous and allows commercial use**;
prefer CC0 / Public Domain. Acceptable sources: Kenney (UI Audio, Interface
Sounds), OpenGameArt CC0 packs, BigSoundBank (CC0), Lots of Sounds (CC0).
Never add anything Non-Commercial, share-alike-restricted without review, or
with an unclear license — if the license can't be confirmed on the source
page, don't use the file.

For every file added, append a row to the table below **in the same commit**
as the file, with the exact source page, the license as stated there, the
date it was checked, and the local path. Store files under
`public/sounds/typing/<pack>/` (compressed for the web, short, normalized so
they sit at a similar loudness to the synthesized packs).

| Local file   | Pack | Original title / author | Source URL | License | Checked | Processing |
| ------------ | ---- | ----------------------- | ---------- | ------- | ------- | ---------- |
| _(none yet)_ |      |                         |            |         |         |            |
