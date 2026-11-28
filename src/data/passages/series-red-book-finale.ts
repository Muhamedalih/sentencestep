import { q, tf, type PassageExamSeed } from "@/data/passages/exams/helpers";
import type {
  PassageLineSeed,
  PassageQuestionSeed,
  PassageSectionSeed,
  PassageSeed,
  PassageVoiceAlias,
} from "@/data/passages/types";

/**
 * "The Red Book", episodes 4-7: the old fight, the rose in the closed box, the twenty letters, the
 * quiet reader, and the clock that starts again. Same A1 voice as episodes 1-3.
 */

/** A line: [speaker or null for the narrator, English, Arabic]. */
type Row = [who: string | null, en: string, ar: string];

function part(
  title: string,
  titleAr: string,
  rows: Row[],
  question: PassageQuestionSeed,
): PassageSectionSeed {
  const lines: PassageLineSeed[] = rows.map(([who, en, ar]) =>
    who ? { who, en, ar } : { en, ar },
  );
  return { title, titleAr, lines, question };
}

function ask(
  en: string,
  ar: string,
  answer: number,
  evidence: number,
  ...options: [en: string, ar: string][]
): PassageQuestionSeed {
  return { ...q(en, ar, answer, ...options), evidence };
}

const FAMILY: Record<string, PassageVoiceAlias> = {
  Sara: "ash",
  "Mr. Cole": "calm-male",
  Mike: "russ",
  Mom: "autumn",
};

const WITH_READER: Record<string, PassageVoiceAlias> = { ...FAMILY, "Mr. Reed": "david" };

