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
  sentence is read by one of two voices (`prepared-voice.ts`: the 1st, 3rd and 5th sentence of a rule by the
  Stories narrator, ElevenLabs «The Pharaoh 4», the others by Emma, Edge-TTS), pinned there so a change of the
  site's voice settings never silences them. The recordings are made by `scripts/generate-rule-sentence-audio.ts`
  (resumable, it only fills the gaps); `withPreparedClips` in `load.ts` only looks them up, and a sentence without
  one is silent and shows none of the sound controls.
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

## The «جديد» line for Video (2026-11-02)

Permission **`videoNews`** ("Video: the «جديد» line on Home"; Admins only by default, closed whenever `videoDictation`, `newHome` or `todaySession` is closed). When the Video section was opened to everyone, the owner chose a one-time announcement over a permanent block (the three drawn options are in `reports/home-video-entry-2026-11-01.html`; he picked option C, the line). It is drawn for the Arabic interface only, because the section is Arabic only.

**The line** (`video-news-line.tsx`, drawn by the page through `HomeToday`'s `banners`, after the payment and expiry banners): under the top bar, 44px tall (one row, also on a phone, where the sentence is left out), 12px radius, the brand colour at 30% for the border and 7% for the fill, a 26px disc with a play mark, the bold title «جديد: قسم «فيديو»» and the muted sentence, a «جرّب الآن» link and a close button. It sits outside the boxes, so `FitHome` gives it its room: on a 1534 x 781 screen the boxes' zoom goes from 1.41 to 1.27 (about 10% smaller) and nothing scrolls; on the compact layout (under 720px tall) the page scrolls by the line's 60px like with any other banner.

The small «new» word that the Video menu item wears until it is opened (`useVideoNew`, `NewWord` in `learn-sidebar.tsx`, localStorage) is a separate piece and is not behind this permission; the line draws no second tag.

The line leaves for good, on that browser, when the learner closes it or opens the Video library by any road (`MarkVideoNewsSeen` on the library page). The mark is ONE cookie, `ss_video_news=1` (a year, `SameSite=Lax`), see `lib/video-dictation/news.ts`: a cookie rather than localStorage because the server draws the line (the page reads the cookie), so a learner who has seen it never gets it drawn and taken back after loading, which would push the boxes down and up. Nothing is stored on our side and no read is added (`cookies()` is a header read). `useVideoNewsSeen` makes the line leave at once when the learner closes it. To look at it again, delete the cookie.

The link is a plain `<a>` (a full page load), because only the Video routes are served with YouTube in the Content-Security-Policy; no YouTube picture is drawn on Home (the thumbnails' host is allowed on those routes only, and loading it would send the learner's address to Google before any click). The classic Home (`?classic=1`), the guest Home and the phone Path draw nothing of it.

Checked with a throwaway page that put the real sidebar, the real `FitHome` and the real line inside the dashboard chrome (placeholders for the boxes): the line's measured size, spacing, colours and type against the mock, the zoom with and without the line, and a 375px phone.

## The Home cards (2026-11-04)

Permission **`homeCards`** ("Home: colourful cards, one “keep learning” card, achievements, a words section"; Admins only by default, closed whenever `classicHome` is closed). It is a new look of the classic Home page, drawn from the owner's mock-ups of 2026-11-03/04 (`reports/home-c2-colors-motion-2026-11-04.html`, option C with the merge). The route (`(dashboard)/page.tsx`) returns `HomeCardsPage` (`src/components/home-cards/`) for a signed-in learner who has the permission; it uses data the classic page already loaded, plus two small reads that only a `homeCards` visitor pays for (the videos finished and the Arabic meanings on the word cards, see below).

- **The merged card** (`continue-card.tsx`): the stories and the daily lesson share one card named «أكمل التعلّم» with two choices inside it, the stories first and chosen by default (2026-11-04 night; a learner with no story left in their level but a lesson to do starts on the lesson). The lesson side is exactly what the old lesson card showed (`useCurrentLesson`, the same label and link); the story side points at the story the old Stories card pointed at (`findCurrentLesson` over the stories) and opens it directly (`/learn/stories/<id>`). The story side keeps the Stories colour but its picture is a standing hardcover book (`STORY_BOOK` in `palette.ts`: a dusty-raspberry cover, a cream frame and the story's first letter), so it no longer shares the white-sheet look of the Passages card, and a «مركز تعلّم اللغة» tag in its corner tells it from the words section's «مركز تعلّم الكتابة». The choices swap with a short slide and the card's colour follows (`hc-pane` in `globals.css`).
- **The achievements panel** (`stats-panel.tsx`, pure parts in `stats.ts`) replaces the old words panel in the first row: the learner's level (name from `getLearnerLevel(xp)`, a bar and «n% toward <next>», «top level» at the end) and four counts, each with a tile in its section's hue (`STATS`): stories finished (each finished story once, only stories that still exist), videos finished, sentences typed and words typed (`useHeaderTotals`). The sessions total is no longer on Home. **Videos finished** are rows of `video_finishes` (migration `20250355000000_video_finishes.sql`): the finish screen of a video calls `recordVideoFinishAction` once (only while `homeCards` is open for the caller, so nothing is written for anyone else yet), the insert ignores a second finish, and the count starts the day the code was published (nothing recorded earlier finishes). Until the migration is applied the table is missing: nothing is recorded and the video tile is left out (the count comes back `null`), it never says 0 for a number it cannot read.
- **The words section** (`words-section.tsx`) is a wide card at the foot of the page: the number of words waiting for review large (it counts up once) with the review button (or the Word Lists link when none wait), a short line, a «مركز تعلّم الكتابة» tag, and the first four due words as small paper cards that spread under the pointer. An Arabic learner sees the word's Arabic meaning on each card (`vocabulary_words.hint_ar`, one read of at most four rows by id, `fetchWordCardHints`; the written full stop is dropped and a hint over 48 characters is left out); any other language, or a failed read, draws the word with two faint lines as before. **The Word Lists page uses the same section** (2026-11-04): while `homeCards` is open for a signed-in learner, `/learn/word-lists` draws this component (`WordListsLibrary`'s `homeCardWords` prop, with the page's own `className` for its spacing and `index` 0) instead of its «راجع كل الكلمات» card (`needs-review-words.tsx`, still what everyone else sees); the page makes the same one meanings read as Home, and like the old card it draws nothing when no word waits.
- **The Passages and Video cards** (`category-card.tsx`, `section-cards.tsx`): the section's name large, one line, the next item and a link, a small picture at the foot. Video keeps its «new» pill and its real page load.
- **The strip** (`EngagementStrip` `cards`): one slim line, the day's tasks first and the week at its end (no flame: the header has one).
- **The header** (`account-chip.tsx`, through `AccountMenu`): the Google picture or, without one, the letter on its colour, beside «Manage account» and the name; no ring. The picture is `avatar_url`/`picture` from the sign-in token (`googleAvatarUrl`, https and Google's own host only), so it costs no read. The Content-Security-Policy's `img-src` now allows `https://*.googleusercontent.com` (this one line is not behind the permission; it only lets the browser draw Google's pictures).
- **Colours** are all in `palette.ts`, so they can be changed without touching a layout. A card is nearly black like the page (2026-11-04 evening, after the owner found the first muted tints still too coloured: a very dark, almost neutral base, a corner wash of only about 4%, a neutral white hairline, a neutral tag; Video is YouTube's own grey `#0e0e0e` with no hue; `TINT` scales the wash of every card at once), and the bright colours live in the art on it: white paper sheets with real shadows (`PAPER`; the Passages sheet carries the next passage's title in the serif face, a pale-blue highlighted line that fills under the pointer, a question box and the audio orb `ORB`), the story's standing book with the first letter on its cover (`STORY_BOOK`), the Video frame drawn as a YouTube player (`VIDEO_SCENE`: title strip with the channel's round picture, YouTube's dark play button that turns red under the pointer, the red progress line with its dot and the control row; a small «YouTube» tag with the icon (`youtube-mark.tsx`) sits beside the kind tag, and the line under the title says the clips are from YouTube) and the white word cards. The earlier build used vivid two-or-three-hue gradients; the owner replaced them (2026-11-04) with this look, borrowed from another learning site's Home. The words live in `strings.ts` (four languages) and are not in the shared dictionaries.
- **The daily-tasks box** (`tasks-box.tsx`, `TASKS` in `palette.ts`) replaces the strip on this page only (`HomeEngagementSection` swaps it when `cards` is set; the classic strip is untouched). Same data and links as the classic strip (the next task, the tracker, the week, the freezes, the repeat menu once the day is done, the opened card), drawn as four groups with hairlines: the next task as a tile with its icon and two lines, a tracker of one part per required task (the current part filled by its progress, outlined), the week with the freezes as a pill, and the round open button. Opened, the card lists the steps on one rail (a green disc for a finished step, an indigo ring for the current one, a grey ring for the rest); only the current step carries its reason and the white start button, and a progress bar only when it has started (a words task at 3 / 5). The per-row bars of the classic card are not drawn for the other rows. No new strings: every text is the classic one.
- **The daily tasks as three steps** (`tasks-steps.tsx`, permission **`taskSteps`**, Admins only by default, closed whenever `homeCards` is; mock-up `reports/tasks-strip-options-2026-11-05.html`, option B, picked by the owner 2026-11-05). Only on a day of Today's tasks (the random daily quests keep the box above). The tracker and the task tile give way to the day's required tasks as three 32 px discs joined by lines (the rail of the opened card, folded: green tick, indigo ring with a 4 px halo, grey), the «tasks n/3» label and the next task's name and title beside them; once the day is done the discs are green, the line turns into the green «explore» sentence and the repeat menu stays beside it. The week is drawn smaller (10 px dots, 1.5 px edge, 5 px apart, `WeekDots quiet`) and the freezes left are plain text with a snowflake (`TASKS.freezeQuiet`) instead of the blue pill. The closed box is the same 70 px as before. Opened, the SAME box grows downward (no second card): its first line becomes «Daily tasks» with the reward, then under a hairline the steps on one rail, each row a link as before, the current one with its reason and the white start button at the END of the row (it drops under the text below `sm`), a `3 / 8` counter beside its minutes once started; when the day is done the «Today's session finished» line with «Redo» stays at the foot, and the weekly test line (when there is one) after it. About 322 px opened at xl against about 496 px for the box above. No new strings. Checked with a throwaway fixture page (closed and opened, three states, 1400, 820 and 390 px wide).
- **Motion** (`hc-*` in `globals.css`): transform and opacity only (plus the length of two small bars), the 380ms spring the other Home cards use, an entrance that staggers 70ms per block, and none of it for a learner whose device asks for reduced motion.

Checked with a throwaway fixture page (the real components with sample data, headless Chrome at 1534 x 797 at 125%, with timed hover and clicks): the lesson and the story choice, the hover of a card and of the words section, the header with and without a picture, and the page at 1100, 390 and 1920 px wide.

## The Home cards for visitors without an account (2026-11-08)

Permission **`guestCards`** (Admins only by default, closed whenever `homeCards` is). Until it is open a visitor without an account keeps the classic page; with it, `(dashboard)/page.tsx` draws `HomeCardsPage` for them too (the owner: a visitor should see exactly what a signed-in learner sees). The two learner-only reads are skipped (videos finished = `null`, so that tile is left out; no word meanings), so the page adds no read. In place of the classic page's purple «sign in to unlock the daily tasks» card (`GuestFeatureTeaser`) the visitor gets `GuestTasksLine` (`src/components/home-cards/guest-tasks-line.tsx`): the tasks strip's own box and tile with one line, «مهام اليوم · سجّل لتفعيلها وحفظ سلسلتك» (`quests.guestLine`), and the free-account button; it shows exactly when the teaser would (`guestTeaser`). The classic page's «you have a 1-day streak» banner (`GuestProgressBanner`) is not on this page. To see it as a visitor before opening it: preview on for the browser, sign out, open Home.

## The calm look (2026-11-15)

Permission `homeCalm` ("Home: a calmer look"; Admins only; no read, no request, no migration; independent of `homeCards` and `todaySession`). The first version (3b13e7b3) also recoloured the page and every card; the owner rejected the colours and the card shapes the same day, so the page, the cards and their shapes are exactly the Home cards' own again.

**The shell is no longer under this permission (2026-11-15, the owner: «حساب الادمن بدون بنر ... انشرها للكل»):** the calm top bar and side menu are every account's, with no switch. `DashboardChrome` puts the side menu in its own full-height column with the top bar above the page only, the logo moves to the top of the menu (from md up; below md the top bar keeps it), the bar loses its line and its blur and is 76px tall from md, the flame counter (`ProgressHud`) is gone (the week dots on Home still show the streak) and so is the layout's progress read that fed it (7 queries per page view; the pages that need progress still call `fetchProgressCached` themselves), the flags have no pill (`<LanguageSwitcher bare />`; the marketing header keeps its pill), the saved-items count is a small dot, the account chip is the picture and the name (its tooltip and aria-label still say «Manage account»), the open menu item is a soft grey instead of the violet, and «تواصل معنا» has no box.

What stays under `homeCalm` (Home only):

- **Home arrangement:** a centred page (`xl:max-w-[1180px]`, 48px side padding from xl), no «up next» heading: the two choices (Stories / Daily lessons) are tabs above the story card (the pill inside the card is gone, its «keep learning» label stays) with the free plan's progress at the far end. The cards themselves are unchanged.
- **Hover:** under `data-calm-home` a card no longer rises, gets a shadow or presses in (`.hc-card:hover/:active` are reset); the pictures inside keep moving (the sheets straighten, the line types itself, the player's button, the audio bars, the word fan) and the achievements tiles grow and tilt as before.
- **The daily-tasks capsule (`TasksStepsBox`, folded):** 56px instead of 70px; a soft wash fills it from the start as the day's tasks are done (`done / total`, indigo; the whole capsule turns green once the day is done; `.tk-wash`, colours in `TASKS.wash`); the step in progress breathes (`.tk-breathe`); one small white button starts the next task straight from Home («استمع · 6 د →», the same words as the opened rows, to `quest.today.href`) so the learner no longer has to open the box first; the week dots, the freezes and the round button stay. Opened, the box is exactly the old card. No new reads. Both animations stop for a visitor who asks for less motion. The placeholder while the strip loads is 56px too.
- **Checks:** tsc, eslint, prettier, the permission tests; looked at in the Browser pane at 1440, 1280, 1100 and 375 px (the capsule through a throwaway fixture page with sample tasks in its four states, since a local run has no signed-in learner).

## The grey look (2026-11-16)

**Update 2026-11-27:** the grey look now colours the **cards only** (admins). The page and the side menu stay black: DashboardChrome no longer sets `data-grey-calm`, so the page/side rules below are unused. Everyone else keeps the black cards of the Home cards palette.

Permission `greyCalm` ("Home: a grey page and tinted cards"; Admins only; no read, no request, no migration; independent of `homeCards`, `todaySession` and `homeCalm`). The owner picked it from a mock-up (`reports/home-grey-calm-v2-2026-11-15.html`): midnight violet Stories, flat colour, 8 px corners. An earlier version of the proposal (plum Stories, teal Video, near-black fills) was rejected, so do not bring those colours back.

- **Where it applies:** Home only (`useGreyHome()` = the permission is open AND the path is `/learn`). The Word Lists page shows the words card too and keeps its usual colours; the other pages keep their black page.
- **Page and menu (dark theme only):** `DashboardChrome` sets `data-grey-calm` on the shell's inner row; `globals.css` gives it `--background: #0e0f11`, and from md up the side menu (`data-learn-side`) is `#090a0b` with a `#171a1d` line, its open item `#202124`, the others' text `#a1a5ab`, items with 8 px corners.
- **Cards (`GREY` in `home-cards/palette.ts`, the only place the colours live):** one flat fill and a lighter edge of the same hue, each from `hsl(hue, saturation, 14%)` with the edge at 28% lightness: Stories H258 S38 (`#1e1631` / `#3f325d`), Passages H214 S38, Video H2 S52 (YouTube's red), Words and the lesson side H236 S34, the level panel and the tasks capsule H220 S6. The tag's edge is the card's edge mixed 12% toward white. The Stories tile of the achievements panel follows the Stories hue (`GREY.storiesTile`). The art on the cards is not recoloured.
- **Corners:** cards 8 px, the small tiles 6 px, the white buttons 8 px, the tags 6 px, the capsule 8 px (inline `borderRadius` from `GREY.radius` while the permission is on, so the Tailwind classes stay as they were for everyone else).
- **Tasks capsule:** neutral grey, its wash `GREY.wash` (indigo 15% to 5%), its dividers `GREY.hairline`.

## The daily scene (2026-11-28)

Permission `dailyScene` (Admins only until the owner opens it; needs `todaySession`, and brings `honestTicks` with it). The three tasks become one scene made from one passage: **hear it** (the passage reader as it is), **complete it by ear** (`/learn/today/scene`: for each of the passage's words, the sentence that holds it is typed letter by letter from the line's own clip; the rest of the script stays in view), then **its words** in three moves (`/learn/today/words`: meaning, letters, from memory in the line). The report and mock-ups: `reports/sentencestep-daily-scene-2026-11-27.html` (phase 0 and 1 of it are built).

- **Which passage:** the first one finished today, else the next open one (`sceneDayPassageId`). A day with no such passage, or one with no word lesson, keeps the usual tasks. The German track is not touched.
- **Pure rules:** `src/lib/today/scene.ts` (which words, one line each; the typed sentence, cut to a part when longer than 14 words; the script never shows a line still to be typed). Words and strings: `scene-strings.ts`.
- **Ticks:** typing the lines is the second task (the `lessons` row, a "today" event from `recordSceneLinesAction`); a story finished on a scene day does not tick it (`hasSceneToday` in the completion action). Each finished set of lines records `SCENE_LINES_COMPLETED`.
- **Phase 0** is its own permission, `todayTidy`: the story and words explanations no longer claim a link that is not there, and on laptops the side menu's «القصص» opens General Stories, as the phone's tab does.
