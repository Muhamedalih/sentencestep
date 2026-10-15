import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1, a later addition: one more scene at the step of the first two sets —
 * longer sentences, reported speech, the past perfect where the story looks back,
 * and nothing that reads like a lesson. Written against everything already in the
 * library (the passages, the Daily Lessons, the Stories), so it repeats none of
 * them (see scripts/check-passage-duplicates.ts).
 */

export const B1_PASSAGES_PART_3: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 7
  {
    slug: "the-biggest-pumpkin",
    order: 7,
    level: "B1",
    tone: "funny",
    icon: "sun",
    title: "The Biggest Pumpkin",
    titleAr: "أكبر يقطينة",
    summary: "Henry had one goal this autumn: to beat Mrs. Dale and her pumpkin.",
    summaryAr: "كان لهنري هدف واحد هذا الخريف: أن يهزم السيدة ديل ويقطينتها.",
    cast: { Henry: "calm-male", "Mrs. Dale": "autumn", Sophie: "ash", "Judge Tanner": "russ" },
    sections: [
      {
        title: "Eleven Years",
        titleAr: "إحدى عشرة سنة",
        lines: [
          {
            en: "Every October, the Greene County Fair held a contest for the biggest pumpkin. For eleven years in a row, the winner had been the same person: Mrs. Dale.",
            ar: "في كل أكتوبر كان معرض مقاطعة غرين يقيم مسابقة لأكبر يقطينة. ومنذ إحدى عشرة سنة متتالية كان الفائز هو الشخص نفسه: السيدة ديل.",
          },
          {
            en: 'Henry, a retired postman, had come second three times. Every year, she had shaken his hand and said, "Better luck next year, dear."',
            ar: "كان هنري، ساعي البريد المتقاعد، قد حلّ ثانياً ثلاث مرات. وفي كل عام صافحته وقالت: «حظاً أوفر في العام القادم يا عزيزي».",
          },
          {
            who: "Henry",
            en: "Better luck? I don't need luck. I need a bigger pumpkin.",
            ar: "حظاً أوفر؟ أنا لا أحتاج إلى حظ. أحتاج إلى يقطينة أكبر.",
          },
          {
            en: "That winter, he read four books about giant pumpkins. In April, he planted one special seed in the sunniest corner of his garden.",
            ar: "في ذلك الشتاء قرأ أربعة كتب عن اليقطين العملاق. وفي أبريل زرع بذرة خاصة واحدة في أكثر أركان حديقته إشراقاً بالشمس.",
          },
          {
            who: "Sophie",
            en: "Grandpa, what are you going to call it?",
            ar: "جدي، ماذا ستسميها؟",
          },
          {
            who: "Henry",
            en: "It's a vegetable, Sophie. Vegetables don't have names.",
            ar: "إنها خضار يا صوفي. الخضار ليس لها أسماء.",
          },
          {
            en: "Sophie called it Gerald anyway.",
            ar: "ومع ذلك سمّتها صوفي جيرالد.",
          },
        ],
        question: {
          en: "Who had won the contest for eleven years?",
          ar: "من فاز بالمسابقة طوال إحدى عشرة سنة؟",
          options: [
            { en: "Henry", ar: "هنري" },
            { en: "Mrs. Dale", ar: "السيدة ديل" },
            { en: "Sophie", ar: "صوفي" },
          ],
          answer: 1,
          evidence: 0,
        },
      },
      {
        title: "Gerald",
        titleAr: "جيرالد",
        lines: [
          {
            en: "By July, Gerald was the size of a basketball. By August, he was the size of a washing machine, and he was growing twenty pounds a day.",
            ar: "بحلول يوليو كان جيرالد بحجم كرة السلة. وبحلول أغسطس صار بحجم غسالة، وكان يزداد عشرين رطلاً في اليوم.",
          },
          {
            en: "Henry stopped going on holiday. He watered Gerald at six every morning and at six every evening, and he talked to him the whole time.",
            ar: "توقف هنري عن الذهاب في العطلات. كان يسقي جيرالد في السادسة كل صباح وفي السادسة كل مساء، ويتحدث إليه طوال الوقت.",
          },
          {
            who: "Henry",
            en: "Good morning, Gerald. Beautiful day. Don't think about Mrs. Dale.",
            ar: "صباح الخير يا جيرالد. يوم جميل. لا تفكر في السيدة ديل.",
          },
          {
            en: "His neighbors thought he was crazy, especially when he bought a huge beach umbrella to protect Gerald from the afternoon sun.",
            ar: "ظن جيرانه أنه مجنون، خصوصاً حين اشترى مظلة شاطئ ضخمة ليحمي جيرالد من شمس العصر.",
          },
          {
            en: "One night in September, a storm warning came on the radio. Henry grabbed every blanket in the house and ran into the garden in his pajamas.",
            ar: "في ليلة من ليالي سبتمبر، جاء تحذير من عاصفة على الراديو. أخذ هنري كل بطانية في البيت وركض إلى الحديقة بملابس النوم.",
          },
          {
            who: "Sophie",
            en: "Grandpa, you can't sleep outside with a pumpkin!",
            ar: "جدي، لا يمكنك أن تنام في الخارج مع يقطينة!",
          },
          {
            who: "Henry",
            en: "Watch me.",
            ar: "شاهديني.",
          },
        ],
        question: {
          en: "What did Henry do when the storm warning came?",
          ar: "ماذا فعل هنري حين جاء تحذير العاصفة؟",
          options: [
            {
              en: "He ran to the garden with every blanket he had",
              ar: "ركض إلى الحديقة ومعه كل بطانية عنده",
            },
            { en: "He moved Gerald into the house", ar: "نقل جيرالد إلى داخل البيت" },
            { en: "He called his neighbors for help", ar: "اتصل بجيرانه طالباً المساعدة" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "The Move",
        titleAr: "النقل",
        lines: [
          {
            en: "On the morning of the fair, Gerald weighed more than eight hundred and ninety pounds, and he was still sitting in the garden.",
            ar: "في صباح يوم المعرض كان وزن جيرالد يتجاوز ثمانمئة وتسعين رطلاً، وكان لا يزال جالساً في الحديقة.",
          },
          {
            en: "Henry had a problem: his truck was too small. He called his neighbors, and nine of them arrived with ropes, boards and a tractor.",
            ar: "كانت لدى هنري مشكلة: شاحنته صغيرة جداً. اتصل بجيرانه، فجاء تسعة منهم بحبال وألواح وجرار.",
          },
          {
            who: "Henry",
            en: "Slowly, everybody, slowly! If he cracks, I will never forgive myself.",
            ar: "ببطء يا جماعة، ببطء! إذا تشقق فلن أسامح نفسي أبداً.",
          },
          {
            en: "It took two hours to roll Gerald onto the truck. The neighbors clapped, and one said he had not worked so hard since he moved his piano.",
            ar: "استغرق دحرجة جيرالد إلى الشاحنة ساعتين. صفّق الجيران، وقال أحدهم إنه لم يتعب هكذا منذ أن نقل بيانو بيته.",
          },
          {
            en: "Henry drove to the fair at ten miles an hour. Sophie sat in the back with one hand on Gerald, as if he were a sleeping elephant.",
            ar: "قاد هنري إلى المعرض بسرعة عشرة أميال في الساعة. جلست صوفي في الخلف ويدها على جيرالد، كأنه فيل نائم.",
          },
        ],
        question: {
          en: "What was Henry's problem on the morning of the fair?",
          ar: "ما المشكلة التي واجهت هنري صباح يوم المعرض؟",
          options: [
            { en: "He had lost his entry form", ar: "كان قد أضاع استمارة المشاركة" },
            { en: "Gerald had a crack in him", ar: "كان في جيرالد شق" },
            { en: "His truck was too small", ar: "كانت شاحنته أصغر من اللازم" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "The Scale",
        titleAr: "الميزان",
        lines: [
          {
            en: 'Twenty pumpkins sat in a long row on the grass. Mrs. Dale\'s was in the middle, with an oak sign that said, "Eleven-time champion."',
            ar: "كانت عشرون يقطينة مصطفّة في صف طويل على العشب. وكانت يقطينة السيدة ديل في الوسط، وعليها لافتة من خشب البلوط كُتب عليها: «بطلة إحدى عشرة مرة».",
          },
          {
            who: "Mrs. Dale",
            en: "Henry, dear! What an enormous pumpkin. Is it yours? How lovely.",
            ar: "هنري يا عزيزي! يا لها من يقطينة ضخمة. هل هي لك؟ ما أجملها.",
          },
          {
            en: "Judge Tanner, a tall man with a clipboard, weighed them one by one, and the crowd held its breath.",
            ar: "كان القاضي تانر، وهو رجل طويل يحمل لوحاً للكتابة، يزن اليقطينات واحدة بعد أخرى، وحبس الجمهور أنفاسه.",
          },
          {
            who: "Judge Tanner",
            en: "Mrs. Dale's pumpkin: nine hundred and four pounds.",
            ar: "يقطينة السيدة ديل: تسعمئة وأربعة أرطال.",
          },
          {
            en: "Then a crane lifted Gerald onto the scale. The needle shook for a long time, and finally it stopped: nine hundred and three pounds.",
            ar: "ثم رفعت رافعة جيرالد إلى الميزان. ارتجفت الإبرة طويلاً، ثم توقفت أخيراً: تسعمئة وثلاثة أرطال.",
          },
          {
            who: "Henry",
            en: "One pound! Eleven years, and I lost by one pound!",
            ar: "رطل واحد! إحدى عشرة سنة، وخسرت برطل واحد!",
          },
          {
            who: "Sophie",
            en: "It's okay, Grandpa. Gerald is still the most beautiful.",
            ar: "لا بأس يا جدي. جيرالد ما زال الأجمل.",
          },
        ],
        question: {
          en: "How much did Gerald weigh at the fair?",
          ar: "كم كان وزن جيرالد في المعرض؟",
          options: [
            { en: "Nine hundred and four pounds", ar: "تسعمئة وأربعة أرطال" },
            { en: "Nine hundred and three pounds", ar: "تسعمئة وثلاثة أرطال" },
            { en: "Eight hundred and ninety pounds", ar: "ثمانمئة وتسعون رطلاً" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "The Oak Sign",
        titleAr: "لافتة البلوط",
        lines: [
          {
            en: "Mrs. Dale was staring at the scale. Then she looked at her own pumpkin, then at her sign, and then she started to laugh.",
            ar: "كانت السيدة ديل تحدّق في الميزان. ثم نظرت إلى يقطينتها، ثم إلى لافتتها، ثم بدأت تضحك.",
          },
          {
            who: "Mrs. Dale",
            en: "Judge, wait. When you weighed mine, my sign was lying on top of it. It's made of solid oak.",
            ar: "أيها القاضي، انتظر. عندما وزنت يقطينتي كانت لافتتي موضوعة فوقها. إنها مصنوعة من خشب البلوط الصلب.",
          },
          {
            who: "Judge Tanner",
            en: "How heavy is a sign like that?",
            ar: "كم تزن لافتة كهذه؟",
          },
          {
            who: "Mrs. Dale",
            en: "About three pounds. My husband made it for me, and he never did anything small.",
            ar: "حوالي ثلاثة أرطال. صنعها لي زوجي، وهو لم يفعل شيئاً صغيراً في حياته.",
          },
          {
            en: "They took off the sign and weighed her pumpkin again. The needle moved: nine hundred and one pounds.",
            ar: "أزالوا اللافتة ووزنوا يقطينتها مرة أخرى. تحركت الإبرة: تسعمئة ورطل واحد.",
          },
          {
            en: "The crowd gasped. Henry did not move. Sophie screamed so loudly that three dogs started to bark.",
            ar: "شهق الجمهور. لم يتحرك هنري. وصرخت صوفي بصوت عالٍ حتى بدأت ثلاثة كلاب بالنباح.",
          },
          {
            who: "Mrs. Dale",
            en: "Congratulations, dear. It was about time. But next year, my sign stays at home, and my pumpkin stays bigger.",
            ar: "تهانيّ يا عزيزي. كان قد آن الأوان. لكن في العام القادم ستبقى لافتتي في البيت، وستبقى يقطينتي أكبر.",
          },
          {
            en: "That night, Gerald became the biggest pumpkin pie in the history of Greene County. Mrs. Dale brought the cream.",
            ar: "في تلك الليلة صار جيرالد أكبر فطيرة يقطين في تاريخ مقاطعة غرين. وأحضرت السيدة ديل الكريمة.",
          },
        ],
        question: {
          en: "Why did Henry win in the end?",
          ar: "لماذا فاز هنري في النهاية؟",
          options: [
            {
              en: "Mrs. Dale's pumpkin had been weighed together with her heavy sign",
              ar: "كانت يقطينة السيدة ديل قد وُزنت مع لافتتها الثقيلة",
            },
            { en: "Gerald grew during the afternoon", ar: "كبر جيرالد خلال فترة العصر" },
            { en: "The judge changed the rules", ar: "غيّر القاضي القواعد" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "What does Mrs. Dale's behavior at the end show about her?",
      ar: "ماذا يُظهر تصرف السيدة ديل في النهاية عن شخصيتها؟",
      options: [
        { en: "She was angry with the judge", ar: "كانت غاضبة من القاضي" },
        { en: "She did not care about the contest", ar: "لم تكن تهتم بالمسابقة" },
        {
          en: "She was honest, even though it cost her the prize",
          ar: "كانت صادقة، حتى لو كلّفها ذلك الجائزة",
        },
      ],
      answer: 2,
    },
    words: [
      {
        word: "contest",
        sentence: "Every October, the Greene County Fair held a ___ for the biggest pumpkin.",
        hintAr: "مسابقة.",
      },
      {
        word: "protect",
        sentence:
          "His neighbors thought he was crazy, especially when he bought a huge beach umbrella to ___ Gerald from the afternoon sun.",
        hintAr: "يحمي.",
      },
      {
        word: "clipboard",
        sentence:
          "Judge Tanner, a tall man with a ___, weighed them one by one, and the crowd held its breath.",
        hintAr: "لوح كتابة.",
      },
      {
        word: "enormous",
        sentence: "What an ___ pumpkin.",
        hintAr: "ضخم.",
      },
      {
        word: "crane",
        sentence: "Then a ___ lifted Gerald onto the scale.",
        hintAr: "رافعة.",
      },
    ],
  },
];
