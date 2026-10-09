import type { BadgeId } from "@/lib/features/catalog";

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
    /** Home's main card eyebrow/CTA specifically when there's a real mid-lesson checkpoint to resume (see lesson-resume.ts) — distinct from continueLearning, which just means "not this learner's very first lesson ever." */
    resumeLesson: string;
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
    /** Visible label on the header account trigger button, next to the avatar (e.g. "Manage account"). */
    manageAccountLabel: string;
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
  /**
   * The homepage "get started" flow's brand-new first step
   * (src/components/app/intro-landing.tsx), shown before firstTimePicker
   * for a first-time, cookie-less visitor. Reuses hero.headingPrefix/
   * headingEmphasis for its heading, marketing.demoStepSee/Hear/Type/
   * Progress for its four-icon row, firstTimePicker.confirm for its
   * Continue button, and lesson.wpmLabel/accuracyLabel for the demo card's
   * stat pills — this section only holds the strings unique to this step.
   */
  introLanding: {
    eyebrow: string;
    subtitle: string;
    noAccountNote: string;
    signInInstead: string;
    nextHint: string;
    demoBadge: string;
    demoMeta: string;
    demoLiveNote: string;
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
  /** "Problem with your payment?" (src/components/billing/report-payment-problem.tsx): filed through submitPaymentReport, which alerts the admins at once. */
  paymentReport: {
    trigger: string;
    title: string;
    subtitle: string;
    categoryPaidNotActive: string;
    categoryFailed: string;
    categoryWrongPrice: string;
    categoryOther: string;
    notePlaceholder: string;
    notePlaceholderOther: string;
    send: string;
    sending: string;
    cancel: string;
    errorChoose: string;
    errorNote: string;
    errorTooMany: string;
    errorSignIn: string;
    errorGeneric: string;
    successTitle: string;
    successBody: string;
    recheckTitle: string;
    recheckBody: string;
    recheckCta: string;
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
  /**
   * The "get started" flow's third step (src/components/app/country-onboarding.tsx),
   * between StartingLevelOnboarding and OnboardingIntroCard — optional, so
   * its own copy is the only thing distinguishing it from a required step;
   * `onboarding.back` is reused for its back button rather than duplicated
   * here. Country names themselves come from the browser's own
   * Intl.DisplayNames per src/lib/i18n/country-codes.ts's doc comment, never
   * translated by hand in this dictionary. Required, not skippable — see
   * CountryOnboarding's own doc comment — so there is no "skip" string here.
   */
  countryOnboarding: {
    heading: string;
    subtitle: string;
    searchPlaceholder: string;
    noResults: string;
    /** Heading inside the search modal that opens once the collapsed field is tapped — distinct from `heading` above, which stays on the page behind it. */
    modalTitle: string;
    /** Aria-label for the modal's close (X) button. */
    closeLabel: string;
  };
  /**
   * The "get started" flow's fourth step (src/components/app/tutorial-onboarding.tsx),
   * between CountryOnboarding and OnboardingIntroCard — a four-slide, dot-progress
   * walkthrough of how the app's learning loop works, shown once per guest session.
   * Skippable at any slide via `skip`, which resolves the step exactly like finishing
   * slide 4 does. `continueCta` advances slides 1-3; slide 4 shows `startCta` instead,
   * since it hands off to OnboardingIntroCard rather than looping to another slide.
   */
  tutorialOnboarding: {
    title1: string;
    body1: string;
    title2: string;
    body2: string;
    title3: string;
    body3: string;
    title4: string;
    body4: string;
    continueCta: string;
    startCta: string;
    skip: string;
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
    /** Guest-only variant of `cta` — the primary button on this screen when there's no account yet to lose progress in. */
    ctaSignup: string;
    ctaSignupHelper: string;
    /** The low-pressure secondary link next to ctaSignup — guests are never blocked from moving on without an account. */
    ctaGuestContinue: string;
  };
  /**
   * The dismissible "you're browsing as a guest" reminder on the Home
   * dashboard (src/components/app/guest-progress-banner.tsx) — only ever
   * shown once a guest has real progress worth protecting (see that
   * component's own doc comment), never to a brand-new visitor.
   */
  guestBanner: {
    titleSingular: string;
    titlePlural: string;
    /** Shown when currentStreak is 0 (progress exists as completions/XP, just no active streak) — never shown alongside a real day count. */
    titleFallback: string;
    subtitle: string;
    cta: string;
    dismissAria: string;
  };
  /** The optional, one-time "rate the app" prompt shown over the ordinary LessonCompletion screen — see RatingPrompt. */
  rateApp: {
    headline: string;
    subtitle: string;
    commentPlaceholder: string;
    /** Shown only to a visitor who isn't signed in: an optional address so we can answer them. */
    emailPlaceholder: string;
    skip: string;
    submit: string;
    thanksTitle: string;
    thanksBody: string;
    starLabelSingular: string;
    starLabelPlural: string;
  };
  auth: {
    loginHeading: string;
    loginSubtitle: string;
    confirmationFailed: string;
    googleSignIn: string;
    orDivider: string;
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
      /** Supabase's mailer couldn't send the confirmation email ("Error sending confirmation email") — a server-side mail setup problem, not something the learner did wrong. */
      confirmationEmailFailed: string;
      emailNotConfirmed: string;
      /** A password that is too easy to guess or, with leaked-password protection on in Supabase, found in a known data breach. */
      passwordWeak: string;
      missingFields: string;
      networkError: string;
      genericError: string;
      passwordMismatch: string;
      tooManyAttempts: string;
      captchaFailed: string;
      oauthFailed: string;
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
    /** Short chip centered on a locked lesson/story cover (PremiumLockOverlay) — says the card needs a subscription, in a few words. */
    lockedChip: string;
    premiumHeading: string;
    upgradeHeading: string;
    premiumSubtitle: string;
    upgradeSubtitle: string;
    fullAccessHeading: string;
    thanksWithDate: string;
    thanks: string;
    backToLearning: string;
    /** The line under the price: what it buys — `{days}` is the number of days of the plan. */
    accessForDays: string;
    everythingInFree: string;
    benefits: string[];
    signInToUpgrade: string;
    redirecting: string;
    /** Short chip beside the price: it is a single purchase, not a subscription. */
    oneTimeBadge: string;
    /** Under the price — `{amount}` is the USD price per day, e.g. "$0.07". */
    perDayCaption: string;
    /** Heading and three short steps (`{days}` is the plan's days in the last one) above the checkout button. */
    checkoutStepsHeading: string;
    checkoutSteps: string[];
    /** The three reassurance chips under the checkout button. */
    trustSecure: string;
    trustNoRenewal: string;
    trustInstant: string;
    /** Neutral heads-up above the checkout button: the provider's own page may show the amount in another currency. It deliberately names no currency and no amount. */
    paymentPartnerNote: string;
    /** Under the checkout button: card or wallet details are handled by the payment partner, never by us. */
    paymentDetailsCaption: string;
    /** The line by the pay button saying every purchase is final and linking the Terms: the text before the link, the link text, and the text after it, so each language can put the link where its grammar wants it. */
    termsNoticePrefix: string;
    termsNoticeLink: string;
    termsNoticeSuffix: string;
    /** The three real figures shown above the plan card, and their heading ("What Premium opens"). The count is formatted separately; these are only the labels. */
    contentStatsHeading: string;
    contentStatLessons: string;
    contentStatWords: string;
    contentStatWordLists: string;
    /** One honest comparison line inside the card; {amount} is the cheapest monthly price, e.g. "$1.17". */
    compareLine: string;
    /** The short, positive note above the pay button while Wayl's page shows dollars (the long paymentPartnerNote is used when it shows dinars). */
    paymentPartnerNoteShort: string;
    /** The label before the names of the accepted ways to pay. */
    acceptedMethodsLabel: string;
    /** The real-ratings line; {rating} is e.g. "4.8" and {count} the rounded-down number of ratings. */
    socialProofRating: string;
    /** The short pay-button label in the phone's sticky pay bar, where the price is already shown beside it. */
    payShort: string;
    /** Heading of the "add more days" block for a current Premium learner. */
    extendHeading: string;
    /** `{days}` is the number of days of the chosen plan. */
    extendStackNote: string;
    /** The three plan names (1 / 3 / 6 months), shown on the plan cards. */
    plan1m: string;
    plan3m: string;
    plan6m: string;
    choosePlanHeading: string;
    /** `{amount}` is the plan's USD price per 30 days, e.g. "$1.33". */
    perMonthCaption: string;
    /** `{percent}` is a whole number, e.g. 33. */
    saveBadge: string;
    /** Ribbon on the pre-selected plan; "Best value" marks the longest one. */
    recommendedBadge: string;
    bestValueBadge: string;
    /** The checkout button for the selected plan — `{price}` e.g. "$4", `{days}` e.g. 90. */
    payCta: string;
    /** In-app banner shown in the last week of a dated Premium period. `{days}` is 3-7; two days, tomorrow and today have their own wording so every language gets the grammar right. */
    expiryBannerTitleDays: string;
    expiryBannerTitleTwoDays: string;
    expiryBannerTitleTomorrow: string;
    expiryBannerTitleToday: string;
    expiryBannerBody: string;
    /** Shown instead of the body while the learner has a live streak of three or more days — `{streak}` is its length. */
    expiryBannerStreakBody: string;
    expiryBannerCta: string;
    expiryBannerDismiss: string;
    /** Note on Home for a learner who started paying and left with the payment link still open; the button goes straight back to that link. */
    finishPaymentTitle: string;
    finishPaymentBody: string;
    finishPaymentCta: string;
    /** What a signed-out visitor sees on /upgrade while the sitewide free-access promotion is on: no plan and no price, just that everything is open and how to keep progress. */
    freeNowHeading: string;
    freeNowSubtitle: string;
    freeNowBadge: string;
    freeNowBody: string;
    /** "7 days" in each language's grammar — `{days}` is the number; see formatDayCount. Arabic uses all four forms, the others only "one" and "few". */
    dayCountOne: string;
    dayCountTwo: string;
    dayCountFew: string;
    dayCountMany: string;
    /** Notice above the plan cards while the launch offer runs — `{days}` is a formatted day count ("7 days"), `{date}` the last day. */
    launchOfferBanner: string;
    /** Chip on each plan card — `{days}` is a formatted day count. */
    launchOfferChip: string;
    /** Real aggregate figures under the pay button — `{count}` is a rounded-down, formatted number (see src/lib/stats/social-proof.ts). Only shown when the figure is large enough to quote. */
    socialProofLearners: string;
    socialProofLessons: string;
    /** Settings' plan row: "Premium until {date}". */
    premiumUntil: string;
    premiumLessonBadge: string;
    backToLessons: string;
    /** The locked-lesson and locked-word-list card (see PremiumGate): a heading and one line above three benefits, then the button. The price line under it is fromPerMonthCaption. */
    gateHeading: string;
    gateSubheading: string;
    /** `{count}` is a rounded-down, formatted number such as "190+" (see src/lib/stats/gate-figures.ts); the Plain form is used while the library is too small to quote. */
    gateBenefitLibrary: string;
    gateBenefitLibraryPlain: string;
    gateBenefitMethod: string;
    gateBenefitProgress: string;
    gateCta: string;
    /** The reassurance under the price: one payment, no auto-renewal, nothing to cancel. Says nothing about refunds or time limits. */
    gateTrust: string;
    /** Small caption under the upgrade CTA on locked content — `{amount}` is the cheapest per-month USD price for the visitor's tier, e.g. "$1.17". It names no currency but USD and no provider. */
    fromPerMonthCaption: string;
    contentUnavailableBody: string;
    /** Home hero's dead-end state once a free learner has completed every free lesson (see HomeHero) — distinct from lockedBody, which is per-lesson. */
    homeFreeCompleteHeading: string;
    homeFreeCompleteBody: string;
    /** The calm button on the locked-lesson page and the finished-the-starter-lessons card; the plans page it opens states the price. */
    seePlansCta: string;
    /** The Home page's starter-lessons line (see StarterPathProgress): a free learner's progress through the lessons open to everyone. */
    starterProgressLabel: string;
    starterProgressDone: string;
    /** `{done}` and `{total}` — read out by screen readers for the progress bar. */
    starterProgressAria: string;
    /** After paying, the button back to the lesson the learner was stopped at. */
    continueLesson: string;
    /** Home hero's state once a premium/admin learner has completed every lesson across every level. */
    homeAllDoneHeading: string;
    homeAllDoneBody: string;
    faqHeading: string;
    faqCurrencyQ: string;
    faqCurrencyA: string;
    faqDeclinedQ: string;
    faqDeclinedA: string;
    faqProgressQ: string;
    faqProgressA: string;
    /** Errors shown by the checkout action (src/lib/billing/checkout-actions.ts). */
    checkoutNotConnected: string;
    checkoutSignIn: string;
    checkoutTryAgain: string;
    checkoutTooManyAttempts: string;
    /** The /billing/return page, shown when the payment provider sends the learner back. `{date}` is the premium end date. */
    paymentConfirmedHeading: string;
    paymentConfirmedBody: string;
    paymentPendingHeading: string;
    paymentPendingBody: string;
    paymentNotCompletedHeading: string;
    paymentNotCompletedBody: string;
    paymentReviewHeading: string;
    paymentReviewBody: string;
    paymentNotFound: string;
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
    /** Heading for the lesson-completion screen's own daily-progress card — deliberately distinct text from dailyGoalLabel (shared with BookCompletion, left unchanged there), framing today's count as progress made rather than a quota still owed. */
    dailyProgressLabel: string;
    sentencesUnit: string;
    wordReadyToReview: string;
    wordsReadyToReview: string;
    vocabularyHeading: string;
    /** Small tag on each word card in the lesson-completion screen's promoted vocabulary section (see lesson-completion.tsx) — marks a word as newly learned this lesson. */
    newWordTag: string;
    /** Stories-mode completion screen only — button on each word in the lesson-words panel (StoryWordsPanel) that hides the word and asks the learner to retype it from memory before it reveals again. */
    practiceWord: string;
    /** StoryWordsPanel only — shown beside practiceWord once the learner is viewing the last word in the set (typically right after answering it correctly); links back to the Stories library (/learn/stories) rather than just this one lesson's own back button, since there's nothing left to practice in this lesson. */
    backToStoriesLibrary: string;
    /** Placeholder for the retype-to-reveal input that appears after practiceWord is pressed. */
    typeToRevealPlaceholder: string;
    nextLesson: string;
    /** The finish screen's "next lesson" button when that lesson is Premium and this learner can't open it. */
    nextLessonPremium: string;
    fixMistakes: string;
    /** Completion screen only — restarts the same lesson from its first sentence (see LessonSession's handleRetryLesson). Always a secondary action, never fixMistakes/nextLesson's replacement. */
    retryLesson: string;
    youAreOn: string;
    readyToStart: string;
    completeCount: string;
    noLessonsYet: string;
    noLessonsYetBody: string;
    level: string;
    story: string;
    /** Stories mode only — rough reading time left in the header, e.g. "~2 min left". A coarse estimate from remaining word count, never exact. */
    storyTimeRemaining: string;
    /** Stories mode only — the quick "pick the meaning" question asked right after a sentence that holds one of the story's target words (see StoryWordQuiz). */
    wordQuiz: {
      title: string;
      prompt: string;
      correct: string;
      wrong: string;
      /** Keyboard-hint labels under the options: pressing 1-4 chooses, Shift replays the word. */
      hintChoose: string;
      hintListen: string;
      /** Screen-reader label for the progress bars, e.g. "Question 1 of 3". */
      progressAria: string;
    };
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
    /** Stories mode only — aria-label/title for the small button inside the previous-sentences box that collapses it to a thin rail. */
    storyPanelHide: string;
    /** Stories mode only — aria-label/title for the same button once the box is collapsed, to expand it back. */
    storyPanelShow: string;
    /** aria-label/title for the small button next to the sentence counter that steps back one sentence. Hidden entirely on the first sentence. */
    previousSentenceButton: string;
    /** aria-label/title for the small button next to the sentence counter that steps forward again — only shown once the learner has stepped back from a sentence they'd already typed, and only as far as that (see maxSentenceIndexReached in LessonSession). */
    nextSentenceButton: string;
    tapToStartHeading: string;
    tapToStartBody: string;
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
    /** Quiet, non-celebratory note shown once when a single missed day didn't break the streak (see isGraceDay in src/lib/progress/streak.ts) — deliberately plain text, never styled like the rewardStreak* strings above. */
    streakGraceNote: string;
  };
  mistakes: {
    itemsLeft: string;
    /** The back button on the Fix Your Mistakes screen — returns to the lesson's finish screen. */
    back: string;
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
    /** Label for the top-right link back to the dashboard, shown only on the settings page's focused desktop screen (no header/sidebar there — see DashboardChrome). */
    backToHome: string;
    /** Tab labels for the settings page's section rail. */
    tabProfile: string;
    tabSecurity: string;
    tabPreferences: string;
    tabDangerZone: string;
    emailPrefsHeading: string;
    emailPrefsSubtitle: string;
    learningReminders: string;
    learningRemindersBody: string;
    progressEmails: string;
    progressEmailsBody: string;
    savePreferences: string;
    savingPreferences: string;
    essentialEmailNotice: string;
    /** Push notifications toggle (Web Push, src/lib/push). */
    pushNotificationsHeading: string;
    pushNotificationsSubtitle: string;
    pushNotificationsToggleLabel: string;
    pushNotificationsToggleBody: string;
    pushNotificationsBlocked: string;
    pushNotificationsUnsupported: string;
    pushNotificationsError: string;
    pushNotificationsUnavailable: string;
    pushNotificationsTestButton: string;
    pushNotificationsTestSending: string;
    pushNotificationsTestSent: string;
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
    /** "Rate the app" section — Settings' always-available counterpart to RatingPrompt's one-time automatic pop-up; opens the same RatingModal on demand. */
    rateAppHeading: string;
    rateAppSubtitle: string;
    rateAppButton: string;
    /** Avatar section (moved/exposed here — see AccountMenu, which keeps its own copy too). */
    avatarHeading: string;
    avatarSubtitle: string;
    /** Account-management section. */
    accountHeading: string;
    accountSubtitle: string;
    planLabel: string;
    memberSinceLabel: string;
    /** Account tab's stat tiles — reuse getLearnerLevel/learnerLevelSupportLabel and the shared lesson.streakLabel/stats.sessionsLabel rather than duplicating that logic. */
    xpLabel: string;
    wordsLearnedLabel: string;
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
    /** Bare unit label ("day"/"days"), no {n} — for a big streak number rendered separately from its label, so a template placeholder would leak as literal text. Not currently rendered anywhere on Home (see HomeHeaderBar) after the borderless-header redesign dropped the streak display; kept for whenever a streak number returns to the UI. */
    streakUnitSingular: string;
    streakUnitPlural: string;
    streakStart: string;
    lessonsCompleteOverall: string;
    continueMode: string;
    startMode: string;
    freeCount: string;
    /** `Welcome back, {name}` — the Home dashboard's small personal greeting (see HomeHeaderBar), shown only when the signed-in learner has a real display name; a nameless learner/guest instead gets the existing `auth.loginHeading` ("Welcome back") with no name inserted. */
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
    checkAnswer: string;
    unavailableBody: string;
    lockedBadge: string;
    /** The locked word-list card (see PremiumGate). `{lists}` and `{words}` are rounded-down, formatted numbers such as "24" and "400+"; the Plain form is used while either is too small to quote. */
    gateHeading: string;
    gateSubheading: string;
    gateBenefitLists: string;
    gateBenefitListsPlain: string;
    gateBenefitContext: string;
    gateBenefitReview: string;
    /** Label for the "Learn" action (flashcard/study view) — one of the two choices offered when a word-group card expands, alongside practiceAction. */
    learnAction: string;
    /** Label for the "Practice" action (the existing fill-in-the-blank exercise) — the card expansion's other choice. */
    practiceAction: string;
    /** A partly finished word group's second action, next to Continue: practice the whole list again from its first word. */
    restartAction: string;
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
    /** The block summary's heading (VocabularyBlockSummary), shown after every block of five words. Deliberately has no count: the last block of a group can be shorter and the range line below it already says how many. */
    blockDoneTitle: string;
    /** Hint under the block summary heading: the rows open on tap. */
    blockDoneHint: string;
    /** Which words of the group the summary covers — {from}, {to} and {total} are 1-based positions and the group's word count. */
    blockRange: string;
    /** Accessible label of the block progress segments under the summary heading — {current} of {total} blocks. */
    blockProgressAria: string;
    /** Opens every row of the block summary. */
    expandAll: string;
    /** Closes every row of the block summary. */
    collapseAll: string;
    /** The block summary's button that opens the next five words. */
    nextBlock: string;
    /** Under the Next button: which words it opens — {from} and {to} are 1-based positions in the group. */
    nextBlockHint: string;
    /** The block summary's button on a group's last block: it leads to the group-complete screen instead of more words. */
    finishBlock: string;
    /** Under the Finish button. */
    finishBlockHint: string;
    /** Block summary: the button on each word that opens a free practice of just that word. */
    practiceWord: string;
    /** Its accessible name — {word} is the word. */
    practiceWordAria: string;
    /** On that free practice: back to the block summary. */
    drillBack: string;
    /** On that free practice: it records nothing. */
    drillNote: string;
    /** Smart word practice (admin-controlled; see FEATURE_IDS in src/lib/features/config.ts): the help bar, the "also correct" note, the group card's Continue and mastery figures, and the review hero. */
    smart: {
      /** The help bar's accessible name (for screen readers; not shown on screen). */
      helpPrompt: string;
      /** The hint button: the next right letter, mending anything wrong before it. */
      hint: string;
      /** Tooltip of the hint button — says what it does and what it costs. */
      hintTitle: string;
      /** The give-up button: counts as a miss and shows the right spelling. */
      dontKnow: string;
      /** Tooltip of the give-up button. */
      dontKnowTitle: string;
      /** Accessible label of the three stars — {n} is how many are lit. */
      starsLabel: string;
      /** The price tag on the hint button while a star can still be taken. */
      costLabel: string;
      /** The price tag at one star: nothing left to take, the help is only recorded. */
      costRecorded: string;
      /** Said in place of the stars once the hint has taken the last one. */
      noStars: string;
      /** Tooltip of the closed hint button: what to do instead. */
      noStarsTitle: string;
      /** Under the sentence after an accepted alternate (British spelling, synonym) — {word} is the stored word. */
      alsoCorrect: string;
      /** The button that skips the missed-word screen (Enter does the same). */
      continueEnter: string;
      /** Block summary line: how many of the block's words were right on the first try — {n} of {total}. */
      firstTry: string;
      /** Accessible label of a word's stars in the block summary. */
      starsAria: string;
      /** The group card's primary action: pick up where you left off. */
      continueAction: string;
      /** Practice every word of the group, not just the ones that are new or due. */
      practiceAllAction: string;
      /** The group card's mastery figure — {n} is 0-100. */
      masteryPercent: string;
      /** Words in the group due for review today — {n}. */
      dueBadge: string;
      /** Words in the group not met yet — {n}. */
      newBadge: string;
      /** Subtitle of the review hero when words are due. */
      reviewDueSubtitle: string;
      /** Shown instead of a practice session when no word in the group is new or due. */
      caughtUpHeading: string;
      /** Under the caught-up heading — {date} is the next day a word of this group falls due (already formatted). */
      caughtUpBody: string;
      /** Caught-up body when no due date is known. */
      caughtUpBodyNoDate: string;
      /** On the review finish screen when the visit was capped — {n} words are still waiting. */
      moreWaiting: string;
      /** The button on that screen that starts another review round. */
      reviewMore: string;
    };
    /** The redesigned Word Lists screens (admin-controlled; see the wordsRedesign feature in src/lib/features/config.ts): the mastery dashboard, the word wall, in-the-blank practice and five-card Learn batches. */
    redesign: {
      /** Dashboard heading: the learner's whole vocabulary at a glance. */
      overviewTitle: string;
      /** Band label: words at strength 4 or more (the 16-day review passed). */
      bandMastered: string;
      /** Band label: words met but not strong yet. */
      bandLearning: string;
      /** Band label: words never met. */
      bandNew: string;
      /** Dashboard figure label: words due for review today. */
      overviewDue: string;
      /** Accessible label of a mastery ring — {mastered} of {total} words. */
      ringAria: string;
      /** Accessible label of a ring when there is no schedule — {done} of {total}. */
      ringAriaNoSchedule: string;
      /** The dashboard's review button — {n} words. */
      reviewNow: string;
      /** Under the review button. */
      reviewNowHint: string;
      /** Placeholder of the topic search box. */
      searchPlaceholder: string;
      /** Accessible name of the topic search box. */
      searchAria: string;
      /** Accessible name of the button that clears the search box. */
      searchClear: string;
      /** Shown when the search matches no topic. */
      noResultsHeading: string;
      /** Under that heading. */
      noResultsBody: string;
      /** A topic card's line — {done} of {total} words met. */
      topicMet: string;
      /** A topic card's due count — {n}. */
      topicDue: string;
      /** A locked topic card's line. */
      lockedTopic: string;
      /** Heading of a mastery rank. */
      rankTitle: string;
      /** No rank earned yet. */
      rankNone: string;
      /** Rank name. */
      rankBronze: string;
      /** Rank name. */
      rankSilver: string;
      /** Rank name. */
      rankGold: string;
      /** How far the next rank is — {n} more mastered words, {rank} is the rank's name. */
      rankNext: string;
      /** Shown at the top rank. */
      rankTop: string;
      /** The group page's heading for the word wall. */
      wallHeading: string;
      /** Under the word wall heading. */
      wallSubtitle: string;
      /** Back link from the word wall. */
      backToTopics: string;
      /** The word wall's filter that shows every word. */
      filterAll: string;
      /** Accessible name of the word wall's filter. */
      filterAria: string;
      /** Shown when the filter matches no word. */
      wallEmpty: string;
      /** A word's strength — {n} of 5. */
      strengthAria: string;
      /** Tag on a word that is due for review. */
      dueTag: string;
      /** Tag on a word never met. */
      notMetYet: string;
      /** The wall's button: practice only the weak words. */
      practiceWeak: string;
      /** Under that button — {n} weak words. */
      practiceWeakCount: string;
      /** Under that button when no word is weak. */
      practiceWeakNone: string;
      /** Practice header — which batch of five this is. */
      batchProgress: string;
      /** Accessible label of the batch progress bar. */
      batchProgressAria: string;
      /** Word type badge. */
      posNoun: string;
      /** Word type badge. */
      posVerb: string;
      /** Word type badge. */
      posAdjective: string;
      /** Word type badge. */
      posAdverb: string;
      /** Finish screen heading of a practice visit. */
      completeHeading: string;
      /** Finish screen: the button to the topic's word wall, where the new strengths and the rank are. */
      viewWall: string;
      /** Learn header — which batch of five. */
      learnBatchTitle: string;
      /** Learn: the card position inside its batch — {current} of {total}. */
      learnCounter: string;
      /** Learn: under the card. */
      learnSwipeHint: string;
      /** Learn: the button for a word the learner already knows. */
      learnKnown: string;
      /** Learn: the button for a word the learner is still learning. */
      learnStill: string;
      /** Learn: heading after the last card of a batch. */
      learnBatchDone: string;
      /** Learn: summary after a batch — {known} known, {total} words, {learning} to come back. */
      learnBatchSummary: string;
      /** Learn: summary note — {n} cards were not answered. */
      learnUnanswered: string;
      /** Learn: the button that opens the next batch. */
      learnNextBatch: string;
      /** Learn: the button that goes through the batch again. */
      learnRepeatBatch: string;
      /** Learn: the last batch's button that hands over to practice. */
      learnStartPractice: string;
      /** Learn: shown once, under the buttons, to a learner whose answers are stored. */
      learnSavedNote: string;
    };
  };
  /**
   * Vocabulary Recall (src/lib/vocabulary-recall) — a curiosity-framed, opt-in
   * spaced-repetition queue for words met in Normal lessons and Stories,
   * deliberately separate in tone from `mistakes` (never "wrong"/"fix"
   * language): a word here was never mistyped, it's just due for another
   * look in the sentence it first appeared in.
   */
  vocabularyRecall: {
    /** Heading for the card inside each mode's own lesson-list page (see VocabularySectionRecallCard) — shown only once at least MIN_DUE_WORDS_TO_SHOW words are due. */
    cardHeading: string;
    cardSubtitle: string;
    /** Small context line under the review sentence — e.g. `From "The Wrong Apartment" — 6 days ago`. {title} and {n} are replaced. */
    sourceLabel: string;
    /** Completion screen heading once every due word this visit is reviewed. */
    completeHeading: string;
    /** e.g. "You reviewed {n} word(s)." — {n} replaced with the count. */
    completeSubtitle: string;
  };
  library: {
    storiesHeading: string;
    storiesSubtitle: string;
    /** Daily Lessons (mode "normal") page heading, shown instead of nav.normalLessons on that one page — nav.normalLessons is shared with the marketing footer link and the /upgrade plan-comparison table (see mode-title-key.ts), so it can't carry this page-only clarifying suffix. */
    normalHeading: string;
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
  /** Labels for the sidebar's Stories sub-nav (see learn-sidebar.tsx) — the sidebar merges the Stories and Ordinary Lessons nav items into one "Stories" item, which grows these two sub-links once active, switching between /learn/stories and /learn/normal without their content, routes, or lesson data changing at all. */
  storiesHub: {
    simplifiedTab: string;
    longerTab: string;
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
    recommendedHeading: string;
    emptyHeading: string;
    emptyBody: string;
    categoryEmptyHeading: string;
    categoryEmptyBody: string;
    byAuthor: string;
    continueReading: string;
    monthlyChallengeHeading: string;
    monthlyChallengeCompleteHeading: string;
    /** Heading for the Library homepage's "books you've finished" shelf — only rendered when the signed-in learner has actually completed at least one book. */
    completedBooksHeading: string;
    /** Books/Novels labels, used by the sidebar's Library sub-nav (see learn-sidebar.tsx). */
    booksTabLabel: string;
    novelsTabLabel: string;
    /** The Novels homepage (same layout/order as the Library homepage, minus category browsing — the catalog is small and curated). */
    novelsHeading: string;
    novelsSubtitle: string;
    /** Same role as libraryDisclaimer, worded for novels specifically: these are original condensed retellings, never the original book's full text or an official/licensed edition. */
    novelsDisclaimer: string;
    allNovelsHeading: string;
    /** Novels homepage's counterpart to completedBooksHeading. */
    completedNovelsHeading: string;
    novelsEmptyHeading: string;
    novelsEmptyBody: string;
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
    /** Shown in place of the reading screen while moving to the next section if that fetch fails (a flaky connection) — paired with common.tryAgain, since without it a failure here used to leave the reader stuck on a bare loading spinner with no way forward short of reloading the page. */
    sectionLoadError: string;
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
    listenModeStart: string;
    listenModeSlower: string;
    listenModeSlowest: string;
    listenModeStop: string;
    noteAdd: string;
    noteEdit: string;
    notePlaceholder: string;
    noteSave: string;
    noteDelete: string;
    /** Shown in a compact popover when a signed-out reader taps Save or Note — explains why the action needs an account, next to a link into the existing login flow. */
    signInToSave: string;
    yourRatingLabel: string;
    rateStarsLabel: string;
    ratingCountLabel: string;
    signInToRate: string;
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
  /** The one settings button beside every lesson's sentence (LessonSettings) and the panel it opens: voice speed, replay, typing sounds — each row a title plus a one-line explanation. */
  lessonSettings: {
    /** aria-label/title of the settings button itself. */
    buttonLabel: string;
    /** Heading of the panel. */
    title: string;
    speedTitle: string;
    speedDescription: string;
    replayTitle: string;
    replayDescription: string;
    /** Same explanation plus the Shift shortcut — used wherever the shortcut is actually wired up. */
    replayDescriptionShift: string;
    /** The replay row's button. */
    replayAction: string;
    keySoundsTitle: string;
    keySoundsDescription: string;
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
    /** Deliberately has no price: prices are only shown on /upgrade, resolved per visitor on the server. */
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
  /** Dictation mode (src/components/learning/dictation-sentence.tsx) — hide the sentence, listen, and type it: checked letter by letter, or all at once with Enter (an admin option). */
  dictation: {
    toggleLabel: string;
    toggleTitleOn: string;
    toggleTitleOff: string;
    listenAndType: string;
    inputLabel: string;
    pressEnter: string;
    pressEnterContinue: string;
    check: string;
    continue: string;
    perfect: string;
    almost: string;
    youTyped: string;
    correctSentence: string;
    retry: string;
    retryNote: string;
    blankHint: string;
    hearWord: string;
    /** Letter-by-letter mode: the help that appears after two misses in a row, and the end-of-sentence summary. */
    help: string;
    helpTitle: string;
    giveUp: string;
    giveUpTitle: string;
    stuckPrompt: string;
    done: string;
    mistakeCount: string;
    /** Accessible label of the sentence's stars — {n} are lit, {max} is how many it started with (3, plus gift stars). */
    starsLabel: string;
    /** Said in place of the stars once the word shown at the last star has spent it. */
    noStars: string;
    /** The recap chip when this sentence earned a gift star — {n} is how many stars every sentence in the lesson now starts with. */
    giftEarned: string;
    /** The recap chip on a sentence that used no star — {n} sentences so far of {total} for the next gift star. */
    giftProgress: string;
    wrongLetter: string;
    /** After a letter-by-letter sentence: a small "again" button beside Continue (practice, only the first try counts). */
    retrySentence: string;
    retrySentenceTitle: string;
    /** The help mark in the end-of-sentence recap ("Help × 2"). */
    helpCount: string;
    /** On the Show the word button: what pressing it costs. */
    costLabel: string;
    costRecorded: string;
    /** The chip counting sentences in a row finished without Show the word. */
    streakLabel: string;
    streakRisk: string;
    streakBroken: string;
    streakAria: string;
  };
  /** From-memory mode (src/components/learning/from-memory-session.tsx) — an optional round after a lesson: read the meaning, type the English. */
  fromMemory: {
    button: string;
    title: string;
    promptLabel: string;
    placeholder: string;
    showFirstLetters: string;
    revealWord: string;
    backToResults: string;
    finish: string;
    summaryHeading: string;
    summaryBody: string;
    mistakesSaved: string;
  };
  /** Streak calendar strip on Home + streak freezes (src/components/app/streak-strip.tsx). */
  streakCalendar: {
    heading: string;
    freezesLeft: string;
    freezesLeftOne: string;
    noFreezes: string;
    freezeUsedNote: string;
    showMonth: string;
    hideMonth: string;
    previousMonth: string;
    nextMonth: string;
    legendActive: string;
    legendGrace: string;
    legendFrozen: string;
    dayPracticed: string;
    dayFrozen: string;
    dayGrace: string;
    dayMissed: string;
    loadError: string;
  };
  /** Daily quests card on Home (src/components/app/quests-card.tsx) and the guest sign-in teaser for the account-only engagement features. */
  quests: {
    heading: string;
    xpReward: string;
    allDone: string;
    loadError: string;
    rewardCompleted: string;
    typeSentences: string;
    typeLessons: string;
    typeAccuracy: string;
    typeMasterWords: string;
    typeDictation: string;
    typeDailySession: string;
    guestHeading: string;
    guestBody: string;
    guestCta: string;
  };
  /** Achievements page + badge celebration (src/app/(app)/learn/(dashboard)/achievements). */
  badges: {
    heading: string;
    subtitle: string;
    earnedCount: string;
    earnedOn: string;
    locked: string;
    newTag: string;
    progress: string;
    rewardEarned: string;
    rewardBulk: string;
    navLabel: string;
    signInHeading: string;
    signInBody: string;
    emptyState: string;
    items: Record<BadgeId, { name: string; description: string }>;
  };
  /** Personal word cards: the save star in lessons, the /learn/cards page, its review session and the Anki export. */
  myCards: {
    title: string;
    navLabel: string;
    subtitle: string;
    saveWord: string;
    removeWord: string;
    practiceDue: string;
    practiceAll: string;
    nothingDue: string;
    exportAnki: string;
    exportHint: string;
    emptyHeading: string;
    emptyBody: string;
    cardCount: string;
    dueTag: string;
    masteredTag: string;
    nextReview: string;
    removeCard: string;
    cardRemoved: string;
    undoRemove: string;
    reviewCompleteHeading: string;
    reviewCompleteSubtitle: string;
    signInHeading: string;
    signInBody: string;
  };
  /** Today's session: the Home card (src/components/app/daily-session-card.tsx) and the session's completion screen. */
  dailySession: {
    cardHeading: string;
    cardBody: string;
    cardBodyDone: string;
    reward: string;
    start: string;
    completeHeading: string;
    completeSubtitle: string;
    xpEarned: string;
    alreadyRewarded: string;
  };
}
