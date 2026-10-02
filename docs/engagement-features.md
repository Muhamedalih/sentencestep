# Engagement features

Eight optional learning features, all controlled from **Admin → Features**
(`/admin/features`, full admins only). The code default is **Off** for every
feature (no settings row, or an unreadable one, means nothing shows). The seed
migrations below move the settings row to **Admin preview** (the first seven in
`20250321…`, Smart word practice in `20250325…`), so on the live site only
admins see anything until a feature is set to **On**.

| Feature                  | Where it appears                                                    | Sections (admin matrix)       | Guests         |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------- | -------------- |
| Dictation                | "Dictation" toggle under the lesson title                           | Normal, Stories, Conversation | works          |
| From memory              | Button on the lesson-completion screen                              | Normal, Stories, Conversation | works          |
| Personal word cards      | Star on the current-word label, `/learn/cards`, Anki export         | save star: Normal, Stories    | sign-in prompt |
| Daily session            | Card at the top of Home, `/learn/session`                           | global                        | sign-in prompt |
| Daily quests             | Card on Home, quest lines on the completion screen                  | global                        | sign-in prompt |
| Badges                   | Completion-screen celebration, `/learn/achievements`, header trophy | global                        | sign-in prompt |
| Streak calendar & freeze | 7-day strip on Home (tap for the month)                             | global                        | sign-in prompt |
| Smart word practice      | Word Lists: practice, library cards, "Review All Words"             | global                        | upgrades work  |

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
8. `20250323000000_word_mastery.sql` (Smart word practice: the per-learner
   `word_mastery` table and the `record_word_review` function)
9. `20250324000000_word_accepted_answers.sql` (Smart word practice:
   `vocabulary_words.accepted_answers`, seeded with the common British
   spellings and synonyms; admins edit it per word in Admin → Word Lists)
10. `20250325000000_feature_settings_smart_words.sql` (puts Smart word
    practice in Admin preview; only runs while the settings document says
    nothing about it, so a choice an admin saved is never overwritten)

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

