import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B2, fifth set — the same step as the others: less common words (skeptical,
 * accommodate, overwhelming), sentences that carry more than one idea, and questions that
 * ask what something means or implies rather than what happened. Written against
 * everything already in the library (the passages, the Daily Lessons, the Stories), so it
 * repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const B2_PASSAGES_PART_5: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 10
  {
    slug: "the-quiet-hour",
    order: 10,
    level: "B2",
    tone: "inspiring",
    icon: "heart",
    title: "The Quiet Hour",
    titleAr: "الساعة الهادئة",
    summary: "Every Tuesday at six, the store turned down its lights, its music and its beeps.",
    summaryAr: "كل ثلاثاء في السادسة، كان المتجر يخفّض أضواءه وموسيقاه وصفاراته.",
    cast: { Owen: "russ", "Ms. Lowell": "zara", Karen: "autumn" },
    sections: [
      {
        title: "The Memo",
        titleAr: "المذكرة",
        lines: [
          {
            en: 'The memo appeared on the staff board on Monday: "Starting this Tuesday, between six and seven in the evening, the store will hold a Quiet Hour."',
            ar: "ظهرت المذكرة على لوحة الموظفين يوم الاثنين: «اعتباراً من هذا الثلاثاء، بين السادسة والسابعة مساءً، سيقيم المتجر ساعة هادئة».",
          },
          {
            en: "The lights would be dimmed, the music and announcements turned off, the scanner beeps lowered. Owen read it three times, hoping it said something else.",
            ar: "ستُخفَّض الإضاءة، وتُطفأ الموسيقى والإعلانات، ويُخفَّض صفير الماسح. قرأها أوين ثلاث مرات، آملاً أن تقول شيئاً آخر.",
          },
          {
            en: "Tuesday evening was his busiest hour. In eight years at the register, he had learned that a loud, bright, crowded store was a store making money.",
            ar: "كان مساء الثلاثاء أكثر ساعاته انشغالاً. وطوال ثماني سنوات عند الصندوق تعلّم أن المتجر الصاخب المضيء المزدحم هو متجر يجني المال.",
          },
          {
            who: "Owen",
            en: "Ms. Lowell, with respect, we'll lose a fortune. Nobody comes to a supermarket for silence.",
            ar: "سيدة لويل، مع كل احترامي، سنخسر ثروة. لا أحد يأتي إلى السوبرماركت من أجل الصمت.",
          },
          {
            who: "Ms. Lowell",
            en: "Some people don't come at all, Owen, because they can't bear the noise. I'd like to know how many.",
            ar: "بعض الناس لا يأتون أبداً يا أوين لأنهم لا يطيقون الضجيج. أودّ أن أعرف كم عددهم.",
          },
          {
            en: "Owen nodded the way a skeptical man nods when he isn't persuaded, and he expected an empty hour that would prove him right.",
            ar: "أومأ أوين كما يومئ رجل متشكك حين لا يقتنع، وتوقع ساعة فارغة تثبت أنه على حق.",
          },
        ],
        question: {
          en: "What can we infer about Owen's attitude toward the Quiet Hour?",
          ar: "ماذا نستنتج عن موقف أوين من الساعة الهادئة؟",
          options: [
            { en: "He was enthusiastic about the idea", ar: "كان متحمساً للفكرة" },
            {
              en: "He doubted that it would be worth the lost sales",
              ar: "كان يشك في أنها تستحق المبيعات الضائعة",
            },
            { en: "He was afraid of Ms. Lowell", ar: "كان يخاف من السيدة لويل" },
            { en: "He had suggested it himself", ar: "كان هو من اقترحها" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "The First Tuesday",
        titleAr: "أول ثلاثاء",
        lines: [
          {
            en: "At six o'clock, the store changed. The glare softened to a warm dusk, and without music the building revealed a sound nobody had noticed: the hum of the refrigerators.",
            ar: "في السادسة تغيّر المتجر. خفّ الوهج إلى شفق دافئ، وبلا موسيقى كشف المبنى صوتاً لم يلاحظه أحد: أزيز الثلاجات.",
          },
          {
            en: "For twenty minutes, Owen counted three customers and checked his watch four times. Every minute of silence felt like a small victory for him.",
            ar: "طوال عشرين دقيقة عدّ أوين ثلاثة زبائن ونظر إلى ساعته أربع مرات. وكانت كل دقيقة صمت تبدو له انتصاراً صغيراً.",
          },
          {
            en: "Then a woman and a boy of about nine stopped at the entrance. The boy wore thick ear defenders, and for a long moment neither of them moved, as if testing the air.",
            ar: "ثم توقفت عند المدخل امرأة وصبي في نحو التاسعة. كان الصبي يضع واقيين سميكين للأذنين، ولوقت طويل لم يتحرك أي منهما، كأنهما يختبران الهواء.",
          },
          {
            en: "The boy's shoulders, which had been raised toward his ears, slowly came down.",
            ar: "ثم هبطت كتفا الصبي ببطء بعد أن كانتا مرفوعتين نحو أذنيه.",
          },
          {
            who: "Karen",
            en: "It's quiet. Eli, it's actually quiet.",
            ar: "إنه هادئ. إيلي، إنه هادئ فعلاً.",
          },
          {
            en: "She said it the way people announce good news they are afraid to believe.",
            ar: "قالتها كما يعلن الناس خبراً سارّاً يخشون تصديقه.",
          },
        ],
        question: {
          en: "What does the change in the boy's shoulders suggest?",
          ar: "ماذا يوحي التغيّر في كتفي الصبي؟",
          options: [
            { en: "He was bored", ar: "كان يشعر بالملل" },
            { en: "He was tired from the walk", ar: "كان متعباً من المشي" },
            { en: "The store had become comfortable for him", ar: "صار المتجر مريحاً له" },
            { en: "He was afraid of the cashier", ar: "كان يخاف من أمين الصندوق" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Eli's List",
        titleAr: "قائمة إيلي",
        lines: [
          {
            en: "Owen watched them move along the shelves. Eli read every label in a low voice, put the boxes he wanted into the basket and returned the others to exactly the same place.",
            ar: "راقب أوين وهما تسيران بين الرفوف. كان إيلي يقرأ كل ملصق بصوت خافت، ويضع في السلة العلب التي يريدها، ويعيد الأخرى إلى مكانها بالضبط.",
          },
          {
            en: "At the register, Owen scanned each item slowly, holding the scanner as if it were a sleeping animal. The beep was almost silent.",
            ar: "عند الصندوق مرّر أوين كل صنف ببطء، ممسكاً بالماسح كأنه حيوان نائم. وكان الصفير شبه صامت.",
          },
          {
            who: "Karen",
            en: "Normally a store is overwhelming for him: the lights, the music, the announcements, all at once. So we shop online, or I come alone at five in the morning.",
            ar: "في العادة يكون المتجر خانقاً له: الأضواء والموسيقى والإعلانات كلها دفعة واحدة. لذلك نتسوّق عبر الإنترنت، أو آتي وحدي في الخامسة صباحاً.",
          },
          {
            who: "Karen",
            en: "Today, for the first time, Eli chose the groceries himself. Do you know what that means to us?",
            ar: "اليوم، للمرة الأولى، اختار إيلي البقالة بنفسه. هل تعرف ماذا يعني هذا لنا؟",
          },
          {
            en: "Owen did not answer at once. For eight years he had thought of the noise as the sound of business, and he had never asked whom it kept out.",
            ar: "لم يجب أوين فوراً. فطوال ثماني سنوات كان يظن الضجيج صوت التجارة، ولم يسأل قط عمّن يُبعده.",
          },
          {
            who: "Owen",
            en: "I think I'm beginning to know.",
            ar: "أظن أنني بدأت أعرف.",
          },
        ],
        question: {
          en: "Why had Karen never taken Eli into the store before?",
          ar: "لماذا لم تأخذ كارين إيلي إلى المتجر من قبل؟",
          options: [
            { en: "The prices were too high", ar: "كانت الأسعار مرتفعة جداً" },
            { en: "She preferred shopping online", ar: "كانت تفضّل التسوق عبر الإنترنت" },
            { en: "She had not known the store existed", ar: "لم تكن تعرف بوجود المتجر" },
            {
              en: "The usual noise and lights were too overwhelming for Eli",
              ar: "كان الضجيج والأضواء المعتادة خانقة لإيلي",
            },
          ],
          answer: 3,
          evidence: 2,
        },
      },
      {
        title: "The Total",
        titleAr: "المجموع",
        lines: [
          {
            en: "That evening, the Quiet Hour's sales were lower than any other Tuesday hour. Ms. Lowell looked at the numbers without any visible disappointment.",
            ar: "في تلك الأمسية كانت مبيعات الساعة الهادئة أقل من أي ساعة ثلاثاء أخرى. نظرت السيدة لويل إلى الأرقام دون أي خيبة ظاهرة.",
          },
          {
            who: "Owen",
            en: "I told you we'd lose money.",
            ar: "قلت لك إننا سنخسر مالاً.",
          },
          {
            who: "Ms. Lowell",
            en: "You did. And Mrs. Brennan told me she's bringing four friends next week. Both of those things are true.",
            ar: "فعلتَ. وقالت لي السيدة برينان إنها ستحضر أربع صديقات الأسبوع القادم. وكلا الأمرين صحيح.",
          },
          {
            en: "Owen thought about the boy's shoulders. He thought about a woman who had shopped at five in the morning, alone, for years, so that her son would not have to stand somewhere that hurt.",
            ar: "فكّر أوين في كتفي الصبي. وفكّر في امرأة تسوّقت في الخامسة صباحاً وحدها سنين طويلة كي لا يضطر ابنها إلى الوقوف في مكان يؤلمه.",
          },
          {
            who: "Ms. Lowell",
            en: "I never promised it would make money, Owen. I promised it would make sense.",
            ar: "لم أَعِد قط بأنها ستجلب المال يا أوين. وعدتُ بأن يكون لها معنى.",
          },
          {
            en: "Owen said nothing. He realized that he had been counting the wrong things: customers per minute instead of people who could finally come.",
            ar: "لم يقل أوين شيئاً. أدرك أنه كان يعدّ الأشياء الخاطئة: الزبائن في الدقيقة بدلاً من الناس الذين صار بوسعهم أخيراً أن يأتوا.",
          },
        ],
        question: {
          en: 'What does Ms. Lowell mean by "I promised it would make sense"?',
          ar: "ماذا تعني السيدة لويل بقولها «وعدتُ بأن يكون لها معنى»؟",
          options: [
            {
              en: "The hour would have a worthwhile purpose, even if it earned less",
              ar: "سيكون للساعة غرض يستحق العناء، حتى لو أدّت إلى أرباح أقل",
            },
            {
              en: "The sales figures would be easy to explain",
              ar: "ستكون أرقام المبيعات سهلة الشرح",
            },
            {
              en: "Customers would understand the new schedule",
              ar: "سيفهم الزبائن الجدول الجديد",
            },
            {
              en: "The store would earn more than before",
              ar: "سيربح المتجر أكثر من قبل",
            },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "Six Months Later",
        titleAr: "بعد ستة أشهر",
        lines: [
          {
            en: "Six months later, a line formed outside the store at ten to six every Tuesday: families, couples and a retired man who said he could finally hear his own thoughts in a supermarket.",
            ar: "بعد ستة أشهر صار يتشكل طابور خارج المتجر قبل السادسة بعشر دقائق كل ثلاثاء: عائلات وأزواج ورجل متقاعد قال إنه يستطيع أخيراً أن يسمع أفكاره الخاصة في سوبرماركت.",
          },
          {
            en: "Owen ran the hour himself now. He trained new staff to accommodate whatever a customer needed, and he added one rule: nobody stands behind a customer who is still deciding.",
            ar: "صار أوين يدير الساعة بنفسه. دربّ الموظفين الجدد على مراعاة ما يحتاجه كل زبون، وأضاف قاعدة واحدة: لا يقف أحد خلف زبون ما زال يقرر.",
          },
          {
            en: "The hour's sales rose, slowly and then faster, until they matched the busiest hour of the week. Ms. Lowell, who never mentioned it, simply stopped checking.",
            ar: "ارتفعت مبيعات الساعة ببطء ثم أسرع، حتى ساوت أكثر ساعات الأسبوع ازدحاماً. أما السيدة لويل، التي لم تأتِ على ذكر ذلك قط، فقد كفّت ببساطة عن المراجعة.",
          },
          {
            en: "Every Tuesday at six, before the lights went down, Owen walked to the front and turned off the music himself. It had become the part of the job he liked best.",
            ar: "كل ثلاثاء في السادسة، قبل أن تخفت الأضواء، كان أوين يمشي إلى المقدمة ويطفئ الموسيقى بنفسه. وصار ذلك الجزء الذي يحبه أكثر في عمله.",
          },
        ],
        question: {
          en: "What does Owen's habit of turning off the music himself show?",
          ar: "ماذا تُظهر عادة أوين في إطفاء الموسيقى بنفسه؟",
          options: [
            { en: "He wanted to save electricity", ar: "أراد توفير الكهرباء" },
            {
              en: "He now treated the Quiet Hour as something of his own",
              ar: "صار يعامل الساعة الهادئة كأنها مشروعه الخاص",
            },
            { en: "He was following Ms. Lowell's orders", ar: "كان ينفذ أوامر السيدة لويل" },
            { en: "He disliked the music", ar: "كان يكره الموسيقى" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "How did Owen's view of the store's noise change over the story?",
      ar: "كيف تغيّرت نظرة أوين إلى ضجيج المتجر على مدى القصة؟",
      options: [
        { en: "He began to prefer an even louder store", ar: "بدأ يفضّل متجراً أكثر صخباً" },
        {
          en: "He stopped caring whether the store made money",
          ar: "كفّ عن الاهتمام بما إذا كان المتجر يربح",
        },
        { en: "He came to dislike his job", ar: "صار يكره عمله" },
        {
          en: "He realized that what he took for the sound of business was keeping some people out",
          ar: "أدرك أن ما كان يحسبه صوت التجارة يُبعد بعض الناس",
        },
      ],
      answer: 3,
    },
    words: [
      {
        word: "skeptical",
        sentence: "Owen nodded the way a ___ man nods when he isn't persuaded",
        hintAr: "متشكّك.",
      },
      {
        word: "scanner",
        sentence: "Owen scanned each item slowly, holding the ___ as if it were a sleeping animal.",
        hintAr: "ماسح ضوئي.",
      },
      {
        word: "dusk",
        sentence: "The glare softened to a warm ___",
        hintAr: "شفق.",
      },
      {
        word: "hum",
        sentence: "the ___ of the refrigerators.",
        hintAr: "أزيز.",
      },
      {
        word: "overwhelming",
        sentence: "Normally a store is ___ for him",
        hintAr: "خانق، يفوق الاحتمال.",
      },
      {
        word: "accommodate",
        sentence: "He trained new staff to ___ whatever a customer needed",
        hintAr: "يراعي، يوفّر ما يلائم.",
      },
    ],
  },
];