export const RED_BOOK_FINALE: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 19 · episode 4
  {
    slug: "the-rose-under-the-floor",
    order: 19,
    level: "A1",
    tone: "serious",
    icon: "house",
    title: "The Rose Under the Floor",
    titleAr: "الوردة تحت الأرضية",
    summary: "Mom comes to the shop. She knows more about the small key than anyone.",
    summaryAr: "تصل الأم إلى المحل. وهي تعرف عن المفتاح الصغير أكثر من الجميع.",
    cast: FAMILY,
    sections: [
      part(
        "Mom Arrives",
        "أمي تصل",
        [
          [
            null,
            "Mom runs into the shop. Her coat is still open.",
            "تدخل الأم المحل مسرعة. ومعطفها ما زال مفتوحاً.",
          ],
          ["Mom", "Sara, we are going home. Now.", "سارة، سنعود إلى البيت. الآن."],
          ["Sara", "Not before you tell me about this shop.", "ليس قبل أن تخبريني عن هذا المحل."],
          [
            null,
            "Mom sees the red book. Then she sees the clock.",
            "ترى الأم الكتاب الأحمر. ثم ترى الساعة.",
          ],
          [
            "Mom",
            "It is ticking. Why is that clock ticking?",
            "إنها تتكتك. لماذا تتكتك تلك الساعة؟",
          ],
          ["Mike", "It is only a mouse. He is very sorry.", "إنه مجرد فأر. وهو آسف جداً."],
        ],
        ask(
          "What does Mom see after the red book?",
          "ماذا ترى الأم بعد الكتاب الأحمر؟",
          1,
          3,
          ["The mouse", "الفأر"],
          ["The clock", "الساعة"],
          ["The photo", "الصورة"],
        ),
      ),
      part(
        "She Grew Up Here",
        "هنا كبرت",
        [
          ["Mr. Cole", "Hello, Anna. It is a long time.", "أهلاً يا آنا. مرّ وقت طويل."],
          ["Mom", "Twenty years. You have no hair now.", "عشرون سنة. لم يبقَ لك شعر."],
          ["Mr. Cole", "And you still say what you think.", "وأنتِ ما زلتِ تقولين ما في رأسك."],
          [
            null,
            "Mom sits on the floor, in her old place.",
            "تجلس الأم على الأرض، في مكانها القديم.",
          ],
          [
            "Mom",
            "I grew up here. I slept under that long shelf.",
            "هنا كبرت. وكنت أنام تحت ذلك الرف الطويل.",
          ],
          [
            "Sara",
            "But you told me Grandma sold flowers.",
            "لكنكِ قلتِ لي إن جدتي كانت تبيع الورد.",
          ],
          ["Mom", "Flowers are easier than the true story.", "حكاية الورد أسهل من القصة الحقيقية."],
        ],
        ask(
          "Where did Mom grow up?",
          "أين كبرت الأم؟",
          2,
          4,
          ["In a flower shop", "في محل ورد"],
          ["In another city", "في مدينة أخرى"],
          ["In this bookshop", "في هذه المكتبة"],
        ),
      ),
      part(
        "Ten Past Four",
        "الرابعة وعشر دقائق",
        [
          [
            "Mom",
            "I had a big fight with my mother in this shop.",
            "تشاجرت مع أمي شجاراً كبيراً في هذا المحل.",
          ],
          [
            "Mom",
            "She was very sick. The good doctors were far away.",
            "كانت مريضة جداً. والأطباء الجيدون بعيدين.",
          ],
          [
            "Mom",
            'I said, "Sell the shop and go." She said no.',
            "قلت لها: «بيعي المحل واذهبي». فقالت لا.",
          ],
          [null, "Mom's voice becomes very small.", "يصير صوت الأم خافتاً جداً."],
          ["Mom", "I took you in my arms and walked out.", "حملتكِ بين ذراعيّ وخرجت."],
          [
            "Mom",
            "At the door I looked back. She stopped the clock.",
            "عند الباب التفتّ. فأوقفت هي الساعة.",
          ],
          [
            "Mom",
            'She said, "It will start when you come home."',
            "وقالت: «ستعمل من جديد حين تعودين إلى البيت».",
          ],
        ],
        ask(
          "What did Grandma Nora stop at the end of the fight?",
          "ماذا أوقفت الجدة نورا في نهاية الشجار؟",
          0,
          5,
          ["The clock", "الساعة"],
          ["A taxi", "سيارة أجرة"],
          ["The music", "الموسيقى"],
        ),
      ),
      part(
        "Under the Floor",
        "تحت الأرضية",
        [
          [
            "Mom",
            "That little key is mine. I know what it opens.",
            "ذلك المفتاح الصغير لي. وأعرف ماذا يفتح.",
          ],
          [
            null,
            "She pushes the old clock. Under it, one board is loose.",
            "تدفع الساعة القديمة. تحتها لوح خشبي مخلخل.",
          ],
          [null, "Under the board there is a small wooden box.", "وتحت اللوح صندوق خشبي صغير."],
          [null, "Mom turns the key. Her fingers shake.", "تدير الأم المفتاح. وأصابعها ترتجف."],
          [
            null,
            "Inside, on top, there is one white rose. It is fresh.",
            "في الداخل، فوق كل شيء، وردة بيضاء واحدة. وهي طازجة.",
          ],
          [
            "Mike",
            "A fresh rose? In a box that is closed for twenty years?",
            "وردة طازجة؟ في صندوق مغلق منذ عشرين سنة؟",
          ],
        ],
        ask(
          "What is on top inside the box?",
          "ماذا يوجد في أعلى الصندوق؟",
          1,
          4,
          ["Old money", "نقود قديمة"],
          ["A fresh white rose", "وردة بيضاء طازجة"],
          ["A red envelope", "ظرف أحمر"],
        ),
      ),
    ],
    closing: q(
      "Why did Mom say that Grandma sold flowers?",
      "لماذا قالت الأم إن الجدة كانت تبيع الورد؟",
      2,
      ["Nora loved only gardens", "لأن نورا لم تكن تحب إلا الحدائق"],
      ["Mr. Cole asked her to say it", "لأن السيد كول طلب منها ذلك"],
      ["The true story was too hard", "لأن القصة الحقيقية كانت صعبة"],
    ),
    words: [
      { word: "coat", sentence: "Her ___ is still open.", hintAr: "معطف." },
      { word: "floor", sentence: "Mom sits on the ___, in her old place.", hintAr: "أرضية." },
      { word: "sick", sentence: "She was very ___.", hintAr: "مريض." },
      { word: "loose", sentence: "Under it, one board is ___.", hintAr: "مخلخل غير مثبّت." },
      { word: "wooden", sentence: "Under the board there is a small ___ box.", hintAr: "خشبي." },
    ],
  },
  // ───────────────────────────────────────────────────────── 20 · episode 5
  {
    slug: "twenty-birthdays",
    order: 20,
    level: "A1",
    tone: "serious",
    icon: "mail",
    title: "Twenty Birthdays",
    titleAr: "عشرون عيد ميلاد",
    summary: "Under the rose, Nora left something for every year she could not see.",
    summaryAr: "تحت الوردة تركت نورا شيئاً لكل سنة لم تستطع أن تراها.",
    cast: WITH_READER,
    sections: [
      part(
        "Under the Rose",
        "تحت الوردة",
        [
          [
            null,
            "Under the rose there are many letters, tied with red string.",
            "تحت الوردة رسائل كثيرة، مربوطة بخيط أحمر.",
          ],
          [
            "Sara",
            "Every envelope has a number. Three, four, five.",
            "على كل ظرف رقم. ثلاثة، أربعة، خمسة.",
          ],
          [
            null,
            "Sara counts them all. There are twenty letters for her.",
            "تعدّها سارة كلها. هناك عشرون رسالة لها.",
          ],
          ["Mike", "One for every birthday your grandma missed.", "رسالة لكل عيد ميلاد فات جدتكِ."],
          [
            null,
            'At the bottom there is one more. It says "Anna".',
            "وفي القاع رسالة أخرى. مكتوب عليها «آنا».",
          ],
          ["Mom", "Not today. Maybe not ever.", "ليس اليوم. وربما ليس أبداً."],
        ],
        ask(
          "How many letters are for Sara?",
          "كم رسالة لسارة؟",
          0,
          2,
          ["Twenty", "عشرون"],
          ["Three", "ثلاث"],
          ["Two", "اثنتان"],
        ),
      ),
      part(
        "Happy Birthday",
        "عيد ميلاد سعيد",
        [
          [
            "Sara",
            '"Today you are seven. How many teeth did you lose?"',
            "«اليوم عمركِ سبع. كم سناً فقدتِ؟»",
          ],
          [
            "Mike",
            "Two. I was there. One was in my sandwich.",
            "سنّان. كنت حاضراً. وأحدهما كان في شطيرتي.",
          ],
          [
            "Sara",
            '"Today you are twelve. I hope you read at night."',
            "«اليوم عمركِ اثنتا عشرة. أتمنى أنكِ تقرئين في الليل».",
          ],
          [
            "Sara",
            '"Today you are fifteen. Maybe you are angry with Mom."',
            "«اليوم عمركِ خمس عشرة. ربما أنتِ غاضبة من أمكِ».",
          ],
          [
            "Sara",
            '"Be kind to her. She is braver than she looks."',
            "«كوني لطيفة معها. إنها أشجع مما تبدو».",
          ],
          [
            null,
            "Mom turns to the window and says nothing.",
            "تلتفت الأم إلى النافذة ولا تقول شيئاً.",
          ],
        ],
        ask(
          "What does the letter at fifteen ask Sara to do?",
          "ماذا تطلب رسالة الخامسة عشرة من سارة؟",
          2,
          4,
          ["To sell the shop", "أن تبيع المحل"],
          ["To read all night", "أن تقرأ طوال الليل"],
          ["To be kind to her mom", "أن تكون لطيفة مع أمها"],
        ),
      ),
      part(
        "Not by Chance",
        "ليست صدفة",
        [
          [
            "Sara",
            '"Today you are twenty-two. Today is your first day."',
            "«اليوم عمركِ اثنتان وعشرون. اليوم يومكِ الأول».",
          ],
          [
            "Sara",
            '"Maybe you think you found this job by chance."',
            "«ربما تظنين أنكِ وجدتِ هذا العمل صدفة».",
          ],
          [null, "Sara stops and looks at Mr. Cole.", "تتوقف سارة وتنظر إلى السيد كول."],
          [
            "Sara",
            "The job card in my mailbox. Was it you?",
            "بطاقة العمل في صندوق بريدي. أكنتَ أنت؟",
          ],
          ["Mr. Cole", "Yes. I made her a promise, and I waited.", "نعم. قطعت لها وعداً، وانتظرت."],
          [
            "Mike",
            "You waited twenty years and did not clean that shelf?",
            "انتظرتَ عشرين سنة ولم تنظّف ذلك الرف؟",
          ],
        ],
        ask(
          "Who put the job card in Sara's mailbox?",
          "من وضع بطاقة العمل في صندوق بريد سارة؟",
          1,
          4,
          ["Mike", "مايك"],
          ["Mr. Cole", "السيد كول"],
          ["Mom", "أمها"],
        ),
      ),
      part(
        "The Last Line",
        "السطر الأخير",
        [
          [
            "Sara",
            '"One day, a man will want to buy this shop."',
            "«يوماً ما سيرغب رجل في شراء هذا المحل».",
          ],
          [
            "Sara",
            '"Before you answer him, ask your mom to read her letter."',
            "«قبل أن تجيبيه، اطلبي من أمكِ أن تقرأ رسالتها».",
          ],
          [
            null,
            "Mom holds her letter close. Her eyes are wet.",
            "تضم الأم رسالتها إلى صدرها. وعيناها مبللتان.",
          ],
          [
            null,
            "At that moment, the bell over the door rings.",
            "في تلك اللحظة يرنّ الجرس فوق الباب.",
          ],
          [
            null,
            "It is the man who reads and buys nothing.",
            "إنه الرجل الذي يقرأ ولا يشتري شيئاً.",
          ],
          [
            "Mr. Reed",
            "Good evening. I want to buy this shop.",
            "مساء الخير. أريد أن أشتري هذا المحل.",
          ],
        ],
        ask(
          "What does the man at the door want?",
          "ماذا يريد الرجل الذي عند الباب؟",
          2,
          5,
          ["To read one more hour", "أن يقرأ ساعة أخرى"],
          ["To find his hat", "أن يجد قبعته"],
          ["To buy the shop", "أن يشتري المحل"],
        ),
      ),
    ],
    closing: q(
      "How does Sara learn that her job was not by chance?",
      "كيف تعرف سارة أن عملها لم يكن صدفة؟",
      0,
      ["From her grandmother's letter", "من رسالة جدتها"],
      ["From a call from the bank", "من اتصال من المصرف"],
      ["From a photo in Mike's bag", "من صورة في حقيبة مايك"],
    ),
    words: [
      { word: "string", sentence: "There are many letters, tied with red ___.", hintAr: "خيط." },
      { word: "number", sentence: "Every envelope has a ___.", hintAr: "رقم." },
      { word: "chance", sentence: "Maybe you think you found this job by ___.", hintAr: "صدفة." },
      { word: "mailbox", sentence: "The job card in my ___. Was it you?", hintAr: "صندوق البريد." },
      { word: "promise", sentence: "I made her a ___, and I waited.", hintAr: "وعد." },
    ],
  },
  // ───────────────────────────────────────────────────────── 21 · episode 6
  {
    slug: "the-man-in-the-grey-hat",
    order: 21,
    level: "A1",
    tone: "serious",
    icon: "house",
    title: "The Man in the Grey Hat",
    titleAr: "رجل القبعة الرمادية",
    summary: "The quiet reader has a name, a lot of money and something small in his pocket.",
    summaryAr: "للقارئ الصامت اسم، ومال كثير، وشيء صغير في جيبه.",
    cast: WITH_READER,
    sections: [
      part(
        "The Offer",
        "العرض",
        [
          [
            null,
            "He takes off his grey hat and sits in his usual chair.",
            "يخلع قبعته الرمادية ويجلس على كرسيّه المعتاد.",
          ],
          ["Mike", "The chair can talk!", "الكرسي يتكلم!"],
          [
            "Mr. Reed",
            "My name is Daniel Reed. I will pay a lot.",
            "اسمي دانيال ريد. وسأدفع كثيراً.",
          ],
          [
            "Sara",
            "Why now? You never bought one book.",
            "لماذا الآن؟ أنت لم تشترِ كتاباً واحداً.",
          ],
          [
            "Mr. Reed",
            "Because on Friday the bank will take this shop.",
            "لأن المصرف سيأخذ هذا المحل يوم الجمعة.",
          ],
          [null, "Everyone turns to Mr. Cole.", "يلتفت الجميع إلى السيد كول."],
        ],
        ask(
          "When will the bank take the shop?",
          "متى سيأخذ المصرف المحل؟",
          1,
          4,
          ["On Monday", "يوم الإثنين"],
          ["On Friday", "يوم الجمعة"],
          ["Next year", "السنة القادمة"],
        ),
      ),
      part(
        "Mr. Cole's Secret",
        "سر السيد كول",
        [
          [
            "Mr. Cole",
            "It is true. The shop does not make money.",
            "هذا صحيح. المحل لا يربح مالاً.",
          ],
          [
            "Mr. Cole",
            "Every month, someone left money under the door.",
            "كل شهر كان أحدهم يترك مالاً تحت الباب.",
          ],
          [
            "Mr. Cole",
            "This year, the bank wants much more than that.",
            "وهذه السنة يطلب المصرف أكثر من ذلك بكثير.",
          ],
          [null, "His face is red. He looks very old.", "وجهه محمرّ. ويبدو كبيراً جداً."],
          ["Mom", "Then sell it. Sell it and finish this.", "إذن بِعه. بِعه ولننتهِ من هذا."],
          ["Sara", "No! I only found her today.", "لا! أنا لم أجدها إلا اليوم."],
          ["Mike", "I have eight dollars. Is that enough?", "معي ثمانية دولارات. هل تكفي؟"],
        ],
        ask(
          "What does Mom want to do with the shop?",
          "ماذا تريد الأم أن تفعل بالمحل؟",
          0,
          4,
          ["Sell it", "أن تبيعه"],
          ["Paint it", "أن تصبغه"],
          ["Give it to Mike", "أن تعطيه لمايك"],
        ),
      ),
      part(
        "The Second Key",
        "المفتاح الثاني",
        [
          [
            null,
            "Mr. Reed takes off his coat, and something falls.",
            "يخلع السيد ريد معطفه، فيسقط شيء.",
          ],
          [null, "It is a small key on the floor.", "إنه مفتاح صغير على الأرض."],
          [
            "Mom",
            "It is the same as mine. Where did you get it?",
            "إنه مثل مفتاحي تماماً. من أين لك هذا؟",
          ],
          [
            "Mr. Reed",
            "Nora gave it to me, one week before the end.",
            "أعطتني إياه نورا قبل النهاية بأسبوع.",
          ],
          [
            "Mr. Reed",
            "Every year, I put a white rose in the box.",
            "وكل سنة أضع وردة بيضاء في الصندوق.",
          ],
          [
            "Mike",
            "So you are the rose man. I feel a little better.",
            "إذن أنت رجل الورد. ارتحت قليلاً.",
          ],
        ],
        ask(
          "Who puts the white rose in the box?",
          "من يضع الوردة البيضاء في الصندوق؟",
          2,
          4,
          ["Mr. Cole", "السيد كول"],
          ["Sara's mom", "أم سارة"],
          ["Mr. Reed", "السيد ريد"],
        ),
      ),
      part(
        "Open It",
        "افتحيها",
        [
          ["Mom", "You were in this shop when I was not.", "كنتَ في هذا المحل حين لم أكن أنا فيه."],
          [
            "Mr. Reed",
            "She looked at the door every day. She waited for you.",
            "كانت تنظر إلى الباب كل يوم. كانت تنتظركِ.",
          ],
          [
            null,
            "Mom cannot look at him. Her hands are shaking.",
            "لا تستطيع الأم النظر إليه. ويداها ترتجفان.",
          ],
          ["Mom", "Do not tell me about her. I know my mother.", "لا تحدّثني عنها. أنا أعرف أمي."],
          ["Mr. Reed", "Do you? Then open your letter, Anna.", "حقاً؟ إذن افتحي رسالتكِ يا آنا."],
          [
            null,
            "Mom puts one finger under the paper. And she stops.",
            "تضع الأم إصبعاً تحت الورقة. ثم تتوقف.",
          ],
        ],
        ask(
          "What does Mr. Reed ask Mom to do?",
          "ماذا يطلب السيد ريد من الأم؟",
          1,
          4,
          ["To sit in his chair", "أن تجلس على كرسيه"],
          ["To open her letter", "أن تفتح رسالتها"],
          ["To go to the bank", "أن تذهب إلى المصرف"],
        ),
      ),
    ],
    closing: q(
      "What problem does the shop have?",
      "ما مشكلة المحل؟",
      2,
      ["The door does not lock", "الباب لا يُقفل"],
      ["A mouse eats the books", "فأر يأكل الكتب"],
      ["The bank will take it on Friday", "المصرف سيأخذه يوم الجمعة"],
    ),
    words: [
      { word: "usual", sentence: "sits in his ___ chair.", hintAr: "معتاد." },
      { word: "bank", sentence: "On Friday the ___ will take this shop.", hintAr: "مصرف." },
      { word: "month", sentence: "Every ___, someone left money under the door.", hintAr: "شهر." },
      { word: "money", sentence: "The shop does not make ___.", hintAr: "مال." },
      { word: "same", sentence: "It is the ___ as mine.", hintAr: "نفسه." },
    ],
  },
  // ───────────────────────────────────────────────────────── 22 · episode 7
  {
    slug: "eleven-past-four",
    order: 22,
    level: "A1",
    tone: "inspiring",
    icon: "house",
    title: "Eleven Past Four",
    titleAr: "الرابعة وإحدى عشرة دقيقة",
    summary: "Mom opens her letter. The last episode of The Red Book.",
    summaryAr: "تفتح الأم رسالتها. الحلقة الأخيرة من «الكتاب الأحمر».",
    cast: WITH_READER,
    sections: [
      part(
        "For Anna",
        "إلى آنا",
        [
          [
            null,
            "Mom opens the envelope. The shop is very quiet.",
            "تفتح الأم الظرف. والمحل هادئ جداً.",
          ],
          [
            "Mom",
            '"My Anna, you were right, and I was afraid."',
            "«يا آنا، كنتِ على حق، وكنتُ خائفة».",
          ],
          [
            "Mom",
            '"I stayed with my books because books never leave."',
            "«بقيت مع كتبي لأن الكتب لا ترحل أبداً».",
          ],
          [
            "Mom",
            '"I am so sorry, Anna. I love you more than every book here."',
            "«أنا آسفة جداً يا آنا. أحبكِ أكثر من كل كتاب هنا».",
          ],
          ["Mom", '"The clock and I will wait for you."', "«أنا والساعة سننتظركِ»."],
          [
            null,
            "Mom cries like a little girl. Sara holds her.",
            "تبكي الأم مثل طفلة صغيرة. وتحتضنها سارة.",
          ],
        ],
        ask(
          "What does Nora say to Anna?",
          "ماذا تقول نورا لآنا؟",
          1,
          3,
          ["Sell the shop today", "بيعي المحل اليوم"],
          ["She is so sorry", "أنها آسفة جداً"],
          ["Do not come back", "لا تعودي"],
        ),
      ),
      part(
        "The Boy at the Door",
        "الولد عند الباب",
        [
          [
            "Mr. Reed",
            "Twenty years ago, I was a boy with no home.",
            "قبل عشرين سنة كنت صبياً بلا بيت.",
          ],
          [
            "Mr. Reed",
            "One cold night, your mother opened that door for me.",
            "في ليلة باردة فتحت أمكِ لي ذلك الباب.",
          ],
          [
            "Mr. Reed",
            'I said, "I have no money." She gave me a chair.',
            "قلت: «ليس معي مال». فأعطتني كرسياً.",
          ],
          ["Mr. Reed", 'She said, "Read now. Pay one day."', "وقالت: «اقرأ الآن. وادفع يوماً ما»."],
          ["Sara", "So the money under the door was you?", "إذن المال تحت الباب كان منك؟"],
          [null, "Mr. Reed smiles and looks down at his hat.", "يبتسم السيد ريد وينظر إلى قبعته."],
        ],
        ask(
          "What did Nora tell the boy?",
          "ماذا قالت نورا للصبي؟",
          0,
          3,
          ["Read now, pay one day", "اقرأ الآن وادفع يوماً ما"],
          ["Buy one book first", "اشترِ كتاباً أولاً"],
          ["Go home to your mother", "عُد إلى أمك"],
        ),
      ),
      part(
        "One Day",
        "ذلك اليوم",
        [
          [
            "Mr. Reed",
            "Today is that day. I will pay the bank.",
            "اليوم هو ذلك اليوم. سأدفع للمصرف.",
          ],
          [
            "Mr. Reed",
            "I do not want her shop. I want to buy it back for you.",
            "أنا لا أريد محلها. أريد أن أستردّه من أجلكم.",
          ],
          [
            "Mom",
            "For twenty years, I wanted to sell this place.",
            "عشرين سنة وأنا أريد بيع هذا المكان.",
          ],
          ["Mom", "Not today. Today we keep it.", "ليس اليوم. اليوم سنحتفظ به."],
          ["Mr. Cole", "And me? I still have one shelf to finish.", "وأنا؟ ما زال عندي رف لأنهيه."],
          ["Sara", "You can stay. But now I am your boss.", "يمكنك البقاء. لكنني الآن رئيستك."],
          [
            "Mike",
            "And I want to buy a book. The first customer!",
            "وأنا أريد شراء كتاب. أنا أول زبون!",
          ],
        ],
        ask(
          "What does Mom decide?",
          "ماذا تقرر الأم؟",
          2,
          3,
          ["To sell it to Mike", "أن تبيعه لمايك"],
          ["To close it forever", "أن تغلقه إلى الأبد"],
          ["To keep the shop", "أن تحتفظ بالمحل"],
        ),
      ),
      part(
        "Home",
        "في البيت",
        [
          [
            null,
            "Mom walks to the tall clock. The mouse looks at her.",
            "تمشي الأم إلى الساعة الطويلة. والفأر ينظر إليها.",
          ],
          [
            null,
            "The small key fits there too. She turns it slowly.",
            "المفتاح الصغير يناسب الساعة أيضاً. تديره ببطء.",
          ],
          [null, "Tick. Tick. Then the long hand moves.", "تِك. تِك. ثم يتحرك العقرب الطويل."],
          [
            "Sara",
            "Mom, look. It is eleven past four.",
            "أمي، انظري. إنها الرابعة وإحدى عشرة دقيقة.",
          ],
          [
            null,
            "For the first time in twenty years, time goes on.",
            "لأول مرة منذ عشرين سنة يمضي الوقت.",
          ],
          ["Mom", "Yes, my love. We are home.", "نعم يا حبيبتي. نحن في البيت."],
        ],
        ask(
          "What time does Sara see at the end?",
          "أيّ ساعة ترى سارة في النهاية؟",
          1,
          3,
          ["Ten past four", "الرابعة وعشر دقائق"],
          ["Eleven past four", "الرابعة وإحدى عشرة دقيقة"],
          ["Four o'clock", "الرابعة تماماً"],
        ),
      ),
    ],
    closing: q(
      "Why can the clock go on now?",
      "لماذا صارت الساعة تمضي الآن؟",
      0,
      ["Mom came home", "لأن الأم عادت إلى البيت"],
      ["The mouse left the clock", "لأن الفأر ترك الساعة"],
      ["Mr. Reed bought a new one", "لأن السيد ريد اشترى ساعة جديدة"],
    ),
    words: [
      {
        word: "leave",
        sentence: "I stayed with my books because books never ___.",
        hintAr: "يرحل.",
      },
      {
        word: "cold",
        sentence: "One ___ night, your mother opened that door for me.",
        hintAr: "بارد.",
      },
      { word: "boy", sentence: "I was a ___ with no home.", hintAr: "صبي." },
      { word: "wait", sentence: "The clock and I will ___ for you.", hintAr: "ينتظر." },
      { word: "home", sentence: "Yes, my love. We are ___.", hintAr: "البيت." },
    ],
  },
];

