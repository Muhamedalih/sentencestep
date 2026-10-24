import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";
import type { NudgeLanguage } from "@/lib/email/nudges/copy";
import type { HonestLine } from "@/lib/progress/honest-numbers";

export interface PremiumExpiryInput {
  origin: string;
  displayName: string | null;
  /** The end date, already formatted for reading in the message's language, e.g. "2 February 2027". */
  endsOn: string;
  /** Whole days left, rounded up. */
  daysLeft: number;
  /** The learner's live streak when it is long enough to mention, otherwise 0. */
  streak: number;
  /**
   * What the learner has done, when there is enough to say (honestLine): sentences written and, from
   * two days, days practised. Facts only: no level, no percentage, no price.
   */
  progress?: HonestLine | null;
  /** The language of the message (profiles.preferred_language: ar, es or tr; English otherwise). */
  language?: NudgeLanguage;
}

interface Copy {
  greeting: (name: string | null) => string;
  subject: (endsOn: string) => string;
  heading: (endsOn: string) => string;
  /** "3 days left" in the language, for the inbox preview. */
  left: (days: number) => string;
  preview: (left: string) => string;
  ends: (endsOn: string) => string;
  progress: (line: HonestLine) => string;
  streak: (streak: number) => string;
  stack: string;
  cta: string;
  footer: string;
}

/** Arabic counts days with three shapes: "يوم واحد", "يومان", "3 أيام" to "10 أيام", then "11 يوماً". */
function arabicDays(n: number): string {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومان";
  return n >= 3 && n <= 10 ? `${n} أيام` : `${n} يوماً`;
}

/** A learner has at least five sentences when the line is said: "5 جمل" to "10 جمل", then "11 جملة". */
function arabicSentences(n: number): string {
  return n <= 10 ? `${n} جمل` : `${n} جملة`;
}

/** The days practised, when the line has them (from two days); the sentences-only line has none. */
function daysOf(line: HonestLine): number | null {
  return line.kind === "sentences" ? null : line.days;
}