- **Smart word practice** upgrades the Word Lists screens (the practice screen,
  the library and "Review All Words"). It is one switch,
  `FEATURE_IDS.smartWords`, resolved to two flags (`resolveFeatures`): `enabled`
  (the practice upgrades below, which also work for a guest) and `spaced` (the
  part that stores something per learner, which needs an account). With the
  feature Off for a visitor every screen is exactly what it was before.
  **Rolling it out is one click: Admin → Features → Smart word practice → On**
  (or leave it in Admin preview while it is tried; _Premium only_ works as for
  the others). Nothing else needs changing: every check reads the same resolved
  flags (`getSmartWordsAccess`).

  - _The schedule_ (`src/lib/word-mastery/schedule.ts`, mirrored statement for
    statement by `record_word_review` in SQL): every word gets a **strength
    0-5** and a due day, the learner's own calendar day (the `ss_tz` cookie, so
    "tomorrow" is tomorrow morning where they are; UTC until the cookie
    exists). A clean answer on a due word climbs one step and pushes the next
    review out **1 / 3 / 7 / 16 / 30 days**; a miss sends it back to 0, due
    tomorrow; a word that needed one hint holds its step (a second hint counts
    as a miss, see below). Practising a word
    that is not due yet leaves its schedule untouched (repeating a group five
    times in an afternoon cannot walk it to "mastered"), except a miss, which is
    always recorded. Strength 5 means the 30-day review has been passed.
  - _Two ledgers move together_ (`planOutcome`, pure and tested): the schedule
    above, and the weak-word ledger (`mistakes`) that Review All Words, Fix Your
    Mistakes, Home and the daily session still read. **A word missed during a
    visit is no longer wiped by typing it right 20 seconds later**: a miss puts
    it in the weak list, typing it right afterwards only _corrects_ it (due
    again tomorrow), and it leaves the list the way every other mistake does,
    by passing its reviews. The client reports each word once, through
    `recordWordOutcomeAction` (`clean`, `assisted`, `missed` the moment it
    happens — a wrong answer, "I don't know" or the second hint — and
    `recovered` after a miss). The action re-checks the gate on the
    server, never trusts the client for the account, and does nothing (returns
    `null`) for a guest, with the feature off, or before the migrations are
    applied.
  - _Typing engine_ (`useWordTypingEngine`, shared by the practice screen and
    the review session): **letters typed while a right answer is settling are
    kept for the next word** (and end the wait early), so there is no dead zone
    between words; **Enter skips the missed-word screen** once the right
    spelling has shown, and the missed-word pauses are shorter (`SMART_TIMING`:
    1.2 s for the right spelling), since nothing typed in the meantime is lost
    any more. A right answer is the opposite: its pause is the celebration, so
    it lasts 700 ms (and its pop 0.4 s) instead of 350 ms, and a learner who is
    already typing the next word still ends it at once. Matching ignores case
    and accents.
    **Also-correct answers**: a word can list extra accepted answers (British
    spellings, synonyms that fit the sentence), typing one counts exactly like
    the stored word and says "also correct: …" (`word-lists-answer.ts`). The
    word does not settle while the learner may still be typing a longer
    accepted answer ("colo" on the way to "colour").
  - _Help that costs something, like Dictation_ (`WordHelpBar`, the
    `DictationHelp` bar without its label): the stars, **Hint** and **I don't
    know**, centred under the sentence, nothing moving when the word settles
    (the buttons dim instead of leaving), and pressing a button never takes the
    typing focus. **A hint is the next right letter, wherever the learner has got
    to** (`planHint`, pure and tested): the letters that are right stay, anything
    typed after the first wrong one is taken away, and the right letter goes in
    — two right letters → the third; three right, then wrong ones → the wrong
    ones go and the fourth takes their place; nothing typed → the first letter.
    While a learner types an accepted alternate ("gre"), the hint follows that
    alternate ("grey"). It is drawn as a repair of one second: the wrong letters
    go red, shudder and crumble away (the last typed first) as the star flies
    off, then the right letter is restored in its place with a flare of the
    accent colour (`StageLetter`) and the word glides to its new centre. Keys
    pressed meanwhile are kept and added afterwards; Enter waits. As many hints
    as wanted, one at a time. Stars are live and are the same steps that decide
    the schedule: **3** for a clean answer, **2** after one hint (the word holds
    its step), **1** after a wrong answer, "I don't know" or a **second hint**
    (the word counts as missed and goes back to 0 — it was not recalled), and
    from then on hints only show as "recorded". The summary shows each word's
    stars and how many were right first time.
  - _Audio and meaning_: as in the original screen — the word is spoken when it
    appears (Shift says it again) and its meaning is shown at once. (A
    Recall / Listen & type switch was tried and removed: the two exercises
    felt the same.)
  - _Continue_ (`selectContinueWords`): a group's **Continue** no longer starts
    at word 1. It asks the words that are due (weakest first), then the words
    the learner has not met in the group's own order, at most 20 per visit;
    words scheduled for a later day are skipped. A group with nothing due shows
    a short "all caught up" screen (it says when the next word falls due) with
    **Practice all** (`?scope=all`), which still records misses but leaves the
    schedule alone for words that are not due. The expanded group card also
    offers it as a button under Learn / Continue, labelled "Review the whole
    list" (not "Review all words", which is the global hero).
  - _A visit keeps the words it opened with_ (`VocabularyPractice`,
    `practiceVisitKey`). The practice page is rendered again after every answer:
    each answer is reported with a Server Action that calls `revalidatePath`, and
    Next answers a revalidating Server Action with a fresh render of the page it
    was called from (whatever path was revalidated). A Continue list is worked
    out from the schedule those answers change, so the list shrinks under a
    running visit. A screen that followed it moved to another word while the
    learner was typing, spoke that word, and never asked the words it jumped over
    (driving a 20-word group in a browser: four jumps and five words never asked).
    So the practice copies the page's props once — the words, whether it is the
    upgraded practice, and the "all caught up" outcome — and ignores later ones;
    the page gives it `key={practiceVisitKey(group, scope)}`, so another group or
    **Practice all** starts a fresh visit and a re-render of the same one does
    not. Because "all caught up" is decided by that same copy, the page's last
    render after the final answer cannot replace the finish screen with it.
  - _Audio follows the word on screen_ (`PronunciationButton`): the practice keeps
    one button in its header for every word, and Server Actions run one at a time
    in the browser, so a clip that was still being fetched or made when the
    learner moved on can arrive seconds late. It is dropped when it does (and not
    remembered as the new word's clip), instead of saying a word that is no
    longer there.
  - _Library and review_: each group card shows a **progress bar** (the share of
    the group's words the learner has finished at least once: 10 of 20 reads
    50%; how strong they are shows in the due / new badges, not in the bar). The
    review hero's number — on Home and in Word Lists alike, both through
    `reviewWaitingIds` — is the words due on the schedule plus the weak words
    that are up for review _now_ (an unfixed mistake, or a corrected one whose
    day has come), each once. A corrected weak word still waiting out its
    interval is not counted or asked until its day (`WeakWordItem.dueNow`).
    "Review All Words" asks that same set, 12 at a time, weakest first
    (`buildSmartReviewQueue`), and says how many more are waiting.
  - _Shift replays the word_: `registerReplay` hands back its own un-register,
    which only clears the shortcut while it is still that button's replay. The
    block summary mounts a button per word while the header's is registered;
    the summary leaving last used to wipe the shortcut for the whole next block.
  - _Admin_: Admin → Word Lists → a group's words have an **Also accepted
    answers** field per word (comma- or line-separated, up to 8, plain words
    only; `validateAlternates` names anything it rejects). The field appears only
    once migration 9 is applied; before that the editor is exactly as it was.
  - _What it deliberately does not do yet_: Home and the daily session still
    pick words from their own sources (the due queue is not wired into them).
    Word Lists practice has never paid XP or counted toward the streak, and the
    schedule does not change that. The one thing credited is the "Master N
    words" quest, and only when a word actually climbs a step, so it cannot be
    finished by retyping easy words.

## Local development

With no Supabase project linked there is no settings row. Set
`FEATURES_DEV_ALL_ON=true` (non-production only) to switch every feature on as
a guest, which is enough to exercise Dictation and From memory offline. The
account-only features need a real signed-in session.

Smart word practice's upgrades (type-ahead, hints, "I don't know",
also-correct answers) work as a guest with that switch,
but its schedule, Continue and the due queue need a real signed-in session and
the three migrations above. The schedule's rules are covered without a database
by `npm run test:word-mastery`; the SQL function is a mirror of them (see the
header of `schedule.ts`).
