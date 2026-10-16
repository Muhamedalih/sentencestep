# Engagement features

Ten optional learning features, all controlled from **Admin → Features**
(`/admin/features`, full admins only). The code default is **Off** for every
feature (no settings row, or an unreadable one, means nothing shows). The seed
migrations below move the settings row to **Admin preview** (the first seven in
`20250321…`, Smart word practice in `20250325…`, the Word quiz in `20250331…`, Passages in `20250336…`), so on
the live site only admins see anything until a feature is set to **On**.

| Feature                  | Where it appears                                                    | Sections (admin matrix)       | Guests                                                 |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| Dictation                | "Dictation" toggle under the lesson title                           | Normal, Stories, Conversation | works                                                  |
| From memory              | Button on the lesson-completion screen                              | Normal, Stories, Conversation | works                                                  |
| Personal word cards      | Star on the current-word label, `/learn/cards`, Anki export         | save star: Normal, Stories    | sign-in prompt                                         |
| Daily session            | Card at the top of Home, `/learn/session`                           | global                        | sign-in prompt                                         |
| Daily quests             | Card on Home, quest lines on the completion screen                  | global                        | sign-in prompt                                         |
| Badges                   | Completion-screen celebration, `/learn/achievements`, header trophy | global                        | sign-in prompt                                         |
| Streak calendar & freeze | 7-day strip on Home (tap for the month)                             | global                        | sign-in prompt                                         |
| Smart word practice      | Word Lists: practice, library cards, "Review All Words"             | global                        | upgrades work                                          |
| Word quiz                | Stories: a pick-the-meaning question after a target-word sentence   | global (Stories only)         | works                                                  |
| Passages                 | Sidebar item, `/learn/passages` (list) and `/learn/passages/<slug>` | global                        | read and listen work, saving progress needs an account |

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
11. `20250331000000_feature_settings_word_quiz.sql` (puts the Word quiz in
    Admin preview, same rules as 10; skipping it is safe, the feature just stays
    Off until Admin → Features → Word quiz is set to Admin preview)
12. `20250335000000_passages.sql` (Passages: the four tables, their RLS and
    the `record_passage_progress` function)
13. `20250336000000_feature_settings_passages.sql` (puts Passages in Admin
    preview, same rules as 10)
14. `20250337000000_passage_admin.sql` (Admin → Passages: `passage_speaker_voices`,
    one voice per character behind admin-only RLS, and the `say` / `pause` columns
    of `passage_sentences`). Apply it BEFORE deploying the code that reads it
