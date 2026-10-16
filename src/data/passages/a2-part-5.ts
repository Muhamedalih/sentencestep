import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A2, one more scene at the step of the earlier sets — the past tense carries the
 * story, the dialogue is quick, and there is a turn and a payoff at the end. Written
 * against everything already in the library (the passages, the Daily Lessons, the
 * Stories), so it repeats none of them (see scripts/check-passage-duplicates.ts).
 */

export const A2_PASSAGES_PART_5: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 14
  {
    slug: "the-sofa-on-the-stairs",
    order: 14,
    level: "A2",
    tone: "funny",
    icon: "house",
    title: "The Sofa on the Stairs",
    titleAr: "الأريكة على الدَّرَج",
    summary: "Mike bought a sofa. He did not measure the stairs.",
    summaryAr: "اشترى مايك أريكة. لكنه لم يقِس الدَّرَج.",
    cast: { Mike: "russ", Kate: "zara", "Mr. Grant": "calm-male" },
    sections: [
      {
        title: "A Big Green Sofa",
        titleAr: "أريكة خضراء كبيرة",
        lines: [
          {
            en: "Mike bought a new sofa. It was big, soft and dark green.",
            ar: "اشترى مايك أريكة جديدة. كانت كبيرة وناعمة وخضراء داكنة.",
          },
          {
            en: "He moved into a new apartment on the fourth floor, and his sister Kate came to help.",
            ar: "انتقل إلى شقة جديدة في الطابق الرابع، وجاءت أخته كيت لتساعده.",
          },
          {
            en: "The truck driver put the sofa on the sidewalk and drove away.",
            ar: "وضع سائق الشاحنة الأريكة على الرصيف ومضى.",
          },
          {
            who: "Kate",
            en: "Mike, are you sure it fits?",
            ar: "مايك، هل أنت متأكد أنها تناسب؟",
          },
          {
            who: "Mike",
            en: "Of course. I checked the size online.",
            ar: "بالتأكيد. تحققت من القياس على الإنترنت.",
          },
          {
            en: "He checked the sofa. But he did not check the stairs.",
            ar: "تحقق من الأريكة. لكنه لم يتحقق من الدَّرَج.",
          },
        ],
        question: {
          en: "What did Mike forget to check?",
          ar: "ماذا نسي مايك أن يتحقق منه؟",
          options: [
            { en: "The stairs", ar: "الدَّرَج" },
            { en: "The color of the sofa", ar: "لون الأريكة" },
            { en: "The price", ar: "السعر" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "The Narrow Stairs",
        titleAr: "الدَّرَج الضيق",
        lines: [
          {
            en: "The stairs were narrow, and after every floor there was a sharp turn.",
            ar: "كان الدَّرَج ضيقاً، وبعد كل طابق منعطف حادّ.",
          },
          {
            en: "Mike went first and Kate pushed from below. They went up one floor, then another.",
            ar: "سار مايك أولاً ودفعت كيت من الأسفل. صعدا طابقاً، ثم آخر.",
          },
          {
            en: "On the second floor, the sofa hit the wall and stopped.",
            ar: "وعند الطابق الثاني ارتطمت الأريكة بالجدار وتوقفت.",
          },
          {
            who: "Kate",
            en: "Turn it! Turn it to the left!",
            ar: "أدرها! أدرها إلى اليسار!",
          },
          {
            who: "Mike",
            en: "It does not turn! This is not possible!",
            ar: "إنها لا تدور! هذا مستحيل!",
          },
          {
            en: "They pushed. They pulled. They tried it on its side and upside down. The sofa was stuck like a cork in a bottle.",
            ar: "دفعا. وسحبا. جرّباها على جنبها ورأساً على عقب. كانت الأريكة عالقة كسدادة في زجاجة.",
          },
          {
            en: "After twenty minutes, they were both tired, hot and quiet.",
            ar: "بعد عشرين دقيقة كان كلاهما متعباً وحارّاً وصامتاً.",
          },
        ],
        question: {
          en: "Where did the sofa get stuck?",
          ar: "أين علقت الأريكة؟",
          options: [
            { en: "On the first floor", ar: "في الطابق الأول" },
            { en: "In the apartment door", ar: "في باب الشقة" },
            { en: "At the turn of the second floor", ar: "عند منعطف الطابق الثاني" },
          ],
          answer: 2,
          evidence: 2,
        },
      },
      {
        title: "The Window Idea",
        titleAr: "فكرة النافذة",
        lines: [
          {
            who: "Kate",
            en: "Your living room has a big window. We can use a rope.",
            ar: "غرفة معيشتك فيها نافذة كبيرة. نستطيع استخدام حبل.",
          },
          {
            en: "They carried the sofa back down. Mike found a long rope in his car and ran up to the fourth floor.",
            ar: "حملا الأريكة نزولاً. وجد مايك حبلاً طويلاً في سيارته وركض إلى الطابق الرابع.",
          },
          {
            en: "Kate stayed in the street and tied the rope around the sofa.",
            ar: "بقيت كيت في الشارع وربطت الحبل حول الأريكة.",
          },
          {
            en: "Slowly, the sofa rose past the first floor, then the second. People stopped to watch, and a little boy clapped.",
            ar: "ببطء ارتفعت الأريكة بمحاذاة الطابق الأول، ثم الثاني. توقف الناس ليشاهدوا، وصفّق طفل صغير.",
          },
          {
            en: "At the third floor, the wind turned the sofa, and it hit a window. A woman looked out.",
            ar: "عند الطابق الثالث أدارت الريح الأريكة فاصطدمت بنافذة. وأطلّت امرأة.",
          },
          {
            who: "Mike",
            en: "Sorry! It's only a sofa!",
            ar: "آسف! إنها مجرد أريكة!",
          },
          {
            en: "Down in the street, Kate closed her eyes.",
            ar: "وفي الشارع أغمضت كيت عينيها.",
          },
        ],
        question: {
          en: "How did they try to move the sofa the second time?",
          ar: "كيف حاولا نقل الأريكة في المرة الثانية؟",
          options: [
            { en: "With a rope through the window", ar: "بحبل عبر النافذة" },
            { en: "With a bigger truck", ar: "بشاحنة أكبر" },
            { en: "With four strong neighbors", ar: "بمساعدة أربعة جيران أقوياء" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "The Gray Door",
        titleAr: "الباب الرمادي",
        lines: [
          {
            en: "At the fourth floor, the window was too small. The sofa did not fit there either.",
            ar: "وعند الطابق الرابع كانت النافذة أصغر من اللازم. ولم تدخل الأريكة منها أيضاً.",
          },
          {
            en: "Mike came down, and they sat on the sofa on the sidewalk and laughed until they cried.",
            ar: "نزل مايك، وجلسا على الأريكة على الرصيف وضحكا حتى دمعت عيناهما.",
          },
          {
            en: "Mr. Grant, the building manager, came out with a coffee. He looked at the rope, the sofa and the two tired people.",
            ar: "خرج السيد غرانت، مدير المبنى، ومعه قهوة. نظر إلى الحبل وإلى الأريكة وإلى الشخصين المتعبين.",
          },
          {
            who: "Mr. Grant",
            en: "Why didn't you use the freight elevator?",
            ar: "لماذا لم تستخدما مصعد البضائع؟",
          },
          {
            who: "Mike",
            en: "The what?",
            ar: "ماذا؟",
          },
          {
            en: "Behind a gray door at the back of the building, there was a big, clean elevator. Mike had walked past it three times.",
            ar: "خلف باب رمادي في مؤخرة المبنى كان هناك مصعد كبير ونظيف. وكان مايك قد مرّ بجانبه ثلاث مرات.",
          },
          {
            en: "Two minutes later, the sofa was in the apartment. It looked wonderful.",
            ar: "بعد دقيقتين كانت الأريكة في الشقة. وبدت رائعة.",
          },
          {
            who: "Kate",
            en: "It looks great, Mike. Now, please, never move again.",
            ar: "تبدو رائعة يا مايك. والآن، من فضلك، لا تنتقل مرة أخرى أبداً.",
          },
        ],
        question: {
          en: "Where was the freight elevator?",
          ar: "أين كان مصعد البضائع؟",
          options: [
            { en: "Next to the front door", ar: "بجانب الباب الأمامي" },
            { en: "Behind a gray door at the back", ar: "خلف باب رمادي في الخلف" },
            { en: "On the roof", ar: "على السطح" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "Why did Mike and Kate have so much trouble?",
      ar: "لماذا واجه مايك وكيت كل هذه المتاعب؟",
      options: [
        { en: "The sofa was too heavy for two people", ar: "كانت الأريكة أثقل من أن يحملها اثنان" },
        { en: "The stairs were closed", ar: "كان الدَّرَج مغلقاً" },
        {
          en: "They did not know about the building's freight elevator",
          ar: "لم يعرفا بوجود مصعد البضائع في المبنى",
        },
      ],
      answer: 2,
    },
    words: [
      {
        word: "narrow",
        sentence: "The stairs were ___, and after every floor there was a sharp turn.",
        hintAr: "ضيّق.",
      },
      {
        word: "sidewalk",
        sentence: "The truck driver put the sofa on the ___ and drove away.",
        hintAr: "رصيف.",
      },
      {
        word: "cork",
        sentence: "The sofa was stuck like a ___ in a bottle.",
        hintAr: "سدادة فلين.",
      },
      {
        word: "rope",
        sentence: "Mike found a long ___ in his car",
        hintAr: "حبل.",
      },
      {
        word: "freight",
        sentence: "Why didn't you use the ___ elevator?",
        hintAr: "شحن.",
      },
      {
        word: "elevator",
        sentence: "there was a big, clean ___.",
        hintAr: "مصعد.",
      },
    ],
  },
];
