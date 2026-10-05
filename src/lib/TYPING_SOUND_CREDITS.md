# Typing sound — sources and licenses

Every keystroke sound pack the app can play, where its audio comes from, and
under what license. Keep this file in sync with `SOUND_PACK_NAMES` in
`src/lib/typing-sound-packs.ts` (44 packs in four collections). A test
(`npm run test:typing-sound`) fails if a recording ships without a row here.

## Summary

| Collection          | Packs                                                                                                                                                                                                             | Audio                                                                             | License                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Real Recordings** | `classicOffice`, `tactileSwitch`, `softOffice`, `deepThock`, `studioClick`                                                                                                                                        | Real recordings of real hardware, shipped as WAV files in `public/sounds/typing/` | **CC0 1.0** (public domain) — details below     |
| Premium Buttons     | `ceramic`, `aluminum`, `softTouch`, `magnetic`, `haptic`, `glassButton`, `pearl`, `toggle`, `microSwitch`                                                                                                         | Synthesized at play time (Web Audio)                                              | Original to this project — no third-party audio |
| Classic tones       | `soft`, `gentle`, `minimal`, `click`, `pop`, `bubble`, `typewriter`, `premium`, `mechanical`, `crystal`                                                                                                           | Synthesized at play time                                                          | Original to this project — no third-party audio |
| Sound Lab           | `glass`, `softTap`, `clean`, `modern`, `digital`, `tactile`, `calm`, `woodBlock`, `marimba`, `kalimba`, `pluck`, `waterDrop`, `thock`, `clicky`, `analog`, `handDrum`, `whisper`, `ticker`, `bamboo`, `feltPiano` | Synthesized at play time                                                          | Original to this project — no third-party audio |

The sentence-completion and lesson-end sounds (`src/lib/sentence-complete-sounds.ts`,
`src/lib/lesson-end-sounds.ts`) are synthesized the same way and are equally original.

## Real Recordings — provenance

All recordings are **CC0 1.0 Universal** (public domain dedication): free to use,
modify and redistribute, including commercially, with no attribution required.
Credit is given here anyway. Only recordings whose source page states CC0 are used.

