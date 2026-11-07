/**
 * The words Video dictation shows. Arabic only for now (the section is open to admins only): the
 * function already takes the locale, so Spanish and Turkish can be added here without touching the
 * shared dictionaries, the way the rule of the day does it (see daily-rule/strings.ts).
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { VideoKind } from "./types";

export interface VideoStrings {
  navLabel: string;
  libraryTitle: string;
  librarySubtitle: string;
  levelAll: string;
  libraryEmpty: string;
  /** "{n}" sentences. */
  sentenceCount: string;
  start: string;
  carryOn: string;
  finished: string;
  back: string;
  pressPlay: string;
  pressPlayHint: string;
  replay: string;
  slow: string;
  hideWords: string;
  showWords: string;
  continueNow: string;
  resumingSoon: string;
  adPlaying: string;
  /** "{n}" of "{total}". */
  progress: string;
  finishTitle: string;
  /** "{percent}" accuracy, "{count}" sentences. */
  accuracyLine: string;
  reviewWords: string;
  nextVideo: string;
  watchFull: string;
  backToLibrary: string;
  /** "{channel}" */
  videoFrom: string;
  watchOnYouTube: string;
  unavailableTitle: string;
  unavailableBody: string;
  blockedBody: string;
  /** The «جديد» line on Home (the "videoNews" permission). */
  newsTitle: string;
  newsBody: string;
  newsOpen: string;
  newsDismiss: string;
  /** The names of the sections of the library, one per kind of video. */
  kinds: Record<VideoKind, string>;
  /** The shelves look of the library (the "videoShelves" permission): its header, its section names with one line each, and the shelf controls. */
  shelfEyebrow: string;
  shelfTitle: string;
  shelfSubtitle: string;
  shelfKinds: Record<VideoKind, { name: string; line: string }>;
  shelfShowAll: string;
  shelfShowLess: string;
  shelfPrevious: string;
  shelfNext: string;
  /** The Admin's arrange mode of the library. */
  arrange: string;
  arrangeHint: string;
  arrangeSave: string;
  arrangeSaving: string;
  arrangeCancel: string;
  arrangeReset: string;
  arrangeResetConfirm: string;
  arrangeEmptySection: string;
  moveUp: string;
  moveDown: string;
  moveSectionUp: string;
  moveSectionDown: string;
  /** The label of the list that moves a video to another section: "{title}". */
  sectionOf: string;
  arrangeSaved: string;
  arrangeResetDone: string;
  arrangeFailed: string;
  arrangeNotAllowed: string;
  arrangeInvalid: string;
  arrangeNoTable: string;
  /** The Admin's editor of where each sentence starts and where the video stops. */
  stopsOpen: string;
  stopsTitle: string;
  stopsHint: string;
  stopsStart: string;
  stopsEnd: string;
  stopsNow: string;
  stopsTest: string;
  stopsSave: string;
  stopsSaving: string;
  stopsReset: string;
  stopsResetConfirm: string;
  stopsClose: string;
  stopsSaved: string;
  stopsResetDone: string;
  stopsFailed: string;
  stopsNotAllowed: string;
  stopsInvalid: string;
  stopsNoTable: string;
}

