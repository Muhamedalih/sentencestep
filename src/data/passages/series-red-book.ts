import { q, tf, type PassageExamSeed } from "@/data/passages/exams/helpers";
import type { PassageSeed } from "@/data/passages/types";

/**
 * The first series (permission passageSeries): "The Red Book", seven A1 episodes with the same three
 * people (Sara, Mr. Cole, Mike), each ending on a question the next one answers (see
 * src/lib/passages/series.ts). The same voice as the other passages: present tenses, short lines,
 * everyday words, a joke on the way and a turn at the end.
 */

export const RED_BOOK_EPISODES: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 16 · episode 1
  {
    slug: "open-on-your-first-day",
    order: 16,
    level: "A1",
    tone: "serious",
    icon: "mail",
    title: "Open on Your First Day",
    titleAr: "افتحيه في يومك الأول",
    summary: "Sara starts work at an old bookshop. Inside a red book, she finds her own name.",
    summaryAr: "تبدأ سارة العمل في مكتبة قديمة. وداخل كتاب أحمر تجد اسمها.",
    cast: { Sara: "ash", "Mr. Cole": "calm-male", Mike: "russ" },
    sections: [
      {
        title: "The First Job",
        titleAr: "المهمة الأولى",
        lines: [
          {
            en: "Today is Sara's first day at a little bookshop.",
            ar: "اليوم هو أول يوم لسارة في مكتبة صغيرة لبيع الكتب.",
          },
          {
            en: "The shop is old, warm and very quiet.",
            ar: "المحل قديم ودافئ وهادئ جداً.",
          },
          {
            who: "Mr. Cole",
            en: "Welcome, Sara. I am Mr. Cole, the owner.",
            ar: "أهلاً يا سارة. أنا السيد كول، صاحب المحل.",
          },
          {
            who: "Mr. Cole",
            en: "Your first job is easy. Clean the shelf in the back.",
            ar: "مهمتك الأولى سهلة. نظّفي الرف الذي في الخلف.",
          },
          {
            who: "Sara",
            en: "Only one shelf? That is easy!",
            ar: "رف واحد فقط؟ هذا سهل!",
          },
          {
            en: "Then she sees it. The shelf is as long as a bus.",
            ar: "ثم تراه. الرف بطول حافلة.",
          },
        ],
        question: {
          en: "What is Sara's first job?",
          ar: "ما هي مهمة سارة الأولى؟",
          options: [
            { en: "To make the coffee", ar: "أن تُعدّ القهوة" },
            { en: "To clean a shelf", ar: "أن تنظّف رفاً" },
            { en: "To sell a new book", ar: "أن تبيع كتاباً جديداً" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "Lunch with Mike",
        titleAr: "الغداء مع مايك",
        lines: [
          {
            en: "At noon, her friend Mike comes in with two sandwiches.",
            ar: "عند الظهر يدخل صديقها مايك ومعه شطيرتان.",
          },
          {
            who: "Mike",
            en: "Lunch time! Wow, you are very dusty.",
            ar: "وقت الغداء! واو، الغبار يغطّيكِ.",
          },
          {
            who: "Sara",
            en: "These books are older than my mom.",
            ar: "هذه الكتب أكبر سناً من أمي.",
          },
          {
            who: "Mike",
            en: "Does this shop have any customers?",
            ar: "هل لهذا المحل زبائن أصلاً؟",
          },
          {
            who: "Sara",
            en: "One. A man comes, reads for an hour and buys nothing.",
            ar: "واحد. رجل يأتي ويقرأ ساعة ولا يشتري شيئاً.",
          },
          {
            who: "Mike",
            en: "That is not a customer. That is a chair.",
            ar: "هذا ليس زبوناً. هذا كرسي.",
          },
        ],
        question: {
          en: "What does Mike bring at noon?",
          ar: "ماذا يُحضر مايك عند الظهر؟",
          options: [
            { en: "Two sandwiches", ar: "شطيرتين" },
            { en: "Two old books", ar: "كتابين قديمين" },
            { en: "A new chair", ar: "كرسياً جديداً" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "The Red Book",
        titleAr: "الكتاب الأحمر",
        lines: [
          {
            en: "After lunch, a red book falls from the top of the shelf.",
            ar: "بعد الغداء يسقط كتاب أحمر من أعلى الرف.",
          },
          {
            en: "Inside the book there is an envelope with an old stamp.",
            ar: "وداخل الكتاب ظرف عليه طابع قديم.",
          },
          {
            who: "Sara",
            en: "Mike, look. There is a name on it.",
            ar: "انظر يا مايك. عليه اسم.",
          },
          {
            who: "Mike",
            en: "What name?",
            ar: "أيّ اسم؟",
          },
          {
            en: "Sara reads it two times. Her hands are cold.",
            ar: "تقرأه سارة مرتين. ويداها باردتان.",
          },
          {
            who: "Sara",
            en: '"For Sara. Open on your first day."',
            ar: "«إلى سارة. افتحيه في يومك الأول».",
          },
        ],
        question: {
          en: "Where is the envelope?",
          ar: "أين الظرف؟",
          options: [
            { en: "Under the door", ar: "تحت الباب" },
            { en: "In Mike's bag", ar: "في حقيبة مايك" },
            { en: "Inside a red book", ar: "داخل كتاب أحمر" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "Twenty Years",
        titleAr: "عشرون عاماً",
        lines: [
          {
            who: "Mike",
            en: "It is a joke. Mr. Cole wrote it this morning.",
            ar: "إنها مزحة. كتبه السيد كول هذا الصباح.",
          },
          {
            en: "But the paper is very old, and the stamp is twenty years old.",
            ar: "لكن الورق قديم جداً، والطابع عمره عشرون سنة.",
          },
          {
            en: "Twenty years ago, Sara was only two.",
            ar: "قبل عشرين عاماً كان عمر سارة سنتين فقط.",
          },
          {
            who: "Mr. Cole",
            en: "So you found it. I waited a long time for you.",
            ar: "إذن وجدتِه. لقد انتظرتكِ طويلاً.",
          },
          {
            who: "Sara",
            en: "For me? Who put it there?",
            ar: "انتظرتني أنا؟ من وضعه هناك؟",
          },
          {
            en: "Mr. Cole locks the door and turns the sign to CLOSED.",
            say: "Mr. Cole locks the door and turns the sign to closed.",
            ar: "يقفل السيد كول الباب ويقلب اللافتة إلى «مغلق».",
          },
        ],
        question: {
          en: "How does Sara's story show that the letter is old?",
          ar: "ما الذي يدلّ على أن الرسالة قديمة؟",
          options: [
            { en: "The stamp is twenty years old", ar: "الطابع عمره عشرون سنة" },
            { en: "The envelope is very big", ar: "الظرف كبير جداً" },
            { en: "The book is wet", ar: "الكتاب مبلّل" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "Why does Sara's first day become so strange?",
      ar: "لماذا يصير يوم سارة الأول غريباً إلى هذا الحد؟",
      options: [
        { en: "Mike buys the whole bookshop", ar: "مايك يشتري المكتبة كلها" },
        { en: "She finds an old letter with her name", ar: "تجد رسالة قديمة عليها اسمها" },
        { en: "Mr. Cole forgets who she is", ar: "السيد كول ينسى من هي" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "bookshop",
        sentence: "Today is Sara's first day at a little ___.",
        hintAr: "مكتبة لبيع الكتب.",
      },
      { word: "owner", sentence: "I am Mr. Cole, the ___.", hintAr: "صاحب المحل." },
      { word: "dusty", sentence: "Wow, you are very ___.", hintAr: "مُغبرّ." },
      {
        word: "envelope",
        sentence: "Inside the book there is an ___ with an old stamp.",
        hintAr: "ظرف.",
      },
      { word: "stamp", sentence: "There is an envelope with an old ___.", hintAr: "طابع بريدي." },
    ],
  },
];

export const RED_BOOK_EXAMS: Record<string, PassageExamSeed> = {
  "open-on-your-first-day": [
    q(
      "Who is the owner of the bookshop?",
      "من هو صاحب المكتبة؟",
      2,
      ["Mike", "مايك"],
      ["The man who reads", "الرجل الذي يقرأ"],
      ["Mr. Cole", "السيد كول"],
    ),
    tf("The shelf in the back is very small.", "الرف الذي في الخلف صغير جداً.", false),
    q(
      "What does the man in the shop buy?",
      "ماذا يشتري الرجل الذي في المحل؟",
      0,
      ["Nothing", "لا شيء"],
      ["A red book", "كتاباً أحمر"],
      ["A chair", "كرسياً"],
    ),
    q(
      "What does Mike think about the letter at first?",
      "ماذا يظن مايك بشأن الرسالة في البداية؟",
      1,
      ["It is for him", "أنها له"],
      ["It is a joke", "أنها مزحة"],
      ["It is from Sara's mom", "أنها من أم سارة"],
    ),
    tf("Mr. Cole waited a long time for Sara.", "انتظر السيد كول سارة طويلاً.", true),
  ],
};
