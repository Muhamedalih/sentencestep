import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A1 passages, first half. Every one is a real-life scene with named
 * characters (American first names, the way a learner would meet them in any
 * English-speaking film or workplace), a clear turn in the middle and a small
 * payoff at the end — never a "lesson" about a grammar point. The English
 * stays at A1: present tenses, short sentences, everyday words; a few
 * slightly harder words (suddenly, asleep, wonderful) appear only where the
 * scene makes their meaning obvious.
 */

export const A1_PASSAGES_PART_1: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 1
  {
    slug: "my-cat-is-my-boss",
    order: 1,
    level: "A1",
    tone: "funny",
    icon: "cat",
    title: "My Cat Is My Boss",
    titleAr: "قطّي هو المدير",
    summary: "At five o'clock every morning, Tom's cat wants one thing.",
    summaryAr: "كل صباح في الخامسة، يريد قط توم شيئاً واحداً.",
    cast: { Tom: "russ" },
    sections: [
      {
        title: "Five O'Clock",
        titleAr: "الساعة الخامسة",
        lines: [
          {
            en: "Tom has a cat. His name is Milo.",
            ar: "عند توم قط. اسمه ميلو.",
          },
          {
            en: "Milo is small, but he is the boss.",
            ar: "ميلو صغير، لكنه هو المدير.",
          },
          {
            en: "It is five o'clock in the morning. Tom is asleep.",
            ar: "الساعة الخامسة صباحاً. توم نائم.",
          },
          {
            en: "Suddenly, Milo jumps on Tom's face.",
            ar: "فجأة، يقفز ميلو على وجه توم.",
          },
          {
            who: "Tom",
            en: "Milo! It's five o'clock!",
            ar: "ميلو! إنها الخامسة صباحاً!",
          },
          {
            en: 'Milo looks at Tom and says, "Meow."',
            ar: "ينظر ميلو إلى توم ويقول: «مياو».",
          },
          {
            en: 'In cat language, it means: "Food. Now."',
            ar: "بلغة القطط، هذا يعني: «طعام. الآن.»",
          },
        ],
        question: {
          en: "Who is the boss in this house?",
          ar: "من هو المدير في هذا البيت؟",
          options: [
            { en: "Tom", ar: "توم" },
            { en: "Milo, the cat", ar: "ميلو، القط" },
            { en: "Tom's mom", ar: "أم توم" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
      {
        title: "The Wrong Food",
        titleAr: "الطعام الخطأ",
        lines: [
          {
            en: "Tom gets up. He is very tired.",
            ar: "يقوم توم من فراشه. هو متعب جداً.",
          },
          {
            en: "He puts food in Milo's bowl.",
            ar: "يضع الطعام في وعاء ميلو.",
          },
          {
            en: "Milo smells it. Then he walks away.",
            ar: "يشمّ ميلو الطعام. ثم يبتعد.",
          },
          {
            who: "Tom",
            en: "What? You're not hungry?",
            ar: "ماذا؟ ألست جائعاً؟",
          },
          {
            en: "Tom opens a new box of food. Milo walks away again.",
            ar: "يفتح توم علبة طعام جديدة. يبتعد ميلو مرة أخرى.",
          },
          {
            en: "Tom opens a third box. The same thing!",
            ar: "يفتح توم علبة ثالثة. الشيء نفسه!",
          },
          {
            who: "Tom",
            en: "Milo, please. I want to sleep!",
            ar: "ميلو، أرجوك. أريد أن أنام!",
          },
        ],
        question: {
          en: "What does Milo do with the food?",
          ar: "ماذا يفعل ميلو بالطعام؟",
          options: [
            { en: "He eats it", ar: "يأكله" },
            { en: "He walks away", ar: "يبتعد عنه" },
            { en: "He gives it to Tom", ar: "يعطيه لتوم" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "The Sandwich",
        titleAr: "الساندويتش",
        lines: [
          {
            en: "Now Tom is hungry too. He makes a sandwich.",
            ar: "الآن توم جائع أيضاً. يصنع ساندويتشاً.",
          },
          {
            en: "He sits down at the table.",
            ar: "يجلس إلى الطاولة.",
          },
          {
            en: "Suddenly, Milo is next to him. He looks at the sandwich.",
            ar: "فجأة، يصبح ميلو بجانبه. ينظر إلى الساندويتش.",
          },
          {
            who: "Tom",
            en: "No, Milo. This is MY sandwich.",
            ar: "لا يا ميلو. هذا ساندويتشي أنا.",
          },
          {
            en: "Milo jumps on the table. He takes the sandwich and runs away.",
            ar: "يقفز ميلو على الطاولة. يأخذ الساندويتش ويهرب.",
          },
          {
            who: "Tom",
            en: "MILO!",
            ar: "ميلو!",
          },
        ],
        question: {
          en: "What does Milo really want?",
          ar: "ماذا يريد ميلو حقاً؟",
          options: [
            { en: "Tom's sandwich", ar: "ساندويتش توم" },
            { en: "A new bed", ar: "سريراً جديداً" },
            { en: "A walk outside", ar: "نزهة في الخارج" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Good Morning, Boss",
        titleAr: "صباح الخير أيها المدير",
        lines: [
          {
            en: "Tom is angry, but Milo is happy.",
            ar: "توم غاضب، لكن ميلو سعيد.",
          },
          {
            en: "Now Milo is on the sofa. He is asleep.",
            ar: "الآن ميلو على الأريكة. هو نائم.",
          },
          {
            who: "Tom",
            en: "You are a bad cat. But you are my bad cat.",
            ar: "أنت قط سيئ. لكنك قطي السيئ.",
          },
          {
            en: "Tomorrow, at five o'clock, Milo comes again.",
            ar: "غداً، في الخامسة، يأتي ميلو مرة أخرى.",
          },
          {
            en: "But Tom has a plan: two sandwiches.",
            ar: "لكن توم لديه خطة: ساندويتشان.",
          },
        ],
        question: {
          en: "What is Tom's plan for tomorrow?",
          ar: "ما خطة توم لغدٍ؟",
          options: [
            { en: "Two sandwiches", ar: "ساندويتشان" },
            { en: "A new cat", ar: "قط جديد" },
            { en: "A big bowl", ar: "وعاء كبير" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "How does Milo wake Tom up?",
      ar: "كيف يوقظ ميلو توم؟",
      options: [
        { en: "He jumps on Tom's face", ar: "يقفز على وجه توم" },
        { en: "He pulls Tom's blanket", ar: "يسحب بطانية توم" },
        { en: "He opens the window", ar: "يفتح النافذة" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "asleep",
        sentence: "It is five o'clock in the morning. Tom is ___.",
        hintAr: "نائم.",
      },
      { word: "tired", sentence: "Tom gets up. He is very ___.", hintAr: "متعب، مرهق." },
      { word: "bowl", sentence: "He puts food in Milo's ___.", hintAr: "الوعاء، الصحن." },
      {
        word: "sandwich",
        sentence: "Now Tom is hungry too. He makes a ___.",
        hintAr: "الساندويتش.",
      },
      { word: "plan", sentence: "But Tom has a ___: two sandwiches.", hintAr: "الخطة." },
    ],
  },

  // ───────────────────────────────────────────────────────── 2
  {
    slug: "the-perfect-selfie",
    order: 2,
    level: "A1",
    tone: "funny",
    icon: "camera",
    title: "The Perfect Selfie",
    titleAr: "السيلفي المثالي",
    summary: "Jake wants one good photo. How hard can it be?",
    summaryAr: "يريد جيك صورة جيدة واحدة. هل هذا صعب؟",
    cast: { Jake: "russ", Nina: "zara" },
    sections: [
      {
        title: "A Big Plan",
        titleAr: "خطة كبيرة",
        lines: [
          {
            en: "Jake wants a new profile photo.",
            ar: "يريد جيك صورة جديدة لحسابه.",
          },
          {
            en: "He goes to the park with his dog, Rex. It is a beautiful day.",
            ar: "يذهب إلى الحديقة مع كلبه ريكس. إنه يوم جميل.",
          },
          {
            who: "Jake",
            en: "Okay. Smile, Jake. One, two, three!",
            ar: "حسناً. ابتسم يا جيك. واحد، اثنان، ثلاثة!",
          },
          {
            en: "Click! Jake looks at the photo.",
            ar: "كليك! ينظر جيك إلى الصورة.",
          },
          {
            en: "He sees his finger. Only his finger!",
            ar: "يرى إصبعه. إصبعه فقط!",
          },
        ],
        question: {
          en: "What is the problem with the first photo?",
          ar: "ما مشكلة الصورة الأولى؟",
          options: [
            { en: "A finger is in front of the camera", ar: "إصبع أمام الكاميرا" },
            { en: "It is too dark", ar: "إنها مظلمة جداً" },
            { en: "A bird is in it", ar: "فيها طائر" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "Try Again",
        titleAr: "حاول مرة أخرى",
        lines: [
          {
            who: "Jake",
            en: "Again!",
            ar: "مرة أخرى!",
          },
          {
            en: "This time, a bird flies in front of the phone.",
            ar: "هذه المرة، يطير طائر أمام الهاتف.",
          },
          {
            who: "Jake",
            en: "Go away, bird!",
            ar: "اذهب بعيداً أيها الطائر!",
          },
          {
            en: "Third photo: the wind takes his hat.",
            ar: "الصورة الثالثة: الريح تأخذ قبعته.",
          },
          {
            en: "Jake runs after his hat. Some people laugh.",
            ar: "يركض جيك خلف قبعته. بعض الناس يضحكون.",
          },
          {
            who: "Jake",
            en: "This is not funny!",
            ar: "هذا ليس مضحكاً!",
          },
        ],
        question: {
          en: "What takes Jake's hat?",
          ar: "ما الذي يأخذ قبعة جيك؟",
          options: [
            { en: "The wind", ar: "الريح" },
            { en: "A dog", ar: "كلب" },
            { en: "A man", ar: "رجل" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "A Kind Woman",
        titleAr: "امرأة لطيفة",
        lines: [
          {
            en: "A woman is sitting on a bench. Her name is Nina.",
            ar: "امرأة تجلس على مقعد. اسمها نينا.",
          },
          {
            who: "Nina",
            en: "Do you need help? I can take your photo.",
            ar: "هل تحتاج إلى مساعدة؟ أستطيع التقاط صورتك.",
          },
          {
            who: "Jake",
            en: "Yes, please! Thank you!",
            ar: "نعم، من فضلك! شكراً!",
          },
          {
            who: "Nina",
            en: "Okay. Look at me. Say cheese!",
            ar: "حسناً. انظر إليّ. قل «تشيز»!",
          },
          {
            en: "At that moment, Rex jumps on Jake and licks his face.",
            ar: "في تلك اللحظة، يقفز ريكس على جيك ويلعق وجهه.",
          },
          {
            en: "Jake closes his eyes and laughs. Click!",
            ar: "يغلق جيك عينيه ويضحك. كليك!",
          },
        ],
        question: {
          en: "What does Rex do?",
          ar: "ماذا يفعل ريكس؟",
          options: [
            { en: "He jumps on Jake", ar: "يقفز على جيك" },
            { en: "He runs away", ar: "يهرب" },
            { en: "He sleeps", ar: "ينام" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "The Best Photo",
        titleAr: "أفضل صورة",
        lines: [
          {
            who: "Nina",
            en: "Wait! Look at this photo!",
            ar: "انتظر! انظر إلى هذه الصورة!",
          },
          {
            en: "In the photo, Jake is laughing, and Rex is next to his face.",
            ar: "في الصورة، جيك يضحك، وريكس بجانب وجهه.",
          },
          {
            who: "Nina",
            en: "It is perfect!",
            ar: "إنها مثالية!",
          },
          {
            who: "Jake",
            en: "Really? I look crazy!",
            ar: "حقاً؟ أبدو مجنوناً!",
          },
          {
            who: "Nina",
            en: "Yes. But you look happy.",
            ar: "نعم. لكنك تبدو سعيداً.",
          },
          {
            en: 'Jake uses it as his new profile photo. Fifty friends write: "Best photo ever!"',
            ar: "يستخدم جيك الصورة كصورة جديدة لحسابه. يكتب خمسون صديقاً: «أفضل صورة على الإطلاق!»",
          },
        ],
        question: {
          en: "Why is the last photo perfect?",
          ar: "لماذا الصورة الأخيرة مثالية؟",
          options: [
            { en: "Jake looks happy in it", ar: "يبدو جيك سعيداً فيها" },
            { en: "Jake is alone in it", ar: "جيك وحده فيها" },
            { en: "Jake looks very serious", ar: "يبدو جيك جاداً جداً" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What does Jake want at the start of the story?",
      ar: "ماذا يريد جيك في بداية القصة؟",
      options: [
        { en: "A new profile photo", ar: "صورة جديدة لحسابه" },
        { en: "A new phone", ar: "هاتفاً جديداً" },
        { en: "A new hat", ar: "قبعة جديدة" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "wind",
        sentence: "Third photo: the ___ takes his hat.",
        hintAr: "الريح.",
      },
      {
        word: "bird",
        sentence: "This time, a ___ flies in front of the phone.",
        hintAr: "الطائر، العصفور.",
      },
      {
        word: "smile",
        sentence: "Okay. ___, Jake. One, two, three!",
        hintAr: "يبتسم، ابتسامة.",
      },
      { word: "perfect", sentence: "It is ___!", hintAr: "مثالي، ممتاز." },
      { word: "crazy", sentence: "Really? I look ___!", hintAr: "مجنون." },
    ],
  },

  // ───────────────────────────────────────────────────────── 3
  {
    slug: "ten-minutes-a-day",
    order: 3,
    level: "A1",
    tone: "inspiring",
    icon: "music",
    title: "Ten Minutes a Day",
    titleAr: "عشر دقائق في اليوم",
    summary: "One song. One hundred days. Only ten minutes a day.",
    summaryAr: "أغنية واحدة. مئة يوم. عشر دقائق فقط في اليوم.",
    cast: { Leo: "russ", Grandma: "autumn" },
    sections: [
      {
        title: "The Old Guitar",
        titleAr: "الغيتار القديم",
        lines: [
          {
            en: "Leo finds an old guitar in his grandma's house.",
            ar: "يجد ليو غيتاراً قديماً في بيت جدته.",
          },
          {
            who: "Leo",
            en: "Grandma, can I play this?",
            ar: "جدتي، هل أستطيع العزف على هذا؟",
          },
          {
            who: "Grandma",
            en: "Of course. It is your grandfather's guitar. He played one song for me every year.",
            ar: "بالطبع. إنه غيتار جدك. كان يعزف لي أغنية واحدة كل عام.",
          },
          {
            who: "Leo",
            en: "Then I want to play that song for your birthday.",
            ar: "إذن أريد أن أعزف تلك الأغنية في عيد ميلادك.",
          },
          {
            who: "Grandma",
            en: "My birthday is in one hundred days.",
            ar: "عيد ميلادي بعد مئة يوم.",
          },
          {
            who: "Leo",
            en: "One hundred days? I can learn in one hundred days!",
            ar: "مئة يوم؟ أستطيع أن أتعلم في مئة يوم!",
          },
        ],
        question: {
          en: "When is Grandma's birthday?",
          ar: "متى عيد ميلاد الجدة؟",
          options: [
            { en: "In one hundred days", ar: "بعد مئة يوم" },
            { en: "Tomorrow", ar: "غداً" },
            { en: "In ten days", ar: "بعد عشرة أيام" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "Terrible",
        titleAr: "فظيع",
        lines: [
          {
            en: "Day one. Leo plays for ten minutes. It sounds terrible.",
            ar: "اليوم الأول. يعزف ليو عشر دقائق. الصوت فظيع.",
          },
          {
            en: "His fingers hurt. The sound is ugly.",
            ar: "أصابعه تؤلمه. والصوت قبيح.",
          },
          {
            who: "Leo",
            en: "I cannot do this.",
            ar: "لا أستطيع فعل هذا.",
          },
          {
            en: "But he remembers the plan: practice only ten minutes every day.",
            ar: "لكنه يتذكر الخطة: تدرّب عشر دقائق فقط كل يوم.",
          },
          {
            en: "Not one hour. Only ten minutes.",
            ar: "ليس ساعة. عشر دقائق فقط.",
          },
          {
            en: "Day two. Day three. Day four.",
            ar: "اليوم الثاني. اليوم الثالث. اليوم الرابع.",
          },
        ],
        question: {
          en: "How long does Leo play every day?",
          ar: "كم يعزف ليو كل يوم؟",
          options: [
            { en: "Ten minutes", ar: "عشر دقائق" },
            { en: "One hour", ar: "ساعة" },
            { en: "Five minutes", ar: "خمس دقائق" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Day Thirty",
        titleAr: "اليوم الثلاثون",
        lines: [
          {
            en: "Day thirty. Leo can play a very simple song now.",
            ar: "اليوم الثلاثون. يستطيع ليو الآن عزف أغنية بسيطة جداً.",
          },
          {
            en: "It is slow, and it has mistakes, but it is music!",
            ar: "إنها بطيئة وفيها أخطاء، لكنها موسيقى!",
          },
          {
            who: "Leo",
            en: "I am getting better!",
            ar: "أنا أتحسن!",
          },
          {
            en: "Every day, the same ten minutes. Before school. After dinner.",
            ar: "كل يوم، عشر الدقائق نفسها. قبل المدرسة. بعد العشاء.",
          },
          {
            en: "Small steps, every day.",
            ar: "خطوات صغيرة، كل يوم.",
          },
        ],
        question: {
          en: "What can Leo do on day thirty?",
          ar: "ماذا يستطيع ليو أن يفعل في اليوم الثلاثين؟",
          options: [
            { en: "Play a very simple song", ar: "يعزف أغنية بسيطة جداً" },
            { en: "Play perfectly", ar: "يعزف بشكل مثالي" },
            { en: "Nothing yet", ar: "لا شيء بعد" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "Day Sixty",
        titleAr: "اليوم الستون",
        lines: [
          {
            en: "Day sixty. Leo is tired. He wants to stop.",
            ar: "اليوم الستون. ليو متعب. يريد أن يتوقف.",
          },
          {
            who: "Leo",
            en: "This song is too hard. I can't finish it.",
            ar: "هذه الأغنية صعبة جداً. لا أستطيع إتمامها.",
          },
          {
            en: "Grandma hears him from the kitchen. She comes in and sits down.",
            ar: "تسمعه الجدة من المطبخ. تدخل وتجلس.",
          },
          {
            who: "Grandma",
            en: "Your grandfather also stopped, many times. But he always came back.",
            ar: "جدك أيضاً توقف مرات كثيرة. لكنه كان يعود دائماً.",
          },
          {
            who: "Leo",
            en: "Really?",
            ar: "حقاً؟",
          },
          {
            who: "Grandma",
            en: "Play ten minutes today. Only ten. Then you can stop.",
            ar: "اعزف عشر دقائق اليوم. عشراً فقط. وبعدها يمكنك أن تتوقف.",
          },
          {
            en: "Leo plays ten minutes. Then another ten. Then he forgets to stop.",
            ar: "يعزف ليو عشر دقائق. ثم عشراً أخرى. ثم ينسى أن يتوقف.",
          },
        ],
        question: {
          en: "What does Grandma ask Leo to do?",
          ar: "ماذا تطلب الجدة من ليو؟",
          options: [
            { en: "Play only ten minutes today", ar: "أن يعزف عشر دقائق فقط اليوم" },
            { en: "Stop playing forever", ar: "أن يتوقف إلى الأبد" },
            { en: "Buy a new guitar", ar: "أن يشتري غيتاراً جديداً" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "Day One Hundred",
        titleAr: "اليوم المئة",
        lines: [
          {
            en: "Day one hundred. It is Grandma's birthday.",
            ar: "اليوم المئة. إنه عيد ميلاد الجدة.",
          },
          {
            en: "The whole family is in the living room.",
            ar: "العائلة كلها في غرفة الجلوس.",
          },
          {
            who: "Leo",
            en: "Grandma, this song is for you.",
            ar: "جدتي، هذه الأغنية لكِ.",
          },
          {
            en: "He plays his grandfather's song. Slowly, with no mistakes.",
            ar: "يعزف أغنية جده. ببطء ودون أخطاء.",
          },
          {
            en: "Grandma cries. They are happy tears.",
            ar: "تبكي الجدة. إنها دموع سعادة.",
          },
          {
            who: "Grandma",
            en: "Leo... you play it just like him.",
            ar: "ليو... أنت تعزفها تماماً مثله.",
          },
          {
            who: "Leo",
            en: "Ten minutes a day, Grandma. That is all.",
            ar: "عشر دقائق في اليوم يا جدتي. هذا كل شيء.",
          },
        ],
        question: {
          en: "How does Grandma feel at the end?",
          ar: "كيف تشعر الجدة في النهاية؟",
          options: [
            { en: "Very happy", ar: "سعيدة جداً" },
            { en: "Angry", ar: "غاضبة" },
            { en: "Bored", ar: "ملّت" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What helps Leo learn the song?",
      ar: "ما الذي يساعد ليو على تعلّم الأغنية؟",
      options: [
        { en: "Practicing a little every day", ar: "التدرّب قليلاً كل يوم" },
        { en: "Playing for one hour on Sundays", ar: "العزف ساعة كل يوم أحد" },
        { en: "Getting a new teacher", ar: "الحصول على معلم جديد" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "guitar",
        sentence: "Leo finds an old ___ in his grandma's house.",
        hintAr: "الغيتار.",
      },
      { word: "song", sentence: "Grandma, this ___ is for you.", hintAr: "الأغنية." },
      {
        word: "practice",
        sentence: "But he remembers the plan: ___ only ten minutes every day.",
        hintAr: "يتدرّب، يمارس.",
      },
      {
        word: "terrible",
        sentence: "Day one. Leo plays for ten minutes. It sounds ___.",
        hintAr: "فظيع، سيئ جداً.",
      },
      { word: "hurt", sentence: "His fingers ___. The sound is ugly.", hintAr: "يؤلم." },
    ],
  },

  // ───────────────────────────────────────────────────────── 4
  {
    slug: "pizza-where-are-you",
    order: 4,
    level: "A1",
    tone: "funny",
    icon: "pizza",
    title: "Pizza, Where Are You?",
    titleAr: "بيتزا، أين أنتِ؟",
    summary: "Forty-five minutes. No pizza. Where is it?",
    summaryAr: "خمس وأربعون دقيقة. لا بيتزا. أين هي؟",
    cast: { Emma: "zara", Joe: "russ", "Mr. Brown": "calm-male" },
    sections: [
      {
        title: "Forty-Five Minutes",
        titleAr: "خمس وأربعون دقيقة",
        lines: [
          {
            en: "Emma is very hungry. She orders a pizza on her phone.",
            ar: "إيما جائعة جداً. تطلب بيتزا من هاتفها.",
          },
          {
            en: 'The app says: "Your pizza is coming in 20 minutes."',
            ar: "يقول التطبيق: «ستصل البيتزا خلال 20 دقيقة.»",
            say: 'The app says: "Your pizza is coming in twenty minutes."',
          },
          {
            en: "Emma waits twenty minutes. Then thirty. Then forty-five.",
            ar: "تنتظر إيما عشرين دقيقة. ثم ثلاثين. ثم خمساً وأربعين.",
          },
          {
            who: "Emma",
            en: "Where is my pizza?!",
            ar: "أين بيتزاي؟!",
          },
          {
            en: "She calls the pizza shop.",
            ar: "تتصل بمحل البيتزا.",
          },
        ],
        question: {
          en: "How long does Emma wait?",
          ar: "كم تنتظر إيما؟",
          options: [
            { en: "Twenty minutes", ar: "عشرين دقيقة" },
            { en: "More than forty minutes", ar: "أكثر من أربعين دقيقة" },
            { en: "One hour", ar: "ساعة واحدة" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "The Phone Call",
        titleAr: "المكالمة",
        lines: [
          {
            who: "Emma",
            en: "Hello? Where is my pizza?",
            ar: "ألو؟ أين بيتزاي؟",
          },
          {
            who: "Joe",
            en: "Hi! I'm Joe, your delivery guy. I'm on Oak Street, but I can't find your house!",
            ar: "مرحباً! أنا جو، موصّل طلبك. أنا في شارع أوك، لكنني لا أجد بيتك!",
          },
          {
            who: "Emma",
            en: "My address is 24 Oak Street.",
            ar: "عنواني 24 شارع أوك.",
            say: "My address is twenty-four Oak Street.",
          },
          {
            who: "Joe",
            en: "24? I'm at... 42 Oak Street. Oh no.",
            ar: "24؟ أنا عند... 42 شارع أوك. يا إلهي.",
            say: "Twenty-four? I'm at... forty-two Oak Street. Oh no.",
          },
          {
            who: "Emma",
            en: "That's the wrong house, Joe!",
            ar: "هذا هو البيت الخطأ يا جو!",
          },
          {
            who: "Joe",
            en: "Sorry, sorry! But the pizza is here with me. And a man is looking at it.",
            ar: "آسف، آسف! لكن البيتزا معي هنا. ورجل ينظر إليها.",
          },
        ],
        question: {
          en: "Which house is Joe at?",
          ar: "عند أي بيت يقف جو؟",
          options: [
            { en: "24 Oak Street", ar: "24 شارع أوك" },
            { en: "42 Oak Street", ar: "42 شارع أوك" },
            { en: "12 Oak Street", ar: "12 شارع أوك" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "Mr. Brown",
        titleAr: "السيد براون",
        lines: [
          {
            en: "Emma runs to 42 Oak Street. Joe is at the door.",
            ar: "تركض إيما إلى 42 شارع أوك. جو عند الباب.",
            say: "Emma runs to forty-two Oak Street. Joe is at the door.",
          },
          {
            en: "Next to him is an old man, Mr. Brown. He has the pizza box in his hands.",
            ar: "بجانبه رجل عجوز اسمه السيد براون. صندوق البيتزا في يديه.",
          },
          {
            who: "Mr. Brown",
            en: "Hello, Emma! This pizza smells wonderful.",
            ar: "مرحباً يا إيما! رائحة هذه البيتزا رائعة.",
          },
          {
            who: "Mr. Brown",
            en: "I'm sorry. The pizza is so good. I can't stop!",
            ar: "أنا آسف. البيتزا لذيذة جداً. لا أستطيع التوقف!",
          },
          {
            en: "Emma opens the box. There is only one slice.",
            ar: "تفتح إيما الصندوق. لا توجد إلا شريحة واحدة.",
          },
          {
            who: "Emma",
            en: "Only one slice?!",
            ar: "شريحة واحدة فقط؟!",
          },
        ],
        question: {
          en: "What is in the pizza box now?",
          ar: "ماذا في صندوق البيتزا الآن؟",
          options: [
            { en: "Only one slice", ar: "شريحة واحدة فقط" },
            { en: "A whole pizza", ar: "بيتزا كاملة" },
            { en: "Nothing at all", ar: "لا شيء إطلاقاً" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "A New Pizza",
        titleAr: "بيتزا جديدة",
        lines: [
          {
            en: "Emma looks at Mr. Brown. He looks like a sad child.",
            ar: "تنظر إيما إلى السيد براون. يبدو كطفل حزين.",
          },
          {
            who: "Emma",
            en: "It's okay, Mr. Brown.",
            ar: "لا بأس يا سيد براون.",
          },
          {
            en: "Joe calls his boss. A new pizza comes in ten minutes, for free!",
            ar: "يتصل جو بمديره. تصل بيتزا جديدة بعد عشر دقائق، مجاناً!",
          },
          {
            who: "Emma",
            en: "Mr. Brown, do you want to eat with me?",
            ar: "سيد براون، هل تريد أن تأكل معي؟",
          },
          {
            who: "Mr. Brown",
            en: "Really? Thank you! I live alone, and dinner is always quiet.",
            ar: "حقاً؟ شكراً! أنا أعيش وحدي، والعشاء دائماً هادئ.",
          },
          {
            en: "That night, at 24 Oak Street, Emma and Mr. Brown eat pizza together. Joe gets one slice too.",
            ar: "في تلك الليلة، في 24 شارع أوك، تأكل إيما والسيد براون البيتزا معاً. ويأخذ جو شريحة أيضاً.",
            say: "That night, at twenty-four Oak Street, Emma and Mr. Brown eat pizza together. Joe gets one slice too.",
          },
        ],
        question: {
          en: "What does Emma do at the end?",
          ar: "ماذا تفعل إيما في النهاية؟",
          options: [
            { en: "She shares the pizza with Mr. Brown", ar: "تتقاسم البيتزا مع السيد براون" },
            { en: "She is angry and goes home", ar: "تغضب وتذهب إلى البيت" },
            { en: "She cooks dinner", ar: "تطبخ العشاء" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
    ],
    closing: {
      en: "Who is Joe?",
      ar: "من هو جو؟",
      options: [
        { en: "The pizza delivery man", ar: "موصّل البيتزا" },
        { en: "Emma's brother", ar: "أخو إيما" },
        { en: "Mr. Brown's son", ar: "ابن السيد براون" },
      ],
      answer: 0,
    },
    words: [
      { word: "wrong", sentence: "That's the ___ house, Joe!", hintAr: "خاطئ، الخطأ." },
      {
        word: "wonderful",
        sentence: "Hello, Emma! This pizza smells ___.",
        hintAr: "رائع، مدهش.",
      },
      {
        word: "slice",
        sentence: "Emma opens the box. There is only one ___.",
        hintAr: "شريحة، قطعة.",
      },
      {
        word: "free",
        sentence: "A new pizza comes in ten minutes, for ___!",
        hintAr: "مجاني، مجاناً.",
      },
      {
        word: "alone",
        sentence: "Really? Thank you! I live ___, and dinner is always quiet.",
        hintAr: "وحيد، وحدي.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 5
  {
    slug: "the-wallet-on-the-bench",
    order: 5,
    level: "A1",
    tone: "serious",
    icon: "wallet",
    title: "The Wallet on the Bench",
    titleAr: "المحفظة على المقعد",
    summary: "Maria finds a wallet with two hundred dollars. Nobody is looking.",
    summaryAr: "تجد ماريا محفظة فيها مئتا دولار. لا أحد ينظر.",
    cast: { Maria: "zara", Ben: "russ", "Mr. Carter": "calm-male" },
    sections: [
      {
        title: "The Wallet",
        titleAr: "المحفظة",
        lines: [
          {
            en: "Maria is waiting for the bus. She sees a brown wallet on the bench.",
            ar: "تنتظر ماريا الحافلة. ترى محفظة بنية على المقعد.",
          },
          {
            en: "She opens it. There are two hundred dollars inside.",
            ar: "تفتحها. يوجد فيها مئتا دولار.",
          },
          {
            who: "Maria",
            en: "Wow. That is a lot of money.",
            ar: "واو. هذا مبلغ كبير.",
          },
          {
            en: "Maria is a student. She does not have much money.",
            ar: "ماريا طالبة. ليس لديها مال كثير.",
          },
          {
            en: "She looks around. Nobody is there.",
            ar: "تنظر حولها. لا أحد هناك.",
          },
        ],
        question: {
          en: "What does Maria find?",
          ar: "ماذا تجد ماريا؟",
          options: [
            { en: "A wallet with money", ar: "محفظة فيها مال" },
            { en: "A phone", ar: "هاتفاً" },
            { en: "A bag", ar: "حقيبة" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "A Hard Choice",
        titleAr: "قرار صعب",
        lines: [
          {
            en: "Maria calls her friend Ben.",
            ar: "تتصل ماريا بصديقها بن.",
          },
          {
            who: "Ben",
            en: "Keep it, Maria! Nobody knows.",
            ar: "احتفظي بها يا ماريا! لا أحد يعرف.",
          },
          {
            who: "Maria",
            en: "But it is not my money.",
            ar: "لكنه ليس مالي.",
          },
          {
            who: "Ben",
            en: "You need money. Think about it.",
            ar: "أنتِ تحتاجين إلى المال. فكّري في الأمر.",
          },
          {
            en: "Maria looks inside the wallet again. There is a photo of an old woman. And a card with a name: Mr. Carter.",
            ar: "تنظر ماريا داخل المحفظة مرة أخرى. توجد صورة لامرأة عجوز. وبطاقة عليها اسم: السيد كارتر.",
          },
          {
            who: "Maria",
            en: "Somebody needs this wallet. I want to find him.",
            ar: "شخص ما يحتاج إلى هذه المحفظة. أريد أن أجده.",
          },
        ],
        question: {
          en: "What does Ben say?",
          ar: "ماذا يقول بن؟",
          options: [
            { en: "Keep the money", ar: "احتفظي بالمال" },
            { en: "Call the police", ar: "اتصلي بالشرطة" },
            { en: "Go home", ar: "اذهبي إلى البيت" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "Mr. Carter",
        titleAr: "السيد كارتر",
        lines: [
          {
            en: "On the card, there is a phone number. Maria calls it.",
            ar: "على البطاقة رقم هاتف. تتصل ماريا به.",
          },
          {
            en: "A man answers. His voice is sad.",
            ar: "يرد رجل. صوته حزين.",
          },
          {
            who: "Mr. Carter",
            en: "Hello? My wallet? Yes! It's mine!",
            ar: "ألو؟ محفظتي؟ نعم! إنها لي!",
          },
          {
            en: "They meet at the bus stop. Mr. Carter is old, and his hands shake.",
            ar: "يلتقيان عند موقف الحافلة. السيد كارتر كبير في السن، ويداه ترتجفان.",
          },
          {
            who: "Mr. Carter",
            en: "Thank you, young lady. The money is not important. But the photo is my wife. She is not here anymore.",
            ar: "شكراً لكِ يا آنسة. المال ليس مهماً. لكن الصورة هي زوجتي. لم تعد معنا.",
          },
          {
            en: "Maria feels something warm in her heart.",
            ar: "تشعر ماريا بشيء دافئ في قلبها.",
          },
        ],
        question: {
          en: "Why is the wallet important to Mr. Carter?",
          ar: "لماذا المحفظة مهمة للسيد كارتر؟",
          options: [
            { en: "It has a photo of his wife", ar: "فيها صورة زوجته" },
            { en: "It is new", ar: "إنها جديدة" },
            { en: "It has a lot of money", ar: "فيها مال كثير" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "A Gift",
        titleAr: "هدية",
        lines: [
          {
            who: "Mr. Carter",
            en: "Please, take fifty dollars. It is for you.",
            ar: "من فضلك، خذي خمسين دولاراً. إنها لكِ.",
          },
          {
            who: "Maria",
            en: "No, thank you. I am happy because the wallet is back with you.",
            ar: "لا، شكراً. أنا سعيدة لأن المحفظة عادت إليك.",
          },
          {
            en: "Mr. Carter smiles. He buys her a hot chocolate at the café next to the bus stop.",
            ar: "يبتسم السيد كارتر. يشتري لها شوكولاتة ساخنة في المقهى بجانب الموقف.",
          },
          {
            en: "That night, Maria sleeps very well.",
            ar: "في تلك الليلة، تنام ماريا نوماً هادئاً جداً.",
          },
          {
            en: "She does not have much money. But some things are more important than money.",
            ar: "ليس لديها مال كثير. لكن بعض الأشياء أهم من المال.",
          },
        ],
        question: {
          en: "What does Maria say to Mr. Carter's offer?",
          ar: "ماذا تقول ماريا لعرض السيد كارتر؟",
          options: [
            { en: "No, thank you", ar: "لا، شكراً" },
            { en: "Yes, I need it", ar: "نعم، أحتاجه" },
            { en: "Give me more", ar: "أعطني أكثر" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "Why does Maria want to find Mr. Carter?",
      ar: "لماذا تريد ماريا أن تجد السيد كارتر؟",
      options: [
        { en: "Because he needs his wallet", ar: "لأنه يحتاج إلى محفظته" },
        { en: "Because she wants a reward", ar: "لأنها تريد مكافأة" },
        { en: "Because her mother says so", ar: "لأن أمها تطلب ذلك" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "bench",
        sentence: "Maria is waiting for the bus. She sees a brown wallet on the ___.",
        hintAr: "المقعد (في الحديقة أو الشارع).",
      },
      {
        word: "student",
        sentence: "Maria is a ___. She does not have much money.",
        hintAr: "الطالب، الطالبة.",
      },
      { word: "nobody", sentence: "She looks around. ___ is there.", hintAr: "لا أحد." },
      {
        word: "important",
        sentence: "The money is not ___. But the photo is my wife.",
        hintAr: "مهم.",
      },
      {
        word: "heart",
        sentence: "Maria feels something warm in her ___.",
        hintAr: "القلب.",
      },
    ],
  },
];