const COPY: Record<NudgeLanguage, Copy> = {
  ar: {
    greeting: (name) => (name ? `أهلاً ${name}،` : "أهلاً،"),
    subject: (endsOn) => `تنتهي خطتك المميّزة في SentenceStep في ${endsOn}`,
    heading: (endsOn) => `تنتهي خطتك المميّزة في ${endsOn}`,
    left: (days) => `بقي ${arabicDays(days)}`,
    preview: (left) => `${left} — أضف أياماً متى شئت.`,
    ends: (endsOn) =>
      `تنتهي خطتك المميّزة في SentenceStep في ${endsOn}. بعدها تعود إلى الخطة المجانية، ويبقى تقدّمك وتتابعك ونقاطك محفوظة.`,
    progress: (line) => {
      const days = daysOf(line);
      const written = `حتى الآن كتبت ${arabicSentences(line.sentences)} في SentenceStep`;
      return days === null ? `${written}.` : `${written}، وعدد أيام التعلّم: ${days}.`;
    },
    streak: (streak) =>
      `تتابعك الحالي ${arabicDays(streak)}. إضافة أيام الآن تُبقي كل الدروس مفتوحة وأنت تواصل.`,
    stack: "أي أيام تضيفها تُضاف فوق الأيام المتبقية، فلا داعي لانتظار آخر يوم.",
    cta: "أضف أياماً",
    footer: "وصلتك هذه الرسالة لأن لديك خطة مميّزة في SentenceStep.",
  },
  es: {
    greeting: (name) => (name ? `Hola ${name},` : "Hola,"),
    subject: (endsOn) => `Tu Premium de SentenceStep termina el ${endsOn}`,
    heading: (endsOn) => `Tu Premium termina el ${endsOn}`,
    left: (days) => (days === 1 ? "Queda 1 día" : `Quedan ${days} días`),
    preview: (left) => `${left} — añade días cuando quieras.`,
    ends: (endsOn) =>
      `Tu acceso Premium a SentenceStep termina el ${endsOn}. Después vuelves al plan gratuito; tu progreso, tu racha y tus XP quedan guardados.`,
    progress: (line) => {
      const days = daysOf(line);
      return days === null
        ? `Hasta ahora has escrito ${line.sentences} frases en SentenceStep.`
        : `Hasta ahora has escrito ${line.sentences} frases a lo largo de ${days} días de práctica.`;
    },
    streak: (streak) =>
      `Llevas una racha de ${streak} ${streak === 1 ? "día" : "días"}. Añadir días ahora mantiene todas las lecciones abiertas mientras la sigues.`,
    stack:
      "Los días que añadas se suman a los que te quedan, así que no hace falta esperar al último día.",
    cta: "Añadir más días",
    footer: "Recibes este mensaje porque tienes acceso Premium en SentenceStep.",
  },
  tr: {
    greeting: (name) => (name ? `Merhaba ${name},` : "Merhaba,"),
    subject: (endsOn) => `SentenceStep Premium'unuz ${endsOn} tarihinde sona eriyor`,
    heading: (endsOn) => `Premium'unuz ${endsOn} tarihinde sona eriyor`,
    left: (days) => `${days} gün kaldı`,
    preview: (left) => `${left} — istediğiniz zaman gün ekleyin.`,
    ends: (endsOn) =>
      `SentenceStep Premium erişiminiz ${endsOn} tarihinde sona eriyor. Ardından Ücretsiz plana dönersiniz; ilerlemeniz, seriniz ve XP'niz kayıtlı kalır.`,
    progress: (line) => {
      const days = daysOf(line);
      return days === null
        ? `Şimdiye kadar SentenceStep'te ${line.sentences} cümle yazdınız.`
        : `Şimdiye kadar ${days} günlük çalışmada ${line.sentences} cümle yazdınız.`;
    },
    streak: (streak) =>
      `${streak} günlük bir serideniz var. Şimdi gün eklemek, serinizi sürdürürken tüm dersleri açık tutar.`,
    stack:
      "Eklediğiniz günler kalan günlerinizin üzerine eklenir; son güne kadar beklemenize gerek yok.",
    cta: "Daha fazla gün ekle",
    footer: "Bu iletiyi SentenceStep'te Premium erişiminiz olduğu için alıyorsunuz.",
  },
  en: {
    greeting: (name) => `Hi ${name ?? "there"},`,
    subject: (endsOn) => `Your SentenceStep Premium ends on ${endsOn}`,
    heading: (endsOn) => `Your Premium ends on ${endsOn}`,
    left: (days) => (days === 1 ? "1 day left" : `${days} days left`),
    preview: (left) => `${left} — add days whenever you like.`,
    ends: (endsOn) =>
      `Your SentenceStep Premium access ends on ${endsOn}. After that you go back to the Free plan — your progress, streak and XP stay saved.`,
    progress: (line) => {
      const days = daysOf(line);
      return days === null
        ? `So far you've written ${line.sentences} sentences on SentenceStep.`
        : `So far you've written ${line.sentences} sentences over ${days} days of practice.`;
    },
    streak: (streak) =>
      `You're on a ${streak}-day streak. Adding days now keeps every lesson open while you keep it going.`,
    stack:
      "Any days you add are put on top of the days you have left, so there's no need to wait for the last day.",
    cta: "Add more days",
    footer: "You're receiving this because you have Premium access on SentenceStep.",
  },
};

/**
 * A plain, honest heads-up that a paid period is ending: the date, what
 * happens to their progress (nothing is lost), and that days added now stack
 * on top of what is left. It states no price and no deadline pressure, and
 * quotes a streak, and what the learner has written, only when there is something real to say. Written once per language a
 * learner can have; English is the fallback.
 */
export function premiumExpiryEmail({
  origin,
  displayName,
  endsOn,
  daysLeft,
  streak,
  progress = null,
  language = "en",
}: PremiumExpiryInput): EmailContent {
  const copy = COPY[language];
  const upgradeUrl = `${origin}/upgrade`;

  const lines = [
    copy.ends(endsOn),
    ...(progress ? [copy.progress(progress)] : []),
    ...(streak > 0 ? [copy.streak(streak)] : []),
    copy.stack,
  ];

  const greeting = copy.greeting(displayName);
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${escapeHtml(greeting)}</p>
    ${lines.map((line) => `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`).join("\n    ")}
  `;

  return {
    subject: copy.subject(endsOn),
    html: renderEmailLayout({
      previewText: copy.preview(copy.left(daysLeft)),
      heading: copy.heading(endsOn),
      bodyHtml,
      ctaLabel: copy.cta,
      ctaUrl: upgradeUrl,
      footerNote: copy.footer,
      lang: language,
    }),
    text: `${greeting}\n\n${lines.join("\n\n")}\n\n${copy.cta}: ${upgradeUrl}`,
  };
}
