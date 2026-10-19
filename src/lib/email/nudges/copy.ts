import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

/**
 * The nudge emails, written once per language the learner can have (profiles.preferred_language
 * is ar, es or tr; English is the fallback): a one-time "your next lesson is ready" a day after a
 * new learner went quiet, a weekly "your lesson is waiting" for a learner who has been away a few
 * days, and a one-time "did something go wrong with your payment?" after an order that was started
 * and never finished.
 *
 * Everything in them is true on the day it is sent: the offer line is added only while an offer
 * runs, the Binance Pay line only while Binance Pay is offered, the reply line only when a reply
 * address is configured, and there is no countdown, no scarcity and no promise about refunds.
 * Dynamic values are escaped here; the text version is the same words without markup.
 */
export type NudgeLanguage = "ar" | "es" | "tr" | "en";

export function nudgeLanguage(value: string | null | undefined): NudgeLanguage {
  return value === "ar" || value === "es" || value === "tr" ? value : "en";
}

interface Common {
  greeting: (name: string | null) => string;
  footerText: string;
  footerLink: string;
  /** The footer link when the email carries a one-click unsubscribe link. */
  unsubscribeLink: string;
}

interface Reminder {
  subject: string;
  preview: string;
  heading: string;
  body: string;
  offer: string;
  offerLink: string;
  cta: string;
}

/** The signed one-click unsubscribe link of one learner and the headers that go with it (see unsubscribe-token.ts). */
export interface UnsubscribeLinks {
  pageUrl: string;
  headers: Record<string, string>;
}

interface DayOne {
  subject: string;
  preview: string;
  heading: string;
  body: string;
  cta: string;
}

interface Abandoned {
  subject: string;
  preview: string;
  heading: string;
  started: string;
  /** What to do if the payment did not work: with Binance Pay, with a reply address, both or neither. */
  helpBoth: string;
  helpBinance: string;
  helpReply: string;
  helpNone: string;
  offer: string;
  terms: string;
  cta: string;
}

const COMMON: Record<NudgeLanguage, Common> = {
  ar: {
    greeting: (name) => (name ? `أهلاً ${name}،` : "أهلاً،"),
    footerText: "وصلتك هذه الرسالة لأن لديك حساباً في SentenceStep.",
    footerLink: "إدارة تفضيلات البريد",
    unsubscribeLink: "إلغاء الاشتراك من هذه الرسائل",
  },
  es: {
    greeting: (name) => (name ? `Hola ${name},` : "Hola,"),
    footerText: "Recibes este mensaje porque tienes una cuenta de SentenceStep.",
    footerLink: "Gestionar preferencias de correo",
    unsubscribeLink: "Darme de baja de estos mensajes",
  },
  tr: {
    greeting: (name) => (name ? `Merhaba ${name},` : "Merhaba,"),
    footerText: "Bu iletiyi SentenceStep hesabınız olduğu için alıyorsunuz.",
    footerLink: "E-posta tercihlerini yönet",
    unsubscribeLink: "Bu iletilerden çık",
  },
  en: {
    greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
    footerText: "You're receiving this because of your SentenceStep account.",
    footerLink: "Manage email preferences",
    unsubscribeLink: "Unsubscribe from these emails",
  },
};