export const RED_BOOK_FINALE_EXAMS: Record<string, PassageExamSeed> = {
  "the-rose-under-the-floor": [
    q(
      "What does Mom want when she arrives?",
      "ماذا تريد الأم حين تصل؟",
      1,
      ["To buy a book", "أن تشتري كتاباً"],
      ["To take Sara home", "أن تأخذ سارة إلى البيت"],
      ["To see the mouse", "أن ترى الفأر"],
    ),
    q(
      "What is Mom's name?",
      "ما اسم الأم؟",
      0,
      ["Anna", "آنا"],
      ["Nora", "نورا"],
      ["Emma", "إيما"],
    ),
    tf(
      "Mom slept under the long shelf when she grew up.",
      "كانت الأم تنام تحت الرف الطويل في صغرها.",
      true,
    ),
    tf("Nora wanted to sell the shop.", "كانت نورا تريد بيع المحل.", false),
    q(
      "Where is the wooden box?",
      "أين الصندوق الخشبي؟",
      2,
      ["In Mike's bag", "في حقيبة مايك"],
      ["On the long shelf", "على الرف الطويل"],
      ["Under the board", "تحت اللوح الخشبي"],
    ),
  ],
  "twenty-birthdays": [
    q(
      "What holds the letters together?",
      "ما الذي يربط الرسائل معاً؟",
      1,
      ["A blue box", "علبة زرقاء"],
      ["A red string", "خيط أحمر"],
      ["An old photo", "صورة قديمة"],
    ),
    tf("Mom opens her letter at once.", "تفتح الأم رسالتها حالاً.", false),
    q(
      "What does the letter at twelve hope?",
      "ماذا تتمنى رسالة الثانية عشرة؟",
      0,
      ["That Sara reads at night", "أن تقرأ سارة في الليل"],
      ["That Sara sells flowers", "أن تبيع سارة الورد"],
      ["That Sara has a dog", "أن يكون لسارة كلب"],
    ),
    tf("Mr. Cole made Nora a promise.", "قطع السيد كول وعداً لنورا.", true),
    q(
      "What rings over the door?",
      "ما الذي يرنّ فوق الباب؟",
      2,
      ["A clock", "ساعة"],
      ["A phone", "هاتف"],
      ["A bell", "جرس"],
    ),
  ],
  "the-man-in-the-grey-hat": [
    q(
      "What is the quiet reader's name?",
      "ما اسم القارئ الصامت؟",
      0,
      ["Daniel Reed", "دانيال ريد"],
      ["Daniel Cole", "دانيال كول"],
      ["Mike Reed", "مايك ريد"],
    ),
    q(
      "How much money does Mike have?",
      "كم دولاراً مع مايك؟",
      2,
      ["Eighty dollars", "ثمانون دولاراً"],
      ["Two dollars", "دولاران"],
      ["Eight dollars", "ثمانية دولارات"],
    ),
    tf(
      "Mr. Cole says the shop makes a lot of money.",
      "يقول السيد كول إن المحل يربح كثيراً.",
      false,
    ),
    tf("Nora gave Mr. Reed a key.", "أعطت نورا السيد ريد مفتاحاً.", true),
    q(
      "What did Nora do every day?",
      "ماذا كانت نورا تفعل كل يوم؟",
      1,
      ["She sold flowers", "تبيع الورد"],
      ["She looked at the door", "تنظر إلى الباب"],
      ["She cleaned the clock", "تنظّف الساعة"],
    ),
  ],
  "eleven-past-four": [
    q(
      "Why did Nora stay with her books?",
      "لماذا بقيت نورا مع كتبها؟",
      2,
      ["Books make money", "لأن الكتب تربح مالاً"],
      ["Books are warm", "لأن الكتب دافئة"],
      ["Books never leave", "لأن الكتب لا ترحل"],
    ),
    q(
      "What did Nora give the boy?",
      "ماذا أعطت نورا الصبي؟",
      0,
      ["A chair", "كرسياً"],
      ["A coat", "معطفاً"],
      ["A bike", "دراجة"],
    ),
    tf("Mr. Reed wants to keep the shop for himself.", "يريد السيد ريد المحل لنفسه.", false),
    tf("Sara says she is now Mr. Cole's boss.", "تقول سارة إنها صارت رئيسة السيد كول.", true),
    q(
      "Who says he is the first customer?",
      "من يقول إنه أول زبون؟",
      1,
      ["Mr. Reed", "السيد ريد"],
      ["Mike", "مايك"],
      ["Mr. Cole", "السيد كول"],
    ),
  ],
};
