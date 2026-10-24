/**
 * The features that ship behind the Permissions page (/admin/permissions): every one starts as
 * "Admins only", and an admin moves it to specific people (by email) or to everyone when it is
 * ready. A new feature is added HERE — one entry below — and read in code as
 * `useFeatures().rollouts.<id>` (a component) or `getRolloutAccess()` (the server). Dependency-free
 * so the admin form, the server rules and the tests share it.
 */
export const ROLLOUT_IDS = [
  "levelFloor",
  "sessionEnd",
  "sessionReminders",
  "shortFirstRun",
  "todaySession",
  "sentenceBank",
  "newHome",
  "redeemCodes",
] as const;

export type RolloutId = (typeof ROLLOUT_IDS)[number];

/**
 * Who a permission is decided for. "learner": whoever is looking at a screen under /learn, signed in
 * or a guest — decided on the server, so it can be limited to admins or to listed emails. "visitor":
 * a first-time visitor in the browser, before anyone has an account — there is no email to check, so
 * it can only be limited to admins (who try it by link) or opened to a share of visitors.
 */
export type RolloutAudience = "learner" | "visitor";

export interface RolloutDef {
  id: RolloutId;
  audience: RolloutAudience;
  title: string;
  description: string;
  /** Other things this one needs or does, listed under it on the Permissions page. */
  notes: readonly string[];
}

