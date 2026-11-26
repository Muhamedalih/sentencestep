import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The German letters lesson (permission germanZero): the letters of German that an Arabic speaker
 * (or any English-keyboard typist) does not already know how to type or say, in the order they are
 * taught. Pure data and helpers, no window and no next imports, so the tests can run it.
 */

export interface GermanLetter {
  /** The letter as drawn, upper case ("Ä"). */
  letter: string;
  /** The same letter in lower case ("ä"): the key it lives on in a German keyboard. */
  lower: string;
  /** An example word that starts with it (or holds it), and what it means in Arabic and English. */
  word: string;
  wordAr: string;
  wordEn: string;
  /** How it sounds, in Arabic and in English. */
  soundAr: string;
  soundEn: string;
  /** What is read aloud by the sound button: the letter, then the example word. */
  speak: string;
}

export const GERMAN_LETTERS: readonly GermanLetter[] = [
  {
    letter: "Ä",
    lower: "ä",
    word: "Äpfel",
    wordAr: "تفاح",
    wordEn: "apples",
    soundAr: "تُلفظ «إي» مفتوحة، مثل a في كلمة bad بالإنجليزي",
    soundEn: "Like the e in bed, a little more open",
    speak: "Ä. Äpfel.",
  },
  {
    letter: "Ö",
    lower: "ö",
    word: "Öl",
    wordAr: "زيت",
    wordEn: "oil",
    soundAr: "بين «أو» و«إي»: قل «إي» وشفاهك مدوّرة",
    soundEn: "Say “e” with your lips rounded, like in French peu",
    speak: "Ö. Öl.",
  },
  {
    letter: "Ü",
    lower: "ü",
    word: "Über",
    wordAr: "فوق",
    wordEn: "over",
    soundAr: "قل «إي» الطويلة وشفاهك مدوّرة، مثل u في الفرنسي",
    soundEn: "Say “ee” with your lips rounded, like in French tu",
    speak: "Ü. Über.",
  },
  {
    letter: "ß",
    lower: "ß",
    word: "Straße",
    wordAr: "شارع",
    wordEn: "street",
    soundAr: "حرف «س» طويلة ومشدّدة، ويسمى «إيس-تسيت»",
    soundEn: "A long, sharp “s”, called Eszett",
    speak: "Eszett. Straße.",
  },
  {
    letter: "Z",
    lower: "z",
    word: "Zeit",
    wordAr: "وقت",
    wordEn: "time",
    soundAr: "تُلفظ «تس» وليس «زد»، وهي مفتاح Y على الكيبورد الألماني",
    soundEn: "Sounds like “ts”, never “z”; it sits where Y is on an English keyboard",
    speak: "Zet. Zeit.",
  },
  {
    letter: "Y",
    lower: "y",
    word: "Yoga",
    wordAr: "يوغا",
    wordEn: "yoga",
    soundAr: "في الكلمات المستعارة تُلفظ «ي»، وهي مفتاح Z على الكيبورد الألماني",
    soundEn: "A “y” in borrowed words; it sits where Z is on an English keyboard",
    speak: "Ypsilon. Yoga.",
  },
];

/**
 * The keyboard drawn by the help button: a German QWERTZ keyboard, four rows of letter keys. Only the
 * keys that matter to the lesson differ from the keyboard the learner has: Z and Y swapped, ä ö ü on
 * the right, ß next to the zero.
 */
export const GERMAN_KEYBOARD_ROWS: readonly (readonly string[])[] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "ß"],
  ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "ü"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ö", "ä"],
  ["y", "x", "c", "v", "b", "n", "m"],
];

const PLAIN: Readonly<Record<string, string>> = { ä: "a", ö: "o", ü: "u", ß: "s" };
const SPELLED: Readonly<Record<string, string>> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

/**
 * Whether what the learner typed is the letter: the letter itself, the plain stand-in for it (a for ä,
 * s for ß: nobody needs a German keyboard, see german-typing.ts) or its spelled-out form (ae, oe, ue,
 * ss). Case never matters.
 */
export function matchesGermanLetter(target: string, typed: string): boolean {
  const want = target.toLowerCase();
  const got = typed.trim().toLowerCase();
  if (!got) return false;
  if (got === want) return true;
  const plain = PLAIN[want];
  if (plain !== undefined && got === plain) return true;
  const spelled = SPELLED[want];
  return spelled !== undefined && got === spelled;
}

