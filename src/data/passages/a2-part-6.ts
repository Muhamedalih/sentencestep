import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A2, a scene about love at the step of the earlier sets — the past tense carries the
 * story, the dialogue is quick, and there is a turn and a payoff at the end. Written
 * against everything already in the library (the passages, the Daily Lessons, the
 * Stories), so it repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const A2_PASSAGES_PART_6: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 15
  {
    slug: "one-umbrella",
    order: 15,
    level: "A2",
    tone: "funny",
    icon: "heart",
    title: "One Umbrella",
    titleAr: "مظلة واحدة",
    summary: "Every rainy morning, Emily stayed dry. Jack's coat never did.",
    summaryAr: "في كل صباح ماطر كانت إيميلي تبقى جافة. أما معطف جاك فلم يكن كذلك أبداً.",
    cast: { Emily: "ash", Jack: "russ", Beth: "zara" },
    sections: [
      {
        title: "Rainy Mornings",
        titleAr: "صباحات ماطرة",
        lines: [
          {
            en: "Emily and Jack were married. Every morning, they walked to the station together.",
            ar: "كانت إيميلي وجاك متزوجَين. وكل صباح كانا يمشيان معاً إلى المحطة.",
          },
          {
            en: "On rainy days, they shared one umbrella, and Jack always held it.",
            ar: "وفي الأيام الماطرة كانا يتشاركان مظلة واحدة، وكان جاك هو من يحملها دائماً.",
          },
          {
            en: "Emily loved those walks. She never got wet. Not one drop.",
            ar: "كانت إيميلي تحب تلك المشاوير. لم تكن تبتلّ أبداً. ولا قطرة واحدة.",
          },
          {
            en: "One rainy Monday, Emily's friend Beth met them at the station.",
            ar: "في صباح اثنين ماطر، التقت بهما صديقة إيميلي، بيث، عند المحطة.",
          },
          {
            who: "Beth",
            en: "Jack, your coat is soaked on one side! Look!",
            ar: "جاك، معطفك غارق بالماء من جهة واحدة! انظر!",
          },
          {
            who: "Jack",
            en: "It's nothing. It's only a little rain.",
            ar: "لا شيء. إنه مجرد قليل من المطر.",
          },
          {
            en: "Emily looked at him. His left shoulder was dark with water. Her coat was completely dry.",
            ar: "نظرت إيميلي إليه. كان كتفه الأيسر داكناً من الماء. أما معطفها فكان جافاً تماماً.",
          },
        ],
        question: {
          en: "What did Beth notice?",
          ar: "ماذا لاحظت بيث؟",
          options: [
            { en: "Emily forgot her umbrella", ar: "نسيت إيميلي مظلتها" },
            { en: "Jack's coat was wet on one side", ar: "كان معطف جاك مبتلاً من جهة واحدة" },
            { en: "The train was late", ar: "كان القطار متأخراً" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "Six Years of Rain",
        titleAr: "ست سنوات من المطر",
        lines: [
          {
            en: "All day at work, Emily thought about Jack's coat.",
            ar: "طوال اليوم في العمل ظلّت إيميلي تفكر في معطف جاك.",
          },
          {
            en: "She remembered every rainy morning of the last six years. She stayed dry. Jack got wet. Every time.",
            ar: "تذكّرت كل صباح ماطر خلال السنوات الست الماضية. كانت تبقى جافة، ويبتلّ جاك. في كل مرة.",
          },
          {
            en: "And he never said a word. He never even complained about the cold.",
            ar: "ولم ينطق بكلمة قط. ولم يشتكِ حتى من البرد.",
          },
          {
            en: "That evening, his gray coat hung by the door. It was still wet.",
            ar: "في ذلك المساء كان معطفه الرمادي معلقاً قرب الباب. وكان لا يزال مبتلاً.",
          },
          {
            who: "Emily",
            en: "Jack, why didn't you ever tell me you were getting wet?",
            ar: "جاك، لماذا لم تخبرني قط بأنك كنت تبتلّ؟",
          },
          {
            who: "Jack",
            en: "I wasn't getting wet. I was keeping you dry. That's different.",
            ar: "لم أكن أبتلّ. كنت أُبقيكِ جافة. وهذا مختلف.",
          },
          {
            en: "Emily had no answer for that. She hugged him for a long time.",
            ar: "لم يكن لدى إيميلي ما تردّ به على ذلك. فعانقته طويلاً.",
          },
        ],
        question: {
          en: "For how long did Jack get wet?",
          ar: "طوال كم من الوقت كان جاك يبتلّ؟",
          options: [
            { en: "One year", ar: "سنة واحدة" },
            { en: "Six months", ar: "ستة أشهر" },
            { en: "Six years", ar: "ست سنوات" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "The Dance",
        titleAr: "الرقصة",
        lines: [
          {
            en: "On Thursday, it rained again.",
            ar: "يوم الخميس أمطرت السماء مرة أخرى.",
          },
          {
            who: "Emily",
            en: "Give me the umbrella, Jack. Today I will hold it.",
            ar: "أعطني المظلة يا جاك. اليوم سأحملها أنا.",
          },
          {
            en: "She held it over his head. After five steps, Jack put his hand on the handle and pushed it back over her.",
            ar: "رفعتها فوق رأسه. وبعد خمس خطوات وضع جاك يده على المقبض وأعادها فوقها.",
          },
          {
            en: "She pushed it left. He pushed it right. She pushed it left again. He pushed it right again.",
            ar: "دفعتها إلى اليسار. فدفعها إلى اليمين. دفعتها إلى اليسار من جديد. فدفعها إلى اليمين من جديد.",
          },
          {
            en: "A man with a newspaper stopped to stare at them. They looked like two people dancing badly.",
            ar: "توقف رجل يحمل جريدة ليحدّق فيهما. كانا يبدوان كشخصين يرقصان رقصاً سيئاً.",
          },
          {
            who: "Emily",
            en: "Jack! Stop moving the umbrella!",
            ar: "جاك! كفّ عن تحريك المظلة!",
          },
          {
            who: "Jack",
            en: "I can't! My hand does it by itself!",
            ar: "لا أستطيع! يدي تفعل ذلك من تلقاء نفسها!",
          },
        ],
        question: {
          en: "What did Jack do with the umbrella?",
          ar: "ماذا فعل جاك بالمظلة؟",
          options: [
            { en: "He kept moving it back over Emily", ar: "ظل يعيدها فوق إيميلي" },
            { en: "He closed it", ar: "أغلقها" },
            { en: "He gave it to a stranger", ar: "أعطاها لغريب" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "A Little Closer",
        titleAr: "أقرب قليلاً",
        lines: [
          {
            en: "Emily stopped in the middle of the sidewalk. She had an idea.",
            ar: "توقفت إيميلي في منتصف الرصيف. وخطرت لها فكرة.",
          },
          {
            en: "She put her arm through Jack's arm and stepped close, closer than they usually walked.",
            ar: "مرّرت ذراعها في ذراع جاك واقتربت منه أكثر مما اعتادا أن يمشيا.",
          },
          {
            en: "Their shoulders touched. Suddenly, the umbrella was big enough for two.",
            ar: "تلامس كتفاهما. وفجأة صارت المظلة كبيرة بما يكفي لاثنين.",
          },
          {
            who: "Jack",
            en: "Wait. Both of us? Dry?",
            ar: "مهلاً. كلانا؟ جافّان؟",
          },
          {
            who: "Emily",
            en: "You only had to stand a little closer.",
            ar: "كان عليك فقط أن تقف أقرب قليلاً.",
          },
          {
            en: "Jack did not answer. He just smiled the same smile he smiled on their wedding day.",
            ar: "لم يجب جاك. بل ابتسم الابتسامة نفسها التي ابتسمها في يوم زفافهما.",
          },
          {
            en: "They were ten minutes late for work. They walked very slowly, and for the first time in six years, Jack's coat stayed dry.",
            ar: "تأخرا عن العمل عشر دقائق. مشيا ببطء شديد، وللمرة الأولى منذ ست سنوات، بقي معطف جاك جافاً.",
          },
        ],
        question: {
          en: "How did Emily keep both of them dry?",
          ar: "كيف أبقت إيميلي كليهما جافَّين؟",
          options: [
            { en: "She bought a bigger umbrella", ar: "اشترت مظلة أكبر" },
            { en: "She stepped closer to Jack", ar: "اقتربت من جاك" },
            { en: "She walked behind him", ar: "مشت خلفه" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "Why was Jack's coat always wet?",
      ar: "لماذا كان معطف جاك مبتلاً دائماً؟",
      options: [
        { en: "He liked walking in the rain", ar: "كان يحب المشي تحت المطر" },
        { en: "He always forgot to close his coat", ar: "كان ينسى دائماً أن يزرّر معطفه" },
        { en: "He held the umbrella over Emily", ar: "كان يحمل المظلة فوق إيميلي" },
      ],
      answer: 2,
    },
    words: [
      {
        word: "station",
        sentence: "they walked to the ___ together",
        hintAr: "محطة.",
      },
      {
        word: "drop",
        sentence: "Not one ___.",
        hintAr: "قطرة.",
      },
      {
        word: "soaked",
        sentence: "your coat is ___ on one side",
        hintAr: "غارق بالماء.",
      },
      {
        word: "handle",
        sentence: "put his hand on the ___",
        hintAr: "مقبض.",
      },
      {
        word: "stare",
        sentence: "stopped to ___ at them",
        hintAr: "يحدّق.",
      },
    ],
  },
];
