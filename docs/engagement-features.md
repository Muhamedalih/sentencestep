# Engagement features

Seven optional learning features, all controlled from **Admin → Features**
(`/admin/features`, full admins only). The code default is **Off** for every
feature (no settings row, or an unreadable one, means nothing shows). The last
migration below moves the fresh settings row to **Admin preview** for all
seven, so on the live site only admins see anything until a feature is set to
**On**.

| Feature                  | Where it appears                                                    | Sections (admin matrix)       | Guests         |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------- | -------------- |
| Dictation                | "Dictation" toggle under the lesson title                           | Normal, Stories, Conversation | works          |
| From memory              | Button on the lesson-completion screen                              | Normal, Stories, Conversation | works          |
| Personal word cards      | Star on the current-word label, `/learn/cards`, Anki export         | save star: Normal, Stories    | sign-in prompt |
| Daily session            | Card at the top of Home, `/learn/session`                           | global                        | sign-in prompt |
| Daily quests             | Card on Home, quest lines on the completion screen                  | global                        | sign-in prompt |
| Badges                   | Completion-screen celebration, `/learn/achievements`, header trophy | global                        | sign-in prompt |
| Streak calendar & freeze | 7-day strip on Home (tap for the month)                             | global                        | sign-in prompt |

## Admin controls

Per feature: **Off / Admin preview / On** (admin preview = only admins see it on
the live site), a **Premium only** switch (automatically open to everyone while
_Free access_ is on), and — where it makes sense — a per-section on/off matrix.
Plus feature options: dictation letter-by-letter checking and word-length
blanks, from-memory helpers, daily
session size / XP / which sources feed it (mistakes + weak words by default;
Vocabulary Recall, Word Lists and personal cards are opt-in), the quest pool
(each type on/off, target, XP), each badge on/off, and the monthly free streak
freezes (default 2).

The config is one JSON document in `feature_settings` (validated on read and
write by `src/lib/features/config.ts`); a missing or unreadable row means
"everything off".

## Database migrations to apply (in order)

These are new and **not applied automatically**:

1. `20250315000000_feature_settings.sql`
2. `20250316000000_activity_and_streak_freeze.sql` (backfills `activity_days`)
3. `20250317000000_daily_quests.sql`
4. `20250318000000_badges.sql`
5. `20250319000000_saved_words.sql`
6. `20250320000000_daily_sessions.sql`
7. `20250321000000_feature_settings_admin_preview.sql` (puts every feature in
   Admin preview; only touches a settings row nobody has saved yet, so it never
   overwrites a configuration an admin chose)

