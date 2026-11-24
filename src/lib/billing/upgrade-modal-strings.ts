import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The words of the upgrade pop-up (permission upgradeModal), in Arabic and English (every other
 * language reads the English). Kept here, not in the shared dictionaries, so nothing else that
 * is being edited there is touched while admins try the pop-up.
 */
export interface UpgradeModalStrings {
  close: string;
  back: string;
  heading: string;
  subheading: string;
  /** {count} */
  ratingsLine: string;
  /** {rating} */
  ratingAria: string;
  benefitStories: string;
  benefitLessons: string;
  benefitWordLists: string;
  benefitPassages: string;
  benefitNewFeatures: string;
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
  heading: "افتح كل الدروس والقصص",
  subheading: "المكتبة كاملة بين يديك، بجميع المستويات",
  ratingsLine: "أكثر من {count} تقييم",
  ratingAria: "متوسط التقييم {rating} من 5",
  benefitStories: "مكتبة القصص كاملة، بكل المستويات",
  benefitLessons: "كل الدروس بتسلسلها الكامل",
  benefitWordLists: "كل قوائم الكلمات، وليس التمهيدية فقط",
  benefitPassages: "كل النصوص: مشاهد من الحياة الواقعية تستمع إليها",
  benefitNewFeatures: "ميزات تعلّم مميزة جديدة عند إطلاقها",
  compareLine:
    "تطبيقات اللغات المعروفة تكلّف عادةً بين $7 و$18 شهريًا. هنا تدفع {amount} شهريًا فقط.",
  startFrom: "ابدأ من {amount} شهريًا",
  trustLine: "دفع آمن · لا يوجد تجديد تلقائي · اشتراك لمرة واحدة",
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
  heading: "Unlock every lesson and story",
  subheading: "The whole library in your hands, at every level",
  ratingsLine: "{count}+ ratings",
  ratingAria: "Average rating {rating} out of 5",
  benefitStories: "The full story library, at every level",
  benefitLessons: "Every lesson, in its full sequence",
  benefitWordLists: "Every word list, not only the starter one",
  benefitPassages: "Every passage: real-life scenes you listen to",
  benefitNewFeatures: "New premium learning features as they launch",
  compareLine:
    "Well-known language apps usually cost $7 to $18 a month. Here you pay just {amount} a month.",
  startFrom: "Start from {amount} a month",
  trustLine: "Secure payment · No auto-renewal · One-time purchase",
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
