import type { PlanId } from "@/lib/billing/plans";
import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

/**
 * The nudge emails, written once per language the learner can have (profiles.preferred_language
 * is ar, es or tr; English is the fallback): a one-time "your next lesson is ready" a day after a
 * new learner went quiet, a weekly "your lesson is waiting" for a learner who has been away a few
 * days, and a short "your plan is one step away" for someone who opened checkout and did not pay
 * (never for a declined payment: those learners are written to personally).
 *
 * Everything in them is true on the day it is sent: the offer line is added only while an offer
 * runs (with that plan's own number of days), and there is no countdown, no scarcity and no promise
 * about refunds.
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

/** The reminder to someone who opened checkout and did not pay: short, about THEIR plan, in their language. */
interface Checkout {
  planLabel: Record<PlanId, string>;
  subjectOffer: (plan: string, days: number) => string;
  subjectPlain: (plan: string) => string;
  subjectGeneric: string;
  preview: string;
  heading: string;
  picked: (plan: string, price: string) => string;
  offerDays: (days: number) => string;
  offerGeneric: string;
  unlocked: string;
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

/** Arabic counts days differently from 3 to 10 ("أيام") and from 11 on ("يوماً"). */
function arabicDays(n: number): string {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومان";
  return n <= 10 ? `${n} أيام` : `${n} يوماً`;
}

const CHECKOUT: Record<NudgeLanguage, Checkout> = {
  ar: {
    planLabel: { "1m": "شهر واحد", "3m": "3 أشهر", "6m": "6 أشهر" },
    subjectOffer: (plan, days) => `${arabicDays(days)} هدية على باقة ${plan}`,
    subjectPlain: (plan) => `باقة ${plan} المميّزة على بُعد خطوة`,
    subjectGeneric: "اشتراكك المميّز على بُعد خطوة",
    preview: "دفعة واحدة، بدون تجديد تلقائي",
    heading: "باقي خطوة واحدة",
    picked: (plan, price) => `اخترت باقة ${plan} (${price}).`,
    offerDays: (days) => `الآن تأتيك معها ${arabicDays(days)} هدية، لفترة محدودة.`,
    offerGeneric: "الآن مع أي باقة أيام هدية إضافية، لفترة محدودة.",
    unlocked: "كل الدروس والقصص مفتوحة لك.",
    terms: "دفعة واحدة، بدون تجديد تلقائي.",
    cta: "أكمل في دقيقة",
  },
  es: {
    planLabel: { "1m": "1 mes", "3m": "3 meses", "6m": "6 meses" },
    subjectOffer: (plan, days) => `${days} días de regalo en tu plan de ${plan}`,
    subjectPlain: (plan) => `Tu plan Premium de ${plan} está a un paso`,
    subjectGeneric: "Tu Premium está a un paso",
    preview: "Un solo pago, sin renovación automática",
    heading: "Solo falta un paso",
    picked: (plan, price) => `Elegiste el plan de ${plan} (${price}).`,
    offerDays: (days) => `Ahora incluye ${days} días extra de regalo, por tiempo limitado.`,
    offerGeneric: "Ahora, con cualquier plan, tienes días de regalo extra, por tiempo limitado.",
    unlocked: "Todas las lecciones e historias, desbloqueadas.",
    terms: "Un solo pago, sin renovación automática.",
    cta: "Termínalo en un minuto",
  },
  tr: {
    planLabel: { "1m": "1 aylık", "3m": "3 aylık", "6m": "6 aylık" },
    subjectOffer: (plan, days) => `${plan} planınızda ${days} gün hediye`,
    subjectPlain: (plan) => `${plan} Premium planınız bir adım uzakta`,
    subjectGeneric: "Premium üyeliğiniz bir adım uzakta",
    preview: "Tek ödeme, otomatik yenileme yok",
    heading: "Tek bir adım kaldı",
    picked: (plan, price) => `${plan} planı seçtiniz (${price}).`,
    offerDays: (days) => `Şu anda ${days} gün ek hediye geliyor, sınırlı süreyle.`,
    offerGeneric: "Şu anda her pakette sınırlı süreyle ek hediye günler var.",
    unlocked: "Tüm dersler ve hikayeler açılır.",
    terms: "Tek ödeme, otomatik yenileme yok.",
    cta: "Bir dakikada tamamla",
  },
  en: {
    planLabel: { "1m": "1-month", "3m": "3-month", "6m": "6-month" },
    subjectOffer: (plan, days) => `${days} free days on your ${plan} plan`,
    subjectPlain: (plan) => `Your ${plan} Premium plan is one step away`,
    subjectGeneric: "Your Premium is one step away",
    preview: "One payment, no auto-renewal",
    heading: "One step left",
    picked: (plan, price) => `You picked the ${plan} plan (${price}).`,
    offerDays: (days) => `Right now it comes with ${days} extra days, free, for a limited time.`,
    offerGeneric: "Right now every plan comes with extra free days, for a limited time.",
    unlocked: "Every lesson and story, unlocked.",
    terms: "One payment, no auto-renewal.",
    cta: "Finish in a minute",
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
  /** The plan of the order they left (null when it cannot be told) and what it costs, in USD cents. */
  plan: PlanId | null;
  priceCents: number | null;
  /** The offer running right now on that plan: its number of days, or null days when there is no single number; null when no offer runs. */
  offer: { days: number | null } | null;
}

/** "Your plan is one step away": someone who opened checkout and did not pay. Short, about their own plan and price, and the gift days only while an offer really runs. */
export function abandonedCheckoutEmail({
  origin,
  displayName,
  language,
  unsubscribe,
  plan,
  priceCents,
  offer,
}: AbandonedCheckoutInput): EmailContent {
  const c = CHECKOUT[language];
  const planName = plan ? c.planLabel[plan] : null;
  const days = offer?.days && offer.days > 0 ? offer.days : null;
  const price =
    priceCents === null
      ? null
      : `$${priceCents % 100 === 0 ? priceCents / 100 : (priceCents / 100).toFixed(2)}`;
  const subject = !planName
    ? c.subjectGeneric
    : days
      ? c.subjectOffer(planName, days)
      : c.subjectPlain(planName);
  return render(language, {
    subject,
    preview: c.preview,
    heading: c.heading,
    paragraphs: [
      ...(planName && price ? [c.picked(planName, price)] : []),
      offer ? (days ? c.offerDays(days) : c.offerGeneric) : c.unlocked,
      c.terms,
    ],
    cta: c.cta,
    ctaUrl: `${origin}/upgrade`,
    settingsUrl: `${origin}/learn/settings`,
    displayName,
    unsubscribe,
  });
}