export const ROLLOUTS: Record<RolloutId, RolloutDef> = {
  levelFloor: {
    id: "levelFloor",
    audience: "learner",
    title: "Chosen level shapes the path",
    description:
      "The level a learner picks (Beginner, Intermediate or Advanced) becomes a floor for Home's next lesson, the Stories pick, the level card and Today's word block: lower levels only come up once nothing at or above it is left. Without this, the level only counted until the first lesson was finished, so Intermediate and Advanced learners were sent back through Level 1. It also gives back a level a guest lost, at sign-up, from the Intermediate or Advanced opening lesson they finished.",
    notes: [
      "A guest only keeps the level they chose in the short first run (see below); the long one still erases it on the way to sign-up.",
      "Learners who already have a stored level start getting lessons from it as soon as this reaches them.",
    ],
  },
  sessionEnd: {
    id: "sessionEnd",
    audience: "learner",
    title: "New lesson ending",
    description:
      "After the last sentence of a lesson: a three-sentence recall round (typed from memory, from the meaning in the learner's language), then a calm finish screen with how many were remembered, what is waiting tomorrow, and either a reminder to set (signed in) or “save your progress” with Google (a guest). It replaces the stats-and-confetti screen and the first-lesson pitch. Works for guests too.",
    notes: [
      "The line “words that come back tomorrow” only appears while Daily session (Features page) is open for the learner, because that is where those words come back.",
      "Dropped from the finish screen: XP, accuracy and WPM, the fix-mistakes, retry and story-words buttons.",
    ],
  },
  sessionReminders: {
    id: "sessionReminders",
    audience: "learner",
    title: "“Remind me tomorrow” email",
    description:
      "A card on the new lesson ending: the learner picks 8, 9 or 10 pm and gets ONE email at that hour tomorrow — never a series — unless they already studied that day. It goes only to Google-verified addresses, like every nudge, and every email carries a one-click unsubscribe.",
    notes: [
      "Needs the New lesson ending to be open for the same people.",
      "Needs the session_reminders table (migration 20250345000000) and SESSION_REMINDER_MAX_PER_RUN set on the server; until both exist the card is not offered at all.",
      "Shares the daily email budget with the nudge emails.",
    ],
  },
  shortFirstRun: {
    id: "shortFirstRun",
    audience: "visitor",
    title: "Short first run",
    description:
      "A first-time visitor goes from the start page to the level question and straight into the first lesson. The language comes from the browser (Arabic when it has none we translate into), and the country, tutorial and start-card steps are skipped. Visitors are split between this and the current first run, so the two can be compared on reaching the first lesson, signing up and coming back.",
    notes: [
      "Admins only: nobody is given it; try it yourself by opening the home page with ?first_run=short (or ?first_run=classic to go back).",
      "A share of visitors: that percentage of NEW visitors get the short one, picked at random once and kept. Choosing 100 gives it to every new visitor.",
      "Every first-run screen reports which version the visitor saw, so the result can be read per version.",
    ],
  },
  todaySession: {
    id: "todaySession",
    audience: "learner",
    title: "Today's session (daily tasks)",
    description:
      "Home keeps its layout; only the daily quests box changes. Its three quests become Today's session, always the same shape — listen to a passage, write a story, write five words — each tied to a specific passage, story or word round picked from the learner's own level. The box keeps the quests look (ring, XP, a progress bar per task), the task in progress opens with its own big start button, every row is a link into its lesson, a soft glow breathes around the box while something is left and it opens by itself, and a finished day offers “Redo today's lessons”. Daily Lessons are not suggested by the tasks (they stay in their section).",
    notes: [
      "The three tasks ARE the learner's daily quests while this is open: the same quests table, XP and progress events — the passage-parts quest, “finish a lesson” (1 story) and “master words” (5) — dealt next to any random quests the day already had (those are hidden on Home). The XP and targets are the ones set on the Features page for those quest types, and that page's Daily quests switch must be on.",
      "A story finished with 90% accuracy or more earns a star (shown on the task and on the story's done screen; no extra XP yet).",
      "Signed-in learners only for now: a guest keeps the current Home and lesson ending.",
      "To test it, choose “A share of learners” (say 50%): those accounts get the new box, the rest keep the usual quests, and the two groups are compared on coming back. Which group an account is in comes from the account id and this feature's name, so it never changes.",
      "The words step is five words, all from the same day: the target words of today's story (two or three) and, for the places left, those of today's passage — the two the tasks box shows, read or not yet — in a random order. Never a word from the Words section or any other source (too few words make a shorter round). “5 more words” is the day's words the first round left, offered only while there are some.",
      "Anything a free learner can't open is simply skipped: Today shows no lock or wall of its own, and a task with nothing open is left out of the ring.",
      "The learner's chosen level is a floor for the passage, the story and the new words.",
      "Times are estimates: a passage from its length, a story from the learner's own typing speed.",
      "Reaching the finish screen after the words is recorded in daily_sessions (no XP). The reminder card on it needs the “Remind me tomorrow” email to be open too.",
    ],
  },
  sentenceBank: {
    id: "sentenceBank",
    audience: "learner",
    title: "Sentence bank (“Test yourself on today's lessons”)",
    description:
      "After a learner finishes the passage and the story of Today's session, the site asks a few of their sentences with the text hidden: each is heard and typed whole, from memory, so the day ends with proof that it was learned. A story's sentence also joins the same 1 / 3 / 7 / 16 / 30-day schedule as Word Lists words (a miss comes back tomorrow, a clean answer waits longer), which is what the weekly test draws on. Inside Today's tasks box it adds an optional extra row, “Test yourself on today's lessons” (the card at the foot of Today's box on the new Home page), on the days something is ready (never an empty row, and never a count of what is waiting), and once a week an eight-sentence test, drawn only from the general Stories the learner finished that week and asked exactly like the day's test, ends with one honest line: how many the learner still remembers.",
    notes: [
      "Admin note: Features → Daily quests has a row “Test yourself on today's lessons” (Today's extra row only): its XP and target (how many questions) are tuned there, and switching it off removes the row.",
      "Needs Today's session to be open for the same people: it lives inside that box, and stays closed while Today is closed.",
      "Needs two tables, applied by pasting the SQL: sentence_mastery (migration 20250347000000) and sentence_checks (20250348000000, for the weekly test). Until they are applied the test row and the weekly test never appear and nothing is recorded.",
      "The test is an extra, not a fourth task: Home's ring, “all done”, the reward line and the day badge count the three tasks only, and skipping it leaves the day done.",
      "Three questions a day at most (the row's target, tuned in Features), taken one from the passage and one from the story in turn, none from a sentence shorter than four words and at most three from the same lesson. Only the passage and the story finished today are asked about, never a sentence from an earlier day; the test is the same list every time it is opened, so one left half way carries on where it stopped. A story's miss comes back tomorrow; a passage line is asked and counted for the day but is not put on the schedule (it is not a row of the sentences table).",
      "Every question is heard and typed whole: the clip plays, the learner types the sentence, and the meaning in their language is shown after the answer. A sentence typed right plays the same soft chime as a right answer in Passages (it follows Admin → Typing sound), one a few letters away is told so (“so close”, with the number of letters), and one far off just shows the words to check. Every question has its sound — a story sentence's stored clip in the voice of its own lesson, a passage line's narrated clip, never the browser's voice — and a line with no stored clip is not asked.",
      "The weekly test is a locked card (lightly blurred, with a progress bar) until the learner has finished three general Stories on earlier days of the last week; a story finished today counts from tomorrow, and the card says so. Then it asks up to eight sentences of those stories — the ones that hold each story's target words, one per word, and never padded with other sentences (fewer than five means no test) — each heard and typed whole with the same help and the same calm correction as the day's test, and gives one honest line afterwards (how many were remembered of how many were asked). The next one needs seven days and three more finished Stories. It never claims a level.",
      "A learner whose subscription ended can still be asked about a story they finished today: its sentences are read for that learner's own finished lessons only, whatever Premium says.",
      "To test it, choose “A share of learners”: it only reaches learners who also have Today's session, so read Today's own test before opening this one.",
    ],
  },
  newHome: {
    id: "newHome",
    audience: "learner",
    title: "New Home page (Today first)",
    description:
      "Home becomes one calm screen built around Today's session: the greeting with the three totals on one small line, a small button for the words waiting to be reviewed and the learner's week (tap it for the streak card and the month), then Today's three tasks beside the learner's daily lesson, with the day's test, “Test yourself on today's lessons”, at the foot of the tasks box — locked (slightly blurred) until the three tasks are done — and under them the weekly test card. The words task shows a small typing hint (the learner writes every word). It replaces, for the people it is open to, the quests strip, the streak card, the passage card, the three-card grid and (for admins) “Today's plan”. Stories and Passages stay in the menu and inside the tasks.",
    notes: [
      "Needs Today's session to be open for the same people: it is built from Today's tasks, and stays closed while Today is closed (a learner without it keeps the current Home).",
      "Signed-in learners only: a guest keeps the current Home, and so does the very first visit of a browser (before it has told the server its time zone).",
      "The day's test and the weekly test cards need the Sentence bank open too: the day's test is locked until the three tasks are done and opens only on days a test is dealt (never an empty open card); the weekly test is its own card under the boxes (locked, with a progress bar, until the learner has finished three general Stories).",
      "The free-lesson counter (“Starter lessons 3/4”) stays under the daily lesson card for learners on the free plan; Premium learners never saw it.",
      "To look at the current Home while this is open for you, add ?classic=1 to the address.",
      "To test it, choose “A share of learners”: those accounts get the new page and the rest keep the current one; the share is stable per account, like the other features.",
    ],
  },
  redeemCodes: {
    id: "redeemCodes",
    audience: "learner",
    title: "Premium codes (“I have a code”)",
    description:
      "A learner who bought a Premium code from a local agent types it on the plans page and gets the days: they are added on top of any Premium the learner still has, and start now otherwise. A code works once. The code is checked for typos before it counts as a try, and five wrong codes within ten minutes (twenty within a day) pause the box for that learner for a while, so the codes cannot be guessed.",
    notes: [
      "Needs the redeem-codes tables (migration 20250349000000, applied by pasting the SQL) and the server secret REDEEM_CODE_PEPPER on the server. Until both exist the box says it is not available.",
      "Codes are issued by an admin to an agent who has paid; the admin sees them once. Only a hash is kept, so a copy of the database holds no usable code.",
      "Closed, nobody can redeem a code, whoever holds one.",
    ],
  },
};