15. `20250338000000_passage_backgrounds.sql` (Admin → Passages background pictures:
    the `poster_url` and `background_url` columns of `passages` and the public
    `passage-backgrounds` Storage bucket, WebP only). Apply it BEFORE deploying the code
    that uses it (the upload writes the two columns; it is already applied to the live project)

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
    each turned-away letter is counted (as an error in the lesson's accuracy;
    **a letter wrong three times at the same blank costs a star** — two slips
    at a letter are free, `dictationMissStarsLost`), shows in red on its blank, plays the
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
    and nothing is counted. Stars are `capacity − helps − stars lost to wrong
letters` (`dictationStars`). Wrong letters alone never take the last star;
    **the word shown at the last star spends it, once** (`spent`): the star
    flies, the stars are wiped away and "No stars" replaces them for the rest of
    that sentence. Show the word stays pressable after that (the tag reads
    "Recorded", `hintStaysOpen`) — a learner stuck at a blank has no other way
    past it than Give up — and still shows as a bulb mark in the recap.

    **Gift stars.** A sentence starts with 3 stars (`capacity`). Every three
    sentences in a row finished (first try) without using any star — no word
    shown, no letter wrong three times at one blank — earn one **gift star**
    (`advanceDictationGift`): from then on every sentence of **this lesson**
    starts with 4, and three more such sentences make it 5. Five is the ceiling
    (`DICTATION_MAX_STARS`); gift stars are never taken back, belong to the
    lesson only (LessonSession's `giftState`; retrying the lesson clears them,
    and the next lesson starts at 3), and a sentence that used a star, a give-up
    or switching Dictation off starts the run over. The recap shows a bonus
    chip: the run so far ("No stars used: 2 of 3 for a bonus star") or the gift
    just earned.

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
    done!", its stars (three to five, or none), the number of wrong letters, a bulb mark when
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
    pressed meanwhile are kept and added afterwards; Enter waits. One at a
    time, and every hint costs a star. Stars are live and are the same steps that
    decide the schedule: **3** for a clean answer, **2** after one hint (the word
    holds its step), **1** after a wrong answer, "I don't know" or a **second
    hint** (the word counts as missed and goes back to 0 — it was not recalled).
    The hint taken at that last star **spends it** (`WordAttempt.noStars`,
    `withHint`): the star flies, the three stars are wiped away, "No stars"
    replaces them and the Hint button is closed for that word for the rest of the
    visit (`canTakeHint`) — it has to be typed, or given up on, and a wrong answer
    or "I don't know" brings it back later in the block as always. The word is
    exactly as missed as before; only the help is gone. The summary shows each
    word's stars (never fewer than one) and how many were right first time.
  - _Block summary_: after every five words, a one-screen list (compact header,
    tight rows, button in the flow — no scrolling on a normal window). Each row
    has a **Practice** button that opens a free practice of just that word
    (`VocabularyWordDrill`): same screen, no stars or hints, nothing written to
    progress, the weak list or the schedule; a wrong answer shows the spelling and
    lets the learner try again, a right one (or Back) returns to the summary.
  - _Audio and meaning_: as in the original screen — the word is spoken when it
    appears (Shift says it again) and its meaning is shown at once. (A
    Recall / Listen & type switch was tried and removed: the two exercises
    felt the same.)
  - _Continue_ (`selectContinueWords`): a group's **Continue** no longer starts
    at word 1. It asks the words that are due (weakest first), then the words
    the learner has not met in the group's own order — **all of them, no cap**
    (groups are 20–30 words and the practice already stops after every five); words
    scheduled for a later day are skipped. A cap of 20 used to end a 25- or
    30-word group early with a "finished" screen and open again with five words
    left; the finish screen also reports the whole group's progress now
    (`groupWordIds`), not just the visit's. A group with nothing due shows
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

- **Word quiz** (Stories only) asks one quick question right after a story
  sentence that holds one of the story's target words (the same words as the
  "words from this lesson" screen, at most three per story): the word with a
  listen button (the story narrator's clip), four Arabic meanings, keys 1-4.
  A pick turns green or red, the wrong options dissolve, and the story carries
  on by itself. Nothing is authored for it: the right answer is the target
  word's own gloss and the wrong ones are other stories' target-word glosses
  of the same kind and level, chosen deterministically (`buildStoryWordQuiz`
  in `src/lib/content/story-word-quiz.ts`, covered by `npm run test:content`).
  It needs no database change (the migration above only seeds Admin preview) and has
  no effect on XP, accuracy or progress.
  The lesson page builds the questions only when `getEffectiveFeatures()` says
  the feature is open for the visitor (Off: nobody; Admin preview: admins;
  On: everyone, _Premium only_ as for the others), so a closed feature ships
  nothing to the browser. Arabic only for now: story target words have no
  Spanish or Turkish gloss yet, so those learners get no quiz.
  **Rolling it out is one click: Admin → Features → Word quiz (Stories) → On.**

## Passages

Short real-life scenes (funny, serious, inspiring) a learner listens to and reads
part by part: each part is a handful of lines (a narrator, or a named character
with their own voice) followed by one quick question whose answer is always in
the text; at the end the passage's own words are handed over as a word lesson.
Nothing is typed — Stories and Daily Lessons are about producing the sentence,
Passages are about understanding it. Arabic support language only for now.

- **The reader** sets a part's text as a flowing paragraph (a character's name
  in front of their lines, in a colour of its own), so a part fits one screen.
  While a part is read aloud the sentence being spoken has a soft band behind it
  that fills along the sentence as the voice reads it (one continuous ribbon even
  when the sentence wraps; `--passage-p` is written from the audio clock, not
  React state) — never a change of size — with its Arabic twin lit in step when
  the translation is on. The question is not on the page while reading: it rises
  from the bottom as a card when the learner presses **Check yourself** (or
  Enter, like the other check-then-continue screens), the text is **blurred while
  the question is open** so the answer comes from memory, and it clears the moment
  the learner has answered; after a wrong answer the sentence that holds the
  answer is lit green. The buttons share one press feel (`PassageButton`). The list shows
  each passage as a poster card whose gradient comes from its tone and number
  (`src/lib/passages/art.ts`) — no pictures of our own, no tone labels. An admin can give
  a passage a picture of their choice instead (see "Background picture" under Admin →
  Passages): the poster, Home's card and the lock screen then show it, and the reading
  page gets it as a faint backdrop at the top.
