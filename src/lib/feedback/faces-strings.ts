/**
 * The words of the five-faces rating (the faceRatings permission), kept here, like the word rounds'
 * and the video section's, so they ship without touching the shared dictionaries. The card's own
 * headline is the section's (the app's, Passages', a story's...), so only what is the same
 * everywhere lives in this file. English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface FacesStrings {
  /** Under the headline of every section's card (it never mentions stars). */
  subtitle: string;
  /** The five faces' names, from 5 stars (loved) down to 1 (hated). */
  labels: readonly [string, string, string, string, string];
  /** The optional comment box's prompt, by how the learner rated. */
  placeholderPositive: string;
  placeholderNeutral: string;
  placeholderNegative: string;
  send: string;
  notNow: string;
  thanks: string;
}

const AR: FacesStrings = {
  subtitle:
    "اختر الوجه الذي يعبّر عن رأيك، وأضف تعليقًا إن شئت. رأيك يساعدنا على تحسين التطبيق لك.",
  labels: ["أحبها", "تعجبني", "مقبولة", "لا تعجبني", "أكرهها"],
  placeholderPositive: "ما الذي أعجبك؟ (اختياري)",
  placeholderNeutral: "ما الذي يمكن أن يتحسن؟ (اختياري)",
  placeholderNegative: "ما الذي لم يعجبك؟ (اختياري)",
  send: "إرسال",
  notNow: "ليس الآن",
  thanks: "شكراً لك!",
};

const EN: FacesStrings = {
  subtitle:
    "Pick the face that fits, and add a comment if you like. What you say helps us make the app better for you.",
  labels: ["Love it", "Like it", "It's okay", "Don't like it", "Hate it"],
  placeholderPositive: "What did you like? (optional)",
  placeholderNeutral: "What could be better? (optional)",
  placeholderNegative: "What did you not like? (optional)",
  send: "Send",
  notNow: "Not now",
  thanks: "Thank you!",
};

const ES: FacesStrings = {
  subtitle:
    "Elige la cara que mejor te represente y añade un comentario si quieres. Lo que digas nos ayuda a mejorar la app para ti.",
  labels: ["Me encanta", "Me gusta", "Está bien", "No me gusta", "La odio"],
  placeholderPositive: "¿Qué te gustó? (opcional)",
  placeholderNeutral: "¿Qué podría mejorar? (opcional)",
  placeholderNegative: "¿Qué no te gustó? (opcional)",
  send: "Enviar",
  notNow: "Ahora no",
  thanks: "¡Gracias!",
};

const TR: FacesStrings = {
  subtitle:
    "Sana uyan yüzü seç, istersen bir yorum ekle. Söylediklerin uygulamayı senin için daha iyi yapmamıza yardım eder.",
  labels: ["Bayıldım", "Beğendim", "İdare eder", "Beğenmedim", "Nefret ettim"],
  placeholderPositive: "Neyi beğendin? (isteğe bağlı)",
  placeholderNeutral: "Ne daha iyi olabilir? (isteğe bağlı)",
  placeholderNegative: "Neyi beğenmedin? (isteğe bağlı)",
  send: "Gönder",
  notNow: "Şimdi değil",
  thanks: "Teşekkürler!",
};

const FACES_STRINGS: Record<SupportLocale, FacesStrings> = { ar: AR, es: ES, tr: TR };

export function facesStrings(locale: SupportLocale | null): FacesStrings {
  return locale ? FACES_STRINGS[locale] : EN;
}

/**
 * The name of one face for a screen reader, from the stars it stands for (5 loves it, 1 hates it):
 * the labels run from 5 down to 1.
 */
export function faceLabel(strings: FacesStrings, level: number): string {
  return strings.labels[5 - Math.min(5, Math.max(1, Math.round(level)))] ?? "";
}