/** Where the lesson's done mark lives: a per-browser convenience, like the first-run flags (see learn-choice.ts). */
export const GERMAN_LETTERS_DONE_KEY = "sentencestep:de-letters-done";
/** A learner who picked «from zero» in the level step or the level pop-up: the first-run flow opens the letters lesson instead of the opening lesson. */
export const GERMAN_ZERO_PICK_KEY = "sentencestep:de-zero";
/** The German level chosen in the level pop-up of an English learner who adds German ("zero", "beginner", ...), so the pop-up shows once. */
export const GERMAN_LEVEL_POPUP_KEY = "sentencestep:de-level-popup";

export const GERMAN_LETTERS_PATH = "/learn/german-letters";

export interface GermanLettersStrings {
  title: string;
  skip: string;
  help: string;
  helpOpen: string;
  helpNote: string;
  helpView: string;
  typeIt: string;
  placeholder: string;
  right: string;
  wrong: string;
  next: string;
  finish: string;
  doneTitle: string;
  doneBody: string;
  doneCta: string;
  listen: string;
  repeat: string;
  repeatDone: string;
  cardTitle: string;
  cardBody: string;
  cardStart: string;
  alphabetBack: string;
  alphabetOpen: string;
  tileTitle: string;
  tileCount: (count: number) => string;
  alphabetBody: string;
  zeroName: string;
  zeroBody: string;
  popupTitle: string;
  popupNote: string;
  popupStart: string;
}

const ar: GermanLettersStrings = {
  title: "الحروف الألمانية",
  skip: "تخطي",
  help: "مساعدة: وين الحرف؟",
  helpOpen: "هذا الكيبورد الألماني. المفتاح الملوّن هو مكان الحرف",
  helpNote: "للعرض فقط، المفاتيح ما تكتب",
  helpView: "كيبورد ألماني",
  typeIt: "اكتب الحرف",
  placeholder: "اكتب هنا",
  right: "صح",
  wrong: "مو هذا. شوف الكيبورد وجرّب مرة ثانية",
  next: "التالي",
  finish: "إنهاء",
  doneTitle: "خلصت الحروف الألمانية",
  doneBody: "تقدر ترجع لها متى ما تحتاج من قسم المفردات.",
  doneCta: "كمّل",
  listen: "اسمع",
  repeat: "أعد الدرس",
  repeatDone: "تم",
  cardTitle: "الحروف الألمانية",
  cardBody: "الدرس الأول: كل الحروف الألمانية بأصواتها",
  cardStart: "ابدأ",
  alphabetBack: "المفردات",
  alphabetOpen: "افتح",
  tileTitle: "Buchstaben",
  tileCount: (count) => `${count} حرفاً`,
  alphabetBody: "اضغط على أي حرف لتسمع اسمه وكلمة منه. بعدها تدرّب على الحروف الستة الأصعب.",
  zeroName: "من الصفر",
  zeroBody: "ما أعرف أي شي بالألمانية. نبدي بالحروف",
  popupTitle: "اختر مستواك بالألمانية",
  popupNote: "يمكنك تغييره متى ما شئت",
  popupStart: "ابدأ",
};

const en: GermanLettersStrings = {
  title: "German letters",
  skip: "Skip",
  help: "Help: where is the letter?",
  helpOpen: "This is a German keyboard. The lit key is where the letter lives.",
  helpNote: "For looking only: the keys don't type.",
  helpView: "German keyboard",
  typeIt: "Type the letter",
  placeholder: "Type here",
  right: "Right",
  wrong: "Not that one. Look at the keyboard and try again.",
  next: "Next",
  finish: "Finish",
  doneTitle: "German letters done",
  doneBody: "You can come back to it any time from the Words page.",
  doneCta: "Continue",
  listen: "Listen",
  repeat: "Repeat lesson",
  repeatDone: "Done",
  cardTitle: "German letters",
  cardBody: "Lesson one: every German letter with its sound",
  cardStart: "Start",
  alphabetBack: "Words",
  alphabetOpen: "Open",
  tileTitle: "Buchstaben",
  tileCount: (count) => `${count} letters`,
  alphabetBody: "Tap any letter to hear its name and a word. Then practise the six hardest ones.",
  zeroName: "From zero",
  zeroBody: "I know nothing in German yet. Start with the letters",
  popupTitle: "Choose your German level",
  popupNote: "You can change it any time",
  popupStart: "Start",
};

export function germanLettersStrings(
  locale: SupportLocale | null | undefined,
): GermanLettersStrings {
  return locale === "ar" ? ar : en;
}