const ar: VideoStrings = {
  navLabel: "فيديو",
  libraryTitle: "فيديو",
  librarySubtitle: "اسمع الجملة من فيديو حقيقي واكتبها. الفيديو يُعرض من يوتيوب مباشرة.",
  levelAll: "الكل",
  libraryEmpty: "لا توجد فيديوهات جاهزة بعد.",
  sentenceCount: "{n} جمل",
  start: "ابدأ",
  carryOn: "تابع",
  finished: "أنهيته",
  back: "رجوع",
  pressPlay: "اضغط زر التشغيل داخل الفيديو",
  pressPlayHint: "ثم اكتب الجملة بعد ما تسمعها",
  replay: "إعادة",
  slow: "بطيء",
  hideWords: "إخفاء الكلمات",
  showWords: "إظهار الكلمات",
  continueNow: "كمّل الآن",
  resumingSoon: "يكمل الفيديو بعد لحظة…",
  adPlaying: "إعلان من يوتيوب… يكمل الفيديو بعده",
  progress: "{n} / {total}",
  finishTitle: "أنهيت الفيديو",
  accuracyLine: "دقة الكتابة {percent}% · {count} جمل",
  reviewWords: "كلمات للمراجعة",
  nextVideo: "الفيديو التالي",
  watchFull: "شاهد الفيديو كاملاً على يوتيوب",
  backToLibrary: "العودة إلى الفيديوهات",
  videoFrom: "الفيديو من قناة {channel}، ويُعرض من يوتيوب",
  watchOnYouTube: "Watch on YouTube",
  unavailableTitle: "الفيديو غير متاح حالياً",
  unavailableBody: "صاحب الفيديو منع عرضه هنا أو حذفه. جرّب فيديو آخر.",
  blockedBody: "تعذّر تحميل مشغّل يوتيوب. تأكد من الاتصال وجرّب مرة ثانية.",
  newsTitle: "جديد: قسم «فيديو»",
  newsBody: "اسمع الجملة من مقطع حقيقي واكتبها",
  newsOpen: "جرّب الآن",
  newsDismiss: "إغلاق",
  kinds: {
    comedy: "كوميدي",
    english: "تعلّم الإنجليزية",
    science: "علوم وبيئة",
    animals: "حيوانات",
    motivation: "تحفيزي",
    other: "أخرى",
  },
  shelfEyebrow: "فيديو",
  shelfTitle: "الإنجليزي كما يتكلّمه أهله",
  shelfSubtitle: "مقاطع قصيرة من يوتيوب، وكل رفّ مرتّب من الأسهل إلى الأصعب.",
  shelfKinds: {
    comedy: { name: "مواقف تضحك", line: "حوارات قصيرة ومضحكة بالإنجليزي اليومي" },
    science: { name: "حقائق في دقيقة", line: "راوٍ واحد بصوت واضح، ومعلومة غريبة في كل مقطع" },
    motivation: { name: "حكايات قصيرة", line: "قصة كاملة لها بداية ونهاية، في أقل من دقيقة" },
    english: { name: "إنجليزي واضح", line: "نطق هادئ وواضح من دروس ونشرات حقيقية" },
    animals: { name: "عالم الحيوان", line: "حقائق عن الحيوانات بصوت راوٍ واضح" },
    other: { name: "منوّعات", line: "مقاطع من كل نوع" },
  },
  shelfShowAll: "عرض الكل",
  shelfShowLess: "عرض أقل",
  shelfPrevious: "السابق",
  shelfNext: "التالي",
  arrange: "ترتيب الفيديوهات",
  arrangeHint: "اسحب الفيديو لتغيير مكانه، أو استعمل الأسهم والقائمة.",
  arrangeSave: "حفظ الترتيب",
  arrangeSaving: "جارٍ الحفظ…",
  arrangeCancel: "إلغاء",
  arrangeReset: "العودة للترتيب الافتراضي",
  arrangeResetConfirm: "ترجع الأقسام والفيديوهات إلى ترتيبها الافتراضي، ويُحذف ترتيبك المحفوظ؟",
  arrangeEmptySection: "لا توجد فيديوهات هنا. انقل فيديو إليه من قائمة القسم.",
  moveUp: "أعلى",
  moveDown: "أسفل",
  moveSectionUp: "نقل القسم للأعلى",
  moveSectionDown: "نقل القسم للأسفل",
  sectionOf: "قسم الفيديو: {title}",
  arrangeSaved: "تم حفظ الترتيب.",
  arrangeResetDone: "رجع الترتيب إلى الافتراضي.",
  arrangeFailed: "تعذّر الحفظ. جرّب مرة ثانية.",
  arrangeNotAllowed: "هذا الخيار للأدمن فقط.",
  arrangeInvalid: "الترتيب غير صالح، لم يُحفظ شيء.",
  arrangeNoTable:
    "تعذّر الحفظ: جدول الترتيب غير موجود بعد في قاعدة البيانات (الملف 20250353000000).",
  stopsOpen: "ضبط التوقف",
  stopsTitle: "ضبط توقف الفيديو",
  stopsHint:
    "البداية: من أين تُعاد الجملة. التوقف: أين يقف الفيديو بعدها. حرّك بالأزرار أو قف بالفيديو على اللحظة واضغط «الآن»، ثم جرّب واحفظ.",
  stopsStart: "البداية",
  stopsEnd: "التوقف",
  stopsNow: "الآن",
  stopsTest: "جرّب",
  stopsSave: "حفظ التوقف",
  stopsSaving: "جارٍ الحفظ…",
  stopsReset: "الرجوع للأصلي",
  stopsResetConfirm: "ترجع كل أوقات هذا الفيديو إلى الأصلية ويُحذف ما حفظته؟",
  stopsClose: "إغلاق",
  stopsSaved: "تم حفظ التوقف، ويظهر للجميع.",
  stopsResetDone: "رجعت الأوقات إلى الأصلية.",
  stopsFailed: "تعذّر الحفظ. جرّب مرة ثانية.",
  stopsNotAllowed: "هذا الخيار للأدمن فقط.",
  stopsInvalid: "الأوقات غير صالحة (جملة أقصر من 0.3 ثانية أو توقفات غير مرتبة)، لم يُحفظ شيء.",
  stopsNoTable: "تعذّر الحفظ: جدول الأوقات غير موجود بعد في قاعدة البيانات (الملف 20250354000000).",
};

