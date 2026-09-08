/**
 * Shape of every UI-chrome string this app can show, keyed by section. The
 * English strings already live in the components as literals (this app's
 * chrome is English-only today — see the Phase A audit) — this interface is
 * English's shape, and English itself remains the un-translated built-in
 * fallback (see src/lib/i18n/dictionary/en.ts) for exactly that reason: it's
 * not a new "3rd language," it's what already renders when no learner-
 * support translation is available for a key.
 *
 * This is a starting, representative slice (nav/header/footer/hero/auth/
 * switcher/picker/common), not full chrome coverage yet — see the
 * localization checkpoint report for what's still English-literal elsewhere
 * (admin panel, premium upsell screens, lesson completion, word lists,
 * remaining marketing sections). Extending coverage elsewhere is additive:
 * add a key here, then both dictionaries, nothing else changes shape.
 */
export interface Dictionary {
  common: {
    signIn: string;
    signOut: string;
    dashboard: string;
    upgrade: string;
    premium: string;
    freePlan: string;
    startLearning: string;
    continueLearning: string;
    save: string;
    /** The Save toggle's active/pressed state — "Saved" (Lightweight Save + Notes system). Distinct from `save` above, which is the unpressed action label. */
    saved: string;
    cancel: string;
    tryAgain: string;
    loading: string;
    done: string;
    switchToLightMode: string;
    switchToDarkMode: string;
  };
  nav: {
    howItWorks: string;
    learningModes: string;
    freeLessons: string;
    pricing: string;
    normalLessons: string;
    stories: string;
    conversation: string;
    createAccount: string;
    settings: string;
    exitToHome: string;
    home: string;
    wordLists: string;
    /** The Library nav item (books/summaries section) — distinct from `library` below, which is the Stories/Word Lists listing pages' own heading namespace. */
    library: string;
    /** The personal "My Saves" area (Lightweight Save + Notes system) — every sentence the learner has saved and/or annotated, across all books. Not a primary LearnSidebar item (that list is curriculum sections only) — linked from AppHeader instead, next to Settings. */
    mySaves: string;
    ariaLabel: string;
  };
  /** The header's avatar-triggered account popover (header/account-menu redesign) — distinct from `settings` above, which is the standalone settings page's own content. */
  account: {
    /** Aria-label for the header avatar button that opens this popover. */
    menuLabel: string;
    chooseAvatar: string;
    /** Aria-label for one avatar swatch in the picker grid — "{n}" is a 1-based position, e.g. "Avatar 3". Selected state is conveyed separately via aria-pressed. */
    avatarOptionLabel: string;
  };
  footer: {
    tagline: string;
    productColumn: string;
    learningColumn: string;
    accountColumn: string;
    legalColumn: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
  hero: {
    eyebrow: string;
    headingPrefix: string;
    headingEmphasis: string;
    subtitle: string;
    ctaGuest: string;
    ctaNoCard: string;
    ctaSecondary: string;
  };
  localeSwitcher: {
    label: string;
    ariaLabel: string;
  };
  firstTimePicker: {
    heading: string;
    subtitle: string;
    confirm: string;
  };
  /** Settings' "Two-factor authentication" section (src/components/settings/two-factor-settings.tsx) and the login-time code-verification step (src/app/login/verify-mfa/page.tsx). */
  twoFactor: {
    heading: string;
    subtitle: string;
    enable: string;
    disable: string;
    disableConfirm: string;
    enabledBadge: string;
    scanInstructions: string;
    secretFallback: string;
    codeLabel: string;
    codePlaceholder: string;
    verify: string;
    verifying: string;
    cancel: string;
    enabledSuccess: string;
    disabledSuccess: string;
    invalidCode: string;
    genericError: string;
    loginHeading: string;
    loginSubtitle: string;
    loginSubmit: string;
  };
  /** The floating "Report a problem" button and its modal, mounted for every signed-in learner (src/components/app/report-problem-button.tsx). Submissions land in Admin > Reports. */
  reportProblem: {
    buttonLabel: string;
    modalTitle: string;
    modalSubtitle: string;
    placeholder: string;
    submit: string;
    submitting: string;
    cancel: string;
    successTitle: string;
    successBody: string;
    errorEmpty: string;
    errorGeneric: string;
  };
  /** The first-time starting-level placement picker (src/components/app/starting-level-onboarding.tsx) — tier names themselves come from src/lib/levels.ts's tierSupportLabel, not from here. */
  onboarding: {
    heading: string;
    subtitle: string;
    beginnerBody: string;
    intermediateBody: string;
    advancedBody: string;
    skip: string;
    back: string;
    /** Onboarding intro card's (src/components/app/onboarding-intro-card.tsx) "enter the lesson" button — the flow's third and last step. */
    startCta: string;
  };
  /** The premium "pitch" screen shown instead of the ordinary LessonCompletion when a first-time learner finishes their opening lesson (src/components/learning/onboarding-lesson-complete.tsx) — the get-started flow's real final step, bookending onboarding.heading/onboardingIntroCard's startCta. Four fixed benefit points, not a dynamic list. */
  onboardingComplete: {
    eyebrow: string;
    headline: string;
    point1Title: string;
    point1Body: string;
    point2Title: string;
    point2Body: string;
    point3Title: string;
    point3Body: string;
    point4Title: string;
    point4Body: string;
    cta: string;
  };
  auth: {
    loginHeading: string;
    loginSubtitle: string;
    confirmationFailed: string;
    emailLabel: string;
    passwordLabel: string;
    signingIn: string;
    noAccount: string;
    createOne: string;
    checkInbox: string;
    checkInboxBody: string;
    registerHeading: string;
    registerSubtitle: string;
    displayNameLabel: string;
    optional: string;
    passwordHint: string;
    creatingAccount: string;
    hasAccount: string;
    notConfiguredHeading: string;
    notConfiguredBody: string;
    errors: {
      invalidCredentials: string;
      accountExists: string;
      passwordTooShort: string;
      invalidEmail: string;
      emailRateLimited: string;
      emailNotConfirmed: string;
      missingFields: string;
      networkError: string;
      genericError: string;
      passwordMismatch: string;
      tooManyAttempts: string;
      captchaFailed: string;
    };
    forgotPassword: string;
    forgotPasswordHeading: string;
    forgotPasswordSubtitle: string;
    sendResetLink: string;
    sendingResetLink: string;
    resetLinkSent: string;
    backToSignIn: string;
    resetPasswordHeading: string;
    resetPasswordSubtitle: string;
    resetPasswordButton: string;
    resettingPassword: string;
    resetPasswordSuccess: string;
    resetLinkInvalid: string;
    showPassword: string;
    hidePassword: string;
    termsAgreementPrefix: string;
    termsAgreementAnd: string;
  };
  premium: {
    /** Generic `{title} — premium content, tap for details` aria-label, reused across lesson/story/word-group cards — see wordLists.lockedAriaLabel's doc comment for why the word-group-specific wording it used to carry was replaced by this. */
    lockedContentAriaLabel: string;
    premiumHeading: string;
    upgradeHeading: string;
    premiumSubtitle: string;
    upgradeSubtitle: string;
    fullAccessHeading: string;
    thanksWithDate: string;
    thanks: string;
    backToLearning: string;
    cancelAnytime: string;
    everythingInFree: string;
    benefits: string[];
    signInToUpgrade: string;
    redirecting: string;
    opening: string;
    manageBilling: string;
    lockedBenefits: string[];
    premiumLessonBadge: string;
    lockedBody: string;
    backToLessons: string;
    upgradeCta: string;
    contentUnavailableBody: string;
    /** Home hero's dead-end state once a free learner has completed every free lesson (see HomeHero) — distinct from lockedBody, which is per-lesson. */
    homeFreeCompleteHeading: string;
    homeFreeCompleteBody: string;
    /** Home hero's state once a premium/admin learner has completed every lesson across every level. */
    homeAllDoneHeading: string;
    homeAllDoneBody: string;
    /** The /upgrade page's Free-vs-Premium comparison table (src/components/billing/plan-comparison.tsx) — row labels are reused from nav.normalLessons/stories/conversation/wordLists rather than duplicated here. */
    comparisonHeading: string;
    featureColumnHeading: string;
    freeLevelAccess: string;
    premiumLevelAccess: string;
    freeWordListsAccess: string;
    premiumWordListsAccess: string;
    includedLabel: string;
    faqHeading: string;
    faqIncludedQ: string;
    faqIncludedA: string;
    faqCancelQ: string;
    faqCancelA: string;
    faqProgressQ: string;
    faqProgressA: string;
    faqTrialQ: string;
    faqTrialA: string;
    faqSwitchQ: string;
    faqSwitchA: string;
  };
  lesson: {
    completeHeading: string;
    accuracyExcellent: string;
    accuracyGood: string;
    /** Bare unit label next to the accuracy percentage in the in-session stats readout (e.g. "87% accuracy") — distinct from accuracyExcellent/accuracyGood, which are full completion-screen sentences. */
    accuracyLabel: string;
    wpmLabel: string;
    streakLabel: string;
    xpEarnedLabel: string;
    dailyGoalLabel: string;
    /** Heading for the lesson-completion screen's own daily-progress card — deliberately distinct text from dailyGoalLabel (shared with HomeSummary/BookCompletion, left unchanged there), framing today's count as progress made rather than a quota still owed. */
    dailyProgressLabel: string;
    sentencesUnit: string;
    wordReadyToReview: string;
    wordsReadyToReview: string;
    vocabularyHeading: string;
    nextLesson: string;
    fixMistakes: string;
    youAreOn: string;
    readyToStart: string;
    completeCount: string;
    noLessonsYet: string;
    noLessonsYetBody: string;
    level: string;
    story: string;
    /** Stories mode only — rough reading time left in the header, e.g. "~2 min left". A coarse estimate from remaining word count, never exact. */
    storyTimeRemaining: string;
    lessonNumber: string;
    sentenceCount: string;
    /** Conversation-mode lesson cards, e.g. "30 lines" — dialogue turns, not sentenceCount's generic "sentences". */
    lineCount: string;
    /** Screen-reader-only session progress announcement, e.g. "Sentence 3 of 9". */
    sentenceProgress: string;
    /** Screen-reader-only alt text for a lesson's illustration, e.g. `Illustration for the "The Wrong Order" lesson`. */
    illustrationAlt: string;
    /** Normal-mode lesson screen — label/title for the toggle button that shows the topic illustration (the default view). */
    illustrationViewImage: string;
    /** Normal-mode lesson screen — label/title for the toggle button that swaps the illustration for a running list of already-typed sentences. */
    illustrationViewList: string;
    /** Shown on the completion screen while recordCompletionAction is still in flight for a signed-in learner. */
    savingProgress: string;
    /** Shown in place of savingProgress if that save fails — paired with retry. */
    saveFailed: string;
    retry: string;
    /** Reward-strip milestone text (see RewardEvent in src/lib/progress/types.ts) — {level} is the already-localized learner level name (see learnerLevelSupportLabel), never the raw English LearnerLevel.name. */
    rewardLevelUp: string;
    /** Same "N day streak" text as progress.streakDaySingular/streakDayPlural — duplicated here rather than shared because a lesson-completion reward and the dashboard's streak readout are allowed to diverge in wording later without one accidentally changing the other. */
    rewardStreakSingular: string;
    rewardStreakPlural: string;
    rewardLessonCompleteSingular: string;
    rewardLessonCompletePlural: string;
    rewardDailyGoalReached: string;
  };
  mistakes: {
    itemsLeft: string;
    loading: string;
    nothingToFix: string;
    allCaughtUp: string;
    loadError: string;
    correctedCount: string;
    noOutstanding: string;
    learningHome: string;
    /** Short label under the completion screen's "+N" hero number — e.g. "words fixed". */
    fixedLabel: string;
    /** Eyebrow label shown instead of lesson.fixMistakes while the current item is a due spaced review, not a fresh mistake — deliberately softer ("let's see if you still remember this", not "you got this wrong"). */
    reviewLabel: string;
    /** Heading for the completion screen's inline "this lesson's mistakes" recap (see SessionMistake) — deliberately calm/educational, never "errors" or "warnings". */
    sessionHeading: string;
    /** Subtitle under sessionHeading, e.g. "You had trouble with 2 word(s) in this lesson." */
    sessionCount: string;
  };
  settings: {
    signInHeading: string;
    signInSubtitle: string;
    heading: string;
    signedInAs: string;
    emailPrefsHeading: string;
    emailPrefsSubtitle: string;
    learningReminders: string;
    learningRemindersBody: string;
    progressEmails: string;
    progressEmailsBody: string;
    savePreferences: string;
    savingPreferences: string;
    essentialEmailNotice: string;
    /** Profile section: display name. */
    profileHeading: string;
    profileSubtitle: string;
    displayNameLabel: string;
    saveDisplayName: string;
    savingDisplayName: string;
    displayNameSaved: string;
    displayNameInvalid: string;
    /** Password section — shares auth.errors.passwordTooShort/passwordMismatch rather than duplicating them. */
    passwordHeading: string;
    passwordSubtitle: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    updatePassword: string;
    updatingPassword: string;
    passwordUpdated: string;
    /** Daily goal section. */
    dailyGoalHeading: string;
    dailyGoalSubtitle: string;
    dailyGoalInputLabel: string;
    saveDailyGoal: string;
    savingDailyGoal: string;
    dailyGoalSaved: string;
    dailyGoalError: string;
    dailyGoalInvalid: string;
    /** Starting-level section — reuses src/lib/levels.ts's tierSupportLabel for the Beginner/Intermediate/Advanced option labels rather than duplicating them here. */
    startingLevelHeading: string;
    startingLevelSubtitle: string;
    startingLevelNotChosen: string;
    startingLevelSaved: string;
    startingLevelError: string;
    /** Avatar section (moved/exposed here — see AccountMenu, which keeps its own copy too). */
    avatarHeading: string;
    avatarSubtitle: string;
    /** Account-management section. */
    accountHeading: string;
    accountSubtitle: string;
    planLabel: string;
    memberSinceLabel: string;
    /** Danger zone: data export + account deletion. */
    dangerZoneHeading: string;
    dangerZoneSubtitle: string;
    exportDataHeading: string;
    exportDataBody: string;
    exportDataButton: string;
    exportingData: string;
    exportDataError: string;
    deleteAccountHeading: string;
    deleteAccountBody: string;
    deleteAccountButton: string;
    deleteAccountConfirmHeading: string;
    deleteAccountConfirmBody: string;
    deleteAccountConfirmPlaceholder: string;
    deleteAccountConfirmButton: string;
    deletingAccount: string;
    deleteAccountError: string;
    deleteAccountMismatch: string;
  };
  errors: {
    globalHeading: string;
    globalBody: string;
    notFoundHeading: string;
    notFoundBody: string;
    backHome: string;
    lessonNotFoundHeading: string;
    lessonNotFoundBody: string;
    backToDashboard: string;
  };
  progress: {
    streakDaySingular: string;
    streakDayPlural: string;
    /** Bare unit label ("day"/"days"), no {n} — HomeSummary's big streak number is rendered separately from its label now, so a template placeholder would leak as literal text. */
    streakUnitSingular: string;
    streakUnitPlural: string;
    streakStart: string;
    continueMode: string;
    startMode: string;
    freeCount: string;
    /** `Welcome back, {name}` — the Home dashboard's small personal greeting (see HomeSummary), shown only when the signed-in learner has a real display name; a nameless learner/guest instead gets the existing `auth.loginHeading` ("Welcome back") with no name inserted. */
    welcomeBackLabel: string;
    /** Small section eyebrow above HomeHero's card grid — Home dashboard organization pass. */
    upNextLabel: string;
  };
  /** The Home page's Sessions/Lines/Words stat row (src/components/app/home-hero.tsx). */
  stats: {
    sessionsLabel: string;
    linesLabel: string;
    wordsLabel: string;
  };
  wordLists: {
    /** Heading/subtitle for the Word Lists dashboard's "Review All Words" hero card — see src/lib/weak-words and NeedsReviewWords. Links to /learn/word-lists/review, which quizzes only these specific weak words. */
    needsReviewHeading: string;
    needsReviewSubtitle: string;
    wordCount: string;
    premiumGroup: string;
    navLabel: string;
    previewModeNotice: string;
    complete: string;
    progressLabel: string;
    wordsUnit: string;
    backToWordLists: string;
    practiceAgain: string;
    wordListBadge: string;
    completedBefore: string;
    /** Hint shown under the fill-in-the-blank word once the learner has typed something wrong-length-or-content and needs to submit it for grading — see VocabularySentence's Enter-to-check flow. */
    pressEnterToCheck: string;
    unavailableBody: string;
    lockedBadge: string;
    lockedBody: string;
    wordsAndHintDetail: string;
    /** Label for the "Learn" action (flashcard/study view) — one of the two choices offered when a word-group card expands, alongside practiceAction. */
    learnAction: string;
    /** Label for the "Practice" action (the existing fill-in-the-blank exercise) — the card expansion's other choice. */
    practiceAction: string;
    /** Button at the bottom of the Learn flashcard view that hands off to the practice exercise for the same group. */
    startTest: string;
    /** Label for the Learn view's labeled replay button (PronunciationButton's `label` prop) — deliberately kept as the English word across locales to match the app's existing convention of English micro-copy for playback controls (see pronunciation.replayHint's "Shift" keycap). */
    replayAction: string;
    /** Aria-label for the Learn view's sidebar-toggle button (shows/hides the full word list panel). */
    wordListPanelAria: string;
    /** Aria-label for the Learn view's "previous word" arrow control. */
    prevWordAria: string;
    /** Aria-label for the Learn view's "next word" arrow control. */
    nextWordAria: string;
  };
  library: {
    storiesHeading: string;
    storiesSubtitle: string;
    storiesEmptyHeading: string;
    levelTabsAriaLabel: string;
    previousPage: string;
    nextPage: string;
    wordListsHeading: string;
    wordListsDescription: string;
    wordListsEmptyHeading: string;
    checkBackSoon: string;
    moreGroupsSoon: string;
  };
  /** The Library homepage (books/summaries) — see `nav.library` for the nav item and `library` above for the unrelated Stories/Word Lists heading namespace. Foundation-phase UI chrome only; book/category content itself is translated later via content_translations, not here. */
  bookLibrary: {
    heading: string;
    subtitle: string;
    /** Small supporting-text disclaimer shown wherever the Library could be mistaken for official/licensed books — the home page and each Book Overview page: these are original summaries, not full book texts or authorized editions. */
    libraryDisclaimer: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    allCategories: string;
    categoryNavAriaLabel: string;
    noSearchResultsHeading: string;
    noSearchResultsBody: string;
    featuredHeading: string;
    emptyHeading: string;
    emptyBody: string;
    categoryEmptyHeading: string;
    categoryEmptyBody: string;
    byAuthor: string;
    continueReading: string;
    /** Heading for the Library homepage's "books you've finished" shelf — only rendered when the signed-in learner has actually completed at least one book. */
    completedBooksHeading: string;
    startReading: string;
    percentComplete: string;
    sections: string;
    sentences: string;
    estimatedMinutes: string;
    estimatedTime: string;
    overviewComingSoonBody: string;
    backToLibrary: string;
    /** Book Overview's section list heading (sequential chapter unlocking) — the full ordered list of a book's sections, each with its own unlock state. */
    sectionsListHeading: string;
    /** `{completed} / {total} Sections` — the Book Overview's overall section-progress readout, directly above the section list's progress bar. */
    sectionsProgressLabel: string;
    /** State badge for a section the reader hasn't reached yet — visible in the list, but not enterable. */
    sectionLocked: string;
    /** State badge for a section the reader has already read through. */
    sectionCompletedLabel: string;
    /** `Section {n} of {total}` — the Section Intro screen's position-in-book indicator (1-based). */
    sectionOfTotal: string;
    /** Book Learning Engine (Section 8 of the reading-engine spec): the reading screen, section transitions, and book completion. */
    beginSection: string;
    sectionCompleteHeading: string;
    sectionCompleteBody: string;
    continueToNextSection: string;
    bookCompleteHeading: string;
    bookCompleteBody: string;
    /** Lead-in above the Book Completion screen's quote from the book's own `description` — framed retrospectively as what the reader actually gained, never an invented takeaway field. */
    bookCompleteLead: string;
    backToBookOverview: string;
    /** `Page {n}` — the reading screen's page-navigation indicator (Book Reading Experience Enhancements, addition 2). Always derived from the real sentence position, never an invented count. */
    pageLabel: string;
    /** `Page {n} of {total}` — the Real Page Model's page-navigation indicator (Phase 4): a real, multi-sentence page within the current section, never a sentence count. */
    pageOfTotal: string;
    /** The reading screen's quiet instructional note for the click-to-highlight interaction (addition 3). */
    clickHint: string;
    /** The one word within `clickHint` that gets the highlight-mark treatment (see BookReadingSession's hint stack) — must be an exact, case-matching substring of that same locale's `clickHint`, or the highlight silently falls back to plain text. */
    clickHintHighlight: string;
    /** Book Reading's manual advance control (read/listen-first redesign): moves to the next sentence without requiring it to be typed — typing stays available and optional, and still completes the sentence the same way it always has if the learner does type it. Named around "sentence," not a bare "Next," to read as part of reading a book rather than a generic wizard-step control. */
    nextSentence: string;
    /** Book Reading's "review the previous sentence" control — moves the active pointer back one sentence within the current section for review (BookReadingSession.goToPreviousSentence). Local/client-only: never un-records a completion already saved server-side. Hidden (not just disabled) at the section's first sentence, so it's absent whenever there's nowhere to go back to. */
    previousSentence: string;
    /** Clickable invitation shown in place of TypingStats before the learner has typed anything this sentence (read/listen-first redesign) — makes the now-optional typing practice discoverable without requiring it. Clicking it just focuses the same always-present invisible input. */
    typingInviteHint: string;
    /** Save + Note controls on the reading screen (Lightweight Save + Notes system) — `common.save`/`common.saved` label the Save toggle itself; these are the Note popover's own strings. */
    /** The combined Save/Note/Speed trigger's label (BookReadingTools) — kept short since it sits in a compact pill above the sentence. */
    readingToolsLabel: string;
    noteAdd: string;
    noteEdit: string;
    notePlaceholder: string;
    noteSave: string;
    noteDelete: string;
    /** Shown in a compact popover when a signed-out reader taps Save or Note — explains why the action needs an account, next to a link into the existing login flow. */
    signInToSave: string;
    /** "Practice" — a saved sentence card's action back into the existing reading flow (My Saves). */
    practice: string;
    /** My Saves page: no saved sentences yet. */
    mySavesEmptyHeading: string;
    mySavesEmptyBody: string;
    mySavesSignInHeading: string;
    mySavesSignInSubtitle: string;
    mySavesLoadMore: string;
    /** My Saves page: CTA into a typing review session over every currently saved sentence. */
    reviewSaves: string;
    reviewCompleteHeading: string;
    /** "{n}" replaced with the count of sentences reviewed this session. */
    reviewCompleteBody: string;
    /** A saved sentence card's "share as image" action — exports the sentence + translation as a downloadable/shareable quote image. Used as that button's aria-label/title; the button's own visible text is the shorter `share` below. */
    shareSentence: string;
    /** Short form of shareSentence — the saved sentence card's footer button label itself, sized to match "practice" (a single short word). */
    share: string;
    /** Home dashboard: eyebrow label above a resurfaced saved sentence. */
    savedSpotlightLabel: string;
    /** Saved sentence card's corner "expand" control — opens the sentence full-screen (see SavedSentenceFocusOverlay). */
    focusSentence: string;
  };
  pronunciation: {
    normalSpeed: string;
    slow: string;
    verySlow: string;
    speedButtonLabel: string;
    replayHint: string;
    playLabel: string;
    replayLabel: string;
    /** `Pronounce "{word}"` — a single word's pronunciation-button aria-label. */
    pronounceWord: string;
  };
  typing: {
    typeMissingWord: string;
    /** `Type this sentence: {sentence}` — the hidden typing input's aria-label when nothing is obscured. */
    typeThisSentence: string;
  };
  /** The five XP-based learner levels (see src/lib/progress/learner-level.ts) — a separate progression from the lesson-difficulty tiers in src/lib/levels.ts, keyed by LearnerLevel.name so the underlying English name stays a stable identifier. */
  learnerLevels: {
    beginner: string;
    explorer: string;
    builder: string;
    fluent: string;
    advanced: string;
  };
  /** The logged-out marketing homepage (src/app/page.tsx) — always reachable for a signed-out visitor, first visit or returning (see middleware.ts's handleRootRoute), and locale-aware throughout. */
  marketing: {
    howItWorksHeading: string;
    howItWorksSubtitle: string;
    stepListenTitle: string;
    stepListenBody: string;
    stepTypeTitle: string;
    stepTypeBody: string;
    stepRepeatTitle: string;
    stepRepeatBody: string;
    stepProgressTitle: string;
    stepProgressBody: string;
    progressHeading: string;
    progressSubtitle: string;
    dailyStreaksTitle: string;
    dailyStreaksBody: string;
    perLessonAccuracyTitle: string;
    perLessonAccuracyBody: string;
    freeHeading: string;
    freeSubtitle: string;
    /** `free {mode}`, e.g. "free stories" — {mode} is substituted with the already-lowercased mode title. */
    freeModeCount: string;
    startLearningFree: string;
    premiumHeading: string;
    /** `Premium unlocks everything SentenceStep offers, for {price}.` */
    premiumSubtitle: string;
    unlockPremiumCta: string;
    modesHeading: string;
    modesSubtitle: string;
    /** Descriptions for the three modes, shown next to their nav.* titles (nav.normalLessons/stories/conversation) — kept here rather than duplicating title keys. */
    normalModeDescription: string;
    storiesModeDescription: string;
    conversationModeDescription: string;
    /** `{lessons} lessons · {sentences} sentences` */
    lessonsAndSentences: string;
    /** `Explore {mode}` */
    exploreMode: string;
    typeTheSentenceCaption: string;
    demoStepSee: string;
    demoStepHear: string;
    demoStepType: string;
    demoStepProgress: string;
    openMenu: string;
    closeMenu: string;
    primaryNav: string;
    ctaWelcomeBack: string;
    ctaWelcomeBackBody: string;
    ctaTryFirst: string;
    ctaTryFirstBody: string;
    startFirstLesson: string;
    homeLinkAriaLabel: string;
    dashboardLinkAriaLabel: string;
  };
}
