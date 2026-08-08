import type { Lesson } from "@/types/content";

/**
 * Normal mode: short standalone sentences, one per lesson unit, grouped into
 * difficulty levels. This is the initial content set (~12 sentences); more
 * levels can be appended without changing the shape.
 */
export const normalLessons: Lesson[] = [
  {
    id: "normal-1",
    mode: "normal",
    level: 1,
    order: 1,
    title: "I am happy.",
    titleAr: "أنا سعيد.",
    isFree: true,
    sentences: [{ id: "normal-1-s1", en: "I am happy.", ar: "أنا سعيد." }],
    vocabulary: [{ id: "normal-1-v1", en: "happy", ar: "سعيد" }],
  },
  {
    id: "normal-2",
    mode: "normal",
    level: 1,
    order: 2,
    title: "This is my book.",
    titleAr: "هذا كتابي.",
    isFree: true,
    sentences: [{ id: "normal-2-s1", en: "This is my book.", ar: "هذا كتابي." }],
  },
  {
    id: "normal-3",
    mode: "normal",
    level: 1,
    order: 3,
    title: "She likes tea.",
    titleAr: "هي تحب الشاي.",
    isFree: true,
    sentences: [{ id: "normal-3-s1", en: "She likes tea.", ar: "هي تحب الشاي." }],
  },
  {
    id: "normal-4",
    mode: "normal",
    level: 1,
    order: 4,
    title: "We are friends.",
    titleAr: "نحن أصدقاء.",
    isFree: true,
    sentences: [{ id: "normal-4-s1", en: "We are friends.", ar: "نحن أصدقاء." }],
  },
  {
    id: "normal-5",
    mode: "normal",
    level: 2,
    order: 5,
    title: "He goes to school every day.",
    titleAr: "يذهب إلى المدرسة كل يوم.",
    isFree: true,
    sentences: [
      { id: "normal-5-s1", en: "He goes to school every day.", ar: "يذهب إلى المدرسة كل يوم." },
    ],
    vocabulary: [
      { id: "normal-5-v1", en: "school", ar: "مدرسة" },
      { id: "normal-5-v2", en: "every day", ar: "كل يوم" },
    ],
  },
  {
    id: "normal-6",
    mode: "normal",
    level: 2,
    order: 6,
    title: "My mother is cooking dinner.",
    titleAr: "أمي تطبخ العشاء.",
    isFree: true,
    sentences: [{ id: "normal-6-s1", en: "My mother is cooking dinner.", ar: "أمي تطبخ العشاء." }],
  },
  {
    id: "normal-7",
    mode: "normal",
    level: 2,
    order: 7,
    title: "They are playing in the park.",
    titleAr: "إنهم يلعبون في الحديقة.",
    isFree: true,
    sentences: [
      { id: "normal-7-s1", en: "They are playing in the park.", ar: "إنهم يلعبون في الحديقة." },
    ],
  },
  {
    id: "normal-8",
    mode: "normal",
    level: 2,
    order: 8,
    title: "I can speak a little English.",
    titleAr: "أستطيع التحدث بالإنجليزية قليلاً.",
    isFree: false,
    sentences: [
      {
        id: "normal-8-s1",
        en: "I can speak a little English.",
        ar: "أستطيع التحدث بالإنجليزية قليلاً.",
      },
    ],
  },
  {
    id: "normal-9",
    mode: "normal",
    level: 3,
    order: 9,
    title: "Although it was raining, we went outside.",
    titleAr: "على الرغم من أنها كانت تمطر، خرجنا.",
    isFree: false,
    sentences: [
      {
        id: "normal-9-s1",
        en: "Although it was raining, we went outside.",
        ar: "على الرغم من أنها كانت تمطر، خرجنا.",
      },
    ],
  },
  {
    id: "normal-10",
    mode: "normal",
    level: 3,
    order: 10,
    title: "She has been studying English for two years.",
    titleAr: "إنها تدرس الإنجليزية منذ سنتين.",
    isFree: false,
    sentences: [
      {
        id: "normal-10-s1",
        en: "She has been studying English for two years.",
        ar: "إنها تدرس الإنجليزية منذ سنتين.",
      },
    ],
  },
  {
    id: "normal-11",
    mode: "normal",
    level: 3,
    order: 11,
    title: "If you practice every day, you will improve quickly.",
    titleAr: "إذا تدربت كل يوم، ستتحسن بسرعة.",
    isFree: false,
    sentences: [
      {
        id: "normal-11-s1",
        en: "If you practice every day, you will improve quickly.",
        ar: "إذا تدربت كل يوم، ستتحسن بسرعة.",
      },
    ],
  },
  {
    id: "normal-12",
    mode: "normal",
    level: 3,
    order: 12,
    title: "The meeting was postponed because of the weather.",
    titleAr: "تم تأجيل الاجتماع بسبب الطقس.",
    isFree: false,
    sentences: [
      {
        id: "normal-12-s1",
        en: "The meeting was postponed because of the weather.",
        ar: "تم تأجيل الاجتماع بسبب الطقس.",
      },
    ],
  },
];
