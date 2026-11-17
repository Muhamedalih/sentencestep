import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The words of the Vodafone Cash way to pay, in Arabic and English (every other language reads the
 * English). Kept here, not in the shared dictionaries, because the option is shown only in Egypt.
 * "Vodafone Cash" is the brand's own name and is never translated.
 */
export interface EgyptStrings {
  tileCaption: string;
  /** {amount} is the whole-pound price. */
  payCta: string;
  unavailable: string;
  pausedToday: string;
  limitReached: string;

  pageTitle: string;
  /** {days} */
  accessForDays: string;
  pageIntro: string;
  stepPhoneHeading: string;
  stepPhoneHelp: string;
  phonePlaceholder: string;
  phoneSave: string;
  phoneChange: string;
  /** {phone} */
  phoneSavedLabel: string;
  phoneInvalid: string;
  phoneLocked: string;
  stepSendHeading: string;
  stepSendLocked: string;
  amountLabel: string;
  toWalletLabel: string;
  fromNumberLabel: string;
  sendNote: string;
  copy: string;
  copied: string;
  waitingHeading: string;
  waitingBody: string;
  /** {time} */
  expiresIn: string;
  expiredNote: string;
  otherHeading: string;
  otherHelp: string;
  otherPlaceholder: string;
  otherSubmit: string;
  otherErrors: Record<
    | "invalid"
    | "not_found"
    | "already_used"
    | "order_closed"
    | "wrong_amount"
    | "before_order"
    | "too_late"
    | "not_linked"
    | "failed",
    string
  >;
  notConfigured: string;
  back: string;
  startNewOrder: string;
  genericError: string;
}

const ar: EgyptStrings = {
  tileCaption: "حوّل من محفظتك المصرية بالجنيه",
  payCta: "ادفع {amount} جنيه",
  unavailable: "الدفع عبر فودافون كاش غير متاح الآن. حاول لاحقاً.",
  pausedToday: "الدفع عبر فودافون كاش متوقف مؤقتاً اليوم. حاول غداً.",
  limitReached: "فتحت عدة طلبات اليوم. أكمل أحدها أو حاول غداً.",

  pageTitle: "الدفع عبر فودافون كاش",
  accessForDays: "اشتراك Premium لمدة {days} يوماً",
  pageIntro: "خطوتان فقط، وبعدها يُفتح اشتراكك تلقائياً بدون أي انتظار لموافقة أحد.",
  stepPhoneHeading: "١. رقم محفظتك",
  stepPhoneHelp: "اكتب رقم فودافون كاش الذي ستحوّل منه. به نعرف أن الحوالة منك.",
  phonePlaceholder: "01XXXXXXXXX",
  phoneSave: "حفظ ومتابعة",
  phoneChange: "تغيير الرقم",
  phoneSavedLabel: "ستحوّل من: {phone}",
  phoneInvalid: "الرقم غير صحيح. اكتب رقماً مصرياً من 11 رقماً يبدأ بـ 01.",
  phoneLocked: "لا يمكن تغيير الرقم بعد وصول الحوالة.",
  stepSendHeading: "٢. حوّل المبلغ",
  stepSendLocked: "تظهر تفاصيل الحوالة بعد حفظ رقمك.",
  amountLabel: "المبلغ بالجنيه المصري",
  toWalletLabel: "حوّل إلى رقم فودافون كاش",
  fromNumberLabel: "من رقمك",
  sendNote:
    "حوّل المبلغ كما هو، من الرقم الذي كتبته فقط. سيصل التأكيد خلال لحظات وتتحول هذه الصفحة لوحدها.",
  copy: "نسخ",
  copied: "تم النسخ",
  waitingHeading: "بانتظار حوالتك",
  waitingBody: "لا تغلق الصفحة ولا تضغط على شيء. عند وصول الحوالة يُفتح الاشتراك تلقائياً.",
  expiresIn: "تنتهي المهلة بعد {time}",
  expiredNote: "انتهت مهلة الساعة، لكن إذا حوّلت من رقمك المسجّل فسيُفتح اشتراكك عند وصول الحوالة.",
  otherHeading: "حوّلت من رقم آخر؟",
  otherHelp: "اكتب رقم العملية من رسالة فودافون كاش (12 رقماً تقريباً) وسنربط الحوالة بطلبك.",
  otherPlaceholder: "رقم العملية",
  otherSubmit: "تحقق",
  otherErrors: {
    invalid: "رقم العملية غير صحيح. انسخه من رسالة فودافون كاش كما هو.",
    not_found: "لم نجد هذه الحوالة بعد. انتظر دقيقة وحاول مرة أخرى.",
    already_used: "هذه الحوالة مرتبطة بطلب آخر.",
    order_closed: "هذا الطلب مغلق. ابدأ طلباً جديداً.",
    wrong_amount: "مبلغ هذه الحوالة أقل من سعر الاشتراك.",
    before_order: "هذه الحوالة أقدم من الطلب ولا يمكن ربطها به.",
    too_late: "انتهت المهلة المسموحة لهذا الطلب.",
    not_linked: "تعذّر ربط الحوالة. تواصل معنا وسنحلّها فوراً.",
    failed: "حدث خطأ. حاول مرة أخرى.",
  },
  notConfigured: "الدفع عبر فودافون كاش غير مفعّل بعد.",
  back: "رجوع",
  startNewOrder: "ابدأ طلباً جديداً",
  genericError: "حدث خطأ. حاول مرة أخرى.",
};

