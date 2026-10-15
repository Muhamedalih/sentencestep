import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A1, a later addition: one more real-life scene at the same step as the
 * first two sets — present tenses, short sentences, everyday words, a joke that
 * turns in the middle and pays off at the end. It was written against everything
 * already in the library (the passages, the Daily Lessons, the Stories), so it
 * repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const A1_PASSAGES_PART_3: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 11
  {
    slug: "push-or-pull",
    order: 11,
    level: "A1",
    tone: "funny",
    icon: "briefcase",
    title: "Push or Pull?",
    titleAr: "ادفع أم اسحب؟",
    summary: "The sign on the door says one word. Nobody reads it.",
    summaryAr: "اللافتة على الباب تقول كلمة واحدة. لا أحد يقرؤها.",
    cast: { Amy: "zara", "Mr. Reed": "calm-male", "Mr. Stone": "russ" },
    sections: [
      {
        title: "A Glass Door",
        titleAr: "باب زجاجي",
        lines: [
          {
            en: "Today is Amy's first day at her new job.",
            ar: "اليوم هو أول يوم لإيمي في عملها الجديد.",
          },
          {
            en: "She is early. She has a coffee and a big bag.",
            ar: "هي مبكرة. معها قهوة وحقيبة كبيرة.",
          },
          {
            en: "The office has a big glass door.",
            ar: "للمكتب باب زجاجي كبير.",
          },
          {
            en: 'On the door, there is one word: "Pull."',
            ar: "وعلى الباب كلمة واحدة: «اسحب».",
          },
          {
            en: "Amy does not read it. She pushes the door.",
            ar: "لا تقرأ إيمي الكلمة. تدفع الباب.",
          },
          {
            en: "The door does not move.",
            ar: "الباب لا يتحرك.",
          },
          {
            who: "Amy",
            en: "Hello? Is it open?",
            ar: "مرحباً؟ هل هو مفتوح؟",
          },
        ],
        question: {
          en: "What is the word on the door?",
          ar: "ما الكلمة المكتوبة على الباب؟",
          options: [
            { en: "Push", ar: "ادفع" },
            { en: "Pull", ar: "اسحب" },
            { en: "Open", ar: "مفتوح" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "Push, Push, Push",
        titleAr: "ادفع، ادفع، ادفع",
        lines: [
          {
            en: "A man with a big box comes. He does not read the word. He pushes.",
            ar: "يأتي رجل يحمل صندوقاً كبيراً. لا يقرأ الكلمة. يدفع.",
          },
          {
            en: "Then a woman with a baby comes. She pushes too.",
            ar: "ثم تأتي امرأة تحمل طفلاً. هي تدفع أيضاً.",
          },
          {
            en: 'Soon, four people stand at the door. They all push. They all say, "Hmm."',
            ar: "وسرعان ما يقف أربعة أشخاص عند الباب. كلهم يدفعون. وكلهم يقولون: «همم».",
          },
          {
            en: "Behind the glass, Mr. Reed, the guard, is watching them.",
            ar: "خلف الزجاج، يراقبهم السيد ريد، حارس الأمن.",
          },
          {
            en: "He has a cup of tea. He smiles.",
            ar: "بيده كوب شاي. إنه يبتسم.",
          },
          {
            en: "Amy sees him. Why is he smiling?",
            ar: "ترى إيمي الحارس. لماذا يبتسم؟",
          },
        ],
        question: {
          en: "Who is watching the people?",
          ar: "من يراقب الناس؟",
          options: [
            { en: "Mr. Reed, the guard", ar: "السيد ريد، حارس الأمن" },
            { en: "The man with the box", ar: "الرجل صاحب الصندوق" },
            { en: "The woman with the baby", ar: "المرأة التي تحمل الطفل" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "My Favorite Show",
        titleAr: "برنامجي المفضل",
        lines: [
          {
            who: "Amy",
            en: "Wait. The sign says pull!",
            ar: "انتظروا. اللافتة تقول: اسحب!",
          },
          {
            en: "She pulls the door. It opens.",
            ar: "تسحب الباب. فيُفتح.",
          },
          {
            en: 'Everybody laughs. "Oh!" says the man with the box.',
            ar: "يضحك الجميع. «آه!» يقول الرجل صاحب الصندوق.",
          },
          {
            who: "Amy",
            en: "Mr. Reed, why do you not help us?",
            ar: "سيد ريد، لماذا لا تساعدنا؟",
          },
          {
            who: "Mr. Reed",
            en: "Every morning, somebody pushes this door. It is my favorite show.",
            ar: "كل صباح يدفع أحدهم هذا الباب. إنه برنامجي المفضل.",
          },
          {
            who: "Amy",
            en: "That is not nice!",
            ar: "هذا ليس لطيفاً!",
          },
          {
            who: "Mr. Reed",
            en: "I know, I know. I am sorry. But it is so funny.",
            ar: "أعرف، أعرف. أنا آسف. لكنه مضحك جداً.",
          },
          {
            en: "Amy wants to be angry, but she laughs too.",
            ar: "تريد إيمي أن تغضب، لكنها تضحك هي أيضاً.",
          },
        ],
        question: {
          en: "Why doesn't Mr. Reed help the people?",
          ar: "لماذا لا يساعد السيد ريد الناس؟",
          options: [
            { en: "He is asleep", ar: "هو نائم" },
            { en: "He is angry", ar: "هو غاضب" },
            { en: "He likes to watch them", ar: "يحب أن يشاهدهم" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Boss",
        titleAr: "المدير",
        lines: [
          {
            en: "The next morning, Amy comes with two coffees.",
            ar: "في صباح اليوم التالي، تأتي إيمي ومعها قهوتان.",
          },
          {
            who: "Amy",
            en: "Good morning, Mr. Reed. This one is for you.",
            ar: "صباح الخير يا سيد ريد. هذه لك.",
          },
          {
            en: "They sit behind the glass. Today, they watch together.",
            ar: "يجلسان خلف الزجاج. اليوم يشاهدان معاً.",
          },
          {
            en: "At eight o'clock, a tall man in a grey suit comes. He does not look at the sign.",
            ar: "في الثامنة، يأتي رجل طويل يرتدي بدلة رمادية. لا ينظر إلى اللافتة.",
          },
          {
            en: "He pushes. The door does not move. He pushes harder.",
            ar: "يدفع. الباب لا يتحرك. يدفع بقوة أكبر.",
          },
          {
            who: "Mr. Stone",
            en: "Why is this door broken?",
            ar: "لماذا هذا الباب معطّل؟",
          },
          {
            who: "Mr. Reed",
            en: "That is Mr. Stone, Amy. He is the big boss.",
            ar: "هذا هو السيد ستون يا إيمي. إنه المدير الكبير.",
          },
          {
            en: "Nobody says a word. Amy drinks her coffee. It is a good job.",
            ar: "لا أحد يقول كلمة. تشرب إيمي قهوتها. إنها وظيفة جيدة.",
          },
        ],
        question: {
          en: "Who is Mr. Stone?",
          ar: "من هو السيد ستون؟",
          options: [
            { en: "The new guard", ar: "الحارس الجديد" },
            { en: "The big boss", ar: "المدير الكبير" },
            { en: "A customer", ar: "زبون" },
          ],
          answer: 1,
          evidence: 6,
        },
      },
    ],
    closing: {
      en: "Why can't most people open the door?",
      ar: "لماذا لا يستطيع معظم الناس فتح الباب؟",
      options: [
        { en: "They push, but the sign says pull", ar: "يدفعون، لكن اللافتة تقول اسحب" },
        { en: "The door is locked", ar: "الباب مقفل" },
        { en: "The door is very heavy", ar: "الباب ثقيل جداً" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "glass",
        sentence: "The office has a big ___ door.",
        hintAr: "زجاج.",
      },
      {
        word: "guard",
        sentence: "Behind the glass, Mr. Reed, the ___, is watching them.",
        hintAr: "حارس.",
      },
      {
        word: "sign",
        sentence: "Wait. The ___ says pull!",
        hintAr: "لافتة.",
      },
      {
        word: "favorite",
        sentence: "It is my ___ show.",
        hintAr: "مفضّل.",
      },
      {
        word: "tall",
        sentence: "At eight o'clock, a ___ man in a grey suit comes.",
        hintAr: "طويل.",
      },
    ],
  },
];
