import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A1, one more scene at the same step as the earlier sets — present tenses, short
 * sentences, everyday words, a turn in the middle and a payoff at the end. Written against
 * everything already in the library (the passages, the Daily Lessons, the Stories), so it
 * repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const A1_PASSAGES_PART_5: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 14
  {
    slug: "the-vending-machine",
    order: 14,
    level: "A1",
    tone: "funny",
    icon: "wallet",
    title: "The Vending Machine",
    titleAr: "آلة البيع الذاتي",
    summary: "Sam puts in one dollar. The chips do not fall.",
    summaryAr: "يضع سام دولاراً واحداً. ولا تسقط الرقائق.",
    cast: { Sam: "russ", "Mrs. Cruz": "zara", "Mr. Dunn": "calm-male" },
    sections: [
      {
        title: "One Dollar",
        titleAr: "دولار واحد",
        lines: [
          {
            en: "Sam is hungry. It is two o'clock, and he has no lunch.",
            ar: "سام جائع. الساعة الثانية، وليس معه غداء.",
          },
          {
            en: "In the hall of his office, there is a vending machine.",
            ar: "في ممر مكتبه توجد آلة بيع ذاتي.",
          },
          {
            en: "He puts in one dollar. He presses the button for the chips.",
            ar: "يضع دولاراً واحداً. ويضغط على زر رقائق البطاطس.",
          },
          {
            en: "The machine makes a noise. The bag moves. Then it stops.",
            ar: "تُصدر الآلة ضجيجاً. يتحرك الكيس. ثم يتوقف.",
          },
          {
            en: "The bag does not fall. It hangs there, in front of Sam.",
            ar: "لا يسقط الكيس. يبقى معلقاً هناك أمام سام.",
          },
          {
            who: "Sam",
            en: "Come on! That is my dollar!",
            ar: "هيا! هذا دولاري!",
          },
          {
            en: "The chips do not answer.",
            ar: "ولا تردّ الرقائق.",
          },
        ],
        question: {
          en: "What does Sam want from the machine?",
          ar: "ماذا يريد سام من الآلة؟",
          options: [
            { en: "A cold drink", ar: "مشروباً بارداً" },
            { en: "A candy bar", ar: "قطعة حلوى" },
            { en: "A bag of chips", ar: "كيس رقائق بطاطس" },
          ],
          answer: 2,
          evidence: 2,
        },
      },
      {
        title: "Two Dollars",
        titleAr: "دولاران",
        lines: [
          {
            en: "Sam thinks. Maybe the machine needs more money.",
            ar: "يفكر سام. ربما تحتاج الآلة إلى مزيد من المال.",
          },
          {
            en: "He puts in a second dollar. He presses the same button.",
            ar: "يضع دولاراً ثانياً. ويضغط على الزر نفسه.",
          },
          {
            en: "Now two bags hang there. Neither one falls.",
            ar: "الآن يتعلق كيسان هناك. ولا يسقط أي منهما.",
          },
          {
            who: "Sam",
            en: "Two dollars. Two bags. And no chips!",
            ar: "دولاران. كيسان. ولا رقائق!",
          },
          {
            en: "He shakes the machine. Nothing.",
            ar: "يهزّ الآلة. لا شيء.",
          },
          {
            en: "He hits the side. Nothing.",
            ar: "يضرب جانبها. لا شيء.",
          },
          {
            en: "He asks the machine, very politely, to please open. Nothing.",
            ar: "يطلب من الآلة بأدب شديد أن تنفتح من فضلها. لا شيء.",
          },
        ],
        question: {
          en: "How many bags hang in the machine now?",
          ar: "كم كيساً معلقاً في الآلة الآن؟",
          options: [
            { en: "One", ar: "واحد" },
            { en: "Two", ar: "اثنان" },
            { en: "Three", ar: "ثلاثة" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "Mr. Dunn",
        titleAr: "السيد دن",
        lines: [
          {
            en: "Mr. Dunn, the guard, hears the noise and comes running.",
            ar: "يسمع السيد دن، الحارس، الضجيج ويأتي راكضاً.",
          },
          {
            who: "Mr. Dunn",
            en: "What are you doing, Sam?",
            ar: "ماذا تفعل يا سام؟",
          },
          {
            who: "Sam",
            en: "The machine has my money. And my chips!",
            ar: "الآلة أخذت مالي. ورقائقي!",
          },
          {
            who: "Mr. Dunn",
            en: "Please do not shake it. It is not safe.",
            ar: "من فضلك لا تهزّها. هذا ليس آمناً.",
          },
          {
            en: "Mr. Dunn looks at the machine for a long time. He is a serious man.",
            ar: "ينظر السيد دن إلى الآلة طويلاً. إنه رجل جادّ.",
          },
          {
            who: "Mr. Dunn",
            en: "I cannot open it. Only Mrs. Cruz has the key.",
            ar: "لا أستطيع فتحها. السيدة كروز وحدها معها المفتاح.",
          },
          {
            en: "Mrs. Cruz is the cleaner. She comes at three o'clock.",
            ar: "السيدة كروز هي عاملة النظافة. وتأتي في الثالثة.",
          },
        ],
        question: {
          en: "Who has the key?",
          ar: "من يملك المفتاح؟",
          options: [
            { en: "Mrs. Cruz", ar: "السيدة كروز" },
            { en: "Mr. Dunn", ar: "السيد دن" },
            { en: "Sam", ar: "سام" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "The Secret",
        titleAr: "السرّ",
        lines: [
          {
            en: "At three o'clock, Mrs. Cruz comes with her cart. She looks at Sam, the guard and the machine.",
            ar: "في الثالثة تأتي السيدة كروز بعربتها. وتنظر إلى سام وإلى الحارس وإلى الآلة.",
          },
          {
            who: "Mrs. Cruz",
            en: "The chips again? Everybody does this. Watch.",
            ar: "الرقائق مرة أخرى؟ الجميع يفعل هذا. شاهد.",
          },
          {
            en: "She puts her hand on the side. She gives one small push.",
            ar: "تضع يدها على الجانب. وتدفع دفعة صغيرة واحدة.",
          },
          {
            en: "Bump! Bump! Both bags fall.",
            ar: "بوم! بوم! يسقط الكيسان معاً.",
          },
          {
            who: "Sam",
            en: "How do you know?",
            ar: "كيف عرفتِ؟",
          },
          {
            who: "Mrs. Cruz",
            en: "Twenty years. One bag is for you. One is for me.",
            ar: "عشرون سنة. كيس لك. وكيس لي.",
          },
          {
            en: "Sam smiles. Two dollars, one bag. But now he has a friend.",
            ar: "يبتسم سام. دولاران، وكيس واحد. لكن صار له صديقة.",
          },
        ],
        question: {
          en: "Who knows the secret of the machine?",
          ar: "من يعرف سرّ الآلة؟",
          options: [
            { en: "Mr. Dunn", ar: "السيد دن" },
            { en: "Sam", ar: "سام" },
            { en: "Mrs. Cruz", ar: "السيدة كروز" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "Why does Sam pay two dollars for one bag?",
      ar: "لماذا يدفع سام دولارين مقابل كيس واحد؟",
      options: [
        { en: "The machine is broken", ar: "الآلة معطلة" },
        { en: "Mrs. Cruz takes the second bag", ar: "تأخذ السيدة كروز الكيس الثاني" },
        { en: "The guard takes his money", ar: "يأخذ الحارس ماله" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "dollar",
        sentence: "He puts in one ___.",
        hintAr: "دولار.",
      },
      {
        word: "chips",
        sentence: "He presses the button for the ___.",
        hintAr: "رقائق البطاطس.",
      },
      {
        word: "noise",
        sentence: "The machine makes a ___.",
        hintAr: "ضجيج.",
      },
      {
        word: "shake",
        sentence: "Please do not ___ it.",
        hintAr: "يهزّ.",
      },
      {
        word: "cleaner",
        sentence: "Mrs. Cruz is the ___.",
        hintAr: "عامل نظافة.",
      },
    ],
  },
];
