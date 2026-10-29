# New Home page (Today first)

Home as one calm screen built around **Today's session**: the greeting, Today's three tasks beside the
learner's own lesson, and one card, **«اختبر نفسك في دروس اليوم»** ("Test yourself on today's lessons"),
under them. It replaces, for the people it is open to, the quests strip, the streak card, the passage
card, the three-card grid and (for admins) "Today's plan". Designed in the Home restructure round of
2026-10-23 (option 4 of the owner's pick: the self-test as the one card that takes the place of the
three small cards).

## Switch

- **Permissions → "New Home page (Today first)"** (`newHome`, `src/lib/rollouts/catalog.ts`): starts
  **Admins only**; an admin can open it to specific people, a share of learners, or everyone.
- It is closed whenever `todaySession` is closed (`withRolloutDependencies`): the page is made of
  Today's tasks. The self-test card additionally needs the Sentence bank (`sentenceBank`): it is on
  the page from the first moment, locked until the three tasks are done (see below), and opens only
  when a test quest was dealt (never an empty open card).
- `showsNewHome` (`src/lib/today/home-layout.ts`) is the whole decision: signed in, `newHome`,
  `todaySession`, the day's cards started (a browser's very first visit has no time zone cookie yet, so
  the current Home is drawn that once) and not `?classic=1` (the owner's way back to the current Home).
  A guest keeps the current Home.

## What is on it

`src/app/(app)/learn/(dashboard)/page.tsx` draws `HomeToday` (`src/components/home-today/home-today.tsx`,
a Server Component) instead of the current layout; every part that needs the day's data streams in by
itself through its own `<Suspense>` slot (the quests and the week come from `startHomeEngagement`, as
for the current Home):

- **Top bar** (`top-bar.tsx`): avatar ringed with today's goal, «مرحبًا بعودتك», the name and the three
  totals (words, lines, sessions) as one small line; on the right the **review button** (words waiting,
  links to `/learn/word-lists/review`; the review itself stays in Word Lists) and the **week** (flame,
  seven dots, freezes left). Tapping the week opens, right under it, the streak card of the current Home
  (`StreakStrip`: weekday letters, freezes, the month) — nothing of the streak calendar was lost.
- **Today's box** (`today-box.tsx`): the ring and the reward in the heading, the three tasks as quiet
  rows without frames (only the task in progress is lifted and carries the page's one solid button), a
  calm "Redo today's lessons" line once the day is done. The words task carries a small **typing hint**
  (a field with two letters typed, a blinking caret, three still to type, and «تكتب كل كلمة بنفسك») so
  it reads as writing practice; it names no word and the caret stops for reduced motion.
  Three permissions shape the box (all Admins only until opened): `dailyRule` adds the rule of the day as
  the LAST row, after the words, titled «اختم اليوم بالقواعد» (end the day with the rules) and drawn like
  the tasks (its meta: «قاعدة اليوم», the level, the minutes; lifted with «ابدأ القاعدة» once the three
  tasks are done). The row teaches the rule from the story finished today when that story has a ladder
  (`ruleRowTarget` in `lib/daily-rule/home-row.ts`), else from the learner's own finished texts; the story's
  finish screen has no rule button any more. `todayCover` draws the listening task with its passage's poster
  (the same colours and picture as the Passages list) in place of the headphones. `todayRepeat` gives each
  task a small repeat button (it opens that lesson again, in redo mode once the task is finished today) and
  lifts and presses the rows like buttons. The rule row has the same button: once today's rule is answered it
  runs today's rule session again (the card of the rule first seen today, the questions on the rules reviewed
  today; nothing is recorded). A due earlier-rule question also comes at the END of Today (after
  the words, from `/learn/today/go`), never before the first task.
  The rule row also carries the rule library's pill («قواعدي · N», from the first rule met): it opens
  `/learn/rules` (under the same `dailyRule` permission; a menu item from md: up too), the whole course as a
  page of cards like the Stories section (`rule-tile.tsx`, up to four across on a wide screen, a row on a phone):
  one tab per level the learner is on (A1, A2–B1, B2; an admin has all three), each split into units, the rules
  due today first; a rule met has a green ribbon, the rule that opens next is marked and the ones ahead have no
  idea and no link; each rule met opens as the same two pages (on the dashboard's black background), with a
  practice of three sentences (`/learn/today/rule?practice=<id>`, nothing recorded).
  The course is `lib/daily-rule/syllabus.ts` (150 rules in the order they open: A1 45, A2–B1 60, B2 45; the
  units are `units.ts`; what each rule teaches is `teach.ts` and the files of its level, with six prepared
  sentences each). One new rule a day: the next one in order, but one of the next three comes first when the
  learner's own text shows it (three sentences or more; never more than two rules may stand ahead of the first
  one not met), and otherwise the next rule is taught from its prepared sentences, so the course goes on whatever
  was read. Once every rule of a level is met the course goes on to the next level (`teachingLevel` in
  `levels.ts`); the rules of other levels that were met are still asked when due. A visit asks up to four
  earlier rules (`RECALL_LIMIT`), from the learner's finished texts or, when they do not show the rule, from
  its prepared sentences; five rules due at once pause the new rule for a day (`RULE_CATCH_UP_DUE`). A prepared
  sentence has a recording only once one is stored under the default pronunciation voice (`withPreparedClips`
  in `load.ts` only looks it up); until then its question is silent and shows none of the sound controls.
- **Lesson card** (`lesson-card.tsx`): the learner's daily lesson as the page's one full-picture card,
  with a quiet glass button; same lesson logic and states as the lessons card of the current Home
  (continue / resume / start, free lessons finished, everything finished). It has the **same springy
  hover as the cards of the current Home** (it rises 8px and grows 5% with a soft overshoot, 380 ms;
  nothing moves for reduced motion). Learners on the free plan keep the "Starter lessons 3/4" counter
  under it.
- **Self-test card** (`test-card.tsx`; since 2026-10-24 it sits at the FOOT OF TODAY'S BOX, where the weekly test used to be; the weekly test is now the card under the two boxes — owner: "swap the daily and the weekly test"): brand-tinted surface, a round mark, one small segment per
  question, an outline button (so the page keeps one solid button); done, it becomes a calm tick. It is
  about **Today's passage and story** (a line each, typed from memory), not earlier days — see
  `docs/sentence-bank.md`; its screen is one card in the middle of the viewport. **Locked state**
  (owner, 2026-10-24: "show it from the start, a little blurred, with a short line that says finish the
  daily tasks and it opens, to push the learner to finish them"): until all three tasks are done the
  card is there from the first moment — the same card and the same box (so the page fits the same),
  slightly blurred (the shared `LOCKED_CARD_BLUR` of `today-tasks.tsx`: `blur-[1.4px]`, 70% opacity — the SAME blur as the locked weekly card, which the owner cut to 40% of its old 3.5px), not a link, with one crisp line and a lock over it
  (`today.testLocked`, four languages). It is drawn whether or not a test row was dealt yet, as long as the
  day can have a test (`sentenceTestAvailable`) and the page is Today's; once the tasks are done it is
  the open card when a test was dealt, else nothing. The rule is `testCardState` in `home-layout.ts`.

**Size** (owner, 2026-10-23: "the two boxes are small, there is a lot of empty room"): on a screen with
room — at least 1024px wide **and** 720px tall, the `roomy` variant in `globals.css` — the page widens
(`max-w-7xl` instead of `max-w-5xl`) and Today's box and the lesson card scale up: bigger titles, task
names, notes, buttons, icons and ring, more padding (about 530px tall against 400px). A shorter screen
keeps the compact layout exactly as it was, so the two boxes still fit its first screen (a 1536x864
laptop has about 734px of viewport and fits them; the self-test card is under them). The boxes are as tall
as their content and no taller: stretching them to the screen would only put more emptiness inside.

Left out on purpose: the glow around Today's box, the passage card (the passage is Today's first
task; Passages stay in the menu), the three-card grid, the weekly test line (held), the "Today's
session" card of the old Daily session feature.

## Reads it avoids

When the page is going to be drawn, the reads only the current Home needs are not made:
`startHomePassagesCard({ skip })`, the admin plan's words (`loadHomePlanWords`) and the old Daily
session summary (`startHomeEngagement({ skipDailySession })`).

## Naming

The day's test used to be called «امتحان اليوم» ("Today's exam"). The owner found the word not
motivating, so the learner-facing strings are now «اختبر نفسك في دروس اليوم» / "Test yourself on
today's lessons" (card, row, quest label), «ابدأ الاختبار» (start), «اختبر نفسك» (the header of the
review screen), «انتهى الاختبار» (finish) and «اختبار الأسبوع» (weekly), in the four locales. Code,
tests and this folder's other documents still say "exam" in places.

## Checking it

There is no signed-in learner in a local run without Supabase, so the page itself cannot be opened
there; the components are rendered with fixtures from a throwaway route (see the Home restructure
notes): `HomeToday` with resolved promises for the quests and the week, inside the dashboard chrome,
in light and dark, on a laptop and a phone, in the states fresh / mid / done, test ready / done / none,
free plan and the week opened.

## Today's five words (2026-10-24)

The words task is made of the day's own words and nothing else: the target words of **today's story**
(two or three) and, for the places left of the five, those of **today's passage** — "today's" being the
two Home's tasks box shows (the ones finished today, else the ones open next: `loadTodayLessonIds`), so
the words are the same whether the lessons are read yet or not. Never a word of the Words section, a
review schedule, a mistake or a saved card; too few words make a shorter round, none go on to the
finish screen. "5 more words" on the finish screen is the same day's words the first round left
(`sessionLeftovers`), and is offered only while there are some. Code: `src/lib/today/session-words.ts`
(pure), `session-words-load.ts`, `buildTodayWords` in `features/daily-session-service.ts`.

## When nothing is left to open (2026-10-26)

A free learner has exactly eight days of Today (the free passages and stories: 8 and 8 on 2026-10-26),
a Premium one far more. Once every passage and story open to the learner is finished, and none was
finished today, the day has no passage, no story and — because the words step asks the day's story and
passage words only — no words step either (the plan used to keep it alive from the Word Lists, which
sent the learner to an empty "session over" screen). The new Home then draws `TodayEndCard` in the
tasks box's place (`payload.todayEnd`, decided by `todayEndInfo` in `src/lib/today/end-state.ts`): a
free learner is told they finished the starter passages and stories, with the starter-lessons card's own
line and a quiet link to the plans; a Premium learner, that new ones will appear, with a link to the word
lists. It never says "finished" for a catalog that was not read (an empty list is a failed read). The
weekly test card keeps its place. The current Home is unchanged (it draws the usual quests card).

`/learn/today/end` is for sessions that happened: with no story or passage finished today and no words
round just typed (the words step adds `?words=1`) it goes home instead of recording the day.

## Home polish (2026-10-30)

Permission **`homePolish`** ("Home: big totals, one accent colour, one clear step"; Admins only by default, closed whenever `todaySession` is closed). It came out of a side-by-side of this Home with another learning site's Home: ours was the clearer, calmer one, but its three totals were the smallest text on the page, three places still used the amber accent, and once the day was done nothing on it was the one solid next step. Four changes, all behind this one switch:

- **The totals as numbers** (`top-bar.tsx`): from `xl` up (1280 px; below it the small line stays, so the row never wraps) the three totals (words, lines, sessions) leave the small grey line under the name and sit in the empty middle of the top row: number 22px bold, label 12.5px muted, 40px between them, 66px after the name. The row is 54px tall instead of 66px (measured at 1534 wide). `mobilePath` still hides the small line below `md`.
- **One accent colour**: the goal ring round the avatar (`InitialsAvatar` `ringTone="primary"`), the saved-sentences bookmark in the header and its count badge (`app-header.tsx`, every page under /learn) use the site's brand colour instead of the amber accent; the bookmark is a grey outline, the badge indigo. The streak flames stay orange.
- **One clear step** (`test-card.tsx`): the open self-test card (all three tasks done, test not taken yet) carries the page's one solid button (`bg-primary`); the locked card, the retake button and the done card keep the outline.
- **The review button names the visit** (`ReviewPill`, `reviewVisitSize` in `src/lib/today/home-layout.ts`): where Smart word practice caps a visit (`REVIEW_SESSION_WORDS`, 12) and more words wait than that, the button reads "Review 12 words now | of 160 ready" (`lesson.reviewVisitNow`, `lesson.reviewVisitOf`, four locales); otherwise it keeps the chip with the count. It opens the same page with the same words.

Checked with a throwaway fixture page (the real top bar, review button, self-test card and header, with the permission off and on): computed colours, sizes and the 1280 / 1534 / 1100 px behaviour as above.