const en: EgyptStrings = {
  tileCaption: "Send from your Egyptian wallet, in pounds",
  payCta: "Pay {amount} EGP",
  unavailable: "Vodafone Cash isn't available right now. Try again later.",
  pausedToday: "Vodafone Cash is paused for today. Try again tomorrow.",
  limitReached: "You opened several orders today. Finish one or try again tomorrow.",

  pageTitle: "Pay with Vodafone Cash",
  accessForDays: "Premium access for {days} days",
  pageIntro: "Two steps, and your access opens by itself. Nobody has to approve it.",
  stepPhoneHeading: "1. Your wallet number",
  stepPhoneHelp:
    "Write the Vodafone Cash number you will send from. It's how we know the transfer is yours.",
  phonePlaceholder: "01XXXXXXXXX",
  phoneSave: "Save and continue",
  phoneChange: "Change number",
  phoneSavedLabel: "You will send from: {phone}",
  phoneInvalid: "That number isn't valid. Enter an 11-digit Egyptian number starting with 01.",
  phoneLocked: "The number can't be changed once the transfer has arrived.",
  stepSendHeading: "2. Send the amount",
  stepSendLocked: "The transfer details appear once your number is saved.",
  amountLabel: "Amount in Egyptian pounds",
  toWalletLabel: "Send to this Vodafone Cash number",
  fromNumberLabel: "From your number",
  sendNote:
    "Send exactly this amount, only from the number you wrote. Confirmation arrives in moments and this page changes by itself.",
  copy: "Copy",
  copied: "Copied",
  waitingHeading: "Waiting for your transfer",
  waitingBody:
    "Keep this page open and don't press anything. Your access opens by itself when the transfer arrives.",
  expiresIn: "Time left: {time}",
  expiredNote:
    "The hour is over, but if you send from the number you wrote, your access still opens when the transfer arrives.",
  otherHeading: "Sent from a different number?",
  otherHelp:
    "Enter the operation number from your Vodafone Cash message (about 12 digits) and we'll match the transfer to your order.",
  otherPlaceholder: "Operation number",
  otherSubmit: "Check",
  otherErrors: {
    invalid: "That operation number isn't valid. Copy it from your Vodafone Cash message as it is.",
    not_found: "We haven't found that transfer yet. Wait a minute and try again.",
    already_used: "That transfer is already used for another order.",
    order_closed: "This order is closed. Start a new one.",
    wrong_amount: "That transfer is less than the price.",
    before_order: "That transfer is older than this order, so it can't be matched to it.",
    too_late: "The time allowed for this order has passed.",
    not_linked: "We couldn't match the transfer. Contact us and we'll fix it right away.",
    failed: "Something went wrong. Try again.",
  },
  notConfigured: "Vodafone Cash isn't switched on yet.",
  back: "Back",
  startNewOrder: "Start a new order",
  genericError: "Something went wrong. Try again.",
};

export function egyptStrings(locale: SupportLocale | null): EgyptStrings {
  return locale === "ar" ? ar : en;
}
