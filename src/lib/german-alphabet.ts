/**
 * The whole German alphabet (permission germanZero): A to Z, the three umlauts and ß, each with the
 * way German says its name, an example word and a recorded clip of both. Pure data, no next imports,
 * so the recording script and the tests can read it.
 */
export interface GermanAlphabetEntry {
  /** The letter as drawn, upper case ("Ä"). */
  letter: string;
  /** File key of its clips: "a", "ae", "ss". */
  key: string;
  /** How German spells out the letter's name, the text that is recorded ("Beh"). */
  name: string;
  /** What Whisper may hear when the name is read back (any of them passes the check). */
  heard: readonly string[];
  /** Arabic way of writing the name, to read next to the letter. */
  nameAr: string;
  word: string;
  wordAr: string;
  wordEn: string;
}

export const GERMAN_ALPHABET: readonly GermanAlphabetEntry[] = [
  {
    letter: "A",
    key: "a",
    name: "Ah",
    heard: ["a", "ah"],
    nameAr: "آ",
    word: "Apfel",
    wordAr: "تفاحة",
    wordEn: "apple",
  },
  {
    letter: "B",
    key: "b",
    name: "Beh",
    heard: ["be", "beh", "b"],
    nameAr: "بِه",
    word: "Buch",
    wordAr: "كتاب",
    wordEn: "book",
  },
  {
    letter: "C",
    key: "c",
    name: "Zeh",
    heard: ["tse", "tseh", "ze", "zeh", "ce", "c"],
    nameAr: "تسِه",
    word: "Computer",
    wordAr: "حاسوب",
    wordEn: "computer",
  },
  {
    letter: "D",
    key: "d",
    name: "Deh",
    heard: ["de", "deh", "d"],
    nameAr: "دِه",
    word: "Danke",
    wordAr: "شكراً",
    wordEn: "thanks",
  },
  {
    letter: "E",
    key: "e",
    name: "Eh",
    heard: ["e", "eh", "e."],
    nameAr: "إِه",
    word: "Esel",
    wordAr: "حمار",
    wordEn: "donkey",
  },
  {
    letter: "F",
    key: "f",
    name: "Eff",
    heard: ["ef", "eff", "f"],
    nameAr: "إف",
    word: "Fisch",
    wordAr: "سمكة",
    wordEn: "fish",
  },
  {
    letter: "G",
    key: "g",
    name: "Geh",
    heard: ["ge", "geh", "g"],
    nameAr: "غِه",
    word: "Garten",
    wordAr: "حديقة",
    wordEn: "garden",
  },
  {
    letter: "H",
    key: "h",
    name: "Hah",
    heard: ["ha", "hah", "h"],
    nameAr: "هَا",
    word: "Haus",
    wordAr: "بيت",
    wordEn: "house",
  },
  {
    letter: "I",
    key: "i",
    name: "Ih",
    heard: ["i", "ih", "ie"],
    nameAr: "إي",
    word: "Insel",
    wordAr: "جزيرة",
    wordEn: "island",
  },
  {
    letter: "J",
    key: "j",
    name: "Jott",
    heard: ["jot", "jott", "yot", "yott", "j"],
    nameAr: "يُت",
    word: "Jahr",
    wordAr: "سنة",
    wordEn: "year",
  },
  {
    letter: "K",
    key: "k",
    name: "Kah",
    heard: ["ka", "kah", "k"],
    nameAr: "كَا",
    word: "Katze",
    wordAr: "قطة",
    wordEn: "cat",
  },
  {
    letter: "L",
    key: "l",
    name: "Ell",
    heard: ["el", "ell", "l"],
    nameAr: "إل",
    word: "Licht",
    wordAr: "ضوء",
    wordEn: "light",
  },
  {
    letter: "M",
    key: "m",
    name: "Emm",
    heard: ["em", "emm", "m"],
    nameAr: "إم",
    word: "Milch",
    wordAr: "حليب",
    wordEn: "milk",
  },
  {
    letter: "N",
    key: "n",
    name: "Enn",
    heard: ["en", "enn", "n"],
    nameAr: "إن",
    word: "Nacht",
    wordAr: "ليل",
    wordEn: "night",
  },
  {
    letter: "O",
    key: "o",
    name: "Oh",
    heard: ["o", "oh"],
    nameAr: "أُو",
    word: "Ofen",
    wordAr: "فرن",
    wordEn: "oven",
  },
  {
    letter: "P",
    key: "p",
    name: "Peh",
    heard: ["pe", "peh", "p"],
    nameAr: "پِه",
    word: "Papier",
    wordAr: "ورق",
    wordEn: "paper",
  },
  {
    letter: "Q",
    key: "q",
    name: "Kuh",
    heard: ["ku", "kuh", "q", "kuh."],
    nameAr: "كُو",
    word: "Quelle",
    wordAr: "نبع",
    wordEn: "spring",
  },
  {
    letter: "R",
    key: "r",
    name: "Err",
    heard: ["er", "err", "r"],
    nameAr: "إر",
    word: "Regen",
    wordAr: "مطر",
    wordEn: "rain",
  },
  {
    letter: "S",
    key: "s",
    name: "Ess",
    heard: ["es", "ess", "s"],
    nameAr: "إس",
    word: "Sonne",
    wordAr: "شمس",
    wordEn: "sun",
  },
  {
    letter: "T",
    key: "t",
    name: "Teh",
    heard: ["te", "teh", "t"],
    nameAr: "تِه",
    word: "Tisch",
    wordAr: "طاولة",
    wordEn: "table",
  },
  {
    letter: "U",
    key: "u",
    name: "Uh",
    heard: ["u", "uh"],
    nameAr: "أُو",
    word: "Uhr",
    wordAr: "ساعة",
    wordEn: "clock",
  },
  {
    letter: "V",
    key: "v",
    name: "Fau",
    heard: ["fau", "fao", "vau", "v"],
    nameAr: "فاو",
    word: "Vogel",
    wordAr: "طائر",
    wordEn: "bird",
  },
  {
    letter: "W",
    key: "w",
    name: "Weh",
    heard: ["we", "weh", "w", "ve", "veh"],
    nameAr: "فِه",
    word: "Wasser",
    wordAr: "ماء",
    wordEn: "water",
  },
  {
    letter: "X",
    key: "x",
    name: "Iks",
    heard: ["iks", "ix", "x"],
    nameAr: "إكس",
    word: "Xylophon",
    wordAr: "إكسيليفون",
    wordEn: "xylophone",
  },
  {
    letter: "Y",
    key: "y",
    name: "Üpsilon",
    heard: ["ypsilon", "üpsilon", "upsilon", "y"],
    nameAr: "أوبسيلون",
    word: "Yoga",
    wordAr: "يوغا",
    wordEn: "yoga",
  },
  {
    letter: "Z",
    key: "z",
    name: "Zett",
    heard: ["zett", "zet", "tset", "tsett", "z"],
    nameAr: "تسِت",
    word: "Zeit",
    wordAr: "وقت",
    wordEn: "time",
  },
  {
    letter: "Ä",
    key: "ae",
    name: "Äh",
    heard: ["ä", "äh", "e", "eh", "ae"],
    nameAr: "إِه (مفتوحة)",
    word: "Äpfel",
    wordAr: "تفاح",
    wordEn: "apples",
  },
  {
    letter: "Ö",
    key: "oe",
    name: "Öh",
    heard: ["ö", "öh", "oe", "o"],
    nameAr: "إِه (مدوّرة)",
    word: "Öl",
    wordAr: "زيت",
    wordEn: "oil",
  },
  {
    letter: "Ü",
    key: "ue",
    name: "Üh",
    heard: ["ü", "üh", "ue", "u"],
    nameAr: "إي (مدوّرة)",
    word: "Über",
    wordAr: "فوق",
    wordEn: "over",
  },
  {
    letter: "ß",
    key: "ss",
    name: "Eszett",
    heard: ["eszett", "esszett", "estsett", "eßzett", "es-zett", "s-zett"],
    nameAr: "إس-تسِت",
    word: "Straße",
    wordAr: "شارع",
    wordEn: "street",
  },
];

export type GermanClipKind = "name" | "word";

/** Where a clip lives in the public voice-audio bucket (new files only; no lesson or story clip is ever in this folder). */
export function germanLetterClipPath(key: string, kind: GermanClipKind): string {
  return `german-letters/v1/${key}-${kind}.mp3`;
}

export function germanLetterClipUrl(
  supabaseUrl: string,
  key: string,
  kind: GermanClipKind,
): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/voice-audio/${germanLetterClipPath(key, kind)}`;
}

/** The entry for a letter of the lesson ("Ä"), if the alphabet has it. */
export function alphabetEntry(letter: string): GermanAlphabetEntry | undefined {
  return GERMAN_ALPHABET.find((entry) => entry.letter === letter);
}
