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
  Today's tasks. The self-test card additionally needs the Sentence bank (`sentenceBank`) and only
  exists on a day a test quest was dealt (never an empty card).
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
- **Lesson card** (`lesson-card.tsx`): the learner's daily lesson as the page's one full-picture card,
  with a quiet glass button; same lesson logic and states as the lessons card of the current Home
  (continue / resume / start, free lessons finished, everything finished). Learners on the free plan
  keep the "Starter lessons 3/4" counter under it.
- **Self-test card** (`test-card.tsx`): brand-tinted surface, a round mark, one small segment per
  question, an outline button (so the page keeps one solid button); done, it becomes a calm tick.

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
