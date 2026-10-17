import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A1, a scene about love at the same step as the earlier sets — present tenses, short
 * sentences, everyday words, a turn in the middle and a payoff at the end. Written against
 * everything already in the library (the passages, the Daily Lessons, the Stories), so it
 * repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const A1_PASSAGES_PART_6: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 15
  {
    slug: "did-you-eat",
    order: 15,
    level: "A1",
    tone: "inspiring",
    icon: "smartphone",
    title: "Did You Eat?",
    titleAr: "هل أكلتَ؟",
    summary: "Every evening at six, Luke's mom calls. She always asks the same question.",
    summaryAr: "كل مساء في السادسة تتصل أمّ لوك. وتسأل دائماً السؤال نفسه.",
    cast: { Luke: "russ", Mom: "autumn" },
    sections: [
      {
        title: "Six O'Clock",
        titleAr: "السادسة تماماً",
        lines: [
          {
            en: "Luke lives in a small apartment in a big city.",
            ar: "يسكن لوك في شقة صغيرة في مدينة كبيرة.",
          },
          {
            en: "His mom lives in a small town, far away.",
            ar: "وتسكن أمه في بلدة صغيرة، بعيدة جداً.",
          },
          {
            en: "Every evening at six o'clock, his phone rings.",
            ar: "كل مساء في تمام السادسة، يرنّ هاتفه.",
          },
          {
            who: "Mom",
            en: "Hello, my dear! Did you eat?",
            ar: "مرحباً يا عزيزي! هل أكلتَ؟",
          },
          {
            who: "Luke",
            en: "Yes, Mom. I ate.",
            ar: "نعم يا أمي. أكلتُ.",
          },
          {
            en: "Sometimes this is true. Sometimes Luke only ate a cookie.",
            ar: "أحياناً يكون هذا صحيحاً. وأحياناً لا يكون لوك قد أكل إلا قطعة بسكويت.",
          },
          {
            who: "Mom",
            en: "Good. Eat some vegetables, too. Bye!",
            ar: "جيد. كُل بعض الخضروات أيضاً. إلى اللقاء!",
          },
        ],
        question: {
          en: "What does Mom ask every evening?",
          ar: "ماذا تسأل أمه كل مساء؟",
          options: [
            { en: "Are you tired?", ar: "هل أنت متعب؟" },
            { en: "Where are you?", ar: "أين أنت؟" },
            { en: "Did you eat?", ar: "هل أكلتَ؟" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "A Bad Day",
        titleAr: "يوم سيئ",
        lines: [
          {
            en: "One day, everything goes wrong for Luke.",
            ar: "في أحد الأيام، يسير كل شيء على نحو خاطئ مع لوك.",
          },
          {
            en: "His boss is angry. His computer stops. The bus is late.",
            ar: "مديره غاضب. وحاسوبه يتوقف. والحافلة متأخرة.",
          },
          {
            en: "At six o'clock, Luke is home. He is cold and tired.",
            ar: "في السادسة يكون لوك في البيت. وهو يشعر بالبرد والتعب.",
          },
          {
            en: "His phone rings. It is Mom, but Luke does not answer.",
            ar: "يرنّ هاتفه. إنها أمه، لكن لوك لا يردّ.",
          },
          {
            en: "It rings again. And again. At last, Luke answers.",
            ar: "يرنّ مرة أخرى. ومرة أخرى. وأخيراً يردّ لوك.",
          },
          {
            who: "Luke",
            en: "Mom, please! I am tired. Stop asking me about food!",
            ar: "أمي، من فضلك! أنا متعب. كفّي عن سؤالي عن الطعام!",
          },
          {
            who: "Mom",
            en: "Oh. Okay, my dear. I am sorry. Bye.",
            ar: "آه. حسناً يا عزيزي. أنا آسفة. إلى اللقاء.",
          },
        ],
        question: {
          en: "How is Luke's day?",
          ar: "كيف هو يوم لوك؟",
          options: [
            { en: "Very bad", ar: "سيئ جداً" },
            { en: "Very good", ar: "جيد جداً" },
            { en: "Very short", ar: "قصير جداً" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "One Egg",
        titleAr: "بيضة واحدة",
        lines: [
          {
            en: "Luke sits on the sofa. The apartment is very quiet.",
            ar: "يجلس لوك على الأريكة. والشقة هادئة جداً.",
          },
          {
            en: "He thinks about Mom's small, sad voice. Then he calls her back.",
            ar: "يفكر في صوت أمه الصغير الحزين. ثم يتصل بها من جديد.",
          },
          {
            who: "Luke",
            en: "Mom, I am sorry. I am not angry with you. I am only tired.",
            ar: "أمي، أنا آسف. لست غاضباً منكِ. أنا متعب فقط.",
          },
          {
            who: "Mom",
            en: "I know, my dear. Go to the kitchen. What do you have?",
            ar: "أعرف يا عزيزي. اذهب إلى المطبخ. ماذا لديك؟",
          },
          {
            who: "Luke",
            en: "I have one egg. Only one.",
            ar: "لديّ بيضة واحدة. واحدة فقط.",
          },
          {
            who: "Mom",
            en: "Good! Make it with a little salt. I will stay on the phone.",
            ar: "جيد! اصنعها مع قليل من الملح. وسأبقى على الهاتف.",
          },
          {
            en: "Luke cooks the egg. Mom talks about her garden the whole time.",
            ar: "يطبخ لوك البيضة. وتتحدث أمه عن حديقتها طوال الوقت.",
          },
        ],
        question: {
          en: "What does Mom do while Luke cooks?",
          ar: "ماذا تفعل أمه بينما يطبخ لوك؟",
          options: [
            { en: "She goes to bed", ar: "تذهب إلى النوم" },
            { en: "She stays on the phone", ar: "تبقى على الهاتف" },
            { en: "She cooks, too", ar: "تطبخ هي أيضاً" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Your Turn",
        titleAr: "جاء دورُكِ",
        lines: [
          {
            who: "Luke",
            en: "Mom, did you eat dinner?",
            ar: "أمي، هل أكلتِ العشاء؟",
          },
          {
            who: "Mom",
            en: "Not yet, my dear. I never eat before our call.",
            ar: "ليس بعد يا عزيزي. أنا لا آكل أبداً قبل مكالمتنا.",
          },
          {
            who: "Luke",
            en: "Never? Why?",
            ar: "أبداً؟ لماذا؟",
          },
          {
            who: "Mom",
            en: "First I hear your voice. Then I know you are okay. Then I am hungry.",
            ar: "أولاً أسمع صوتك. ثم أعرف أنك بخير. ثم أشعر بالجوع.",
          },
          {
            en: "Luke cannot speak. His eyes are wet.",
            ar: "لا يستطيع لوك الكلام. وعيناه دامعتان.",
          },
          {
            en: "The next day, at five o'clock, Luke calls his mom first.",
            ar: "في اليوم التالي، في الخامسة، يتصل لوك بأمه أولاً.",
          },
          {
            who: "Luke",
            en: "Hello, Mom! Did you eat?",
            ar: "مرحباً يا أمي! هل أكلتِ؟",
          },
        ],
        question: {
          en: "When does Mom eat dinner?",
          ar: "متى تتناول أمه العشاء؟",
          options: [
            { en: "Before Luke calls", ar: "قبل أن يتصل لوك" },
            { en: "At noon", ar: "عند الظهر" },
            { en: "After she hears Luke's voice", ar: "بعد أن تسمع صوت لوك" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: 'What does Mom really mean when she asks, "Did you eat?"',
      ar: "ماذا تقصد أمه حقاً حين تسأل: «هل أكلتَ؟»",
      options: [
        { en: "She loves Luke and worries about him", ar: "إنها تحب لوك وتقلق عليه" },
        { en: "She wants a new recipe", ar: "إنها تريد وصفة جديدة" },
        { en: "She is hungry", ar: "إنها جائعة" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "cookie",
        sentence: "Sometimes Luke only ate a ___.",
        hintAr: "بسكويت.",
      },
      {
        word: "vegetables",
        sentence: "Eat some ___, too.",
        hintAr: "خضروات.",
      },
      {
        word: "quiet",
        sentence: "The apartment is very ___.",
        hintAr: "هادئ.",
      },
      {
        word: "voice",
        sentence: "First I hear your ___.",
        hintAr: "صوت.",
      },
      {
        word: "wet",
        sentence: "His eyes are ___.",
        hintAr: "مبتلّ.",
      },
    ],
  },
];