const DAY_ONE: Record<NudgeLanguage, DayOne> = {
  ar: {
    subject: "درسك التالي بانتظارك في SentenceStep",
    preview: "بضع دقائق اليوم تكفي لتكمل من حيث وقفت",
    heading: "درسك التالي جاهز",
    body: "بدأت تتعلم الإنجليزية معنا، ودرسك التالي جاهز. بضع دقائق اليوم تكفي لتكمل من حيث وقفت، وتقدّمك محفوظ.",
    cta: "كمّل درسك",
  },
  es: {
    subject: "Tu próxima lección de SentenceStep está lista",
    preview: "Con unos minutos hoy basta para seguir donde lo dejaste",
    heading: "Tu próxima lección está lista",
    body: "Empezaste a aprender inglés con nosotros y tu próxima lección te espera. Con unos minutos hoy basta para seguir donde lo dejaste, y tu progreso está guardado.",
    cta: "Continúa tu lección",
  },
  tr: {
    subject: "SentenceStep'te bir sonraki dersiniz hazır",
    preview: "Bugün birkaç dakika, kaldığınız yerden devam etmeye yeter",
    heading: "Bir sonraki dersiniz hazır",
    body: "Bizimle İngilizce öğrenmeye başladınız ve bir sonraki dersiniz hazır. Bugün birkaç dakika, kaldığınız yerden devam etmeye yeter; ilerlemeniz kayıtlı.",
    cta: "Derse devam edin",
  },
  en: {
    subject: "Your next SentenceStep lesson is ready",
    preview: "A few minutes today is enough to pick up where you left off",
    heading: "Your next lesson is ready",
    body: "You started learning English with us, and your next lesson is ready. A few minutes today is enough to pick up where you left off, and your progress is saved.",
    cta: "Continue your lesson",
  },
};

const REMINDER: Record<NudgeLanguage, Reminder> = {
  ar: {
    subject: "اشتقنا لك! درس اليوم ينتظرك",
    preview: "دقائق قليلة تكفي لتبقى إنجليزيتك تتقدّم",
    heading: "حان وقت درس اليوم",
    body: "مرّت أيام منذ آخر درس لك. دقائق قليلة اليوم تكفي لتكمل من حيث وقفت، وتقدّمك محفوظ.",
    offer: "وفي هذه الفترة عندنا أيام هدية إضافية مع أي باقة، لفترة محدودة.",
    offerLink: "شاهد العرض",
    cta: "كمّل درسك",
  },
  es: {
    subject: "Tu lección de hoy te está esperando",
    preview: "Unos minutos bastan para seguir avanzando en inglés",
    heading: "Es hora de tu lección de hoy",
    body: "Hace unos días que no practicas. Con unos minutos hoy puedes seguir donde lo dejaste, y tu progreso está guardado.",
    offer: "Además, ahora hay días de regalo extra con cualquier plan, por tiempo limitado.",
    offerLink: "Ver la oferta",
    cta: "Continúa tu lección",
  },
  tr: {
    subject: "Bugünkü dersiniz sizi bekliyor",
    preview: "Birkaç dakika İngilizcenizi ilerletmeye yeter",
    heading: "Bugünkü ders zamanı",
    body: "Birkaç gündür çalışmadınız. Bugün birkaç dakika, kaldığınız yerden devam etmeye yeter; ilerlemeniz kayıtlı.",
    offer: "Ayrıca şu anda her pakette sınırlı süreyle ek hediye günler var.",
    offerLink: "Teklifi gör",
    cta: "Derse devam edin",
  },
  en: {
    subject: "Your lesson for today is waiting",
    preview: "A few minutes is enough to keep your English moving",
    heading: "Time for today's lesson",
    body: "It's been a few days since your last lesson. A few minutes today is enough to pick up where you left off, and your progress is saved.",
    offer: "Right now every plan also comes with extra free days, for a limited time.",
    offerLink: "See the offer",
    cta: "Continue your lesson",
  },
};

