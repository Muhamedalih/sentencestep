import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1, one more scene at the step of the earlier sets — longer sentences, reported
 * speech, the past perfect where the story looks back, and nothing that reads like a lesson.
 * Written against everything already in the library (the passages, the Daily Lessons, the
 * Stories), so it repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const B1_PASSAGES_PART_5: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 10
  {
    slug: "the-town-clock",
    order: 10,
    level: "B1",
    tone: "inspiring",
    icon: "map",
    title: "The Town Clock",
    titleAr: "ساعة البلدة",
    summary: "For twenty-two years, Arthur wrote to the mayor every Monday about one small thing.",
    summaryAr: "طوال اثنتين وعشرين سنة، كتب آرثر إلى العمدة كل اثنين عن أمر صغير واحد.",
    cast: { Arthur: "calm-male", "Mayor Hayes": "zara", Josh: "russ" },
    sections: [
      {
        title: "Nine Minutes Fast",
        titleAr: "متقدمة تسع دقائق",
        lines: [
          {
            en: "The clock on Larkspur's town hall tower had always been nine minutes fast, and Arthur Finch, a retired watchmaker, could not bear it.",
            ar: "كانت الساعة على برج دار بلدية لاركسبر متقدمة تسع دقائق دائماً، أما آرثر فينش، صانع الساعات المتقاعد، فلم يستطع احتمال ذلك.",
          },
          {
            en: 'Every Monday for twenty-two years, he had written to the mayor. Each time, he had received the same printed card: "Thank you for your concern."',
            ar: "في كل اثنين طوال اثنتين وعشرين سنة كتب إلى العمدة. وفي كل مرة تلقى البطاقة المطبوعة نفسها: «شكراً لاهتمامك».",
          },
          {
            who: "Arthur",
            en: "A clock is a promise. If it lies, how can anyone keep an appointment?",
            ar: "الساعة وعد. فإذا كذبت، كيف يفي أحد بموعد؟",
          },
          {
            en: "His letters grew more ambitious every year: diagrams, a poem, a pie chart, and once a photograph of the clock next to his wristwatch.",
            ar: "ازدادت رسائله طموحاً كل عام: رسوم توضيحية، وقصيدة، ومخطط دائري، وذات مرة صورة للساعة بجانب ساعة معصمه.",
          },
          {
            en: 'The neighbors thought him charming, or at least harmless, and Josh, the young town reporter, called him "The Man Who Hates Nine Minutes."',
            ar: "رأى الجيران أنه لطيف، أو على الأقل غير مؤذٍ، وسمّاه جوش، مراسل البلدة الشاب، «الرجل الذي يكره تسع دقائق».",
          },
          {
            who: "Josh",
            en: "Mr. Finch, have you ever thought about giving up?",
            ar: "سيد فينش، هل فكرت يوماً في الاستسلام؟",
          },
          {
            who: "Arthur",
            en: "A man doesn't give up on the truth. He just writes it again, with better handwriting.",
            ar: "الرجل لا يتخلى عن الحقيقة. بل يكتبها من جديد، بخط أجمل.",
          },
        ],
        question: {
          en: "What did Arthur do every Monday for twenty-two years?",
          ar: "ماذا فعل آرثر كل اثنين طوال اثنتين وعشرين سنة؟",
          options: [
            { en: "He repaired the clock", ar: "أصلح الساعة" },
            { en: "He wrote a letter to the mayor", ar: "كتب رسالة إلى العمدة" },
            { en: "He wrote to the newspaper", ar: "كتب إلى الصحيفة" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
      {
        title: "A New Mayor",
        titleAr: "عمدة جديدة",
        lines: [
          {
            en: 'That spring, Carol Hayes became mayor. On her first evening in the office, she found a cardboard box in the corner, marked "Finch, A." It was full of letters.',
            ar: "في ذلك الربيع صارت كارول هيز عمدة. وفي مساء يومها الأول في المكتب وجدت في الزاوية صندوقاً من الكرتون كُتب عليه «فينش، آ.». كان مليئاً بالرسائل.",
          },
          {
            en: "She read until midnight. By the end, she was laughing, and then she wasn't. Nobody, she thought, had ever been so patient about something so small.",
            ar: "قرأت حتى منتصف الليل. وفي النهاية كانت تضحك، ثم لم تعد تضحك. لم يكن أحد، كما فكرت، بهذا الصبر على أمر بهذه الصغر.",
          },
          {
            who: "Mayor Hayes",
            en: "Twenty-two years of letters, and nobody wrote back. I'm fixing that clock.",
            ar: "اثنتان وعشرون سنة من الرسائل، ولم يرد عليه أحد. سأصلح تلك الساعة.",
          },
          {
            en: "The next Monday, a repairman climbed the tower with a toolbox and a thermos, and the whole town gathered in the square to watch, as if it were a rocket launch.",
            ar: "يوم الاثنين التالي صعد مصلح إلى البرج ومعه صندوق عدّة وقارورة شاي، وتجمّعت البلدة كلها في الساحة تشاهد، كأنه إطلاق صاروخ.",
          },
          {
            en: "At noon, the hands moved back nine minutes. The crowd cheered. Arthur, standing in the front row with his hat in his hands, was crying.",
            ar: "عند الظهر تراجعت العقارب تسع دقائق. هتف الحشد. وكان آرثر، واقفاً في الصف الأول وقبعته في يديه، يبكي.",
          },
          {
            who: "Arthur",
            en: "I never thought I'd live to see it. Right at last.",
            ar: "لم أتوقع أن أعيش حتى أراها. صحيحة أخيراً.",
          },
        ],
        question: {
          en: "Why did the new mayor decide to fix the clock?",
          ar: "لماذا قررت العمدة الجديدة إصلاح الساعة؟",
          options: [
            { en: "She was moved by Arthur's patience", ar: "تأثرت بصبر آرثر" },
            { en: "The tower was in danger", ar: "كان البرج في خطر" },
            { en: "Josh had asked her to", ar: "كان جوش قد طلب منها ذلك" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "Town Time",
        titleAr: "توقيت البلدة",
        lines: [
          {
            en: "By Wednesday, Larkspur was in trouble. Everyone had spent their whole lives setting their day by the tower, and nobody had noticed that the extra nine minutes were working for them.",
            ar: "بحلول الأربعاء كانت لاركسبر في ورطة. فقد قضى الجميع حياتهم يضبطون يومهم على البرج، ولم يلاحظ أحد أن الدقائق التسع الإضافية كانت تعمل لصالحهم.",
          },
          {
            en: "Workers who had always arrived early now arrived exactly on time, which in Larkspur felt like being late. The school principal said her students had never been so rushed.",
            ar: "العمال الذين اعتادوا الوصول مبكراً صاروا يصلون في الوقت تماماً، وهذا في لاركسبر يبدو كأنه تأخر. وقالت مديرة المدرسة إن طلابها لم يكونوا يوماً بهذا الاستعجال.",
          },
          {
            en: "The baker lost his calm morning line, and the postman lost his tea break. By Friday, a petition in the square had four hundred signatures.",
            ar: "فقد الخباز طابوره الهادئ الصباحي، وفقد ساعي البريد استراحة الشاي. وبحلول الجمعة كان في الساحة التماس عليه أربعمئة توقيع.",
          },
          {
            en: "It said, in capital letters: GIVE US BACK OUR NINE MINUTES.",
            ar: "وكتب فيه بأحرف كبيرة: أعيدوا لنا دقائقنا التسع.",
          },
          {
            who: "Josh",
            en: "Mr. Finch, you fixed the clock and broke the town. How does that feel?",
            ar: "سيد فينش، أصلحتَ الساعة وكسرتَ البلدة. كيف تشعر؟",
          },
          {
            who: "Arthur",
            en: "Terrible. Which is exactly why I want to look inside that tower.",
            ar: "فظيع. ولهذا بالذات أريد أن أنظر داخل ذلك البرج.",
          },
        ],
        question: {
          en: "What problem did the corrected clock cause?",
          ar: "ما المشكلة التي سببتها الساعة المصحّحة؟",
          options: [
            { en: "The tower began to lean", ar: "بدأ البرج يميل" },
            { en: "The bells stopped ringing", ar: "توقفت الأجراس عن الرنين" },
            {
              en: "People who used to arrive early now felt rushed",
              ar: "صار الذين اعتادوا الوصول مبكراً يشعرون بالاستعجال",
            },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "Inside the Tower",
        titleAr: "داخل البرج",
        lines: [
          {
            en: "On Saturday, Arthur, the mayor and Josh climbed the tower's two hundred and four steps, with Arthur stopping at every landing to explain the mechanism.",
            ar: "يوم السبت صعد آرثر والعمدة وجوش درجات البرج المئتين والأربع، وآرثر يتوقف عند كل بسطة ليشرح الآلية.",
          },
          {
            en: "Behind the main wheel, the mayor found something nobody had touched in a hundred years: a small brass box.",
            ar: "خلف العجلة الرئيسية وجدت العمدة شيئاً لم يلمسه أحد منذ مئة سنة: علبة نحاسية صغيرة.",
          },
          {
            en: "Inside was a folded sheet of paper, dated nineteen twenty-one and signed by the clockmaker, Samuel Ward.",
            ar: "في داخلها ورقة مطوية، مؤرخة بألف وتسعمئة وواحد وعشرين وموقّعة من صانع الساعة صموئيل وارد.",
          },
          {
            who: "Mayor Hayes",
            en: "I have set this clock nine minutes ahead on purpose. A town that is nine minutes early is never late. Whoever repairs it should first ask whether it is broken.",
            ar: "ضبطتُ هذه الساعة متقدمة تسع دقائق عن قصد. فالبلدة التي تسبق الوقت بتسع دقائق لا تتأخر أبداً. ومن يصلحها فليسأل أولاً إن كانت معطلة.",
          },
          {
            en: "For a long moment, nobody spoke. Far below, in the square, the town's bell rang the hour.",
            ar: "ساد صمت طويل. وفي الأسفل، في الساحة، دقّ جرس البلدة الساعة.",
          },
          {
            who: "Arthur",
            en: "Twenty-two years. A thousand and sixty letters, to fight a gift.",
            ar: "اثنتان وعشرون سنة. ألف وستون رسالة، لأحارب هدية.",
          },
          {
            who: "Josh",
            en: "Mr. Finch, I think I have my next headline.",
            ar: "سيد فينش، أظن أنني وجدت عنواني القادم.",
          },
        ],
        question: {
          en: "Why had the clock been set nine minutes fast?",
          ar: "لماذا كانت الساعة مضبوطة متقدمة تسع دقائق؟",
          options: [
            { en: "The mechanism had never worked properly", ar: "لم تعمل الآلية جيداً قط" },
            { en: "Nobody had ever checked it", ar: "لم يفحصها أحد قط" },
            {
              en: "The clockmaker wanted people to be early on purpose",
              ar: "أراد صانع الساعة أن يصل الناس مبكرين عن قصد",
            },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Keeper of the Clock",
        titleAr: "حارس الساعة",
        lines: [
          {
            en: "The town voted that evening. By four hundred and eleven votes to nine, Larkspur decided to get its nine minutes back.",
            ar: "صوّتت البلدة في ذلك المساء. بأربعمئة وإحدى عشرة صوتاً مقابل تسعة، قررت لاركسبر استعادة دقائقها التسع.",
          },
          {
            en: "On Sunday, the repairman moved the hands forward again, and the cheering was louder than the first time.",
            ar: "يوم الأحد أعاد المصلح العقارب إلى الأمام، وكان الهتاف أعلى من المرة الأولى.",
          },
          {
            en: 'Under the clock, the mayor placed a small plaque: "Larkspur Time: Nine Minutes Early, Since Nineteen Twenty-One." It had a second line: "Keeper of the Clock: Arthur Finch."',
            ar: "وتحت الساعة وضعت العمدة لوحة نحاسية صغيرة: «توقيت لاركسبر: متقدم تسع دقائق، منذ ألف وتسعمئة وواحد وعشرين». وكان فيها سطر ثانٍ: «حارس الساعة: آرثر فينش».",
          },
          {
            en: 'Josh\'s article came out on Monday under the headline "The Man Who Fixed the Clock by Trying to Fix It." Every shop in town pinned it to the wall.',
            ar: "ظهر مقال جوش يوم الاثنين تحت عنوان «الرجل الذي أصلح الساعة بمحاولة إصلاحها». وعلّقه كل متجر في البلدة على الجدار.",
          },
          {
            en: "Arthur still writes to the mayor every Monday. These days, the letter never changes, and it has only one sentence.",
            ar: "ما زال آرثر يكتب إلى العمدة كل اثنين. وهذه الأيام لا تتغير الرسالة، وفيها جملة واحدة فقط.",
          },
          {
            en: 'It says: "Thank you for your patience."',
            ar: "تقول: «شكراً لصبرك».",
          },
        ],
        question: {
          en: "What does the last sentence of the story suggest?",
          ar: "ماذا توحي الجملة الأخيرة من القصة؟",
          options: [
            {
              en: "He now writes to thank the mayor instead of complaining",
              ar: "صار يكتب الآن ليشكر العمدة بدلاً من أن يشتكي",
            },
            { en: "He still believes the clock is wrong", ar: "ما زال يعتقد أن الساعة خاطئة" },
            { en: "He has stopped writing to the mayor", ar: "توقف عن الكتابة إلى العمدة" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "What is the main lesson of the story?",
      ar: "ما الدرس الرئيس في القصة؟",
      options: [
        { en: "Old clocks can never be trusted", ar: "لا يمكن الوثوق بالساعات القديمة أبداً" },
        {
          en: "Something that looks like a mistake may have a good reason behind it",
          ar: "ما يبدو خطأً قد يكون وراءه سبب وجيه",
        },
        {
          en: "New mayors should change old habits",
          ar: "على العمد الجدد أن يغيّروا العادات القديمة",
        },
      ],
      answer: 1,
    },
    words: [
      {
        word: "watchmaker",
        sentence: "Arthur Finch, a retired ___, could not bear it.",
        hintAr: "صانع ساعات.",
      },
      {
        word: "mayor",
        sentence: "he had written to the ___.",
        hintAr: "عمدة.",
      },
      {
        word: "mechanism",
        sentence: "with Arthur stopping at every landing to explain the ___.",
        hintAr: "آلية.",
      },
      {
        word: "petition",
        sentence: "By Friday, a ___ in the square had four hundred signatures.",
        hintAr: "التماس.",
      },
      {
        word: "plaque",
        sentence: "Under the clock, the mayor placed a small ___:",
        hintAr: "لوحة تذكارية.",
      },
      {
        word: "patience",
        sentence: "Thank you for your ___.",
        hintAr: "صبر.",
      },
    ],
  },
];
