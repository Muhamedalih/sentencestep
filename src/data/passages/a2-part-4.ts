import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A2, a later addition: two more scenes at the step of the earlier sets — the past
 * tense carries the story, the dialogue is quick, and there is a turn and a payoff at
 * the end. Both were written against everything already in the library (the passages,
 * the Daily Lessons, the Stories), so they repeat none of them
 * (see scripts/check-passage-duplicates.ts).
 */

export const A2_PASSAGES_PART_4: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 12
  {
    slug: "the-chirp",
    order: 12,
    level: "A2",
    tone: "funny",
    icon: "house",
    title: "The Chirp",
    titleAr: "الزقزقة",
    summary: "At three in the morning, something in the house went chirp.",
    summaryAr: "في الثالثة صباحاً، أصدر شيء ما في البيت صوتاً صغيراً: تشيرب.",
    cast: { Mark: "russ", Julie: "zara" },
    sections: [
      {
        title: "Three in the Morning",
        titleAr: "الثالثة صباحاً",
        lines: [
          {
            en: "At three o'clock in the morning, Mark woke up. The house was dark and quiet.",
            ar: "في الثالثة صباحاً، استيقظ مارك. كان البيت مظلماً وهادئاً.",
          },
          {
            en: "Then he heard a tiny, high sound: chirp.",
            ar: "ثم سمع صوتاً صغيراً عالي النبرة: تشيرب.",
          },
          {
            en: "He waited, and there was nothing. A minute later, it came again: chirp.",
            ar: "انتظر فلم يحدث شيء. وبعد دقيقة عاد الصوت: تشيرب.",
          },
          {
            who: "Mark",
            en: "Julie, are you awake? Do you hear that?",
            ar: "جولي، هل أنتِ مستيقظة؟ هل تسمعين ذلك؟",
          },
          {
            en: "Julie opened one eye.",
            ar: "فتحت جولي إحدى عينيها.",
          },
          {
            who: "Julie",
            en: "It's a bird. Go back to sleep.",
            ar: "إنه عصفور. عُد إلى النوم.",
          },
          {
            who: "Mark",
            en: "A bird? In our bedroom, at three in the morning?",
            ar: "عصفور؟ في غرفة نومنا، في الثالثة صباحاً؟",
          },
          {
            en: "From somewhere in the dark, the answer came: chirp.",
            ar: "ومن مكان ما في العتمة جاء الجواب: تشيرب.",
          },
        ],
        question: {
          en: "What did Julie think the sound was?",
          ar: "ماذا ظنّت جولي أن الصوت؟",
          options: [
            { en: "A phone", ar: "هاتف" },
            { en: "A bird", ar: "عصفور" },
            { en: "A clock", ar: "ساعة" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "The Search",
        titleAr: "البحث",
        lines: [
          {
            en: "They got up and searched the whole apartment.",
            ar: "نهضا وبحثا في الشقة كلها.",
          },
          {
            en: "They looked in the kitchen, under the sofa and behind the fridge.",
            ar: "نظرا في المطبخ وتحت الأريكة وخلف الثلاجة.",
          },
          {
            en: "Every time they stood still, the chirp stopped. When they walked, it came again.",
            ar: "في كل مرة وقفا فيها ساكنين توقف الصوت. وحين مشيا عاد من جديد.",
          },
          {
            who: "Julie",
            en: "It's following us!",
            ar: "إنه يتبعنا!",
          },
          {
            en: "Mark checked the smoke alarm in the hallway. It had a small green light.",
            ar: "فحص مارك جهاز إنذار الدخان في الممر. كان فيه ضوء أخضر صغير.",
          },
          {
            who: "Mark",
            en: "It's fine. So where is the sound?",
            ar: "إنه سليم. فأين الصوت إذن؟",
          },
          {
            en: "He lay on the floor with a flashlight and looked under the bed. He found only dust.",
            ar: "استلقى على الأرض ومعه مصباح يدوي ونظر تحت السرير. ولم يجد إلا الغبار.",
          },
        ],
        question: {
          en: "Where did Mark check the smoke alarm?",
          ar: "أين فحص مارك جهاز إنذار الدخان؟",
          options: [
            { en: "In the kitchen", ar: "في المطبخ" },
            { en: "In the bedroom", ar: "في غرفة النوم" },
            { en: "In the hallway", ar: "في الممر" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "No Sleep",
        titleAr: "لا نوم",
        lines: [
          {
            en: "At four-thirty, they were both very tired.",
            ar: "في الرابعة والنصف كان كلاهما متعباً جداً.",
          },
          {
            en: "Julie put a pillow over her head. Mark sat in the living room with another pillow over his ears.",
            ar: "وضعت جولي وسادة فوق رأسها. وجلس مارك في غرفة المعيشة ووسادة أخرى فوق أذنيه.",
          },
          {
            en: "Chirp.",
            ar: "تشيرب.",
          },
          {
            who: "Julie",
            en: "That's it. I'm going to a hotel.",
            ar: "هذا يكفي. سأذهب إلى فندق.",
          },
          {
            who: "Mark",
            en: "Wait! I have an idea. I'll record the sound on my phone and find where it comes from.",
            ar: "انتظري! لدي فكرة. سأسجّل الصوت على هاتفي وأعرف من أين يأتي.",
          },
          {
            en: "He recorded for ten minutes. Then they listened to the recording together.",
            ar: "سجّل عشر دقائق. ثم استمعا إلى التسجيل معاً.",
          },
          {
            en: 'They heard Mark\'s voice very clearly, shouting, "Where are you?" The chirp was too quiet to hear.',
            ar: "سمعا صوت مارك بوضوح تام وهو يصرخ: «أين أنت؟» أما الصوت الصغير فكان خافتاً جداً.",
          },
        ],
        question: {
          en: "What could they hear clearly on the recording?",
          ar: "ماذا استطاعا أن يسمعا بوضوح في التسجيل؟",
          options: [
            { en: "The chirp", ar: "الصوت الصغير" },
            { en: "Mark's voice", ar: "صوت مارك" },
            { en: "A bird", ar: "عصفوراً" },
          ],
          answer: 1,
          evidence: 6,
        },
      },
      {
        title: "The Drawer",
        titleAr: "الدرج",
        lines: [
          {
            en: "At six o'clock, the sun came up. Julie went to the kitchen to make coffee.",
            ar: "في السادسة أشرقت الشمس. ذهبت جولي إلى المطبخ لتحضّر القهوة.",
          },
          {
            en: "Chirp. This time, it was very close.",
            ar: "تشيرب. وهذه المرة كان قريباً جداً.",
          },
          {
            en: "She stood by the counter and listened. The sound came from the junk drawer.",
            ar: "وقفت بجانب الطاولة واستمعت. كان الصوت يأتي من درج الأغراض المتفرقة.",
          },
          {
            en: "She opened it. Under some cables and old keys, there was a white smoke alarm.",
            ar: "فتحته. وتحت بعض الأسلاك والمفاتيح القديمة كان هناك جهاز إنذار دخان أبيض.",
          },
          {
            who: "Julie",
            en: "Mark. Why is there a smoke alarm in our drawer?",
            ar: "مارك. لماذا يوجد جهاز إنذار دخان في درجنا؟",
          },
          {
            who: "Mark",
            en: "Oh. I took it off the ceiling last month to paint. I forgot to throw it away.",
            ar: "آه. أنزلته عن السقف الشهر الماضي لأدهن. ونسيت أن أرميه.",
          },
          {
            en: "He took out the battery, and the house was finally quiet. They slept until noon, and Julie did not speak to him until lunch.",
            ar: "أخرج البطارية فهدأ البيت أخيراً. ناما حتى الظهر، ولم تكلمه جولي حتى الغداء.",
          },
        ],
        question: {
          en: "Where did Julie find the old smoke alarm?",
          ar: "أين وجدت جولي جهاز إنذار الدخان القديم؟",
          options: [
            { en: "On the ceiling", ar: "على السقف" },
            { en: "Under the bed", ar: "تحت السرير" },
            { en: "In the junk drawer", ar: "في درج الأغراض المتفرقة" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "Why was it so hard to find the chirp?",
      ar: "لماذا كان العثور على الصوت الصغير صعباً إلى هذا الحد؟",
      options: [
        {
          en: "It came once a minute, from inside a drawer",
          ar: "كان يصدر مرة في الدقيقة، من داخل درج",
        },
        {
          en: "The alarm in the hallway was broken",
          ar: "كان جهاز الإنذار في الممر معطّلاً",
        },
        {
          en: "A bird was hiding in the bedroom",
          ar: "كان عصفور يختبئ في غرفة النوم",
        },
      ],
      answer: 0,
    },
    words: [
      {
        word: "chirp",
        sentence: "Then he heard a tiny, high sound: ___.",
        hintAr: "زقزقة.",
      },
      {
        word: "drawer",
        sentence: "The sound came from the junk ___.",
        hintAr: "درج.",
      },
      {
        word: "ceiling",
        sentence: "I took it off the ___ last month to paint.",
        hintAr: "سقف.",
      },
      {
        word: "flashlight",
        sentence: "He lay on the floor with a ___ and looked under the bed.",
        hintAr: "مصباح يدوي.",
      },
      {
        word: "pillow",
        sentence: "Julie put a ___ over her head.",
        hintAr: "وسادة.",
      },
      {
        word: "alarm",
        sentence: "Mark checked the smoke ___ in the hallway.",
        hintAr: "جهاز إنذار.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 13
  {
    slug: "where-is-lily",
    order: 13,
    level: "A2",
    tone: "serious",
    icon: "heart",
    title: "Where Is Lily?",
    titleAr: "أين ليلي؟",
    summary: "Hannah turned away for ten seconds. When she turned back, Lily was gone.",
    summaryAr: "التفتت هانا عشر ثوانٍ فقط. وحين عادت، كانت ليلي قد اختفت.",
    cast: { Hannah: "zara", Lily: "ash", "Mr. Brooks": "calm-male" },
    sections: [
      {
        title: "A Busy Saturday",
        titleAr: "يوم سبت مزدحم",
        lines: [
          {
            en: "On Saturday morning, Hannah took her daughter Lily to the big mall.",
            ar: "صباح السبت، أخذت هانا ابنتها ليلي إلى المركز التجاري الكبير.",
          },
          {
            en: "Lily was five years old. She wore a yellow coat and a red hat.",
            ar: "كانت ليلي في الخامسة من عمرها. ارتدت معطفاً أصفر وقبعة حمراء.",
          },
          {
            en: "They needed a birthday present for Lily's cousin, Ben.",
            ar: "كانتا تحتاجان إلى هدية عيد ميلاد لابن عمّ ليلي، بن.",
          },
          {
            en: "The mall was full of people, so Hannah held Lily's hand tightly.",
            ar: "كان المركز التجاري مليئاً بالناس، فأمسكت هانا يد ليلي بإحكام.",
          },
          {
            en: "Then her phone rang. It was her sister.",
            ar: "ثم رنّ هاتفها. كانت أختها.",
          },
          {
            en: "Hannah turned away and talked for ten seconds.",
            ar: "التفتت هانا بعيداً وتحدثت عشر ثوانٍ.",
          },
          {
            en: "When she turned back, her hand was empty.",
            ar: "وحين التفتت، كانت يدها فارغة.",
          },
        ],
        question: {
          en: "Why did Hannah turn away?",
          ar: "لماذا التفتت هانا بعيداً؟",
          options: [
            { en: "She saw a friend", ar: "رأت صديقة" },
            { en: "Her phone rang", ar: "رنّ هاتفها" },
            { en: "She wanted to buy a present", ar: "أرادت أن تشتري هدية" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "The Announcement",
        titleAr: "الإعلان",
        lines: [
          {
            en: "Hannah's heart beat fast. She ran to the escalator, then to the fountain, then back again.",
            ar: "دقّ قلب هانا بسرعة. ركضت إلى السلم الكهربائي، ثم إلى النافورة، ثم عادت.",
          },
          {
            en: 'She stopped a woman. "Did you see a little girl in a yellow coat?"',
            ar: "أوقفت امرأة. «هل رأيتِ طفلة صغيرة بمعطف أصفر؟»",
          },
          {
            en: "The woman shook her head, and Hannah wanted to cry.",
            ar: "هزّت المرأة رأسها، وأرادت هانا أن تبكي.",
          },
          {
            en: "At the information desk, a security guard named Mr. Brooks listened to her calmly.",
            ar: "عند مكتب الاستعلامات، استمع إليها حارس أمن اسمه السيد بروكس بهدوء.",
          },
          {
            who: "Mr. Brooks",
            en: "Don't worry, ma'am. This happens every week, and children are almost always found within ten minutes.",
            ar: "لا تقلقي يا سيدتي. هذا يحدث كل أسبوع، والأطفال يُعثر عليهم غالباً خلال عشر دقائق.",
          },
          {
            en: 'He spoke into his radio: "A girl, five years old, yellow coat, red hat. Her name is Lily."',
            ar: "تحدث في جهازه اللاسلكي: «طفلة في الخامسة، معطف أصفر وقبعة حمراء. اسمها ليلي.»",
          },
          {
            en: 'A minute later, a voice filled the whole mall: "Lily, your mommy is waiting at the information desk."',
            ar: "وبعد دقيقة ملأ صوت المركز التجاري كله: «ليلي، أمك تنتظرك عند مكتب الاستعلامات.»",
          },
        ],
        question: {
          en: "Who helped Hannah at the information desk?",
          ar: "من ساعد هانا عند مكتب الاستعلامات؟",
          options: [
            { en: "The woman she stopped", ar: "المرأة التي أوقفتها" },
            { en: "A friend of Lily's", ar: "صديقة لليلي" },
            { en: "Mr. Brooks, a security guard", ar: "السيد بروكس، وهو حارس أمن" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Seven Minutes",
        titleAr: "سبع دقائق",
        lines: [
          {
            en: "Hannah sat on a chair and watched the clock on the wall.",
            ar: "جلست هانا على كرسي وراقبت الساعة على الجدار.",
          },
          {
            en: "Seven minutes felt like seven hours.",
            ar: "بدت السبع دقائق كأنها سبع ساعات.",
          },
          {
            en: "She thought about the stairs, the doors and the parking lot. Every thought was worse than the last.",
            ar: "فكّرت في السلالم والأبواب وموقف السيارات. وكان كل خاطر أسوأ من الذي قبله.",
          },
          {
            who: "Mr. Brooks",
            en: "Have some water. She will come.",
            ar: "اشربي بعض الماء. ستأتي.",
          },
          {
            en: "Hannah drank the water, but her hands were still shaking.",
            ar: "شربت هانا الماء، لكن يديها كانتا ما زالتا ترتجفان.",
          },
          {
            en: 'Suddenly, the radio made a noise: "We have her. She is safe."',
            ar: "وفجأة أصدر الجهاز اللاسلكي صوتاً: «وجدناها. إنها بخير.»",
          },
          {
            who: "Hannah",
            en: "Where is she?",
            ar: "أين هي؟",
          },
          {
            who: "Mr. Brooks",
            en: "At the pet shop. Come with me.",
            ar: "في متجر الحيوانات الأليفة. تعالي معي.",
          },
        ],
        question: {
          en: "How long did the wait feel to Hannah?",
          ar: "كم بدا الانتظار لهانا طويلاً؟",
          options: [
            { en: "Like seven hours", ar: "كأنه سبع ساعات" },
            { en: "Like seven days", ar: "كأنه سبعة أيام" },
            { en: "Like seven seconds", ar: "كأنه سبع ثوانٍ" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "The Hamster",
        titleAr: "الهامستر",
        lines: [
          {
            en: "Lily was sitting on the floor of the pet shop, in front of a small glass house.",
            ar: "كانت ليلي جالسة على أرض متجر الحيوانات الأليفة، أمام بيت زجاجي صغير.",
          },
          {
            en: "Inside, a hamster was running on a wheel, and Lily was watching it with a big smile.",
            ar: "في داخله كان هامستر يركض على عجلة، وكانت ليلي تشاهده بابتسامة كبيرة.",
          },
          {
            en: "Hannah ran to her and held her tightly. She was crying.",
            ar: "ركضت هانا إليها وضمّتها بقوة. كانت تبكي.",
          },
          {
            who: "Lily",
            en: "Mommy, why are you crying?",
            ar: "ماما، لماذا تبكين؟",
          },
          {
            who: "Hannah",
            en: "Lily! You were lost! I looked everywhere.",
            ar: "ليلي! لقد ضعتِ! بحثتُ عنكِ في كل مكان.",
          },
          {
            who: "Lily",
            en: "I was not lost. I knew where I was. You were lost!",
            ar: "أنا لم أضِع. كنت أعرف أين أنا. أنتِ التي ضعتِ!",
          },
          {
            en: "Mr. Brooks laughed so hard that he had to sit down. Hannah laughed and cried at the same time.",
            ar: "ضحك السيد بروكس حتى اضطر إلى الجلوس. وضحكت هانا وبكت في الوقت نفسه.",
          },
          {
            en: 'On the way out, Lily asked, "Can I have a hamster?" Hannah answered, "Ask me again in ten years."',
            ar: "وفي طريق الخروج سألت ليلي: «هل يمكنني أن أحصل على هامستر؟» فأجابت هانا: «اسأليني مرة أخرى بعد عشر سنوات.»",
          },
        ],
        question: {
          en: "What was Lily doing when they found her?",
          ar: "ماذا كانت ليلي تفعل حين وجدوها؟",
          options: [
            { en: "Playing with a ball", ar: "تلعب بكرة" },
            { en: "Watching a hamster", ar: "تشاهد هامستر" },
            { en: "Talking to a guard", ar: "تتحدث إلى حارس" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "Why did Lily say that she was not lost?",
      ar: "لماذا قالت ليلي إنها لم تضِع؟",
      options: [
        { en: "Her mother was with her", ar: "كانت أمها معها" },
        { en: "She saw the security guard", ar: "رأت حارس الأمن" },
        { en: "She knew where she was", ar: "كانت تعرف أين هي" },
      ],
      answer: 2,
    },
    words: [
      {
        word: "fountain",
        sentence: "She ran to the escalator, then to the ___, then back again.",
        hintAr: "نافورة.",
      },
      {
        word: "escalator",
        sentence: "She ran to the ___, then to the fountain, then back again.",
        hintAr: "سلّم كهربائي.",
      },
      {
        word: "security",
        sentence: "At the information desk, a ___ guard named Mr. Brooks listened to her calmly.",
        hintAr: "أمن.",
      },
      {
        word: "hamster",
        sentence:
          "Inside, a ___ was running on a wheel, and Lily was watching it with a big smile.",
        hintAr: "هامستر.",
      },
      {
        word: "radio",
        sentence: "He spoke into his ___:",
        hintAr: "جهاز لاسلكي.",
      },
    ],
  },
];
