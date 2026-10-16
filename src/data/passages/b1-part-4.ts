import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1, a later addition: two more scenes at the step of the earlier sets — longer
 * sentences, reported speech, the past perfect where the story looks back, and nothing
 * that reads like a lesson. Both were written against everything already in the library
 * (the passages, the Daily Lessons, the Stories), so they repeat none of them
 * (see scripts/check-passage-duplicates.ts).
 */

export const B1_PASSAGES_PART_4: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 8
  {
    slug: "the-class-nobody-wanted",
    order: 8,
    level: "B1",
    tone: "inspiring",
    icon: "heart",
    title: "The Class Nobody Wanted",
    titleAr: "الدورة التي لم يرغب فيها أحد",
    summary: "Paul was sure he would never need what he learned in this class.",
    summaryAr: "كان بول واثقاً من أنه لن يحتاج أبداً إلى ما سيتعلمه في هذه الدورة.",
    cast: { Paul: "calm-male", Carla: "zara", Denise: "ash", Megan: "autumn" },
    sections: [
      {
        title: "Mandatory",
        titleAr: "إلزامية",
        lines: [
          {
            en: "Every employee at Hartley & Sons had received the same email: the first-aid course was mandatory, and nobody could skip it.",
            ar: "تلقّى كل موظف في شركة «هارتلي وأولاده» الرسالة نفسها: دورة الإسعافات الأولية إلزامية، ولا يستطيع أحد أن يتغيّب عنها.",
          },
          {
            en: "Paul Anderson, a fifty-two-year-old accountant, had complained for a week. In twenty-six years, he said, the only emergency in the building had been a broken coffee machine.",
            ar: "كان بول أندرسون، المحاسب ذو الاثنتين والخمسين عاماً، قد ظلّ يتذمّر أسبوعاً كاملاً. فخلال ستٍّ وعشرين سنة، كما قال، لم تكن الحالة الطارئة الوحيدة في المبنى سوى آلة قهوة معطّلة.",
          },
          {
            en: "On a rainy Tuesday, he took a chair in the back row, folded his arms and decided to give the course exactly ninety minutes of patience.",
            ar: "في يوم ثلاثاء ماطر، جلس على كرسي في الصف الأخير، وعقد ذراعيه، وقرر أن يمنح الدورة تسعين دقيقة بالضبط من صبره.",
          },
          {
            en: "The instructor, a paramedic named Carla, had clearly taught this class many times and wasn't bothered by the phones.",
            ar: "كانت المدرِّبة، وهي مسعفة اسمها كارلا، قد درّست هذه الدورة مرات كثيرة بوضوح، ولم تكن الهواتف تزعجها.",
          },
          {
            who: "Carla",
            en: "I know what you're thinking: this will never happen to me. Nobody ever thinks it will. That's why we practice.",
            ar: "أعرف ما تفكرون فيه: هذا لن يحدث لي أبداً. لا أحد يظن أنه سيحدث. ولهذا نتدرّب.",
          },
          {
            who: "Paul",
            en: "Ninety minutes, and not a second more.",
            ar: "تسعون دقيقة، ولا ثانية زيادة.",
          },
        ],
        question: {
          en: "How did Paul feel about the course at the beginning?",
          ar: "ما شعور بول تجاه الدورة في البداية؟",
          options: [
            { en: "He thought it was a waste of time", ar: "ظنّها مضيعة للوقت" },
            { en: "He was nervous about the instructor", ar: "كان قلقاً من المدرِّبة" },
            { en: "He was excited to learn something new", ar: "كان متحمساً لتعلّم شيء جديد" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Annie",
        titleAr: "آني",
        lines: [
          {
            en: "Each pair received a plastic dummy. Carla introduced hers as Annie: fifteen years on the job, and she had never once complained.",
            ar: "تلقّى كل اثنين دمية بلاستيكية. وقدّمت كارلا دميتها باسم آني: خمس عشرة سنة في هذه المهنة، ولم تشتكِ مرة واحدة.",
          },
          {
            en: "The first skill was chest compressions: push hard and fast, in the rhythm of a famous disco song about staying alive.",
            ar: "كانت المهارة الأولى ضغطات الصدر: اضغطوا بقوة وبسرعة، على إيقاع أغنية ديسكو مشهورة عن البقاء حياً.",
          },
          {
            en: "Paul pressed gently, as if the dummy might break.",
            ar: "ضغط بول بلطف، كأن الدمية قد تنكسر.",
          },
          {
            who: "Carla",
            en: "You won't hurt her, Paul. Two inches deep, and don't stop.",
            ar: "لن تؤذيها يا بول. اضغط بعمق بوصتين، ولا تتوقف.",
          },
          {
            en: "After five minutes, his arms were burning and his shirt was wet. He had stopped checking the clock a long time ago.",
            ar: "بعد خمس دقائق كانت ذراعاه تحترقان وقميصه مبللاً. وكان قد كفّ عن النظر إلى الساعة منذ وقت طويل.",
          },
          {
            en: 'When the exercise ended, Paul looked at Annie, breathed out slowly and whispered, "Sorry." Denise laughed so loudly that the whole room turned around.',
            ar: "حين انتهى التمرين نظر بول إلى آني، وزفر ببطء، وهمس: «آسف». فضحكت دينيس بصوت عالٍ حتى التفتت القاعة كلها.",
          },
          {
            who: "Carla",
            en: "Nobody has ever apologized to Annie before. I like that. It means you take this seriously.",
            ar: "لم يعتذر أحد إلى آني من قبل. يعجبني هذا. إنه يعني أنك تأخذ الأمر بجدّية.",
          },
        ],
        question: {
          en: "What did Paul do when the exercise ended?",
          ar: "ماذا فعل بول حين انتهى التمرين؟",
          options: [
            { en: "He asked to leave early", ar: "طلب أن ينصرف مبكراً" },
            { en: "He apologized to the dummy", ar: "اعتذر إلى الدمية" },
            { en: "He took a photograph of Annie", ar: "التقط صورة لآني" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Marco's",
        titleAr: "مطعم ماركو",
        lines: [
          {
            en: "By June, Paul had almost forgotten the course.",
            ar: "بحلول يونيو كان بول قد نسي الدورة تقريباً.",
          },
          {
            en: "On his daughter Emily's birthday, the family went to Marco's, a small Italian restaurant where the waiters knew everyone by name.",
            ar: "في عيد ميلاد ابنته إيميلي، ذهبت العائلة إلى «ماركو»، وهو مطعم إيطالي صغير يعرف نُدُلُه الجميع بأسمائهم.",
          },
          {
            en: "At the next table, an elderly man was telling a joke to his grandson, and everyone around him was laughing.",
            ar: "على الطاولة المجاورة كان رجل مسنّ يروي نكتة لحفيده، والجميع من حوله يضحكون.",
          },
          {
            en: "Suddenly, his face changed. He put a hand on his chest and collapsed onto the table.",
            ar: "وفجأة تغيّر وجهه. وضع يده على صدره وانهار فوق الطاولة.",
          },
          {
            en: "A woman screamed. Plates crashed to the floor. Forty people stood up, but nobody moved.",
            ar: "صرخت امرأة. وتحطّمت الأطباق على الأرض. وقف أربعون شخصاً، لكن أحداً لم يتحرك.",
          },
          {
            en: "Paul found that he was standing, too. His knees were shaking, but inside his head something very calm was happening: a voice, and behind the voice, a beat.",
            ar: "وجد بول أنه واقف هو أيضاً. كانت ركبتاه ترتجفان، لكن شيئاً هادئاً جداً كان يحدث في رأسه: صوت، ووراء الصوت إيقاع.",
          },
          {
            en: "Push hard, push fast. He could hear Carla as clearly as if she were beside him.",
            ar: "اضغط بقوة، اضغط بسرعة. كان يسمع كارلا بوضوح كأنها بجانبه.",
          },
        ],
        question: {
          en: "What did the elderly man do just before he fell?",
          ar: "ماذا فعل الرجل المسنّ قبل أن يسقط مباشرة؟",
          options: [
            { en: "He called for the waiter", ar: "نادى النادل" },
            { en: "He stood up to leave", ar: "وقف ليغادر" },
            { en: "He put a hand on his chest", ar: "وضع يده على صدره" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Thirty Compressions",
        titleAr: "ثلاثون ضغطة",
        lines: [
          {
            who: "Paul",
            en: "Call an ambulance! Now!",
            ar: "اتصلوا بالإسعاف! الآن!",
          },
          {
            en: "He helped the man onto the floor and checked: no breathing, nothing at all.",
            ar: "ساعد الرجل على الاستلقاء على الأرض وفحصه: لا تنفّس، لا شيء على الإطلاق.",
          },
          {
            en: "Paul placed his hands in the center of the man's chest and pushed, hard and fast, counting out loud. The song played in his head, over and over.",
            ar: "وضع بول يديه في منتصف صدر الرجل وضغط بقوة وسرعة وهو يعدّ بصوت مسموع. وكانت الأغنية تدور في رأسه مراراً وتكراراً.",
          },
          {
            en: "After two minutes, his arms were on fire. A young woman knelt beside him.",
            ar: "بعد دقيقتين كانت ذراعاه تشتعلان. وركعت بجانبه شابة.",
          },
          {
            who: "Megan",
            en: "I'm a nurse. You're doing it right, so keep going. I'll take over when you need me to.",
            ar: "أنا ممرضة. أنت تفعل ذلك بشكل صحيح، فاستمر. سأتولى الأمر حين تحتاج إلى ذلك.",
          },
          {
            en: "Paul couldn't answer. He didn't have the breath for it. He pushed, and counted, and counted again.",
            ar: "لم يستطع بول أن يجيب. لم يكن لديه نَفَس لذلك. ضغط، وعدّ، وعدّ مرة أخرى.",
          },
          {
            en: 'At minute eight, two paramedics ran in with a bag and a machine. One of them said calmly, "We\'ve got him."',
            ar: "في الدقيقة الثامنة دخل مسعفان يركضان ومعهما حقيبة وجهاز. وقال أحدهما بهدوء: «أمسكنا به».",
          },
        ],
        question: {
          en: "Why did the nurse tell Paul to keep going?",
          ar: "لماذا طلبت الممرضة من بول أن يستمر؟",
          options: [
            { en: "The ambulance was late", ar: "كانت سيارة الإسعاف متأخرة" },
            { en: "He was doing it correctly", ar: "كان يفعل ذلك بشكل صحيح" },
            { en: "She did not know how to help", ar: "لم تكن تعرف كيف تساعد" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "A Card",
        titleAr: "بطاقة",
        lines: [
          {
            en: "The paramedics took the man to the hospital. For two days, nobody told Paul whether he had survived.",
            ar: "نقل المسعفان الرجل إلى المستشفى. ولمدة يومين لم يخبر أحد بول إن كان قد نجا.",
          },
          {
            en: "On the third day, the restaurant owner called. The man's name was Mr. Reyes, he was seventy-eight, and he was awake and asking for pasta.",
            ar: "في اليوم الثالث اتصل صاحب المطعم. كان اسم الرجل السيد رييس، وعمره ثمانية وسبعون عاماً، وهو مستيقظ ويطلب المعكرونة.",
          },
          {
            en: 'A month later, a card arrived at Paul\'s office: "You gave me more years with my grandson. I can never thank you enough."',
            ar: "وبعد شهر وصلت بطاقة إلى مكتب بول: «لقد منحتني سنوات أكثر مع حفيدي. لن أستطيع أن أشكرك بما يكفي».",
          },
          {
            en: "Paul read it three times. Then he walked across the office to Denise's desk.",
            ar: "قرأها بول ثلاث مرات. ثم عبر المكتب إلى طاولة دينيس.",
          },
          {
            who: "Paul",
            en: "Denise, when is the next first-aid course? The advanced one.",
            ar: "دينيس، متى الدورة القادمة في الإسعافات الأولية؟ المتقدمة.",
          },
          {
            who: "Denise",
            en: "You want another course? You? The man who gave the first one ninety minutes of patience?",
            ar: "تريد دورة أخرى؟ أنت؟ الرجل الذي منح الأولى تسعين دقيقة من الصبر؟",
          },
          {
            en: 'That evening, he wrote to Carla: "You were right. Those were the most useful two hours of my life. Please tell Annie I said sorry again."',
            ar: "في ذلك المساء كتب إلى كارلا: «كنتِ محقة. كانتا أنفع ساعتين في حياتي. أرجو أن تخبري آني أنني أعتذر مرة أخرى».",
          },
        ],
        question: {
          en: "Why was Denise surprised that Paul wanted another course?",
          ar: "لماذا فوجئت دينيس بأن بول يريد دورة أخرى؟",
          options: [
            { en: "He had missed the first course", ar: "كان قد تغيّب عن الدورة الأولى" },
            { en: "He had complained about the first course", ar: "كان قد اشتكى من الدورة الأولى" },
            { en: "He was too old to learn", ar: "كان أكبر من أن يتعلم" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "How did Paul's opinion of the course change?",
      ar: "كيف تغيّر رأي بول في الدورة؟",
      options: [
        { en: "He always enjoyed it", ar: "كان يستمتع بها دائماً" },
        { en: "He never changed his mind", ar: "لم يغيّر رأيه أبداً" },
        {
          en: "He began by thinking it was useless and ended by asking for more",
          ar: "بدأ بظنّها عديمة الفائدة، وانتهى بطلب المزيد",
        },
      ],
      answer: 2,
    },
    words: [
      {
        word: "mandatory",
        sentence: "the first-aid course was ___, and nobody could skip it.",
        hintAr: "إلزامي.",
      },
      {
        word: "instructor",
        sentence: "The ___, a paramedic named Carla, had clearly taught this class many times",
        hintAr: "مدرِّب.",
      },
      {
        word: "compressions",
        sentence: "The first skill was chest ___",
        hintAr: "ضغطات.",
      },
      {
        word: "rhythm",
        sentence: "push hard and fast, in the ___ of a famous disco song about staying alive.",
        hintAr: "إيقاع.",
      },
      {
        word: "collapsed",
        sentence: "He put a hand on his chest and ___ onto the table.",
        hintAr: "انهار.",
      },
      {
        word: "paramedics",
        sentence: "At minute eight, two ___ ran in with a bag and a machine.",
        hintAr: "مسعفون.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 9
  {
    slug: "halftime",
    order: 9,
    level: "B1",
    tone: "funny",
    icon: "dumbbell",
    title: "Halftime",
    titleAr: "استراحة الشوطين",
    summary: "The job paid forty dollars. The costume came with a beak.",
    summaryAr: "كان أجر الوظيفة أربعين دولاراً. وجاءت البدلة بمنقار.",
    cast: { Danny: "russ", "Coach Miller": "calm-male", Brenda: "zara" },
    sections: [
      {
        title: "Forty Dollars",
        titleAr: "أربعون دولاراً",
        lines: [
          {
            en: "Danny Brooks was a nineteen-year-old engineering student who needed money. When the Riverside Roosters announced that they needed a mascot, he applied in about four seconds.",
            ar: "كان داني بروكس طالب هندسة في التاسعة عشرة من عمره، وكان يحتاج إلى المال. وحين أعلن فريق «ريفرسايد روسترز» أنه يحتاج إلى تميمة، قدّم طلبه في نحو أربع ثوانٍ.",
          },
          {
            en: "The job paid forty dollars per game. The last mascot, Danny later learned, had quit after falling off the stage at a pep rally.",
            ar: "كانت الوظيفة تدفع أربعين دولاراً عن كل مباراة. أما التميمة السابقة، كما علم داني لاحقاً، فقد استقالت بعد أن سقطت عن المنصة في تجمّع تشجيعي.",
          },
          {
            who: "Coach Miller",
            en: "All you have to do is dance, wave and not fall.",
            ar: "كل ما عليك هو أن ترقص وتلوّح ولا تسقط.",
          },
          {
            en: "He handed Danny a giant red-and-white chicken costume. The head alone was the size of a washing machine, and the beak stuck out like the front of a canoe.",
            ar: "ناول داني بدلة دجاجة ضخمة حمراء وبيضاء. كان الرأس وحده بحجم غسالة، وبرز المنقار كمقدمة زورق.",
          },
          {
            en: "Danny could see only through a narrow mesh slit under the beak.",
            ar: "لم يكن داني يرى إلا من خلال فتحة شبكية ضيقة تحت المنقار.",
          },
          {
            who: "Danny",
            en: "How am I supposed to see where I'm going?",
            ar: "كيف يُفترض أن أرى إلى أين أذهب؟",
          },
          {
            who: "Coach Miller",
            en: "Count your steps. And trust the cheerleaders.",
            ar: "عُدَّ خطواتك. وثِق بالمشجّعات.",
          },
        ],
        question: {
          en: "Why did Danny take the job?",
          ar: "لماذا قبل داني الوظيفة؟",
          options: [
            { en: "He loved basketball", ar: "كان يحب كرة السلة" },
            { en: "He wanted to impress the cheerleaders", ar: "أراد أن يُعجب المشجّعات" },
            { en: "He needed the money", ar: "كان يحتاج إلى المال" },
          ],
          answer: 2,
          evidence: 0,
        },
      },
      {
        title: "Halftime",
        titleAr: "استراحة الشوطين",
        lines: [
          {
            en: "The first half went well. Danny danced beside the bench, waved at the crowd and bumped into only two people.",
            ar: "سار الشوط الأول جيداً. رقص داني بجانب مقعد البدلاء، ولوّح للجمهور، واصطدم بشخصين فقط.",
          },
          {
            en: 'Inside the costume, he could hear nothing but his own breathing, so at halftime he understood only two words of Coach Miller\'s shouting: "center" and "dance."',
            ar: "داخل البدلة لم يكن يسمع إلا أنفاسه، فلم يفهم عند استراحة الشوطين من صياح المدرّب ميلر إلا كلمتين: «المنتصف» و«ارقص».",
          },
          {
            en: "He set off for center court, counting his steps. At step twelve he tripped over a ball cart; at step twenty-six he knocked a drum off the band's table.",
            ar: "انطلق نحو منتصف الملعب وهو يعدّ خطواته. عند الخطوة الثانية عشرة تعثّر بعربة الكرات، وعند السادسة والعشرين أوقع طبلاً عن طاولة الفرقة الموسيقية.",
          },
          {
            en: "The crowd cheered. Danny had no idea why, so he waved harder.",
            ar: "هتف الجمهور. ولم يكن لدى داني أدنى فكرة عن السبب، فلوّح بقوة أكبر.",
          },
          {
            en: "Then he saw a bright rectangle of light and walked straight toward it, sure that it was the court. It was the exit.",
            ar: "ثم رأى مستطيلاً ساطعاً من الضوء فمشى نحوه مباشرة، واثقاً أنه الملعب. كان المخرج.",
          },
          {
            en: "The heavy door closed behind him with a loud click. Danny was alone in the parking lot, in a giant chicken costume, in the middle of March.",
            ar: "أُغلق الباب الثقيل خلفه بنقرة عالية. وصار داني وحده في موقف السيارات، في بدلة دجاجة ضخمة، في منتصف مارس.",
          },
        ],
        question: {
          en: "What did Danny think the bright rectangle of light was?",
          ar: "ماذا ظنّ داني أن المستطيل الساطع من الضوء؟",
          options: [
            { en: "The court", ar: "الملعب" },
            { en: "The scoreboard", ar: "لوحة النتائج" },
            { en: "A camera light", ar: "ضوء كاميرا" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "The Other Chicken",
        titleAr: "الدجاجة الأخرى",
        lines: [
          {
            en: "Danny pushed the door, but it only opened from the inside. Then, through the mesh, he saw a second giant chicken walking toward him across the parking lot.",
            ar: "دفع داني الباب، لكنه لا يُفتح إلا من الداخل. ثم رأى من خلال الشبكة دجاجة ضخمة ثانية تمشي نحوه عبر موقف السيارات.",
          },
          {
            who: "Brenda",
            en: "Rookie. I could hear you crashing around from across the street.",
            ar: "مبتدئ. سمعتك تتخبّط من الجهة المقابلة من الشارع.",
          },
          {
            en: "Her name was Brenda, and she had been the mascot of Clucky's Chicken Shack for twenty-two years. She had come outside, she explained, to see what the competition looked like.",
            ar: "كان اسمها برندا، وكانت تميمة مطعم «كلاكي تشيكن شاك» منذ اثنتين وعشرين سنة. وقد خرجت، كما شرحت، لترى كيف يبدو المنافس.",
          },
          {
            who: "Brenda",
            en: "You're a disaster, honey. But I can fix that. Three rules.",
            ar: "أنت كارثة يا عزيزي. لكن أستطيع إصلاح ذلك. ثلاث قواعد.",
          },
          {
            who: "Brenda",
            en: "One: never walk when you can't see the stairs. Two: trust the cheerleaders. Three: if you fall, fall like you meant to.",
            ar: "الأولى: لا تمشِ حين لا ترى الدَّرَج. الثانية: ثِق بالمشجّعات. الثالثة: إذا سقطتَ فاسقط كأنك تقصد ذلك.",
          },
          {
            en: "She knew a side door that the band used for its instruments. In less than a minute, Danny was back in the tunnel, and he could already hear the crowd going quiet.",
            ar: "كانت تعرف باباً جانبياً تستخدمه الفرقة لآلاتها. وفي أقل من دقيقة عاد داني إلى النفق، وكان يسمع الجمهور وقد بدأ يهدأ.",
          },
        ],
        question: {
          en: "What was Brenda's third rule?",
          ar: "ما القاعدة الثالثة عند برندا؟",
          options: [
            { en: "Stay on the floor if you fall", ar: "ابقَ على الأرض إذا سقطت" },
            { en: "If you fall, fall like you meant to", ar: "إذا سقطتَ فاسقط كأنك تقصد ذلك" },
            { en: "Call the coach when you are lost", ar: "اتصل بالمدرّب حين تضيع" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "Fall Like You Meant To",
        titleAr: "اسقط كأنك تقصد",
        lines: [
          {
            en: "The Roosters were losing by one point, and there were thirty seconds left. The crowd was nervous and quiet.",
            ar: "كان «روسترز» متأخرين بنقطة واحدة، وبقيت ثلاثون ثانية. وكان الجمهور متوتراً وصامتاً.",
          },
          {
            en: "Coach Miller saw a chicken in the tunnel and waved both arms like a man landing a plane.",
            ar: "رأى المدرّب ميلر دجاجة في النفق فلوّح بذراعيه معاً كمن يهبط بطائرة.",
          },
          {
            who: "Coach Miller",
            en: "Get out there, Danny! Dance! Do anything!",
            ar: "اخرج إلى هناك يا داني! ارقص! افعل أي شيء!",
          },
          {
            en: "Danny ran onto the court, which mascots were never allowed to do. The referee blew his whistle.",
            ar: "ركض داني إلى الملعب، وهو ما لا يُسمح للتمائم بفعله أبداً. ونفخ الحكم في صافرته.",
          },
          {
            en: "A visiting player was about to take a free throw.",
            ar: "كان لاعب من الفريق الضيف على وشك تنفيذ رمية حرة.",
          },
          {
            en: "Danny wanted to dance, but his left foot found a puddle of sweat, and he slid across the floor on his stomach like a giant bowling ball.",
            ar: "أراد داني أن يرقص، لكن قدمه اليسرى وجدت بركة من العرق، فانزلق على بطنه عبر الأرضية كأنه كرة بولينغ عملاقة.",
          },
          {
            en: "Remembering Brenda's third rule, he lay there and raised one wing, as if everything had been planned.",
            ar: "وإذ تذكّر قاعدة برندا الثالثة، بقي مستلقياً ورفع جناحاً واحداً، كأن كل شيء كان مخططاً له.",
          },
          {
            en: "The visiting player stared at an enormous chicken at his feet, lost his concentration and missed both shots.",
            ar: "حدّق لاعب الفريق الضيف في دجاجة هائلة عند قدميه، وفقد تركيزه، وأخطأ في الرميتين.",
          },
        ],
        question: {
          en: "Why did the visiting player miss his shots?",
          ar: "لماذا أخطأ لاعب الفريق الضيف في رمياته؟",
          options: [
            {
              en: "A giant chicken slid across the floor beside him",
              ar: "انزلقت دجاجة ضخمة على الأرضية بجانبه",
            },
            { en: "The referee blew the whistle again", ar: "نفخ الحكم في الصافرة مرة أخرى" },
            { en: "The ball was too heavy", ar: "كانت الكرة ثقيلة جداً" },
          ],
          answer: 0,
          evidence: 7,
        },
      },
      {
        title: "The Rule",
        titleAr: "القاعدة",
        lines: [
          {
            en: "The Roosters grabbed the rebound and scored with four seconds left. They won by one point.",
            ar: "التقط «روسترز» الكرة المرتدة وسجّلوا قبل أربع ثوانٍ من النهاية. وفازوا بنقطة واحدة.",
          },
          {
            en: 'The next morning, the college paper printed a photograph of Danny on the floor under the headline "Chicken Wins Game."',
            ar: "في صباح اليوم التالي نشرت صحيفة الكلية صورة لداني على الأرضية تحت عنوان «الدجاجة تفوز بالمباراة».",
          },
          {
            en: 'Brenda had left a comment under it: "Rule three. I told you."',
            ar: "وكانت برندا قد تركت تعليقاً تحتها: «القاعدة الثالثة. قلتُ لك».",
          },
          {
            en: "The athletic director was less amused. By Friday, the student handbook had a new rule: mascots must stay off the court. Everyone called it the Danny Rule.",
            ar: "أما مدير الشؤون الرياضية فكان أقل استمتاعاً. وبحلول الجمعة صار في دليل الطلاب قاعدة جديدة: على التمائم أن تبقى خارج الملعب. وسمّاها الجميع «قاعدة داني».",
          },
          {
            who: "Coach Miller",
            en: "Danny, you broke a rule that didn't exist yet, embarrassed the department and won us the game. I'm giving you a raise.",
            ar: "داني، لقد خالفتَ قاعدة لم تكن موجودة بعد، وأحرجتَ القسم، وجلبتَ لنا الفوز. سأمنحك علاوة.",
          },
          {
            en: "The raise was five dollars. Danny accepted it with all the dignity a man can have while wearing a beak.",
            ar: "كانت العلاوة خمسة دولارات. وقبلها داني بكل الوقار الذي يستطيعه رجل يرتدي منقاراً.",
          },
          {
            en: "At the next game, he counted every step. And whenever he fell, he fell like he meant to.",
            ar: "وفي المباراة التالية عدّ كل خطوة. وكلما سقط، سقط كأنه يقصد ذلك.",
          },
        ],
        question: {
          en: "What was the Danny Rule?",
          ar: "ما «قاعدة داني»؟",
          options: [
            { en: "Mascots must wear smaller heads", ar: "على التمائم أن ترتدي رؤوساً أصغر" },
            { en: "Mascots must stay off the court", ar: "على التمائم أن تبقى خارج الملعب" },
            { en: "Mascots must be paid more", ar: "يجب أن تُدفع للتمائم أجور أعلى" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "What does Brenda's behavior in the parking lot show about her?",
      ar: "ماذا يُظهر تصرف برندا في موقف السيارات عن شخصيتها؟",
      options: [
        { en: "She was angry with the college", ar: "كانت غاضبة من الكلية" },
        { en: "She wanted Danny to lose the game", ar: "أرادت أن يخسر داني المباراة" },
        {
          en: "She was experienced and willing to help a beginner",
          ar: "كانت ذات خبرة ومستعدة لمساعدة مبتدئ",
        },
      ],
      answer: 2,
    },
    words: [
      {
        word: "mascot",
        sentence:
          "The last ___, Danny later learned, had quit after falling off the stage at a pep rally.",
        hintAr: "تميمة.",
      },
      {
        word: "costume",
        sentence: "He handed Danny a giant red-and-white chicken ___.",
        hintAr: "بدلة تنكرية.",
      },
      {
        word: "halftime",
        sentence:
          "Inside the costume, he could hear nothing but his own breathing, so at ___ he understood only two words of Coach Miller's shouting",
        hintAr: "استراحة الشوطين.",
      },
      {
        word: "cheerleaders",
        sentence: "Count your steps. And trust the ___.",
        hintAr: "مشجّعات.",
      },
      {
        word: "beak",
        sentence: "Danny could see only through a narrow mesh slit under the ___.",
        hintAr: "منقار.",
      },
      {
        word: "dignity",
        sentence: "Danny accepted it with all the ___ a man can have while wearing a beak.",
        hintAr: "وقار.",
      },
    ],
  },
];