- **Listen first and speed** (header controls). **Listen without text** replaces
  a part's text with a play stage until its question has been answered, then
  reveals the text; it is only offered when the part has a clip for every line.
  **Speed** cycles 0.75× · 1× · 1.25× · 1.5× for every clip. These two and the
  translation switch are remembered on the device only (`localStorage`, keys in
  `src/lib/passages/prefs.ts`), never in the database.
  - _Switching listen-only changes the part at once._ While a part is being read,
    flipping the switch stops the voice, returns to the first sentence and reads
    on in the new mode — text to no text and back (`handleSetListenOnly` in
    `passage-reader.tsx`). The switch shows what the part looks like _now_ (so it
    reads "off" after "Show the text") and is held still while a question is open.
  - _The play stage_ (`passage-listen-stage.tsx`) is one round button: a ring
    around it fills with how much of the part has been heard (written from the
    audio clock each frame, outside React, like the highlight), a halo breathes
    while it waits, and its icon turns into the next one (play, pause, spinner,
    "again"). Under it the voice itself is a row of nine sound-wave bars
    (`passage-voice-bars.tsx`, the CSS in `globals.css`): each swings at its own
    height and speed while the voice speaks, they hold where they are when it is
    paused and sit low and dim when it is still. All motion is off under reduced
    motion.
  - _A right answer chimes._ Picking the right option plays a short, soft, rising
    bell chime (`src/lib/passages/chime.ts`, played by `use-passage-chime.ts`),
    synthesized with the Web Audio API like the other sounds — no file to ship.
    It follows the one global sound setting (Admin → Typing sound: off there, it
    is silent; the volume is that slider's), once per question.
  - _Shift says the part again._ The app-wide standalone-Shift shortcut
    (`PronunciationSettingsProvider.registerReplay`) is wired to the part's
    narration from its first sentence, and the keycap pill (`ShiftReplayHint`
    with `showOnTablet`) says so. Both exist only while a part is being read and
    has a clip for every line — not while a question is open, nor on the end
    screen — and the pill shows on laptops and tablets (from 768px wide), never on
    a phone in either orientation (a touch screen under 600px tall counts as one).
- **One question per part, and one closing question per passage.** A part ends
  with a quick check on its own lines (the quickest thing to answer, so the story
  keeps moving). After the last part's check comes a **closing question**
  (`closing` in the seed) about the passage as a whole or an early part of it —
  "Question 2 of 2", the text blurred again, answered from memory — so a second
  retrieval comes late rather than right after the first (a second question about
  the same few lines adds little and costs flow). It is never a repeat of a part's
  question (validated), has no `evidence` line, and after a miss says "the right
  answer is in green" (`notQuiteNoLine`) instead of "look at the lit sentence".
  Stored as the second question of the last part (`storedQuestionsFor` in
  `src/lib/passages/seed-rows.ts`: id `<slug>-p<last>-q2`, `evidence: -1`), so the
  reader, the score and the progress save needed no change.
- **Content** lives in `src/data/passages` (reviewable in a diff, validated by
  `npm run test:passages` — every answer index, evidence line, translation and
  word is checked). `scripts/insert-passages.ts` writes it to the database
  (re-runnable; it never changes a passage's status or Free/Premium, an admin's
  edits to the word lesson or to a character's voice, or a line's clip while its
  English is unchanged). It reads what is already there page by page (PostgREST
  cuts any read at 1000 rows without saying so, and a line it believed was new would
  be written without its clip) and writes only the lines that are new or changed, so
  a clip an admin is narrating while it runs can't be overwritten by its older
  snapshot. The rows it writes come from the pure builders in
  `src/lib/passages/seed-rows.ts`, which the admin's JSON import uses too, so the
  two can't write different shapes. **The right answer
  must not sit in the same place**: the first batch had it as option 1 in nearly
  every question, so the tests now require it to be spread over the three
  positions (a third each, overall and within a level), never four in a row, and
  at least two positions in every passage. Author new questions in any order and
  move the right answer around.
- **Audio** is one clip per line (`passage_sentences.audio_url`), made with
  ElevenLabs from the database — by the Generate buttons of Admin → Passages or by
  `scripts/generate-passage-audio.ts`, which share one implementation
  (`src/lib/passages/narration.ts`, the pure planning in `narration-plan.ts`). It
  reads the admin voice settings but never writes them, and never touches
  Stories/Books audio. A part is only offered for listening when every one of its
  lines has a clip. **One voice reads the story and every character has a voice of
  their own**, chosen per passage (`passage_speaker_voices`; a character nobody gave
  a voice — an email, a sign — is read by the narrator, and the narrator is the
  site's default narration voice until the passage gets its own): two roles never
  share one — the validator refuses it in the data, the admin refuses it in the
  voice picker, and narration refuses to start on a passage set up that way.
  **Small pauses**: a line that calls for a beat — "Suddenly, …", a punchline, a
  reaction, a reveal after a colon — is sent to the voice with one pause written
  into it (ellipses for `eleven_v3`, a break tag for the older models;
  `src/lib/passages/narration-pauses.ts`, about one line in ten). It exists only
  in the request to the voice: the learner reads the line as written, and only an
  admin sees where it falls (small dots between the words in the reader, passed to
  the page only for an admin). A line's own `say` is sent exactly as written; a
  `pause` hint in the data (`"none"`, `{ after: "…" }`, `{ before: true }`,
  checked against the line) places, moves or removes the beat; `--no-pauses`
  turns them off for a run and `--dry-run` prints every paused line as it will be
  sent. `scripts/generate-passage-word-audio.ts`
  makes the pronunciation clips of the word lessons with the Word Lists pipeline
  — the free Edge-TTS voice (default "Emma"), never ElevenLabs. A word without a
  clip is read by the browser's own voice, which sounds poor: run the script
  (it is re-runnable) after adding passages, and again if Edge answers 429.
- **Admin previews are the learner's screen, with no admin bar.** A draft lesson,
  book section or word group is previewed at `/admin/…/preview`, which lives in
  the `(preview)` route group of the admin area (`admin/(preview)/layout.tsx`),
  not in the console (`admin/(console)/layout.tsx`, which draws the navigation
  bar): it gets the learner's frame and the learner's providers
  (`LearnerProviders`, shared with `/learn/*` — the colours, fonts and sounds an
  admin tuned, pronunciation speed and Shift replay) as a guest, so nothing is
  written to the admin's own account. The access check and `force-dynamic` stay
  in `admin/layout.tsx`, above both.
- **Who sees what.** The content tables are closed to learners by RLS; the pages
  read them with the service role _after_ the "passages" switch. Off: nobody;
  Admin preview: admins (a bar at the top of the list says so); On: everyone —
  but a passage a learner can open is also **Published** (a draft is an admin's
  preview, reached by its URL) and, when it is **Premium** (`is_free = false`),
  only for a subscriber or an admin: anyone else gets the lock screen
  (`PassageLocked`, the same card as a locked lesson or word list; `canOpenPassage`
  in `src/lib/passages/access.ts`) and a "Premium" chip on its poster. "Up next",
  Home's card and the end screen's next passage never point a free learner at one.
- **What a subscriber gets.** A Premium passage opens with the same check as every
  other Premium lesson (`hasPremiumAccess`: a paid plan whose period has not ended, or
  the sitewide free-access promotion), so the day the section goes On every active
  subscriber can open all of it — and each word lesson — until their own period ends.
  Nothing has to be granted or migrated, and it ends with the rest of Premium. New
  buyers are told: while the switch is On, the benefit list of `/upgrade` (the plan
  card and the "free right now" card; `premiumBenefits` with `isFeaturePublished`)
  gets one more line, "All Passages…" (`premium.benefitPassages`, in the four
  languages). While the switch is Off or in Admin preview the line is absent, so nobody
  is promised a section only an admin can open. The Home page's Premium section is
  static (no database read, by design) and says nothing about Passages: add the line to
  its `benefits` lists when the section is published.
- **Publishing is one click**: the **Publish to everyone** button on the Passages
  page (admins only, asks twice), or Admin → Features → Passages → On. Either way
  each passage's word lesson — a draft Word Lists group until then, previewable
  from the end of the passage via the admin preview — is published with it, and
  hidden again when the switch goes back to Admin preview or Off
  (`syncPassageWordGroups`, which follows the _saved_ switch and each passage's
  own status: a draft passage keeps its lesson hidden even while the switch is On).
- **Admin → Passages** (`/admin/passages`, full admins only — in the nav and in the
  middleware's admin-only list) is where each passage is run:
  - _Voices for all passages_ (the card at the top of the list; `voice-cast.ts`): the
    characters of the passages speak with a handful of voices (the five the authored
    cast names), so the voices are chosen ONCE for the library — pick another voice for
    one of them and `replaceCharacterVoice` replaces it for every character who has it,
    in every passage (a passage's narrator row is never touched), and the narrator row
    sets `setNarratorForAll` (one voice for the story of every passage, or back to the
    site default). A change that would give one voice to two roles of a passage is
    refused with nothing changed, naming the passages. Narrated lines keep their old
    voice until narrated again ("Redo all" on the passage).
  - _The list_: every passage, drafts included, with its characters, how many lines
    have a clip, and two selects that save on change — **Draft / Published** and
    **Free / Premium** (a Premium passage's own word lesson follows).
  - _A passage's page_ (`/admin/passages/<slug>`): the same two controls; **Voices
    and narration** — the narrator and each character with a voice picker (female and
    male voices, so a man and a woman are easy to tell apart; the same voice twice is
    refused with the reason), per role **Narrate** (the lines with no clip) and
    **Redo all** (after changing its voice: a changed voice never touches the clips
    already made), and **Narrate the missing lines** for the whole passage. A press
    asks first and shows what it costs in ElevenLabs characters; it runs a few lines
    at a time (`generatePassageAudio`, six per round, each call short) with a progress
    bar, skips what it already did, stops at once on a key / payment / quota error and
    leaves any other failed line for the next press. **Nothing is ever narrated unless
    an admin presses a button.** Below the roles, "Listen to the voices" plays a short sample of every registered voice (female and male), and a role's ▶ plays the sample of the voice it has; the samples are made by `scripts/generate-voice-samples.ts` (one short line per voice, with the narration's own model and sliders — run it again after registering a voice).
    **Delete** (only a draft) removes the passage, its parts, lines, learners' progress,
    its own word lesson and its clips from Storage. **Preview as a learner** opens the
    reader, which an admin may open even for a draft.
  - _Add a passage_: paste one passage as JSON (the `PassageSeed` shape of
    `src/data/passages/types.ts`, e.g. `JSON.stringify` of a seed). **Check** reports
    every problem in plain words without saving — the shape, every rule of
    `validate.ts`, a slug or position already taken, a word Word Lists already
    teaches, an unregistered voice; **Add as draft** writes it (draft, free, its own
    draft word lesson, a voice per character from its cast, and takes everything back
    if a write fails half way). A passage authored in `src/data/passages` that is
    deleted here comes back the next time `insert-passages.ts` runs.
  - _Background picture_ (a card on the passage's page, and a small "Picture" column in
    the list — click a poster in miniature to choose a file): the admin picks any
    JPG, PNG, WebP or AVIF (at least 600 px on each side, up to 12 MB) and it becomes the
    passage's background. One upload makes two files (`background-image.ts`, with the
    `sharp` library the app already ships for its image optimizer): the **poster**, cropped
    to 600 × 800 around the most interesting part of the picture, for the Passages list,
    Home's card and the lock screen (`PosterPicture`, over a shade that keeps the white
    number, badge and title readable on any picture), and a **wide** one (up to 1600 px)
    for the soft backdrop at the top of the reading page (`PassageBackdrop`: faded into the
    page, light in both themes, takes no room, so nothing moves for it). Both are
    re-encoded as WebP, turned the right way up and stripped of metadata, so only a clean
    picture is ever stored, and a learner downloads about 50 KB for a poster instead of
    the original. They live in the public `passage-backgrounds` bucket under
    `<passage>/<uuid>.webp` (a new name per upload, so a replaced picture never comes
    from a cache); the old files are deleted when it is replaced, removed or when the
    passage is deleted. Without a picture a passage keeps its generated colours, exactly
    as before. It is a route handler (`POST|DELETE /api/admin/passages/<slug>/background`),
    not a Server Action, because a Server Action may carry only 1 MB; it checks what Next.js
    would check for a Server Action — the request must come from this site (`isSameOrigin`)
    and from an admin.
  - Every change is an audit-log entry (`passage.status_changed`, `access_changed`,
    `voice_changed`, `imported`, `deleted`, `audio_generated`, `background_changed`,
    `background_removed`).
- **Levels**: A1 (fourteen scenes), A2 (fourteen), B1 (eleven) and B2 (ten), written in
  `src/data/passages/{a1,a2,b1,b2}-part-*.ts`. The line-length limit grows with the
  level (`MAX_WORDS_PER_LINE_BY_LEVEL`), the reader sets a longer part in a
  smaller size so it still fits one screen (`textSizeFor`), and a passage's words
  are never words Word Lists already teaches (the insert script refuses a
  clash). The list groups the posters by level; "Up next" and Home's card point at
  the first unfinished passage in list order, whatever its level.
- **B2 is harder, not longer.** It has fewer words than B1 but each is heavier: less
  common vocabulary (circular, contempt, rubble, lease, reluctantly), sentences that carry
  more than one idea (reported speech, the past perfect, relative and participle
  clauses), a register that moves between the everyday and the formal — and its
  questions rarely ask what happened, they ask what it means: what a sentence implies, why
  someone did something, what a word means in its context, what the ending says. Every B2
  question has **four** options (A1-B1 have three). A test keeps the ladder honest: every
  level must have longer words, longer sentences and longer questions than the one below
  it, so a later B2 passage can't quietly be easier than B1. B2's right answer is spread
  over all four options.
- **No lesson is ever repeated** (the user's standing rule). `src/lib/passages/duplicates.ts`
  compares two pieces of content by title (without its article), one-line premise, wording
  (runs of four words), subject (their commonest words) and questions, with limits set
  well above any pair of real lessons. Three places enforce it: a test compares every
  authored passage with every other; `npx tsx --env-file=.env.local
scripts/check-passage-duplicates.ts` compares them also with every Daily Lesson, Story
  and Conversation in the database, the Library's book titles and any passage an admin
  imported — run it BEFORE inserting new passages (exit 1 on a repeat; `--top=n` prints the
  closest pairs); and the admin's "Add a passage" runs the same comparison against
  everything in the database and refuses a repeat, saying what it repeats. It judges
  wording and subject, not plot: a story told in other words still needs a human who has
  read the neighbours first. When it was introduced it found two passages whose titles
  were the title of a Story, now renamed (slug and id unchanged): "The Quiet Neighbor" →
  "The Man Who Never Said Hello" and "The Wrong Number" → "A Seat at the Table".
- **It counts toward what the app already has** (`src/lib/passages/engagement.ts`,
  run by `savePassageProgressAction` after the learner's place is saved, all of it
  best-effort — a failure in any of it never costs a learner their progress):
  every finished **part** moves the daily quest **"Finish passage parts"**
  (`QUEST_TYPES.passages`, default 3 parts for 15 XP, tunable in Admin → Features;
  dealt only to a learner Passages is open to); it counts as learning activity for
  the **streak** (the same `planStreakForCompletion` a lesson uses, freezes
  included, moved to `streak-service.ts`) and marks the day on the streak
  calendar without adding sentences or XP; and finishing a **passage** earns the
  event badges **Page Turner** (first), **Bookworm** (5) and **Story Lover** (10),
  which stay off the Achievements shelf until Passages is open to the learner. The
  learner's own date comes from the browser and is only believed when it can be
  somebody's today (`plausibleLearnerDate`). A quest or badge a part earns shows
  as a short notice the moment it happens and on the end screen.
- **Home card** (`PassagesCard`, loaded by `loadPassagesHomeCard` as one more
  streamed slot next to the session and quests cards): "Continue your passage"
  with how far the learner is, or "Your next passage" — the same poster the list
  uses. Not drawn when Passages is not open to the visitor, for a guest, or once
  every passage is finished.

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
