import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * Wording of Home's "Today's plan" while it is an admin preview. Arabic and
 * English only (every other language reads the English); when the plan opens
 * to every learner these move into the dictionaries like the rest of the chrome.
 */
export interface PlanCopy {
  planTitle: string;
  planSub: string;
  startHere: string;
  skillWords: string;
  skillStory: string;
  skillWrite: string;
  wordsEyebrow: string;
  wordsRange: string;
  wordsWhy: string;
  wordsToday: string;
  wordsDoneTitle: string;
  wordsDoneSub: string;
  startWords: string;
  storyEyebrow: string;
  storyWhy: string;
  storyNone: string;
  startStory: string;
  writeEyebrow: string;
  writeWhy: string;
  writeNone: string;
  startWrite: string;
  doneToday: string;
  comesAfter: string;
  afterWords: string;
  afterStory: string;
  allDoneTitle: string;
  allDoneBody: string;
  levelLabel: string;
  levelPercent: string;
  ringWords: string;
  ringStory: string;
  ringWrite: string;
  hintStart: string;
  hintWeak: string;
  weakWords: string;
  weakStories: string;
  weakLessons: string;
  tipWords: string;
  tipStories: string;
  tipLessons: string;
}

const en: PlanCopy = {
  planTitle: "Today's plan",
  planSub: "Words feed the story, writing makes it stick · about 15 minutes",
  startHere: "Start here",
  skillWords: "Vocabulary",
  skillStory: "Language",
  skillWrite: "Writing",
  wordsEyebrow: "{n} new words · about 3 minutes",
  wordsRange: "Words {from}–{to} of {total}",
  wordsWhy: "Builds your stock of new words",
  wordsToday: "{n} / {total} today",
  wordsDoneTitle: "Every word is done",
  wordsDoneSub: "Review them any time",
  startWords: "Start the words",
  storyEyebrow: "A general story · about 6 minutes",
  storyWhy: "Strengthens your language: understand words inside a real story",
  storyNone: "Every story is done",
  startStory: "Start the story",
  writeEyebrow: "A daily lesson · about 6 minutes",
  writeWhy: "Strengthens your writing: type every sentence letter by letter",
  writeNone: "Every lesson is done",
  startWrite: "Start writing",
  doneToday: "Done today",
  comesAfter: "Comes after {step}",
  afterWords: "the words",
  afterStory: "the story",
  allDoneTitle: "Today's plan is done",
  allDoneBody: "Come back tomorrow for five new words and a new story.",
  levelLabel: "Your level",
  levelPercent: "{n}% of this level · average of the three tracks",
  ringWords: "Words",
  ringStory: "Language",
  ringWrite: "Writing",
  hintStart: "Start with five words today. The rest follows step by step.",
  hintWeak: "Weakest right now: {track} ({done} of {total}).",
  weakWords: "Vocabulary",
  weakStories: "Stories",
  weakLessons: "Writing",
  tipWords: "Five words today is enough.",
  tipStories: "Today's story helps.",
  tipLessons: "The next writing lesson strengthens it.",
};

const ar: PlanCopy = {
  planTitle: "خطة اليوم",
  planSub: "الكلمات تغذّي القصة، والكتابة تثبّت ما تعلمته · نحو 15 دقيقة",
  startHere: "ابدأ من هنا",
  skillWords: "المفردات",
  skillStory: "اللغة",
  skillWrite: "الكتابة",
  wordsEyebrow: "{n} كلمات جديدة · نحو 3 دقائق",
  wordsRange: "الكلمات {from}–{to} من {total}",
  wordsWhy: "تبني رصيدك من الكلمات الجديدة",
  wordsToday: "{n} / {total} اليوم",
  wordsDoneTitle: "أنهيت كل الكلمات",
  wordsDoneSub: "راجعها وقتما تشاء",
  startWords: "ابدأ الكلمات",
  storyEyebrow: "قصة عامة · نحو 6 دقائق",
  storyWhy: "تقوّي لغتك: تفهم الكلمات داخل قصة حقيقية",
  storyNone: "أنهيت كل القصص",
  startStory: "ابدأ القصة",
  writeEyebrow: "درس يومي · نحو 6 دقائق",
  writeWhy: "تقوّي كتابتك: اكتب كل جملة حرفاً حرفاً",
  writeNone: "أنهيت كل الدروس",
  startWrite: "ابدأ الكتابة",
  doneToday: "تم اليوم",
  comesAfter: "يأتي بعد {step}",
  afterWords: "الكلمات",
  afterStory: "القصة",
  allDoneTitle: "أنجزت خطة اليوم",
  allDoneBody: "عد غداً لخمس كلمات جديدة وقصة جديدة.",
  levelLabel: "مستواك",
  levelPercent: "{n}% من المرحلة · متوسط المسارات الثلاثة",
  ringWords: "مفردات",
  ringStory: "لغة",
  ringWrite: "كتابة",
  hintStart: "ابدأ اليوم بخمس كلمات. والباقي يأتي خطوة بخطوة.",
  hintWeak: "الأضعف الآن: {track} ({done} من {total}).",
  weakWords: "المفردات",
  weakStories: "القصص",
  weakLessons: "الكتابة",
  tipWords: "خمس كلمات اليوم تكفي.",
  tipStories: "قصة اليوم تقرّبك.",
  tipLessons: "درس الكتابة التالي يقوّيها.",
};

export function planCopy(locale: SupportLocale | null): PlanCopy {
  return locale === "ar" ? ar : en;
}
