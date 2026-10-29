/**
 * The words the rule card shows, in the three languages the site offers (Arabic, Spanish, Turkish).
 * The rules themselves are English and do not change; only the labels, the feedback and the Arabic
 * gloss do. Kept in this folder so the rule can ship without touching the shared dictionaries.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { Diagnosis } from "./tokens";

export interface RuleStrings {
  title: string;
  yesterday: string;
  interleave: string;
  review: string;
  fromStory: string;
  writeMissing: string;
  hint: string;
  check: string;
  skip: string;
  next: string;
  listen: string;
  noticeTitle: string;
  ruleTitle: string;
  exception: string;
  useTitle: string;
  correct: string;
  tryAgain: string;
  /** What is wrong with a typed answer, by diagnosis. */
  diagnosis: Record<Exclude<Diagnosis, "correct">, string>;
  answerWas: string;
  doneTitle: string;
  doneSub: string;
  /** "{n}" held out of "{total}" rules on the ladder. */
  heldLine: string;
  /** The row on Home for a learner whose rule of the day is answered today. */
  doneToday: string;
  continueWords: string;
  buttonHint: string;
  /** The label above the rule's row on Home: the rule closes the day, after the words step. */
  endDay: string;
  /** The row's button, shown once the day's three tasks are done. */
  startRule: string;
  recallOnly: string;
  /** The label above the two sentences of the learner's own story on the rule's first page. */
  fromYourStory: string;
  /** The button on the last page of the rule's card: it starts the typed sentences. */
  startPractice: string;
  /** Back from the exceptions page to the first. */
  back: string;
  /** The heading of the second page: what to watch for. */
  watchOut: string;
  /** The label of a note on the second page that is more to know, not an exception (see "exception"). */
  detail: string;
  /** What a screen reader says of the right and the wrong sentence of the card. */
  rightSentence: string;
  wrongSentence: string;
}

export const RULE_STRINGS: Record<SupportLocale, RuleStrings> = {
  ar: {
    title: "قاعدة اليوم",
    yesterday: "من الأمس",
    interleave: "قاعدة قديمة",
    review: "مراجعة",
    fromStory: "من هذه القصة",
    writeMissing: "اكتب الكلمة الناقصة",
    hint: "تلميح: الحرف الأول",
    check: "تأكيد",
    skip: "تخطَّ",
    next: "متابعة",
    listen: "استمع",
    noticeTitle: "لاحظ الصيغة في قصتك",
    ruleTitle: "القاعدة",
    exception: "استثناء",
    useTitle: "استعمل القاعدة",
    correct: "صحيح",
    tryAgain: "حاول مرة أخرى",
    diagnosis: {
      "missing-s": "تنقصك النهاية -s",
      "missing-ed": "تنقصك النهاية -ed",
      "extra-s": "لا تحتاج هنا إلى -s",
      "a-an": "انتبه: a أو an حسب الصوت الذي بعدها",
      other: "ليست الصيغة الصحيحة",
    },
    answerWas: "الإجابة الصحيحة:",
    doneTitle: "القاعدة في قائمتك",
    doneSub: "ستظهر غداً أول شيء",
    heldLine: "تمسك {n} من {total} قواعد في {level}",
    doneToday: "تم اليوم",
    continueWords: "متابعة إلى الكلمات",
    buttonHint: "دقيقة ونصف تقريباً، اختيارية",
    endDay: "اختم اليوم بالقواعد",
    startRule: "ابدأ القاعدة",
    recallOnly: "سؤال من قواعدك السابقة",
    fromYourStory: "من قصتك",
    startPractice: "ابدأ التمرين",
    back: "رجوع",
    watchOut: "انتبه",
    detail: "تفصيل",
    rightSentence: "جملة صحيحة",
    wrongSentence: "جملة خاطئة",
  },
  es: {
    title: "Regla del día",
    yesterday: "De ayer",
    interleave: "Regla anterior",
    review: "Repaso",
    fromStory: "De esta historia",
    writeMissing: "Escribe la palabra que falta",
    hint: "Pista: primera letra",
    check: "Comprobar",
    skip: "Omitir",
    next: "Continuar",
    listen: "Escuchar",
    noticeTitle: "Fíjate en esta forma en tu historia",
    ruleTitle: "La regla",
    exception: "Excepción",
    useTitle: "Usa la regla",
    correct: "Correcto",
    tryAgain: "Inténtalo otra vez",
    diagnosis: {
      "missing-s": "Falta la terminación -s",
      "missing-ed": "Falta la terminación -ed",
      "extra-s": "Aquí no lleva -s",
      "a-an": "Revisa a o an según el sonido siguiente",
      other: "No es la forma correcta",
    },
    answerWas: "La respuesta correcta:",
    doneTitle: "La regla está en tu lista",
    doneSub: "Volverá mañana, lo primero",
    heldLine: "Dominas {n} de {total} reglas de {level}",
    doneToday: "Hecho hoy",
    continueWords: "Seguir con las palabras",
    buttonHint: "Un minuto y medio, opcional",
    endDay: "Termina el día con las reglas",
    startRule: "Empieza la regla",
    recallOnly: "Pregunta de tus reglas anteriores",
    fromYourStory: "De tu historia",
    startPractice: "Empezar el ejercicio",
    back: "Atrás",
    watchOut: "Ojo",
    detail: "Detalle",
    rightSentence: "Frase correcta",
    wrongSentence: "Frase incorrecta",
  },
  tr: {
    title: "Günün kuralı",
    yesterday: "Dünden",
    interleave: "Önceki kural",
    review: "Tekrar",
    fromStory: "Bu hikâyeden",
    writeMissing: "Eksik kelimeyi yaz",
    hint: "İpucu: ilk harf",
    check: "Kontrol et",
    skip: "Atla",
    next: "Devam",
    listen: "Dinle",
    noticeTitle: "Hikâyendeki bu biçime dikkat et",
    ruleTitle: "Kural",
    exception: "İstisna",
    useTitle: "Kuralı kullan",
    correct: "Doğru",
    tryAgain: "Bir kez daha dene",
    diagnosis: {
      "missing-s": "-s eki eksik",
      "missing-ed": "-ed eki eksik",
      "extra-s": "Burada -s gerekmez",
      "a-an": "a mı an mı, sonraki sese göre seçilir",
      other: "Doğru biçim değil",
    },
    answerWas: "Doğru cevap:",
    doneTitle: "Kural listende",
    doneSub: "Yarın ilk iş karşına çıkacak",
    heldLine: "{level}'de {total} kuraldan {n} tanesine hâkimsin",
    doneToday: "Bugün tamam",
    continueWords: "Kelimelere geç",
    buttonHint: "Yaklaşık bir buçuk dakika, isteğe bağlı",
    endDay: "Günü kurallarla bitir",
    startRule: "Kurala başla",
    recallOnly: "Önceki kurallarından bir soru",
    fromYourStory: "Hikâyenden",
    startPractice: "Alıştırmaya başla",
    back: "Geri",
    watchOut: "Dikkat",
    detail: "Ayrıntı",
    rightSentence: "Doğru cümle",
    wrongSentence: "Yanlış cümle",
  },
};

/** The strings for a locale; Arabic when the locale is not set yet. */
export function ruleStrings(locale: SupportLocale | null): RuleStrings {
  return RULE_STRINGS[locale ?? "ar"];
}

/** Fills the {n} and {total} placeholders of a line. */
export function fill(line: string, values: Record<string, string | number>): string {
  return line.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
