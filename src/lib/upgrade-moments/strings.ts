/**
 * The words of the upgrade cards at moments of progress (the "upgradeMoments" permission). They live
 * here, not in the shared dictionaries, the way the rule of the day and Video dictation do it: the
 * function takes the locale (null is English) and the cards stay one self-contained piece.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { UpgradeMoment } from "./rules";

export interface MomentCopy {
  badge: string;
  heading: string;
  body: string;
  benefits: readonly [string, string];
}

export interface UpgradeMomentStrings {
  kicker: string;
  cta: string;
  later: string;
  close: string;
  lessonsLabel: string;
  storiesLabel: string;
  streakLabel: string;
  moments: Record<UpgradeMoment, MomentCopy>;
}

const ar: UpgradeMomentStrings = {
  kicker: "SENTENCESTEP PREMIUM",
  cta: "اشترك وكمّل",
  later: "لاحقاً",
  close: "إغلاق",
  lessonsLabel: "دروس هذا الأسبوع",
  storiesLabel: "قصص هذا الأسبوع",
  streakLabel: "أيام متتالية",
  moments: {
    tasks: {
      badge: "خلّصت مهام اليوم",
      heading: "أنجزت اليوم كل شيء. لا تدع زخمك يتوقف هنا",
      body: "ما أنجزته هذا الأسبوع يستحق أن يستمر. أكمل من حيث وقفت بدون أقفال.",
      benefits: ["كل القصص والدروس بلا أقفال", "تقدّمك محفوظ ولا يضيع"],
    },
    streak3: {
      badge: "3 أيام متتالية",
      heading: "3 أيام متتالية. هذه بداية عادة قوية",
      body: "كل يوم إضافي يثبّت ما تعلّمته. لا تكسر السلسلة عند أول قفل.",
      benefits: ["تابع بدون أقفال", "سلسلتك وتقدّمك محفوظان"],
    },
    story: {
      badge: "أنهيت قصة كاملة",
      heading: "أنهيت قصة كاملة. التالية جاهزة لك",
      body: "القصص أسرع طريق لتثبيت الكلمات، وأنت تتقدّم فيها بسرعة.",
      benefits: ["كل مكتبة القصص مفتوحة", "كلمات كل قصة تتحول إلى تمرين"],
    },
  },
};

const en: UpgradeMomentStrings = {
  kicker: "SENTENCESTEP PREMIUM",
  cta: "Subscribe and keep going",
  later: "Later",
  close: "Close",
  lessonsLabel: "lessons this week",
  storiesLabel: "stories this week",
  streakLabel: "days in a row",
  moments: {
    tasks: {
      badge: "Today's tasks done",
      heading: "You finished everything today. Keep the momentum going",
      body: "What you did this week deserves to continue. Pick up where you left off, with no locks.",
      benefits: ["Every story and lesson unlocked", "Your progress stays saved"],
    },
    streak3: {
      badge: "3 days in a row",
      heading: "Three days in a row. This is the start of a habit",
      body: "Every extra day makes what you learned stick. Don't break the chain at the first lock.",
      benefits: ["Keep going with no locks", "Your streak and progress stay saved"],
    },
    story: {
      badge: "Story finished",
      heading: "You finished a whole story. The next one is ready",
      body: "Stories are the fastest way to make words stick, and you are moving through them fast.",
      benefits: ["The whole story library open", "Each story's words become practice"],
    },
  },
};

const es: UpgradeMomentStrings = {
  kicker: "SENTENCESTEP PREMIUM",
  cta: "Suscríbete y sigue",
  later: "Más tarde",
  close: "Cerrar",
  lessonsLabel: "lecciones esta semana",
  storiesLabel: "historias esta semana",
  streakLabel: "días seguidos",
  moments: {
    tasks: {
      badge: "Tareas de hoy hechas",
      heading: "Hoy lo terminaste todo. No frenes tu impulso",
      body: "Lo que lograste esta semana merece continuar. Sigue donde lo dejaste, sin bloqueos.",
      benefits: ["Todas las historias y lecciones abiertas", "Tu progreso queda guardado"],
    },
    streak3: {
      badge: "3 días seguidos",
      heading: "Tres días seguidos. Así empieza un buen hábito",
      body: "Cada día extra fija lo que aprendiste. No rompas la racha en el primer bloqueo.",
      benefits: ["Sigue sin bloqueos", "Tu racha y tu progreso quedan guardados"],
    },
    story: {
      badge: "Historia terminada",
      heading: "Terminaste una historia completa. La siguiente te espera",
      body: "Las historias son la forma más rápida de fijar palabras, y avanzas rápido.",
      benefits: [
        "Toda la biblioteca de historias abierta",
        "Las palabras de cada historia se vuelven práctica",
      ],
    },
  },
};

const tr: UpgradeMomentStrings = {
  kicker: "SENTENCESTEP PREMIUM",
  cta: "Abone ol ve devam et",
  later: "Sonra",
  close: "Kapat",
  lessonsLabel: "bu hafta ders",
  storiesLabel: "bu hafta hikâye",
  streakLabel: "gün üst üste",
  moments: {
    tasks: {
      badge: "Bugünün görevleri bitti",
      heading: "Bugün her şeyi tamamladın. Ivmeni kaybetme",
      body: "Bu hafta yaptıkların devam etmeyi hak ediyor. Kaldığın yerden, kilitsiz sürdür.",
      benefits: ["Tüm hikâyeler ve dersler açık", "İlerlemen kayıtlı kalır"],
    },
    streak3: {
      badge: "3 gün üst üste",
      heading: "Üst üste üç gün. Bu güçlü bir alışkanlığın başlangıcı",
      body: "Her ek gün öğrendiklerini pekiştirir. Zinciri ilk kilitte kırma.",
      benefits: ["Kilitsiz devam et", "Serin ve ilerlemen kayıtlı kalır"],
    },
    story: {
      badge: "Hikâye bitti",
      heading: "Bir hikâyeyi tamamen bitirdin. Sıradaki hazır",
      body: "Hikâyeler kelimeleri pekiştirmenin en hızlı yolu ve sen hızlı ilerliyorsun.",
      benefits: ["Tüm hikâye kitaplığı açık", "Her hikâyenin kelimeleri alıştırmaya dönüşür"],
    },
  },
};

export function upgradeMomentStrings(locale: SupportLocale | null): UpgradeMomentStrings {
  switch (locale) {
    case "ar":
      return ar;
    case "es":
      return es;
    case "tr":
      return tr;
    default:
      return en;
  }
}
