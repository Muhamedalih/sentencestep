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
  /** The names of the sections of the library, one per kind of video. */
  kinds: Record<VideoKind, string>;
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
  /** The «جديد» line on Home and the tag on the menu item (the "videoNews" permission). */
  newsTitle: string;
  newsBody: string;
  newsOpen: string;
  newsDismiss: string;
  newTag: string;
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
  kinds: {
    comedy: "كوميدي",
    english: "تعلّم الإنجليزية",
    science: "علوم وبيئة",
    animals: "حيوانات",
    motivation: "تحفيزي",
    other: "أخرى",
  },
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
  newsTitle: "جديد: قسم «فيديو»",
  newsBody: "اسمع الجملة من مقطع حقيقي واكتبها",
  newsOpen: "جرّب الآن",
  newsDismiss: "إغلاق",
  newTag: "جديد",
};

export function videoStrings(locale: SupportLocale | null): VideoStrings {
  void locale;
  return ar;
}

/** Fills "{name}" holes in one of the strings above. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));
}
