import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A2 passages, second half — the quieter and more serious scenes of the
 * level, and the ones about not giving up. Same rules as the first half: real
 * people, a turn in the middle, a payoff at the end, the past tense carrying
 * the story, and nothing that reads like a lesson.
 */

export const A2_PASSAGES_PART_2: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 6
  {
    slug: "the-dog-on-the-poster",
    order: 6,
    level: "A2",
    tone: "serious",
    icon: "map",
    title: "The Dog on the Poster",
    titleAr: "الكلب على الملصق",
    summary: "Ben put up a hundred posters. Only one person called.",
    summaryAr: "علّق بن مئة ملصق. ولم يتصل به إلا شخص واحد.",
    cast: { Ben: "russ", Hannah: "ash" },
    sections: [
      {
        title: "Gone",
        titleAr: "اختفى",
        lines: [
          {
            en: "Ben's dog, Rusty, was brown, big, and always happy. They lived together for six years.",
            ar: "كان كلب بن، رَستي، بنّياً وكبيراً ودائم السعادة. عاشا معاً ست سنوات.",
          },
          {
            en: "One evening, Ben forgot to close the gate. When he came back from the kitchen, Rusty was gone.",
            ar: "في إحدى الأمسيات، نسي بن أن يغلق البوابة. وعندما عاد من المطبخ، كان رَستي قد اختفى.",
          },
          {
            who: "Ben",
            en: "Rusty! Rusty, come here!",
            ar: "رَستي! رَستي، تعال هنا!",
          },
          {
            en: "Ben walked through the streets in the rain until midnight. He called the name again and again.",
            ar: "مشى بن في الشوارع تحت المطر حتى منتصف الليل. ظل ينادي الاسم مراراً وتكراراً.",
          },
          {
            en: "But the only answer was the sound of the rain.",
            ar: "لكن الجواب الوحيد كان صوت المطر.",
          },
        ],
        question: {
          en: "How did Rusty get out?",
          ar: "كيف خرج رَستي؟",
          options: [
            { en: "Somebody took him", ar: "أخذه أحدهم" },
            { en: "He jumped over the wall", ar: "قفز من فوق الجدار" },
            { en: "Ben forgot to close the gate", ar: "نسي بن أن يغلق البوابة" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "One Hundred Posters",
        titleAr: "مئة ملصق",
        lines: [
          {
            en: "The next morning, Ben did not go to work. He took a photo of Rusty and made one hundred posters.",
            ar: "في الصباح التالي، لم يذهب بن إلى عمله. أخذ صورة لرَستي وطبع مئة ملصق.",
          },
          {
            en: 'The posters said, "Lost dog. Brown. Very friendly. Please call Ben."',
            ar: "كُتب على الملصقات: «كلب ضائع. بنّي. ودود جداً. الرجاء الاتصال ببن.»",
          },
          {
            en: "He put them on trees, lamp posts, and shop windows. Then he waited next to the phone.",
            ar: "علّقها على الأشجار وأعمدة الإنارة وواجهات المحال. ثم انتظر بجانب الهاتف.",
          },
          {
            en: "One day passed. Two days. Five days. The phone did not ring.",
            ar: "مرّ يوم. يومان. خمسة أيام. ولم يرنّ الهاتف.",
          },
          {
            who: "Ben",
            en: "Maybe he is not coming back.",
            ar: "ربما لن يعود.",
          },
          {
            en: 'His sister called every evening and said, "Don\'t give up, Ben."',
            ar: "كانت أخته تتصل كل مساء وتقول: «لا تستسلم يا بن.»",
          },
        ],
        question: {
          en: "What did Ben do the next morning?",
          ar: "ماذا فعل بن في الصباح التالي؟",
          options: [
            { en: "He went to work", ar: "ذهب إلى عمله" },
            { en: "He made one hundred posters", ar: "طبع مئة ملصق" },
            { en: "He bought a new dog", ar: "اشترى كلباً جديداً" },
          ],
          answer: 1,
          evidence: 0,
        },
      },
      {
        title: "A Small Voice",
        titleAr: "صوت صغير",
        lines: [
          {
            en: "On the eighth night, at ten o'clock, the phone finally rang.",
            ar: "في الليلة الثامنة، عند العاشرة، رنّ الهاتف أخيراً.",
          },
          {
            who: "Hannah",
            en: "Hello? Are you the man with the lost dog?",
            ar: "ألو؟ هل أنت الرجل الذي فقد كلبه؟",
          },
          {
            en: "It was a small voice. A child.",
            ar: "كان صوتاً صغيراً. صوت طفلة.",
          },
          {
            who: "Ben",
            en: "Yes! Yes, I am! Have you seen him?",
            ar: "نعم! نعم، أنا هو! هل رأيتِه؟",
          },
          {
            who: "Hannah",
            en: "I think I have him. He is sleeping in my garage. I'm Hannah. I'm nine.",
            ar: "أظن أنه عندي. إنه ينام في مرآبنا. أنا هانا. عمري تسع سنوات.",
          },
          {
            en: "Ben did not say goodbye. He took his coat and ran to the car.",
            ar: "لم يودّعها بن. أخذ معطفه وركض إلى السيارة.",
          },
        ],
        question: {
          en: "Where was Rusty?",
          ar: "أين كان رَستي؟",
          options: [
            { en: "In the park", ar: "في الحديقة" },
            { en: "At the animal doctor", ar: "عند طبيب الحيوانات" },
            { en: "In Hannah's garage", ar: "في مرآب هانا" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "Two Friends",
        titleAr: "صديقان",
        lines: [
          {
            en: "The house was only ten minutes away. A little girl was waiting at the gate with a flashlight.",
            ar: "كان البيت على بعد عشر دقائق فقط. كانت طفلة صغيرة تنتظر عند البوابة ومعها مصباح يدوي.",
          },
          {
            en: "When Rusty saw Ben, he ran across the garage like a rocket. Ben fell on his knees and hugged him.",
            ar: "عندما رأى رَستي بن، ركض عبر المرآب كالصاروخ. سقط بن على ركبتيه وعانقه.",
          },
          {
            who: "Hannah",
            en: "I found him behind my school on Thursday. I saw your poster only today. I'm sorry.",
            ar: "وجدته خلف مدرستي يوم الخميس. ولم أرَ ملصقك إلا اليوم. أنا آسفة.",
          },
          {
            who: "Ben",
            en: "Don't be sorry. You saved my friend.",
            ar: "لا تعتذري. لقد أنقذتِ صديقي.",
          },
          {
            who: "Hannah",
            en: "I don't have a dog. And we just moved here, so I don't have friends yet. Rusty was nice to me.",
            ar: "ليس عندي كلب. وقد انتقلنا إلى هنا للتو، فليس لي أصدقاء بعد. كان رَستي لطيفاً معي.",
          },
          {
            en: "Ben looked at Hannah, and then at Rusty. He smiled.",
            ar: "نظر بن إلى هانا، ثم إلى رَستي. وابتسم.",
          },
          {
            who: "Ben",
            en: "Come to the park every Saturday. Rusty needs two friends.",
            ar: "تعالي إلى الحديقة كل يوم سبت. رَستي يحتاج إلى صديقين.",
          },
        ],
        question: {
          en: "Why did Hannah call so late?",
          ar: "لماذا اتصلت هانا متأخرة؟",
          options: [
            { en: "She saw the poster only that day", ar: "لم ترَ الملصق إلا في ذلك اليوم" },
            { en: "She was afraid of Ben", ar: "كانت تخاف من بن" },
            { en: "She lost the phone number", ar: "أضاعت رقم الهاتف" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
    ],
    closing: {
      en: "What did Ben do the night Rusty was lost?",
      ar: "ماذا فعل بن في الليلة التي ضاع فيها رَستي؟",
      options: [
        { en: "He called the police", ar: "اتصل بالشرطة" },
        {
          en: "He looked for Rusty in the rain until midnight",
          ar: "بحث عن رَستي تحت المطر حتى منتصف الليل",
        },
        { en: "He went to bed early", ar: "نام مبكراً" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "gate",
        sentence: "One evening, Ben forgot to close the ___.",
        hintAr: "البوابة.",
      },
      {
        word: "midnight",
        sentence: "Ben walked through the streets in the rain until ___.",
        hintAr: "منتصف الليل.",
      },
      {
        word: "friendly",
        sentence: "Lost dog. Brown. Very ___. Please call Ben.",
        hintAr: "ودود، لطيف.",
      },
      {
        word: "knees",
        sentence: "Ben fell on his ___ and hugged him.",
        hintAr: "الركبتان.",
      },
      {
        word: "poster",
        sentence: "I saw your ___ only today.",
        hintAr: "الملصق.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 7
  {
    slug: "the-last-bus",
    order: 7,
    level: "A2",
    tone: "serious",
    icon: "map",
    title: "The Last Bus",
    titleAr: "الحافلة الأخيرة",
    summary: "Frank thought he was driving an empty bus. He was not.",
    summaryAr: "ظنّ فرانك أنه يقود حافلة فارغة. لكنها لم تكن فارغة.",
    cast: { Frank: "calm-male", Leo: "ash", "Mr. Evans": "russ" },
    sections: [
      {
        title: "The Last Stop",
        titleAr: "المحطة الأخيرة",
        lines: [
          {
            en: "Frank drove the number 9 bus for twenty years. His favorite trip was the last one of the night.",
            ar: "قاد فرانك الحافلة رقم 9 لعشرين عاماً. وكانت رحلته المفضلة هي الأخيرة في الليل.",
          },
          {
            en: "At 11:45 p.m., there was only one passenger: a boy with a big backpack, asleep next to the window.",
            ar: "في الساعة 11:45 مساءً، لم يكن هناك سوى راكب واحد: ولد معه حقيبة ظهر كبيرة، نائم بجانب النافذة.",
          },
          {
            en: "The bus arrived at the last stop. Frank turned off the engine.",
            ar: "وصلت الحافلة إلى المحطة الأخيرة. أطفأ فرانك المحرك.",
          },
          {
            who: "Frank",
            en: "Hey, kid. This is the end of the line. Wake up.",
            ar: "يا فتى. هذه نهاية الخط. استيقظ.",
          },
          {
            en: "The boy opened his eyes and looked around. He did not know this place.",
            ar: "فتح الولد عينيه ونظر حوله. لم يكن يعرف هذا المكان.",
          },
        ],
        question: {
          en: "Who was on the bus at the end of the night?",
          ar: "من كان على الحافلة في نهاية الليل؟",
          options: [
            { en: "A woman with a dog", ar: "امرأة معها كلب" },
            { en: "A boy with a backpack", ar: "ولد معه حقيبة ظهر" },
            { en: "Nobody at all", ar: "لا أحد على الإطلاق" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
      {
        title: "Where Is Home?",
        titleAr: "أين البيت؟",
        lines: [
          {
            who: "Frank",
            en: "What's your name? Where do you live?",
            ar: "ما اسمك؟ وأين تسكن؟",
          },
          {
            who: "Leo",
            en: "I'm Leo. I'm twelve. I... I don't want to go home.",
            ar: "أنا ليو. عمري اثنتا عشرة سنة. أنا... لا أريد العودة إلى البيت.",
          },
          {
            en: "Frank looked at the boy's red eyes. He did not ask more questions. He opened his thermos and poured two cups of hot chocolate.",
            ar: "نظر فرانك إلى عيني الولد الحمراوين. لم يسأل المزيد. فتح الترمس وسكب كوبين من الشوكولاتة الساخنة.",
          },
          {
            en: "They sat in the empty bus, drinking in silence, for five minutes.",
            ar: "جلسا في الحافلة الفارغة يشربان بصمت لخمس دقائق.",
          },
          {
            who: "Leo",
            en: "My dad shouted at me. My grades were bad. I said some terrible things, and I ran away.",
            ar: "صرخ أبي في وجهي. كانت علاماتي سيئة. قلت أشياء فظيعة وهربت.",
          },
        ],
        question: {
          en: "Why did Leo run away?",
          ar: "لماذا هرب ليو؟",
          options: [
            {
              en: "He had a fight with his father about his grades",
              ar: "تشاجر مع أبيه بسبب علاماته",
            },
            { en: "He wanted to see the city", ar: "أراد أن يرى المدينة" },
            { en: "He lost his school bag", ar: "أضاع حقيبته المدرسية" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "A Long Talk",
        titleAr: "حديث طويل",
        lines: [
          {
            who: "Frank",
            en: "I have a son, too. His name is Michael. We had a big fight five years ago, and we never spoke again.",
            ar: "لدي ابن أيضاً. اسمه مايكل. تشاجرنا شجاراً كبيراً قبل خمس سنوات، ولم نتحدث بعدها أبداً.",
          },
          {
            who: "Leo",
            en: "Why not?",
            ar: "لماذا؟",
          },
          {
            who: "Frank",
            en: "Because we are both too proud to say sorry.",
            ar: "لأن كلينا أكثر كبرياءً من أن يعتذر.",
          },
          {
            en: "Leo thought for a moment. His dad's phone number was on a small card in his backpack.",
            ar: "فكّر ليو للحظة. كان رقم هاتف أبيه مكتوباً على بطاقة صغيرة في حقيبته.",
          },
          {
            who: "Frank",
            en: "Your father is very worried right now. Can I call him?",
            ar: "أبوك قلق جداً الآن. هل أستطيع الاتصال به؟",
          },
          {
            en: "Leo looked at the floor. Then he nodded.",
            ar: "نظر ليو إلى الأرض. ثم أومأ برأسه.",
          },
        ],
        question: {
          en: "What did Frank ask Leo?",
          ar: "ماذا سأل فرانك ليو؟",
          options: [
            { en: "If he wanted more chocolate", ar: "إن كان يريد المزيد من الشوكولاتة" },
            { en: "If he knew the way home", ar: "إن كان يعرف طريق العودة" },
            { en: "If he could call Leo's father", ar: "إن كان يستطيع الاتصال بأبي ليو" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "Headlights",
        titleAr: "المصابيح الأمامية",
        lines: [
          {
            en: "Twenty minutes later, a car arrived with its headlights on. A tall man in pajamas jumped out. His eyes were red.",
            ar: "بعد عشرين دقيقة، وصلت سيارة مضاءة المصابيح الأمامية. قفز منها رجل طويل يرتدي البيجاما. كانت عيناه حمراوين.",
          },
          {
            who: "Mr. Evans",
            en: "Leo! Leo, I'm so sorry I shouted. I don't care about the grades.",
            ar: "ليو! ليو، أنا آسف جداً لأنني صرخت. لا يهمني أمر العلامات.",
          },
          {
            en: "The father and the son hugged for a long time. Frank looked away to give them some privacy.",
            ar: "تعانق الأب والابن طويلاً. وأشاح فرانك بنظره ليمنحهما بعض الخصوصية.",
          },
          {
            en: "That night, at home, Frank took out his phone. He did not call his son. He wrote one short message.",
            ar: "في تلك الليلة، في بيته، أخرج فرانك هاتفه. لم يتصل بابنه. كتب رسالة قصيرة واحدة.",
          },
          {
            who: "Frank",
            en: "Hi, Michael. I miss you. I'm sorry.",
            ar: "مرحباً يا مايكل. أفتقدك. أنا آسف.",
          },
          {
            en: 'Ten minutes later, the phone buzzed: "Dad? I\'m free on Sunday."',
            ar: "بعد عشر دقائق، اهتزّ الهاتف: «أبي؟ أنا متفرغ يوم الأحد.»",
          },
        ],
        question: {
          en: "What did Frank do at the end of the night?",
          ar: "ماذا فعل فرانك في نهاية الليل؟",
          options: [
            { en: "He went straight to sleep", ar: "نام مباشرة" },
            { en: "He wrote a message to his own son", ar: "كتب رسالة إلى ابنه" },
            { en: "He called Leo's father again", ar: "اتصل بأبي ليو مرة أخرى" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "What did Frank and Leo have in common?",
      ar: "ما الذي كان مشتركاً بين فرانك وليو؟",
      options: [
        { en: "Both drove the number 9 bus", ar: "كلاهما قاد الحافلة رقم 9" },
        { en: "Both lived on the same street", ar: "كلاهما سكن في الشارع نفسه" },
        {
          en: "Both had a fight with someone in their family",
          ar: "كلاهما تشاجر مع أحد من عائلته",
        },
      ],
      answer: 2,
    },
    words: [
      {
        word: "grades",
        sentence: "My ___ were bad.",
        hintAr: "العلامات، الدرجات.",
      },
      {
        word: "silence",
        sentence: "They sat in the empty bus, drinking in ___, for five minutes.",
        hintAr: "الصمت.",
      },
      {
        word: "fight",
        sentence: "We had a big ___ five years ago, and we never spoke again.",
        hintAr: "الشجار.",
      },
      {
        word: "worried",
        sentence: "Your father is very ___ right now.",
        hintAr: "قلق.",
      },
      {
        word: "headlights",
        sentence: "Twenty minutes later, a car arrived with its ___ on.",
        hintAr: "المصابيح الأمامية.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 8
  {
    slug: "learning-to-drive-at-forty",
    order: 8,
    level: "A2",
    tone: "inspiring",
    icon: "map",
    title: "Learning to Drive at Forty",
    titleAr: "تعلّم القيادة في الأربعين",
    summary: "Linda failed the driving test twice. Then she tried again.",
    summaryAr: "رسبت ليندا في اختبار القيادة مرتين. ثم حاولت مرة أخرى.",
    cast: { Linda: "zara", Sam: "russ", Katie: "ash" },
    sections: [
      {
        title: "No Car, No Problem",
        titleAr: "لا سيارة، لا مشكلة",
        lines: [
          {
            en: "Linda was forty years old, and she could not drive. She took the bus everywhere.",
            ar: "كانت ليندا في الأربعين من عمرها، ولا تستطيع القيادة. كانت تركب الحافلة في كل مكان.",
          },
          {
            en: "Then she got a new job. It was good, but it was very far from her house.",
            ar: "ثم حصلت على عمل جديد. كان جيداً، لكنه بعيد جداً عن بيتها.",
          },
          {
            en: "The bus took two hours each way. She was tired before the work day even started.",
            ar: "كانت الحافلة تستغرق ساعتين في كل اتجاه. كانت تتعب قبل أن يبدأ يوم العمل حتى.",
          },
          {
            who: "Linda",
            en: "I need to learn to drive. But I'm scared of cars. And I'm too old to learn.",
            ar: "أحتاج أن أتعلم القيادة. لكنني أخاف من السيارات. وأنا أكبر من أن أتعلم.",
          },
          {
            who: "Katie",
            en: "Mom, you're not too old. You're forty! Lots of people learn at forty.",
            ar: "أمي، لستِ كبيرة. أنتِ في الأربعين! كثيرون يتعلمون في الأربعين.",
          },
          {
            en: "The next day, Linda called a driving school.",
            ar: "في اليوم التالي، اتصلت ليندا بمدرسة لتعليم القيادة.",
          },
        ],
        question: {
          en: "Why did Linda need to learn to drive?",
          ar: "لماذا احتاجت ليندا إلى تعلم القيادة؟",
          options: [
            { en: "She wanted to win a race", ar: "أرادت أن تفوز بسباق" },
            { en: "Her friends asked her to", ar: "طلب منها أصدقاؤها ذلك" },
            { en: "Her new job was far from her house", ar: "كان عملها الجديد بعيداً عن بيتها" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "The First Lesson",
        titleAr: "الدرس الأول",
        lines: [
          {
            en: "Her teacher was a calm man called Sam. He had a big smile and a second pedal on his side of the car.",
            ar: "كان معلمها رجلاً هادئاً اسمه سام. كانت له ابتسامة عريضة ودواسة ثانية في جانبه من السيارة.",
          },
          {
            who: "Sam",
            en: "Don't worry. I can stop the car from here. Now, put your foot on the pedal. Slowly.",
            ar: "لا تقلقي. أستطيع إيقاف السيارة من هنا. الآن ضعي قدمك على الدواسة. ببطء.",
          },
          {
            en: "Linda pressed the wrong pedal. The car jumped forward and stopped.",
            ar: "ضغطت ليندا على الدواسة الخطأ. قفزت السيارة إلى الأمام ثم توقفت.",
          },
          {
            who: "Linda",
            en: "I can't do this. I'm sorry. I'm so bad at it.",
            ar: "لا أستطيع فعل هذا. أنا آسفة. أنا سيئة جداً في ذلك.",
          },
          {
            who: "Sam",
            en: "Everybody starts here. Every driver on this road did the same thing on their first day.",
            ar: "الجميع يبدؤون من هنا. كل سائق على هذا الطريق فعل الشيء نفسه في يومه الأول.",
          },
          {
            en: "At the end of the lesson, Linda drove ten meters. She was crying and smiling at the same time.",
            ar: "في نهاية الدرس، قادت ليندا عشرة أمتار. كانت تبكي وتبتسم في الوقت نفسه.",
          },
        ],
        question: {
          en: "What did Sam say about her mistake?",
          ar: "ماذا قال سام عن خطئها؟",
          options: [
            { en: "She should stop driving", ar: "عليها أن تتوقف عن القيادة" },
            {
              en: "Everybody does the same on the first day",
              ar: "الجميع يفعلون الشيء نفسه في اليوم الأول",
            },
            { en: "It was the worst mistake ever", ar: "كان أسوأ خطأ على الإطلاق" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "The Test",
        titleAr: "الاختبار",
        lines: [
          {
            en: "After three months, Linda took her driving test. She was very nervous.",
            ar: "بعد ثلاثة أشهر، أدّت ليندا اختبار القيادة. كانت متوترة جداً.",
          },
          {
            en: "Everything went well for twenty minutes. Then she tried to park between two orange cones.",
            ar: "سار كل شيء على ما يرام لعشرين دقيقة. ثم حاولت أن تركن بين مخروطين برتقاليين.",
          },
          {
            en: "Bang! She hit one of the cones.",
            ar: "طاخ! ارتطمت بأحد المخروطين.",
          },
          {
            en: 'The examiner shook his head and said, "I\'m sorry. You did not pass today."',
            ar: "هزّ الممتحن رأسه وقال: «آسف. لم تنجحي اليوم.»",
          },
          {
            en: "That night, Linda sat on the sofa and did not talk to anyone.",
            ar: "في تلك الليلة، جلست ليندا على الأريكة ولم تكلّم أحداً.",
          },
          {
            who: "Katie",
            en: 'Mom, you always tell me, "Failing is just learning." Is that only for kids?',
            ar: "أمي، أنتِ تقولين لي دائماً: «الفشل مجرد تعلّم.» هل هذا للأطفال فقط؟",
          },
        ],
        question: {
          en: "What did Linda hit during the test?",
          ar: "ماذا صدمت ليندا خلال الاختبار؟",
          options: [
            { en: "One of the orange cones", ar: "أحد المخروطين البرتقاليين" },
            { en: "Another car", ar: "سيارة أخرى" },
            { en: "A tree", ar: "شجرة" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Third Time",
        titleAr: "في المرة الثالثة",
        lines: [
          {
            en: "Linda practiced for two more months. She failed the second test too, by only one mistake.",
            ar: "تدربت ليندا شهرين آخرين. ورسبت في الاختبار الثاني أيضاً، بسبب خطأ واحد فقط.",
          },
          {
            en: "On the third test, she did not hit any cone. She did not stop in the wrong place. She did not cry.",
            ar: "في الاختبار الثالث، لم تصدم أي مخروط. ولم تتوقف في المكان الخطأ. ولم تبكِ.",
          },
          {
            en: 'The examiner smiled for the first time. "Congratulations. You passed."',
            ar: "ابتسم الممتحن لأول مرة. «تهانينا. لقد نجحتِ.»",
          },
          {
            who: "Linda",
            en: "I passed! Katie, I passed!",
            ar: "نجحت! كاتي، لقد نجحت!",
          },
          {
            en: "On Monday, Linda drove to her new job for the first time. Katie sat next to her, singing loudly.",
            ar: "يوم الاثنين، قادت ليندا إلى عملها الجديد لأول مرة. جلست كاتي بجانبها تغني بصوت عالٍ.",
          },
          {
            en: "The road was long. But now it took only twenty minutes, and she was the one holding the wheel.",
            ar: "كان الطريق طويلاً. لكنه استغرق الآن عشرين دقيقة فقط، وكانت هي من يمسك بالمقود.",
          },
        ],
        question: {
          en: "How many times did Linda take the test?",
          ar: "كم مرة أدّت ليندا الاختبار؟",
          options: [
            { en: "Two times", ar: "مرتين" },
            { en: "Once", ar: "مرة واحدة" },
            { en: "Three times", ar: "ثلاث مرات" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "What does Linda always tell Katie?",
      ar: "ماذا تقول ليندا لكاتي دائماً؟",
      options: [
        { en: "Failing is just learning", ar: "الفشل مجرد تعلّم" },
        { en: "Buses are better than cars", ar: "الحافلات أفضل من السيارات" },
        { en: "Driving is only for young people", ar: "القيادة للشباب فقط" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "scared",
        sentence: "I need to learn to drive. But I'm ___ of cars. And I'm too old to learn.",
        hintAr: "خائف.",
      },
      {
        word: "pedal",
        sentence: "Linda pressed the wrong ___.",
        hintAr: "الدواسة.",
      },
      {
        word: "lesson",
        sentence: "At the end of the ___, Linda drove ten meters.",
        hintAr: "الدرس.",
      },
      {
        word: "cone",
        sentence: "On the third test, she did not hit any ___.",
        hintAr: "المخروط.",
      },
      {
        word: "examiner",
        sentence: "The ___ smiled for the first time.",
        hintAr: "الممتحِن.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 9
  {
    slug: "last-place-and-proud",
    order: 9,
    level: "A2",
    tone: "inspiring",
    icon: "sun",
    title: "Last Place and Proud",
    titleAr: "في المركز الأخير وفخورة",
    summary: "Jess hated running. Then her little brother made a bet.",
    summaryAr: "كانت جيس تكره الجري. ثم راهنها أخوها الأصغر.",
    cast: { Jess: "zara", Josh: "russ", Ed: "calm-male" },
    sections: [
      {
        title: "The Bet",
        titleAr: "الرهان",
        lines: [
          {
            en: "Jess was thirty-five and she hated running. Her little brother, Josh, was a runner.",
            ar: "كانت جيس في الخامسة والثلاثين وتكره الجري. وكان أخوها الأصغر، جوش، عدّاءً.",
          },
          {
            who: "Josh",
            en: "There's a 5K race in June. You can't run five kilometers. Nobody in our family can, except me.",
            ar: "هناك سباق 5 كيلومترات في يونيو. لا تستطيعين الجري خمسة كيلومترات. لا أحد في عائلتنا يستطيع، ما عداي.",
          },
          {
            who: "Jess",
            en: "Is that a bet?",
            ar: "هل هذا رهان؟",
          },
          {
            who: "Josh",
            en: "Ten dollars says you can't do it.",
            ar: "عشرة دولارات تقول إنك لا تستطيعين.",
          },
          {
            who: "Jess",
            en: "You have a bet, little brother.",
            ar: "لك الرهان يا أخي الصغير.",
          },
          {
            en: "That night, Jess bought her first pair of running shoes.",
            ar: "في تلك الليلة، اشترت جيس أول حذاء جري في حياتها.",
          },
        ],
        question: {
          en: "What was the bet about?",
          ar: "ما موضوع الرهان؟",
          options: [
            { en: "If Jess could run five kilometers", ar: "هل تستطيع جيس جري خمسة كيلومترات" },
            { en: "If Josh could win the race", ar: "هل يستطيع جوش الفوز بالسباق" },
            { en: "If Jess could buy new shoes", ar: "هل تستطيع جيس شراء حذاء جديد" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "A Turtle Needs a Friend",
        titleAr: "السلحفاة تحتاج إلى صديق",
        lines: [
          {
            en: "The next morning, Jess ran for two minutes. Then she stopped, with her hands on her knees. She could not breathe.",
            ar: "في الصباح التالي، جرت جيس دقيقتين. ثم توقفت ويداها على ركبتيها. لم تستطع التنفس.",
          },
          {
            en: "Every morning, she tried to run one minute more. Her legs hurt. Her neighbor, Mr. Ed, watched from his window.",
            ar: "كل صباح، كانت تحاول الجري دقيقة إضافية. كانت ساقاها تؤلمانها. وكان جارها السيد إد يراقبها من نافذته.",
          },
          {
            who: "Ed",
            en: "You are running like a turtle!",
            ar: "أنتِ تجرين مثل سلحفاة!",
          },
          {
            en: "After a month, Mr. Ed came outside in his old sports clothes.",
            ar: "بعد شهر، خرج السيد إد إلى الخارج بملابسه الرياضية القديمة.",
          },
          {
            who: "Ed",
            en: "A turtle needs a friend. Let's go.",
            ar: "السلحفاة تحتاج إلى صديق. هيا بنا.",
          },
          {
            en: "Together, they ran every morning, in the sun and in the rain. They were slow, and Mr. Ed told jokes all the way.",
            ar: "ركضا معاً كل صباح، في الشمس وفي المطر. كانا بطيئين، وكان السيد إد يروي النكات طوال الطريق.",
          },
        ],
        question: {
          en: "What did Mr. Ed do after a month?",
          ar: "ماذا فعل السيد إد بعد شهر؟",
          options: [
            { en: "He moved to another city", ar: "انتقل إلى مدينة أخرى" },
            { en: "He started to run with Jess", ar: "بدأ يجري مع جيس" },
            { en: "He told Jess to stop", ar: "طلب من جيس أن تتوقف" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "Race Day",
        titleAr: "يوم السباق",
        lines: [
          {
            en: "On race day, three thousand people stood at the starting line. Jess felt sick.",
            ar: "في يوم السباق، وقف ثلاثة آلاف شخص عند خط البداية. شعرت جيس بالغثيان.",
          },
          {
            en: "The runners started. In one minute, everybody was far in front of her. In ten minutes, she was alone.",
            ar: "انطلق العدّاؤون. وفي دقيقة واحدة، صار الجميع أمامها بمسافة بعيدة. وبعد عشر دقائق، كانت وحدها.",
          },
          {
            en: "At kilometer three, she started to walk. The winner was already at the finish line.",
            ar: "عند الكيلومتر الثالث، بدأت تمشي. وكان الفائز قد وصل بالفعل إلى خط النهاية.",
          },
          {
            who: "Jess",
            en: "I can't do it. I can't.",
            ar: "لا أستطيع. لا أستطيع.",
          },
          {
            en: 'Then she saw a small boy at the side of the road with a sign: "YOU ARE DOING GREAT!"',
            ar: "ثم رأت ولداً صغيراً على جانب الطريق يحمل لافتة: «أنتِ تبلين بلاءً حسناً!»",
          },
          {
            en: "She wiped her face and began to run again.",
            ar: "مسحت وجهها وبدأت تجري من جديد.",
          },
        ],
        question: {
          en: "What did the boy's sign say?",
          ar: "ماذا كُتب على لافتة الولد؟",
          options: [
            { en: "Stop here", ar: "توقفي هنا" },
            { en: "You are doing great!", ar: "أنتِ تبلين بلاءً حسناً!" },
            { en: "Go home", ar: "عودي إلى البيت" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "The Last Medal",
        titleAr: "الميدالية الأخيرة",
        lines: [
          {
            en: "Jess finished in fifty-eight minutes. She was the very last runner.",
            ar: "أنهت جيس السباق في ثمانٍ وخمسين دقيقة. كانت آخر عدّاءة على الإطلاق.",
          },
          {
            en: "But the people at the finish line did not go home. They waited, and when she arrived, they all started to clap and shout.",
            ar: "لكن الناس عند خط النهاية لم يعودوا إلى بيوتهم. انتظروها، وعندما وصلت بدأوا جميعاً يصفّقون ويصيحون.",
          },
          {
            en: "Josh was there, holding a medal and a ten-dollar bill.",
            ar: "كان جوش هناك، يحمل ميدالية وورقة من فئة عشرة دولارات.",
          },
          {
            who: "Josh",
            en: "You did it. I owe you ten dollars.",
            ar: "لقد فعلتِها. أنا مدين لك بعشرة دولارات.",
          },
          {
            who: "Jess",
            en: "Last place. I was the last one.",
            ar: "المركز الأخير. كنتُ الأخيرة.",
          },
          {
            who: "Josh",
            en: "You were last of three thousand people. The other three million people stayed at home.",
            ar: "كنتِ الأخيرة بين ثلاثة آلاف شخص. أما الملايين الثلاثة الآخرون فبقوا في بيوتهم.",
          },
          {
            who: "Jess",
            en: "Next year, I'll finish in fifty minutes.",
            ar: "في العام المقبل، سأنهي السباق في خمسين دقيقة.",
          },
        ],
        question: {
          en: "Why did Josh give Jess ten dollars?",
          ar: "لماذا أعطى جوش جيس عشرة دولارات؟",
          options: [
            { en: "He lost the bet", ar: "خسر الرهان" },
            { en: "It was her birthday", ar: "كان عيد ميلادها" },
            { en: "She won the race", ar: "فازت بالسباق" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "What did Jess buy on the night of the bet?",
      ar: "ماذا اشترت جيس في ليلة الرهان؟",
      options: [
        { en: "A ticket for the race", ar: "تذكرة للسباق" },
        { en: "A pair of running shoes", ar: "حذاء جري" },
        { en: "A gift for Josh", ar: "هدية لجوش" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "bet",
        sentence: "Is that a ___?",
        hintAr: "الرهان.",
      },
      {
        word: "breathe",
        sentence: "She could not ___.",
        hintAr: "يتنفّس.",
      },
      {
        word: "winner",
        sentence: "The ___ was already at the finish line.",
        hintAr: "الفائز.",
      },
      {
        word: "clap",
        sentence: "They waited, and when she arrived, they all started to ___ and shout.",
        hintAr: "يصفّق.",
      },
      {
        word: "owe",
        sentence: "You did it. I ___ you ten dollars.",
        hintAr: "يدين بـ، مدين.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 10
  {
    slug: "the-night-class",
    order: 10,
    level: "A2",
    tone: "inspiring",
    icon: "book",
    title: "The Night Class",
    titleAr: "الدرس المسائي",
    summary: "Daniel's granddaughter talks fast. Daniel only smiles.",
    summaryAr: "تتحدث حفيدة دانيال بسرعة. ودانيال يكتفي بالابتسام.",
    cast: { Daniel: "calm-male", Emma: "ash", "Ms. Lopez": "zara" },
    sections: [
      {
        title: "Grandpa Doesn't Answer",
        titleAr: "جدي لا يجيب",
        lines: [
          {
            en: "Daniel was fifty-five years old. He came from Mexico, and he worked in construction.",
            ar: "كان دانيال في الخامسة والخمسين. جاء من المكسيك وكان يعمل في البناء.",
          },
          {
            en: "His granddaughter, Emma, was six. She was born in America, and she only spoke English.",
            ar: "كانت حفيدته إيما في السادسة. وُلدت في أمريكا ولا تتحدث إلا الإنجليزية.",
          },
          {
            who: "Emma",
            en: "Grandpa, look! My drawing! It's a dragon with a pink hat! Do you like it?",
            ar: "جدي، انظر! رسمتي! تنّين بقبعة وردية! هل تعجبك؟",
          },
          {
            en: "Daniel smiled and nodded. He did not understand one word.",
            ar: "ابتسم دانيال وأومأ برأسه. لم يفهم كلمة واحدة.",
          },
          {
            who: "Emma",
            en: "Grandpa, why don't you answer me?",
            ar: "جدي، لماذا لا تجيبني؟",
          },
          {
            en: "That night, Daniel sat alone in the kitchen. He loved Emma more than anything. But he could not talk to her.",
            ar: "في تلك الليلة، جلس دانيال وحده في المطبخ. كان يحب إيما أكثر من أي شيء. لكنه لم يستطع الحديث معها.",
          },
        ],
        question: {
          en: "Why didn't Daniel answer Emma?",
          ar: "لماذا لم يجب دانيال إيما؟",
          options: [
            { en: "He was angry", ar: "كان غاضباً" },
            { en: "He did not like the drawing", ar: "لم تعجبه الرسمة" },
            { en: "He did not understand English", ar: "لم يكن يفهم الإنجليزية" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Room Twelve",
        titleAr: "الغرفة الثانية عشرة",
        lines: [
          {
            en: "The next week, Daniel found an English class at the community center. It was on Tuesday and Thursday nights, in room twelve.",
            ar: "في الأسبوع التالي، وجد دانيال دورة للغة الإنجليزية في المركز المجتمعي. كانت مساء الثلاثاء والخميس، في الغرفة الثانية عشرة.",
          },
          {
            en: "On the first night, he was the oldest person in the room. The other students were twenty years old.",
            ar: "في الليلة الأولى، كان أكبر شخص في الغرفة. وكان الطلاب الآخرون في العشرين من العمر.",
          },
          {
            who: "Daniel",
            en: "Maybe this was a mistake.",
            ar: "ربما كان هذا خطأ.",
          },
          {
            who: "Ms. Lopez",
            en: "Welcome, Daniel. In this room, nobody is too old, and nobody is too slow.",
            ar: "أهلاً بك يا دانيال. في هذه الغرفة، لا أحد كبير جداً، ولا أحد بطيء جداً.",
          },
          {
            en: "He bought a small notebook and wrote every new word with a picture, so he did not forget it.",
            ar: "اشترى دفتراً صغيراً وكتب فيه كل كلمة جديدة مع صورة حتى لا ينساها.",
          },
          {
            en: "It was hard. After a long day of work, his eyes closed in class. Once, he even fell asleep.",
            ar: "كان الأمر صعباً. بعد يوم عمل طويل، كانت عيناه تُغمضان في الدرس. وفي إحدى المرات نام فعلاً.",
          },
        ],
        question: {
          en: "What did Daniel write in his small notebook?",
          ar: "ماذا كتب دانيال في دفتره الصغير؟",
          options: [
            { en: "Every new word, with a picture", ar: "كل كلمة جديدة مع صورة" },
            { en: "His grandchild's name", ar: "اسم حفيدته" },
            { en: "A list of jobs", ar: "قائمة بالوظائف" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "Three Months",
        titleAr: "ثلاثة أشهر",
        lines: [
          {
            en: "Every evening after dinner, Daniel practiced with Emma. She was his little teacher.",
            ar: "كل مساء بعد العشاء، كان دانيال يتمرن مع إيما. كانت معلمته الصغيرة.",
          },
          {
            who: "Emma",
            en: 'Say it again, Grandpa. Slowly. "I want a red apple."',
            ar: "قلها مرة أخرى يا جدي. ببطء. «أريد تفاحة حمراء.»",
          },
          {
            en: "Daniel repeated the words. Sometimes they came out wrong, and Emma laughed so much that she fell on the floor.",
            ar: "كرّر دانيال الكلمات. وأحياناً كانت تخرج خاطئة، فتضحك إيما حتى تسقط على الأرض.",
          },
          {
            en: "But he did not stop. After one month, he understood her drawings. After two months, he told her a story.",
            ar: "لكنه لم يتوقف. بعد شهر، صار يفهم رسوماتها. وبعد شهرين، حكى لها قصة.",
          },
          {
            who: "Emma",
            en: "Grandpa, you speak English now!",
            ar: "جدي، أنت تتكلم الإنجليزية الآن!",
          },
          {
            who: "Daniel",
            en: "A little. Only a little. But tomorrow, more.",
            ar: "قليلاً. قليلاً فقط. لكن غداً، أكثر.",
          },
        ],
        question: {
          en: "What did Emma do when Daniel made a mistake?",
          ar: "ماذا كانت تفعل إيما عندما يخطئ دانيال؟",
          options: [
            { en: "She cried", ar: "كانت تبكي" },
            { en: "She went to bed", ar: "كانت تذهب إلى النوم" },
            { en: "She laughed", ar: "كانت تضحك" },
          ],
          answer: 2,
          evidence: 2,
        },
      },
      {
        title: "A Full Sentence",
        titleAr: "جملة كاملة",
        lines: [
          {
            en: "In June, it was Emma's seventh birthday. There were balloons, a cake, and twenty children in the yard.",
            ar: "في يونيو، كان عيد ميلاد إيما السابع. كانت هناك بالونات وكعكة وعشرون طفلاً في الفناء.",
          },
          {
            en: "For three weeks, Daniel prepared something special. He wrote it on a card, and he practiced it in the mirror every night.",
            ar: "لثلاثة أسابيع، حضّر دانيال شيئاً خاصاً. كتبه على بطاقة، وتمرّن عليه أمام المرآة كل ليلة.",
          },
          {
            en: "Now he stood in front of everyone. His hands were shaking, but he looked at Emma and smiled.",
            ar: "والآن وقف أمام الجميع. كانت يداه ترتجفان، لكنه نظر إلى إيما وابتسم.",
          },
          {
            who: "Daniel",
            en: "Emma, you are my sun. Happy birthday. I am very proud of you.",
            ar: "إيما، أنتِ شمسي. عيد ميلاد سعيد. أنا فخور بكِ جداً.",
          },
          {
            en: "Emma did not say a word. She ran across the yard and jumped into his arms.",
            ar: "لم تقل إيما كلمة. ركضت عبر الفناء وقفزت بين ذراعيه.",
          },
          {
            who: "Emma",
            en: "Grandpa! You said it all in English!",
            ar: "جدي! لقد قلتَ كل شيء بالإنجليزية!",
          },
          {
            who: "Daniel",
            en: "Yes. And this is only the beginning.",
            ar: "نعم. وهذه ليست سوى البداية.",
          },
        ],
        question: {
          en: "What did Daniel prepare for the birthday?",
          ar: "ماذا حضّر دانيال لعيد الميلاد؟",
          options: [
            { en: "A big cake", ar: "كعكة كبيرة" },
            { en: "Something special to say, in English", ar: "شيئاً خاصاً ليقوله بالإنجليزية" },
            { en: "A drawing of a dragon", ar: "رسمة تنّين" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "Why did Daniel go to the English class?",
      ar: "لماذا ذهب دانيال إلى دورة اللغة الإنجليزية؟",
      options: [
        { en: "He wanted to talk with Emma", ar: "أراد أن يتحدث مع إيما" },
        { en: "He needed it for his job", ar: "احتاج إليها في عمله" },
        { en: "A friend asked him to go", ar: "طلب منه صديق أن يذهب" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "construction",
        sentence: "He came from Mexico, and he worked in ___.",
        hintAr: "البناء، الإنشاءات.",
      },
      {
        word: "dragon",
        sentence: "It's a ___ with a pink hat!",
        hintAr: "التنّين.",
      },
      {
        word: "notebook",
        sentence:
          "He bought a small ___ and wrote every new word with a picture, so he did not forget it.",
        hintAr: "الدفتر.",
      },
      {
        word: "yard",
        sentence: "Emma did not say a word. She ran across the ___ and jumped into his arms.",
        hintAr: "الفناء، الحوش.",
      },
      {
        word: "mistake",
        sentence: "Maybe this was a ___.",
        hintAr: "الخطأ.",
      },
    ],
  },
];
