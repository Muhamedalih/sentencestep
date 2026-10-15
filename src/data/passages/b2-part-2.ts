import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B2, second half — the same step as the first: less common words
 * (haggle, interpreter, rubble, lease), sentences that carry more than one idea,
 * and questions that ask what something means rather than what happened. Each
 * was written against everything already in the library (the passages, the Daily
 * Lessons, the Stories) so it repeats none of them
 * (see scripts/check-passage-duplicates.ts).
 */

export const B2_PASSAGES_PART_2: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 4
  {
    slug: "final-offer",
    order: 4,
    level: "B2",
    tone: "funny",
    icon: "wallet",
    title: "Final Offer",
    titleAr: "العرض الأخير",
    summary: "Dana had three rules for flea markets. The vendor had only one.",
    summaryAr:
      "كانت لدى دانا ثلاث قواعد لأسواق الأشياء المستعملة. وكانت لدى البائع قاعدة واحدة فقط.",
    cast: { Dana: "zara", "Mr. Kowalski": "calm-male", Neil: "russ" },
    sections: [
      {
        title: "Three Rules",
        titleAr: "ثلاث قواعد",
        lines: [
          {
            en: "Dana had three rules for flea markets: never accept the first price, always walk away at least once, and never, under any circumstances, look interested.",
            ar: "كانت لدى دانا ثلاث قواعد لأسواق الأشياء المستعملة: لا تقبلي السعر الأول أبداً، وانصرفي مرة واحدة على الأقل، ولا تبدي اهتماماً أبداً، مهما كانت الظروف.",
          },
          {
            en: "She had been practicing for fifteen years, and her friends had stopped coming with her. It was embarrassing to watch a grown woman argue about one dollar for twenty minutes.",
            ar: "كانت تمارس هذا منذ خمس عشرة سنة، وقد كفّ أصدقاؤها عن مرافقتها. فمن المحرج أن تشاهد امرأة بالغة تجادل حول دولار واحد عشرين دقيقة.",
          },
          {
            en: "On a gray Saturday, she spotted it between a box of old keys and a plastic clown: a brass carriage clock, polished until it shone, with a tag that said two hundred dollars.",
            ar: "في يوم سبت رمادي لمحته بين صندوق مفاتيح قديمة ومهرّج بلاستيكي: ساعة نحاسية قديمة الطراز، مصقولة حتى تلمع، عليها بطاقة كُتب فيها مئتا دولار.",
          },
          {
            who: "Neil",
            en: "Don't even think about it. That's an antique. Those cost a fortune.",
            ar: "لا تفكري في الأمر حتى. هذه قطعة أثرية. وهذه تكلّف ثروة.",
          },
          {
            who: "Dana",
            en: "Everything costs a fortune until I start talking.",
            ar: "كل شيء يكلّف ثروة إلى أن أبدأ بالكلام.",
          },
          {
            en: "Behind the table, the vendor, a stocky man named Mr. Kowalski, smiled like someone who had been waiting all morning for exactly this.",
            ar: "خلف الطاولة ابتسم البائع، وهو رجل ممتلئ البنية اسمه السيد كوفالسكي، كمن ينتظر طوال الصباح هذه اللحظة بالذات.",
          },
        ],
        question: {
          en: "What can we infer about Dana from her three rules?",
          ar: "ماذا نستنتج عن دانا من قواعدها الثلاث؟",
          options: [
            {
              en: "She is too shy to talk to vendors",
              ar: "إنها خجولة جداً فلا تستطيع التحدث إلى البائعين",
            },
            { en: "She dislikes flea markets", ar: "إنها لا تحب أسواق الأشياء المستعملة" },
            {
              en: "She usually buys things without thinking",
              ar: "إنها تشتري الأشياء عادةً دون تفكير",
            },
            {
              en: "She treats haggling as a skill that she takes very seriously",
              ar: "إنها تعدّ المساومة مهارة تأخذها على محمل الجد الشديد",
            },
          ],
          answer: 3,
          evidence: 0,
        },
      },
      {
        title: "The Performance",
        titleAr: "العرض",
        lines: [
          {
            who: "Dana",
            en: "Hmm. It's pretty. But look at this scratch. And the glass is cloudy. Fifty.",
            ar: "همم. إنها جميلة. لكن انظر إلى هذا الخدش. والزجاج معتّم. خمسون.",
          },
          {
            who: "Mr. Kowalski",
            en: "Fifty? Madam, you are insulting my grandmother. This clock survived two wars.",
            ar: "خمسون؟ يا سيدتي، إنك تهينين جدّتي. لقد نجت هذه الساعة من حربين.",
          },
          {
            en: "Dana put the clock down, shook her head sadly and began to walk away, counting silently: one, two, three...",
            ar: "وضعت دانا الساعة، وهزّت رأسها بحزن وبدأت تمشي مبتعدة وهي تعدّ في سرّها: واحد، اثنان، ثلاثة...",
          },
          {
            who: "Mr. Kowalski",
            en: "Wait, wait! One-fifty. Only for you. Because you have a kind face.",
            ar: "انتظري، انتظري! مئة وخمسون. لكِ وحدك. لأن وجهك طيّب.",
          },
          {
            en: "For twenty-five minutes they performed a negotiation worthy of a diplomatic summit: she sighed, he clutched his chest; she walked away twice, he called her back three times; he mentioned his children, and she mentioned his competitors.",
            ar: "طوال خمس وعشرين دقيقة أدّيا مفاوضات جديرة بقمة دبلوماسية: هي تتنهد وهو يمسك صدره؛ هي تبتعد مرتين وهو يعيدها ثلاث مرات؛ هو يذكر أولاده وهي تذكر منافسيه.",
          },
          {
            who: "Mr. Kowalski",
            en: "Forty-five, and I will eat bread for a week. You are robbing me.",
            ar: "خمسة وأربعون، وسآكل الخبز وحده أسبوعاً. إنك تسرقينني.",
          },
          {
            who: "Dana",
            en: "A pleasure doing business.",
            ar: "سعدتُ بالتعامل معك.",
          },
        ],
        question: {
          en: "Which phrase best describes the way Dana and Mr. Kowalski negotiated?",
          ar: "أي عبارة تصف على أفضل وجه طريقة تفاوض دانا والسيد كوفالسكي؟",
          options: [
            { en: "Angrily, with no respect for each other", ar: "بغضب ودون احترام لبعضهما" },
            {
              en: "Dramatically, almost like a performance",
              ar: "بشكل درامي، يشبه العرض المسرحي",
            },
            { en: "Quickly and efficiently", ar: "بسرعة وكفاءة" },
            { en: "Carelessly, without any strategy", ar: "بإهمال ودون أي استراتيجية" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "Nineteen Dollars",
        titleAr: "تسعة عشر دولاراً",
        lines: [
          {
            en: "Dana carried the clock to the car like a trophy. She described the negotiation to Neil three times, improving it slightly with each version.",
            ar: "حملت دانا الساعة إلى السيارة كأنها كأس. وصفت المفاوضات لنيل ثلاث مرات، محسّنة الرواية قليلاً في كل مرة.",
          },
          {
            who: "Neil",
            en: "Dana. This exact clock is on a website. Nineteen dollars. It says 'vintage-style reproduction.'",
            ar: "دانا. هذه الساعة نفسها موجودة على موقع إلكتروني. بتسعة عشر دولاراً. وكُتب عليها: «نسخة مقلّدة بطراز قديم».",
          },
          {
            en: "Dana's smile disappeared in slow motion. 'But he said it was genuine,' she whispered.",
            ar: "اختفت ابتسامة دانا بحركة بطيئة. «لكنه قال إنها أصلية»، همست.",
          },
          {
            who: "Neil",
            en: "Did he actually say it was a genuine antique?",
            ar: "هل قال فعلاً إنها قطعة أثرية أصلية؟",
          },
          {
            who: "Dana",
            en: "He said... 'This clock is genuine.' And I said 'antique,' and he said, 'Madam, you have a good eye.'",
            ar: "قال... «هذه الساعة أصلية». وأنا قلت «أثرية»، فقال: «يا سيدتي، عينك خبيرة».",
          },
          {
            en: "She replayed the conversation in her head. He had never claimed anything. She had told herself the story, and he had simply let her.",
            ar: "أعادت المحادثة في رأسها. لم يدّعِ شيئاً قط. هي من روت لنفسها القصة، وهو اكتفى بأن تركها.",
          },
        ],
        question: {
          en: "What does Dana realize about Mr. Kowalski?",
          ar: "ماذا تدرك دانا عن السيد كوفالسكي؟",
          options: [
            {
              en: "He never actually lied; she had filled in the story herself",
              ar: "لم يكذب فعلاً؛ هي من أكملت القصة بنفسها",
            },
            { en: "He had copied her negotiating style", ar: "كان قد قلّد أسلوبها في المساومة" },
            { en: "He had sold her a stolen clock", ar: "كان قد باعها ساعة مسروقة" },
            { en: "He had forgotten the original price", ar: "كان قد نسي السعر الأصلي" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "A Fair Price",
        titleAr: "سعر عادل",
        lines: [
          {
            en: "The following Saturday, Dana returned, ready for battle. Mr. Kowalski saw her from across the aisle and opened his arms like a man greeting an old friend.",
            ar: "في السبت التالي عادت دانا مستعدة للمعركة. رآها السيد كوفالسكي من الجهة الأخرى للممر، ففتح ذراعيه كمن يستقبل صديقاً قديماً.",
          },
          {
            who: "Mr. Kowalski",
            en: "My favorite customer! Does the clock keep good time?",
            ar: "زبونتي المفضلة! هل تضبط الساعة الوقت جيداً؟",
          },
          {
            who: "Dana",
            en: "It's a reproduction. Nineteen dollars online. You made twenty-six dollars on me.",
            ar: "إنها نسخة مقلّدة. تسعة عشر دولاراً على الإنترنت. لقد ربحت منّي ستة وعشرين دولاراً.",
          },
          {
            who: "Mr. Kowalski",
            en: "Twenty-six, yes. And you made a story you'll tell for twenty years. Tell me, madam: would you have been happier paying nineteen on a website?",
            ar: "ستة وعشرون، نعم. وأنتِ صنعتِ قصة سترويها عشرين سنة. قولي لي يا سيدتي: هل كنتِ ستكونين أسعد لو دفعتِ تسعة عشر على موقع إلكتروني؟",
          },
          {
            en: "Dana opened her mouth to answer, then, to her great annoyance, closed it. He had a point, and she hated that he knew it.",
            ar: "فتحت دانا فمها لتجيب، ثم أغلقته، لشديد استيائها. كان محقاً، وكانت تكره أنه يعرف ذلك.",
          },
          {
            who: "Dana",
            en: "Next week I want the lamp. And this time, you start at fifty.",
            ar: "في الأسبوع القادم أريد المصباح. وهذه المرة تبدأ بخمسين.",
          },
          {
            who: "Mr. Kowalski",
            en: "Madam, for you? I start at ninety.",
            ar: "يا سيدتي، لكِ أنتِ؟ أبدأ بتسعين.",
          },
        ],
        question: {
          en: "Why does Dana close her mouth instead of answering?",
          ar: "لماذا أغلقت دانا فمها بدلاً من أن تجيب؟",
          options: [
            { en: "She was too angry to speak", ar: "كانت غاضبة جداً فلم تستطع الكلام" },
            { en: "She did not understand the question", ar: "لم تفهم السؤال" },
            {
              en: "She realized that Mr. Kowalski was right",
              ar: "أدركت أن السيد كوفالسكي على حق",
            },
            { en: "She wanted to ask for her money back", ar: "أرادت أن تطلب استرداد مالها" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What point is Mr. Kowalski making with his question?",
      ar: "ما النقطة التي يوضحها السيد كوفالسكي بسؤاله؟",
      options: [
        { en: "A fair price is always the lowest one", ar: "السعر العادل هو دائماً الأدنى" },
        {
          en: "The pleasure of the bargain can be worth more than the money saved",
          ar: "متعة المساومة قد تساوي أكثر من المال الموفَّر",
        },
        {
          en: "Customers should always shop online",
          ar: "على الزبائن أن يتسوقوا عبر الإنترنت دائماً",
        },
        {
          en: "Vendors should never lower their prices",
          ar: "على البائعين ألا يخفضوا أسعارهم أبداً",
        },
      ],
      answer: 1,
    },
    words: [
      {
        word: "vendor",
        sentence:
          "Behind the table, the ___, a stocky man named Mr. Kowalski, smiled like someone who had been waiting all morning for exactly this.",
        hintAr: "بائع.",
      },
      {
        word: "negotiation",
        sentence: "For twenty-five minutes they performed a ___ worthy of a diplomatic summit",
        hintAr: "مفاوضات.",
      },
      {
        word: "clutched",
        sentence: "she sighed, he ___ his chest",
        hintAr: "أمسك بقوة.",
      },
      {
        word: "genuine",
        sentence: "But he said it was ___,",
        hintAr: "أصلي.",
      },
      {
        word: "reproduction",
        sentence: "It's a ___. Nineteen dollars online.",
        hintAr: "نسخة مقلّدة.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 5
  {
    slug: "the-interpreter",
    order: 5,
    level: "B2",
    tone: "serious",
    icon: "heart",
    title: "The Interpreter",
    titleAr: "المترجمة",
    summary: "At fifteen, Sofia carried her mother's words. Today she had to carry the doctor's.",
    summaryAr:
      "في الخامسة عشرة، كانت صوفيا تحمل كلمات أمها. واليوم كان عليها أن تحمل كلمات الطبيب.",
    cast: { Sofia: "zara", "Mrs. Reyes": "autumn", "Dr. Marsh": "calm-male" },
    sections: [
      {
        title: "Room Six",
        titleAr: "الغرفة ستة",
        lines: [
          {
            en: "Sofia had been her mother's interpreter since she was nine. At the bank, at the school, at the post office, she had stood between two languages like a small, patient bridge.",
            ar: "كانت صوفيا مترجمة أمها منذ أن بلغت التاسعة. في المصرف وفي المدرسة وفي مكتب البريد، وقفت بين لغتين كجسر صغير صبور.",
          },
          {
            en: "Most days it felt ordinary. Today, in Room Six of the Lakeview Clinic, it felt like standing on a very high bridge.",
            ar: "في معظم الأيام كان الأمر عادياً. أما اليوم، في الغرفة السادسة من عيادة ليكفيو، فقد بدا كأنها تقف على جسر مرتفع جداً.",
          },
          {
            en: "Dr. Marsh closed the file and took off his glasses. He spoke slowly, the way people do when the news is not good.",
            ar: "أغلق الدكتور مارش الملف وخلع نظارته. تكلّم ببطء، كما يفعل الناس حين لا تكون الأخبار جيدة.",
          },
          {
            who: "Dr. Marsh",
            en: "Please tell your mother that the tests show she has diabetes. It is serious, but it is manageable, and we have caught it early.",
            ar: "من فضلك أخبري والدتك أن التحاليل تُظهر أنها مصابة بالسكري. الأمر خطير، لكن يمكن التحكم فيه، وقد اكتشفناه مبكراً.",
          },
          {
            en: "Sofia's mouth went dry. She knew every English word he had used. What she did not know was how to say them to the person she loved most.",
            ar: "جفّ فم صوفيا. كانت تعرف كل كلمة إنجليزية استخدمها. أما ما لم تكن تعرفه فهو كيف تقولها للشخص الذي تحبه أكثر من أي شخص.",
          },
          {
            en: "She was fifteen. More than anything, she wanted to translate a softer version.",
            ar: "كانت في الخامسة عشرة. وكانت تريد، أكثر من أي شيء، أن تترجم نسخة أخفّ.",
          },
        ],
        question: {
          en: "Why was this appointment harder than Sofia's usual interpreting?",
          ar: "لماذا كان هذا الموعد أصعب من ترجمة صوفيا المعتادة؟",
          options: [
            { en: "The doctor spoke too quickly", ar: "كان الطبيب يتحدث بسرعة كبيرة" },
            {
              en: "The news she had to translate was about her own mother's health",
              ar: "كان الخبر الذي عليها ترجمته يخص صحة أمها نفسها",
            },
            { en: "She did not know the English words", ar: "لم تكن تعرف الكلمات الإنجليزية" },
            { en: "The clinic was very far from home", ar: "كانت العيادة بعيدة جداً عن البيت" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "A Softer Version",
        titleAr: "نسخة أخفّ",
        lines: [
          {
            en: 'She turned to her mother and began to speak, but the words that came out were not quite the doctor\'s. She said he wanted her to be careful with sugar. She left out the word "serious."',
            ar: "التفتت إلى أمها وبدأت تتكلم، لكن الكلمات التي خرجت لم تكن كلمات الطبيب تماماً. قالت إنه يريدها أن تحذر من السكر. وحذفت كلمة «خطير».",
          },
          {
            en: "Her mother watched Sofia's face, not her mouth. After fifteen years of reading her daughter's expressions, she knew when a sentence was missing something.",
            ar: "راقبت أمها وجه صوفيا لا فمها. فبعد خمس عشرة سنة من قراءة تعابير ابنتها، كانت تعرف متى تنقص الجملة شيئاً.",
          },
          {
            who: "Mrs. Reyes",
            en: "Sofia. Tell me what he really said.",
            ar: "صوفيا. أخبريني بما قاله فعلاً.",
          },
          {
            en: "Dr. Marsh, who had been watching quietly, put down his pen.",
            ar: "وضع الدكتور مارش قلمه، وقد كان يراقب بهدوء.",
          },
          {
            who: "Dr. Marsh",
            en: "Sofia, I can see this is hard. I can call a professional interpreter by phone. You don't have to carry this alone.",
            ar: "صوفيا، أرى أن هذا صعب عليك. يمكنني أن أتصل بمترجم محترف عبر الهاتف. لا يجب أن تحملي هذا وحدك.",
          },
          {
            who: "Sofia",
            en: "No. I can do it. She should hear it from me.",
            ar: "لا. أستطيع أن أفعلها. ينبغي أن تسمعها مني.",
          },
        ],
        question: {
          en: "What did Sofia leave out when she first spoke to her mother?",
          ar: "ما الذي حذفته صوفيا حين تكلمت مع أمها أول مرة؟",
          options: [
            { en: "The name of the clinic", ar: "اسم العيادة" },
            { en: "The doctor's phone number", ar: "رقم هاتف الطبيب" },
            { en: "The fact that the illness was serious", ar: "حقيقة أن المرض خطير" },
            { en: "The time of the next appointment", ar: "موعد الزيارة التالية" },
          ],
          answer: 2,
          evidence: 0,
        },
      },
      {
        title: "Every Word",
        titleAr: "كل كلمة",
        lines: [
          {
            en: 'Sofia took a breath. Then, word by word, she translated everything: the diagnosis, the word "serious," the word "manageable," the injections, the changes to her mother\'s cooking.',
            ar: "أخذت صوفيا نفساً. ثم ترجمت كل شيء كلمة كلمة: التشخيص، وكلمة «خطير»، وكلمة «يمكن التحكم فيه»، والحقن، والتغييرات في طبخ أمها.",
          },
          {
            en: "Her mother listened without interrupting. When Sofia finished, nobody spoke for a long time.",
            ar: "أصغت أمها دون أن تقاطعها. وحين انتهت صوفيا، لم يتكلم أحد وقتاً طويلاً.",
          },
          {
            who: "Mrs. Reyes",
            en: "I am not made of glass, mija. I crossed a border, I cleaned offices at night, and I raised you alone. I can hear a word.",
            ar: "لست مصنوعة من زجاج يا ابنتي. عبرتُ حدوداً، ونظّفتُ مكاتب في الليل، وربيتك وحدي. أستطيع أن أسمع كلمة.",
          },
          {
            who: "Mrs. Reyes",
            en: "Next time you soften something, you take away my right to be brave.",
            ar: "في المرة القادمة حين تخفّفين شيئاً، تسلبينني حقي في أن أكون شجاعة.",
          },
          {
            en: "Sofia had always believed that protecting her mother was her job. For the first time, she wondered whether it had also been a way of protecting herself.",
            ar: "كانت صوفيا تعتقد دائماً أن حماية أمها هي مهمتها. وللمرة الأولى تساءلت إن كان ذلك أيضاً وسيلة لحماية نفسها.",
          },
        ],
        question: {
          en: "What did Mrs. Reyes want Sofia to understand?",
          ar: "ماذا أرادت السيدة رييس أن تفهمه صوفيا؟",
          options: [
            {
              en: "That hiding the truth takes away her chance to face it with courage",
              ar: "أن إخفاء الحقيقة يسلبها فرصة مواجهتها بشجاعة",
            },
            {
              en: "That she was angry about the clinic's prices",
              ar: "أنها غاضبة من أسعار العيادة",
            },
            { en: "That she wanted a different doctor", ar: "أنها تريد طبيباً آخر" },
            {
              en: "That Sofia should stop interpreting for her",
              ar: "أن على صوفيا أن تتوقف عن الترجمة لها",
            },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Just Her Daughter",
        titleAr: "ابنتها فقط",
        lines: [
          {
            en: "On the way out, Dr. Marsh gave Sofia a card with a phone number.",
            ar: "في طريق الخروج، أعطى الدكتور مارش صوفيا بطاقة عليها رقم هاتف.",
          },
          {
            who: "Dr. Marsh",
            en: "This is the clinic's interpreter line. From now on we will use it for every appointment. Your only job is to hold her hand.",
            ar: "هذا خط المترجمين في العيادة. من الآن سنستخدمه في كل موعد. ومهمتك الوحيدة أن تمسكي بيدها.",
          },
          {
            en: "In the elevator, Sofia finally cried. Her mother did not tell her to stop. She simply opened her arms, the way she had when Sofia was five, and waited.",
            ar: "في المصعد بكت صوفيا أخيراً. لم تطلب منها أمها أن تتوقف. فتحت ذراعيها ببساطة، كما كانت تفعل حين كانت صوفيا في الخامسة، وانتظرت.",
          },
          {
            who: "Mrs. Reyes",
            en: "You carried words that were too heavy for one person. Today you were very brave, and today you were also still my child.",
            ar: "حملتِ كلمات أثقل من أن يحملها شخص واحد. اليوم كنتِ شجاعة جداً، واليوم كنتِ أيضاً ما زلتِ طفلتي.",
          },
          {
            en: "The doors opened onto the parking lot and a bright, ordinary afternoon. Sofia wiped her face, took her mother's arm and, for the first time in six years, walked beside her without translating a single word.",
            ar: "انفتحت الأبواب على موقف السيارات وعلى عصر مشرق عادي. مسحت صوفيا وجهها، وأمسكت بذراع أمها، ومشت بجانبها للمرة الأولى منذ ست سنوات دون أن تترجم كلمة واحدة.",
          },
        ],
        question: {
          en: "Why does Dr. Marsh give Sofia the interpreter line?",
          ar: "لماذا يعطي الدكتور مارش صوفيا رقم خط المترجمين؟",
          options: [
            { en: "Because Sofia had made a serious mistake", ar: "لأن صوفيا ارتكبت خطأً جسيماً" },
            { en: "Because the clinic wants to save money", ar: "لأن العيادة تريد توفير المال" },
            {
              en: "Because Mrs. Reyes asked for a new doctor",
              ar: "لأن السيدة رييس طلبت طبيباً جديداً",
            },
            {
              en: "So that Sofia can be her mother's daughter rather than her interpreter",
              ar: "كي تكون صوفيا ابنة أمها لا مترجمتها",
            },
          ],
          answer: 3,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "What does Sofia learn by the end of the story?",
      ar: "ماذا تتعلم صوفيا في نهاية القصة؟",
      options: [
        {
          en: "That telling the truth respects a person, and that she does not have to carry adult responsibilities alone",
          ar: "أن قول الحقيقة احترام للإنسان، وأنها ليست مضطرة إلى حمل مسؤوليات الكبار وحدها",
        },
        { en: "That doctors should speak more slowly", ar: "أن على الأطباء أن يتكلموا ببطء أكبر" },
        {
          en: "That interpreters should hide bad news",
          ar: "أن على المترجمين إخفاء الأخبار السيئة",
        },
        {
          en: "That children should never help their parents",
          ar: "أن على الأطفال ألا يساعدوا أهلهم أبداً",
        },
      ],
      answer: 0,
    },
    words: [
      {
        word: "interpreter",
        sentence: "Sofia had been her mother's ___ since she was nine.",
        hintAr: "مترجم فوري.",
      },
      {
        word: "manageable",
        sentence: "It is serious, but it is ___, and we have caught it early.",
        hintAr: "يمكن التحكم فيه.",
      },
      {
        word: "injections",
        sentence:
          'Then, word by word, she translated everything: the diagnosis, the word "serious," the word "manageable," the ___, the changes to her mother\'s cooking.',
        hintAr: "حقن.",
      },
      {
        word: "interrupting",
        sentence: "Her mother listened without ___.",
        hintAr: "المقاطعة.",
      },
      {
        word: "protecting",
        sentence: "Sofia had always believed that ___ her mother was her job.",
        hintAr: "حماية.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 6
  {
    slug: "the-vacant-lot",
    order: 6,
    level: "B2",
    tone: "inspiring",
    icon: "sun",
    title: "The Vacant Lot",
    titleAr: "الأرض الشاغرة",
    summary:
      "Everyone on Elm Street agreed the vacant lot was an eyesore. Nobody agreed on what to do about it.",
    summaryAr:
      "اتفق كل سكان شارع إلم على أن الأرض الشاغرة مشهد قبيح. ولم يتفق أحد على ما يجب فعله.",
    cast: { Ruth: "autumn", Walter: "calm-male", Maya: "ash", "Councilman Hughes": "russ" },
    sections: [
      {
        title: "An Eyesore",
        titleAr: "مشهد قبيح",
        lines: [
          {
            en: "For nineteen years, the vacant lot at the corner of Elm Street had collected broken bottles, weeds and abandoned furniture. Residents complained, the city sent letters, and nothing changed.",
            ar: "طوال تسع عشرة سنة، ظلت الأرض الشاغرة عند زاوية شارع إلم تجمع الزجاجات المكسورة والأعشاب والأثاث المهجور. اشتكى السكان، وأرسلت البلدية رسائل، ولم يتغيّر شيء.",
          },
          {
            en: "Ruth, a retired nurse who lived across the street, had stopped complaining.",
            ar: "كانت روث، الممرضة المتقاعدة التي تسكن قبالة الأرض، قد كفّت عن الشكوى.",
          },
          {
            en: "One spring morning she walked onto the lot with a shovel and a bag of seeds, wearing the expression of a woman who had decided to be unreasonable.",
            ar: "وفي صباح ربيعي دخلت الأرض ومعها مجرفة وكيس بذور، بملامح امرأة قررت أن تكون غير معقولة.",
          },
          {
            who: "Walter",
            en: "Ruth, that ground is full of rubble. Nothing will grow there.",
            ar: "روث، هذه الأرض مليئة بالأنقاض. لن ينمو فيها شيء.",
          },
          {
            who: "Ruth",
            en: "You grew tomatoes in the desert for forty years, Walter. Come and tell me how.",
            ar: "لقد زرعتَ الطماطم في الصحراء أربعين سنة يا والتر. تعال وأخبرني كيف.",
          },
          {
            en: "Walter, who had not left his porch in months, looked at his boots, then at the lot, and then reached for his hat.",
            ar: "نظر والتر، الذي لم يغادر شرفته منذ شهور، إلى حذائه، ثم إلى الأرض، ثم مدّ يده إلى قبعته.",
          },
        ],
        question: {
          en: "What does Ruth's expression suggest about her decision?",
          ar: "ماذا توحي ملامح روث بشأن قرارها؟",
          options: [
            {
              en: "She was not sure whether to continue",
              ar: "كانت غير متأكدة مما إذا كانت ستستمر",
            },
            { en: "She had been ordered to clean the lot", ar: "كانت قد أُمرت بتنظيف الأرض" },
            {
              en: "She was determined to act, even though it might seem unreasonable",
              ar: "كانت مصممة على التحرك حتى لو بدا ذلك غير معقول",
            },
            { en: "She was angry at Walter", ar: "كانت غاضبة من والتر" },
          ],
          answer: 2,
          evidence: 2,
        },
      },
      {
        title: "The Letter",
        titleAr: "الرسالة",
        lines: [
          {
            en: "By June, the lot had changed. Twelve raised beds stood where the rubble had been, built from donated wood, and every evening neighbors came to water, weed and argue happily about compost.",
            ar: "بحلول يونيو كانت الأرض قد تغيّرت. قامت اثنا عشر حوضاً مرتفعاً حيث كان الركام، مبنية من خشب متبرَّع به، وكان الجيران يأتون كل مساء ليسقوا ويقلعوا الأعشاب ويتجادلوا بسعادة حول السماد.",
          },
          {
            en: "Then a letter arrived from the city: the lot had been sold to a developer, and construction would begin in ninety days.",
            ar: "ثم وصلت رسالة من البلدية: تم بيع الأرض لمطوّر عقاري، وسيبدأ البناء بعد تسعين يوماً.",
          },
          {
            who: "Maya",
            en: "They can't do this. We've put in all this work.",
            ar: "لا يمكنهم فعل هذا. لقد بذلنا كل هذا الجهد.",
          },
          {
            who: "Ruth",
            en: "Legally, they can. We never owned the land. We were only borrowing it, and nobody ever checked who it belonged to.",
            ar: "قانونياً يمكنهم. لم نكن نملك الأرض يوماً. كنا نستعيرها فقط، ولم يتحقق أحد قط من يملكها.",
          },
          {
            en: "The next morning, the beds were still green. A bean plant had begun to climb the fence, as if it had not heard the news.",
            ar: "في صباح اليوم التالي كانت الأحواض لا تزال خضراء. وكانت نبتة فاصولياء قد بدأت تتسلق السياج وكأنها لم تسمع الخبر.",
          },
        ],
        question: {
          en: "What is the main problem the neighbors face after the letter arrives?",
          ar: "ما المشكلة الأساسية التي تواجه الجيران بعد وصول الرسالة؟",
          options: [
            { en: "The vegetables have stopped growing", ar: "توقفت الخضار عن النمو" },
            { en: "They have run out of money for wood", ar: "نفد المال لديهم لشراء الخشب" },
            { en: "The neighbors disagree about compost", ar: "اختلف الجيران حول السماد" },
            {
              en: "The land they have improved legally belongs to somebody else",
              ar: "الأرض التي حسّنوها ملك قانوني لشخص آخر",
            },
          ],
          answer: 3,
          evidence: 3,
        },
      },
      {
        title: "The Hearing",
        titleAr: "الجلسة",
        lines: [
          {
            en: "The council meeting took place on a Tuesday evening in a room that smelled of floor polish and old paper. Ruth had prepared a speech, but when her turn came, she forgot most of it.",
            ar: "عُقد اجتماع المجلس مساء يوم ثلاثاء في قاعة تفوح منها رائحة ملمّع الأرضيات والورق القديم. كانت روث قد أعدّت خطاباً، لكنها نسيت معظمه حين جاء دورها.",
          },
          {
            who: "Ruth",
            en: "I am not a lawyer, and I am not an expert. I'm just someone who found a place where people who never spoke to each other now share tomatoes.",
            ar: "لست محامية، ولست خبيرة. أنا مجرد إنسانة وجدت مكاناً صار فيه أناس لم يتكلموا يوماً مع بعضهم يتقاسمون الطماطم.",
          },
          {
            who: "Councilman Hughes",
            en: "Mrs. Bennett, I respect the effort. But sentiment doesn't pay taxes, and the developer's plan will bring forty apartments and a hundred jobs.",
            ar: "سيدة بينيت، أحترم الجهد. لكن العاطفة لا تدفع الضرائب، ومشروع المطوّر سيجلب أربعين شقة ومئة وظيفة.",
          },
          {
            en: "Behind her, a hundred and forty residents rose to their feet without a word, and the room became silent in a very particular way.",
            ar: "خلفها نهض مئة وأربعون من السكان على أقدامهم دون كلمة، وصمتت القاعة صمتاً من نوع خاص جداً.",
          },
          {
            who: "Councilman Hughes",
            en: "I did not expect so many people.",
            ar: "لم أتوقع هذا العدد الكبير من الناس.",
          },
          {
            en: "The vote was postponed for sixty days, which, in the language of politics, meant that somebody was reconsidering.",
            ar: "أُجّل التصويت ستين يوماً، وهذا يعني، بلغة السياسة، أن أحداً يعيد النظر.",
          },
        ],
        question: {
          en: "What did the residents show by standing up silently?",
          ar: "ماذا أظهر السكان بوقوفهم الصامت؟",
          options: [
            {
              en: "That the garden mattered to a large part of the community",
              ar: "أن الحديقة تهمّ شريحة كبيرة من المجتمع",
            },
            { en: "That they were bored with the meeting", ar: "أنهم ضجروا من الاجتماع" },
            { en: "That they agreed with the councilman", ar: "أنهم يوافقون عضو المجلس" },
            { en: "That they wanted to leave", ar: "أنهم يريدون المغادرة" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Harvest",
        titleAr: "الحصاد",
        lines: [
          {
            en: "In the end, the council did something unusual. It offered the developer a different site, and it gave the neighbors a ten-year lease on the lot for one dollar a year.",
            ar: "في النهاية فعل المجلس شيئاً غير معتاد. عرض على المطوّر موقعاً آخر، ومنح الجيران عقد إيجار لعشر سنوات على الأرض بدولار واحد في السنة.",
          },
          {
            en: "In October, they held the first harvest festival: forty-two kinds of vegetables, a table of pies and a crowd of neighbors who had once crossed the street to avoid each other.",
            ar: "في أكتوبر أقاموا أول مهرجان للحصاد: اثنان وأربعون نوعاً من الخضار، وطاولة من الفطائر، وحشد من الجيران الذين كانوا يعبرون الشارع يوماً لتجنّب بعضهم.",
          },
          {
            en: "Councilman Hughes arrived late, in a suit, holding a paper bag. He asked, a little awkwardly, whether anyone had a free plot.",
            ar: "وصل عضو المجلس هيوز متأخراً، مرتدياً بدلة وفي يده كيس ورقي. وسأل، بشيء من الحرج، هل من أحد لديه قطعة خالية.",
          },
          {
            who: "Ruth",
            en: "We have one at the end, next to Walter's tomatoes. Fair warning: Walter has opinions.",
            ar: "عندنا واحدة في آخر الصف، بجانب طماطم والتر. تحذير منصف: لوالتر آراء.",
          },
          {
            who: "Walter",
            en: "Tomatoes don't care about politics, young man. Bring a shovel.",
            ar: "الطماطم لا تهتم بالسياسة يا فتى. أحضر مجرفة.",
          },
          {
            en: "The following spring, a small wooden sign appeared on the fence: Elm Street Community Garden. Beneath it, in smaller letters, someone had painted: Plots available. Opinions welcome.",
            ar: "في الربيع التالي ظهرت لافتة خشبية صغيرة على السياج: حديقة شارع إلم المجتمعية. وتحتها، بحروف أصغر، كتب أحدهم: قطع متاحة. الآراء مرحَّب بها.",
          },
        ],
        question: {
          en: "How did the council finally solve the problem?",
          ar: "كيف حلّ المجلس المشكلة في النهاية؟",
          options: [
            {
              en: "It cancelled the developer's project completely",
              ar: "ألغى مشروع المطوّر بالكامل",
            },
            {
              en: "It offered the developer another site and leased the lot to the neighbors",
              ar: "عرض على المطوّر موقعاً آخر وأجّر الأرض للجيران",
            },
            { en: "It sold the lot to Ruth", ar: "باع الأرض لروث" },
            { en: "It asked the neighbors to leave", ar: "طلب من الجيران المغادرة" },
          ],
          answer: 1,
          evidence: 0,
        },
      },
    ],
    closing: {
      en: "What does the ending of the story suggest about change?",
      ar: "ماذا توحي نهاية القصة بشأن التغيير؟",
      options: [
        { en: "Change always requires a lawyer", ar: "التغيير يتطلب محامياً دائماً" },
        { en: "Change is impossible without money", ar: "التغيير مستحيل بلا مال" },
        {
          en: "One determined person can start something that gradually brings others together",
          ar: "يمكن لشخص مصمّم أن يبدأ شيئاً يجمع الآخرين تدريجياً",
        },
        { en: "Change usually happens by accident", ar: "التغيير يحدث عادةً بالمصادفة" },
      ],
      answer: 2,
    },
    words: [
      {
        word: "vacant",
        sentence:
          "For nineteen years, the ___ lot at the corner of Elm Street had collected broken bottles, weeds and abandoned furniture.",
        hintAr: "شاغر.",
      },
      {
        word: "rubble",
        sentence: "Ruth, that ground is full of ___.",
        hintAr: "أنقاض.",
      },
      {
        word: "developer",
        sentence: "the lot had been sold to a ___, and construction would begin in ninety days.",
        hintAr: "مطوّر عقاري.",
      },
      {
        word: "lease",
        sentence: "it gave the neighbors a ten-year ___ on the lot for one dollar a year.",
        hintAr: "عقد إيجار.",
      },
      {
        word: "harvest",
        sentence: "In October, they held the first ___ festival",
        hintAr: "حصاد.",
      },
    ],
  },
];
