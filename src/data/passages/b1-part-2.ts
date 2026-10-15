import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1 passages, second half — the slower, warmer scenes of the level:
 * family, work, and starting again. Told at the same step as the first half:
 * longer sentences, reported speech, the past perfect where the story looks
 * back, and nothing that reads like a lesson.
 */

export const B1_PASSAGES_PART_2: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 4
  {
    slug: "two-brothers",
    order: 4,
    level: "B1",
    tone: "serious",
    icon: "house",
    title: "Two Brothers",
    titleAr: "أخوان",
    summary: "Two brothers, one old garage, and a boat their father never finished.",
    summaryAr: "أخوان، ومرآب قديم، وقارب لم يُكمله أبوهما.",
    cast: { Adam: "russ", Chris: "calm-male", "Ms. Hayes": "zara" },
    sections: [
      {
        title: "The Lawyer's Office",
        titleAr: "مكتب المحامية",
        lines: [
          {
            en: "Adam and Chris had not spoken for two years. Not since the funeral of their father, when they had a terrible argument about money and the old house.",
            ar: "لم يتحدث آدم وكريس منذ سنتين. منذ جنازة والدهما، حين تشاجرا شجاراً فظيعاً حول المال والبيت القديم.",
          },
          {
            en: "Now they were sitting at opposite ends of a long table in a lawyer's office, and each of them was looking anywhere but at the other.",
            ar: "والآن كانا يجلسان على طرفين متقابلين من طاولة طويلة في مكتب محامية، وكان كل منهما ينظر إلى أي مكان إلا إلى الآخر.",
          },
          {
            who: "Ms. Hayes",
            en: "Gentlemen, the house is ready for sale. Please sign here, and here.",
            ar: "أيها السيدان، البيت جاهز للبيع. من فضلكما وقّعا هنا، وهنا.",
          },
          {
            en: "Adam signed first, quickly, without reading. Chris took longer, and his hand was not steady.",
            ar: "وقّع آدم أولاً، بسرعة، من دون أن يقرأ. استغرق كريس وقتاً أطول، ولم تكن يده ثابتة.",
          },
          {
            who: "Ms. Hayes",
            en: 'There is one more thing. Your father left a key with a note: "For the boys. The garage."',
            ar: "هناك أمر أخير. ترك والدكما مفتاحاً مع ملاحظة: «للولدين. المرآب.»",
          },
          {
            en: "The brothers looked at each other for the first time in two years.",
            ar: "نظر الأخوان إلى بعضهما للمرة الأولى منذ سنتين.",
          },
        ],
        question: {
          en: "What had the brothers argued about?",
          ar: "حول ماذا تشاجر الأخوان؟",
          options: [
            { en: "Money and the old house", ar: "المال والبيت القديم" },
            { en: "A girlfriend", ar: "صديقة" },
            { en: "A job", ar: "وظيفة" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "The Garage",
        titleAr: "المرآب",
        lines: [
          {
            en: "The old house was already empty. In the garage, under a thick grey cover, there was something large.",
            ar: "كان البيت القديم قد أصبح فارغاً. وفي المرآب، تحت غطاء رمادي سميك، كان هناك شيء كبير.",
          },
          {
            en: "Chris pulled off the cover, and the dust rose into the afternoon light.",
            ar: "سحب كريس الغطاء، وتصاعد الغبار في ضوء العصر.",
          },
          {
            en: "It was a wooden boat, half finished. The bottom was perfect. The sides were still only a few boards.",
            ar: "كان قارباً خشبياً غير مكتمل. القاع متقن. أما الجانبان فلم يكونا سوى ألواح قليلة.",
          },
          {
            who: "Adam",
            en: "Dad's boat. He started it when we were kids. I forgot all about it.",
            ar: "قارب أبي. بدأه ونحن صغيران. لقد نسيته تماماً.",
          },
          {
            who: "Chris",
            en: "I didn't forget. Every summer, we built it together, remember? You held the wood, and I held the hammer.",
            ar: "أنا لم أنسَ. كل صيف كنا نبنيه معاً، أتذكر؟ كنت تمسك الخشب، وأنا أمسك المطرقة.",
          },
          {
            en: 'On the workbench lay a small piece of paper. It said, in their father\'s crooked handwriting: "Boys, I never finished it. Maybe you can."',
            ar: "على طاولة العمل كانت هناك ورقة صغيرة. كُتب فيها بخط أبيهما المتعرّج: «يا ولدَيّ، لم أُكمله أبداً. ربما تستطيعان أنتما.»",
          },
        ],
        question: {
          en: "What was under the grey cover?",
          ar: "ماذا كان تحت الغطاء الرمادي؟",
          options: [
            { en: "A half-finished wooden boat", ar: "قارب خشبي غير مكتمل" },
            { en: "An old car", ar: "سيارة قديمة" },
            { en: "A pile of books", ar: "كومة من الكتب" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Sawdust",
        titleAr: "نشارة الخشب",
        lines: [
          {
            en: "They did not talk about the argument. They only talked about the boat. Chris measured, Adam cut, and on the first Saturday, almost nobody said anything else.",
            ar: "لم يتحدثا عن الشجار. تحدثا عن القارب فقط. كان كريس يقيس وآدم يقطع، وفي السبت الأول لم يقل أحد تقريباً شيئاً آخر.",
          },
          {
            en: "The second Saturday, Adam brought coffee. The third Saturday, Chris brought sandwiches. The sawdust covered everything: their shoes, their hair, and slowly, the silence.",
            ar: "في السبت الثاني، أحضر آدم القهوة. وفي السبت الثالث، أحضر كريس الساندويتشات. غطّت نشارة الخشب كل شيء: أحذيتهما وشعرهما، ومع الوقت، الصمت أيضاً.",
          },
          {
            who: "Chris",
            en: "I was so angry with you at the funeral. You lived far away. I was the one who took care of Dad for two years.",
            ar: "كنت غاضباً منك جداً في الجنازة. كنت تعيش بعيداً. أنا من اعتنى بأبي سنتين.",
          },
          {
            who: "Adam",
            en: "I know. I felt guilty every day, and it was easier to fight than to say sorry.",
            ar: "أعرف. كنت أشعر بالذنب كل يوم، وكان الشجار أسهل من الاعتذار.",
          },
          {
            who: "Chris",
            en: "I didn't want the house. I only wanted you to come and visit.",
            ar: "أنا لم أكن أريد البيت. كنت أريدك فقط أن تأتي لتزورنا.",
          },
          {
            en: "Adam put down his saw. He did not say anything, because there was nothing to say. He just put his hand on his brother's shoulder.",
            ar: "وضع آدم منشاره. لم يقل شيئاً، لأنه لم يكن هناك ما يُقال. وضع يده فقط على كتف أخيه.",
          },
        ],
        question: {
          en: "Why had Chris been so angry at the funeral?",
          ar: "لماذا كان كريس غاضباً جداً في الجنازة؟",
          options: [
            {
              en: "Adam lived far away while Chris took care of their father",
              ar: "كان آدم يعيش بعيداً بينما اعتنى كريس بأبيهما",
            },
            { en: "Adam wanted to take the boat", ar: "أراد آدم أن يأخذ القارب" },
            { en: "Adam arrived late", ar: "وصل آدم متأخراً" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "The Launch",
        titleAr: "إنزال القارب",
        lines: [
          {
            en: "It took them four months. In June, the boat was finished: smooth, strong, and painted dark blue.",
            ar: "استغرق الأمر أربعة أشهر. في يونيو، اكتمل القارب: ناعماً وقوياً ومطلياً بالأزرق الداكن.",
          },
          {
            en: 'On the side, Chris had painted two words in white: "The Boys."',
            ar: "وعلى جانبه، كان كريس قد كتب كلمتين بالأبيض: «الولدان».",
          },
          {
            en: "They carried it to the lake together. It was heavy, and they laughed and complained the whole way, exactly as they did when they were kids.",
            ar: "حملاه معاً إلى البحيرة. كان ثقيلاً، وضحكا واشتكيا طوال الطريق، تماماً كما كانا يفعلان وهما صغيران.",
          },
          {
            who: "Adam",
            en: "On three? One, two...",
            ar: "على العدّ ثلاثة؟ واحد، اثنان...",
          },
          {
            who: "Chris",
            en: "Three!",
            ar: "ثلاثة!",
          },
          {
            en: "The boat touched the water, and for a terrible second, neither of them breathed. Then it floated, calm and proud, on the shining lake.",
            ar: "لامس القارب الماء، وفي ثانية رهيبة لم يتنفس أيٌّ منهما. ثم طفا، هادئاً وفخوراً، على البحيرة اللامعة.",
          },
        ],
        question: {
          en: "What did Chris paint on the boat?",
          ar: "ماذا كتب كريس على القارب؟",
          options: [
            { en: '"The Boys"', ar: "«الولدان»" },
            { en: '"Dad"', ar: "«أبي»" },
            { en: '"Freedom"', ar: "«الحرية»" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "The Same Lake",
        titleAr: "البحيرة نفسها",
        lines: [
          {
            en: "They sat in the boat for an hour without a word, moving slowly across the water. It was the same lake where their father had taught them to swim.",
            ar: "جلسا في القارب ساعة بلا كلمة، يتحركان ببطء فوق الماء. كانت البحيرة نفسها التي علّمهما فيها أبوهما السباحة.",
          },
          {
            who: "Adam",
            en: "I told the lawyer to cancel the sale this morning.",
            ar: "طلبت من المحامية صباح اليوم أن تلغي البيع.",
          },
          {
            who: "Chris",
            en: "What? Why?",
            ar: "ماذا؟ لماذا؟",
          },
          {
            who: "Adam",
            en: "Because I don't want a stranger in Dad's garage. And because this house is the only place where I remember how to be your brother.",
            ar: "لأنني لا أريد غريباً في مرآب أبي. ولأن هذا البيت هو المكان الوحيد الذي أتذكر فيه كيف أكون أخاك.",
          },
          {
            en: "Chris looked at the water for a long time. His eyes were wet, but he was smiling.",
            ar: "نظر كريس إلى الماء طويلاً. كانت عيناه مبللتين، لكنه كان يبتسم.",
          },
          {
            who: "Chris",
            en: "Then we keep the house. Every summer, the two of us, and the boat.",
            ar: "إذن نحتفظ بالبيت. كل صيف، نحن الاثنان، والقارب.",
          },
        ],
        question: {
          en: "What did Adam decide?",
          ar: "ماذا قرّر آدم؟",
          options: [
            { en: "To cancel the sale of the house", ar: "أن يلغي بيع البيت" },
            { en: "To sell the boat", ar: "أن يبيع القارب" },
            { en: "To move to another country", ar: "أن ينتقل إلى بلد آخر" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "How did building the boat change the brothers?",
      ar: "كيف غيّر بناء القارب الأخوين؟",
      options: [
        {
          en: "It helped them talk and forgive each other",
          ar: "ساعدهما على الحديث ومسامحة بعضهما",
        },
        { en: "It made them argue about money again", ar: "جعلهما يتشاجران حول المال من جديد" },
        {
          en: "It made them want to sell the house faster",
          ar: "جعلهما يريدان بيع البيت بسرعة أكبر",
        },
      ],
      answer: 0,
    },
    words: [
      {
        word: "funeral",
        sentence:
          "Not since the ___ of their father, when they had a terrible argument about money and the old house.",
        hintAr: "الجنازة.",
      },
      {
        word: "crooked",
        sentence: "It said, in their father's ___ handwriting:",
        hintAr: "معوّج، متعرّج.",
      },
      {
        word: "sawdust",
        sentence: "The ___ covered everything: their shoes, their hair, and slowly, the silence.",
        hintAr: "نشارة الخشب.",
      },
      {
        word: "guilty",
        sentence: "I know. I felt ___ every day, and it was easier to fight than to say sorry.",
        hintAr: "مذنب، يشعر بالذنب.",
      },
      {
        word: "hammer",
        sentence: "You held the wood, and I held the ___.",
        hintAr: "المطرقة.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 5
  {
    slug: "starting-over-at-forty-five",
    order: 5,
    level: "B1",
    tone: "inspiring",
    icon: "book",
    title: "Starting Over at Forty-Five",
    titleAr: "البداية من جديد في الخامسة والأربعين",
    summary: "The factory closed. Paul was forty-five and had never written a line of code.",
    summaryAr: "أُغلق المصنع. كان بول في الخامسة والأربعين ولم يكتب سطر شيفرة في حياته.",
    cast: { Paul: "russ", Karen: "zara", Joe: "calm-male", Zoe: "ash" },
    sections: [
      {
        title: "The Last Shift",
        titleAr: "المناوبة الأخيرة",
        lines: [
          {
            en: "For twenty-two years, Paul had worked at the same factory, making metal doors. He knew every machine, every sound, and every worker by name.",
            ar: "لاثنتين وعشرين سنة، عمل بول في المصنع نفسه، يصنع الأبواب المعدنية. كان يعرف كل آلة وكل صوت وكل عامل بالاسم.",
          },
          {
            en: "Then, one grey Friday, the manager gathered everybody in the parking lot and said the factory was closing. Four hundred jobs would disappear.",
            ar: "ثم، في يوم جمعة رمادي، جمع المدير الجميع في موقف السيارات وقال إن المصنع سيُغلق. أربعمئة وظيفة ستختفي.",
          },
          {
            en: "Paul drove home slowly. He did not turn on the radio. At forty-five years old, he felt as if somebody had erased his whole life.",
            ar: "قاد بول إلى البيت ببطء. لم يشغّل الراديو. في الخامسة والأربعين من عمره، شعر كأن أحداً قد محا حياته كلها.",
          },
          {
            who: "Karen",
            en: "Paul, listen. We have some savings. We have each other. We'll find a way.",
            ar: "بول، اسمع. لدينا بعض المدخرات. ولدينا بعضنا. سنجد طريقة.",
          },
          {
            who: "Paul",
            en: "A way to do what? I don't know how to do anything except make doors.",
            ar: "طريقة لفعل ماذا؟ لا أعرف أن أفعل شيئاً سوى صنع الأبواب.",
          },
          {
            en: 'That night, he could not sleep. He took his laptop to the kitchen and typed a question into the search bar: "What jobs are growing?"',
            ar: "في تلك الليلة، لم يستطع النوم. أخذ حاسوبه المحمول إلى المطبخ وكتب سؤالاً في شريط البحث: «ما الوظائف التي تنمو؟»",
          },
        ],
        question: {
          en: "Why did Paul lose his job?",
          ar: "لماذا فقد بول وظيفته؟",
          options: [
            { en: "The factory closed", ar: "أُغلق المصنع" },
            { en: "He was fired", ar: "طُرد من العمل" },
            { en: "He quit", ar: "استقال" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "Zeros and Ones",
        titleAr: "أصفار وواحدات",
        lines: [
          {
            en: "One answer appeared again and again: computer programming. Paul laughed. He had never even written an email without his wife's help.",
            ar: "ظهر جواب واحد مراراً وتكراراً: برمجة الحاسوب. ضحك بول. لم يكن قد كتب بريداً إلكترونياً في حياته دون مساعدة زوجته.",
          },
          {
            en: "But he found a free evening course at the library, and he signed up. On the first night, he was the oldest student by twenty years.",
            ar: "لكنه وجد دورة مسائية مجانية في المكتبة وسجّل فيها. وفي الليلة الأولى، كان أكبر الطلاب بعشرين سنة.",
          },
          {
            en: "It was hard. The words sounded like another language, and the first program he wrote did not work.",
            ar: "كان الأمر صعباً. بدت الكلمات كلغة أخرى، ولم يعمل أول برنامج كتبه.",
          },
          {
            en: "For three days, he looked for the mistake. Finally, he found it: one small missing symbol on line forty-two.",
            ar: "لثلاثة أيام، بحث عن الخطأ. وأخيراً وجده: رمز صغير ناقص في السطر الثاني والأربعين.",
          },
          {
            who: "Paul",
            en: "Three days! For one tiny dot!",
            ar: "ثلاثة أيام! من أجل نقطة صغيرة!",
          },
          {
            who: "Karen",
            en: "That's what makes you good, Paul. You don't quit on a machine that doesn't work.",
            ar: "هذا ما يجعلك جيداً يا بول. أنت لا تستسلم أمام آلة لا تعمل.",
          },
        ],
        question: {
          en: "How long did Paul look for his mistake?",
          ar: "كم من الوقت بحث بول عن خطئه؟",
          options: [
            { en: "Three days", ar: "ثلاثة أيام" },
            { en: "One hour", ar: "ساعة واحدة" },
            { en: "One month", ar: "شهراً" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Too Old?",
        titleAr: "أكبر من اللازم؟",
        lines: [
          {
            en: "After six months, Paul sent job applications to thirty companies. He received twenty-six polite emails and four complete silences.",
            ar: "بعد ستة أشهر، أرسل بول طلبات توظيف إلى ثلاثين شركة. وتلقى ست وعشرين رسالة مهذبة وأربع حالات صمت تام.",
          },
          {
            en: "At one interview, a young man in an expensive shirt looked at Paul's application for ten seconds.",
            ar: "في إحدى المقابلات، نظر شاب بقميص غالٍ إلى طلب بول عشر ثوانٍ.",
          },
          {
            en: '"We are really looking for digital natives," he said. "People who grew up with technology."',
            ar: "«نحن نبحث فعلاً عن مواليد العصر الرقمي»، قال. «أشخاص نشأوا مع التكنولوجيا.»",
          },
          {
            who: "Paul",
            en: "I grew up with technology too. Mine just had a lot more metal.",
            ar: "أنا أيضاً نشأت مع التكنولوجيا. لكن تكنولوجيتي كان فيها معدن أكثر بكثير.",
          },
          {
            en: "The young man smiled politely and said they would call him. They never did.",
            ar: "ابتسم الشاب بأدب وقال إنهم سيتصلون به. لكنهم لم يفعلوا أبداً.",
          },
          {
            en: "That evening, Paul sat in his car outside the house for a long time. For the first time, he thought that maybe they were right.",
            ar: "في ذلك المساء، جلس بول في سيارته أمام البيت طويلاً. وللمرة الأولى، فكّر أنهم ربما كانوا محقين.",
          },
        ],
        question: {
          en: "What did the young interviewer say they wanted?",
          ar: "ماذا قال المحاوِر الشاب إنهم يريدون؟",
          options: [
            { en: "Digital natives", ar: "مواليد العصر الرقمي" },
            { en: "Experienced factory workers", ar: "عمال مصانع ذوي خبرة" },
            { en: "Nobody at all", ar: "لا أحد على الإطلاق" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "The Warehouse Problem",
        titleAr: "مشكلة المستودع",
        lines: [
          {
            en: "A week later, his old friend Joe called. Joe managed a big warehouse, and he had a problem.",
            ar: "بعد أسبوع، اتصل به صديقه القديم جو. كان جو يدير مستودعاً كبيراً، وكانت لديه مشكلة.",
          },
          {
            who: "Joe",
            en: "Paul, our computer system is a disaster. The numbers never match, and nobody understands why. We lose boxes every day.",
            ar: "بول، نظام الحاسوب عندنا كارثة. الأرقام لا تتطابق أبداً، ولا أحد يفهم السبب. نخسر صناديق كل يوم.",
          },
          {
            en: "Paul went to the warehouse for two days. He did not look at the screens. He watched the workers: where they walked, where they waited, and where the boxes got lost.",
            ar: "ذهب بول إلى المستودع يومين. لم ينظر إلى الشاشات. راقب العمال: أين يمشون، وأين ينتظرون، وأين تضيع الصناديق.",
          },
          {
            en: "On the third day, he understood. The problem was not in the computer. It was in the way people worked, and Paul had spent twenty-two years learning exactly that.",
            ar: "في اليوم الثالث، فهم. لم تكن المشكلة في الحاسوب. كانت في طريقة عمل الناس، وقد قضى بول اثنتين وعشرين سنة يتعلم ذلك بالضبط.",
          },
          {
            en: "He wrote a small program in two weeks. It was not beautiful, but it worked. The lost boxes dropped from fifty a week to three.",
            ar: "كتب برنامجاً صغيراً في أسبوعين. لم يكن جميلاً، لكنه عمل. وانخفض عدد الصناديق الضائعة من خمسين في الأسبوع إلى ثلاثة.",
          },
          {
            who: "Joe",
            en: 'Paul, the owner wants to meet you. He said, and I quote: "Find me ten more people like him."',
            ar: "بول، المالك يريد مقابلتك. قال، وأنقل كلامه حرفياً: «جدوا لي عشرة آخرين مثله.»",
          },
        ],
        question: {
          en: "Where was the real problem in the warehouse?",
          ar: "أين كانت المشكلة الحقيقية في المستودع؟",
          options: [
            { en: "In the way people worked", ar: "في طريقة عمل الناس" },
            { en: "In the computers", ar: "في الحواسيب" },
            { en: "In the boxes", ar: "في الصناديق" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Monday Morning",
        titleAr: "صباح الاثنين",
        lines: [
          {
            en: "On Monday morning, Paul walked into the office of the logistics company for his first day as a software developer.",
            ar: "صباح الاثنين، دخل بول مكتب شركة اللوجستيات في أول يوم له كمطوّر برمجيات.",
          },
          {
            en: "His desk was next to a young woman called Zoe, who was twenty-three and fast as lightning. She looked at him with open curiosity.",
            ar: "كان مكتبه بجانب شابة اسمها زوي، في الثالثة والعشرين وسريعة كالبرق. نظرت إليه بفضول مكشوف.",
          },
          {
            who: "Zoe",
            en: "So you're the factory guy! They say you solved the warehouse problem in two weeks. How did you do it?",
            ar: "إذن أنت رجل المصنع! يقولون إنك حللت مشكلة المستودع في أسبوعين. كيف فعلتها؟",
          },
          {
            who: "Paul",
            en: "I didn't start with the code. I started with the people. The code is the easy part.",
            ar: "لم أبدأ بالشيفرة. بدأت بالناس. الشيفرة هي الجزء السهل.",
          },
          {
            en: "Zoe wrote that sentence in her notebook. By the end of the week, she was asking Paul for advice about everything.",
            ar: "كتبت زوي هذه الجملة في دفترها. وبنهاية الأسبوع، كانت تطلب نصيحة بول في كل شيء.",
          },
          {
            en: "At forty-six, Paul finally understood: he had not lost twenty-two years. He had been collecting them.",
            ar: "في السادسة والأربعين، فهم بول أخيراً: لم يكن قد خسر اثنتين وعشرين سنة. كان يجمعها.",
          },
        ],
        question: {
          en: "What did Paul finally understand?",
          ar: "ماذا فهم بول في النهاية؟",
          options: [
            {
              en: "His twenty-two years had not been wasted",
              ar: "أن سنواته الاثنتين والعشرين لم تضع هباءً",
            },
            { en: "He should go back to the factory", ar: "أن عليه أن يعود إلى المصنع" },
            { en: "He was too old for the job", ar: "أنه أكبر من اللازم لهذه الوظيفة" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "According to Karen, what made Paul good?",
      ar: "حسب كارين، ما الذي يجعل بول جيداً؟",
      options: [
        { en: "He did not quit on a machine that did not work", ar: "لم يستسلم أمام آلة لا تعمل" },
        { en: "He learned faster than the young students", ar: "كان يتعلّم أسرع من الطلاب الشباب" },
        { en: "He already knew a lot about computers", ar: "كان يعرف الكثير عن الحواسيب مسبقاً" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "factory",
        sentence: "For twenty-two years, Paul had worked at the same ___, making metal doors.",
        hintAr: "المصنع.",
      },
      {
        word: "polite",
        sentence: "He received twenty-six ___ emails and four complete silences.",
        hintAr: "مهذّب، مؤدّب.",
      },
      {
        word: "warehouse",
        sentence: "Joe managed a big ___, and he had a problem.",
        hintAr: "المستودع.",
      },
      {
        word: "disaster",
        sentence: "Paul, our computer system is a ___.",
        hintAr: "الكارثة.",
      },
      {
        word: "advice",
        sentence: "By the end of the week, she was asking Paul for ___ about everything.",
        hintAr: "النصيحة.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 6
  {
    slug: "the-cafe-on-maple-street",
    order: 6,
    level: "B1",
    tone: "inspiring",
    icon: "coffee",
    title: "The Café on Maple Street",
    titleAr: "المقهى في شارع مابل",
    summary: "Elena had a small café, a big table, and almost no customers.",
    summaryAr: "كان لدى إيلينا مقهى صغير وطاولة كبيرة وزبائن يكادون لا يوجدون.",
    cast: { Elena: "zara", "Mr. Brooks": "calm-male", Noah: "russ" },
    sections: [
      {
        title: "Two Suitcases",
        titleAr: "حقيبتان",
        lines: [
          {
            en: "Elena arrived in the small American town with two suitcases, forty dollars, and a notebook full of recipes from her grandmother in Argentina.",
            ar: "وصلت إيلينا إلى البلدة الأمريكية الصغيرة بحقيبتين وأربعين دولاراً ودفتر مليء بوصفات جدتها في الأرجنتين.",
          },
          {
            en: "Her English was slow and full of mistakes. Her first job was washing dishes in the kitchen of a busy restaurant, from six in the morning until midnight.",
            ar: "كانت إنجليزيتها بطيئة ومليئة بالأخطاء. وكان عملها الأول غسل الصحون في مطبخ مطعم مزدحم، من السادسة صباحاً حتى منتصف الليل.",
          },
          {
            en: "Every Friday, she put twenty dollars in an old coffee can under her bed. Every Friday, for six years.",
            ar: "كل جمعة، كانت تضع عشرين دولاراً في علبة قهوة قديمة تحت سريرها. كل جمعة، لستة أعوام.",
          },
          {
            who: "Elena",
            en: "One day, I will have my own café. A small one, with a big table, where everyone can sit.",
            ar: "يوماً ما، سيكون لي مقهاي الخاص. صغير، بطاولة كبيرة، يستطيع الجميع الجلوس عليها.",
          },
          {
            en: "Her coworkers smiled kindly. Nobody believed her. Elena did not mind. She believed it enough for everybody.",
            ar: "ابتسم زملاؤها بلطف. لم يصدّقها أحد. ولم تكترث إيلينا. كانت تؤمن بذلك بما يكفي للجميع.",
          },
        ],
        question: {
          en: "Where did Elena keep her savings?",
          ar: "أين كانت إيلينا تحتفظ بمدّخراتها؟",
          options: [
            { en: "In an old coffee can under her bed", ar: "في علبة قهوة قديمة تحت سريرها" },
            { en: "In a bank", ar: "في مصرف" },
            { en: "In her shoes", ar: "في حذائها" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "The Empty Café",
        titleAr: "المقهى الفارغ",
        lines: [
          {
            en: 'In the spring of the sixth year, Elena rented a tiny room on Maple Street and painted the walls herself. She called the place "Mesa Grande," which means "Big Table."',
            ar: "في ربيع السنة السادسة، استأجرت إيلينا غرفة صغيرة في شارع مابل ودهنت الجدران بنفسها. سمّت المكان «ميسا غراندي»، أي «الطاولة الكبيرة».",
          },
          {
            en: "The first day, three people came. The second day, five. By the end of the first month, she was losing money every week.",
            ar: "في اليوم الأول، جاء ثلاثة أشخاص. وفي الثاني، خمسة. وبنهاية الشهر الأول، كانت تخسر المال كل أسبوع.",
          },
          {
            en: "Across the street, a big coffee chain had a long line of customers every morning, and a huge sign that never turned off.",
            ar: "على الجانب الآخر من الشارع، كانت سلسلة مقاهٍ كبيرة يقف أمامها طابور طويل من الزبائن كل صباح، ولافتة ضخمة لا تنطفئ أبداً.",
          },
          {
            en: "One evening, Elena sat alone in her empty café and looked at the unpaid bills on the table.",
            ar: "في إحدى الأمسيات، جلست إيلينا وحدها في مقهاها الفارغ ونظرت إلى الفواتير غير المدفوعة على الطاولة.",
          },
          {
            who: "Elena",
            en: "Maybe I was crazy. Maybe a table is not enough.",
            ar: "ربما كنت مجنونة. ربما الطاولة لا تكفي.",
          },
          {
            en: "She started to count how many weeks she could survive.",
            ar: "بدأت تحسب كم أسبوعاً تستطيع أن تصمد.",
          },
        ],
        question: {
          en: 'What did "Mesa Grande" mean?',
          ar: "ماذا تعني «ميسا غراندي»؟",
          options: [
            { en: "Big Table", ar: "الطاولة الكبيرة" },
            { en: "Good Coffee", ar: "القهوة الجيدة" },
            { en: "Open Door", ar: "الباب المفتوح" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "The Regular",
        titleAr: "الزبون الدائم",
        lines: [
          {
            en: "On a cold Tuesday morning, an old man in a long brown coat came in. His name was Mr. Brooks, and he had been a teacher for forty years.",
            ar: "في صباح ثلاثاء بارد، دخل رجل عجوز يرتدي معطفاً بنياً طويلاً. كان اسمه السيد بروكس، وقد عمل معلماً أربعين سنة.",
          },
          {
            who: "Mr. Brooks",
            en: "A coffee, please. And what is that smell? It smells like my grandmother's kitchen.",
            ar: "قهوة من فضلك. وما هذه الرائحة؟ إنها كرائحة مطبخ جدتي.",
          },
          {
            en: "It was Elena's empanadas, the recipe from her grandmother. Mr. Brooks ate three of them without speaking.",
            ar: "كانت فطائر إيلينا المحشوة، الوصفة التي ورثتها عن جدتها. أكل السيد بروكس ثلاثاً منها من دون كلام.",
          },
          {
            who: "Mr. Brooks",
            en: "Young lady, these are better than anything across the street. I'll be back tomorrow, and I'm bringing my friends.",
            ar: "أيتها الشابة، هذه أفضل من أي شيء في الجهة المقابلة. سأعود غداً، وسأحضر أصدقائي.",
          },
          {
            en: "He kept his word. Every morning at eight, Mr. Brooks sat at the big table with a new friend: an old colleague, a neighbor, a former student.",
            ar: "وفى بكلمته. كل صباح في الثامنة، كان السيد بروكس يجلس إلى الطاولة الكبيرة مع صديق جديد: زميل قديم، أو جار، أو طالب سابق.",
          },
          {
            en: "Little by little, the empty chairs began to fill.",
            ar: "شيئاً فشيئاً، بدأت الكراسي الفارغة تمتلئ.",
          },
        ],
        question: {
          en: "Why did Mr. Brooks like the café?",
          ar: "لماذا أحبّ السيد بروكس المقهى؟",
          options: [
            {
              en: "The food reminded him of his grandmother's kitchen",
              ar: "الطعام ذكّره بمطبخ جدته",
            },
            { en: "It was very cheap", ar: "كان رخيصاً جداً" },
            { en: "It was next to his house", ar: "كان بجانب بيته" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "The Storm",
        titleAr: "العاصفة",
        lines: [
          {
            en: "In January, a terrible snowstorm hit the town. The electricity went out everywhere, and the roads closed for three days.",
            ar: "في يناير، ضربت عاصفة ثلجية شديدة البلدة. انقطعت الكهرباء في كل مكان، وأُغلقت الطرق ثلاثة أيام.",
          },
          {
            en: "The big coffee chain across the street closed immediately. Its beautiful sign went dark for the first time.",
            ar: "أغلقت سلسلة المقاهي الكبيرة في الجهة المقابلة فوراً. وانطفأت لافتتها الجميلة لأول مرة.",
          },
          {
            en: "But Elena's small kitchen had an old gas stove. She lit it, made a huge pot of soup, and opened the door.",
            ar: "لكن مطبخ إيلينا الصغير كان فيه موقد غاز قديم. أشعلته وصنعت قدراً ضخماً من الحساء وفتحت الباب.",
          },
          {
            who: "Elena",
            en: "Come in, everybody! It's warm here. Soup and coffee are free today.",
            ar: "ادخلوا جميعاً! الجو دافئ هنا. الحساء والقهوة مجانيان اليوم.",
          },
          {
            en: "All day, people came in out of the snow: old couples, tired nurses, children in thick coats, and even workers from the closed chain across the street.",
            ar: "طوال اليوم، دخل الناس من الثلج: أزواج مسنّون وممرضات متعبات وأطفال بمعاطف سميكة، وحتى عمال من السلسلة المغلقة في الجهة المقابلة.",
          },
          {
            en: "For two days, Elena did not sleep. She stayed in her tiny café, with the big table full of strangers who became neighbors.",
            ar: "لمدة يومين، لم تنم إيلينا. بقيت في مقهاها الصغير، والطاولة الكبيرة ممتلئة بغرباء صاروا جيراناً.",
          },
        ],
        question: {
          en: "What did Elena do during the storm?",
          ar: "ماذا فعلت إيلينا أثناء العاصفة؟",
          options: [
            {
              en: "She gave free soup and coffee to everybody",
              ar: "قدّمت الحساء والقهوة مجاناً للجميع",
            },
            { en: "She closed her café", ar: "أغلقت مقهاها" },
            { en: "She went home to sleep", ar: "ذهبت إلى البيت لتنام" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "A Line at Six",
        titleAr: "طابور عند السادسة",
        lines: [
          {
            en: "When the snow melted, Elena opened her café at six in the morning, as always. She almost dropped her keys.",
            ar: "حين ذاب الثلج، فتحت إيلينا مقهاها في السادسة صباحاً، كالعادة. وكادت تُسقط مفاتيحها.",
          },
          {
            en: "There was a line outside. It went down the street and around the corner.",
            ar: "كان هناك طابور في الخارج. امتد على طول الشارع وحول الزاوية.",
          },
          {
            en: "That winter, the people of the town had decided something: a café that opens its door in a storm deserves to be full.",
            ar: "في ذلك الشتاء، قرر أهل البلدة أمراً: المقهى الذي يفتح بابه في العاصفة يستحق أن يكون ممتلئاً.",
          },
          {
            en: 'Somebody left a note on the wall. Then another. Soon the whole wall was covered with small papers that said, "Thank you, Elena."',
            ar: "ترك أحدهم ملاحظة على الجدار. ثم آخر. وسرعان ما غطّت الجدار كله ورقات صغيرة كُتب عليها: «شكراً يا إيلينا».",
          },
          {
            who: "Noah",
            en: "Excuse me, are you hiring? I'm sixteen, and I'm a very fast learner.",
            ar: "عفواً، هل تحتاجين إلى موظفين؟ عمري ستة عشر عاماً، وأنا أتعلم بسرعة كبيرة.",
          },
          {
            who: "Elena",
            en: "Of course. Wash your hands, and I'll show you our recipes. This is a small café, but it has a very big table.",
            ar: "بالطبع. اغسل يديك وسأريك وصفاتنا. هذا مقهى صغير، لكن فيه طاولة كبيرة جداً.",
          },
        ],
        question: {
          en: "Why was there a line outside the café?",
          ar: "لماذا كان هناك طابور أمام المقهى؟",
          options: [
            {
              en: "The town remembered her kindness in the storm",
              ar: "تذكّرت البلدة لطفها أثناء العاصفة",
            },
            { en: "It was free coffee day", ar: "كان يوم القهوة المجانية" },
            { en: "The big chain was closed again", ar: "كانت السلسلة الكبيرة مغلقة مجدداً" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
    ],
    closing: {
      en: "What kind of café did Elena dream of from the start?",
      ar: "أي نوع من المقاهي حلمت به إيلينا منذ البداية؟",
      options: [
        { en: "A small one with a big table for everyone", ar: "مقهى صغير بطاولة كبيرة للجميع" },
        { en: "A big modern café with many tables", ar: "مقهى كبير وحديث بطاولات كثيرة" },
        { en: "A fast café open all night", ar: "مقهى سريع يفتح طوال الليل" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "survive",
        sentence: "She started to count how many weeks she could ___.",
        hintAr: "يصمد، ينجو.",
      },
      {
        word: "chain",
        sentence:
          "Across the street, a big coffee ___ had a long line of customers every morning, and a huge sign that never turned off.",
        hintAr: "سلسلة (متاجر أو مقاهٍ).",
      },
      {
        word: "stove",
        sentence: "But Elena's small kitchen had an old gas ___.",
        hintAr: "الموقد.",
      },
      {
        word: "electricity",
        sentence: "The ___ went out everywhere, and the roads closed for three days.",
        hintAr: "الكهرباء.",
      },
      {
        word: "snowstorm",
        sentence: "In January, a terrible ___ hit the town.",
        hintAr: "العاصفة الثلجية.",
      },
    ],
  },
];
