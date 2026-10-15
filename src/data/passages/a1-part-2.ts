import type { PassageSeed } from "@/data/passages/types";

/** Level A1 passages, second half — see a1-part-1.ts for the rules every passage here follows. */

export const A1_PASSAGES_PART_2: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 6
  {
    slug: "dad-learns-to-text",
    order: 6,
    level: "A1",
    tone: "funny",
    icon: "smartphone",
    title: "Dad Learns to Text",
    titleAr: "أبي يتعلّم كتابة الرسائل",
    summary: "Sara's dad gets a new phone. Nobody is ready.",
    summaryAr: "والد سارة يحصل على هاتف جديد. لا أحد مستعد.",
    cast: { Sara: "zara", Dad: "russ" },
    sections: [
      {
        title: "A New Phone",
        titleAr: "هاتف جديد",
        lines: [
          {
            en: "Sara's dad has a new phone. Today, he learns to text.",
            ar: "لدى والد سارة هاتف جديد. اليوم يتعلم كتابة الرسائل.",
          },
          {
            en: "Sara gets her first message.",
            ar: "تتلقى سارة أول رسالة.",
          },
          {
            who: "Dad",
            en: "HELLO SARA. THIS IS DAD.",
            ar: "مرحباً يا سارة. هذا أبوكِ.",
          },
          {
            who: "Sara",
            en: "Dad, I know it's you. Your name is on the screen.",
            ar: "أبي، أعرف أنه أنت. اسمك على الشاشة.",
          },
          {
            who: "Dad",
            en: "OK. I AM DAD. FROM DAD.",
            ar: "حسناً. أنا أبوكِ. من أبيكِ.",
          },
          {
            en: "Sara smiles. It is going to be a long day.",
            ar: "تبتسم سارة. سيكون هذا يوماً طويلاً.",
          },
        ],
        question: {
          en: "Who sends the first message?",
          ar: "من يرسل الرسالة الأولى؟",
          options: [
            { en: "Sara's dad", ar: "والد سارة" },
            { en: "Sara's mom", ar: "والدة سارة" },
            { en: "A friend", ar: "صديق" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Big Letters",
        titleAr: "حروف كبيرة",
        lines: [
          {
            who: "Sara",
            en: "Dad, why are you using big letters?",
            ar: "أبي، لماذا تستخدم حروفاً كبيرة؟",
          },
          {
            who: "Dad",
            en: "BECAUSE THEY ARE EASY TO SEE.",
            ar: "لأنها سهلة الرؤية.",
          },
          {
            who: "Sara",
            en: "It looks like you are shouting!",
            ar: "تبدو وكأنك تصرخ!",
          },
          {
            who: "Dad",
            en: "I AM NOT SHOUTING. I AM TEXTING.",
            ar: "أنا لا أصرخ. أنا أكتب رسالة.",
          },
          {
            en: "Sara tries not to laugh.",
            ar: "تحاول سارة ألا تضحك.",
          },
          {
            who: "Sara",
            en: "Dad, try small letters. Like this: hello, dad.",
            ar: "أبي، جرّب الحروف الصغيرة. هكذا: hello, dad.",
          },
        ],
        question: {
          en: "Why does Dad use big letters?",
          ar: "لماذا يستخدم أبي الحروف الكبيرة؟",
          options: [
            { en: "They are easy to see", ar: "لأنها سهلة الرؤية" },
            { en: "He is angry", ar: "لأنه غاضب" },
            { en: "His phone is broken", ar: "لأن هاتفه مكسور" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "The Wrong Face",
        titleAr: "الوجه الخطأ",
        lines: [
          {
            en: "On Sara's birthday, Dad sends a message.",
            ar: "في عيد ميلاد سارة، يرسل أبوها رسالة.",
          },
          {
            who: "Dad",
            en: "HAPPY BIRTHDAY SARA. I LOVE YOU. 😭",
            ar: "عيد ميلاد سعيد يا سارة. أحبك. 😭",
          },
          {
            who: "Sara",
            en: "Dad, why are you crying?",
            ar: "أبي، لماذا تبكي؟",
          },
          {
            who: "Dad",
            en: "I'm not crying. That is the laughing face!",
            ar: "أنا لا أبكي. هذا وجه الضحك!",
          },
          {
            who: "Sara",
            en: "No, Dad. That is the crying face. This is the laughing face: 😂",
            ar: "لا يا أبي. هذا وجه البكاء. وهذا وجه الضحك: 😂",
          },
          {
            who: "Dad",
            en: "OH NO. I SENT A SAD FACE TO MY HAPPY GIRL.",
            ar: "يا إلهي. أرسلت وجهاً حزيناً إلى ابنتي السعيدة.",
          },
        ],
        question: {
          en: "Which face does Dad send on Sara's birthday?",
          ar: "أي وجه يرسله أبي في عيد ميلاد سارة؟",
          options: [
            { en: "A crying face", ar: "وجه يبكي" },
            { en: "A laughing face", ar: "وجه يضحك" },
            { en: "A sleeping face", ar: "وجه نائم" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "Small Letters",
        titleAr: "حروف صغيرة",
        lines: [
          {
            who: "Dad",
            en: "Sara, I want to learn. Can you help me?",
            ar: "سارة، أريد أن أتعلم. هل تساعدينني؟",
          },
          {
            who: "Sara",
            en: "Of course, Dad. Come to my house on Sunday.",
            ar: "بالطبع يا أبي. تعال إلى بيتي يوم الأحد.",
          },
          {
            en: "On Sunday, Sara teaches him small letters and the right faces. Even the heart.",
            ar: "يوم الأحد، تعلّمه سارة الحروف الصغيرة والوجوه الصحيحة. وحتى القلب.",
          },
          {
            en: "That night, Sara gets a message.",
            ar: "في تلك الليلة، تتلقى سارة رسالة.",
          },
          {
            who: "Dad",
            en: "good night, sara. i love you ❤️",
            ar: "تصبحين على خير يا سارة. أحبك ❤️",
          },
          {
            en: "No big letters. The right face. Sara smiles. It is the best message of her life.",
            ar: "لا حروف كبيرة. والوجه صحيح. تبتسم سارة. إنها أجمل رسالة في حياتها.",
          },
        ],
        question: {
          en: "What is different about Dad's last message?",
          ar: "ما الذي اختلف في آخر رسالة من أبي؟",
          options: [
            { en: "It has small letters and a heart", ar: "فيها حروف صغيرة وقلب" },
            { en: "It has a crying face", ar: "فيها وجه يبكي" },
            { en: "It is very long", ar: "طويلة جداً" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    words: [
      { word: "message", sentence: "Sara gets her first ___.", hintAr: "الرسالة." },
      {
        word: "birthday",
        sentence: "On Sara's ___, Dad sends a message.",
        hintAr: "عيد الميلاد.",
      },
      {
        word: "learn",
        sentence: "Sara, I want to ___. Can you help me?",
        hintAr: "يتعلّم.",
      },
      { word: "face", sentence: "That is the laughing ___!", hintAr: "الوجه." },
      { word: "laugh", sentence: "Sara tries not to ___.", hintAr: "يضحك." },
    ],
  },

  // ───────────────────────────────────────────────────────── 7
  {
    slug: "thirty-and-afraid-of-water",
    order: 7,
    level: "A1",
    tone: "inspiring",
    icon: "waves",
    title: "Thirty and Afraid of Water",
    titleAr: "في الثلاثين وتخاف من الماء",
    summary: "Sara cannot swim, and her friends are going to the beach.",
    summaryAr: "سارة لا تجيد السباحة، وأصدقاؤها ذاهبون إلى الشاطئ.",
    cast: { Sara: "zara", Lisa: "ash" },
    sections: [
      {
        title: "A Big Fear",
        titleAr: "خوف كبير",
        lines: [
          {
            en: "Sara is thirty years old. She cannot swim.",
            ar: "عمر سارة ثلاثون سنة. لا تجيد السباحة.",
          },
          {
            en: "She is afraid of water. Even a small pool is scary.",
            ar: "تخاف من الماء. حتى المسبح الصغير مخيف.",
          },
          {
            en: "Her friends are planning a trip to the beach.",
            ar: "أصدقاؤها يخططون لرحلة إلى الشاطئ.",
          },
          {
            who: "Sara",
            en: "I want to go... but I cannot swim.",
            ar: "أريد أن أذهب... لكنني لا أجيد السباحة.",
          },
          {
            en: "She decides to join a swimming class for adults.",
            ar: "تقرر أن تسجل في دورة سباحة للكبار.",
          },
        ],
        question: {
          en: "What is Sara's problem?",
          ar: "ما مشكلة سارة؟",
          options: [
            { en: "She cannot swim", ar: "لا تجيد السباحة" },
            { en: "She has no friends", ar: "ليس لها أصدقاء" },
            { en: "She hates the beach", ar: "تكره الشاطئ" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "Only Your Feet",
        titleAr: "قدماكِ فقط",
        lines: [
          {
            en: "Her teacher is Coach Lisa. She is kind and calm.",
            ar: "مدربتها هي المدربة ليزا. إنها لطيفة وهادئة.",
          },
          {
            who: "Lisa",
            en: "Welcome, Sara. Today, we do only one thing. Put your feet in the water.",
            ar: "أهلاً يا سارة. اليوم نفعل شيئاً واحداً فقط. ضعي قدميكِ في الماء.",
          },
          {
            who: "Sara",
            en: "Only my feet?",
            ar: "قدماي فقط؟",
          },
          {
            who: "Lisa",
            en: "Yes. Small steps. Nobody is fast on day one.",
            ar: "نعم. خطوات صغيرة. لا أحد سريع في اليوم الأول.",
          },
          {
            en: "Sara sits on the edge. She puts her feet in the water. Her heart goes boom, boom, boom.",
            ar: "تجلس سارة على الحافة. تضع قدميها في الماء. قلبها يخفق: بوم، بوم، بوم.",
          },
          {
            who: "Lisa",
            en: "You did it. That is very brave.",
            ar: "لقد فعلتِها. هذا شجاع جداً.",
          },
        ],
        question: {
          en: "What does Sara do on the first day?",
          ar: "ماذا تفعل سارة في اليوم الأول؟",
          options: [
            { en: "She puts her feet in the water", ar: "تضع قدميها في الماء" },
            { en: "She swims ten meters", ar: "تسبح عشرة أمتار" },
            { en: "She jumps into the pool", ar: "تقفز في المسبح" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "The Float",
        titleAr: "الطفو",
        lines: [
          {
            en: "Week three. Sara is in the water now.",
            ar: "الأسبوع الثالث. سارة في الماء الآن.",
          },
          {
            who: "Lisa",
            en: "Lie back. I am here. I have you.",
            ar: "استلقي على ظهرك. أنا هنا. أنا أمسك بكِ.",
          },
          {
            who: "Sara",
            en: "Don't let go!",
            ar: "لا تتركيني!",
          },
          {
            who: "Lisa",
            en: "I am not letting go. Breathe. Relax.",
            ar: "لن أتركك. تنفسي. استرخي.",
          },
          {
            en: "Slowly, Sara starts to float.",
            ar: "ببطء، تبدأ سارة بالطفو.",
          },
          {
            who: "Sara",
            en: "I am floating! Lisa, look!",
            ar: "أنا أطفو! ليزا، انظري!",
          },
          {
            who: "Lisa",
            en: "I know. And I let go ten seconds ago.",
            ar: "أعرف. وقد تركتكِ منذ عشر ثوانٍ.",
          },
        ],
        question: {
          en: "Is Lisa holding Sara at the end?",
          ar: "هل ليزا تمسك بسارة في النهاية؟",
          options: [
            { en: "No, Sara is floating alone", ar: "لا، سارة تطفو وحدها" },
            { en: "Yes, with both hands", ar: "نعم، بكلتا يديها" },
            { en: "Yes, with one hand", ar: "نعم، بيد واحدة" },
          ],
          answer: 0,
          evidence: 6,
        },
      },
      {
        title: "The Beach",
        titleAr: "الشاطئ",
        lines: [
          {
            en: "Three months later, Sara is at the beach with her friends.",
            ar: "بعد ثلاثة أشهر، تكون سارة على الشاطئ مع أصدقائها.",
          },
          {
            en: "The sea is big and blue.",
            ar: "البحر كبير وأزرق.",
          },
          {
            who: "Sara",
            en: "I am a little afraid. But I can do this.",
            ar: "أنا خائفة قليلاً. لكنني أستطيع فعل هذا.",
          },
          {
            en: "She walks into the water. She swims ten meters.",
            ar: "تدخل الماء. وتسبح عشرة أمتار.",
          },
          {
            en: "Her friends shout and clap.",
            ar: "أصدقاؤها يصيحون ويصفقون.",
          },
          {
            who: "Sara",
            en: "I am thirty years old, and I am swimming!",
            ar: "عمري ثلاثون سنة، وأنا أسبح!",
          },
          {
            en: "It is never too late to start.",
            ar: "لا يفوت الأوان أبداً على البدء.",
          },
        ],
        question: {
          en: "How far does Sara swim at the beach?",
          ar: "كم تسبح سارة على الشاطئ؟",
          options: [
            { en: "Ten meters", ar: "عشرة أمتار" },
            { en: "One hundred meters", ar: "مئة متر" },
            { en: "She does not swim", ar: "لا تسبح" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
    ],
    words: [
      {
        word: "scary",
        sentence: "She is afraid of water. Even a small pool is ___.",
        hintAr: "مخيف.",
      },
      { word: "edge", sentence: "Sara sits on the ___.", hintAr: "الحافة." },
      { word: "float", sentence: "Slowly, Sara starts to ___.", hintAr: "يطفو." },
      { word: "brave", sentence: "You did it. That is very ___.", hintAr: "شجاع." },
      { word: "swim", sentence: "I want to go... but I cannot ___.", hintAr: "يسبح." },
    ],
  },

  // ───────────────────────────────────────────────────────── 8
  {
    slug: "you-won-a-million-dollars",
    order: 8,
    level: "A1",
    tone: "serious",
    icon: "mail",
    title: "You Won a Million Dollars!",
    titleAr: "لقد ربحت مليون دولار!",
    summary: "Anna gets the best email of her life. Her brother says: wait.",
    summaryAr: "تصل آنا أجمل رسالة بريد في حياتها. أخوها يقول: انتظري.",
    cast: { Anna: "zara", Dan: "russ", Mom: "autumn", Email: "narrator" },
    sections: [
      {
        title: "Great News!",
        titleAr: "خبر رائع!",
        lines: [
          {
            en: "Anna reads her email. She cannot believe it.",
            ar: "تقرأ آنا بريدها الإلكتروني. لا تصدق ما ترى.",
          },
          {
            who: "Email",
            en: "CONGRATULATIONS! YOU WON ONE MILLION DOLLARS!",
            ar: "تهانينا! لقد ربحت مليون دولار!",
          },
          {
            who: "Email",
            en: "CLICK HERE. SEND YOUR NAME AND YOUR PASSWORD.",
            ar: "انقر هنا. أرسل اسمك وكلمة المرور الخاصة بك.",
          },
          {
            who: "Anna",
            en: "A million dollars! I can buy a big house!",
            ar: "مليون دولار! أستطيع شراء بيت كبير!",
          },
          {
            en: "She runs to her brother, Dan.",
            ar: "تركض إلى أخيها دان.",
          },
        ],
        question: {
          en: "What does the email ask Anna to send?",
          ar: "ماذا يطلب البريد من آنا أن ترسل؟",
          options: [
            { en: "Her name and password", ar: "اسمها وكلمة المرور" },
            { en: "Her photo", ar: "صورتها" },
            { en: "Some money", ar: "بعض المال" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Wait a Minute",
        titleAr: "لحظة من فضلك",
        lines: [
          {
            who: "Anna",
            en: "Dan! Look! I'm a millionaire!",
            ar: "دان! انظر! أنا مليونيرة!",
          },
          {
            en: "Dan reads the email. He does not smile.",
            ar: "يقرأ دان البريد. لا يبتسم.",
          },
          {
            who: "Dan",
            en: "Anna, this is not real.",
            ar: "آنا، هذا غير حقيقي.",
          },
          {
            who: "Anna",
            en: "How do you know?",
            ar: "كيف تعرف؟",
          },
          {
            who: "Dan",
            en: "Did you buy a ticket? Did you play a game?",
            ar: "هل اشتريتِ تذكرة؟ هل شاركتِ في لعبة؟",
          },
          {
            who: "Anna",
            en: "No...",
            ar: "لا...",
          },
          {
            who: "Dan",
            en: "Then nobody gives you a million dollars. It is a trick.",
            ar: "إذن لا أحد يعطيكِ مليون دولار. إنها خدعة.",
          },
        ],
        question: {
          en: "What does Dan think about the email?",
          ar: "ماذا يظن دان عن البريد؟",
          options: [
            { en: "It is a trick", ar: "إنه خدعة" },
            { en: "It is real", ar: "إنه حقيقي" },
            { en: "It is from Mom", ar: "إنه من أمي" },
          ],
          answer: 0,
          evidence: 6,
        },
      },
      {
        title: "Three Rules",
        titleAr: "ثلاث قواعد",
        lines: [
          {
            who: "Dan",
            en: "Remember three rules. Rule one: if it is too good, it is not real.",
            ar: "تذكّري ثلاث قواعد. القاعدة الأولى: إذا كان الأمر جيداً أكثر من اللازم، فهو غير حقيقي.",
          },
          {
            who: "Dan",
            en: "Rule two: never give your password to anybody.",
            ar: "القاعدة الثانية: لا تعطي كلمة المرور لأي شخص أبداً.",
          },
          {
            who: "Dan",
            en: "Rule three: do not click strange links. Ask someone you trust first.",
            ar: "القاعدة الثالثة: لا تضغطي على روابط غريبة. اسألي شخصاً تثقين به أولاً.",
          },
          {
            who: "Anna",
            en: "Okay. But the email looks so real!",
            ar: "حسناً. لكن البريد يبدو حقيقياً جداً!",
          },
          {
            who: "Dan",
            en: "Bad people make it look real. That is their job.",
            ar: "الأشرار يجعلونه يبدو حقيقياً. هذا عملهم.",
          },
          {
            en: "Anna deletes the email.",
            ar: "تحذف آنا البريد.",
          },
        ],
        question: {
          en: "What is rule two?",
          ar: "ما القاعدة الثانية؟",
          options: [
            { en: "Never give your password", ar: "لا تعطِ كلمة المرور أبداً" },
            { en: "Always click links", ar: "اضغط الروابط دائماً" },
            { en: "Call the bank", ar: "اتصل بالبنك" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "Mom's Message",
        titleAr: "رسالة أمي",
        lines: [
          {
            en: "That evening, Mom comes home. She looks worried.",
            ar: "في المساء، تعود الأم إلى البيت. تبدو قلقة.",
          },
          {
            who: "Mom",
            en: "Anna, I have a strange message too. It says I won a car.",
            ar: "آنا، وصلتني رسالة غريبة أنا أيضاً. تقول إنني ربحت سيارة.",
          },
          {
            who: "Anna",
            en: "Mom! Did you click on it?",
            ar: "أمي! هل ضغطتِ عليها؟",
          },
          {
            who: "Mom",
            en: "Yes, I clicked. But I did not write anything.",
            ar: "نعم، ضغطت. لكنني لم أكتب شيئاً.",
          },
          {
            who: "Dan",
            en: "Phew! That is okay. Do not click again.",
            ar: "أوف! لا بأس. لا تضغطي مرة أخرى.",
          },
          {
            en: "Now the whole family knows the three rules.",
            ar: "الآن العائلة كلها تعرف القواعد الثلاث.",
          },
        ],
        question: {
          en: "What does Mom do with the message?",
          ar: "ماذا تفعل أمي بالرسالة؟",
          options: [
            { en: "She clicks on it, but writes nothing", ar: "تضغط عليها لكنها لا تكتب شيئاً" },
            { en: "She sends her password", ar: "ترسل كلمة المرور" },
            { en: "She never sees it", ar: "لا تراها أبداً" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
    ],
    words: [
      {
        word: "believe",
        sentence: "Anna reads her email. She cannot ___ it.",
        hintAr: "يصدّق.",
      },
      { word: "real", sentence: "Anna, this is not ___.", hintAr: "حقيقي." },
      {
        word: "trick",
        sentence: "Then nobody gives you a million dollars. It is a ___.",
        hintAr: "خدعة.",
      },
      {
        word: "strange",
        sentence: "Rule three: do not click ___ links. Ask someone you trust first.",
        hintAr: "غريب.",
      },
      { word: "click", sentence: "Mom! Did you ___ on it?", hintAr: "ينقر، يضغط." },
    ],
  },

  // ───────────────────────────────────────────────────────── 9
  {
    slug: "lost-in-the-big-city",
    order: 9,
    level: "A1",
    tone: "serious",
    icon: "map",
    title: "Lost in the Big City",
    titleAr: "تائه في المدينة الكبيرة",
    summary: "Ben has a big interview and a dead phone. Can anybody help?",
    summaryAr: "لدى بن مقابلة مهمة وهاتف بلا بطارية. هل من مساعد؟",
    cast: { Ben: "russ", Nina: "zara" },
    sections: [
      {
        title: "No Battery",
        titleAr: "بلا بطارية",
        lines: [
          {
            en: "Ben is in New York for the first time. Today, he has an important interview.",
            ar: "بن في نيويورك للمرة الأولى. اليوم لديه مقابلة عمل مهمة.",
          },
          {
            en: "He wants to use the map on his phone. But the battery is dead.",
            ar: "يريد استخدام الخريطة على هاتفه. لكن البطارية فارغة.",
          },
          {
            who: "Ben",
            en: "Oh no! My phone is dead. I don't know the way!",
            ar: "يا إلهي! هاتفي لا يعمل. لا أعرف الطريق!",
          },
          {
            en: "It is nine o'clock. The interview is at ten.",
            ar: "الساعة التاسعة. المقابلة في العاشرة.",
          },
          {
            en: "Ben looks at the big streets and the tall buildings. He is lost.",
            ar: "ينظر بن إلى الشوارع الكبيرة والمباني العالية. إنه تائه.",
          },
        ],
        question: {
          en: "What is Ben's problem?",
          ar: "ما مشكلة بن؟",
          options: [
            { en: "His phone is dead and he is lost", ar: "هاتفه بلا بطارية وهو تائه" },
            { en: "He is late for the bus", ar: "تأخر عن الحافلة" },
            { en: "He has no money", ar: "ليس معه مال" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Nobody Stops",
        titleAr: "لا أحد يتوقف",
        lines: [
          {
            who: "Ben",
            en: "Excuse me, can you help me?",
            ar: "عفواً، هل تستطيع مساعدتي؟",
          },
          {
            en: "A man walks past. He does not stop.",
            ar: "يمرّ رجل. لا يتوقف.",
          },
          {
            who: "Ben",
            en: "Excuse me, please?",
            ar: "عفواً، من فضلك؟",
          },
          {
            en: "A woman is looking at her phone. She does not hear him.",
            ar: "امرأة تنظر إلى هاتفها. لا تسمعه.",
          },
          {
            en: "Everybody is busy. Ben feels very small in the big city.",
            ar: "الجميع مشغول. يشعر بن بأنه صغير جداً في المدينة الكبيرة.",
          },
        ],
        question: {
          en: "What do people do when Ben asks for help?",
          ar: "ماذا يفعل الناس عندما يطلب بن المساعدة؟",
          options: [
            { en: "They do not stop", ar: "لا يتوقفون" },
            { en: "They give him a map", ar: "يعطونه خريطة" },
            { en: "They laugh at him", ar: "يضحكون عليه" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "A Kind Stranger",
        titleAr: "غريبة لطيفة",
        lines: [
          {
            who: "Nina",
            en: "Hi! You look lost. Can I help?",
            ar: "مرحباً! تبدو تائهاً. هل أستطيع المساعدة؟",
          },
          {
            who: "Ben",
            en: "Yes, please! I need Park Street, number twenty.",
            ar: "نعم، من فضلك! أحتاج إلى شارع بارك، رقم عشرين.",
          },
          {
            who: "Nina",
            en: "No problem. Go straight for two blocks. Then turn left at the bank.",
            ar: "لا مشكلة. امشِ مستقيماً مسافة شارعين. ثم انعطف يساراً عند البنك.",
          },
          {
            who: "Nina",
            en: "The building is on your right, next to a café. It is ten minutes from here.",
            ar: "المبنى على يمينك، بجانب مقهى. يبعد عشر دقائق من هنا.",
          },
          {
            who: "Ben",
            en: "Thank you so much! You are very kind.",
            ar: "شكراً جزيلاً! أنتِ لطيفة جداً.",
          },
          {
            who: "Nina",
            en: "Good luck!",
            ar: "بالتوفيق!",
          },
        ],
        question: {
          en: "Where is the building?",
          ar: "أين المبنى؟",
          options: [
            { en: "Next to a café", ar: "بجانب مقهى" },
            { en: "Next to a bank", ar: "بجانب بنك" },
            { en: "Next to a park", ar: "بجانب حديقة" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "The Interview",
        titleAr: "المقابلة",
        lines: [
          {
            en: "Ben walks fast. He finds the café and the building.",
            ar: "يمشي بن بسرعة. يجد المقهى والمبنى.",
          },
          {
            en: "It is five to ten. He is on time!",
            ar: "الساعة العاشرة إلا خمس دقائق. وصل في الوقت!",
          },
          {
            en: "In the office, a woman opens the door. It is Nina!",
            ar: "في المكتب، تفتح امرأة الباب. إنها نينا!",
          },
          {
            who: "Nina",
            en: "Welcome, Ben. I am the manager here.",
            ar: "أهلاً يا بن. أنا المديرة هنا.",
          },
          {
            who: "Ben",
            en: "You?!",
            ar: "أنتِ؟!",
          },
          {
            who: "Nina",
            en: "Yes. Be kind to everybody. You never know who they are.",
            ar: "نعم. كن لطيفاً مع الجميع. لا تعرف أبداً من هم.",
          },
          {
            en: "Ben smiles. Today is going to be a good day.",
            ar: "يبتسم بن. سيكون اليوم يوماً جيداً.",
          },
        ],
        question: {
          en: "Who is Nina?",
          ar: "من هي نينا؟",
          options: [
            { en: "The manager of the office", ar: "مديرة المكتب" },
            { en: "Ben's sister", ar: "أخت بن" },
            { en: "A teacher", ar: "معلمة" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
    ],
    words: [
      { word: "lost", sentence: "Hi! You look ___. Can I help?", hintAr: "تائه، ضائع." },
      {
        word: "kind",
        sentence: "Thank you so much! You are very ___.",
        hintAr: "لطيف.",
      },
      {
        word: "straight",
        sentence: "No problem. Go ___ for two blocks.",
        hintAr: "مستقيماً.",
      },
      {
        word: "battery",
        sentence: "He wants to use the map on his phone. But the ___ is dead.",
        hintAr: "البطارية.",
      },
      {
        word: "busy",
        sentence: "Everybody is ___. Ben feels very small in the big city.",
        hintAr: "مشغول.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 10
  {
    slug: "the-gym-on-january-first",
    order: 10,
    level: "A1",
    tone: "inspiring",
    icon: "dumbbell",
    title: "The Gym on January First",
    titleAr: "النادي الرياضي في الأول من يناير",
    summary: "Everybody in the gym looks strong. Everybody except Mike.",
    summaryAr: "كل من في النادي يبدو قوياً. ما عدا مايك.",
    cast: { Mike: "russ", Kate: "zara" },
    sections: [
      {
        title: "New Year, New Mike",
        titleAr: "عام جديد، مايك جديد",
        lines: [
          {
            en: "It is January first. Mike has a big plan this year: he wants to be strong.",
            ar: "اليوم الأول من يناير. لدى مايك خطة كبيرة هذا العام: يريد أن يصبح قوياً.",
          },
          {
            en: "He buys a card for the gym.",
            ar: "يشتري بطاقة اشتراك في النادي.",
          },
          {
            who: "Mike",
            en: "This year, I am going to be strong!",
            ar: "هذا العام، سأصبح قوياً!",
          },
          {
            en: "He walks into the gym. It is full of people.",
            ar: "يدخل النادي. إنه مليء بالناس.",
          },
          {
            en: "Everybody looks strong. Everybody knows what to do. Mike knows nothing.",
            ar: "الجميع يبدو قوياً. الجميع يعرف ماذا يفعل. ومايك لا يعرف شيئاً.",
          },
        ],
        question: {
          en: "What does Mike want this year?",
          ar: "ماذا يريد مايك هذا العام؟",
          options: [
            { en: "To be strong", ar: "أن يصبح قوياً" },
            { en: "To lose his phone", ar: "أن يضيع هاتفه" },
            { en: "To buy a car", ar: "أن يشتري سيارة" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "The Wrong Way",
        titleAr: "الاتجاه الخطأ",
        lines: [
          {
            en: "Mike finds a big machine and sits down.",
            ar: "يجد مايك آلة كبيرة ويجلس عليها.",
          },
          {
            en: "He pulls and pulls, but nothing happens.",
            ar: "يسحب ويسحب، لكن لا شيء يحدث.",
          },
          {
            en: "A woman is watching him. She is trying not to laugh.",
            ar: "امرأة تراقبه. تحاول ألا تضحك.",
          },
          {
            who: "Kate",
            en: "Hi. I think you are sitting the wrong way.",
            ar: "مرحباً. أظن أنك تجلس بالاتجاه الخطأ.",
          },
          {
            who: "Mike",
            en: "Oh! Is this not a chair?",
            ar: "آه! أليس هذا كرسياً؟",
          },
          {
            who: "Kate",
            en: "No. It is a machine for your back. Turn around.",
            ar: "لا. إنها آلة لظهرك. استدر.",
          },
          {
            en: "Mike turns around. His face is red.",
            ar: "يستدير مايك. وجهه أحمر.",
          },
        ],
        question: {
          en: "What does Kate say?",
          ar: "ماذا تقول كيت؟",
          options: [
            { en: "He is sitting the wrong way", ar: "إنه يجلس بالاتجاه الخطأ" },
            { en: "He is very strong", ar: "إنه قوي جداً" },
            { en: "The gym is closed", ar: "النادي مغلق" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Everybody Is New",
        titleAr: "الجميع جديد",
        lines: [
          {
            who: "Mike",
            en: "I am sorry. This is my first time in a gym.",
            ar: "أنا آسف. هذه أول مرة لي في نادٍ رياضي.",
          },
          {
            who: "Kate",
            en: "Don't worry. It is my first time too.",
            ar: "لا تقلق. إنها أول مرة لي أيضاً.",
          },
          {
            who: "Mike",
            en: "Really? You look so strong.",
            ar: "حقاً؟ تبدين قوية جداً.",
          },
          {
            who: "Kate",
            en: "I am not. Look around!",
            ar: "لست كذلك. انظر حولك!",
          },
          {
            en: "Mike looks around. A man is reading the instructions on the wall. A woman cannot lift a small weight.",
            ar: "ينظر مايك حوله. رجل يقرأ التعليمات على الجدار. وامرأة لا تستطيع رفع ثقل صغير.",
          },
          {
            who: "Kate",
            en: "It is January first. Everybody here is a beginner today!",
            ar: "إنه الأول من يناير. الجميع هنا مبتدئ اليوم!",
          },
          {
            who: "Mike",
            en: "That is... good news!",
            ar: "هذا... خبر جيد!",
          },
        ],
        question: {
          en: "Why is the gym full of beginners?",
          ar: "لماذا النادي مليء بالمبتدئين؟",
          options: [
            { en: "It is January first", ar: "لأنه الأول من يناير" },
            { en: "It is a school", ar: "لأنه مدرسة" },
            { en: "It is free for everybody", ar: "لأنه مجاني للجميع" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "Day Thirty-One",
        titleAr: "اليوم الحادي والثلاثون",
        lines: [
          {
            en: "The next day, Mike cannot walk. His legs hurt.",
            ar: "في اليوم التالي، لا يستطيع مايك المشي. ساقاه تؤلمانه.",
          },
          {
            en: "But he goes back to the gym the day after. And the day after that.",
            ar: "لكنه يعود إلى النادي في اليوم الذي بعده. ثم في اليوم الذي بعده.",
          },
          {
            en: "On January thirty-first, the gym is half empty. Many new people stop coming.",
            ar: "في الحادي والثلاثين من يناير، يكون النادي شبه فارغ. كثير من الجدد توقفوا عن المجيء.",
          },
          {
            en: "But Mike is there. And Kate is there too.",
            ar: "لكن مايك موجود. وكيت موجودة أيضاً.",
          },
          {
            who: "Kate",
            en: "Hi, Mike. Ready?",
            ar: "مرحباً يا مايك. جاهز؟",
          },
          {
            who: "Mike",
            en: "Always.",
            ar: "دائماً.",
          },
          {
            en: "Starting is easy. Coming back every day is the hard part.",
            ar: "البدء سهل. العودة كل يوم هي الجزء الصعب.",
          },
        ],
        question: {
          en: "What happens on January thirty-first?",
          ar: "ماذا يحدث في الحادي والثلاثين من يناير؟",
          options: [
            {
              en: "The gym is half empty, but Mike is there",
              ar: "النادي شبه فارغ، لكن مايك موجود",
            },
            { en: "Mike stops going", ar: "يتوقف مايك عن الذهاب" },
            { en: "The gym is closed", ar: "النادي مغلق" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
    ],
    words: [
      {
        word: "strong",
        sentence: "Everybody looks ___. Everybody knows what to do.",
        hintAr: "قوي.",
      },
      {
        word: "machine",
        sentence: "Mike finds a big ___ and sits down.",
        hintAr: "الآلة، الجهاز.",
      },
      {
        word: "empty",
        sentence: "On January thirty-first, the gym is half ___.",
        hintAr: "فارغ.",
      },
      { word: "worry", sentence: "Don't ___. It is my first time too.", hintAr: "يقلق." },
      {
        word: "beginner",
        sentence: "It is January first. Everybody here is a ___ today!",
        hintAr: "المبتدئ.",
      },
    ],
  },
];
