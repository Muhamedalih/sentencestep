import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The lines of «What happens next?» that stand under its English headlines, in the learner's own
 * language (an English interface shows the English ones in their place).
 */
export interface GuessStrings {
  /** The end screen's button, before and after the guess is sealed. */
  boxGuess: string;
  boxSealed: string;
  sealedTomorrow: string;
  sealedNext: string;
  opensIn: string;
  teaserTomorrow: string;
  teaserNext: string;
  pull: string;
  remindShort: (hour: number) => string;
  reminded: (hour: number, subject: string) => string;
  unverified: string;
  failed: string;
  openNow: string;
  continue: string;
  backToList: string;
  youWrote: string;
  youWroteYesterday: string;
  continueEpisode: string;
  knew: string;
  fooled: string;
}

const STRINGS: Record<"en" | SupportLocale, GuessStrings> = {
  en: {
    boxGuess: "Guess what happens",
    boxSealed: "Your guess is sealed",
    sealedTomorrow: "Your guess is sealed. Nobody opens it before tomorrow.",
    sealedNext: "Your guess is sealed. The next episode opens it.",
    opensIn: "The book opens in",
    teaserTomorrow: "A line from tomorrow's episode",
    teaserNext: "A line from the next episode",
    pull: "Press the bell",
    remindShort: (h) => `Reminder ${h} PM`,
    reminded: (h, subject) => `Done. Tomorrow at ${h} PM an email reaches you: “${subject}”`,
    unverified: "Email reminders work with Google accounts only.",
    failed: "The reminder could not be saved. Press the bell again.",
    openNow: "The next episode is open",
    continue: "Continue",
    backToList: "Back to all passages",
    youWrote: "You picked",
    youWroteYesterday: "Yesterday you picked",
    continueEpisode: "Continue the episode",
    knew: "You knew it!",
    fooled: "The story fooled you this time.",
  },
  ar: {
    boxGuess: "خمّن ماذا سيحدث",
    boxSealed: "تخمينك مختوم",
    sealedTomorrow: "ختمنا تخمينك. لا أحد يفتحه قبل الغد.",
    sealedNext: "ختمنا تخمينك. تفتحه الحلقة التالية.",
    opensIn: "ينفتح الكتاب بعد",
    teaserTomorrow: "سطر من حلقة الغد",
    teaserNext: "سطر من الحلقة التالية",
    pull: "اضغط على الجرس",
    remindShort: (h) => `التذكير ${h} م`,
    reminded: (h, subject) => `🔔 تمام. غداً الساعة ${h} مساءً يصلك إيميل: «${subject}»`,
    unverified: "تذكير الإيميل يعمل مع حسابات Google فقط.",
    failed: "لم يُحفظ التذكير. اضغط على الجرس مرة ثانية.",
    openNow: "الحلقة التالية مفتوحة",
    continue: "أكمل",
    backToList: "العودة إلى كل الفقرات",
    youWrote: "اخترتَ",
    youWroteYesterday: "أمس اخترتَ",
    continueEpisode: "أكمل الحلقة",
    knew: "كنتَ تعرف!",
    fooled: "القصة خدعتك هذه المرة.",
  },
  es: {
    boxGuess: "Adivina qué pasa",
    boxSealed: "Tu respuesta está sellada",
    sealedTomorrow: "Tu respuesta está sellada. Nadie la abre antes de mañana.",
    sealedNext: "Tu respuesta está sellada. La abre el próximo episodio.",
    opensIn: "El libro se abre en",
    teaserTomorrow: "Una línea del episodio de mañana",
    teaserNext: "Una línea del próximo episodio",
    pull: "Toca la campana",
    remindShort: (h) => `Aviso a las ${h} PM`,
    reminded: (h, subject) => `Listo. Mañana a las ${h} PM te llega un correo: «${subject}»`,
    unverified: "Los avisos por correo funcionan solo con cuentas de Google.",
    failed: "No se pudo guardar el aviso. Toca otra vez.",
    openNow: "El próximo episodio está abierto",
    continue: "Continuar",
    backToList: "Volver a todos los textos",
    youWrote: "Elegiste",
    youWroteYesterday: "Ayer elegiste",
    continueEpisode: "Sigue el episodio",
    knew: "¡Lo sabías!",
    fooled: "Esta vez la historia te engañó.",
  },
  tr: {
    boxGuess: "Ne olacağını tahmin et",
    boxSealed: "Tahminin mühürlendi",
    sealedTomorrow: "Tahminin mühürlendi. Yarından önce kimse açamaz.",
    sealedNext: "Tahminin mühürlendi. Onu sonraki bölüm açacak.",
    opensIn: "Kitap şu süre sonra açılır",
    teaserTomorrow: "Yarınki bölümden bir satır",
    teaserNext: "Sonraki bölümden bir satır",
    pull: "Zile bas",
    remindShort: (h) => `Hatırlatma ${h} PM`,
    reminded: (h, subject) => `Tamam. Yarın saat ${h} PM'de bir e-posta gelecek: “${subject}”`,
    unverified: "E-posta hatırlatması yalnızca Google hesaplarında çalışır.",
    failed: "Hatırlatma kaydedilemedi. Zile tekrar bas.",
    openNow: "Sonraki bölüm açık",
    continue: "Devam",
    backToList: "Tüm metinlere dön",
    youWrote: "Seçtiğin",
    youWroteYesterday: "Dün seçtiğin",
    continueEpisode: "Bölüme devam et",
    knew: "Bildin!",
    fooled: "Bu kez hikâye seni şaşırttı.",
  },
};

export function guessStrings(locale: SupportLocale | null | undefined): GuessStrings {
  return STRINGS[locale ?? "en"];
}
