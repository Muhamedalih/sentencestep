import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B2, a scene about love at the same step as the others: less common words (stubborn,
 * fragile, creased), sentences that carry more than one idea, and questions that ask what
 * something means or implies rather than what happened. Written against everything already
 * in the library (the passages, the Daily Lessons, the Stories), so it repeats none of them
 * (see scripts/check-passage-duplicates.ts).
 */

export const B2_PASSAGES_PART_6: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 11
  {
    slug: "route-nine",
    order: 11,
    level: "B2",
    tone: "inspiring",
    icon: "map",
    title: "Route Nine",
    titleAr: "الطريق رقم تسعة",
    summary: "For forty-six years, Margaret won the Sunday argument. This Sunday, Harold let her.",
    summaryAr:
      "طوال ست وأربعين سنة كانت مارغريت تفوز بجدال الأحد. وفي هذا الأحد تركها هارولد تفوز.",
    cast: { Harold: "calm-male", Margaret: "autumn" },
    sections: [
      {
        title: "The Sunday Argument",
        titleAr: "جدال الأحد",
        lines: [
          {
            en: "Every Sunday for forty-six years, Harold and Margaret Whitaker had driven to their daughter's house for lunch, and every Sunday, before the car left the driveway, they had the same argument.",
            ar: "طوال ست وأربعين سنة، كان هارولد ومارغريت ويتاكر يقودان كل أحد إلى بيت ابنتهما لتناول الغداء، وفي كل أحد، قبل أن تغادر السيارة الممر، كان ينشب بينهما الجدال نفسه.",
          },
          {
            en: "Harold wanted Route Nine, the old road that wandered past every orchard and crossed a creek on a stone bridge.",
            ar: "كان هارولد يريد الطريق رقم تسعة، الطريق القديم الذي يتعرّج بمحاذاة كل بستان ويعبر جدولاً على جسر حجري.",
          },
          {
            en: "Margaret wanted the highway, which was faster, straighter and, in her opinion, far less likely to make her carsick.",
            ar: "وكانت مارغريت تريد الطريق السريع، لأنه أسرع وأكثر استقامة، وفي رأيها أقل احتمالاً بكثير لأن يصيبها بدوار السيارة.",
          },
          {
            who: "Harold",
            en: "A road should be something you enjoy, Maggie, not something you survive.",
            ar: "ينبغي أن يكون الطريق شيئاً تستمتعين به يا ماغي، لا شيئاً تنجين منه.",
          },
          {
            who: "Margaret",
            en: "A road should get you to your daughter's before the roast goes cold.",
            ar: "ينبغي أن يوصلك الطريق إلى ابنتك قبل أن يبرد اللحم المشويّ.",
          },
          {
            en: "Margaret always won. Harold grumbled about the soul of a road, stubborn to the end, until they reached the highway, and she pretended not to smile.",
            ar: "وكانت مارغريت تفوز دائماً. فكان هارولد يتذمّر من أجل روح الطريق، عنيداً حتى النهاية، إلى أن يبلغا الطريق السريع، وكانت هي تتظاهر بأنها لا تبتسم.",
          },
          {
            en: "Neither of them would ever have admitted it, but the argument was as much a part of Sunday as the roast itself.",
            ar: "ما كان أيٌّ منهما ليعترف بذلك قط، لكن الجدال كان جزءاً من يوم الأحد بقدر اللحم المشويّ نفسه.",
          },
        ],
        question: {
          en: "What does the passage suggest about the Sunday argument?",
          ar: "ما الذي توحي به القصة عن جدال الأحد؟",
          options: [
            { en: "It often made the family late", ar: "كان يؤخر العائلة في أحيان كثيرة" },
            { en: "Both of them secretly enjoyed it", ar: "كان كلاهما يستمتع به سراً" },
            { en: "Margaret wanted it to end", ar: "كانت مارغريت تريد أن ينتهي" },
            { en: "Harold had never meant it seriously", ar: "لم يكن هارولد جاداً فيه قط" },
          ],
          answer: 1,
          evidence: 6,
        },
      },
      {
        title: "Highway's Fine",
        titleAr: "الطريق السريع مناسب",
        lines: [
          {
            en: "This Sunday, Margaret sat behind the wheel with her arguments ready, as she had for forty-six years. Harold fastened his seat belt and looked straight ahead.",
            ar: "في هذا الأحد جلست مارغريت خلف المقود وحججها جاهزة، كما فعلت طوال ست وأربعين سنة. أحكم هارولد حزام الأمان ونظر أمامه مباشرة.",
          },
          {
            who: "Harold",
            en: "Highway's fine.",
            ar: "الطريق السريع مناسب.",
          },
          {
            en: "Margaret waited for the rest of the sentence. There wasn't any.",
            ar: "انتظرت مارغريت بقية الجملة. لكن لم تكن هناك بقية.",
          },
          {
            en: "On his knee lay a folded piece of newspaper, and he kept smoothing it with his thumb, the way people touch something fragile.",
            ar: "على ركبته ورقة جريدة مطوية، وكان يمرّر إبهامه عليها مراراً ليسوّيها، كما يلمس الناس شيئاً هشّاً.",
          },
          {
            who: "Margaret",
            en: "No speech about the soul of a road?",
            ar: "لا خطبة عن روح الطريق؟",
          },
          {
            who: "Harold",
            en: "Not today, Maggie.",
            ar: "ليس اليوم يا ماغي.",
          },
          {
            en: "She had won every Sunday of her married life. She had never won one like this, and she found, to her surprise, that she hated it.",
            ar: "فازت في كل أحد من حياتها الزوجية. لكنها لم تفز قط بأحد كهذا، ووجدت، لدهشتها، أنها تكرهه.",
          },
        ],
        question: {
          en: "Why did Margaret feel uneasy?",
          ar: "لماذا شعرت مارغريت بالقلق؟",
          options: [
            { en: "She was running late for lunch", ar: "كانت متأخرة عن الغداء" },
            { en: "Harold had forgotten the way", ar: "كان هارولد قد نسي الطريق" },
            { en: "The car was making a strange noise", ar: "كانت السيارة تصدر ضجيجاً غريباً" },
            {
              en: "Harold had given up an argument he never gave up",
              ar: "تخلّى هارولد عن جدال لم يتخلَّ عنه قط",
            },
          ],
          answer: 3,
          evidence: 2,
        },
      },
      {
        title: "The Headline",
        titleAr: "العنوان",
        lines: [
          {
            en: "At the first red light, Margaret glanced at the newspaper on his knee. Though it was upside down, she could read the headline: the county would demolish the old Miller Creek Bridge in March.",
            ar: "عند أول إشارة حمراء، ألقت مارغريت نظرة على الجريدة فوق ركبته. ومع أنها كانت مقلوبة، استطاعت أن تقرأ العنوان: ستهدم المقاطعة جسر ميلر كريك القديم في آذار.",
          },
          {
            en: "She said nothing. In fifty years she had learned that Harold could argue about anything except the things that hurt.",
            ar: "لم تقل شيئاً. فخلال خمسين سنة تعلّمت أن هارولد يستطيع أن يجادل في كل شيء إلا الأشياء التي تؤلمه.",
          },
          {
            en: "The light turned green. Straight ahead was the ramp to the highway. To the right, half hidden by a hedge, was the narrow turn to Route Nine.",
            ar: "تحوّلت الإشارة إلى الأخضر. وأمامهما مباشرة منحدر الطريق السريع. وعلى اليمين، نصف مخفيّ خلف سياج نباتي، كان المنعطف الضيق المؤدي إلى الطريق رقم تسعة.",
          },
          {
            who: "Margaret",
            en: "I think I'd like to go by Route Nine today.",
            ar: "أظن أنني أودّ أن نسلك الطريق رقم تسعة اليوم.",
          },
          {
            who: "Harold",
            en: "It's twenty minutes longer. We'll be late. The roast...",
            ar: "إنه أطول بعشرين دقيقة. سنتأخر. واللحم...",
          },
          {
            who: "Margaret",
            en: "Then the roast will have to forgive us.",
            ar: "إذن سيكون على اللحم أن يسامحنا.",
          },
          {
            en: "She turned right. Harold didn't say a word, but he slid the newspaper into the glove compartment, gently, as if he were putting it to bed.",
            ar: "انعطفت يميناً. لم ينطق هارولد بكلمة، لكنه دسّ الجريدة في صندوق السيارة الأمامي بلطف، كأنه يضعها في فراشها لتنام.",
          },
        ],
        question: {
          en: "Why did Margaret turn onto Route Nine without asking Harold what was wrong?",
          ar: "لماذا انعطفت مارغريت إلى الطريق رقم تسعة دون أن تسأل هارولد عمّا يزعجه؟",
          options: [
            {
              en: "She understood that Harold could not talk about what hurt him",
              ar: "أدركت أن هارولد لا يستطيع الحديث عمّا يؤلمه",
            },
            {
              en: "She wanted to avoid the traffic on the highway",
              ar: "أرادت تفادي الازدحام على الطريق السريع",
            },
            { en: "She was tired of arguing with him", ar: "سئمت من الجدال معه" },
            { en: "She had planned a surprise for weeks", ar: "كانت تخطط لمفاجأة منذ أسابيع" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "The Bridge",
        titleAr: "الجسر",
        lines: [
          {
            en: "The road wound through the orchards, bare and gray in the November light, and neither of them spoke until the stone bridge appeared at the bottom of the hill.",
            ar: "التفّ الطريق بين البساتين العارية الرمادية في ضوء تشرين الثاني، ولم يتكلم أي منهما حتى ظهر الجسر الحجري في أسفل التلّ.",
          },
          {
            en: "Margaret pulled onto the gravel beside the bridge and turned off the engine. They got out and stood at the stone railing, and below them the creek was brown and slow.",
            ar: "أوقفت مارغريت السيارة على الحصى بجانب الجسر وأطفأت المحرك. ونزلا ووقفا عند الدرابزين الحجري، وتحتهما كان الجدول بنيّاً بطيئاً.",
          },
          {
            who: "Harold",
            en: "It was a sunny day when I asked you. Do you remember? Not a cloud in the sky.",
            ar: "كان يوماً مشمساً حين طلبت يدك. هل تذكرين؟ لا غيمة في السماء.",
          },
          {
            who: "Margaret",
            en: "It was pouring, Harold. I held my coat over my head, and you stood there soaked to the bone and then discovered you'd left the ring in the car.",
            ar: "كانت السماء تمطر بغزارة يا هارولد. رفعت معطفي فوق رأسي، ووقفتَ أنت مبتلاً حتى العظم ثم اكتشفتَ أنك تركت الخاتم في السيارة.",
          },
          {
            who: "Harold",
            en: "Sunny.",
            ar: "كان مشمساً.",
          },
          {
            who: "Margaret",
            en: "Pouring.",
            ar: "كانت تمطر.",
          },
          {
            en: "And for the first time that morning, the Whitakers sounded like themselves again.",
            ar: "وللمرة الأولى في ذلك الصباح، عاد الزوجان ويتاكر يتحدثان كما هما.",
          },
        ],
        question: {
          en: 'Why does the narrator say the Whitakers "sounded like themselves again"?',
          ar: "لماذا يقول الراوي إن الزوجين ويتاكر «عادا يتحدثان كما هما»؟",
          options: [
            { en: "They were finally speaking loudly", ar: "كانا يتكلمان أخيراً بصوت عالٍ" },
            {
              en: "They had finally agreed about the weather",
              ar: "اتفقا أخيراً بشأن حال الطقس",
            },
            { en: "Their familiar quarrel had returned", ar: "عاد شجارهما المألوف" },
            {
              en: "They had forgotten the reason for the trip",
              ar: "كانا قد نسيا سبب الرحلة",
            },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Photograph",
        titleAr: "الصورة",
        lines: [
          {
            en: "Harold took out his wallet slowly, as if he were about to give away a secret. Tucked behind his driver's license was a small, creased photograph.",
            ar: "أخرج هارولد محفظته ببطء، كأنه على وشك أن يبوح بسرّ. وكانت مدسوسة خلف رخصة قيادته صورة صغيرة مجعَّدة.",
          },
          {
            en: "It showed a young man and a young woman on this very bridge, drenched and laughing, with a coat held over their heads like a roof.",
            ar: "أظهرت شاباً وشابة على هذا الجسر نفسه، غارقين بالماء وضاحكين، ومعطف مرفوع فوق رأسيهما كأنه سقف.",
          },
          {
            who: "Margaret",
            en: "You've had that all along.",
            ar: "كانت معك طوال الوقت.",
          },
          {
            who: "Harold",
            en: "I've always known it rained, Maggie. But when I think of that day, you're standing here, and it's sunny. I've never been able to remember it any other way.",
            ar: "كنت أعرف دائماً أنها أمطرت يا ماغي. لكنني حين أفكر في ذلك اليوم أراكِ واقفة هنا، ويكون مشمساً. لم أستطع قط أن أتذكره بطريقة أخرى.",
          },
          {
            en: "For forty-six years, Margaret had defended the rain with every fact she owned. Now she looked at the photograph, then at the brown water below, and discovered she had run out of facts.",
            ar: "طوال ست وأربعين سنة دافعت مارغريت عن المطر بكل ما تملكه من وقائع. والآن نظرت إلى الصورة، ثم إلى الماء البنيّ تحتها، واكتشفت أن وقائعها قد نفدت.",
          },
          {
            who: "Margaret",
            en: "Sunny. It was a lovely, sunny day.",
            ar: "مشمس. كان يوماً جميلاً مشمساً.",
          },
          {
            en: "They reached their daughter's house an hour late and blamed the highway. It was the first secret they had ever kept from their daughter, and they kept it badly, smiling at each other across the roast.",
            ar: "وصلا إلى بيت ابنتهما متأخرين ساعة، وألقيا اللوم على الطريق السريع. كان ذلك أول سرّ يخفيانه عن ابنتهما، وأخفياه بسوء شديد، يبتسم كلٌّ منهما للآخر فوق مائدة اللحم المشويّ.",
          },
        ],
        question: {
          en: 'What does Margaret\'s final answer, "Sunny," show?',
          ar: "ماذا تُظهر إجابة مارغريت الأخيرة «مشمس»؟",
          options: [
            { en: "She wanted to end the conversation quickly", ar: "أرادت إنهاء الحديث بسرعة" },
            {
              en: "She cared more about Harold's memory than about being right",
              ar: "كانت تهتم بذكرى هارولد أكثر من اهتمامها بأن تكون على حق",
            },
            { en: "She had finally realized she was mistaken", ar: "أدركت أخيراً أنها كانت مخطئة" },
            { en: "She had forgotten what really happened", ar: "كانت قد نسيت ما حدث فعلاً" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "What does the story suggest about the habits a couple shares over a lifetime?",
      ar: "ما الذي توحي به القصة عن العادات التي يتشاركها الزوجان على مدى العمر؟",
      options: [
        {
          en: "Couples are happiest when they never disagree",
          ar: "يكون الزوجان أسعد ما يكونان حين لا يختلفان أبداً",
        },
        {
          en: "Old roads are always better than new ones",
          ar: "الطرق القديمة دائماً أفضل من الجديدة",
        },
        {
          en: "Habits eventually make people stop listening to each other",
          ar: "العادات تجعل الناس في النهاية يكفّون عن الإصغاء لبعضهم",
        },
        {
          en: "Even a couple's quarrels can be a way of saying \"I'm still here\"",
          ar: "حتى شجارات الزوجين قد تكون طريقة للقول: «ما زلتُ هنا»",
        },
      ],
      answer: 3,
    },
    words: [
      {
        word: "orchard",
        sentence: "the old road that wandered past every ___ and crossed a creek on a stone bridge",
        hintAr: "بستان أشجار مثمرة.",
      },
      {
        word: "stubborn",
        sentence: "grumbled about the soul of a road, ___ to the end",
        hintAr: "عنيد.",
      },
      {
        word: "fragile",
        sentence: "the way people touch something ___",
        hintAr: "هشّ، سريع الكسر.",
      },
      {
        word: "demolish",
        sentence: "the county would ___ the old Miller Creek Bridge in March",
        hintAr: "يهدم.",
      },
      {
        word: "creased",
        sentence: "a small, ___ photograph",
        hintAr: "مجعَّد.",
      },
      {
        word: "drenched",
        sentence: "on this very bridge, ___ and laughing",
        hintAr: "غارق بالماء.",
      },
    ],
  },
];