Until a migration is applied, the feature that needs it degrades quietly (its
card doesn't render, its event is skipped) — lesson completion is never
blocked by an optional feature.

While a feature is in Admin preview, learners who aren't admins see and get
nothing from it. The one invisible side effect: once the streak calendar or
badges are not Off, each lesson completion also writes that day's
`activity_days` row for everyone (a single best-effort upsert), so the calendar
already has history the day the feature goes On.

## How they fit together

- **Dictation** has two ways to be checked, an admin option (**Check letter by
  letter**, on by default); **From memory** always grades a whole sentence.
  - _Letter by letter_ (`applyStrictDictationInput`): every letter is checked as
    it is typed, the way the keystroke engine checks the visible sentence, so
    a wrong letter (case never matters) is turned away and the answer only
    ever holds correct letters. Guessing is not blocked but it is never free:
    each turned-away letter is counted (as an error in the lesson's accuracy,
    and every third one costs a star), shows in red on its blank, plays the
    typing view's error sound, and **plays the word again** (Normal and
    Stories, from the same word clips as a tap on a blank), so a guess costs a
    listen. A space or hyphen typed in the middle of a word counts as a wrong
    letter; the habitual space after a finished word does nothing. After **two
    wrong letters in a row at the same blank**, **Show the word** and **Give
    up** appear together in one bar under the sentence (`DictationHelp`; the
    strip it sits in has a fixed height, so the sentence never jumps). Show
    the word paints the real letters of the word the learner is on, in place:
    they rise onto their lines one after another, stay for about a second and
    dissolve again, two seconds in all (`PEEK_MS` and the stagger constants in
    `dictation-text.tsx`), or sooner when its next correct letter is typed; it
    is said as well, and the button is off while the word is up so one peek
    costs one peek. It needs the blanks (it is not offered with Show word-length blanks
    off).

    **What Show the word costs is shown in three beats.** The sentence's stars
    sit in the bar beside the button, and the button wears a price tag (−★).
    With the pointer or keyboard focus on it, the star it would take turns into
    a dashed ghost. On press that star lifts off, arcs into the bulb and dies in
    a burst of sparks; the bulb flares and the word rises by its light (the peek
    starts as the star lands, `STAR_FLIGHT_MS`), the empty slot pops and "−1"
    floats away. Leaving mid-flight (the learner typed the letter) cancels it
    and nothing is counted. Stars are `3 − helps − ⌊wrong letters ÷ 3⌋`, never
    below one (`dictationStars`); at one star there is nothing left to take, so
    the tag reads "Recorded", no star flies, and the help still shows as a bulb
    mark in the recap.

    **The streak chip** (`DictationStreak`, beside the audio controls) counts
    sentences in a row finished without Show the word. It appears from two and
    goes up as a sentence is finished; with the pointer on Show the word it
    warns "You'll break the streak", and pressing it makes the chip shake, go
    grey and count down to zero before it leaves. Giving up, switching Dictation
    off and retrying the lesson end it too. LessonSession keeps the count
    (`helpFreeStreak`), fed by the outcome's `helps`. Give up hands this one sentence to the normal typing view, which
    carries on from what was typed (`dictationTypedPrefix` →
    `useTypingEngine`'s `initialTyped`), keeps the words already missed for Fix
    Your Mistakes, and does not count as a dictated sentence for quests; the
    next sentence is Dictation again. Switching the Dictation switch off in the
    middle of a sentence carries it over the same way instead of losing it.
    Letters are reported to the lesson as they are typed (`onCorrectLetter` /
    `onErrorLetter`, like the typing view), so the outcome tells the lesson
    not to add them again (`lettersReported`). A finished sentence stays in
    place filled in, with a "Perfect!" (no wrong letter, no peek) or "Well
    done!", one to three stars, the number of wrong letters, a bulb mark when
    the word was shown ("Help × 2"), the translation, **Continue** and a small
    **Retry sentence** button. Retry types the same sentence again as practice
    (fresh blanks, the audio again): nothing is at stake, so there are no stars,
    price or streak chip, the letters sound as usual but are not added to the
    lesson's tallies, and Give up simply moves on. Only the first try is ever
    reported (`finishWithFirstTry`) and the panel keeps showing it; a clean
    practice try plays the celebration sound once, as in the exam. A clean run
    plays the sentence-complete sound straight away; otherwise Continue plays
    it.

  - _Whole sentence_ (the option off): the learner types the sentence and
    checks it with Enter (`src/lib/features/dictation.ts`): case- and
    punctuation-insensitive, typos are "close", misses go to Fix Your Mistakes.
    This deliberately doesn't use the per-keystroke engine, which would let a
    learner guess letters of a hidden sentence — it is the exam.

  The correction screen (whole-sentence Dictation and From memory) shows the
  correct sentence large with each missed word as a chip and its wrong letters
  underlined (typed and correct line), Enter or **Continue** moves on, and **Try again** lets the learner retype the same
  sentence as often as they like: only the first attempt is scored and
  recorded.
  Dictation keeps the typing view's own frame (same text size, audio controls,
  Stories header, Conversation bubble) instead of a card of its own: the
  sentence is drawn in place with a blank under every letter, and there is no
  answer box. When the switch is turned on, a quick wave (about half a second)
  drops every letter onto its line while the blank draws itself out (only for
  the sentence on screen at that moment; a new sentence just draws its blanks
  in, never flashing its text). The learner types straight onto the blanks: a
  cursor bar glides along them (it is the current blank's own line turned on:
  same ends, thickness and height as the line it sits on, measured every frame
  while a word grows under the pointer or while it is spoken, with that one
  line hidden underneath, see `useCursorBar`) and each typed letter appears in its slot, word
  by word, and (whole sentence) nothing is said about whether it is right until
  Enter. The real letter is only ever painted by that opening wave and by Show
  the word: an erased letter fades out as the learner's own (wrong) letter,
  never as the correct one. The system
  decides where words end (`applyDictationInput`): a word that has received all
  its letters hands over to the next one by itself, right or wrong, so the
  learner never types the space and can't type more letters than a word has
  (a space or hyphen typed early just moves on; punctuation is ignored; edits
  anywhere but the end of the answer are ignored; Backspace over the automatic
  hand-over also takes the word's last letter). With Show word-length blanks
  off nothing is enforced. Punctuation and apostrophes stay printed between the
  blanks. While the sentence is hidden, hovering a word only lights its blanks
  up, and tapping it says the word (Normal and Stories, from the same clips,
  loaded by the same rolling window, as the typing view — see
  `docs/word-audio-loading.md` — so a tap plays from memory; if a never-generated
  clip takes more than 2.5 seconds the browser's own voice says it so a tap is
  never silent). Turning **Show word-length blanks** off leaves the area empty and
  only echoes what has been typed. Checking an answer where every word is right
  plays the same sentence-complete sound as finishing a sentence by typing (and
  Continue then stays silent instead of playing it again). From memory shares
  the correction screen, Enter handling and Try again.

- **Streak freeze** sits on top of the existing free one-missed-day grace: each
  _extra_ consecutive missed day spends one freeze from the month's balance,
  otherwise the streak resets as before (`src/lib/features/streak-freeze.ts`).
- **Quests** are dealt per learner per local day, deterministically, from the
  achievable part of the pool; progress + XP payout happen atomically in
  `add_quest_progress`.
- **Badges** are retroactive: stats come from existing history via
  `badge_metrics()`, so the first evaluation awards what past progress earned
  (a flood collapses into one summary line).
- **Daily session** reuses the fill-in-the-blank review screen
  (`WordReviewSession variant="session"`); each word is recorded on the ledger
  of the source it came from (`src/lib/features/session-completion.ts`), and
  the XP is paid once per day (`complete_daily_session`).
  Every word is meant to be spoken in the Word Lists voice
  (`tts_settings.default_pronunciation_voice_id`), whichever source it came
  from. The page only does a cache-only lookup of each word's clip
  (`lookupWordListVoiceAudio`); words without one are generated right after the
  response is sent, and a background job
  (`.github/workflows/session-word-audio.yml` → `/api/cron/session-word-audio`)
  keeps a clip ready for every word learners have in their mistakes, recall and
  saved-card queues. Speech is never synthesized while a learner waits (this
  backend is too slow for that); a word that still has no clip falls back to
  the browser voice rather than staying silent. Whether synthesis works on the
  deployed site is visible in that workflow's run output.
- **Saving words** is offered only for words worth studying: pronouns,
  demonstratives, articles, numbers, names, be/have/do forms, modals,
  prepositions, conjunctions, common function adverbs and contractions get no
  star (`isWordWorthSaving`, also enforced when saving). In Normal lessons the
  words that can be saved carry a dotted underline.
- **Personal cards** review on the same 1/3/7/16-day schedule as mistakes;
  **Export for Anki** downloads a tab-separated file with Anki import headers.

## Local development

With no Supabase project linked there is no settings row. Set
`FEATURES_DEV_ALL_ON=true` (non-production only) to switch every feature on as
a guest, which is enough to exercise Dictation and From memory offline. The
account-only features need a real signed-in session.
