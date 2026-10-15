import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A2, a later addition: one more scene at the step of the first two sets —
 * the past tense carries the story, the dialogue is quick, there is a joke that
 * turns and a payoff at the end. Written against everything already in the
 * library (the passages, the Daily Lessons, the Stories), so it repeats none of
 * them (see scripts/check-passage-duplicates.ts).
 */

export const A2_PASSAGES_PART_3: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 11
  {
    slug: "the-escape-room",
    order: 11,
    level: "A2",
    tone: "funny",
    icon: "map",
    title: "The Escape Room",
    titleAr: "غرفة الهروب",
    summary: "Six coworkers, one locked room, and sixty minutes.",
    summaryAr: "ستة زملاء، وغرفة مقفلة، وستون دقيقة.",
    cast: { Greg: "russ", Nora: "zara", Brian: "calm-male", Kayla: "ash" },
    sections: [
      {
        title: "Team Day",
        titleAr: "يوم الفريق",
        lines: [
          {
            en: "Every year, the company had a team day. This year, the boss chose an escape room.",
            ar: "كانت الشركة تقيم كل عام يوماً للفريق. وهذا العام اختار المدير غرفة هروب.",
          },
          {
            en: "Six coworkers stood in a small, dark room: Greg, Nora, Brian and three others.",
            ar: "وقف ستة زملاء في غرفة صغيرة مظلمة: غريغ ونورا وبراين وثلاثة آخرون.",
          },
          {
            who: "Kayla",
            en: "Welcome, everybody. Somewhere in this room, there is a key. Find it and open the door. You have sixty minutes.",
            ar: "أهلاً بكم جميعاً. في مكان ما من هذه الغرفة مفتاح. اعثروا عليه وافتحوا الباب. أمامكم ستون دقيقة.",
          },
          {
            en: "A big red timer on the wall began to count down. The door closed with a loud click.",
            ar: "بدأ مؤقت أحمر كبير على الجدار بالعد التنازلي. وأُغلق الباب بنقرة عالية.",
          },
          {
            who: "Greg",
            en: "Don't worry, everybody. I watch a lot of detective shows. I'm the leader now.",
            ar: "لا تقلقوا يا جماعة. أنا أشاهد كثيراً من مسلسلات التحري. أنا القائد الآن.",
          },
          {
            en: "Nobody said yes. Nobody said no. Greg took that as a yes.",
            ar: "لم يقل أحد نعم. ولم يقل أحد لا. فاعتبر غريغ ذلك نعم.",
          },
        ],
        question: {
          en: "Who decided to be the leader?",
          ar: "من قرر أن يكون القائد؟",
          options: [
            { en: "The boss", ar: "المدير" },
            { en: "Nora", ar: "نورا" },
            { en: "Greg", ar: "غريغ" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "Greg Has a Plan",
        titleAr: "خطة غريغ",
        lines: [
          {
            who: "Greg",
            en: "You, look under the table. You, check the books. Nora, don't touch anything!",
            ar: "أنت، ابحث تحت الطاولة. وأنت، افحص الكتب. ونورا، لا تلمسي شيئاً!",
          },
          {
            en: "In the third book, somebody found a piece of paper with three numbers: three, one, five.",
            ar: "وفي الكتاب الثالث، وجد أحدهم ورقة عليها ثلاثة أرقام: ثلاثة، واحد، خمسة.",
          },
          {
            who: "Greg",
            en: "A phone number! Somebody call it.",
            ar: "رقم هاتف! ليتصل به أحدكم.",
          },
          {
            who: "Nora",
            en: "Greg, a phone number has more than three numbers.",
            ar: "غريغ، رقم الهاتف فيه أكثر من ثلاثة أرقام.",
          },
          {
            who: "Greg",
            en: "Then it's the beginning of a phone number. Keep looking!",
            ar: "إذن هو بداية رقم هاتف. واصلوا البحث!",
          },
          {
            en: "In the corner, Brian raised his hand. He was a quiet man from accounting, and he never said much in meetings either.",
            ar: "وفي الزاوية رفع براين يده. كان رجلاً هادئاً من قسم المحاسبة، ولا يتكلم كثيراً في الاجتماعات أيضاً.",
          },
          {
            who: "Brian",
            en: "Excuse me, I think I...",
            ar: "المعذرة، أظن أنني...",
          },
          {
            who: "Greg",
            en: "Not now, Brian! I'm thinking.",
            ar: "ليس الآن يا براين! أنا أفكر.",
          },
        ],
        question: {
          en: "What was on the piece of paper?",
          ar: "ماذا كان على الورقة؟",
          options: [
            { en: "A phone number", ar: "رقم هاتف" },
            { en: "Three numbers", ar: "ثلاثة أرقام" },
            { en: "A map", ar: "خريطة" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
      {
        title: "Twenty Minutes Left",
        titleAr: "بقي عشرون دقيقة",
        lines: [
          {
            en: "Forty minutes passed. They had looked under every chair and in every book for a clue, but the door was still closed.",
            ar: "مرّت أربعون دقيقة. كانوا قد بحثوا تحت كل كرسي وفي كل كتاب عن دليل، لكن الباب ظل مغلقاً.",
          },
          {
            en: "The timer said twenty minutes. Greg was no longer the leader; he was just a loud man in a dark room.",
            ar: "كان المؤقت يشير إلى عشرين دقيقة. ولم يعد غريغ القائد؛ بل صار رجلاً صاخباً في غرفة مظلمة.",
          },
          {
            who: "Greg",
            en: "This game is broken! Nobody can solve this!",
            ar: "هذه اللعبة معطّلة! لا أحد يستطيع حلّ هذا!",
          },
          {
            en: "Brian raised his hand again. This time, Nora saw him.",
            ar: "رفع براين يده مرة أخرى. وهذه المرة رأته نورا.",
          },
          {
            who: "Nora",
            en: "Brian, you've been trying to say something for forty minutes. What is it?",
            ar: "براين، لقد كنت تحاول قول شيء منذ أربعين دقيقة. ما هو؟",
          },
          {
            who: "Brian",
            en: "The clock on the wall. It stopped at three-fifteen. And the paper says three, one, five.",
            ar: "الساعة على الجدار. توقفت عند الثالثة والربع. والورقة تقول: ثلاثة، واحد، خمسة.",
          },
          {
            en: "For a few seconds, the whole room was silent.",
            ar: "ساد الصمت في الغرفة كلها لبضع ثوانٍ.",
          },
        ],
        question: {
          en: "What did Brian notice?",
          ar: "ماذا لاحظ براين؟",
          options: [
            {
              en: "The wall clock matched the numbers on the paper",
              ar: "الساعة على الجدار تطابق الأرقام التي على الورقة",
            },
            { en: "The timer was broken", ar: "المؤقت كان معطّلاً" },
            { en: "The door was open", ar: "الباب كان مفتوحاً" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "Listen to Brian",
        titleAr: "استمعوا إلى براين",
        lines: [
          {
            en: "Under the clock, there was a small safe. Nora turned the wheel: three, one, five. It opened.",
            ar: "تحت الساعة كانت هناك خزنة صغيرة. أدارت نورا القرص: ثلاثة، واحد، خمسة. فُتحت.",
          },
          {
            en: "Inside, there was a little key. Everybody ran to the door, and Nora opened it with forty seconds left.",
            ar: "وفي داخلها مفتاح صغير. ركض الجميع نحو الباب، وفتحته نورا وقد بقيت أربعون ثانية.",
          },
          {
            who: "Kayla",
            en: "Congratulations! Fifty-nine minutes and twenty seconds. Our camera shows that Brian had the answer at minute five.",
            ar: "تهانينا! تسع وخمسون دقيقة وعشرون ثانية. تُظهر كاميرتنا أن براين كان يعرف الجواب في الدقيقة الخامسة.",
          },
          {
            en: "Everybody looked at Greg. Greg looked at the floor.",
            ar: "نظر الجميع إلى غريغ. ونظر غريغ إلى الأرض.",
          },
          {
            who: "Greg",
            en: "In my defense, I was very busy leading.",
            ar: "دفاعاً عن نفسي، كنت مشغولاً جداً بالقيادة.",
          },
          {
            who: "Nora",
            en: "Brian, next time, you speak first. And we listen.",
            ar: "براين، في المرة القادمة تتكلم أنت أولاً. ونحن نستمع.",
          },
          {
            en: "On Monday, the boss asked who had solved the puzzle. Everybody said the same name, and it was not Greg.",
            ar: "وفي يوم الاثنين سأل المدير من الذي حلّ اللغز. أعطى الجميع الاسم نفسه، ولم يكن غريغ.",
          },
        ],
        question: {
          en: "What was inside the safe?",
          ar: "ماذا كان داخل الخزنة؟",
          options: [
            { en: "A phone number", ar: "رقم هاتف" },
            { en: "A big map", ar: "خريطة كبيرة" },
            { en: "A little key", ar: "مفتاح صغير" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "What was Greg's biggest mistake?",
      ar: "ما أكبر خطأ ارتكبه غريغ؟",
      options: [
        { en: "He did not listen to Brian", ar: "لم يستمع إلى براين" },
        { en: "He broke the timer", ar: "كسر المؤقت" },
        { en: "He opened the door too early", ar: "فتح الباب مبكراً جداً" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "escape",
        sentence: "This year, the boss chose an ___ room.",
        hintAr: "هروب.",
      },
      {
        word: "timer",
        sentence: "A big red ___ on the wall began to count down.",
        hintAr: "مؤقّت.",
      },
      {
        word: "detective",
        sentence: "I watch a lot of ___ shows.",
        hintAr: "محقّق.",
      },
      {
        word: "clue",
        sentence:
          "They had looked under every chair and in every book for a ___, but the door was still closed.",
        hintAr: "دليل.",
      },
      {
        word: "puzzle",
        sentence: "On Monday, the boss asked who had solved the ___.",
        hintAr: "لغز.",
      },
    ],
  },
];
