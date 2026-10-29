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
  /** The label of a note on the second page about a slip that is easy to make (the rule differs from the learner's own language). */
  mistake: string;
  /** The label above the rule's prepared example sentences on its first page (the sentences of the learner's story have «fromYourStory»). */
  examples: string;
  /** A rule's place on its level, above its name: "{n}" of "{total}". */
  ruleNumber: string;
  /** What a screen reader says of the right and the wrong sentence of the card. */
  rightSentence: string;
  wrongSentence: string;
  /** The rule library: its name in the menu, on its page and on the way back to it. */
  myRules: string;
  /** The small button on Home's rule row: the library with the number of rules in it ({n}). */
  myRulesPill: string;
  /** The library's count: {n} of the {total} rules of the learner's level ({level}). */
  libraryLevel: string;
  /** The library's first group: the rules whose day has come. */
  dueSection: string;
  /** The tag of the rule that opens next on the library's map. */
  statusNext: string;
  /** A due rule's tag in the library. */
  statusDue: string;
  /** A held rule's tag in the library. */
  statusHeld: string;
  /** The tag of a rule that is not held yet. */
  statusLearning: string;
  /** The button that practises one rule on {n} sentences of the learner's own texts. */
  practiceRule: string;
  /** The button from a rule's first page to its second. */
  exceptionsButton: string;
  /** The second button at the end of a rule session. */
  openMyRules: string;
  /** The title when a practice is finished. */
  practiceDone: string;
  /** How many of the {total} sentences were typed right ({n}). */
  practiceScore: string;
  /** Said after a practice: it changes nothing in the learner's schedule. */
  practiceNote: string;
  /** The button back to the library after a practice. */
  backToRules: string;
  /** Said on a rule's page when the learner's texts do not hold three sentences of it yet. */
  noSentences: string;
  /** The empty library: its title. */
  emptyTitle: string;
  /** The empty library: what fills it. */
  emptySub: string;
  /** The empty library: the way on. */
  emptyAction: string;
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
    mistake: "خطأ شائع",
    examples: "أمثلة",
    ruleNumber: "القاعدة {n} من {total}",
    rightSentence: "جملة صحيحة",
    wrongSentence: "جملة خاطئة",
    myRules: "قواعدي",
    myRulesPill: "قواعدي · {n}",
    libraryLevel: "{n} من {total} قاعدة في {level}",
    dueSection: "تحتاج مراجعة اليوم",
    statusNext: "التالية",
    statusDue: "راجعها",
    statusHeld: "ثابتة",
    statusLearning: "قيد التثبيت",
    practiceRule: "تمرّن عليها · {n} جمل",
    exceptionsButton: "الاستثناءات",
    openMyRules: "افتح قواعدي",
    practiceDone: "انتهى التمرين",
    practiceScore: "{n} من {total} صحيحة",
    practiceNote: "لم يتغير شيء في جدول مراجعتك",
    backToRules: "العودة إلى قواعدي",
    noSentences: "لا توجد بعد جمل كافية من قصصك لهذه القاعدة.",
    emptyTitle: "ستظهر هنا قواعدك",
    emptySub: "كل قاعدة تتعلمها في قاعدة اليوم تُحفظ هنا لتراجعها متى شئت.",
    emptyAction: "ابدأ من الرئيسية",
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
    mistake: "Error común",
    examples: "Ejemplos",
    ruleNumber: "Regla {n} de {total}",
    rightSentence: "Frase correcta",
    wrongSentence: "Frase incorrecta",
    myRules: "Mis reglas",
    myRulesPill: "Mis reglas · {n}",
    libraryLevel: "{n} de {total} reglas de {level}",
    dueSection: "Para repasar hoy",
    statusNext: "Siguiente",
    statusDue: "Repásala",
    statusHeld: "Dominada",
    statusLearning: "Afianzándose",
    practiceRule: "Practícala · {n} frases",
    exceptionsButton: "Excepciones",
    openMyRules: "Abre Mis reglas",
    practiceDone: "Ejercicio terminado",
    practiceScore: "{n} de {total} correctas",
    practiceNote: "Tu calendario de repaso no ha cambiado",
    backToRules: "Volver a Mis reglas",
    noSentences: "Aún no hay suficientes frases de tus historias para esta regla.",
    emptyTitle: "Aquí verás tus reglas",
    emptySub:
      "Cada regla que aprendes en la regla del día se guarda aquí para que la repases cuando quieras.",
    emptyAction: "Empezar desde Inicio",
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
    mistake: "Sık yapılan hata",
    examples: "Örnekler",
    ruleNumber: "Kural {n} / {total}",
    rightSentence: "Doğru cümle",
    wrongSentence: "Yanlış cümle",
    myRules: "Kurallarım",
    myRulesPill: "Kurallarım · {n}",
    libraryLevel: "{level}: {total} kuraldan {n} tanesi",
    dueSection: "Bugün tekrar edilecekler",
    statusNext: "Sıradaki",
    statusDue: "Tekrar et",
    statusHeld: "Pekişti",
    statusLearning: "Pekişiyor",
    practiceRule: "Alıştırma yap · {n} cümle",
    exceptionsButton: "İstisnalar",
    openMyRules: "Kurallarım'ı aç",
    practiceDone: "Alıştırma bitti",
    practiceScore: "{total} cümlenin {n} tanesi doğru",
    practiceNote: "Tekrar takvimin değişmedi",
    backToRules: "Kurallarım'a dön",
    noSentences: "Hikâyelerinde bu kural için henüz yeterli cümle yok.",
    emptyTitle: "Kuralların burada görünecek",
    emptySub:
      "Günün kuralında öğrendiğin her kural burada saklanır; istediğin zaman tekrar edebilirsin.",
    emptyAction: "Ana sayfadan başla",
  },
};

/** The strings for a locale; Arabic when the locale is not set yet. */
export function ruleStrings(locale: SupportLocale | null): RuleStrings {
  return RULE_STRINGS[locale ?? "ar"];
}

/**
 * The direction of a line of a rule in the learner's language: Arabic reads right to left, even when the line
 * starts with an English word (dir="auto" would take the English for the direction of the whole line).
 */
export function ruleTextDir(locale: SupportLocale | null): "rtl" | "ltr" {
  return (locale ?? "ar") === "ar" ? "rtl" : "ltr";
}

/** Fills the {n} and {total} placeholders of a line. */
export function fill(line: string, values: Record<string, string | number>): string {
  return line.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
