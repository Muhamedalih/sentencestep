import { LESSON_MINUTES } from "@/lib/session-end/summary";
import { render } from "@/lib/email/nudges/copy";
import type { NudgeLanguage, UnsubscribeLinks } from "@/lib/email/nudges/copy";
import type { EmailContent } from "@/lib/email/templates/layout";

/**
 * The one message a learner asked for by pressing a time on the return loop's card: the same words
 * as a browser notification and as an email (the email says a little more), in the learner's
 * language, about THEIR next lesson and a word THEY stumbled on. Everything in it is true on the day
 * it is sent: the lesson is the one the card named, the word is one their own mistakes list holds,
 * and "yesterday" is the day they pressed the time. No countdown, no scarcity, no promise beyond
 * what the product does (a word you stumbled on comes back inside the lesson).
 */
export interface PersonalReminder {
  /** The title of the lesson the message opens, or null when none could be worked out (the message then talks about a short session). */
  title: string | null;
  /** One word the learner stumbled on today, or null. */
  word: string | null;
  /** How long the lesson takes, in minutes. */
  minutes: number;
}

export const DEFAULT_MINUTES = LESSON_MINUTES;

/** "3 minutes" in the learner's language (Arabic has its own forms for one, two, a few and many). */
export function minutesLabel(language: NudgeLanguage, minutes: number): string {
  const n = Math.max(1, Math.round(minutes));
  switch (language) {
    case "ar":
      return n === 1 ? "دقيقة واحدة" : n === 2 ? "دقيقتين" : n <= 10 ? `${n} دقائق` : `${n} دقيقة`;
    case "es":
      return `${n} min`;
    case "tr":
      return `${n} dk`;
    default:
      return n === 1 ? "1 minute" : `${n} minutes`;
  }
}

export interface PushText {
  title: string;
  body: string;
}

/** The notification: a title that costs a glance and a body that names the lesson and the word. */
export function personalPush(language: NudgeLanguage, reminder: PersonalReminder): PushText {
  const { title, word } = reminder;
  const time = minutesLabel(language, reminder.minutes);
  switch (language) {
    case "ar":
      return {
        title: `درسك جاهز، ${time} فقط`,
        body: title
          ? word
            ? `«${title}» ينتظرك. كلمة «${word}» التي عثرت بها أمس ستعود فيه لتثبّتها.`
            : `«${title}» ينتظرك. الجمل تثبت حين تعود إليها اليوم، فلا تتركها تضيع.`
          : word
            ? `جلسة قصيرة تثبّت ما كتبته أمس. كلمة «${word}» التي عثرت بها ستعود فيها.`
            : "جلسة قصيرة تثبّت ما كتبته أمس. افتحها الآن.",
      };
    case "es":
      return {
        title: `Tu lección está lista: ${time}`,
        body: title
          ? word
            ? `«${title}» te espera. La palabra «${word}» que se te complicó ayer vuelve en ella para que se te quede.`
            : `«${title}» te espera. Lo que escribiste ayer se queda si vuelves hoy: no lo dejes enfriar.`
          : word
            ? `Una sesión corta para afianzar lo que escribiste ayer. La palabra «${word}» vuelve en ella.`
            : "Una sesión corta para afianzar lo que escribiste ayer. Ábrela ahora.",
      };
    case "tr":
      return {
        title: `Dersiniz hazır: ${time}`,
        body: title
          ? word
            ? `“${title}” sizi bekliyor. Dün takıldığınız “${word}” kelimesi bu derste geri geliyor, böylece kalıcı olur.`
            : `“${title}” sizi bekliyor. Dün yazdıklarınız bugün dönerseniz kalıcı olur: soğumasına izin vermeyin.`
          : word
            ? `Dün yazdıklarınızı pekiştiren kısa bir oturum. “${word}” kelimesi bu oturumda geri geliyor.`
            : "Dün yazdıklarınızı pekiştiren kısa bir oturum. Şimdi açın.",
      };
    default:
      return {
        title: `Your lesson is ready: ${time}`,
        body: title
          ? word
            ? `“${title}” is waiting. The word “${word}” you stumbled on yesterday comes back in it, so it finally sticks.`
            : `“${title}” is waiting. What you typed yesterday sticks when you come back today: don't let it fade.`
          : word
            ? `A short session to lock in what you typed yesterday. The word “${word}” comes back in it.`
            : "A short session to lock in what you typed yesterday. Open it now.",
      };
  }
}

interface EmailText {
  subject: (title: string | null, time: string) => string;
  preview: (word: string | null) => string;
  heading: string;
  opening: string;
  lesson: (title: string, time: string) => string;
  word: (word: string) => string;
  closing: string;
  cta: string;
}

