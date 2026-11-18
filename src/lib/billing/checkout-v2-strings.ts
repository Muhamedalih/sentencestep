import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The words of the one-screen checkout (permission checkoutV2), in Arabic and English (every other
 * language reads the English). Kept here, not in the shared dictionaries, so the page that still
 * uses the old card is untouched while this one is tried by admins.
 */
export interface CheckoutV2Strings {
  heading: string;
  /** {count} */
  ratingsLine: string;
  /** {count} */
  subscribersLine: string;
  /** {rating} */
  ratingAria: string;
  /** {amount}: the per-month price of the chosen plan, e.g. "$1.33". */
  compareLine: string;
  whatYouGet: string;
  mostChosen: string;
  /** {gift} {total}: both already written as a number of days. */
  giftLine: string;
  payNow: string;
  payVia: string;
  /** Written after an Egyptian amount, e.g. "216 جنيه". */
  egpUnit: string;
  autoPicked: string;
}

const ar: CheckoutV2Strings = {
  heading: "الترقية إلى SentenceStep المميز",
  ratingsLine: "أكثر من {count} تقييم",
  subscribersLine: "+{count} مشترك",
  ratingAria: "متوسط التقييم {rating} من 5",
  compareLine:
    "تطبيقات تعلّم اللغات المعروفة تكلّف عادةً بين $7 و$18 شهريًا. هنا تدفع {amount} شهريًا فقط.",
  whatYouGet: "ماذا تحصل عليه؟",
  mostChosen: "الأكثر اختيارًا",
  giftLine: "هدية {gift} مع هذه الباقة، فتصير المدة {total}",
  payNow: "ادفع الآن",
  payVia: "ادفع عبر {method}",
  egpUnit: "جنيه",
  autoPicked: "اخترنا Vodafone Cash حسب بلدك، ويمكنك تغييره",
};

const en: CheckoutV2Strings = {
  heading: "Upgrade to SentenceStep Premium",
  ratingsLine: "{count}+ ratings",
  subscribersLine: "{count}+ members",
  ratingAria: "Average rating {rating} out of 5",
  compareLine:
    "Well-known language apps usually cost $7 to $18 a month. Here you pay just {amount} a month.",
  whatYouGet: "What you get",
  mostChosen: "Most chosen",
  giftLine: "{gift} free with this plan, so you get {total}",
  payNow: "Pay now",
  payVia: "Pay with {method}",
  egpUnit: "EGP",
  autoPicked: "We picked Vodafone Cash for your country. You can change it.",
};

export function checkoutV2Strings(locale: SupportLocale | null): CheckoutV2Strings {
  return locale === "ar" ? ar : en;
}
