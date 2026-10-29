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
  "inAppStrip",
  "todaySession",
  "honestTicks",
  "sentenceBank",
  "newHome",
  "wordBank",
  "dailyRule",
  "redeemCodes",
  "storyRecall",
  "leanGate",
  "libraryGift",
  "mobilePath",
  "hybridOffers",
  "todayCover",
  "todayRepeat",
  "homePolish",
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
      "The level a learner picks (Beginner, Intermediate or Advanced) becomes a floor for Home's next lesson, the Stories pick, the level card and Today's word block: lower levels only come up once nothing at or above it is left. Without this, the level only counted until the first lesson was finished, so Intermediate and Advanced learners were sent back through Level 1. It also gives back a level nothing stored, from the Intermediate or Advanced opening lesson a learner finished: at sign-up for a guest, right after the lesson for a learner who was already signed in.",
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
  inAppStrip: {
    id: "inAppStrip",
    audience: "visitor",
    title: "Open in browser strip (Facebook and Instagram)",
    description:
      "Facebook's and Instagram's built-in browsers can't sign anyone in with Google (Google refuses its sign-in page inside them), and they can't ask for notifications or install the site. On the sign-up and sign-in pages, inside those two browsers only, the “Continue with Google” button is replaced by a quiet strip: “Open the page in your browser”, with an open button and a copy-link button on Android and two steps and a copy-link button on iPhone. Signing up with email stays right below it. Everywhere else nothing changes.",
    notes: [
      "A share of new visitors: that percentage of the visitors who arrive in Facebook's or Instagram's browser get the strip; the rest keep the Google button, so the two can be compared on signing up and on the first day. Each visitor gets a random number from 0 to 99 once (a cookie), so it is the same visitors every time and a bigger share only adds visitors. Choosing 100 gives it to all of them.",
      "Admins only: nobody is given it. To look at it, add ?in_app_strip=facebook-android, facebook-ios, instagram-android or instagram-ios to /register or /login; to try the real thing, open /register?in_app_strip=on inside Facebook's or Instagram's browser on a phone (for example from a link sent in a message).",
      "The visitor's number travels in the link the strip opens, so a sign-up made in their own browser is still counted in their group: USER_SIGNED_UP, LESSON_STARTED and LESSON_COMPLETED carry it as inAppBucket (the group is that number below the share). Every view of the page by a visitor in one of those browsers (IN_APP_STRIP_SHOWN, with whether the strip was shown), every tap on “open” and every tap on “copy” is recorded.",
      "Only the Android button is a one-tap open; there is no reliable way to do that on iPhone from inside these apps, so it gets the steps. The wording of the menu the steps name differs a little between apps and versions.",
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
  honestTicks: {
    id: "honestTicks",
    audience: "learner",
    title: "Today's tasks tick only their own work",
    description:
      "Each of Today's three tasks is ticked only by what it names: the story by a story finished today, the listening by a passage finished today, the five words by the words round. Until this is open, a regular lesson can tick the story, three parts of any passage can tick the listening task, and a flashcard or mistake word can tick the words task. Only the ticks change: the tasks, their order and their XP stay as they are.",
    notes: [
      "Needs Today's session to be open for the same people, and stays closed while Today's session is closed.",
      "A task dealt before this is open keeps the target it was dealt with for the rest of that day (the listening one needed three parts then); from the next day the listening task is one passage.",
      "Ticks already made keep their XP; nothing is taken back.",
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
  wordBank: {
    id: "wordBank",
    audience: "learner",
    title: "Words bank (“My Words”)",
    description:
      "A new section of the menu beside Word Lists: every word a learner meets in Today's words step (the day's story and passage) joins their own bank, with the sentence it was met in, and comes back after 1 / 3 / 7 / 16 / 30 days (a miss comes back tomorrow), in short rounds of up to five words, so what was learned is still there a week later. Word Lists itself is not touched.",
    notes: [
      "Needs Today's session to be open for the same people: the words come from Today's words step, so it stays closed while Today is closed.",
      "Needs the learner_words table (migration 20250350000000, applied by pasting the SQL). Until it exists nothing is recorded and nothing is asked back.",
      "Today's five words stay exactly the day's story and passage words: the bank only remembers them, it never adds to them or changes which words are asked.",
      "At this stage the bank only COLLECTS words as they are answered; the menu item and its screens arrive in later changes, so opening it to learners now would gather words nobody can see yet.",
    ],
  },
  dailyRule: {
    id: "dailyRule",
    audience: "learner",
    title: "Rule of the day (“قاعدة اليوم”)",
    description:
      "One short English grammar rule a day, in the order of a 150-rule course (A1 45 rules, A2–B1 60, B2 45, in units of 5 to 9 rules; the course goes on to the next level once every rule of a level is met): the rule's name and the rule in plain English first, then its examples, then what to watch for (the exceptions, more detail, and the slips that Arabic speakers often make), then three sentences to type. It is the last row of Today's list, after the words. The rule is taught from the learner's own story when the story shows one of the next three rules (three sentences or more), and otherwise from the six sentences written for the next rule. A rule comes back the day after as the last question of Today, and is held after three clean answers on three different days. Earlier rules come back as questions, up to four on one day, from the texts the learner has finished or from the rule's own sentences.",
    notes: [
      "Needs Today's session to be open for the same people: the rule is reached from Today's list and from Today's carry-on, so it stays closed while Today is closed.",
      "Needs the learner_rules table (migration 20250351000000, applied by pasting the SQL). Until it exists the card still teaches, nothing is recorded and nothing is asked back.",
      "A sentence of the learner's own texts is asked only when it has a stored recording, and the browser's voice is never used. The sentences written for each rule have a recording only once one is stored (looked up under the default pronunciation voice, the voice of the Word Lists; nothing is made at read time): until then their questions are silent, with no sound controls.",
      "Today's three tasks and the story's finish screen are unchanged: the rule is one optional row after the words, and it never blocks the three tasks.",
      "The same permission opens the rule library («قواعدي»): a menu item (from md: up) and a small button on the rule row with the number of rules met, a page that shows the whole course as cards like the Stories section (a tab for each level the learner is on, split into units; the rules due today first; a green ribbon on every rule met; the rule that opens next marked, the rules ahead as cards without an idea or a link), a page for each rule met (the same two pages that taught it, then a practice of three sentences from their own finished texts or the rule's own sentences, which records nothing), and a second button at the end of a rule session. It reads only the learner's own learner_rules rows and writes nothing.",
    ],
  },
  todayCover: {
    id: "todayCover",
    audience: "learner",
    title: "Today: the passage as a poster",
    description:
      "The listening task, the first of Today's tasks, is drawn with its passage's poster at its left (the colours and the picture the Passages list shows) instead of the headphones.",
    notes: [
      "Needs Today's session to be open for the same people, and stays closed while Today's session is closed.",
      "Only the picture changes: the task, its passage, its XP and its place in the list are the same.",
    ],
  },
  todayRepeat: {
    id: "todayRepeat",
    audience: "learner",
    title: "Today: repeat buttons and pressable rows",
    description:
      "Each of Today's three tasks gets a small button that opens its lesson again: once the task is finished today it opens the lesson in redo mode, as “Redo today's lessons” does for the whole day; until then it opens the same lesson as the row. The rows lift a little under the pointer and press in like a real button, and so does the rule of the day's row while it is open.",
    notes: [
      "Needs Today's session to be open for the same people, and stays closed while Today's session is closed.",
      "Only the buttons and the motion change: the tasks, their order, their XP and what each one opens stay the same.",
      "A learner who asked for reduced motion gets the buttons without the lift, the press and the turn of the icon.",
    ],
  },
  homePolish: {
    id: "homePolish",
    audience: "learner",
    title: "Home: big totals, one accent colour, one clear step",
    description:
      "Four small changes to the new Home page and the header. The three totals (words, lines, sessions) leave the small grey line under the name and sit in the empty middle of the top row as big numbers with their label under each (from xl up, 1280 px; below it the small line stays). The goal ring round the avatar, the saved-sentences bookmark in the header and its count badge change from amber to the site's own indigo, so the page has one accent colour (the streak flames stay orange). Once the day's three tasks are done, the self-test card carries the page's one solid button instead of an outline one. And where one short review visit holds fewer words than are waiting, the review button says what the visit is (“Review 12 words now”) with the number waiting beside it.",
    notes: [
      "Needs Today's session to be open for the same people, and stays closed while Today's session is closed: the changes belong to the new Home page, and the header colours follow the same switch.",
      "Only looks and the review button's wording change: the same pages open, with the same words, tasks and XP.",
      "The review wording appears only where Smart word practice caps a visit (12 words); without it the button keeps saying how many words are ready.",
    ],
  },
  mobilePath: {
    id: "mobilePath",
    audience: "learner",
    title: "Phone: the path and the next step",
    description:
      "On a phone only (below 768 px): five tabs in the bottom bar (Home, Path, Stories, Passages, Words), a Path tab that lists each level's lessons in order with the one to do now, one next-step button on Home, and a calmer first screen for a guest. Tablets and laptops keep their current layout.",
    notes: [
      "Does not need Today's session: the Path shows the daily lessons themselves, and Home's next step falls back to the current lesson when Today is closed.",
      "Only the phone layout changes: the desktop sidebar, the desktop Home and the lesson player's desktop controls stay as they are.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
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
  leanGate: {
    id: "leanGate",
    audience: "learner",
    title: "Lean lock card (one price, fewer words)",
    description:
      "The card a learner or a visitor meets on a locked lesson, story, passage or word list, with the same lesson beside it: the offer half keeps only what decides a purchase. A heading and one line, a small “plans from” price with “one payment, no auto-renewal” and a small mark for the gift days of the running offer, one white button, and one line of real proof (the average rating and the number of learners, or for a signed-in learner their own sentence count above the heading). The three benefit lines, the green offer box with its plan chips, the amber button and the glows behind the panel are gone. On a phone the lesson header is compact, so the price and the button are in the first screen.",
    notes: [
      "Works for guests too: it is decided on the server for whoever is looking at the lock. To look at it as a guest, switch preview on for this browser (an admin never meets a lock).",
      "The sealed-section card only shows while Library for subscribers (below) is open for the same people; without it the card has no gift and the button says what it always said.",
      "Counting needs nothing from this: every button on every lock card (the classic one too) adds where it was pressed to the plans page link, and UPGRADE_VIEWED records it as from, at and v, so before and after can be compared per 100 lock views (PAYWALL_VIEWED).",
    ],
  },
  libraryGift: {
    id: "libraryGift",
    audience: "learner",
    title: "Library for subscribers (the subscription gift)",
    description:
      "The Library (Books and Novels, the menu item, its pages and the book recommendation on Home) opens for a learner with a running subscription, on top of admins who always had it. Closed, nothing changes: only admins can open it. While it is open the lean lock card above can tell a visitor, without naming it, that a whole new section opens when they subscribe.",
    notes: [
      "A learner whose subscription ended loses the Library again, like any Premium content.",
      "The lock card never says what the section is: only that it is new, a gift and for subscribers.",
      "Decide the rights question for the books and covers before opening this to anyone.",
    ],
  },
  storyRecall: {
    id: "storyRecall",
    audience: "learner",
    title: "Story words in Recall (“Words you've met”)",
    description:
      "A finished story's two or three target words join Vocabulary Recall, the “Words you've met” review: they come back the next day and then at growing intervals, a card on the Stories page offers them once three are waiting, and the line about words that come back tomorrow at the end of Today's session counts them. Until now a story never put a word there (its target words were skipped because their ids carry the word, not its place in the sentence), so only the words of Normal lessons came back. Normal lessons are not touched.",
    notes: [
      "Nothing else is needed: Recall's table (vocabulary_encounters) already exists. Closed, a finished story records nothing for the learner, exactly as it did before.",
      "Only stories finished AFTER this is opened add words: the stories already finished are not looked back at (a one-off script could add them later).",
      "At most three words are recorded per story, and a word the learner already has from a lesson keeps its first sentence and its schedule.",
      "Admins have it already: finish a story, and the words appear in the card on the Stories page the next day.",
    ],
  },
  hybridOffers: {
    id: "hybridOffers",
    audience: "learner",
    title: "Hybrid offers: taste of the day and moments",
    description:
      "Once a free learner has finished the free passages and stories, Today's tasks keep going: each day one Premium passage and one Premium story from the learner's own level are open for that day, and the plan is offered at the moments that feel right. After the taste's passage, when the day's three tasks are done, and after a story finished with 90% or more, a calm card offers the full plan, once a day at most. Every locked passage and story shows a clearer lock screen: a preview, what the full plan opens, the price by country and a second button back to today's taste.",
    notes: [
      "Needs Today's session to be open for the same people: the taste lives in Today's tasks.",
      "Nothing changes for a learner who still has free passages or stories to finish: the taste and the moments start only after those are done.",
      "A moment never shows in the first 24 hours after sign-up, to a learner with an order still unpaid, to a subscriber or to a guest. Two dismissals within a week pause the moments for seven days.",
      "Every shown, clicked and dismissed moment is recorded (OFFER_SHOWN, OFFER_CLICKED, OFFER_DISMISSED), so the result can be read per group. To test it, choose “A share of learners”: the accounts left out keep today's Home and lock screens.",
    ],
  },
};
