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
      "The words step is five words: important review words first (target words of their lessons and stories, weak Words-section words, typing mistakes that are real vocabulary — never “and”, “into” or contractions), the rest new words from the Words section; “5 more words” starts another round.",
      "Anything a free learner can't open is simply skipped: Today shows no lock or wall of its own, and a task with nothing open is left out of the ring.",
      "The learner's chosen level is a floor for the passage, the story and the new words.",
      "Times are estimates: a passage from its length, a story from the learner's own typing speed.",
      "Reaching the finish screen after the words is recorded in daily_sessions (no XP). The reminder card on it needs the “Remind me tomorrow” email to be open too.",
    ],
  },
  sentenceBank: {
    id: "sentenceBank",
    audience: "learner",
    title: "Sentence bank (remember what you typed)",
    description:
      "The site remembers the sentences a learner typed in lessons and stories and brings a few back with their text hidden, on the same 1 / 3 / 7 / 16 / 30-day schedule as Word Lists words: a miss comes back tomorrow, a clean answer waits longer. Inside Today's tasks box it adds a fourth row, “Remember 3 sentences”, on the days something is ready (never an empty row, and never a count of what is waiting), and once a week a ten-sentence check ends with one honest line: how many the learner still remembers.",
    notes: [
      "Being built in stages: opening this changes nothing visible until the review screens ship.",
      "Needs Today's session to be open for the same people: it lives inside that box, and stays closed while Today is closed.",
      "Needs the sentence_mastery table (migration 20250347000000); until it is applied no sentence is asked back and nothing is recorded.",
      "Three sentences a day at most, from lessons and stories finished on an earlier day, none shorter than four words and at most two from the same lesson.",
      "Sentences are asked by how well they are remembered: with the sound and one or two words missing, from the sound alone, or from the meaning in the learner's language. Sound is only ever a clip that already exists; otherwise the sentence is asked from its meaning.",
      "To test it, choose “A share of learners”: it only reaches learners who also have Today's session, so read Today's own test before opening this one.",
    ],
  },
};
