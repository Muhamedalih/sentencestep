import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The lines of «What happens next?» that stand under its English headlines, in the learner's own
 * language (an English interface shows the English ones in their place).
 */
export interface GuessStrings {
  /** The end screen's button, before and after the guess is sealed. */
  boxGuess: string;
  boxSealed: string;
  write: string;
  switchKeyboard: string;
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
    switchKeyboard: "Switch your keyboard to English",
    write: "Write your guess on the letter, one letter at a time",
    sealedTomorrow: "Your guess is sealed. Nobody opens it before tomorrow.",
    sealedNext: "Your guess is sealed. The next episode opens it.",
    opensIn: "The book opens in",
    teaserTomorrow: "A line from tomorrow's episode",
    teaserNext: "A line from the next episode",
    pull: "Pull the bell",
    remindShort: (h) => `Reminder ${h} PM`,
    reminded: (h, subject) => `Done. Tomorrow at ${h} PM an email reaches you: “${subject}”`,
    unverified: "Email reminders work with Google accounts only.",
    failed: "The reminder could not be saved. Pull the bell again.",
    openNow: "The next episode is open",
    continue: "Continue",
    backToList: "Back to all passages",
    youWrote: "You wrote",
    youWroteYesterday: "Yesterday you wrote",
    continueEpisode: "Continue the episode",
    knew: "You knew it!",
    fooled: "The story fooled you this time.",
  },
  ar: {
    boxGuess: "خمّن ماذا سيحدث",
    boxSealed: "تخمينك مختوم",
    switchKeyboard: "بدّل لوحة المفاتيح إلى الإنجليزية",
    write: "اكتب تخمينك على الرسالة، حرفاً حرفاً",
    sealedTomorrow: "ختمنا تخمينك. لا أحد يفتحه قبل الغد.",
    sealedNext: "ختمنا تخمينك. تفتحه الحلقة التالية.",
    opensIn: "ينفتح الكتاب بعد",
    teaserTomorrow: "سطر من حلقة الغد",
    teaserNext: "سطر من الحلقة التالية",
    pull: "اسحب الجرس",
    remindShort: (h) => `التذكير ${h} م`,
    reminded: (h, subject) => `🔔 تمام. غداً الساعة ${h} مساءً يصلك إيميل: «${subject}»`,
    unverified: "تذكير الإيميل يعمل مع حسابات Google فقط.",
    failed: "لم يُحفظ التذكير. اسحب الجرس مرة ثانية.",
    openNow: "الحلقة التالية مفتوحة",
    continue: "أكمل",
    backToList: "العودة إلى كل الفقرات",
    youWrote: "كتبتَ",
    youWroteYesterday: "أمس كتبتَ",
    continueEpisode: "أكمل الحلقة",
    knew: "كنتَ تعرف!",
    fooled: "القصة خدعتك هذه المرة.",
  },
  es: {
    boxGuess: "Adivina qué pasa",
    boxSealed: "Tu respuesta está sellada",
    switchKeyboard: "Cambia el teclado a inglés",
    write: "Escribe tu respuesta en la carta, letra a letra",
    sealedTomorrow: "Tu respuesta está sellada. Nadie la abre antes de mañana.",
    sealedNext: "Tu respuesta está sellada. La abre el próximo episodio.",
    opensIn: "El libro se abre en",
    teaserTomorrow: "Una línea del episodio de mañana",
    teaserNext: "Una línea del próximo episodio",
    pull: "Tira de la campana",
    remindShort: (h) => `Aviso a las ${h} PM`,
    reminded: (h, subject) => `Listo. Mañana a las ${h} PM te llega un correo: «${subject}»`,
    unverified: "Los avisos por correo funcionan solo con cuentas de Google.",
    failed: "No se pudo guardar el aviso. Tira otra vez.",
    openNow: "El próximo episodio está abierto",
    continue: "Continuar",
    backToList: "Volver a todos los textos",
    youWrote: "Escribiste",
    youWroteYesterday: "Ayer escribiste",
    continueEpisode: "Sigue el episodio",
    knew: "¡Lo sabías!",
    fooled: "Esta vez la historia te engañó.",
  },
  tr: {
    boxGuess: "Ne olacağını tahmin et",
    boxSealed: "Tahminin mühürlendi",
    switchKeyboard: "Klavyeni İngilizceye geçir",
    write: "Tahminini mektuba harf harf yaz",
    sealedTomorrow: "Tahminin mühürlendi. Yarından önce kimse açamaz.",
    sealedNext: "Tahminin mühürlendi. Onu sonraki bölüm açacak.",
    opensIn: "Kitap şu süre sonra açılır",
    teaserTomorrow: "Yarınki bölümden bir satır",
    teaserNext: "Sonraki bölümden bir satır",
    pull: "Zili çek",
    remindShort: (h) => `Hatırlatma ${h} PM`,
    reminded: (h, subject) => `Tamam. Yarın saat ${h} PM'de bir e-posta gelecek: “${subject}”`,
    unverified: "E-posta hatırlatması yalnızca Google hesaplarında çalışır.",
    failed: "Hatırlatma kaydedilemedi. Zili tekrar çek.",
    openNow: "Sonraki bölüm açık",
    continue: "Devam",
    backToList: "Tüm metinlere dön",
    youWrote: "Yazdığın",
    youWroteYesterday: "Dün yazdığın",
    continueEpisode: "Bölüme devam et",
    knew: "Bildin!",
    fooled: "Bu kez hikâye seni şaşırttı.",
  },
};

export function guessStrings(locale: SupportLocale | null | undefined): GuessStrings {
  return STRINGS[locale ?? "en"];
}
