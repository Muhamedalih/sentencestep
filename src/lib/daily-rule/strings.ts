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
  continueWords: string;
  buttonTitle: string;
  buttonHint: string;
  recallOnly: string;
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
    heldLine: "تمسك {n} من {total} قواعد في A1",
    continueWords: "متابعة إلى الكلمات",
    buttonTitle: "قاعدة اليوم من هذه القصة",
    buttonHint: "دقيقة ونصف تقريباً، اختيارية",
    recallOnly: "سؤال من قواعدك السابقة",
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
    heldLine: "Dominas {n} de {total} reglas de A1",
    continueWords: "Seguir con las palabras",
    buttonTitle: "Regla del día de esta historia",
    buttonHint: "Un minuto y medio, opcional",
    recallOnly: "Pregunta de tus reglas anteriores",
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
    heldLine: "A1'de {total} kuraldan {n} tanesine hâkimsin",
    continueWords: "Kelimelere geç",
    buttonTitle: "Bu hikâyeden günün kuralı",
    buttonHint: "Yaklaşık bir buçuk dakika, isteğe bağlı",
    recallOnly: "Önceki kurallarından bir soru",
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