const EMAIL: Record<NudgeLanguage, EmailText> = {
  ar: {
    subject: (title, time) =>
      title ? `«${title}» ينتظرك: ${time} تثبّت ما كتبته أمس` : `${time} تثبّت ما كتبته أمس`,
    preview: (word) =>
      word ? `وكلمة «${word}» التي عثرت بها ستعود فيه` : "الجمل تثبت حين تعود إليها اليوم",
    heading: "درسك التالي جاهز",
    opening: "أنهيت أمس جلستك، وهذه أصعب خطوة. والجمل تثبت أكثر حين تعود إليها في اليوم التالي.",
    lesson: (title, time) => `درسك التالي: «${title}»، ${time}.`,
    word: (word) => `كلمة «${word}» عثرت بها أمس. ستعود لك داخل الدرس لتثبّتها، فلا تتركها تُنسى.`,
    closing: "هذه الرسالة الوحيدة، أرسلناها لأنك طلبتها.",
    cta: "ابدأ الدرس الآن",
  },
  es: {
    subject: (title, time) =>
      title
        ? `«${title}» te espera: ${time} para afianzar lo de ayer`
        : `${time} para afianzar lo de ayer`,
    preview: (word) =>
      word
        ? `Y la palabra «${word}» que se te complicó vuelve en él`
        : "Lo que escribiste se queda si vuelves hoy",
    heading: "Tu próxima lección está lista",
    opening:
      "Ayer terminaste tu sesión, y ese es el paso más difícil. Las frases se quedan mejor cuando vuelves a ellas al día siguiente.",
    lesson: (title, time) => `Tu próxima lección: «${title}», ${time}.`,
    word: (word) =>
      `Ayer se te complicó la palabra «${word}». Vuelve dentro de la lección para que se te quede: no la dejes enfriar.`,
    closing: "Este es el único mensaje: lo enviamos porque lo pediste.",
    cta: "Empezar la lección ahora",
  },
  tr: {
    subject: (title, time) =>
      title
        ? `“${title}” sizi bekliyor: dünü pekiştirmek için ${time}`
        : `Dünü pekiştirmek için ${time}`,
    preview: (word) =>
      word
        ? `Takıldığınız “${word}” kelimesi de derste geri geliyor`
        : "Yazdıklarınız bugün dönerseniz kalıcı olur",
    heading: "Bir sonraki dersiniz hazır",
    opening:
      "Dün oturumunuzu tamamladınız, en zor adım buydu. Cümleler ertesi gün tekrar karşılaşınca daha iyi yerleşir.",
    lesson: (title, time) => `Bir sonraki dersiniz: “${title}”, ${time}.`,
    word: (word) =>
      `Dün “${word}” kelimesine takıldınız. Ders içinde geri geliyor, böylece kalıcı olur: unutulmasına izin vermeyin.`,
    closing: "Bu tek mesaj: siz istediğiniz için gönderdik.",
    cta: "Dersi şimdi başlat",
  },
  en: {
    subject: (title, time) =>
      title
        ? `“${title}” is waiting: ${time} to lock in what you typed yesterday`
        : `${time} to lock in what you typed yesterday`,
    preview: (word) =>
      word
        ? `And “${word}”, the word you stumbled on, comes back in it`
        : "Sentences stick when you come back today",
    heading: "Your next lesson is ready",
    opening:
      "You finished your session yesterday, and that is the hardest step. Sentences stick best when you come back to them the next day.",
    lesson: (title, time) => `Your next lesson: “${title}”, ${time}.`,
    word: (word) =>
      `You stumbled on “${word}” yesterday. It comes back inside the lesson so it finally sticks: don't let it fade.`,
    closing: "This is the only message: we sent it because you asked.",
    cta: "Start the lesson now",
  },
};

/** The first word of a display name ("Mohammed Ali Altaee" -> "Mohammed"), or null: a full name in a greeting reads like a form letter. */
export function firstName(displayName: string | null | undefined): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? first.slice(0, 40) : null;
}

export function personalReminderEmail(input: {
  origin: string;
  language: NudgeLanguage;
  displayName: string | null;
  reminder: PersonalReminder;
  /** The path the button opens: the lesson itself, or Home. */
  path: string;
  unsubscribe?: UnsubscribeLinks | null;
}): EmailContent {
  const { origin, language, reminder } = input;
  const c = EMAIL[language];
  const time = minutesLabel(language, reminder.minutes);
  return render(language, {
    subject: c.subject(reminder.title, time),
    preview: c.preview(reminder.word),
    heading: c.heading,
    paragraphs: [
      c.opening,
      ...(reminder.title ? [c.lesson(reminder.title, time)] : []),
      ...(reminder.word ? [c.word(reminder.word)] : []),
      c.closing,
    ],
    cta: c.cta,
    ctaUrl: `${origin}${input.path}`,
    settingsUrl: `${origin}/learn/settings`,
    displayName: firstName(input.displayName),
    unsubscribe: input.unsubscribe,
  });
}

/** Where a reminder opens: the lesson itself when it names one, Home otherwise. */
export function reminderPath(mode: string | null, id: string | null): string {
  if ((mode === "normal" || mode === "stories") && id && /^[\w-]{1,200}$/.test(id)) {
    return `/learn/${mode}/${id}`;
  }
  return "/learn";
}

/** A word worth naming in a message: letters only (a hyphen or apostrophe inside), 3 to 24 characters. */
export function nameableWord(word: string | null | undefined): string | null {
  const text = word?.trim().toLowerCase() ?? "";
  return /^[a-z][a-z'-]{1,22}[a-z]$/.test(text) ? text : null;
}
