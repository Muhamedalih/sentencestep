/**
 * The words Video dictation shows. Arabic only for now (the section is open to admins only): the
 * function already takes the locale, so Spanish and Turkish can be added here without touching the
 * shared dictionaries, the way the rule of the day does it (see daily-rule/strings.ts).
 */

import type { SupportLocale } from "@/lib/i18n/locales";

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
};

export function videoStrings(locale: SupportLocale | null): VideoStrings {
  void locale;
  return ar;
}

/** Fills "{name}" holes in one of the strings above. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));
}