const ABANDONED: Record<NudgeLanguage, Abandoned> = {
  ar: {
    subject: "هل واجهت مشكلة في الدفع؟",
    preview: "نقدر نساعدك تكمل الاشتراك",
    heading: "هل واجهت مشكلة في الدفع؟",
    started: "بدأت الاشتراك في المميّز لكنه لم يكتمل.",
    helpBoth: "إذا لم تنجح البطاقة، جرّب Binance Pay، أو ردّ على هذه الرسالة ونساعدك.",
    helpBinance: "إذا لم تنجح البطاقة، جرّب Binance Pay.",
    helpReply: "إذا واجهتك مشكلة، ردّ على هذه الرسالة ونساعدك.",
    helpNone: "تقدر تحاول مرة ثانية متى شئت.",
    offer: "ومع أي باقة الآن أيام هدية إضافية، لفترة محدودة.",
    terms: "الدفع مرة واحدة، بدون تجديد تلقائي.",
    cta: "أكمل الاشتراك",
  },
  es: {
    subject: "¿Tuviste algún problema con el pago?",
    preview: "Podemos ayudarte a completar la suscripción",
    heading: "¿Tuviste algún problema con el pago?",
    started: "Empezaste tu suscripción a Premium, pero no se completó.",
    helpBoth:
      "Si la tarjeta no funcionó, prueba con Binance Pay o responde a este mensaje y te ayudamos.",
    helpBinance: "Si la tarjeta no funcionó, prueba con Binance Pay.",
    helpReply: "Si tuviste algún problema, responde a este mensaje y te ayudamos.",
    helpNone: "Puedes intentarlo de nuevo cuando quieras.",
    offer: "Ahora, con cualquier plan, tienes días de regalo extra, por tiempo limitado.",
    terms: "Un solo pago, sin renovación automática.",
    cta: "Completar la suscripción",
  },
  tr: {
    subject: "Ödemede bir sorun mu yaşadınız?",
    preview: "Aboneliği tamamlamanıza yardımcı olabiliriz",
    heading: "Ödemede bir sorun mu yaşadınız?",
    started: "Premium aboneliğini başlattınız ama tamamlanmadı.",
    helpBoth:
      "Kart çalışmadıysa Binance Pay'i deneyin ya da bu iletiye yanıt verin, size yardımcı olalım.",
    helpBinance: "Kart çalışmadıysa Binance Pay'i deneyin.",
    helpReply: "Bir sorun yaşadıysanız bu iletiye yanıt verin, size yardımcı olalım.",
    helpNone: "İstediğiniz zaman yeniden deneyebilirsiniz.",
    offer: "Şu anda her pakette sınırlı süreyle ek hediye günler var.",
    terms: "Tek ödeme, otomatik yenileme yok.",
    cta: "Aboneliği tamamla",
  },
  en: {
    subject: "Did something go wrong with your payment?",
    preview: "We can help you finish subscribing",
    heading: "Did something go wrong with your payment?",
    started: "You started a Premium subscription, but it didn't finish.",
    helpBoth: "If your card didn't work, try Binance Pay, or reply to this email and we'll help.",
    helpBinance: "If your card didn't work, try Binance Pay.",
    helpReply: "If something went wrong, reply to this email and we'll help.",
    helpNone: "You can try again whenever you like.",
    offer: "Right now every plan comes with extra free days, for a limited time.",
    terms: "One payment, no auto-renewal.",
    cta: "Finish subscribing",
  },
};

/** A paragraph of plain text, optionally ending in a link (the offer line points at the upgrade page). */
type Paragraph = string | { text: string; linkLabel: string; linkUrl: string };

function render(
  language: NudgeLanguage,
  parts: {
    subject: string;
    preview: string;
    heading: string;
    paragraphs: Paragraph[];
    cta: string;
    ctaUrl: string;
    settingsUrl: string;
    displayName: string | null;
    unsubscribe?: UnsubscribeLinks | null;
  },
): EmailContent {
  const common = COMMON[language];
  const greeting = common.greeting(parts.displayName);
  const footerUrl = parts.unsubscribe?.pageUrl ?? parts.settingsUrl;
  const footerLabel = parts.unsubscribe ? common.unsubscribeLink : common.footerLink;
  const paragraphHtml = (p: Paragraph): string =>
    typeof p === "string"
      ? escapeHtml(p)
      : `${escapeHtml(p.text)} <a href="${escapeHtml(p.linkUrl)}" style="color:#5b45e0;">${escapeHtml(p.linkLabel)}</a>`;
  const paragraphText = (p: Paragraph): string =>
    typeof p === "string" ? p : `${p.text} ${p.linkUrl}`;
  const bodyHtml = [escapeHtml(greeting), ...parts.paragraphs.map(paragraphHtml)]
    .map((html, index) => `<p style="margin:0 0 ${index === 0 ? 12 : 10}px 0;">${html}</p>`)
    .join("\n    ");
  return {
    subject: parts.subject,
    html: renderEmailLayout({
      previewText: parts.preview,
      heading: parts.heading,
      bodyHtml,
      ctaLabel: parts.cta,
      ctaUrl: parts.ctaUrl,
      unsubscribeUrl: footerUrl,
      lang: language,
      preferences: { text: common.footerText, linkLabel: footerLabel },
    }),
    text: [
      greeting,
      "",
      ...parts.paragraphs.flatMap((line) => [paragraphText(line), ""]),
      `${parts.cta}: ${parts.ctaUrl}`,
      "",
      `${common.footerText} ${footerLabel}: ${footerUrl}`,
    ].join("\n"),
    ...(parts.unsubscribe ? { headers: parts.unsubscribe.headers } : {}),
  };
}

