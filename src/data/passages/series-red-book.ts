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
  // ───────────────────────────────────────────────────────── 17 · episode 2
  {
    slug: "a-letter-from-nora",
    order: 17,
    level: "A1",
    tone: "serious",
    icon: "mail",
    title: "A Letter from Nora",
    titleAr: "رسالة من نورا",
    summary:
      "The shop door is locked. Mr. Cole knows who wrote the letter, and it is a long story.",
    summaryAr: "باب المحل مقفل. السيد كول يعرف من كتب الرسالة، والقصة طويلة.",
    cast: {
      Sara: "ash",
      "Mr. Cole": "calm-male",
      Mike: "russ",
    },
    sections: [
      {
        title: "Closed",
        titleAr: "مغلق",
        lines: [
          {
            en: "The door is locked, and the shop is dark.",
            ar: "الباب مقفل، والمحل معتم.",
          },
          {
            who: "Mike",
            en: "Mr. Cole, my sandwich and I want to go home.",
            ar: "سيد كول، أنا وشطيرتي نريد العودة إلى البيت.",
          },
          {
            who: "Mr. Cole",
            en: "Sit down. This is a long story.",
            ar: "اجلس. هذه قصة طويلة.",
          },
          {
            who: "Sara",
            en: "First tell me one thing. Who wrote this letter?",
            ar: "أخبرني أولاً بشيء واحد. من كتب هذه الرسالة؟",
          },
          {
            en: "Mr. Cole looks at her face for a long time.",
            ar: "ينظر السيد كول إلى وجهها طويلاً.",
          },
          {
            who: "Mr. Cole",
            en: "Your grandmother wrote it. Her name was Nora.",
            ar: "جدتك هي التي كتبتها. كان اسمها نورا.",
          },
        ],
        question: {
          en: "Who wrote the letter?",
          ar: "من كتب الرسالة؟",
          options: [
            {
              en: "Mike",
              ar: "مايك",
            },
            {
              en: "Sara's grandmother",
              ar: "جدة سارة",
            },
            {
              en: "Mr. Cole",
              ar: "السيد كول",
            },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Nora's Shop",
        titleAr: "محل نورا",
        lines: [
          {
            en: "Sara does not remember her grandmother very well.",
            ar: "لا تتذكر سارة جدتها جيداً.",
          },
          {
            who: "Sara",
            en: "My mom says Grandma Nora sold flowers.",
            ar: "أمي تقول إن جدتي نورا كانت تبيع الورد.",
          },
          {
            who: "Mr. Cole",
            en: "No. She sold books. This was her shop.",
            ar: "لا. كانت تبيع الكتب. هذا كان محلها.",
          },
          {
            who: "Mr. Cole",
            en: "I was young then. She gave me my first job.",
            ar: "كنت شاباً حينها. وهي أعطتني أول عمل لي.",
          },
          {
            who: "Mike",
            en: "Let me guess. Clean the long shelf?",
            ar: "دعني أخمّن. تنظيف الرف الطويل؟",
          },
          {
            who: "Mr. Cole",
            en: "The same shelf. I am still not finished.",
            ar: "الرف نفسه. وما زلت لم أنتهِ منه.",
          },
        ],
        question: {
          en: "What does Sara's mom say about Grandma Nora?",
          ar: "ماذا تقول أم سارة عن الجدة نورا؟",
          options: [
            {
              en: "She sold flowers",
              ar: "كانت تبيع الورد",
            },
            {
              en: "She sold books",
              ar: "كانت تبيع الكتب",
            },
            {
              en: "She was a teacher",
              ar: "كانت معلمة",
            },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "Blue Ink",
        titleAr: "حبر أزرق",
        lines: [
          {
            en: "Sara opens the envelope very carefully.",
            ar: "تفتح سارة الظرف بحذر شديد.",
          },
          {
            en: "Inside there is one small page in blue ink.",
            ar: "في داخله ورقة صغيرة واحدة بحبر أزرق.",
          },
          {
            who: "Sara",
            en: '"My little Sara, today you are two years old."',
            ar: "«صغيرتي سارة، اليوم عمرك سنتان».",
          },
          {
            who: "Sara",
            en: '"I hope that one day you will love books."',
            ar: "«أتمنى أن تحبّي الكتب يوماً ما».",
          },
          {
            who: "Sara",
            en: '"I have a secret for you. It sleeps where time stops."',
            ar: "«لديّ سر لكِ. إنه ينام حيث يتوقف الزمن».",
          },
          {
            who: "Mike",
            en: "Where time stops? That is my math class.",
            ar: "حيث يتوقف الزمن؟ هذا درس الرياضيات عندي.",
          },
        ],
        question: {
          en: "Where does the secret sleep?",
          ar: "أين ينام السر؟",
          options: [
            {
              en: "In a math book",
              ar: "في كتاب رياضيات",
            },
            {
              en: "Under the long shelf",
              ar: "تحت الرف الطويل",
            },
            {
              en: "Where time stops",
              ar: "حيث يتوقف الزمن",
            },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Old Clock",
        titleAr: "الساعة القديمة",
        lines: [
          {
            en: "Sara looks all around the shop.",
            ar: "تنظر سارة في كل أنحاء المحل.",
          },
          {
            en: "Next to the door there is a tall old clock.",
            ar: "بجانب الباب ساعة قديمة طويلة.",
          },
          {
            en: "It is broken. It always says ten past four.",
            ar: "إنها معطلة. تشير دائماً إلى الرابعة وعشر دقائق.",
          },
          {
            who: "Mr. Cole",
            en: "It stopped in the week Nora died.",
            ar: "توقفت في الأسبوع الذي ماتت فيه نورا.",
          },
          {
            who: "Mr. Cole",
            en: "In twenty years, it never made one sound.",
            ar: "ومنذ عشرين سنة لم يصدر منها أي صوت.",
          },
          {
            en: "Then, from inside the clock: tick. Tick. Tick.",
            ar: "ثم يأتي من داخل الساعة: تِك. تِك. تِك.",
          },
        ],
        question: {
          en: "What is next to the door?",
          ar: "ماذا يوجد بجانب الباب؟",
          options: [
            {
              en: "A red chair",
              ar: "كرسي أحمر",
            },
            {
              en: "A broken clock",
              ar: "ساعة معطلة",
            },
            {
              en: "A box of flowers",
              ar: "صندوق ورد",
            },
          ],
          answer: 1,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "What does Sara learn about the shop?",
      ar: "ماذا تعرف سارة عن المحل؟",
      options: [
        {
          en: "It sells flowers now",
          ar: "صار يبيع الورد",
        },
        {
          en: "It was her grandmother's shop",
          ar: "كان محل جدتها",
        },
        {
          en: "Mike wants to buy it",
          ar: "مايك يريد شراءه",
        },
      ],
      answer: 1,
    },
    words: [
      {
        word: "remember",
        sentence: "Sara does not ___ her grandmother very well.",
        hintAr: "يتذكّر.",
      },
      { word: "ink", sentence: "Inside there is one small page in blue ___.", hintAr: "حبر." },
      { word: "guess", sentence: "Let me ___. Clean the long shelf?", hintAr: "يخمّن." },
      {
        word: "clock",
        sentence: "Next to the door there is a tall old ___.",
        hintAr: "ساعة حائط.",
      },
      { word: "broken", sentence: "It is ___. It always says ten past four.", hintAr: "معطّل." },
    ],
  },
  // ───────────────────────────────────────────────────────── 18 · episode 3
  {
    slug: "ten-past-four",
    order: 18,
    level: "A1",
    tone: "serious",
    icon: "house",
    title: "Ten Past Four",
    titleAr: "الرابعة وعشر دقائق",
    summary: "Something moves inside the old clock. Then Sara's phone rings.",
    summaryAr: "شيء يتحرك داخل الساعة القديمة. ثم يرنّ هاتف سارة.",
    cast: {
      Sara: "ash",
      "Mr. Cole": "calm-male",
      Mike: "russ",
      Mom: "autumn",
    },
    sections: [
      {
        title: "Tick, Tick",
        titleAr: "تِك تِك",
        lines: [
          {
            en: "The three of them stand in front of the clock.",
            ar: "يقف الثلاثة أمام الساعة.",
          },
          {
            who: "Mike",
            en: "I am not afraid. I am just standing behind you.",
            ar: "أنا لست خائفاً. أنا فقط أقف خلفك.",
          },
          {
            who: "Sara",
            en: "Mike, it is only a clock.",
            ar: "إنها مجرد ساعة يا مايك.",
          },
          {
            who: "Mike",
            en: "A dead clock that wakes up is not only a clock.",
            ar: "ساعة ميتة تستيقظ ليست مجرد ساعة.",
          },
          {
            en: "Mr. Cole slowly opens its little glass door.",
            ar: "يفتح السيد كول بابها الزجاجي الصغير ببطء.",
          },
          {
            en: "A fat grey mouse jumps out. Mike jumps higher.",
            ar: "يقفز منها فأر رمادي سمين. ويقفز مايك أعلى منه.",
          },
        ],
        question: {
          en: "What jumps out of the clock?",
          ar: "ماذا يقفز من الساعة؟",
          options: [
            {
              en: "A cat",
              ar: "قطة",
            },
            {
              en: "A bird",
              ar: "طائر",
            },
            {
              en: "A mouse",
              ar: "فأر",
            },
          ],
          answer: 2,
          evidence: 5,
        },
      },
      {
        title: "A Small Key",
        titleAr: "مفتاح صغير",
        lines: [
          {
            en: "Behind the mouse's soft bed, there is a tin box.",
            ar: "خلف فراش الفأر الناعم علبة معدنية.",
          },
          {
            who: "Sara",
            en: "Look, a key. And an old photo.",
            ar: "انظروا، مفتاح. وصورة قديمة.",
          },
          {
            en: "The key is very small, like a child's finger.",
            ar: "المفتاح صغير جداً، بحجم إصبع طفل.",
          },
          {
            en: "Mike tries it on the desk, the door and his bike.",
            ar: "يجرّبه مايك على المكتب والباب ودراجته.",
          },
          {
            who: "Mike",
            en: "Good news. It does not open my bike.",
            ar: "خبر سار. إنه لا يفتح دراجتي.",
          },
          {
            who: "Mr. Cole",
            en: "Give it back. That key is not a toy.",
            ar: "أعده. هذا المفتاح ليس لعبة.",
          },
        ],
        question: {
          en: "What is in the tin box?",
          ar: "ماذا يوجد في العلبة المعدنية؟",
          options: [
            {
              en: "A key and a photo",
              ar: "مفتاح وصورة",
            },
            {
              en: "Money and a ring",
              ar: "نقود وخاتم",
            },
            {
              en: "A second letter",
              ar: "رسالة ثانية",
            },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "The Photo",
        titleAr: "الصورة",
        lines: [
          {
            en: "In the photo, a woman holds a baby outside the shop.",
            ar: "في الصورة امرأة تحمل طفلة أمام المحل.",
          },
          {
            who: "Sara",
            en: "Is that Grandma? And is the baby me?",
            ar: "أهذه جدتي؟ وهل الطفلة أنا؟",
          },
          {
            who: "Mr. Cole",
            en: "Yes. And the young man with all that hair is me.",
            ar: "نعم. والشاب صاحب الشعر الكثيف هو أنا.",
          },
          {
            who: "Mike",
            en: "Wow. What happened?",
            ar: "واو. ماذا حدث؟",
          },
          {
            en: "Then Sara sees another woman at the side of the photo.",
            ar: "ثم ترى سارة امرأة أخرى في طرف الصورة.",
          },
          {
            en: "The woman looks very angry. It is Sara's mom.",
            ar: "تبدو المرأة غاضبة جداً. إنها أم سارة.",
          },
        ],
        question: {
          en: "Who looks angry in the photo?",
          ar: "من يبدو غاضباً في الصورة؟",
          options: [
            {
              en: "Grandma Nora",
              ar: "الجدة نورا",
            },
            {
              en: "Sara's mom",
              ar: "أم سارة",
            },
            {
              en: "Mr. Cole",
              ar: "السيد كول",
            },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Mom Is Calling",
        titleAr: "أمي تتصل",
        lines: [
          {
            en: "At that moment, Sara's phone rings. It is Mom.",
            ar: "في تلك اللحظة يرنّ هاتف سارة. إنها أمها.",
          },
          {
            who: "Mom",
            en: "How is your first day? Which shop is it again?",
            ar: "كيف يومك الأول؟ ذكّريني، أيّ محل هو؟",
          },
          {
            who: "Sara",
            en: "The old bookshop on Green Street.",
            ar: "المكتبة القديمة في الشارع الأخضر.",
          },
          {
            en: "For a long time, Mom says nothing.",
            ar: "وتصمت أمها طويلاً.",
          },
          {
            who: "Sara",
            en: "Mom? We found a small key in a clock.",
            ar: "أمي؟ وجدنا مفتاحاً صغيراً في ساعة.",
          },
          {
            who: "Mom",
            en: "Put it back, Sara. Open nothing. I am coming now.",
            ar: "أعيديه يا سارة. لا تفتحي شيئاً. أنا قادمة الآن.",
          },
        ],
        question: {
          en: "What does Mom ask Sara to do?",
          ar: "ماذا تطلب الأم من سارة؟",
          options: [
            {
              en: "To come home",
              ar: "أن تعود إلى البيت",
            },
            {
              en: "To call Mr. Cole",
              ar: "أن تتصل بالسيد كول",
            },
            {
              en: "To put the key back",
              ar: "أن تعيد المفتاح",
            },
          ],
          answer: 2,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "What is a surprise in the old photo?",
      ar: "ما المفاجأة في الصورة القديمة؟",
      options: [
        {
          en: "Mike is the baby",
          ar: "مايك هو الطفل",
        },
        {
          en: "Sara's mom is there, and she is angry",
          ar: "أم سارة موجودة فيها وهي غاضبة",
        },
        {
          en: "The shop is full of flowers",
          ar: "المحل مليء بالورد",
        },
      ],
      answer: 1,
    },
    words: [
      { word: "stand", sentence: "The three of them ___ in front of the clock.", hintAr: "يقف." },
      { word: "behind", sentence: "I am just standing ___ you.", hintAr: "خلف." },
      { word: "toy", sentence: "Give it back. That key is not a ___.", hintAr: "لعبة." },
      { word: "photo", sentence: "Look, a key. And an old ___.", hintAr: "صورة فوتوغرافية." },
      { word: "baby", sentence: "Is that Grandma? And is the ___ me?", hintAr: "طفل رضيع." },
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
  "a-letter-from-nora": [
    q(
      "Who was young when the shop was Nora's?",
      "من كان شاباً عندما كان المحل لنورا؟",
      0,
      ["Mr. Cole", "السيد كول"],
      ["Mike", "مايك"],
      ["Sara", "سارة"],
    ),
    tf("Sara remembers her grandmother very well.", "تتذكر سارة جدتها جيداً.", false),
    q(
      "What colour is the ink in the letter?",
      "ما لون الحبر في الرسالة؟",
      1,
      ["Red", "أحمر"],
      ["Blue", "أزرق"],
      ["Black", "أسود"],
    ),
    q(
      "How old was Sara when the letter was written?",
      "كم كان عمر سارة عندما كُتبت الرسالة؟",
      2,
      ["Ten", "عشر سنوات"],
      ["Twenty", "عشرون سنة"],
      ["Two", "سنتان"],
    ),
    tf(
      "The clock made no sound for twenty years.",
      "لم يصدر من الساعة أي صوت منذ عشرين سنة.",
      true,
    ),
  ],
  "ten-past-four": [
    q(
      "Who opens the glass door of the clock?",
      "من يفتح باب الساعة الزجاجي؟",
      2,
      ["Sara", "سارة"],
      ["Mike", "مايك"],
      ["Mr. Cole", "السيد كول"],
    ),
    tf("The key opens Mike's bike.", "المفتاح يفتح دراجة مايك.", false),
    q(
      "Who is the young man in the photo?",
      "من الشاب الذي في الصورة؟",
      0,
      ["Mr. Cole", "السيد كول"],
      ["Mike", "مايك"],
      ["Sara's dad", "والد سارة"],
    ),
    q(
      "Where is the bookshop?",
      "أين تقع المكتبة؟",
      1,
      ["Next to a school", "بجانب مدرسة"],
      ["On Green Street", "في الشارع الأخضر"],
      ["Near the park", "قرب الحديقة"],
    ),
    tf("Mom says she is coming now.", "تقول الأم إنها قادمة الآن.", true),
  ],
};