/** What the one-time rating card after a finished video asks, in the learner's own language (null is English). */
export interface VideoRatingCopy {
  headline: string;
  subtitle: string;
  commentPlaceholder: string;
  thanksTitle: string;
  thanksBody: string;
}

const ratingAr: VideoRatingCopy = {
  headline: "ما رأيك في قسم الفيديو الجديد؟",
  subtitle:
    "أضفنا هذا القسم ليكون تعلّم الإنجليزية من مقاطع حقيقية أمتع وأقرب إلى الواقع، ورأيك الصادق هو ما يهدينا إلى تحسينه. اختر عدد النجوم، وأخبرنا بما أعجبك وبما ينبغي أن نطوّره في الموقع. التقييم اختياري ولا يستغرق سوى ثوانٍ، ولن تظهر لك هذه الرسالة مرة أخرى.",
  commentPlaceholder: "ما رأيك في قسم الفيديو، وكيف نطوّر الموقع ليكون أفضل لك؟ (اختياري)",
  thanksTitle: "شكرًا لك على مشاركتنا رأيك",
  thanksBody: "وصل تقييمك، وسيكون جزءًا من مسيرة تطوير قسم الفيديو والموقع.",
};

const ratingEn: VideoRatingCopy = {
  headline: "What do you think of the new Video section?",
  subtitle:
    "We added it to make learning English from real clips more enjoyable, and your honest opinion is what guides us in improving it. Choose a star rating and tell us what you liked and how we should develop the site. It is optional, takes only seconds, and this message will not appear again.",
  commentPlaceholder:
    "What do you think of Video, and how can we make the site better for you? (optional)",
  thanksTitle: "Thank you for sharing your opinion",
  thanksBody: "Your rating has arrived and will shape how we develop Video and the site.",
};

const ratingEs: VideoRatingCopy = {
  headline: "¿Qué te parece la nueva sección de Video?",
  subtitle:
    "La añadimos para que aprender inglés con clips reales sea más ameno, y tu opinión sincera es lo que nos guía para mejorarla. Elige las estrellas y cuéntanos qué te gustó y cómo debemos desarrollar el sitio. Es opcional, solo lleva unos segundos y este mensaje no volverá a aparecer.",
  commentPlaceholder: "¿Qué opinas del Video y cómo podemos mejorar el sitio para ti? (opcional)",
  thanksTitle: "Gracias por compartir tu opinión",
  thanksBody: "Tu valoración llegó y nos ayudará a desarrollar Video y el sitio.",
};

const ratingTr: VideoRatingCopy = {
  headline: "Yeni Video bölümü hakkında ne düşünüyorsun?",
  subtitle:
    "Gerçek kliplerle İngilizce öğrenmeyi daha keyifli hale getirmek için ekledik; içten görüşün onu geliştirmemizde bize yol gösteriyor. Yıldız ver, neyi beğendiğini ve siteyi nasıl geliştirmemiz gerektiğini yaz. İsteğe bağlıdır, yalnızca birkaç saniye sürer ve bu mesaj bir daha görünmez.",
  commentPlaceholder:
    "Video bölümü hakkında ne düşünüyorsun, siteyi senin için nasıl geliştirelim? (isteğe bağlı)",
  thanksTitle: "Görüşünü paylaştığın için teşekkürler",
  thanksBody: "Değerlendirmen ulaştı; Video bölümünü ve siteyi geliştirmemize katkı sağlayacak.",
};

export function videoRatingCopy(locale: SupportLocale | null): VideoRatingCopy {
  if (locale === "ar") return ratingAr;
  if (locale === "es") return ratingEs;
  if (locale === "tr") return ratingTr;
  return ratingEn;
}

/** The little «new» word on the Video button, in the learner's own language (null is English). */
export function videoNewLabel(locale: SupportLocale | null): string {
  if (locale === "ar") return "جديد";
  if (locale === "es") return "Nuevo";
  if (locale === "tr") return "Yeni";
  return "New";
}

/** The classic Home's Video box: its quiet tag ("type what you hear") and its button, in the learner's own language. */
export function videoHomeCopy(locale: SupportLocale | null): { tag: string; cta: string } {
  if (locale === "ar") return { tag: "اكتب ما تسمع", cta: "شاهد واكتب" };
  if (locale === "es") return { tag: "Escribe lo que oyes", cta: "Mira y escribe" };
  if (locale === "tr") return { tag: "Duyduğunu yaz", cta: "İzle ve yaz" };
  return { tag: "Type what you hear", cta: "Watch and type" };
}

export function videoStrings(locale: SupportLocale | null): VideoStrings {
  void locale;
  return ar;
}

/** Fills "{name}" holes in one of the strings above. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));
}
