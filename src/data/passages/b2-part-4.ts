import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B2, fourth set — the same step as the others: less common words (obituary,
 * namesake, misdelivered), sentences that carry more than one idea, and questions that ask
 * what something means or implies rather than what happened. Written against everything
 * already in the library (the passages, the Daily Lessons, the Stories), so it repeats none
 * of them (see scripts/check-passage-duplicates.ts).
 */

export const B2_PASSAGES_PART_4: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 9
  {
    slug: "the-obituary",
    order: 9,
    level: "B2",
    tone: "serious",
    icon: "book",
    title: "The Obituary",
    titleAr: "النعي",
    summary: "Janet had one rule: the obituary page must never contain a mistake. Tonight it did.",
    summaryAr: "كانت لدى جانيت قاعدة واحدة: ألا تحوي صفحة النعي أي خطأ. وهذه الليلة حوت خطأً.",
    cast: { Janet: "autumn", "Mr. Delgado": "russ", Walter: "calm-male", Ruth: "zara" },
    sections: [
      {
        title: "The Midnight Deadline",
        titleAr: "الموعد النهائي لمنتصف الليل",
        lines: [
          {
            en: "Janet Moore had proofread obituaries at the Millbrook Gazette for nineteen years, and she believed they were the one page of a newspaper that must never contain a mistake.",
            ar: "كانت جانيت مور تدقّق صفحة النعي في صحيفة «ميلبروك غازيت» منذ تسع عشرة سنة، وتعتقد أنها الصفحة الوحيدة في الصحيفة التي لا يجوز أن تحوي أي خطأ.",
          },
          {
            en: 'At ten past eleven, she read tomorrow\'s proof: "Walter Brandt, eighty-three, a retired mathematics teacher, died peacefully on Sunday." Above the text sat a photograph.',
            ar: "في الحادية عشرة وعشر دقائق قرأت تجربة طباعة الغد: «والتر براندت، ثلاثة وثمانون عاماً، معلم رياضيات متقاعد، توفي بسلام يوم الأحد». وكانت فوق النص صورة.",
          },
          {
            en: "It showed a grinning man in a sequined vest, caught in the middle of a dance step, holding a trophy above his head.",
            ar: "أظهرت رجلاً يبتسم ابتسامة عريضة في سترة مرصّعة بالترتر، التُقط في منتصف خطوة رقص، رافعاً كأساً فوق رأسه.",
          },
          {
            en: "Janet read the sentence again, then the face again. A quiet teacher of mathematics, she suspected, did not usually pose like that.",
            ar: "قرأت جانيت الجملة مرة أخرى، ثم نظرت إلى الوجه مرة أخرى. فمعلّم الرياضيات الهادئ، كما ظنّت، لا يتخذ عادةً هذه الوضعية.",
          },
          {
            who: "Janet",
            en: "Mr. Delgado, I think this is the wrong man.",
            ar: "سيد ديلغادو، أظن أن هذا ليس الرجل المقصود.",
          },
          {
            who: "Mr. Delgado",
            en: "The archive has a Walter Brandt. The page closes at midnight. Print it.",
            ar: "الأرشيف فيه والتر براندت. والصفحة تُغلق عند منتصف الليل. اطبعوها.",
          },
        ],
        question: {
          en: "What made Janet suspect that the photograph was wrong?",
          ar: "ما الذي جعل جانيت تشك في أن الصورة خاطئة؟",
          options: [
            { en: "The photograph was blurred", ar: "كانت الصورة ضبابية" },
            { en: "Mr. Delgado had warned her", ar: "كان السيد ديلغادو قد حذّرها" },
            { en: "The name was spelled differently", ar: "كان الاسم مكتوباً بتهجئة مختلفة" },
            {
              en: "The man's appearance did not fit the description of a quiet teacher",
              ar: "لم يكن مظهر الرجل ينسجم مع وصف معلّم هادئ",
            },
          ],
          answer: 3,
          evidence: 3,
        },
      },
      {
        title: "The Other Walter",
        titleAr: "والتر الآخر",
        lines: [
          {
            en: 'Janet searched the archive and found the original caption: "Walter J. Brandt, winner of the Senior Ballroom Championship." The address was ten minutes away.',
            ar: "بحثت جانيت في الأرشيف ووجدت التعليق الأصلي: «والتر ج. براندت، الفائز ببطولة الرقص للمسنين». وكان العنوان على بعد عشر دقائق.",
          },
          {
            en: "She was not supposed to leave before the page closed. She grabbed her coat anyway: a rule that protects a mistake, she decided, is not worth keeping.",
            ar: "لم يكن يُفترض أن تغادر قبل إغلاق الصفحة. لكنها أخذت معطفها على أي حال: فقاعدة تحمي الخطأ، كما قررت، لا تستحق أن تُبقى.",
          },
          {
            en: "At eleven thirty-five, a light was still on at the address. A man in a bathrobe opened the door: the same grin, the same ears, and very much alive.",
            ar: "عند الحادية عشرة وخمس وثلاثين دقيقة كان ضوء ما زال مضاءً عند العنوان. وفتح الباب رجل بروب الاستحمام: الابتسامة نفسها، والأذنان نفسهما، وهو على قيد الحياة تماماً.",
          },
          {
            who: "Janet",
            en: "Mr. Brandt? I'm so sorry. I work at the Gazette, and tomorrow morning an obituary will carry your photograph.",
            ar: "سيد براندت؟ أنا آسفة جداً. أعمل في «الغازيت»، وغداً صباحاً سيحمل نعيٌ صورتك.",
          },
          {
            en: "There was a long pause. Then Walter Brandt, seventy-nine, stepped aside to let her in.",
            ar: "ساد صمت طويل. ثم تنحّى والتر براندت، وعمره تسعة وسبعون عاماً، ليدخلها.",
          },
          {
            who: "Walter",
            en: "Come in, dear. Just tell me one thing first: was it a flattering photograph?",
            ar: "تفضلي يا عزيزتي. أخبريني بشيء واحد أولاً: هل كانت صورة تُظهرني بأحسن حال؟",
          },
        ],
        question: {
          en: "What does Walter's first question suggest about him?",
          ar: "ماذا يوحي سؤال والتر الأول عنه؟",
          options: [
            { en: "He was offended by the mistake", ar: "شعر بالإساءة من الخطأ" },
            { en: "He had not understood her", ar: "لم يفهم كلامها" },
            { en: "He took the news with humor", ar: "تلقّى الخبر بروح الدعابة" },
            { en: "He wanted to sue the newspaper", ar: "أراد أن يقاضي الصحيفة" },
          ],
          answer: 2,
          evidence: 5,
        },
      },
      {
        title: "Sixty Years of Mail",
        titleAr: "ستون سنة من البريد",
        lines: [
          {
            en: "Janet showed him the proof. He read the whole obituary slowly, the way people read a letter addressed to them, and at the end he took off his glasses.",
            ar: "أرته جانيت تجربة الطباعة. قرأ النعي كله ببطء، كما يقرأ الناس رسالة موجهة إليهم، وفي النهاية خلع نظارته.",
          },
          {
            who: "Walter",
            en: "Walter A. Brandt. The other Walter. So he's gone.",
            ar: "والتر أ. براندت. والتر الآخر. إذن رحل.",
          },
          {
            en: "He explained that the two of them had shared a name and a town for sixty years. Their mail had been mixed up, their bills had crossed, and one wedding invitation had gone to the wrong church.",
            ar: "شرح أنهما تقاسما الاسم والبلدة ستين سنة. اختلط بريدهما، وتقاطعت فواتيرهما، وذهبت دعوة زفاف إلى كنيسة خطأ.",
          },
          {
            who: "Walter",
            en: "We always said we'd have coffee together. I'd have liked to meet my namesake. Each of us assumed the other was too busy.",
            ar: "كنا نقول دائماً إننا سنشرب القهوة معاً. وكنت أتمنى أن ألتقي بمن يحمل اسمي. وكان كل منا يفترض أن الآخر مشغول جداً.",
          },
          {
            en: "For a moment, the cheerful man in the bathrobe looked his age. Then he put his glasses back on and became the man in the photograph again.",
            ar: "للحظة بدا الرجل المرح بروب الاستحمام في سنّه الحقيقية. ثم أعاد نظارته وصار من جديد الرجل الذي في الصورة.",
          },
          {
            who: "Walter",
            en: "Print the right photograph, please. And add one line: the other Walter says hello.",
            ar: "اطبعي الصورة الصحيحة من فضلك. وأضيفي سطراً واحداً: والتر الآخر يلقي التحية.",
          },
        ],
        question: {
          en: "Why did Walter ask for an extra line to be added?",
          ar: "لماذا طلب والتر إضافة سطر؟",
          options: [
            {
              en: "He regretted never meeting his namesake and wanted to greet him",
              ar: "ندم لأنه لم يلتقِ قط بمن يحمل اسمه وأراد أن يحييه",
            },
            {
              en: "He wanted the newspaper to apologize publicly",
              ar: "أراد أن تعتذر الصحيفة علناً",
            },
            {
              en: "He hoped to see his own name in the paper",
              ar: "كان يأمل أن يرى اسمه في الصحيفة",
            },
            {
              en: "He was afraid people would confuse them again",
              ar: "كان يخشى أن يخلط الناس بينهما مرة أخرى",
            },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Four Minutes",
        titleAr: "أربع دقائق",
        lines: [
          {
            en: "Janet reached the newsroom at eleven fifty-one. The page was locked, and Mr. Delgado stood over the printer with his arms crossed.",
            ar: "وصلت جانيت إلى غرفة التحرير في الحادية عشرة وإحدى وخمسين دقيقة. كانت الصفحة قد قُفلت، ووقف السيد ديلغادو عند الطابعة عاقداً ذراعيه.",
          },
          {
            who: "Janet",
            en: "Walter Brandt, the teacher, has a family. They deserve to see their own father's face on that page.",
            ar: "والتر براندت، المعلم، له عائلة. ومن حقهم أن يروا وجه أبيهم هو على تلك الصفحة.",
          },
          {
            en: "Mr. Delgado opened his mouth to refuse. Then, as editors do at the edge of a deadline, he looked at his watch instead of the problem.",
            ar: "فتح السيد ديلغادو فمه ليرفض. ثم، كما يفعل المحررون على حافة الموعد النهائي، نظر إلى ساعته بدلاً من أن ينظر إلى المشكلة.",
          },
          {
            en: "The funeral home's email had been sitting unread in the inbox since eight o'clock. The intern had never opened it.",
            ar: "كانت رسالة دار الجنائز قد بقيت غير مقروءة في صندوق الوارد منذ الثامنة. ولم يفتحها المتدرب قط.",
          },
          {
            en: "Janet attached the right photograph: a man in a gray suit, smiling the small smile of someone who had spent forty years explaining fractions.",
            ar: "أرفقت جانيت الصورة الصحيحة: رجل في بدلة رمادية، يبتسم ابتسامة صغيرة لمن أمضى أربعين سنة يشرح الكسور.",
          },
          {
            en: "The corrected page went to press with four minutes to spare.",
            ar: "ذهبت الصفحة المصحّحة إلى الطباعة وقد بقيت أربع دقائق.",
          },
          {
            who: "Mr. Delgado",
            en: "Good catch, Moore. And if anyone asks, I never told you to print it.",
            ar: "التقاطة جيدة يا مور. وإن سأل أحد، فأنا لم أطلب منك أن تطبعيها.",
          },
        ],
        question: {
          en: "What does Mr. Delgado's last remark suggest?",
          ar: "ماذا توحي ملاحظة السيد ديلغادو الأخيرة؟",
          options: [
            {
              en: "He wants to take credit for the correction",
              ar: "يريد أن ينسب لنفسه الفضل في التصحيح",
            },
            {
              en: "He is angry that Janet left the building",
              ar: "إنه غاضب لأن جانيت غادرت المبنى",
            },
            {
              en: "He is pleased that the mistake was never printed",
              ar: "يسعده أن الخطأ لم يُطبع قط",
            },
            {
              en: "He is embarrassed that he had told her to print it",
              ar: "يحرجه أنه كان قد طلب منها أن تطبعها",
            },
          ],
          answer: 3,
          evidence: 6,
        },
      },
      {
        title: "Two Walters",
        titleAr: "والتران",
        lines: [
          {
            en: 'The next morning, the Gazette ran a correction headlined "Two Walters," the story of two men who had shared a name, a town and sixty years of misdelivered mail.',
            ar: "في صباح اليوم التالي نشرت «الغازيت» تصحيحاً بعنوان «والتران»، قصة رجلين تقاسما الاسم والبلدة وستين سنة من البريد الذي يصل إلى غير صاحبه.",
          },
          {
            en: "On Thursday, Walter J. Brandt sat in the last row of the church in a dark suit, his trophy left at home.",
            ar: "يوم الخميس جلس والتر ج. براندت في الصف الأخير من الكنيسة مرتدياً بدلة داكنة، وقد ترك كأسه في البيت.",
          },
          {
            en: "After the service, a woman in a gray coat walked straight to the back, holding the newspaper. She was Ruth, the late Walter's daughter.",
            ar: "بعد المراسم مشت امرأة بمعطف رمادي مباشرة إلى الخلف وهي تحمل الصحيفة. كانت روث، ابنة والتر الراحل.",
          },
          {
            who: "Ruth",
            en: "Dad used to say there was another Walter Brandt who got his mail.",
            ar: "كان أبي يقول إن هناك والتر براندت آخر يصله بريده.",
          },
          {
            who: "Walter",
            en: "He got mine, too. I hope he enjoyed my gas bills.",
            ar: "وكان يصله بريدي أيضاً. أرجو أنه استمتع بفواتير الغاز التي لي.",
          },
          {
            en: "Ruth laughed, wiped her eyes and opened her handbag: a thick folder tied with string, full of envelopes addressed to Walter J. Brandt, each kept for fifty years.",
            ar: "ضحكت روث ومسحت عينيها وفتحت حقيبتها: ملف سميك مربوط بخيط، مليء بمغلفات موجهة إلى والتر ج. براندت، احتُفظ بكل منها خمسين سنة.",
          },
          {
            who: "Ruth",
            en: "He never threw one away. He was saving them to give you in person.",
            ar: "لم يرمِ أيّاً منها قط. كان يدّخرها ليسلّمها إليك شخصياً.",
          },
        ],
        question: {
          en: "Why did Ruth give Walter the folder?",
          ar: "لماذا أعطت روث والتر الملف؟",
          options: [
            { en: "She wanted to get rid of the old mail", ar: "أرادت أن تتخلص من البريد القديم" },
            {
              en: "She hoped he would pay the old bills",
              ar: "كانت تأمل أن يسدد الفواتير القديمة",
            },
            {
              en: "Her father had kept the mail in order to hand it to him himself",
              ar: "كان أبوها قد احتفظ بالبريد ليسلّمه إليه بنفسه",
            },
            { en: "She wanted him to write about it", ar: "أرادت أن يكتب عن ذلك" },
          ],
          answer: 2,
          evidence: 6,
        },
      },
    ],
    closing: {
      en: "What larger idea does the story as a whole illustrate?",
      ar: "ما الفكرة الأكبر التي تجسّدها القصة كلها؟",
      options: [
        {
          en: "A mistake, once noticed, can become a chance for people to connect",
          ar: "الخطأ، متى اكتُشف، قد يصبح فرصة ليتقارب الناس",
        },
        {
          en: "Newspapers should never trust their archives",
          ar: "ينبغي ألا تثق الصحف بأرشيفها أبداً",
        },
        {
          en: "People with the same name should live in different towns",
          ar: "ينبغي أن يعيش أصحاب الاسم الواحد في بلدات مختلفة",
        },
        {
          en: "Deadlines are more important than accuracy",
          ar: "المواعيد النهائية أهم من الدقة",
        },
      ],
      answer: 0,
    },
    words: [
      {
        word: "proofread",
        sentence: "Janet Moore had ___ obituaries at the Millbrook Gazette for nineteen years",
        hintAr: "دقّق لغوياً.",
      },
      {
        word: "archive",
        sentence: "Janet searched the ___ and found the original caption",
        hintAr: "أرشيف.",
      },
      {
        word: "flattering",
        sentence: "was it a ___ photograph?",
        hintAr: "يُظهر صاحبه بأحسن حال.",
      },
      {
        word: "obituary",
        sentence: "He read the whole ___ slowly, the way people read a letter addressed to them",
        hintAr: "نعي.",
      },
      {
        word: "namesake",
        sentence: "I'd have liked to meet my ___.",
        hintAr: "من يحمل الاسم نفسه.",
      },
      {
        word: "misdelivered",
        sentence: "sixty years of ___ mail.",
        hintAr: "وصل إلى غير صاحبه.",
      },
    ],
  },
];
