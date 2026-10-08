/**
 * The Terms of Service and the Privacy Policy, in English and Arabic. They
 * describe what the product does today (one-time Premium purchases paid
 * through Wayl, which is responsible for the payment itself, no
 * auto-renewal, no refunds), so change them together with the behaviour they
 * describe. A visitor in any other language is shown the English text, as
 * before.
 */

import { isSupportLocale } from "@/lib/i18n/locales";

export type LegalLanguage = "en" | "ar";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export function legalLanguage(locale: string | null | undefined): LegalLanguage {
  return locale === "ar" ? "ar" : "en";
}

/** The Back button's label, in the language of the text on the page (so a Spanish visitor reading the English text sees "Back", not a mix). */
export const LEGAL_BACK_LABEL: Record<LegalLanguage, string> = { en: "Back", ar: "رجوع" };

/**
 * Where Back goes when the page was opened directly and there is nothing to
 * go back to: the visitor's own home page (`/ar`, `/es`, `/tr`, else `/`).
 */
export function legalHomeHref(locale: string | null | undefined): string {
  return isSupportLocale(locale) ? `/${locale}` : "/";
}

export const SUPPORT_EMAIL = "support@sentencestep.com";

const TERMS_EN: LegalDocument = {
  title: "Terms of Service",
  updated: "Last updated: 8 October 2026",
  intro:
    "These terms are the agreement between you and SentenceStep when you use sentencestep.com. By creating an account or using the site you agree to them. If you don't agree, please don't use SentenceStep.",
  sections: [
    {
      heading: "What SentenceStep is",
      paragraphs: [
        "SentenceStep is an English-practice service where you hear a sentence and type it letter by letter, with lessons, stories and word lists. Part of it is free; the rest is Premium.",
      ],
    },
    {
      heading: "Your account",
      paragraphs: [
        "You need an account to save your progress across devices and to buy Premium. Give us a real email address, keep your password private, and tell us if you think someone else has used your account. You are responsible for what happens under your account. An account is for one person, so please don't share it. If you are under 18, please use SentenceStep with a parent or guardian's permission, and ask them to make any purchase.",
      ],
    },
    {
      heading: "Free and Premium",
      paragraphs: [
        "The free plan includes the lessons and word lists marked as free (at the moment, a selection of lessons and stories, and a starter word list). Premium unlocks the full library. What is free and what is Premium can change over time, and we may run free promotions, but a promotion is never a promise that something will stay free.",
      ],
    },
    {
      heading: "Buying Premium",
      bullets: [
        "Premium is a one-time purchase of access for a fixed number of days (30, 90 or 180, depending on the plan you choose). It does not renew automatically, and we never charge you again unless you choose to pay again.",
        "If you buy again while you still have Premium, the new days are added after the days you have left.",
        "Prices are shown in US dollars. Wayl charges the payment in Iraqi dinars, converted from the dollar price at a fixed rate, and its payment page shows the amount before you confirm. Your bank or card issuer may apply its own exchange rate or fees, which we don't control.",
        "Premium is activated automatically once the payment is confirmed, usually within moments. If you paid and it isn't active, use “Problem with your payment?” on the upgrade page or write to us, and we will check it and activate the days you paid for.",
        "Prices depend on your country and may change. A change never affects days you have already paid for.",
        "Bonus days from a promotion are extra days of access. They have no cash value.",
      ],
    },
    {
      heading: "Payments are handled by Wayl",
      paragraphs: [
        "Payments are made on the payment page of our payment partner, Wayl, an independent company, and are subject to Wayl's own terms. Wayl, not SentenceStep, processes your payment, and your card or wallet details are entered on Wayl's page and never reach us.",
        "Wayl and your bank or card issuer are responsible for the payment itself: the charge, the exchange rate and fees they apply, declined or failed payments, duplicate charges, disputes and chargebacks, and any reversal of a payment. If a charge looks wrong, contact Wayl and your bank; write to us and we will give you the details of your order to help.",
      ],
    },
    {
      heading: "All sales are final",
      paragraphs: [
        "Because Premium is digital access that starts immediately, all purchases are final and SentenceStep does not offer refunds, whether for a change of mind, for unused days, or because you stopped using SentenceStep. This does not limit any rights you have under the law where you live.",
      ],
    },
    {
      heading: "Using SentenceStep",
      paragraphs: [
        "Use SentenceStep for your own learning. Don't copy, scrape or resell our content, try to break or overload the service, get around Premium, or use someone else's account. We may suspend or close an account that does. If that happens because these terms were broken, paid days are not refunded.",
      ],
    },
    {
      heading: "Our content and your data",
      paragraphs: [
        "The lessons, audio, translations and design are ours or used with permission. You may use them to learn, not to republish them. Your progress and settings are yours, and how we handle them is described in the Privacy Policy.",
      ],
    },
    {
      heading: "Changes and availability",
      paragraphs: [
        "We keep improving SentenceStep, so features and content may change, and the service may sometimes be unavailable. We don't promise uninterrupted access. We may update these terms; when we do we change the date above, and if you keep using SentenceStep afterwards you accept the update.",
      ],
    },
    {
      heading: "Our responsibility",
      paragraphs: [
        "SentenceStep is provided “as is”. We work hard to keep it accurate and available, but we can't promise it will be free of errors or that it will give you a particular result. To the extent the law allows, we are not liable for indirect or consequential losses, or for services run by others, such as Wayl, your bank or card issuer, including their availability, delays, fees, exchange rates and mistakes. Our total liability for any claim is limited to the amount you paid for Premium in the 12 months before it.",
      ],
    },
    {
      heading: "Closing your account",
      paragraphs: [
        "You can delete your account at any time in Settings. Deleting it removes your profile and learning data and ends any remaining Premium days without a refund. We keep payment records for as long as accounting and legal obligations require.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: ["These terms are governed by the laws of Iraq."],
    },
    {
      heading: "Contact",
      paragraphs: [`Questions or problems: ${SUPPORT_EMAIL}`],
    },
  ],
};

const TERMS_AR: LegalDocument = {
  title: "شروط الاستخدام",
  updated: "آخر تحديث: 8 أكتوبر 2026",
  intro:
    "هذه الشروط هي الاتفاق بينك وبين SentenceStep عند استخدامك موقع sentencestep.com. بإنشاء حساب أو باستخدام الموقع فإنك توافق عليها. إن لم توافق، فنرجو ألا تستخدم SentenceStep.",
  sections: [
    {
      heading: "ما هي SentenceStep",
      paragraphs: [
        "SentenceStep خدمة لتعلّم الإنجليزية: تسمع الجملة ثم تكتبها حرفًا حرفًا، وتتضمن دروسًا وقصصًا وقوائم كلمات. جزء منها مجاني والباقي ضمن الخطة المميّزة (Premium).",
      ],
    },
    {
      heading: "حسابك",
      paragraphs: [
        "تحتاج إلى حساب لحفظ تقدّمك على أجهزتك ولشراء الخطة المميّزة. استخدم بريدًا إلكترونيًا حقيقيًا، وحافظ على سرّية كلمة المرور، وأخبرنا إن ظننت أن أحدًا استخدم حسابك. أنت مسؤول عمّا يحدث عبر حسابك. الحساب الواحد لشخص واحد، فنرجو عدم مشاركته. وإذا كان عمرك أقل من 18 عامًا فاستخدم SentenceStep بإذن أحد والديك أو وليّ أمرك، واطلب منه إتمام أي عملية شراء.",
      ],
    },
    {
      heading: "الخطة المجانية والخطة المميّزة",
      paragraphs: [
        "تتضمن الخطة المجانية الدروس وقوائم الكلمات المعلَّمة كمجانية (حاليًا: مختارات من الدروس والقصص، وقائمة كلمات تمهيدية). وتفتح الخطة المميّزة المكتبة كاملة. قد يتغيّر ما هو مجاني وما هو مميّز مع الوقت، وقد نقدّم عروضًا مجانية مؤقتة، لكن العرض المؤقت ليس وعدًا بأن يبقى شيء مجانيًا.",
      ],
    },
    {
      heading: "شراء الخطة المميّزة",
      bullets: [
        "الخطة المميّزة عملية شراء لمرة واحدة تمنحك وصولًا لعدد محدد من الأيام (30 أو 90 أو 180 حسب الباقة التي تختارها). لا تتجدد تلقائيًا، ولن نسحب منك مبلغًا مجددًا ما لم تختر أنت الدفع.",
        "إذا اشتريت وأنت ما زلت مشتركًا، تُضاف الأيام الجديدة بعد الأيام المتبقية لك.",
        "الأسعار معروضة بالدولار الأمريكي. وتحصّل Wayl المبلغ بالدينار العراقي، محوَّلًا من السعر بالدولار بسعر صرف ثابت، وتعرض صفحتها المبلغ قبل أن تؤكد الدفع. قد يطبّق مصرفك أو جهة إصدار بطاقتك سعر صرف أو رسومًا خاصة بها، ولا نتحكم بها.",
        "تُفعَّل الخطة المميّزة تلقائيًا بعد تأكيد الدفع، وغالبًا خلال لحظات. وإن دفعت ولم تُفعَّل فاستخدم «مشكلة في الدفع؟» في صفحة الترقية أو راسلنا، وسنراجع الأمر ونفعّل لك الأيام التي دفعت ثمنها.",
        "تختلف الأسعار حسب بلدك وقد تتغيّر، ولا يؤثر أي تغيير على الأيام التي دفعت ثمنها.",
        "الأيام الإضافية من العروض هي أيام وصول إضافية، وليس لها قيمة نقدية.",
      ],
    },
    {
      heading: "الدفع يتم عبر Wayl",
      paragraphs: [
        "تتم المدفوعات في صفحة الدفع الخاصة بشريكنا Wayl، وهي شركة مستقلة وتسري عليها شروطها الخاصة. تعالج Wayl، لا SentenceStep، دفعتك، وأنت تُدخل بيانات بطاقتك أو محفظتك في صفحة Wayl ولا تصل إلينا.",
        "تتحمّل Wayl ومصرفك أو جهة إصدار بطاقتك المسؤولية عن عملية الدفع نفسها: الخصم، وسعر الصرف والرسوم المطبّقة عليك، والدفعات المرفوضة أو الفاشلة، والخصم المكرر، والنزاعات وطلبات رد المبلغ عبر المصرف، وأي إلغاء لعملية دفع أو ردّ لها. وإذا بدا لك أن الخصم غير صحيح فتواصل مع Wayl ومصرفك، وراسلنا وسنزوّدك بتفاصيل طلبك لمساعدتك.",
      ],
    },
    {
      heading: "المبيعات نهائية",
      paragraphs: [
        "لأن الخطة المميّزة وصول رقمي يبدأ فورًا، فكل عمليات الشراء نهائية ولا تقدّم SentenceStep استرجاعًا للمبلغ، سواء بسبب تغيير الرأي أو لأيام لم تُستخدم أو لأنك توقفت عن استخدام SentenceStep. لا يقيّد هذا أي حقوق تمنحك إياها القوانين في بلدك.",
      ],
    },
    {
      heading: "استخدام SentenceStep",
      paragraphs: [
        "استخدم SentenceStep لتعلّمك الشخصي. لا تنسخ محتوانا ولا تسحبه آليًا ولا تعد بيعه، ولا تحاول تعطيل الخدمة أو إرهاقها أو الالتفاف على الخطة المميّزة، ولا تستخدم حساب شخص آخر. يجوز لنا إيقاف الحساب أو إغلاقه عند المخالفة، وإذا حدث ذلك بسبب مخالفة هذه الشروط فلا تُسترد الأيام المدفوعة.",
      ],
    },
    {
      heading: "محتوانا وبياناتك",
      paragraphs: [
        "الدروس والصوتيات والترجمات والتصميم ملك لنا أو مستخدمة بإذن. يمكنك استخدامها للتعلّم لا لإعادة نشرها. تقدّمك وإعداداتك لك، وطريقة تعاملنا معها موضّحة في سياسة الخصوصية.",
      ],
    },
    {
      heading: "التغييرات وتوفّر الخدمة",
      paragraphs: [
        "نواصل تطوير SentenceStep، لذا قد يتغيّر المحتوى والميزات، وقد تتوقف الخدمة أحيانًا. لا نضمن عملها دون انقطاع. قد نحدّث هذه الشروط؛ وعندها نغيّر التاريخ أعلاه، واستمرارك في الاستخدام بعد ذلك يعني قبولك للتحديث.",
      ],
    },
    {
      heading: "مسؤوليتنا",
      paragraphs: [
        "تُقدَّم SentenceStep «كما هي». نبذل جهدنا لتكون دقيقة ومتاحة، لكن لا نعد بخلوها من الأخطاء ولا بتحقيق نتيجة معيّنة. وبالقدر الذي يسمح به القانون، لا نتحمّل الخسائر غير المباشرة أو التبعية، ولا الخدمات التي تديرها جهات أخرى مثل Wayl أو مصرفك أو جهة إصدار بطاقتك، بما في ذلك توفّرها وتأخّرها ورسومها وأسعار صرفها وأخطاؤها. ويقتصر إجمالي مسؤوليتنا في أي مطالبة على المبلغ الذي دفعته مقابل الخطة المميّزة خلال الأشهر الاثني عشر السابقة لها.",
      ],
    },
    {
      heading: "إغلاق حسابك",
      paragraphs: [
        "يمكنك حذف حسابك في أي وقت من الإعدادات. الحذف يزيل ملفك وبيانات تعلّمك وينهي أي أيام مميّزة متبقية دون استرداد. نحتفظ بسجلات المدفوعات بالقدر الذي تتطلبه المحاسبة والالتزامات القانونية.",
      ],
    },
    {
      heading: "القانون الحاكم",
      paragraphs: ["تخضع هذه الشروط لقوانين العراق."],
    },
    {
      heading: "التواصل",
      paragraphs: [`للأسئلة والمشاكل: ${SUPPORT_EMAIL}`],
    },
  ],
};

const PRIVACY_EN: LegalDocument = {
  title: "Privacy Policy",
  updated: "Last updated: 8 October 2026",
  intro:
    "This page explains what SentenceStep collects, why, and who helps us run it. We don't sell your data and we don't share it with advertisers.",
  sections: [
    {
      heading: "What we collect",
      bullets: [
        "Account: your email address, a display name if you give one, and your password (kept only as a secure hash by our sign-in provider). If you sign in with Google, we receive your Google email and name.",
        "Learning: your lessons and attempts, progress, streaks, points, mistakes, word-list progress, settings and preferences.",
        "Country: the country you choose when you set up your account, and the country your connection appears to come from, which our hosting provider tells us when you open the upgrade page, a locked lesson or word list, or start a payment. We use that only to pick the price that applies to you.",
        "Payments: when you buy Premium we keep a record of the order (plan, price, amount, status and dates) and the reference from our payment partner. Your card or wallet details are entered on our payment partner's page and never reach us.",
        "Messages: the reports and emails you send us, and our replies.",
        "Technical and usage: basic error and performance information, simple events about what you do in the app (such as finishing a lesson or opening the upgrade page) which we store ourselves, and settings kept in your browser, such as language and theme, your progress if you don't have an account, and a cookie that lasts one hour and remembers which lesson you were on when you started a payment, so we can take you back to it.",
      ],
    },
    {
      heading: "How we use it",
      bullets: [
        "To provide the lessons and save your progress.",
        "To process purchases, activate Premium and show you the right price.",
        "To send the emails you would expect: a welcome, a receipt when you buy Premium, account notices such as Premium ending, reminders and milestones you can switch off in Settings, and replies to your messages.",
        "To fix problems, protect the service from abuse and improve the lessons.",
      ],
    },
    {
      heading: "Who helps us run SentenceStep",
      paragraphs: ["Each of these receives only what it needs to do its job:"],
      bullets: [
        "Supabase: our database and sign-in.",
        "Netlify: hosting. It also tells us your approximate country from your connection.",
        "Wayl: payments. Wayl is an independent company: what you give them on their page, such as your name, phone number and card or wallet details, is handled under Wayl's own terms and privacy policy.",
        "Resend: sending emails.",
        "Where enabled: Sentry for error monitoring, and Cloudflare Turnstile to check that sign-ups come from a person.",
        "Google: only if you choose “Continue with Google”. If you rate the app, your rating and comment are saved in a spreadsheet we control.",
        "Your browser's push service: only if you turn on notifications.",
      ],
    },
    {
      heading: "What we don't do",
      paragraphs: [
        "We don't sell your personal data, we don't show ads, and we don't share your data with advertisers.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Your account and learning data stay until you delete your account. Payment records are kept for as long as accounting and legal obligations require, even after an account is deleted. Reports and emails you send us are kept so we can help you and improve the service.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        "In Settings you can download your data as a file, change your email and notification preferences, turn push notifications on or off, and delete your account. To correct your data or ask about it, email us.",
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        "Your data is stored with Supabase over encrypted connections, access is limited to what the service needs, and your card details never pass through our servers. No online service can promise perfect security, but we take care to protect yours.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: ["If we change how we use your data, we will update this page and its date."],
    },
    {
      heading: "Contact",
      paragraphs: [`Questions about your data: ${SUPPORT_EMAIL}`],
    },
  ],
};

const PRIVACY_AR: LegalDocument = {
  title: "سياسة الخصوصية",
  updated: "آخر تحديث: 8 أكتوبر 2026",
  intro:
    "توضّح هذه الصفحة ما الذي تجمعه SentenceStep ولماذا ومن يساعدنا في تشغيلها. لا نبيع بياناتك ولا نشاركها مع المعلنين.",
  sections: [
    {
      heading: "ما الذي نجمعه",
      bullets: [
        "الحساب: بريدك الإلكتروني واسم العرض (إن قدّمته) وكلمة المرور (تُحفظ فقط على شكل بصمة مشفّرة لدى مزوّد تسجيل الدخول). وإذا سجّلت الدخول عبر Google نستلم بريدك واسمك من Google.",
        "التعلّم: دروسك ومحاولاتك وتقدّمك وسلاسل أيامك ونقاطك وأخطاؤك وتقدّمك في قوائم الكلمات وإعداداتك وتفضيلاتك.",
        "البلد: البلد الذي تختاره عند إعداد حسابك، والبلد الذي يبدو أن اتصالك صادر منه، ونحصل عليه من مزوّد الاستضافة عند فتح صفحة الترقية أو درس أو قائمة كلمات مقفولة أو بدء الدفع. نستخدمه فقط لتحديد السعر المناسب لك.",
        "المدفوعات: عند شراء الخطة المميّزة نحتفظ بسجل الطلب (الباقة والسعر والمبلغ والحالة والتواريخ) وبالرقم المرجعي من شريك الدفع. أما بيانات بطاقتك أو محفظتك فتُدخلها في صفحة شريك الدفع ولا تصل إلينا.",
        "الرسائل: البلاغات ورسائل البريد التي ترسلها لنا وردودنا عليها.",
        "تقنية واستخدام: معلومات أساسية عن الأخطاء والأداء، وأحداث بسيطة عمّا تفعله داخل التطبيق (مثل إكمال درس أو فتح صفحة الترقية) نحفظها لدينا، وإعدادات تُحفظ في متصفحك مثل اللغة والمظهر، وتقدّمك إن لم يكن لديك حساب، وكوكي يدوم ساعة واحدة يتذكّر الدرس الذي كنت عنده عند بدء الدفع لنعيدك إليه.",
      ],
    },
    {
      heading: "كيف نستخدمها",
      bullets: [
        "لتقديم الدروس وحفظ تقدّمك.",
        "لمعالجة المشتريات وتفعيل الخطة المميّزة وعرض السعر الصحيح لك.",
        "لإرسال رسائل البريد المتوقعة: ترحيب، وإيصال عند شراء الخطة المميّزة، وإشعارات الحساب مثل قرب انتهاء الخطة المميّزة، وتذكيرات وإنجازات يمكنك إيقافها من الإعدادات، وردود على رسائلك.",
        "لإصلاح المشاكل وحماية الخدمة من إساءة الاستخدام ولتحسين الدروس.",
      ],
    },
    {
      heading: "من يساعدنا في تشغيل SentenceStep",
      paragraphs: ["تستلم كل جهة منها ما تحتاجه فقط لأداء عملها:"],
      bullets: [
        "Supabase: قاعدة البيانات وتسجيل الدخول.",
        "Netlify: الاستضافة، وتخبرنا أيضًا ببلدك التقريبي من اتصالك.",
        "Wayl: المدفوعات. Wayl شركة مستقلة، وما تقدّمه لها في صفحتها، كاسمك ورقم هاتفك وبيانات بطاقتك أو محفظتك، يخضع لشروطها وسياسة الخصوصية الخاصة بها.",
        "Resend: إرسال رسائل البريد الإلكتروني.",
        "حيثما كانت مفعّلة: Sentry لمراقبة الأخطاء، وCloudflare Turnstile للتحقق من أن التسجيل يتم من شخص حقيقي.",
        "Google: فقط إذا اخترت «المتابعة عبر Google». وإذا قيّمت التطبيق تُحفظ درجتك وملاحظتك في جدول بيانات نملكه.",
        "خدمة الإشعارات في متصفحك: فقط إذا فعّلت الإشعارات.",
      ],
    },
    {
      heading: "ما لا نفعله",
      paragraphs: ["لا نبيع بياناتك الشخصية، ولا نعرض إعلانات، ولا نشاركها مع المعلنين."],
    },
    {
      heading: "مدة الاحتفاظ بالبيانات",
      paragraphs: [
        "تبقى بيانات الحساب والتعلّم إلى أن تحذف حسابك. وتُحفظ سجلات المدفوعات بالقدر الذي تتطلبه المحاسبة والالتزامات القانونية، حتى بعد حذف الحساب. وتبقى البلاغات والرسائل التي ترسلها لنا لنتمكّن من مساعدتك وتحسين الخدمة.",
      ],
    },
    {
      heading: "خياراتك",
      paragraphs: [
        "من الإعدادات يمكنك تنزيل بياناتك كملف، وتغيير تفضيلات البريد والإشعارات، وتشغيل الإشعارات أو إيقافها، وحذف حسابك. ولتصحيح بياناتك أو السؤال عنها راسلنا.",
      ],
    },
    {
      heading: "الأمان",
      paragraphs: [
        "تُحفظ بياناتك لدى Supabase عبر اتصالات مشفّرة، والوصول إليها محدود بما تحتاجه الخدمة، وبيانات بطاقتك لا تمرّ بخوادمنا أبدًا. لا توجد خدمة على الإنترنت تضمن الأمان الكامل، لكننا نعتني بحماية بياناتك.",
      ],
    },
    {
      heading: "التغييرات",
      paragraphs: ["إذا غيّرنا طريقة استخدامنا لبياناتك حدّثنا هذه الصفحة وتاريخها."],
    },
    {
      heading: "التواصل",
      paragraphs: [`للأسئلة حول بياناتك: ${SUPPORT_EMAIL}`],
    },
  ],
};

export const TERMS: Record<LegalLanguage, LegalDocument> = { en: TERMS_EN, ar: TERMS_AR };
export const PRIVACY: Record<LegalLanguage, LegalDocument> = { en: PRIVACY_EN, ar: PRIVACY_AR };