export interface NudgeEmailInput {
  origin: string;
  displayName: string | null;
  language: NudgeLanguage;
  /** The learner's one-click unsubscribe link; without it the footer links to the email settings. */
  unsubscribe?: UnsubscribeLinks | null;
}

/** "Your next lesson is ready": a new learner who did a lesson, then went quiet for about a day. */
export function dayOneNudgeEmail({
  origin,
  displayName,
  language,
  unsubscribe,
}: NudgeEmailInput): EmailContent {
  const c = DAY_ONE[language];
  return render(language, {
    subject: c.subject,
    preview: c.preview,
    heading: c.heading,
    paragraphs: [c.body],
    cta: c.cta,
    ctaUrl: `${origin}/learn`,
    settingsUrl: `${origin}/learn/settings`,
    displayName,
    unsubscribe,
  });
}

export interface ReminderInput extends NudgeEmailInput {
  /** Whether a launch offer is running right now AND this learner has not opted out of offers. */
  showOffer: boolean;
}

/** "Your lesson is waiting": a learner who has been quiet for a few days. The offer line is added only while an offer runs. */
export function reminderEmail({
  origin,
  displayName,
  language,
  unsubscribe,
  showOffer,
}: ReminderInput): EmailContent {
  const c = REMINDER[language];
  return render(language, {
    subject: c.subject,
    preview: c.preview,
    heading: c.heading,
    paragraphs: [
      c.body,
      ...(showOffer
        ? [{ text: c.offer, linkLabel: c.offerLink, linkUrl: `${origin}/upgrade` }]
        : []),
    ],
    cta: c.cta,
    ctaUrl: `${origin}/learn`,
    settingsUrl: `${origin}/learn/settings`,
    displayName,
    unsubscribe,
  });
}

export interface AbandonedCheckoutInput extends NudgeEmailInput {
  /** Whether Binance Pay is offered to everyone right now. */
  binancePay: boolean;
  /** Whether a launch offer is running right now. */
  offerRunning: boolean;
  /** Whether a reply address is configured, i.e. whether "reply to this email" is true. */
  canReply: boolean;
}

/** "Did something go wrong with your payment?": an order that was started and never finished. */
export function abandonedCheckoutEmail({
  origin,
  displayName,
  language,
  binancePay,
  offerRunning,
  canReply,
  unsubscribe,
}: AbandonedCheckoutInput): EmailContent {
  const c = ABANDONED[language];
  const help =
    binancePay && canReply
      ? c.helpBoth
      : binancePay
        ? c.helpBinance
        : canReply
          ? c.helpReply
          : c.helpNone;
  return render(language, {
    subject: c.subject,
    preview: c.preview,
    heading: c.heading,
    paragraphs: [c.started, help, ...(offerRunning ? [c.offer] : []), c.terms],
    cta: c.cta,
    ctaUrl: `${origin}/upgrade`,
    settingsUrl: `${origin}/learn/settings`,
    displayName,
    unsubscribe,
  });
}