| Source recording                                                                                        | Author      | Source page                                                                                          | License evidence                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Keyboard Soundpack #1 [Typing and Single Keystrokes]" — Cherry KC 1000 keyboard, Shure SM7B microphone | unicaegames | [opengameart.org](https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes) | **Independently confirmed:** the OpenGameArt page listing (seen through web search; the site itself is not reachable from our build environment) gives the license as CC0. Also attributed CC0 by Clatterbox's `CREDITS.md`.                                                                                                               |
| "Mechanical Keyboards" pack, sounds 766628–766640                                                       | StavSounds  | [freesound.org/people/StavSounds/packs/42151](https://freesound.org/people/StavSounds/packs/42151/)  | **Attested by a third party:** Clatterbox's `CREDITS.md` states the license was confirmed on each sound's own Freesound page (CC0). freesound.org is not reachable from our build environment, so this was not re-checked first-hand — see "Please spot-check" below.                                                                      |
| "Middle Mouse Click" (press and release)                                                                | 1j01        | [opengameart.org/content/middle-mouse-click](https://opengameart.org/content/middle-mouse-click)     | **Attested by a third party:** TypeTone's `third_party/mouse-sounds/README.md` lists the page as CC0 evidence and records the SHA-256 of the files (press `8a0ec2e7…fbe8fe`, release `18900583…a0f3`), re-verified against the download on 2026-09-02. Not re-checked first-hand (opengameart.org unreachable from our build environment). |

The audio was obtained from two public GitHub repositories that vendor these CC0
files with their own per-file credits (their code is Apache-2.0 / MIT; the audio
remains CC0): [zordhalo/clatterbox](https://github.com/zordhalo/clatterbox)
(`src-tauri/resources/packs/classic` and `tactile`) and
[phuclh/omarchy-typetone](https://github.com/phuclh/omarchy-typetone)
(`mouse-sounds/studio` and `third_party/mouse-sounds`). Their bundled files were
checked against their published SHA-256 manifests.

### Processing applied here

Every shipped file was trimmed of lead-in silence (so the click sounds
immediately), high-passed at 40 Hz, faded out, peak-normalized to −3 dBFS and
written as 16-bit mono PCM WAV. Two packs are deliberate, honestly-named
_derivatives_ of the same recordings:

- **Soft Office** — the Classic Office recordings played 6% slower and low-passed at 3.8 kHz (cushioned, muffled), 22.05 kHz.
- **Deep Thock** — the Tactile Switch recordings played 20% slower (about 4 semitones lower) and low-passed at 6.5 kHz (deeper, creamier), 22.05 kHz.

### Shipped files

| Shipped file                                | Original                                                                          | Author      | Source                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------- |
| `/sounds/typing/classicOffice/01.wav`       | `keypress-001.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/02.wav`       | `keypress-003.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/03.wav`       | `keypress-004.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/04.wav`       | `keypress-005.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/05.wav`       | `keypress-006.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/06.wav`       | `keypress-007.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/07.wav`       | `keypress-010.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/08.wav`       | `keypress-012.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/09.wav`       | `keypress-013.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/10.wav`       | `keypress-014.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/11.wav`       | `keypress-015.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/classicOffice/12.wav`       | `keypress-016.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/tactileSwitch/01.wav`       | Freesound 766628                                                                  | StavSounds  | [freesound.org/s/766628](https://freesound.org/s/766628/) |
| `/sounds/typing/tactileSwitch/02.wav`       | Freesound 766630                                                                  | StavSounds  | [freesound.org/s/766630](https://freesound.org/s/766630/) |
| `/sounds/typing/tactileSwitch/03.wav`       | Freesound 766631                                                                  | StavSounds  | [freesound.org/s/766631](https://freesound.org/s/766631/) |
| `/sounds/typing/tactileSwitch/04.wav`       | Freesound 766632                                                                  | StavSounds  | [freesound.org/s/766632](https://freesound.org/s/766632/) |
| `/sounds/typing/tactileSwitch/05.wav`       | Freesound 766633                                                                  | StavSounds  | [freesound.org/s/766633](https://freesound.org/s/766633/) |
| `/sounds/typing/tactileSwitch/06.wav`       | Freesound 766634                                                                  | StavSounds  | [freesound.org/s/766634](https://freesound.org/s/766634/) |
| `/sounds/typing/tactileSwitch/07.wav`       | Freesound 766637                                                                  | StavSounds  | [freesound.org/s/766637](https://freesound.org/s/766637/) |
| `/sounds/typing/tactileSwitch/08.wav`       | Freesound 766638                                                                  | StavSounds  | [freesound.org/s/766638](https://freesound.org/s/766638/) |
| `/sounds/typing/tactileSwitch/09.wav`       | Freesound 766639                                                                  | StavSounds  | [freesound.org/s/766639](https://freesound.org/s/766639/) |
| `/sounds/typing/tactileSwitch/10.wav`       | Freesound 766640                                                                  | StavSounds  | [freesound.org/s/766640](https://freesound.org/s/766640/) |
| `/sounds/typing/softOffice/01.wav`          | `keypress-001.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/02.wav`          | `keypress-003.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/03.wav`          | `keypress-004.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/04.wav`          | `keypress-005.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/05.wav`          | `keypress-006.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/06.wav`          | `keypress-007.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/07.wav`          | `keypress-010.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/08.wav`          | `keypress-012.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/09.wav`          | `keypress-013.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/10.wav`          | `keypress-014.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/11.wav`          | `keypress-015.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/softOffice/12.wav`          | `keypress-016.wav`                                                                | unicaegames | OpenGameArt                                               |
| `/sounds/typing/deepThock/01.wav`           | Freesound 766628                                                                  | StavSounds  | [freesound.org/s/766628](https://freesound.org/s/766628/) |
| `/sounds/typing/deepThock/02.wav`           | Freesound 766630                                                                  | StavSounds  | [freesound.org/s/766630](https://freesound.org/s/766630/) |
| `/sounds/typing/deepThock/03.wav`           | Freesound 766631                                                                  | StavSounds  | [freesound.org/s/766631](https://freesound.org/s/766631/) |
| `/sounds/typing/deepThock/04.wav`           | Freesound 766632                                                                  | StavSounds  | [freesound.org/s/766632](https://freesound.org/s/766632/) |
| `/sounds/typing/deepThock/05.wav`           | Freesound 766633                                                                  | StavSounds  | [freesound.org/s/766633](https://freesound.org/s/766633/) |
| `/sounds/typing/deepThock/06.wav`           | Freesound 766634                                                                  | StavSounds  | [freesound.org/s/766634](https://freesound.org/s/766634/) |
| `/sounds/typing/deepThock/07.wav`           | Freesound 766637                                                                  | StavSounds  | [freesound.org/s/766637](https://freesound.org/s/766637/) |
| `/sounds/typing/deepThock/08.wav`           | Freesound 766638                                                                  | StavSounds  | [freesound.org/s/766638](https://freesound.org/s/766638/) |
| `/sounds/typing/deepThock/09.wav`           | Freesound 766639                                                                  | StavSounds  | [freesound.org/s/766639](https://freesound.org/s/766639/) |
| `/sounds/typing/deepThock/10.wav`           | Freesound 766640                                                                  | StavSounds  | [freesound.org/s/766640](https://freesound.org/s/766640/) |
| `/sounds/typing/studioClick/01.wav`         | TypeTone `mouse-sounds/studio/left.wav` (derived from `middle-click-press.wav`)   | 1j01        | OpenGameArt                                               |
| `/sounds/typing/studioClick/02.wav`         | TypeTone `mouse-sounds/studio/middle.wav` (derived from `middle-click-press.wav`) | 1j01        | OpenGameArt                                               |
| `/sounds/typing/studioClick/03.wav`         | TypeTone `mouse-sounds/studio/right.wav` (derived from `middle-click-press.wav`)  | 1j01        | OpenGameArt                                               |
| `/sounds/typing/studioClick/release-01.wav` | `middle-click-release.wav`                                                        | 1j01        | OpenGameArt                                               |

### Please spot-check (5 minutes)

Because freesound.org and opengameart.org can't be reached from our build
environment, the license lines marked _attested by a third party_ above were not
re-read on the source pages by us. Before relying on them commercially, open the
StavSounds pack link and the 1j01 link and confirm the license reads
"Creative Commons 0". If any is not CC0, delete that pack's folder under
`public/sounds/typing/`, its entry in `src/lib/typing-sound-sample-packs.ts`, and
its row here (the test suite will point out anything left behind).

## Reviewed and not used

- **SND (snd-lib)** — designed UI sounds, but the audio stays under each sound designer's copyright with terms that restrict redistributing the files; not CC0, so not used.
- **uisfx** — CC0 audio, but its sounds are themselves synthesized; not used.
- **Kenney "UI Audio" and "Interface Sounds"** — CC0 (license files read first-hand), but bright, game-style clicks; not used (can be added later).
- **TypeTone mouse profiles Crisp / Deep / Logitech / Razer / Soft** — CC0 recordings, but very sharp (80–98% of their energy above 4 kHz); not used.
- **Mechvibes packs (MIT) and the IBM Model M pack from bucklespring (GPL-2.0)** — audio licensing not clear-cut CC0/public domain (MIT of uncertain audio provenance; GPL-2.0 copyleft); not used.

## Adding more recorded sounds

Only add a file if its license is **unambiguous and allows commercial use**;
prefer CC0 / Public Domain. Never add anything Non-Commercial, restrictive
(no-redistribution) or with an unclear license — if the license can't be
confirmed on the source page, don't use the file. Add the audio under
`public/sounds/typing/<pack>/`, register it in
`src/lib/typing-sound-sample-packs.ts`, add a migration extending the
`sound_pack` check constraint, and add a row to the "Shipped files" table above
in the same commit.
