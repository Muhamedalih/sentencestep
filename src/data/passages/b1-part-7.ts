import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1, a scene about love at the step of the earlier sets — longer sentences, reported
 * speech, the past perfect where the story looks back, and nothing that reads like a lesson.
 * Written against everything already in the library (the passages, the Daily Lessons, the
 * Stories), so it repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const B1_PASSAGES_PART_7: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 12
  {
    slug: "say-that-again",
    order: 12,
    level: "B1",
    tone: "funny",
    icon: "heart",
    title: "Say That Again",
    titleAr: "قُلها مرة أخرى",
    summary: "George's hearing aids whistle. Ruth's stay in her handbag.",
    summaryAr: "تُصفّر سمّاعتا جورج، أما سمّاعتا روث فتبقيان في حقيبتها.",
    cast: { George: "calm-male", Ruth: "autumn" },
    sections: [
      {
        title: "The Wrong Chair",
        titleAr: "الكرسي الذي ليس كرسيه",
        lines: [
          {
            en: "For ten years, George had waited for his hearing test in the same chair at the clinic. This spring, a small woman in a blue cardigan was sitting in it.",
            ar: "طوال عشر سنوات كان جورج ينتظر فحص السمع على الكرسي نفسه في العيادة. وفي هذا الربيع كانت تجلس عليه امرأة صغيرة الحجم ترتدي سترة زرقاء.",
          },
          {
            en: "He took the chair next to hers instead. She leaned toward him, one hand behind her ear, frowning politely.",
            ar: "جلس بدلاً من ذلك على الكرسي المجاور لها. فمالت نحوه، ويدها خلف أذنها، وهي تعبس بلطف.",
          },
          {
            who: "George",
            en: "Good morning. I'm George.",
            ar: "صباح الخير. أنا جورج.",
          },
          {
            who: "Ruth",
            en: "Gorge? Like the canyon? What an unusual name!",
            ar: "«غورج»؟ مثل الوادي العميق؟ يا له من اسم غير مألوف!",
          },
          {
            who: "George",
            en: "George! And you are...?",
            ar: "جورج! وأنتِ...؟",
          },
          {
            who: "Ruth",
            en: "Ruth.",
            ar: "روث.",
          },
          {
            who: "George",
            en: "Truth? That's quite a name to live up to.",
            ar: "«تروث»؟ أي «الحقيقة»؟ هذا اسم يصعب أن يرقى المرء إلى مستواه!",
          },
        ],
        question: {
          en: "Why did George and Ruth keep misunderstanding each other?",
          ar: "لماذا ظل جورج وروث يسيئان فهم بعضهما؟",
          options: [
            { en: "They spoke different languages", ar: "كانا يتكلمان لغتين مختلفتين" },
            { en: "Neither of them could hear well", ar: "لم يكن أيٌّ منهما يسمع جيداً" },
            { en: "The waiting room was too noisy", ar: "كانت غرفة الانتظار صاخبة جداً" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "The Loudest Table",
        titleAr: "أصخب طاولة",
        lines: [
          {
            en: "After the tests, George did something he hadn't done in four years: he invited a woman to have coffee with him.",
            ar: "بعد الفحوص فعل جورج شيئاً لم يفعله منذ أربع سنوات: دعا امرأة إلى فنجان قهوة معه.",
          },
          {
            en: "The café across the street was crowded, and its espresso machine screamed every thirty seconds.",
            ar: "كان المقهى المقابل في الشارع مزدحماً، وكانت آلة الإسبريسو فيه تصرخ كل ثلاثين ثانية.",
          },
          {
            who: "George",
            en: "I'm seventy-four, by the way. I thought you should know.",
            ar: "أنا في الرابعة والسبعين، بالمناسبة. ظننت أن عليكِ أن تعرفي.",
          },
          {
            who: "Ruth",
            en: "Seventeen? You must be very mature for your age!",
            ar: "«سبعة عشر»؟ لا بد أنك ناضج جداً بالنسبة إلى سنّك!",
          },
          {
            who: "George",
            en: "Seventy-four!",
            ar: "أربعة وسبعون!",
          },
          {
            en: "Every head in the café turned. They were the loudest table in the room, and they weren't even arguing.",
            ar: "التفتت كل الرؤوس في المقهى. كانا أصخب طاولة في المكان، ولم يكونا يتجادلان حتى.",
          },
          {
            who: "Ruth",
            en: "This is hopeless. Shall we find somewhere quieter?",
            ar: "هذا ميؤوس منه. هل نجد مكاناً أهدأ؟",
          },
        ],
        question: {
          en: "Why did every head in the café turn?",
          ar: "لماذا التفتت كل الرؤوس في المقهى؟",
          options: [
            { en: "Ruth dropped her cup", ar: "أسقطت روث فنجانها" },
            { en: "The espresso machine broke", ar: "تعطلت آلة الإسبريسو" },
            { en: "George shouted his age", ar: "صاح جورج بعمره" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Handbag",
        titleAr: "حقيبة اليد",
        lines: [
          {
            en: "They found a bench under a tree in the park, where the only sounds were birds and the wind.",
            ar: "وجدا مقعداً تحت شجرة في الحديقة، حيث لا أصوات سوى زقزقة الطيور وهبوب الريح.",
          },
          {
            en: "George pressed a button behind his ear. His hearing aids whistled for a moment, as they always did, and then settled down.",
            ar: "ضغط جورج زراً خلف أذنه. فصفّرت سمّاعتاه لحظة كما تفعلان دائماً، ثم هدأتا.",
          },
          {
            en: "Ruth looked at him, and then at the handbag on her knees.",
            ar: "نظرت روث إليه، ثم إلى حقيبة اليد التي على ركبتيها.",
          },
          {
            who: "Ruth",
            en: "I have a pair of those, too. They're in here. I've carried them everywhere for three years, and I've never worn them.",
            ar: "عندي زوج مثلهما. إنهما هنا. حملتهما معي إلى كل مكان ثلاث سنوات، ولم أرتدهما قط.",
          },
          {
            who: "George",
            en: "May I ask why?",
            ar: "هل لي أن أسأل لماذا؟",
          },
          {
            who: "Ruth",
            en: "My husband died, and the house became quiet, and I found I didn't mind. The world was loud, and nobody in it was someone I wanted to hear.",
            ar: "مات زوجي، وصار البيت هادئاً، ووجدت أنني لا أمانع. كان العالم صاخباً، ولم يكن فيه أحد أرغب في سماعه.",
          },
          {
            en: "George didn't tell her she should wear them. He didn't say anything wise at all. He nodded, and the silence that followed was a kind one.",
            ar: "لم يقل لها جورج إن عليها أن ترتديهما. ولم يقل شيئاً حكيماً على الإطلاق. أومأ برأسه، وكان الصمت الذي تلا ذلك صمتاً لطيفاً.",
          },
        ],
        question: {
          en: "Why had Ruth stopped wearing her hearing aids?",
          ar: "لماذا توقفت روث عن ارتداء سمّاعتيها؟",
          options: [
            {
              en: "After her husband died, she no longer wanted to hear the world",
              ar: "بعد وفاة زوجها لم تعد ترغب في سماع العالم",
            },
            { en: "They were broken", ar: "كانتا معطلتين" },
            { en: "They were too expensive", ar: "كانتا باهظتي الثمن" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "A Nice Voice",
        titleAr: "صوت جميل",
        lines: [
          {
            who: "George",
            en: "I won't tell you what to do. But I've been told I have a rather nice voice, and it's wasted on someone who can't hear it.",
            ar: "لن أقول لكِ ماذا تفعلين. لكن قيل لي إن صوتي جميل إلى حدّ ما، وإنه يضيع على من لا يستطيع سماعه.",
          },
          {
            en: "Ruth laughed, a real laugh, the first in a long time. Then she opened the handbag.",
            ar: "ضحكت روث، ضحكة حقيقية، هي الأولى منذ زمن طويل. ثم فتحت حقيبة اليد.",
          },
          {
            en: "The hearing aids were small and a little dusty. She cleaned them on her sleeve and put them in, one at a time.",
            ar: "كانت السمّاعتان صغيرتين وعليهما بعض الغبار. نظّفتهما بكمّها ووضعتهما في أذنيها، واحدة تلو الأخرى.",
          },
          {
            en: "For a moment, the world rushed in: the leaves, a distant lawn mower, a child shouting on a bicycle. It was too much, and it was wonderful.",
            ar: "للحظة اندفع العالم إليها: حفيف الأوراق، وجزّازة عشب بعيدة، وطفل يصيح على دراجته. كان ذلك أكثر مما تحتمل، وكان رائعاً.",
          },
          {
            en: "And beneath it all was a voice, lower and warmer than she had imagined.",
            ar: "وتحت كل ذلك كان ثمة صوت، أخفض وأدفأ مما تخيّلت.",
          },
          {
            who: "George",
            en: "Can you hear me now?",
            ar: "هل تسمعينني الآن؟",
          },
          {
            who: "Ruth",
            en: "Yes. Oh, yes. You were right about the voice.",
            ar: "نعم. آه، نعم. كنتَ محقاً بشأن الصوت.",
          },
        ],
        question: {
          en: "How did Ruth feel when the sounds came back?",
          ar: "بماذا شعرت روث عندما عادت الأصوات؟",
          options: [
            { en: "Angry and tired", ar: "غاضبة ومتعبة" },
            { en: "Overwhelmed, but glad", ar: "مغمورة بها، لكن سعيدة" },
            { en: "Bored and calm", ar: "ضجرة وهادئة" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "Again",
        titleAr: "مرة أخرى",
        lines: [
          {
            en: "George took a deep breath, the way people do before jumping into cold water. It took all of his courage.",
            ar: "أخذ جورج نفساً عميقاً، كما يفعل الناس قبل القفز في ماء بارد. واحتاج الأمر إلى كل شجاعته.",
          },
          {
            who: "George",
            en: "I'd like to see you again. Next Tuesday, perhaps. Somewhere quiet.",
            ar: "أودّ أن أراكِ مرة أخرى. ربما يوم الثلاثاء القادم. في مكان هادئ.",
          },
          {
            en: "Every syllable reached Ruth's ear clearly, as if someone had placed it there with great care.",
            ar: "وصل كل مقطع إلى أذن روث بوضوح، كأن أحداً وضعه هناك بعناية فائقة.",
          },
          {
            who: "Ruth",
            en: "Say that again.",
            ar: "قُلها مرة أخرى.",
          },
          {
            who: "George",
            en: "I'd like to see you again. Next Tuesday. Somewhere quiet.",
            ar: "أودّ أن أراكِ مرة أخرى. يوم الثلاثاء القادم. في مكان هادئ.",
          },
          {
            who: "Ruth",
            en: "Once more.",
            ar: "مرة ثانية.",
          },
          {
            en: "He said it a third time, smiling now, because he was finally beginning to understand.",
            ar: "قالها للمرة الثالثة وهو يبتسم الآن، لأنه بدأ أخيراً يفهم.",
          },
          {
            who: "Ruth",
            en: "I heard you perfectly the first time, you know. I just wanted to hear it again.",
            ar: "سمعتك بوضوح تام في المرة الأولى، لتعلم. أردتُ فقط أن أسمعها مرة أخرى.",
          },
        ],
        question: {
          en: "Why did Ruth ask George to say it again?",
          ar: "لماذا طلبت روث من جورج أن يعيد ما قاله؟",
          options: [
            { en: "She hadn't heard him", ar: "لم تكن قد سمعته" },
            { en: "She hadn't understood the words", ar: "لم تكن قد فهمت الكلمات" },
            {
              en: "She had heard him perfectly but wanted to hear it again",
              ar: "كانت قد سمعته تماماً لكنها أرادت أن تسمعها مرة أخرى",
            },
          ],
          answer: 2,
          evidence: 7,
        },
      },
    ],
    closing: {
      en: "How did Ruth change during the story?",
      ar: "كيف تغيّرت روث خلال القصة؟",
      options: [
        {
          en: "She went from shutting out sound to wanting to hear one voice",
          ar: "انتقلت من إقصاء الأصوات إلى الرغبة في سماع صوت واحد",
        },
        { en: "She became angry with George", ar: "غضبت من جورج" },
        { en: "She lost her hearing aids", ar: "أضاعت سمّاعتيها" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "clinic",
        sentence: "in the same chair at the ___",
        hintAr: "عيادة.",
      },
      {
        word: "cardigan",
        sentence: "a small woman in a blue ___ was sitting in it",
        hintAr: "سترة صوفية.",
      },
      {
        word: "canyon",
        sentence: "Like the ___?",
        hintAr: "وادٍ عميق.",
      },
      {
        word: "handbag",
        sentence: "the ___ on her knees",
        hintAr: "حقيبة يد.",
      },
      {
        word: "courage",
        sentence: "It took all of his ___.",
        hintAr: "شجاعة.",
      },
      {
        word: "syllable",
        sentence: "Every ___ reached Ruth's ear clearly",
        hintAr: "مقطع صوتي.",
      },
    ],
  },
];
