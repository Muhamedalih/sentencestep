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
  "videoDictation",
  "videoNews",
  "upgradeMoments",
  "classicHome",
  "homeCards",
  "taskSteps",
  "contactInstagram",
  "videoShelves",
  "guestCards",
  "videoFinish",
  "shortOpener",
  "openerSkip",
  "openerHelp",
  "returnLoop",
  "mobilePhoneUx",
  "wordLadder",
  "wordsPage",
  "wordCovers",
  "wordsBanner",
  "faceRatings",
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
      "Never in Stories: a story always ends with its own words step (the story's 2–3 target words, as in Word Lists) and the story finish page, whoever this switch is open for.",
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
      "A first-time visitor goes from the start page (where the language is picked on three chips at the top) to the level question, then one page of four short tips, and into the first lesson; the language page, the country, the four-slide tutorial and the start card are gone. After that lesson a visitor without an account sees one page asking them to save their progress (Google, email, sign in, or later), and every choice leads straight to Home. Visitors are split between this and the current first run, so the two can be compared on reaching the first lesson, signing up and coming back.",
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
      "A new section of the menu right before Word Lists (a tile in the phone's More sheet): the target words a learner meets in Today's words step and at the end of a story join their own bank, with the sentence each was met in, and come back after 1 / 3 / 7 / 16 days (a miss comes back tomorrow). The section's page shows today's words, where the learner's words stand, and the list of every word under its lesson's name. Words never pile up: a day asks five at most, twenty are being learned at once and the rest wait their turn, and a stable word leaves the daily round. Word Lists itself is not touched.",
    notes: [
      "Needs Today's session to be open for the same people: most words come from Today's words step, so it stays closed while Today is closed.",
      "Needs the learner_words table (migration 20250350000000, applied by pasting the SQL). Until it exists nothing is recorded and nothing is asked back.",
      "A word typed right the first time it is met starts two steps up, so it needs two reviews to become stable instead of three (migration 20250357000000, which only replaces the function). Until that file is run a new word starts one step up, as before; nothing else depends on it.",
      "Today's five words stay exactly the day's story and passage words: the bank only remembers them, it never adds to them or changes which words are asked.",
      "The three shelves (stable, being learned, waiting) are worked out from the rows each time, never stored, so the caps (five a day, twenty at once) can change without touching a learner's words.",
      "It also shows in three places the learner already is: a finished story's words say they joined the bank, the Home words card (and the same card on Word Lists) shows today's words on a day the bank has some, and each unfinished story's card says how much of its words the learner has typed before (from five finished lessons on; an index of the lessons' words is kept for an hour for everyone).",
      "The shelf «كلمات الموقع الأساسية» sits under the review card on Word Lists: the 296 most frequent content words of the site's own lessons, stories and passages (a fixed, hand-checked list in src/lib/word-bank/core-words.ts), in 37 sets of eight in three levels. A set opens the bank's review screen with its words typed into their home sentences; the first answer to each word puts it in the learner's bank, where it waits its turn under the same caps, so a set can never pile words up. The first set of each level is free, the others need Premium (an admin sees them all). The meanings are Arabic only for now.",
      "Not here yet: a passage's own word lesson and the Daily lessons do not add words.",
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
      "A sentence of the learner's own texts is asked only when it has a stored recording, and the browser's voice is never used. The sentences written for each rule are read by two voices, half by the Stories narrator (ElevenLabs, The Pharaoh 4) and half by Emma (the Word Lists voice); a recording is used only once one is stored (nothing is made at read time): until then that question is silent, with no sound controls.",
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
  videoDictation: {
    id: "videoDictation",
    audience: "learner",
    title: "Video dictation (“فيديو”)",
    description:
      "A new section of the menu: short public-domain videos played from YouTube itself (the official player, with the channel's name and a link to the video) and stopped by the page at the end of every sentence, while the learner types the sentence the way Stories are typed: the whole sentence shown faded and turning white as it is typed, the word being typed with its Arabic meaning above it, a tap on any word for its meaning, and an optional switch that hides the words. When the sentence is finished the video carries on by itself. Arabic only, for the videos the team prepares.",
    notes: [
      "Admins only for now, and nothing else on the site changes: the menu item, the library page and the practice page exist only while this is open for you.",
      "Needs no table: the videos are files in the code for now (src/data/videos), so there is nothing to apply in Supabase.",
      "The player and the videos come from YouTube: the Content-Security-Policy lists three YouTube sources, only on this section's routes (/learn/video and /admin/video).",
      "Before opening it to learners: test a phone and Facebook's and Instagram's built-in browsers, link YouTube's Terms of Service and Google's Privacy Policy from the Terms and Privacy pages, and decide where the text of every video comes from (public domain, a licence, or the creator's permission).",
    ],
  },
  videoNews: {
    id: "videoNews",
    audience: "learner",
    title: "Video: the “جديد” line on Home",
    description:
      "One quiet line under the top bar of the new Home page, “جديد: قسم «فيديو»” with a short sentence, a “try it now” link that opens the section and a close button. A learner who closes the line, or opens the section by any road, never sees it again (remembered in a cookie of their own browser). Nothing else on the page changes: the boxes below it take a little less room for as long as the line is there. Arabic interface only, because the section is Arabic only.",
    notes: [
      "Needs Video dictation and the new Home page to be open for the same people, and stays closed while either is closed (and while Today's session is closed).",
      "Nothing is stored on our side: the “seen” mark is a cookie (ss_video_news) in the learner's own browser, so there is no extra load. Clearing it brings the line back, which is how an admin can look at it again.",
      "The link is a full page load, like the menu item, because the section's pages alone are served with YouTube in the Content-Security-Policy. No picture from YouTube is drawn on Home.",
    ],
  },
  upgradeMoments: {
    id: "upgradeMoments",
    audience: "learner",
    title: "Upgrade cards at moments of progress",
    description:
      "A calm card over the page, in the look of the lock screen, that offers the full plan at three moments of satisfaction: when the day's three tasks are done, on the third day in a row, and after a story finished outside the day's tasks (the learner's second story of the day or later). Each one says what the learner has just achieved and nudges them to keep the pace. The button opens the plans page and «لاحقاً» closes the card. For a free learner only.",
    notes: [
      "At most one card a day, never in an account's first 24 hours, never with an open order or for a subscriber, and a card that was closed stays away for three days.",
      "Every shown, clicked and closed card is recorded (GATE_MOMENT_SHOWN, GATE_MOMENT_CLICKED, GATE_MOMENT_DISMISSED) with its moment, so each can be read apart.",
      "The lock screens on lessons are not touched: they look and read exactly as before.",
      "Arabic, English, Spanish and Turkish. An admin's own account counts as a free learner unless it holds a subscription.",
    ],
  },
  classicHome: {
    id: "classicHome",
    audience: "learner",
    title: "Home: back to the classic page, daily tasks in a small strip",
    description:
      "Home is the classic page again (the header, the lessons, stories and review cards under “Up next”) instead of the new Home page, so the lessons come first. Today's tasks stay, folded into the one-line strip at the top of the page: it no longer opens by itself or glows, and a learner who wants the daily habit taps it to see the tasks. Nothing else changes: Today's tasks deal and count exactly as before.",
    notes: [
      "Wins over the new Home page: for anyone who has this, the new Home page (and the “جديد” line that lives on it) is closed.",
      "For an admin it also hides the admin-only “Today's plan” preview, so an admin sees Home exactly as a learner will.",
      "Closing it brings the new Home page back for whoever has that open.",
    ],
  },
  homeCards: {
    id: "homeCards",
    audience: "learner",
    title: "Home: colourful cards, one “keep learning” card, achievements, a words section",
    description:
      "A new look for the classic Home page. The daily lessons and the stories share one “keep learning” card with two choices inside it (the stories come first); next to it an achievements panel shows the learner's level and four counts; below, the Passages and Video cards each carry their own colour, and a wide words section at the foot holds the words ready for review with a button to review them. The Word Lists page shows that same words section in place of its “Review all words” card. The header's account button becomes the learner's Google photo (or their letter on a colour) beside their name, and the cards lift and settle when the pointer is over them. The daily-tasks strip, the lessons, the review and every link keep working exactly as before.",
    notes: [
      "Lives on the classic Home page: it stays closed whenever the classic Home (above) is closed, whatever its own setting says.",
      "The Google photo is the picture already in the sign-in token, so it costs no extra read; the browser loads it from Google, which the page's security policy now allows for images. A learner without a photo (email sign-up) keeps the letter on a colour.",
      "The colours live in one file (src/components/home-cards/palette.ts), so they can be changed without touching the layout.",
      "Movement is made of transforms and opacity only and stops for a learner whose device asks for reduced motion.",
    ],
  },
  taskSteps: {
    id: "taskSteps",
    audience: "learner",
    title: "Home: the daily tasks as three steps",
    description:
      "The daily-tasks strip on Home shows the day's three tasks as three small circles joined by lines (listen, story, words): a green tick for a finished one, a ring for the one in progress, grey for the rest, with the next task's name beside them and the week's dots made smaller. Tapping the strip makes the same box grow downward with the three tasks listed inside it (instead of a second card under it), and the «start» button sits at the end of the current task's row. The tasks, their order, their links and their rewards are exactly as before.",
    notes: [
      "A look of the daily-tasks strip of the Home cards: it stays closed whenever the Home cards (above) are closed, whatever its own setting says.",
      "Only for the days when the strip shows Today's tasks; the random daily quests keep the strip they had.",
      "The three tasks' icons are the same ones the opened card already uses; there are no new words, so every language is covered.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  contactInstagram: {
    id: "contactInstagram",
    audience: "learner",
    title: "“Contact us” on Instagram in the side menu",
    description:
      "A small “تواصل معنا” box pinned to the foot of the side menu, under the last section, with the Instagram mark and the account name (@sentencestep_arabic). A tap opens a chat with the account on Instagram in a new tab. On a phone with the “More” sheet, the same line is the sheet's last tile.",
    notes: [
      "The link is Instagram's own message link (ig.me/m/sentencestep_arabic), so the learner lands in the chat, not only on the profile.",
      "Nothing is stored or counted on our side: it is a plain link, so there is no extra load.",
      "Phones without the “More” sheet (the Phone: the path and the next step permission closed) do not show it yet.",
    ],
  },
  guestCards: {
    id: "guestCards",
    audience: "learner",
    title: "Home for visitors without an account: the same cards page",
    description:
      "A visitor without an account gets the same Home as a signed-in learner (the cards page: the “keep learning” card, the achievements panel, Passages and Video, the words section) instead of the old classic page. Where a learner has the daily-tasks strip, the visitor has the same box with one line, “Today's tasks · sign up to turn them on and keep your streak”, and the free-account button; the separate “you have a 1-day streak” banner of the old page is not on it.",
    notes: [
      "A look of the Home cards (above): it stays closed whenever they are, whatever its own setting says.",
      "Only visitors without an account change; signed-in learners already have this page.",
      "To look at it as a visitor before opening it: switch preview on for your browser, sign out, and open Home.",
      "It adds no read: the page uses what Home already loads for a visitor.",
    ],
  },
  videoShelves: {
    id: "videoShelves",
    audience: "learner",
    title: "Video: the library as shelves",
    description:
      "The «فيديو» library looks like YouTube's shelves: a header with a short line on top («الإنجليزي كما يتكلّمه أهله»), and each section is one row of tall cards (the Short's own frame, its level and length on the picture, the title and channel under it) with arrows to slide it and «عرض الكل» to open the whole section in place. The sections get new names with one line each (مواقف تضحك، حقائق في دقيقة، حكايات قصيرة، إنجليزي واضح). On a phone (below 640 px) the library keeps its list of rows, with the new header and names.",
    notes: [
      "Only the look changes: the videos, their order (the Admin's saved arrangement, or easiest first) and the arrange mode stay as they are.",
      "The pictures still come from YouTube (i.ytimg.com): a Short uses YouTube's 480x360 picture (about 10 KB) instead of the 320x180 one; nothing is stored on our side.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  videoFinish: {
    id: "videoFinish",
    audience: "learner",
    title: "Video: the new finish screen",
    description:
      "The screen after the last sentence of a «فيديو» video is drawn like the lesson finish screen, in one centred column: the accuracy on the left and «أنهيت الفيديو» on the right, with a bar of one segment per sentence under them (a sentence typed with a mistake is dimmer), up to four words the learner mistyped as cards with their meaning (a tap says the word), a panel with the sentences typed, how many had no mistake and the words typed, then the name of the next video above «الفيديو التالي» and two small buttons (watch on YouTube, back to the videos). No falling dots.",
    notes: [
      "Only the finish screen changes: the practice screen, what is recorded when a video is finished and the rating card stay as they are.",
      "It gives no points or rewards for watching (YouTube's rules): every number on it is about the typing.",
      "It adds no read or write: everything on it comes from the video's own text and what the learner typed on this visit.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  shortOpener: {
    id: "shortOpener",
    audience: "visitor",
    title: "Opening lesson: the short text",
    description:
      "The very first lesson («First Steps», the one a first-time visitor types after choosing a level) keeps its voice and its five sentences but is about half as long: 25 words instead of 46 (“Learning English can be simple / You listen, you type, you learn / Make a mistake, try again / English starts to feel natural / Take your first step”), so the first win comes in about a minute and a half instead of nearly three. The short text lives in three new draft lessons (onboarding-short-beginner, -intermediate, -advanced) that are never listed anywhere; the lesson page reads their sentences and the learner is still on the same opening lesson, so progress, the level read back at sign-up and the next-lesson pick are untouched. The old lessons and their recordings are not changed.",
    notes: [
      "A share of new visitors: that percentage of visitors get the short text, cut by a random token kept in a cookie (ss_vt), so it is the same visitors every time and a bigger share only adds visitors. Choosing 100 gives it to all of them. Admins (and a browser an admin switched preview on for) always have it.",
      "Before opening it to anyone: press Generate once on Admin → Voice → onboarding-short-beginner (the sentences are the same in the three, so the other two find the clips ready). Until a sentence has its recording the lesson plays the browser voice for it.",
      "To compare: every opening-lesson event carries which text was shown (OPENER_STEP.variant, LESSON_STARTED and LESSON_COMPLETED by lesson id are the same for both). Read finished over started, time to finish, sign-ups and the first real lesson finished, per group.",
      "The three draft lessons are never published: the catalog, the lesson list and the cron sweep only see published lessons, which is why this permission does not need them to be.",
    ],
  },
  openerSkip: {
    id: "openerSkip",
    audience: "visitor",
    title: "Opening lesson: «تخطّي الدرس» button",
    description:
      "A quiet «تخطّي الدرس» (skip the lesson) button at the top right of the opening lesson's logo row (14px on a phone, 16px on a laptop, grey, a 44px touch target), with no confirmation. It goes straight to Home and is not a finished lesson: no XP, no streak, no rating card, no starter lesson used, and Home recommends the first real lesson, not the opening lesson again. Which sentence the learner was on is recorded (OPENER_STEP, step skipped).",
    notes: [
      "Skipping bypasses the sign-up screen that the finished opening lesson shows, so this is meant to be tested at a share (say 50%) and read on sign-ups and on the first real lesson finished, per group, before it is given to everyone.",
      "A share of new visitors, cut by the same random token as the short text but independently of it (ss_vt). Admins and a previewing browser always have it.",
      "What a skip remembers is a cookie in the learner's own browser (ss_osk), so the opening lesson is not recommended again there, signed in or not; on another device a signed-in learner who has not finished it is offered it once more and can skip it again.",
    ],
  },
  openerHelp: {
    id: "openerHelp",
    audience: "learner",
    title: "Opening lesson: keyboard hint and audio note",
    description:
      "Two quiet helps in the very first lesson (First Steps), under the translation, that never cover the sentence or stop the typing. The keyboard hint: after two wrong keystrokes in a row that are both Arabic letters (the keyboard is still on Arabic, so every letter flashes red with no reason today) a small box says so and how to switch to English (the globe key on a phone, Alt + Shift on a laptop); it goes away at the next right letter and shows at most twice in a lesson. The audio note: when a sentence's sound cannot be played by any of the existing ways (the recorded clip, then the clip made on demand, then the browser's voice), a calm line says so with a «جرّب مرة ثانية» button, and typing carries on.",
    notes: [
      "Only the opening lesson, for now: no other lesson shows either help. The two helps are decided together by this one permission.",
      "Counting needs nothing from this: OPENER_STEP records, for everyone and with counts only, each time the keyboard hint is shown (keyboard_hint, with the sentence number) and, once per lesson, that the sound failed (audio_failed), so the size of each problem can be read whatever this permission says.",
      "Works for guests too once it is opened to everyone (a share of learners decides on signed-in accounts only, so open it to everyone, or look at it as an admin or with preview on for a browser).",
    ],
  },
  mobilePhoneUx: {
    id: "mobilePhoneUx",
    audience: "learner",
    title: "Phone: lesson screen and lesson list",
    description:
      "On a phone only (below 768 px): the lesson screen gets one slim top bar (an exit cross, the progress bar and the sentence count) and one row of tools (sound, speed, Dictation, settings) so the sentence starts high and the translation and the typing numbers stay above the keyboard, and the Daily Lessons list gets a shorter header and compact lesson rows so seven lessons show on the first screen. Tablets and laptops keep their current layout.",
    notes: [
      "Only the phone layout changes: nothing at 768 px and wider, and no lesson audio or lesson content is touched.",
      "Needs no extra reads or writes: it only changes how the same data is laid out.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  wordLadder: {
    id: "wordLadder",
    audience: "learner",
    title: "Word Lists as rounds of four words (the five-step ladder)",
    description:
      "Inside a Word Lists topic, Learn and Practice become one Continue button that opens the next round: four words (three only where a topic's count needs it). Every word goes through five steps: (1) its meaning and sound, (2) four meanings to choose from, (3) its scrambled letters put in order, (4) its sound and four spellings to choose from, (5) its sound and the learner types it. Steps 1 to 3 go word by word in an order that brings each word back after others (A, B and C are met and asked their meaning, then A's and B's letters, then D joins, then C's and D's letters); then step 4 and step 5 run over every word. A word answered wrong shows its right answer and the same screen comes back three screens later (twice at most), not at the end of the round. The finish page has an exam button: every word of the round heard and typed once, then a score. Only the typed step counts as learned, and a word typed right is saved to the learner's Word Lists progress exactly as the old Practice saved it.",
    notes: [
      "The topics, their words, the free lists and every learner's finished words stay as they are: a word typed right in the old Practice already counts here.",
      "When the Words bank is open for the same people (“wordBank”), the words of a finished round join the learner's bank with the sentence they were met in, so they come back after a few days in a different form; with the bank closed nothing is added to it.",
      "Each round reports WORDS_ROUND events with the source “ladder”, so its finish rate can be set against the old Practice (“list”) and Today's words.",
      "The old Learn and Practice screens are not removed: a learner without this permission still gets them, which keeps them as the comparison.",
      "Needs no new reads or writes beyond what Practice already made: the choices are worked out in the browser from the topic's own words, and a word is written once, when it is typed right.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  wordsPage: {
    id: "wordsPage",
    audience: "learner",
    title: "One Words page («الكلمات»)",
    description:
      "The two menu items «كلماتي» and Word Lists become ONE, «الكلمات» (a single row in the phone's More sheet too), and its page is built around the learner's words: the title with three tabs (Topics, Core, Saved), the words waiting for review in one strip at the top (today's number, how many words the learner knows and the button), then the topics by level as plain cards with the learner's progress. The Core tab holds «كلمات الموقع الأساسية» and the Saved tab the words saved with the star, so nothing has to be looked for in another section; the old «كلماتي» page leads here.",
    notes: [
      "The review strip and the Core tab need the Words bank (“wordBank”) open for the same people, and show only for a signed-in learner; the Saved tab needs the saved words (“Personal word cards”). Without them the page is just the topics, without tabs.",
      "Only the menu and the page change: the topics, their words, the free lists, the review round, the saved words and every learner's progress stay exactly as they are, and Word Lists keeps working at the same address.",
      "Needs no new reads or writes: the strip reads the learner's bank rows once, as «كلماتي» already did.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  wordCovers: {
    id: "wordCovers",
    audience: "learner",
    title: "Word Lists with picture covers",
    description:
      "Every topic of the Word Lists is drawn as a picture cover with its name, how many words are done and a thin progress bar under it, instead of the cards with a line icon. The three levels are rows one under the other, four covers in a row on a laptop and two on a phone. Each topic has a drawing made for it; an admin can replace the picture of any topic with a photo of their own, or go back to the drawing, from the cover itself.",
    notes: [
      "Only the look of the topics changes: the lists, their words, the free lists, the lock, the review strip, the Learn / Practice choice and every learner's progress stay exactly as they are.",
      "The admin's change-picture buttons appear on the covers for an admin only, whoever else this is open to.",
      "Needs the covers migration (20250359000000_word_group_covers.sql) for a chosen picture to be saved; without it every topic shows its drawing and saving a picture says so.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  wordsBanner: {
    id: "wordsBanner",
    audience: "learner",
    title: "Words: the banner at the top",
    description:
      "A deep green band at the top of the Words page: the number of words the learner has learned (counting up when it appears), how many topics are going, one button, and a shelf of books on the other side. Each book is a topic the learner has begun, in the colour of its cover and as tall as they have got in it, with its English title along the spine; the one studied last leans, and a book opens its topic. The button asks for the words waiting for review (with how many), and when none wait it picks up the last topic, or starts the first one for a learner who has not begun (whose shelf shows three dotted places). On entering the books rise one after another; all of it stops for a learner who asked for reduced motion.",
    notes: [
      "It replaces the review card at the top of the page (the words-bank strip on the Words page, the review card on the Word Lists page), so the page gains no element; its button goes where that card's button went.",
      "The learner's progress is read in the browser, as the topics already do, so it costs no new read. The order of a signed-in learner's finished words is now asked from the database (by completion time) so the book studied last can lean.",
      "Below 1280 px it stacks (number, button, shelf) and the shelf shows six books and the leaning one.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page.",
    ],
  },
  faceRatings: {
    id: "faceRatings",
    audience: "learner",
    title: "Ratings as five faces",
    description:
      "Every place a learner rates something shows the five faces of the Words rounds' rating card instead of five stars: the card after a learner's second lesson and the one in Settings, the one-time cards of Passages and Video, the quiet row at the end of a story and of a words review (five small faces that open the same card with the tapped face chosen), and the rating under a book in the Library. The face under the pointer lights up and the others lose their colour; once a face is chosen an optional comment box opens under it. A rating is still a number from 1 (hates it) to 5 (loves it), so nothing in Admin > Ratings or in the site's average changes.",
    notes: [
      "Only the look of the rating changes: the same one-time gates, the same rows in the same table, the same optional comment and (for a guest) the same optional address to be answered at.",
      "The public reviews on the start page and the average quoted on the plans page stay as they are: they show what other learners gave, they are not a place to rate.",
      "Needs no new reads or writes and no migration.",
      "Closed by default, so only admins see it until it is opened to others on the Permissions page; without it every rating keeps its five stars.",
    ],
  },
  mobilePath: {
    id: "mobilePath",
    audience: "learner",
    title: "Phone: the path and the next step",
    description:
      "On a phone only (below 768 px): five tabs in the bottom bar (Path, Passages, Stories, Lessons and More, whose sheet holds Words, the rule library, the Library and Video), a Path tab that lists each level's lessons in order with the one to do now, one next-step button on Home, and a calmer first screen for a guest. Tablets and laptops keep their current layout.",
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
  returnLoop: {
    id: "returnLoop",
    audience: "learner",
    title: "Return loop: “tomorrow” and a reminder at the learner's own time",
    description:
      "A calm card at the end of the first lesson, on the “your progress is saved” page a guest sees once after signing up, and on the end of every session: tomorrow's lesson by name, and one reminder the learner chooses by pressing a time (the same hour as today's session, 8 pm, or none). It arrives ONCE, as a browser notification when the browser supports it and the learner allows it (asked only when they press a time) and as an email to a Google-verified address otherwise, in the hour they chose, naming their next lesson and a word they stumbled on, and opening that lesson directly. Nothing is sent unless the learner pressed a time. On the end of a session the card replaces the “Tomorrow” and “Remind me” cards with one.",
    notes: [
      "Replaces the “Remind me tomorrow” card (the Remind-me email permission) wherever both would show; that permission can stay as it is.",
      "Needs the session_reminders columns (migration 20250356000000) and SESSION_REMINDER_MAX_PER_RUN set on the server; until both exist the card is not offered at all.",
      "A learner who chose a reminder is not sent the generic “your next lesson is ready” email afterwards.",
      "Opened for everyone it also reaches guests: they see the “tomorrow” line on the sign-up page's results and the one-time page after they sign up. Read the effect as before/after on the return rate of learners who sign up (see scripts/return-loop-readout.ts).",
    ],
  },
};
