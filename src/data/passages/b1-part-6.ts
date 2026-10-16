import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1, one more scene at the step of the earlier sets — longer sentences, reported
 * speech, the past perfect where the story looks back, and nothing that reads like a lesson.
 * Written against everything already in the library (the passages, the Daily Lessons, the
 * Stories), so it repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const B1_PASSAGES_PART_6: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 11
  {
    slug: "a-tour-for-one",
    order: 11,
    level: "B1",
    tone: "funny",
    icon: "map",
    title: "A Tour for One",
    titleAr: "جولة لشخص واحد",
    summary: "Leo had memorized the script. His only customer had lived the story.",
    summaryAr: "كان ليو قد حفظ النص عن ظهر قلب. لكن زبونته الوحيدة كانت قد عاشت الحكاية.",
    cast: { Leo: "russ", "Mrs. Alvarez": "autumn", "Mr. Kane": "calm-male" },
    sections: [
      {
        title: "The Whole Group",
        titleAr: "المجموعة كلها",
        lines: [
          {
            en: "Leo Marsh had memorized the whole script of the Old Town Walk: forty minutes of dates, architects and jokes.",
            ar: "كان ليو مارش قد حفظ عن ظهر قلب نص «جولة المدينة القديمة» كله: أربعين دقيقة من التواريخ والمعماريين والنكات.",
          },
          {
            en: 'His boss, Mr. Kane, had given him one rule: smile, speak slowly and never say "I don\'t know."',
            ar: "وكان رئيسه، السيد كين، قد أعطاه قاعدة واحدة: ابتسم، وتكلم ببطء، ولا تقل «لا أعرف» أبداً.",
          },
          {
            en: "On Saturday morning he waited at the fountain, ready to charm a crowd. At ten o'clock, exactly one person arrived.",
            ar: "صباح السبت انتظر عند النافورة، مستعداً لإبهار حشد. وفي العاشرة تماماً وصل شخص واحد فقط.",
          },
          {
            en: "She was a small woman in a green coat, with a folding stool under one arm, and she looked about seventy-eight.",
            ar: "كانت امرأة صغيرة الحجم بمعطف أخضر، تحمل كرسياً قابلاً للطي تحت ذراعها، وبدت في نحو الثامنة والسبعين.",
          },
          {
            who: "Leo",
            en: "Welcome to the group, madam! You are, in fact, the whole group.",
            ar: "أهلاً بكِ في المجموعة يا سيدتي! أنتِ، في الواقع، المجموعة كلها.",
          },
          {
            who: "Mrs. Alvarez",
            en: "Don't worry, dear. I'm used to arriving early and being the only one. My name is Rosa.",
            ar: "لا تقلق يا عزيزي. أنا معتادة على الوصول مبكرة وعلى أن أكون الوحيدة. اسمي روزا.",
          },
        ],
        question: {
          en: "Who joined Leo's first tour?",
          ar: "من انضم إلى جولة ليو الأولى؟",
          options: [
            { en: "A whole crowd of tourists", ar: "حشد كامل من السياح" },
            { en: "Two friends of Mr. Kane", ar: "صديقان للسيد كين" },
            { en: "Only one elderly woman", ar: "امرأة مسنّة واحدة فقط" },
          ],
          answer: 2,
          evidence: 2,
        },
      },
      {
        title: "A Small Correction",
        titleAr: "تصحيح صغير",
        lines: [
          {
            en: "Leo began at the fountain, as the script said: it had been built in eighteen ninety by the famous architect Julian Hale.",
            ar: "بدأ ليو عند النافورة كما يقول النص: لقد بُنيت عام ألف وثمانمئة وتسعين على يد المعماري الشهير جوليان هيل.",
          },
          {
            who: "Mrs. Alvarez",
            en: "Eighteen ninety-four, dear. And Mr. Hale never saw it. My grandfather laid the third stone from the left.",
            ar: "ألف وثمانمئة وأربعة وتسعون يا عزيزي. والسيد هيل لم يرها قط. جدي هو من وضع الحجر الثالث من اليسار.",
          },
          {
            en: "Leo smiled politely and moved on to the bakery, where, according to the script, a fire had destroyed everything in nineteen fifty-two.",
            ar: "ابتسم ليو بأدب وانتقل إلى المخبز، حيث دمّر حريق كل شيء عام ألف وتسعمئة واثنين وخمسين، بحسب النص.",
          },
          {
            who: "Mrs. Alvarez",
            en: "Nineteen fifty-one. It was a Tuesday. We ate the burned bread for a week, and it was delicious.",
            ar: "ألف وتسعمئة وواحد وخمسون. كان يوم ثلاثاء. أكلنا الخبز المحروق أسبوعاً، وكان لذيذاً.",
          },
          {
            en: "By the fourth stop, Leo had stopped reciting. He was walking beside her with his script folded in his pocket, asking questions.",
            ar: "عند المحطة الرابعة كان ليو قد كفّ عن الترديد. صار يمشي بجانبها ونصه مطويّ في جيبه، ويطرح الأسئلة.",
          },
          {
            who: "Leo",
            en: "Mrs. Alvarez, how do you know all this?",
            ar: "سيدة ألفاريز، كيف تعرفين كل هذا؟",
          },
          {
            who: "Mrs. Alvarez",
            en: "I was born in that house, dear. Which stop is next?",
            ar: "وُلدتُ في ذلك البيت يا عزيزي. أي محطة تالية؟",
          },
        ],
        question: {
          en: "Why was Mrs. Alvarez able to correct Leo's script?",
          ar: "لماذا استطاعت السيدة ألفاريز تصحيح نص ليو؟",
          options: [
            {
              en: "She had lived in the old town all her life",
              ar: "كانت قد عاشت في المدينة القديمة طوال حياتها",
            },
            { en: "She had written the script herself", ar: "كانت قد كتبت النص بنفسها" },
            { en: "She worked for another tour company", ar: "كانت تعمل لدى شركة جولات أخرى" },
          ],
          answer: 0,
          evidence: 6,
        },
      },
      {
        title: "The Whispering Corner",
        titleAr: "الركن الهامس",
        lines: [
          {
            en: "At the end of the market arcade, she stopped under a curved stone ceiling and pointed to a corner.",
            ar: "في نهاية رواق السوق توقفت تحت سقف حجري مقوّس وأشارت إلى ركن.",
          },
          {
            who: "Mrs. Alvarez",
            en: "Stand there, face the wall and wait.",
            ar: "قف هناك، وواجه الجدار، وانتظر.",
          },
          {
            en: "She walked slowly to the opposite corner, thirty feet away. Leo felt ridiculous, a grown man facing a wall in a public arcade.",
            ar: "مشت ببطء إلى الركن المقابل على بعد ثلاثين قدماً. شعر ليو بالسخافة: رجل بالغ يواجه جداراً في رواق عام.",
          },
          {
            en: 'Then a whisper reached him, as clear as if she were standing beside him: "Welcome to my city."',
            ar: "ثم وصله همس، واضحاً كأنها تقف بجانبه: «أهلاً بك في مدينتي».",
          },
          {
            who: "Leo",
            en: "How is that possible?",
            ar: "كيف هذا ممكن؟",
          },
          {
            who: "Mrs. Alvarez",
            en: "The curve carries the sound along the wall. My husband proposed to me from that corner. I said yes to a wall.",
            ar: "الانحناء يحمل الصوت على طول الجدار. زوجي خطبني من ذلك الركن. وقلتُ نعم لجدار.",
          },
          {
            en: "Leo realized that this was not in any script, and that no script could have held it.",
            ar: "أدرك ليو أن هذا ليس في أي نص، وأن أي نص لم يكن ليتسع له.",
          },
        ],
        question: {
          en: "How did Leo hear her from thirty feet away?",
          ar: "كيف سمع ليو صوتها من مسافة ثلاثين قدماً؟",
          options: [
            { en: "She spoke through a microphone", ar: "كانت تتكلم عبر ميكروفون" },
            {
              en: "The curved ceiling carried her whisper along the wall",
              ar: "حمل السقف المقوّس همسها على طول الجدار",
            },
            { en: "She was standing right next to him", ar: "كانت تقف بجانبه تماماً" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Quality Control",
        titleAr: "رقابة الجودة",
        lines: [
          {
            en: "Back at the fountain, Leo was nervous. He had not said one sentence of the script for an hour, and his only customer had talked more than he had.",
            ar: "عند عودتهما إلى النافورة كان ليو متوتراً. لم يقل جملة واحدة من النص طوال ساعة، وكانت زبونته الوحيدة قد تكلمت أكثر منه.",
          },
          {
            en: "Behind a column stood Mr. Kane, who had been following them at a distance with a notebook. Leo closed his eyes and waited to be fired.",
            ar: "خلف عمود وقف السيد كين، الذي كان يتبعهما من بعيد ومعه دفتر. أغمض ليو عينيه وانتظر أن يُطرد.",
          },
          {
            who: "Mr. Kane",
            en: "Forty years in this business, and I have never heard anyone make that arcade whisper like that.",
            ar: "أربعون سنة في هذا العمل، ولم أسمع أحداً يجعل ذلك الرواق يهمس هكذا.",
          },
          {
            who: "Leo",
            en: "I didn't, sir. She did. I'm sorry. I abandoned the script.",
            ar: "لم أفعل يا سيدي. هي من فعلت. أنا آسف. تخلّيت عن النص.",
          },
          {
            who: "Mr. Kane",
            en: "The script is dull, Leo. I wrote it.",
            ar: "النص مملّ يا ليو. أنا من كتبته.",
          },
          {
            en: "He turned to Mrs. Alvarez and asked, with surprising shyness, whether she had ever thought of leading tours herself.",
            ar: "التفت إلى السيدة ألفاريز وسألها، بخجل مفاجئ، إن كانت قد فكرت يوماً في قيادة الجولات بنفسها.",
          },
          {
            who: "Mrs. Alvarez",
            en: "I've waited fifty years for someone to ask me about this city. Saturdays at ten, and I bring my own stool.",
            ar: "انتظرتُ خمسين سنة أن يسألني أحد عن هذه المدينة. أيام السبت في العاشرة، وأحضر كرسيي بنفسي.",
          },
        ],
        question: {
          en: "Why did Leo expect to be fired?",
          ar: "لماذا توقع ليو أن يُطرد؟",
          options: [
            { en: "He had abandoned the script", ar: "كان قد تخلّى عن النص" },
            { en: "He had arrived late", ar: "كان قد وصل متأخراً" },
            { en: "He had lost his only customer", ar: "كان قد فقد زبونته الوحيدة" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Two Names on the Sign",
        titleAr: "اسمان على اللافتة",
        lines: [
          {
            en: 'The following Saturday, a new sign stood beside the fountain: "Old Town Walk, with Leo and Mrs. Alvarez. Ten o\'clock."',
            ar: "في السبت التالي وقفت لافتة جديدة بجانب النافورة: «جولة المدينة القديمة، مع ليو والسيدة ألفاريز. العاشرة».",
          },
          {
            en: "Nineteen people came. By the end of the month, the tour was sold out six weeks ahead, and visitors said they had never heard the real city before.",
            ar: "جاء تسعة عشر شخصاً. وبنهاية الشهر نفدت تذاكر الجولة قبل ستة أسابيع، وقال الزوار إنهم لم يسمعوا المدينة الحقيقية من قبل.",
          },
          {
            en: "Mrs. Alvarez told the stories, and Leo carried the stool and, more and more, the questions.",
            ar: "كانت السيدة ألفاريز تروي الحكايات، وكان ليو يحمل الكرسي، ويحمل أكثر فأكثر الأسئلة.",
          },
          {
            en: "Nobody asked about dates anymore. They asked what had happened in the bakery on that Tuesday, and she was always happy to tell them.",
            ar: "لم يعد أحد يسأل عن التواريخ. صاروا يسألون عمّا حدث في المخبز في ذلك الثلاثاء، وكانت تسعد دائماً بأن تخبرهم.",
          },
          {
            en: 'Leo kept the first page of the script in his wallet. On the back he had crossed out Mr. Kane\'s rule and written a new one: "Ask Mrs. Alvarez."',
            ar: "احتفظ ليو بالصفحة الأولى من النص في محفظته. وعلى ظهرها شطب قاعدة السيد كين وكتب قاعدة جديدة: «اسأل السيدة ألفاريز».",
          },
        ],
        question: {
          en: "What does Leo's new rule suggest?",
          ar: "ماذا توحي قاعدة ليو الجديدة؟",
          options: [
            {
              en: "He now trusts memorized facts more than people",
              ar: "صار يثق بالحقائق المحفوظة أكثر من الناس",
            },
            { en: "He wants to hire more guides", ar: "يريد أن يوظف مزيداً من المرشدين" },
            {
              en: "He has learned that a person's memories can teach more than a script",
              ar: "تعلّم أن ذكريات شخص ما قد تعلّم أكثر من نص",
            },
          ],
          answer: 2,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What does the story suggest about learning the history of a place?",
      ar: "ماذا توحي القصة عن تعلّم تاريخ مكان ما؟",
      options: [
        {
          en: "Living memories can teach what no script can",
          ar: "الذكريات الحية قد تعلّم ما لا يعلّمه أي نص",
        },
        { en: "Scripts are always more accurate than people", ar: "النصوص أدق دائماً من الناس" },
        { en: "Elderly people should not lead tours", ar: "لا ينبغي أن يقود المسنّون الجولات" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "memorized",
        sentence: "Leo Marsh had ___ the whole script of the Old Town Walk",
        hintAr: "حفظ عن ظهر قلب.",
      },
      {
        word: "stool",
        sentence: "with a folding ___ under one arm",
        hintAr: "كرسي بلا ظهر.",
      },
      {
        word: "architect",
        sentence: "it had been built in eighteen ninety by the famous ___ Julian Hale.",
        hintAr: "مهندس معماري.",
      },
      {
        word: "arcade",
        sentence: "At the end of the market ___, she stopped under a curved stone ceiling",
        hintAr: "رواق مسقوف.",
      },
      {
        word: "whisper",
        sentence: "Then a ___ reached him, as clear as if she were standing beside him",
        hintAr: "همس.",
      },
      {
        word: "script",
        sentence: "The ___ is dull, Leo.",
        hintAr: "نص مكتوب.",
      },
    ],
  },
];
