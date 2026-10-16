import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A1, a later addition: two more real-life scenes at the same step as the
 * earlier sets — present tenses, short sentences, everyday words, a turn in the
 * middle and a payoff at the end. Both were written against everything already in
 * the library (the passages, the Daily Lessons, the Stories), so they repeat none of
 * them (see scripts/check-passage-duplicates.ts).
 */

export const A1_PASSAGES_PART_4: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 12
  {
    slug: "the-wrong-seat",
    order: 12,
    level: "A1",
    tone: "funny",
    icon: "camera",
    title: "The Wrong Seat",
    titleAr: "المقعد الخطأ",
    summary: "Two tickets, one seat, and nobody wants to stand.",
    summaryAr: "تذكرتان، ومقعد واحد، ولا أحد يريد أن يقف.",
    cast: { Carl: "russ", Jenny: "zara", "Mr. Hill": "calm-male" },
    sections: [
      {
        title: "Row F, Seat Twelve",
        titleAr: "الصف F، المقعد الثاني عشر",
        lines: [
          {
            en: "Carl goes to the cinema on Friday night.",
            ar: "يذهب كارل إلى السينما مساء الجمعة.",
          },
          {
            en: "He has a big popcorn and a cold drink.",
            ar: "معه فشار كبير ومشروب بارد.",
          },
          {
            en: "His ticket says: Row F, Seat twelve.",
            ar: "تقول تذكرته: الصف F، المقعد الثاني عشر.",
          },
          {
            en: "He finds Row F. He finds Seat twelve.",
            ar: "يجد الصف F. ويجد المقعد الثاني عشر.",
          },
          {
            en: "A woman is in the seat. She has popcorn too.",
            ar: "امرأة تجلس في المقعد. ومعها فشار أيضاً.",
          },
          {
            who: "Carl",
            en: "Excuse me. This is my seat.",
            ar: "عفواً. هذا مقعدي.",
          },
          {
            who: "Jenny",
            en: "No, it is my seat. Look at my ticket.",
            ar: "لا، إنه مقعدي. انظر إلى تذكرتي.",
          },
        ],
        question: {
          en: "What does Carl's ticket say?",
          ar: "ماذا تقول تذكرة كارل؟",
          options: [
            { en: "Row F, Seat twelve", ar: "الصف F، المقعد الثاني عشر" },
            { en: "Row G, Seat ten", ar: "الصف G، المقعد العاشر" },
            { en: "Row F, Seat two", ar: "الصف F، المقعد الثاني" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Two Tickets",
        titleAr: "تذكرتان",
        lines: [
          {
            en: "Carl and Jenny look at the two tickets.",
            ar: "ينظر كارل وجيني إلى التذكرتين.",
          },
          {
            en: "Row F, Seat twelve. Row F, Seat twelve.",
            ar: "الصف F، المقعد الثاني عشر. الصف F، المقعد الثاني عشر.",
          },
          {
            who: "Carl",
            en: "The same seat? That is not possible!",
            ar: "المقعد نفسه؟ هذا مستحيل!",
          },
          {
            en: "The lights go down. The movie starts.",
            ar: "تنطفئ الأضواء. ويبدأ الفيلم.",
          },
          {
            en: 'A man behind them says, "Shhh!"',
            ar: "يقول رجل خلفهما: «ششش!»",
          },
          {
            who: "Jenny",
            en: "Let us ask the manager.",
            ar: "لنسأل المدير.",
          },
          {
            who: "Carl",
            en: "Good idea. I take my popcorn.",
            ar: "فكرة جيدة. سآخذ فشاري معي.",
          },
        ],
        question: {
          en: "Who do they want to ask?",
          ar: "من يريدان أن يسألا؟",
          options: [
            { en: "The man behind them", ar: "الرجل الذي خلفهما" },
            { en: "A friend", ar: "صديقاً" },
            { en: "The manager", ar: "المدير" },
          ],
          answer: 2,
          evidence: 5,
        },
      },
      {
        title: "The Manager",
        titleAr: "المدير",
        lines: [
          {
            en: "Mr. Hill, the manager, looks at the two tickets.",
            ar: "ينظر السيد هيل، المدير، إلى التذكرتين.",
          },
          {
            en: "He looks again. Then he smiles.",
            ar: "ينظر مرة أخرى. ثم يبتسم.",
          },
          {
            who: "Mr. Hill",
            en: "Carl, your ticket is for tonight.",
            ar: "كارل، تذكرتك لهذا المساء.",
          },
          {
            who: "Mr. Hill",
            en: "Jenny, your ticket is for Saturday.",
            ar: "جيني، تذكرتك ليوم السبت.",
          },
          {
            who: "Jenny",
            en: "Saturday? But today is Friday!",
            ar: "السبت؟ لكن اليوم هو الجمعة!",
          },
          {
            en: "Jenny looks at her ticket. Then she laughs.",
            ar: "تنظر جيني إلى تذكرتها. ثم تضحك.",
          },
          {
            who: "Jenny",
            en: "I am one day early!",
            ar: "أنا مبكرة بيوم واحد!",
          },
        ],
        question: {
          en: "When is Jenny's ticket for?",
          ar: "لأي يوم تذكرة جيني؟",
          options: [
            { en: "Friday", ar: "الجمعة" },
            { en: "Saturday", ar: "السبت" },
            { en: "Sunday", ar: "الأحد" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "The Best Seat",
        titleAr: "أفضل مقعد",
        lines: [
          {
            en: "The cinema is full tonight. Jenny is sad.",
            ar: "السينما ممتلئة هذا المساء. جيني حزينة.",
          },
          {
            who: "Mr. Hill",
            en: "Wait. I have a chair for you.",
            ar: "انتظري. عندي كرسي لكِ.",
          },
          {
            en: "It is his own chair, at the back of the room.",
            ar: "إنه كرسيه الخاص، في آخر القاعة.",
          },
          {
            who: "Mr. Hill",
            en: "It is the best seat in the cinema.",
            ar: "إنه أفضل مقعد في السينما.",
          },
          {
            en: "Jenny sits in the manager's chair. Carl sits in Seat twelve. Both eat popcorn.",
            ar: "تجلس جيني على كرسي المدير. ويجلس كارل في المقعد الثاني عشر. وكلاهما يأكل الفشار.",
          },
          {
            who: "Jenny",
            en: "Thank you, Carl. Tomorrow, I come back.",
            ar: "شكراً لك يا كارل. غداً سأعود.",
          },
          {
            who: "Carl",
            en: "Good. Tomorrow, Seat twelve is yours!",
            ar: "جيد. غداً يكون المقعد الثاني عشر مقعدكِ!",
          },
          {
            en: "Jenny smiles. This time, she reads the date.",
            ar: "تبتسم جيني. وهذه المرة تقرأ التاريخ.",
          },
        ],
        question: {
          en: "Where does Jenny sit tonight?",
          ar: "أين تجلس جيني هذا المساء؟",
          options: [
            { en: "In the manager's chair", ar: "على كرسي المدير" },
            { en: "In Seat twelve", ar: "في المقعد الثاني عشر" },
            { en: "On the floor", ar: "على الأرض" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "Why does Jenny have the same seat on her ticket?",
      ar: "لماذا يوجد المقعد نفسه على تذكرة جيني؟",
      options: [
        { en: "The cinema makes a mistake", ar: "السينما ارتكبت خطأً" },
        { en: "Her ticket is for tomorrow", ar: "تذكرتها لليوم التالي" },
        { en: "Carl's ticket is very old", ar: "تذكرة كارل قديمة جداً" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "popcorn",
        sentence: "He has a big ___ and a cold drink.",
        hintAr: "فشار.",
      },
      {
        word: "ticket",
        sentence: "His ___ says: Row F, Seat twelve.",
        hintAr: "تذكرة.",
      },
      {
        word: "cinema",
        sentence: "Carl goes to the ___ on Friday night.",
        hintAr: "سينما.",
      },
      {
        word: "seat",
        sentence: "Excuse me. This is my ___.",
        hintAr: "مقعد.",
      },
      {
        word: "tonight",
        sentence: "Carl, your ticket is for ___.",
        hintAr: "هذا المساء.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 13
  {
    slug: "the-phone-rings",
    order: 13,
    level: "A1",
    tone: "inspiring",
    icon: "smartphone",
    title: "The Phone Rings",
    titleAr: "الهاتف يرنّ",
    summary: "Ryan has a new job, a big phone and three small sentences.",
    summaryAr: "لدى رايان وظيفة جديدة، وهاتف كبير، وثلاث جمل صغيرة.",
    cast: { Ryan: "russ", "Ms. Cole": "zara", "Mr. Garcia": "calm-male" },
    sections: [
      {
        title: "A New Job",
        titleAr: "وظيفة جديدة",
        lines: [
          {
            en: "Today is Ryan's first day at a small office.",
            ar: "اليوم هو أول يوم لرايان في مكتب صغير.",
          },
          {
            who: "Ms. Cole",
            en: "Welcome, Ryan. Today, you answer the phone.",
            ar: "أهلاً بك يا رايان. اليوم ستردّ على الهاتف.",
          },
          {
            en: "Ryan is afraid. His English is not good on the phone.",
            ar: "رايان خائف. إنجليزيته ليست جيدة على الهاتف.",
          },
          {
            en: "At his desk, he takes a small paper.",
            ar: "على مكتبه، يأخذ ورقة صغيرة.",
          },
          {
            en: 'First, he writes: "Hello, this is Ryan."',
            ar: "أولاً، يكتب: «مرحباً، معك رايان.»",
          },
          {
            en: 'Then: "Can you repeat, please?" And: "Please speak slowly."',
            ar: "ثم: «هل يمكنك أن تعيد، من فضلك؟» وبعدها: «من فضلك تحدث ببطء.»",
          },
          {
            en: "He puts the paper under the phone.",
            ar: "يضع الورقة تحت الهاتف.",
          },
        ],
        question: {
          en: "Where does Ryan put the paper?",
          ar: "أين يضع رايان الورقة؟",
          options: [
            { en: "In his bag", ar: "في حقيبته" },
            { en: "Under the phone", ar: "تحت الهاتف" },
            { en: "On the door", ar: "على الباب" },
          ],
          answer: 1,
          evidence: 6,
        },
      },
      {
        title: "Ring, Ring",
        titleAr: "رنّ، رنّ",
        lines: [
          {
            en: "At ten o'clock, the phone rings.",
            ar: "في العاشرة، يرنّ الهاتف.",
          },
          {
            en: "Ryan's hands shake. He picks up the phone.",
            ar: "ترتجف يدا رايان. يرفع سماعة الهاتف.",
          },
          {
            who: "Ryan",
            en: "Hello, this is Ryan.",
            ar: "مرحباً، معك رايان.",
          },
          {
            en: "A man talks very, very fast. Ryan does not understand.",
            ar: "رجل يتكلم بسرعة كبيرة جداً. رايان لا يفهم.",
          },
          {
            who: "Ryan",
            en: "Can you repeat, please?",
            ar: "هل يمكنك أن تعيد، من فضلك؟",
          },
          {
            en: "The man repeats it. It is still very fast.",
            ar: "يعيد الرجل كلامه. ما زال سريعاً جداً.",
          },
          {
            who: "Ryan",
            en: "Please speak slowly.",
            ar: "من فضلك تحدث ببطء.",
          },
          {
            en: 'Silence. Then the man speaks slowly: "I... need... ten... boxes."',
            ar: "صمت. ثم يتكلم الرجل ببطء: «أحتاج... إلى... عشرة... صناديق.»",
          },
        ],
        question: {
          en: "What does Ryan say first, when he does not understand?",
          ar: "ماذا يقول رايان أولاً، حين لا يفهم؟",
          options: [
            { en: "Can you repeat, please?", ar: "هل يمكنك أن تعيد، من فضلك؟" },
            { en: "Goodbye.", ar: "إلى اللقاء." },
            { en: "I do not know.", ar: "لا أعرف." },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "Ten Boxes",
        titleAr: "عشرة صناديق",
        lines: [
          {
            en: "Now Ryan understands. He writes: ten boxes, Friday.",
            ar: "الآن يفهم رايان. يكتب: عشرة صناديق، الجمعة.",
          },
          {
            who: "Mr. Garcia",
            en: "Thank you. My English is not good. I am from Spain.",
            ar: "شكراً لك. إنجليزيتي ليست جيدة. أنا من إسبانيا.",
          },
          {
            who: "Mr. Garcia",
            en: "On the phone, I am afraid. So I speak fast.",
            ar: "على الهاتف أشعر بالخوف. لذلك أتكلم بسرعة.",
          },
          {
            who: "Ryan",
            en: "Me too! I am afraid on the phone, too.",
            ar: "وأنا كذلك! أنا أخاف من الهاتف أيضاً.",
          },
          {
            en: "Ryan and Mr. Garcia laugh together on the phone.",
            ar: "يضحك رايان والسيد غارسيا معاً على الهاتف.",
          },
          {
            who: "Mr. Garcia",
            en: "You speak very well, Ryan.",
            ar: "أنت تتكلم جيداً جداً يا رايان.",
          },
          {
            who: "Ryan",
            en: "Thank you, Mr. Garcia. Your boxes come on Friday.",
            ar: "شكراً لك يا سيد غارسيا. صناديقك تصل يوم الجمعة.",
          },
        ],
        question: {
          en: "Where is Mr. Garcia from?",
          ar: "من أين السيد غارسيا؟",
          options: [
            { en: "Mexico", ar: "المكسيك" },
            { en: "Italy", ar: "إيطاليا" },
            { en: "Spain", ar: "إسبانيا" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "A Good Team",
        titleAr: "فريق جيد",
        lines: [
          {
            en: "Ms. Cole hears the laugh. She comes to Ryan's desk.",
            ar: "تسمع السيدة كول الضحك. وتأتي إلى مكتب رايان.",
          },
          {
            who: "Ms. Cole",
            en: "Why do you laugh, Ryan?",
            ar: "لماذا تضحك يا رايان؟",
          },
          {
            who: "Ryan",
            en: "Mr. Garcia is afraid of the phone, too. We both speak slowly now.",
            ar: "السيد غارسيا يخاف من الهاتف أيضاً. كلانا يتكلم ببطء الآن.",
          },
          {
            who: "Ms. Cole",
            en: "That is a good start, Ryan. A very good start.",
            ar: "هذه بداية جيدة يا رايان. بداية جيدة جداً.",
          },
          {
            en: "The phone rings again. It is Mr. Garcia.",
            ar: "يرنّ الهاتف مرة أخرى. إنه السيد غارسيا.",
          },
          {
            who: "Mr. Garcia",
            en: "Hello, Ryan. I need one more box.",
            ar: "مرحباً يا رايان. أحتاج إلى صندوق آخر.",
          },
          {
            en: "The paper stays under the phone. But Ryan does not need it now.",
            ar: "تبقى الورقة تحت الهاتف. لكن رايان لا يحتاج إليها الآن.",
          },
        ],
        question: {
          en: "Who calls Ryan again?",
          ar: "من يتصل برايان مرة أخرى؟",
          options: [
            { en: "Mr. Garcia", ar: "السيد غارسيا" },
            { en: "Ms. Cole", ar: "السيدة كول" },
            { en: "A new customer", ar: "زبون جديد" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What helps Ryan on the phone?",
      ar: "ما الذي يساعد رايان على الهاتف؟",
      options: [
        { en: "A big dictionary", ar: "قاموس كبير" },
        { en: "Three short sentences on a paper", ar: "ثلاث جمل قصيرة على ورقة" },
        { en: "Help from his boss", ar: "مساعدة من مديرته" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "phone",
        sentence: "At ten o'clock, the ___ rings.",
        hintAr: "هاتف.",
      },
      {
        word: "paper",
        sentence: "At his desk, he takes a small ___.",
        hintAr: "ورقة.",
      },
      {
        word: "desk",
        sentence: "She comes to Ryan's ___.",
        hintAr: "مكتب.",
      },
      {
        word: "repeat",
        sentence: "Can you ___, please?",
        hintAr: "يُعيد.",
      },
      {
        word: "slowly",
        sentence: "Please speak ___.",
        hintAr: "ببطء.",
      },
    ],
  },
];
