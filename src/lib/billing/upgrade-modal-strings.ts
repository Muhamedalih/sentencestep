import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The words of the upgrade pop-up (permission upgradeModal), in Arabic and English (every other
 * language reads the English). Kept here, not in the shared dictionaries, so nothing else that
 * is being edited there is touched while admins try the pop-up. No figure about the library is
 * written in it on purpose: it says how big and how alive the library is in words, so no number
 * can go stale.
 */
export interface UpgradeModalStrings {
  close: string;
  back: string;
  loading: string;
  /** Said before the title of the locked card the learner pressed. */
  contextLabel: string;
  heading: string;
  subheading: string;
  /** {count} */
  ratingsLine: string;
  /** {rating} */
  ratingAria: string;
  /** {sentences} {days} */
  progressBoth: string;
  /** {sentences} */
  progressSentences: string;
  rowStoriesTitle: string;
  rowStoriesText: string;
  rowLessonsTitle: string;
  rowLessonsText: string;
  rowWordsTitle: string;
  rowWordsText: string;
  rowPassagesTitle: string;
  rowPassagesText: string;
  rowGrowingTitle: string;
  rowGrowingText: string;
  /** {amount}: the per-month price of the 6-month plan, in dollars. */
  compareLine: string;
  /** {amount} */
  startFrom: string;
  trustLine: string;
  signInToUpgrade: string;
  chooseHeading: string;
  chooseSub: string;
  methodHeading: string;
  /** {amount} */
  payOnce: string;
  perMonth: string;
  /** Written after a monthly amount in pounds, e.g. "63 ج / شهر". */
  egpPerMonth: string;
  /** Written after an amount in pounds, e.g. "376 جنيه". */
  egpUnit: string;
  mostChosen: string;
  bestValue: string;
  cardTitle: string;
  cardDesc: string;
  binanceDesc: string;
  egyptDesc: string;
  autoPicked: string;
  /** {amount} */
  pay: string;
  /** {amount} {method} */
  payVia: string;
  redirecting: string;
  loadError: string;
}

const ar: UpgradeModalStrings = {
  close: "إغلاق",
  back: "رجوع",
  loading: "جارٍ التحميل…",
  contextLabel: "ضغطتَ على:",
  heading: "افتح مكتبة الإنجليزية كاملة",
  subheading: "اسمع الجملة، اكتبها حرفًا حرفًا، وتثبت في ذاكرتك",
  ratingsLine: "أكثر من {count} تقييم",
  ratingAria: "متوسط التقييم {rating} من 5",
  progressBoth: "كتبتَ {sentences} جملة خلال {days} أيام. الباقي ينتظرك.",
  progressSentences: "كتبتَ {sentences} جملة. الباقي ينتظرك.",
  rowStoriesTitle: "مكتبة ضخمة من القصص",
  rowStoriesText: "لكل مستوى، من الأسهل إلى الأصعب",
  rowLessonsTitle: "كل الدروس بتسلسلها الكامل",
  rowLessonsText: "تتقدم خطوة بخطوة بلا أي حاجز",
  rowWordsTitle: "بحر من الكلمات",
  rowWordsText: "قوائم واسعة تكتبها وتسمعها حتى ترسخ",
  rowPassagesTitle: "نصوص من الحياة الواقعية",
  rowPassagesText: "مشاهد حقيقية بصوت واضح",
  rowGrowingTitle: "مكتبة تكبر باستمرار",
  rowGrowingText: "كل جديد نضيفه يصلك مجانًا",
  compareLine:
    "تطبيقات تعلّم اللغات المعروفة تكلّف عادةً بين $7 و$18 شهريًا. هنا تدفع {amount} شهريًا فقط.",
  startFrom: "ابدأ من {amount} شهريًا",
  trustLine: "دفع آمن · لا يوجد تجديد تلقائي · اشتراك لمرة واحدة · يُفتح فور الدفع",
  signInToUpgrade: "سجّل الدخول للترقية",
  chooseHeading: "اختر خطتك",
  chooseSub: "اختر المدة وطريقة الدفع",
  methodHeading: "طريقة الدفع",
  payOnce: "تدفع {amount} مرة واحدة",
  perMonth: "/ شهر",
  egpPerMonth: "ج / شهر",
  egpUnit: "جنيه",
  mostChosen: "الأكثر اختيارًا",
  bestValue: "الأوفر",
  cardTitle: "بطاقة بنكية",
  cardDesc: "ادفع بالدولار",
  binanceDesc: "ادفع بـ USDT",
  egyptDesc: "من محفظتك، بالجنيه",
  autoPicked: "اخترناها حسب بلدك، ويمكنك تغييرها",
  pay: "ادفع {amount}",
  payVia: "ادفع {amount} عبر {method}",
  redirecting: "جارٍ إعادة التوجيه…",
  loadError: "تعذّر فتح النافذة، سننقلك إلى صفحة الخطط.",
};

const en: UpgradeModalStrings = {
  close: "Close",
  back: "Back",
  loading: "Loading…",
  contextLabel: "You tapped:",
  heading: "Unlock the whole English library",
  subheading: "Hear the sentence, type it letter by letter, and it sticks",
  ratingsLine: "{count}+ ratings",
  ratingAria: "Average rating {rating} out of 5",
  progressBoth: "You wrote {sentences} sentences in {days} days. The rest is waiting.",
  progressSentences: "You wrote {sentences} sentences. The rest is waiting.",
  rowStoriesTitle: "A huge library of stories",
  rowStoriesText: "For every level, easiest to hardest",
  rowLessonsTitle: "Every lesson, in full order",
  rowLessonsText: "Step by step, nothing in your way",
  rowWordsTitle: "An ocean of words",
  rowWordsText: "Wide lists you type and hear until they stick",
  rowPassagesTitle: "Real-life passages",
  rowPassagesText: "Real scenes with a clear voice",
  rowGrowingTitle: "A library that keeps growing",
  rowGrowingText: "Everything new we add is yours, free",
  compareLine:
    "Well-known language apps usually cost $7 to $18 a month. Here you pay just {amount} a month.",
  startFrom: "Start from {amount} a month",
  trustLine: "Secure payment · No auto-renewal · One-time purchase · Opens right after payment",
  signInToUpgrade: "Sign in to upgrade",
  chooseHeading: "Choose your plan",
  chooseSub: "Pick the length and how to pay",
  methodHeading: "Payment method",
  payOnce: "You pay {amount} once",
  perMonth: "/ month",
  egpPerMonth: "EGP / month",
  egpUnit: "EGP",
  mostChosen: "Most chosen",
  bestValue: "Best value",
  cardTitle: "Bank card",
  cardDesc: "Pay in dollars",
  binanceDesc: "Pay with USDT",
  egyptDesc: "From your wallet, in pounds",
  autoPicked: "We picked it for your country. You can change it.",
  pay: "Pay {amount}",
  payVia: "Pay {amount} with {method}",
  redirecting: "Redirecting…",
  loadError: "Couldn't open the pop-up. Taking you to the plans page.",
};

export function upgradeModalStrings(locale: SupportLocale | null): UpgradeModalStrings {
  return locale === "ar" ? ar : en;
}
