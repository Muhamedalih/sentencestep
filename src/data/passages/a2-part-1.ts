import type { PassageSeed } from "@/data/passages/types";

/**
 * Level A2 passages, first half. The same kind of scene as the A1 ones — real
 * people, a small turn in the middle, a payoff at the end, never a lesson about
 * a grammar point — told at the next step: the past tense now carries the story
 * ("had", "walked", "said"), plans use "going to", and the dialogue is a little
 * quicker. Names are the ones a learner would meet in any American film or
 * workplace.
 */

export const A2_PASSAGES_PART_1: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 1
  {
    slug: "the-wrong-wedding",
    order: 1,
    level: "A2",
    tone: "funny",
    icon: "heart",
    title: "The Wrong Wedding",
    titleAr: "الزفاف الخطأ",
    summary: "The map said, “You have arrived.” The map was wrong.",
    summaryAr: "قالت الخريطة: «لقد وصلت». كانت الخريطة مخطئة.",
    cast: { Ryan: "russ", Rose: "autumn", Julia: "ash" },
    sections: [
      {
        title: "The Map Says Yes",
        titleAr: "الخريطة تقول نعم",
        lines: [
          {
            en: "Ryan had a plan for Saturday: his friend Julia's wedding at the Green Garden, at three o'clock.",
            ar: "كانت لدى رايان خطة ليوم السبت: حفل زفاف صديقته جوليا في «الحديقة الخضراء» في الساعة الثالثة.",
          },
          {
            en: "He put on his best suit and opened the map on his phone.",
            ar: "ارتدى أفضل بدلة عنده وفتح الخريطة على هاتفه.",
          },
          {
            en: 'The map said, "Turn left. Turn right. You have arrived."',
            ar: "قالت الخريطة: «انعطف يساراً. انعطف يميناً. لقد وصلت.»",
          },
          {
            en: "Ryan looked up. He saw a beautiful garden and a lot of people in nice clothes.",
            ar: "رفع رايان رأسه. رأى حديقة جميلة وكثيراً من الناس بملابس أنيقة.",
          },
          {
            who: "Ryan",
            en: "Perfect. I'm not late!",
            ar: "رائع. أنا لست متأخراً!",
          },
          {
            en: "He walked in and sat down in the last row.",
            ar: "دخل وجلس في الصف الأخير.",
          },
        ],
        question: {
          en: "Why did Ryan walk into the garden?",
          ar: "لماذا دخل رايان الحديقة؟",
          options: [
            { en: "Julia called him inside", ar: "اتصلت به جوليا ليدخل" },
            { en: "The map said he had arrived", ar: "قالت الخريطة إنه وصل" },
            { en: "He saw his friends there", ar: "رأى أصدقاءه هناك" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "A Strange Name",
        titleAr: "اسم غريب",
        lines: [
          {
            en: "A woman in a big blue hat sat down next to him.",
            ar: "جلست بجانبه امرأة ترتدي قبعة زرقاء كبيرة.",
          },
          {
            who: "Rose",
            en: "Are you a friend of the bride or the groom?",
            ar: "هل أنت صديق للعروس أم للعريس؟",
          },
          {
            en: "Ryan did not know what to say.",
            ar: "لم يعرف رايان ماذا يقول.",
          },
          {
            who: "Ryan",
            en: "A friend. A very good friend.",
            ar: "صديق. صديق مقرّب جداً.",
          },
          {
            en: "Then the music started, and the bride came in.",
            ar: "ثم بدأت الموسيقى، ودخلت العروس.",
          },
          {
            who: "Rose",
            en: "Isn't she beautiful? That's my granddaughter, Emily.",
            ar: "أليست جميلة؟ هذه حفيدتي إيميلي.",
          },
          {
            en: "Emily? Ryan's friend was called Julia!",
            ar: "إيميلي؟ لكن صديقة رايان اسمها جوليا!",
          },
          {
            who: "Ryan",
            en: "Oh no. Oh no, no, no.",
            ar: "يا إلهي. لا، لا، لا.",
          },
        ],
        question: {
          en: "What was strange for Ryan?",
          ar: "ما الغريب بالنسبة لرايان؟",
          options: [
            { en: "The music was too loud", ar: "الموسيقى كانت عالية جداً" },
            { en: "The bride's name was Emily, not Julia", ar: "اسم العروس إيميلي وليس جوليا" },
            { en: "The woman wore a blue hat", ar: "المرأة كانت ترتدي قبعة زرقاء" },
          ],
          answer: 1,
          evidence: 6,
        },
      },
      {
        title: "Table Seven",
        titleAr: "الطاولة السابعة",
        lines: [
          {
            en: "Ryan wanted to leave, but everybody was watching the bride. So he stayed in his seat.",
            ar: "أراد رايان أن يغادر، لكن الجميع كانوا ينظرون إلى العروس. فبقي في مقعده.",
          },
          {
            en: "After the wedding, there was a big dinner. Rose took Ryan's arm.",
            ar: "بعد الزفاف، أُقيم عشاء كبير. أمسكت روز بذراع رايان.",
          },
          {
            who: "Rose",
            en: "You look hungry, young man. Sit with us at table seven!",
            ar: "تبدو جائعاً يا بني. اجلس معنا على الطاولة السابعة!",
          },
          {
            en: 'Table seven was loud and happy. "This is my cousin\'s grandson from Canada," Rose told everyone.',
            ar: "كانت الطاولة السابعة صاخبة ومرحة. قالت روز للجميع: «هذا حفيد ابن عمي من كندا.»",
          },
          {
            who: "Ryan",
            en: "Um... yes. Hello. I'm from Canada.",
            ar: "امم... نعم. مرحباً. أنا من كندا.",
          },
          {
            en: "The food was delicious. Ryan ate chicken, rice, and three pieces of cake.",
            ar: "كان الطعام لذيذاً. أكل رايان دجاجاً وأرزاً وثلاث قطع من الكعك.",
          },
          {
            who: "Rose",
            en: "Eat more! You are too thin.",
            ar: "كُل أكثر! أنت نحيف جداً.",
          },
        ],
        question: {
          en: "What did Rose tell everyone about Ryan?",
          ar: "ماذا قالت روز للجميع عن رايان؟",
          options: [
            { en: "He was the groom's brother", ar: "إنه أخو العريس" },
            { en: "He was a famous cook", ar: "إنه طاهٍ مشهور" },
            {
              en: "He was her cousin's grandson from Canada",
              ar: "إنه حفيد ابن عمها من كندا",
            },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Two Weddings",
        titleAr: "زفافان",
        lines: [
          {
            en: "At nine o'clock, Ryan's phone rang. It was Julia.",
            ar: "في التاسعة، رنّ هاتف رايان. كانت جوليا.",
          },
          {
            who: "Julia",
            en: "Ryan! Where are you? The wedding was at three!",
            ar: "رايان! أين أنت؟ كان الزفاف في الثالثة!",
          },
          {
            who: "Ryan",
            en: "I'm at a wedding. A different wedding.",
            ar: "أنا في حفل زفاف. زفاف آخر.",
          },
          {
            who: "Julia",
            en: "What? There are two Green Gardens in this city. You went to the wrong one!",
            ar: "ماذا؟ في هذه المدينة حديقتان باسم «الحديقة الخضراء». لقد ذهبت إلى الخطأ!",
          },
          {
            en: "Ryan said goodbye to Rose and took a taxi across the city.",
            ar: "ودّع رايان روز وركب سيارة أجرة عبر المدينة.",
          },
          {
            en: "He arrived at the right wedding just in time for the last dance.",
            ar: "وصل إلى الزفاف الصحيح في الوقت المناسب للرقصة الأخيرة.",
          },
          {
            en: 'A week later, a card came in the mail: "Come to dinner, cousin Ryan. Love, Grandma Rose."',
            ar: "بعد أسبوع، وصلته بطاقة بالبريد: «تعال إلى العشاء يا ابن العم رايان. مع حبي، الجدة روز.»",
          },
        ],
        question: {
          en: "Why did Ryan go to the wrong wedding?",
          ar: "لماذا ذهب رايان إلى الزفاف الخطأ؟",
          options: [
            { en: "There are two places with the same name", ar: "هناك مكانان بالاسم نفسه" },
            { en: "He forgot the day", ar: "نسي اليوم" },
            { en: "Julia gave him a wrong address", ar: "أعطته جوليا عنواناً خاطئاً" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "What came in the mail a week after the wedding?",
      ar: "ما الذي وصل بالبريد بعد أسبوع من الزفاف؟",
      options: [
        { en: "A dinner invitation from Rose", ar: "دعوة إلى العشاء من روز" },
        { en: "A photo from the wedding", ar: "صورة من حفل الزفاف" },
        { en: "A letter from the bride", ar: "رسالة من العروس" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "bride",
        sentence: "Are you a friend of the ___ or the groom?",
        hintAr: "العروس.",
      },
      {
        word: "wedding",
        sentence: "After the ___, there was a big dinner.",
        hintAr: "حفل الزفاف.",
      },
      {
        word: "delicious",
        sentence: "The food was ___.",
        hintAr: "لذيذ.",
      },
      {
        word: "thin",
        sentence: "Eat more! You are too ___.",
        hintAr: "نحيف.",
      },
      {
        word: "clothes",
        sentence: "He saw a beautiful garden and a lot of people in nice ___.",
        hintAr: "الملابس.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 2
  {
    slug: "the-camera-is-on",
    order: 2,
    level: "A2",
    tone: "funny",
    icon: "briefcase",
    title: "The Camera Is On",
    titleAr: "الكاميرا تعمل",
    summary: "Brandon's shirt looked perfect. His shorts did not.",
    summaryAr: "بدا قميص براندون مثالياً. أما شورته فلا.",
    cast: { Brandon: "russ", "Ms. Parker": "zara" },
    sections: [
      {
        title: "Ten Minutes Before",
        titleAr: "قبل عشر دقائق",
        lines: [
          {
            en: "Brandon worked from home. At ten o'clock, he had an important meeting with his boss, Ms. Parker.",
            ar: "كان براندون يعمل من المنزل. في العاشرة، كان لديه اجتماع مهم مع مديرته، السيدة باركر.",
          },
          {
            en: "At 9:50, he looked in the mirror. He was wearing a clean white shirt and a blue tie.",
            ar: "في التاسعة وخمسين دقيقة، نظر في المرآة. كان يرتدي قميصاً أبيض نظيفاً وربطة عنق زرقاء.",
          },
          {
            en: "But under the table, he was wearing his old pajama shorts with little ducks on them.",
            ar: "لكن تحت الطاولة، كان يرتدي شورت البيجامة القديم الذي عليه بط صغير.",
          },
          {
            who: "Brandon",
            en: "Nobody can see my legs. The camera only shows my top half.",
            ar: "لا أحد يستطيع رؤية ساقيّ. الكاميرا تُظهر نصفي العلوي فقط.",
          },
          {
            en: "He sat down, smiled, and clicked the green button. The meeting started.",
            ar: "جلس وابتسم وضغط على الزر الأخضر. بدأ الاجتماع.",
          },
        ],
        question: {
          en: "What was wrong with Brandon's clothes?",
          ar: "ما المشكلة في ملابس براندون؟",
          options: [
            { en: "His shirt was dirty", ar: "كان قميصه متسخاً" },
            { en: "He wore pajama shorts under the table", ar: "ارتدى شورت بيجامة تحت الطاولة" },
            { en: "He forgot his tie", ar: "نسي ربطة عنقه" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "A Small Problem",
        titleAr: "مشكلة صغيرة",
        lines: [
          {
            en: "For ten minutes, everything was fine. Ms. Parker talked about the new project.",
            ar: "لمدة عشر دقائق، كان كل شيء على ما يرام. تحدثت السيدة باركر عن المشروع الجديد.",
          },
          {
            en: "Suddenly, Brandon's dog, Max, started to bark loudly at the door.",
            ar: "فجأة، بدأ كلب براندون، ماكس، ينبح بصوت عالٍ عند الباب.",
          },
          {
            en: "Then the doorbell rang. Max barked even louder.",
            ar: "ثم رنّ جرس الباب. نبح ماكس بصوت أعلى.",
          },
          {
            who: "Brandon",
            en: "Sorry, everybody. It's a package. One minute!",
            ar: "آسف يا جماعة. إنه طرد. دقيقة واحدة!",
          },
          {
            en: "Brandon jumped up from his chair. He forgot one little thing.",
            ar: "قفز براندون من كرسيه. ونسي شيئاً صغيراً.",
          },
          {
            en: "The camera was still on.",
            ar: "كانت الكاميرا لا تزال تعمل.",
          },
        ],
        question: {
          en: "Why did Brandon stand up?",
          ar: "لماذا وقف براندون؟",
          options: [
            { en: "Someone rang the doorbell", ar: "رنّ أحدهم جرس الباب" },
            { en: "He wanted some coffee", ar: "أراد بعض القهوة" },
            { en: "The meeting ended", ar: "انتهى الاجتماع" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
      {
        title: "Ducks",
        titleAr: "البط",
        lines: [
          {
            en: "Everyone on the screen saw Brandon's legs. And everyone saw the ducks.",
            ar: "رأى الجميع على الشاشة ساقيّ براندون. ورأوا البط أيضاً.",
          },
          {
            en: "For three seconds, nobody said anything.",
            ar: "لثلاث ثوانٍ، لم يقل أحد شيئاً.",
          },
          {
            en: "Then one person in the team started to laugh. Then another. Soon, everybody was laughing.",
            ar: "ثم بدأ أحد أعضاء الفريق يضحك. ثم آخر. وسرعان ما كان الجميع يضحكون.",
          },
          {
            who: "Brandon",
            en: "I can explain... no, I can't.",
            ar: "أستطيع أن أشرح... لا، لا أستطيع.",
          },
          {
            en: "He came back to his chair. His face was red like a tomato.",
            ar: "عاد إلى كرسيه. كان وجهه أحمر كالطماطم.",
          },
          {
            who: "Ms. Parker",
            en: "Brandon.",
            ar: "براندون.",
          },
          {
            who: "Ms. Parker",
            en: "Nice ducks.",
            ar: "بط جميل.",
          },
        ],
        question: {
          en: "What did Ms. Parker say to Brandon?",
          ar: "ماذا قالت السيدة باركر لبراندون؟",
          options: [
            { en: "“You are late.”", ar: "«أنت متأخر.»" },
            { en: "“Turn off the camera.”", ar: "«أطفئ الكاميرا.»" },
            { en: "“Nice ducks.”", ar: "«بط جميل.»" },
          ],
          answer: 2,
          evidence: 6,
        },
      },
      {
        title: "The Slippers",
        titleAr: "الخفّان",
        lines: [
          {
            en: "Brandon wanted to hide under the table. But Ms. Parker did not look angry. She looked happy.",
            ar: "أراد براندون أن يختبئ تحت الطاولة. لكن السيدة باركر لم تبدُ غاضبة. بدت سعيدة.",
          },
          {
            who: "Ms. Parker",
            en: "Don't worry. Look at this.",
            ar: "لا تقلق. انظر إلى هذا.",
          },
          {
            en: "She stood up. Under her desk, she was wearing big pink bunny slippers.",
            ar: "وقفت. تحت مكتبها، كانت ترتدي خفّين ورديين كبيرين على شكل أرنب.",
          },
          {
            en: "Now everyone started to show their legs: old pajamas, funny socks, and even one blanket.",
            ar: "الآن بدأ الجميع يُظهرون سيقانهم: بيجامات قديمة، وجوارب مضحكة، وحتى بطانية واحدة.",
          },
          {
            en: "It was the happiest meeting of the year.",
            ar: "كان أسعد اجتماع في العام.",
          },
          {
            who: "Ms. Parker",
            en: "From today, every Friday is Pajama Day!",
            ar: "من اليوم، كل يوم جمعة هو يوم البيجامة!",
          },
          {
            en: "The next Friday, Brandon wore his ducks again. This time, he was proud.",
            ar: "في الجمعة التالية، ارتدى براندون بطّاته مرة أخرى. وهذه المرة، كان فخوراً.",
          },
        ],
        question: {
          en: "What did Ms. Parker wear under her desk?",
          ar: "ماذا كانت ترتدي السيدة باركر تحت مكتبها؟",
          options: [
            { en: "Pink bunny slippers", ar: "خفّين ورديين على شكل أرنب" },
            { en: "Old pajama shorts", ar: "شورت بيجامة قديماً" },
            { en: "Rain boots", ar: "حذاءً مطرياً" },
          ],
          answer: 0,
          evidence: 2,
        },
      },
    ],
    closing: {
      en: "What new rule did Ms. Parker make?",
      ar: "ما القاعدة الجديدة التي وضعتها السيدة باركر؟",
      options: [
        { en: "Everybody must turn the camera off", ar: "على الجميع إطفاء الكاميرا" },
        { en: "Every Friday is Pajama Day", ar: "كل يوم جمعة هو يوم البيجامة" },
        { en: "Everybody must work from the office", ar: "على الجميع العمل من المكتب" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "camera",
        sentence: "Nobody can see my legs. The ___ only shows my top half.",
        hintAr: "الكاميرا.",
      },
      {
        word: "doorbell",
        sentence: "Then the ___ rang.",
        hintAr: "جرس الباب.",
      },
      {
        word: "bark",
        sentence: "Suddenly, Brandon's dog, Max, started to ___ loudly at the door.",
        hintAr: "ينبح.",
      },
      {
        word: "package",
        sentence: "Sorry, everybody. It's a ___. One minute!",
        hintAr: "الطرد.",
      },
      {
        word: "slippers",
        sentence: "Under her desk, she was wearing big pink bunny ___.",
        hintAr: "الخفّان، الشباشب.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 3
  {
    slug: "the-surprise-party",
    order: 3,
    level: "A2",
    tone: "funny",
    icon: "house",
    title: "The Surprise Party",
    titleAr: "حفلة المفاجأة",
    summary: "Thirty people are hiding in the living room. Lisa comes home early.",
    summaryAr: "ثلاثون شخصاً يختبئون في غرفة الجلوس. وتصل ليزا إلى البيت مبكراً.",
    cast: { Dave: "russ", Lisa: "zara" },
    sections: [
      {
        title: "The Secret",
        titleAr: "السر",
        lines: [
          {
            en: "Lisa was going to be forty on Saturday. Her husband, Dave, had a big secret.",
            ar: "كانت ليزا ستبلغ الأربعين يوم السبت. وكان لدى زوجها ديف سرٌّ كبير.",
          },
          {
            en: "He invited thirty people to a surprise party at their house.",
            ar: "دعا ثلاثين شخصاً إلى حفلة مفاجأة في بيتهما.",
          },
          {
            who: "Dave",
            en: "Lisa comes home at seven. Hide in the living room, and be quiet!",
            ar: "تصل ليزا إلى البيت في السابعة. اختبئوا في غرفة الجلوس، والتزموا الصمت!",
          },
          {
            en: "All week, Dave acted strange. He took secret phone calls and hid boxes in the garage.",
            ar: "طوال الأسبوع، تصرّف ديف بغرابة. كان يتلقى مكالمات سرية ويخبّئ الصناديق في المرآب.",
          },
          {
            en: 'Lisa was sad. She thought, "He forgot my birthday."',
            ar: "كانت ليزا حزينة. فكّرت: «لقد نسي عيد ميلادي.»",
          },
        ],
        question: {
          en: "Why was Lisa sad?",
          ar: "لماذا كانت ليزا حزينة؟",
          options: [
            { en: "She lost her job", ar: "فقدت عملها" },
            { en: "She did not like parties", ar: "لم تكن تحب الحفلات" },
            { en: "She thought Dave forgot her birthday", ar: "ظنّت أن ديف نسي عيد ميلادها" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "Too Early",
        titleAr: "مبكراً جداً",
        lines: [
          {
            en: "On Saturday, Lisa left work early. She wanted to go home and cry.",
            ar: "يوم السبت، غادرت ليزا العمل مبكراً. أرادت أن تعود إلى البيت وتبكي.",
          },
          {
            en: "At half past six, she opened the front door. It was very quiet.",
            ar: "في السادسة والنصف، فتحت الباب الأمامي. كان الهدوء شديداً.",
          },
          {
            en: "Too quiet. And there was a pair of shoes under the curtain.",
            ar: "هدوء أكثر من اللازم. وكان هناك زوج من الأحذية تحت الستارة.",
          },
          {
            en: "She heard a small sound from the closet. Then a cough behind the sofa.",
            ar: "سمعت صوتاً خفيفاً من الخزانة. ثم سعالاً من خلف الأريكة.",
          },
          {
            who: "Lisa",
            en: "Somebody is in my house.",
            ar: "هناك شخص في بيتي.",
          },
          {
            en: "Lisa did not scream. She walked backward, very slowly, out of the door.",
            ar: "لم تصرخ ليزا. مشت إلى الخلف ببطء شديد حتى خرجت من الباب.",
          },
        ],
        question: {
          en: "What did Lisa think?",
          ar: "ماذا ظنّت ليزا؟",
          options: [
            { en: "Dave was making dinner", ar: "أن ديف يحضّر العشاء" },
            { en: "Somebody was hiding in her house", ar: "أن شخصاً يختبئ في بيتها" },
            { en: "The house was empty", ar: "أن البيت فارغ" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "The Police",
        titleAr: "الشرطة",
        lines: [
          {
            en: "Outside, Lisa called the police with shaking hands.",
            ar: "في الخارج، اتصلت ليزا بالشرطة بيدين ترتجفان.",
          },
          {
            en: "In five minutes, two officers arrived with flashlights.",
            ar: "بعد خمس دقائق، وصل شرطيان ومعهما مصباحان يدويان.",
          },
          {
            who: "Lisa",
            en: "There is a burglar in my living room. Maybe two!",
            ar: "هناك لصّ في غرفة الجلوس عندي. ربما اثنان!",
          },
          {
            en: "The officers opened the door slowly. Inside, it was dark and quiet.",
            ar: "فتح الشرطيان الباب ببطء. في الداخل، كان المكان مظلماً وهادئاً.",
          },
          {
            en: 'One officer shouted, "Come out with your hands up!"',
            ar: "صاح أحد الشرطيين: «اخرجوا ورفعوا أيديكم!»",
          },
          {
            en: "Then the lights came on, and thirty people stood up with their hands in the air.",
            ar: "ثم أضاءت الأنوار، ووقف ثلاثون شخصاً رافعين أيديهم في الهواء.",
          },
          {
            who: "Dave",
            en: "Surprise?",
            ar: "مفاجأة؟",
          },
        ],
        question: {
          en: "Who was hiding in the house?",
          ar: "من كان يختبئ في البيت؟",
          options: [
            { en: "Two burglars", ar: "لصّان" },
            { en: "Thirty guests", ar: "ثلاثون ضيفاً" },
            { en: "Two police officers", ar: "شرطيان" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "The Best Birthday",
        titleAr: "أفضل عيد ميلاد",
        lines: [
          {
            en: "For a long time, nobody said a word. The officers looked at Lisa. Lisa looked at Dave.",
            ar: "لوقت طويل، لم ينطق أحد بكلمة. نظر الشرطيان إلى ليزا. ونظرت ليزا إلى ديف.",
          },
          {
            en: "Then Lisa started to laugh. She laughed so much that she had to sit down.",
            ar: "ثم بدأت ليزا تضحك. ضحكت كثيراً حتى اضطرت إلى الجلوس.",
          },
          {
            who: "Lisa",
            en: "You didn't forget my birthday!",
            ar: "لم تنسَ عيد ميلادي!",
          },
          {
            who: "Dave",
            en: "Never. I only forgot that you finish work at seven.",
            ar: "أبداً. لقد نسيت فقط أنك تنهين العمل في السابعة.",
          },
          {
            en: "The two officers stayed for an hour. They ate chocolate cake, and one of them even danced.",
            ar: "بقي الشرطيان ساعة. أكلا كعكة الشوكولاتة، ورقص أحدهما أيضاً.",
          },
          {
            who: "Lisa",
            en: "Forty years old, and the police came to my party. Best birthday ever!",
            ar: "أربعون عاماً، وجاءت الشرطة إلى حفلتي. أفضل عيد ميلاد على الإطلاق!",
          },
        ],
        question: {
          en: "What did the officers do at the end?",
          ar: "ماذا فعل الشرطيان في النهاية؟",
          options: [
            { en: "They took Dave away", ar: "أخذا ديف معهما" },
            { en: "They went home angry", ar: "عادا إلى بيتيهما غاضبين" },
            { en: "They stayed and ate cake", ar: "بقيا وأكلا الكعك" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "Why did Lisa come home early?",
      ar: "لماذا عادت ليزا إلى البيت مبكراً؟",
      options: [
        { en: "Her boss sent her home", ar: "أرسلها مديرها إلى البيت" },
        { en: "She forgot her phone at home", ar: "نسيت هاتفها في البيت" },
        { en: "She was sad and wanted to cry at home", ar: "كانت حزينة وأرادت أن تبكي في البيت" },
      ],
      answer: 2,
    },
    words: [
      {
        word: "secret",
        sentence: "Her husband, Dave, had a big ___.",
        hintAr: "السر.",
      },
      {
        word: "closet",
        sentence: "She heard a small sound from the ___.",
        hintAr: "الخزانة.",
      },
      {
        word: "scream",
        sentence: "Lisa did not ___.",
        hintAr: "يصرخ.",
      },
      {
        word: "burglar",
        sentence: "There is a ___ in my living room. Maybe two!",
        hintAr: "اللص.",
      },
      {
        word: "officer",
        sentence: 'One ___ shouted, "Come out with your hands up!"',
        hintAr: "الشرطي، الضابط.",
      },
    ],
  },
  // ───────────────────────────────────────────────────────── 4
  {
    slug: "happy-birthday-stranger",
    order: 4,
    level: "A2",
    tone: "funny",
    icon: "coffee",
    title: "Happy Birthday, Stranger",
    titleAr: "عيد ميلاد سعيد أيها الغريب",
    summary: "It was a first date. It was not Dan's birthday. Nobody told the waiters.",
    summaryAr: "كان موعداً أول. ولم يكن عيد ميلاد دان. ولم يخبر أحدٌ النُّدُل.",
    cast: { Dan: "russ", Chloe: "ash", Waiter: "calm-male" },
    sections: [
      {
        title: "A First Date",
        titleAr: "موعد أول",
        lines: [
          {
            en: "Dan was very nervous. Tonight he had his first date with Chloe, and she chose an expensive restaurant.",
            ar: "كان دان متوتراً جداً. الليلة موعده الأول مع كلوي، وقد اختارت مطعماً غالياً.",
          },
          {
            en: "He arrived twenty minutes early and practiced his best jokes in the bathroom mirror.",
            ar: "وصل قبل موعده بعشرين دقيقة وتدرّب على أفضل نكاته أمام مرآة الحمّام.",
          },
          {
            who: "Waiter",
            en: "Good evening, sir. A table for Dan?",
            ar: "مساء الخير يا سيدي. طاولة باسم دان؟",
          },
          {
            who: "Dan",
            en: "Yes! A table for two, please.",
            ar: "نعم! طاولة لشخصين من فضلك.",
          },
          {
            en: "The waiter smiled in a strange way. Dan did not notice.",
            ar: "ابتسم النادل ابتسامة غريبة. ولم يلاحظ دان ذلك.",
          },
          {
            en: "Chloe arrived at seven. She looked beautiful, and Dan forgot all his jokes.",
            ar: "وصلت كلوي في السابعة. كانت جميلة، ونسي دان كل نكاته.",
          },
        ],
        question: {
          en: "How did Dan feel before the date?",
          ar: "كيف شعر دان قبل الموعد؟",
          options: [
            { en: "Very nervous", ar: "متوتراً جداً" },
            { en: "Bored", ar: "ملولاً" },
            { en: "Angry", ar: "غاضباً" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "The Cake",
        titleAr: "الكعكة",
        lines: [
          {
            en: "At seven thirty, the lights suddenly went out. The restaurant was dark.",
            ar: "في السابعة والنصف، انطفأت الأنوار فجأة. صار المطعم مظلماً.",
          },
          {
            en: "Then five waiters came to Dan's table with a big chocolate cake and a lot of sparklers.",
            ar: "ثم جاء خمسة نُدُل إلى طاولة دان ومعهم كعكة شوكولاتة كبيرة وكثير من الشماريخ المتلألئة.",
          },
          {
            en: 'They sang, "Happy birthday to you, happy birthday, dear Dan!"',
            ar: "وغنّوا: «عيد ميلاد سعيد لك، عيد ميلاد سعيد يا عزيزي دان!»",
          },
          {
            who: "Dan",
            en: "But it's not my... it's not...",
            ar: "لكن ليس عيد... ليس...",
          },
          {
            who: "Chloe",
            en: "It's your birthday, and you didn't tell me?",
            ar: "إنه عيد ميلادك ولم تخبرني؟",
          },
          {
            en: "Everyone in the restaurant was looking at him. All the people were clapping.",
            ar: "كان كل من في المطعم ينظرون إليه. وكان الجميع يصفّقون.",
          },
        ],
        question: {
          en: "What did the waiters bring to Dan's table?",
          ar: "ماذا أحضر النُّدُل إلى طاولة دان؟",
          options: [
            { en: "Two cups of coffee", ar: "فنجانَي قهوة" },
            { en: "A bottle of water", ar: "زجاجة ماء" },
            { en: "A chocolate cake with sparklers", ar: "كعكة شوكولاتة بالشماريخ" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "A Small Lie",
        titleAr: "كذبة صغيرة",
        lines: [
          {
            en: "Dan opened his mouth to tell the truth. But Chloe was smiling at him, and the whole restaurant was waiting.",
            ar: "فتح دان فمه ليقول الحقيقة. لكن كلوي كانت تبتسم له، والمطعم كله ينتظر.",
          },
          {
            who: "Dan",
            en: "Yes... well... I didn't want to make a big deal.",
            ar: "نعم... حسناً... لم أرد أن أصنع من الأمر قضية.",
          },
          {
            en: "He closed his eyes, made a wish, and blew out the candles. Everybody cheered.",
            ar: "أغمض عينيه وتمنّى أمنية وأطفأ الشموع. وهتف الجميع.",
          },
          {
            en: "The cake was amazing. Dan and Chloe ate half of it and laughed a lot.",
            ar: "كانت الكعكة رائعة. أكل دان وكلوي نصفها وضحكا كثيراً.",
          },
          {
            en: "Then a man at the next table stood up. He looked confused.",
            ar: "ثم وقف رجل على الطاولة المجاورة. بدا مرتبكاً.",
          },
          {
            who: "Waiter",
            en: "Oh no. There are two Dans tonight.",
            ar: "يا للهول. هناك اثنان باسم دان الليلة.",
          },
        ],
        question: {
          en: "What did Dan do when the cake arrived?",
          ar: "ماذا فعل دان عندما وصلت الكعكة؟",
          options: [
            { en: "He told everyone the truth", ar: "أخبر الجميع بالحقيقة" },
            { en: "He pretended it was his birthday", ar: "تظاهر بأنه عيد ميلاده" },
            { en: "He left the restaurant", ar: "غادر المطعم" },
          ],
          answer: 1,
          evidence: 1,
        },
      },
      {
        title: "Two Dans",
        titleAr: "اثنان باسم دان",
        lines: [
          {
            en: "The other man was also called Dan. Today was his fiftieth birthday, and his wife had a surprise for him.",
            ar: "كان الرجل الآخر يُدعى دان أيضاً. واليوم عيد ميلاده الخمسون، وزوجته أعدّت له مفاجأة.",
          },
          {
            en: "But the cake and all the sparklers went to the wrong table.",
            ar: "لكن الكعكة وكل الشماريخ ذهبت إلى الطاولة الخطأ.",
          },
          {
            who: "Dan",
            en: "I'm so sorry. It's not my birthday. I only ate your cake.",
            ar: "أنا آسف جداً. ليس عيد ميلادي. أنا فقط أكلت كعكتك.",
          },
          {
            en: "The old Dan laughed so hard that he cried. Then he invited them both to sit at his table.",
            ar: "ضحك دان الأكبر سناً حتى دمعت عيناه. ثم دعاهما إلى الجلوس إلى طاولته.",
          },
          {
            en: "The waiters brought a second cake. This time, everyone sang the right name to the right man.",
            ar: "أحضر النُّدُل كعكة ثانية. وهذه المرة غنّى الجميع الاسم الصحيح للرجل الصحيح.",
          },
          {
            who: "Chloe",
            en: "I like you more when you tell the truth, Dan. Maybe next time, we can start with that.",
            ar: "أحبك أكثر عندما تقول الحقيقة يا دان. ربما في المرة القادمة نبدأ بها.",
          },
          {
            who: "Dan",
            en: "Next time? You want a second date?",
            ar: "في المرة القادمة؟ هل تريدين موعداً ثانياً؟",
          },
        ],
        question: {
          en: "Why was there a second Dan at the restaurant?",
          ar: "لماذا كان هناك دان ثانٍ في المطعم؟",
          options: [
            { en: "It was his fiftieth birthday", ar: "كان عيد ميلاده الخمسين" },
            { en: "He worked there", ar: "كان يعمل هناك" },
            { en: "He was Chloe's father", ar: "كان والد كلوي" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
    ],
    closing: {
      en: "What did Chloe say she liked about Dan?",
      ar: "ما الذي قالت كلوي إنه يعجبها في دان؟",
      options: [
        { en: "His funny jokes", ar: "نكاته المضحكة" },
        { en: "When he tells the truth", ar: "حين يقول الحقيقة" },
        { en: "His expensive gifts", ar: "هداياه الغالية" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "date",
        sentence: "Tonight he had his first ___ with Chloe, and she chose an expensive restaurant.",
        hintAr: "الموعد الغرامي.",
      },
      {
        word: "jokes",
        sentence:
          "He arrived twenty minutes early and practiced his best ___ in the bathroom mirror.",
        hintAr: "النكات.",
      },
      {
        word: "waiter",
        sentence: "The ___ smiled in a strange way.",
        hintAr: "النادل.",
      },
      {
        word: "truth",
        sentence: "Dan opened his mouth to tell the ___.",
        hintAr: "الحقيقة.",
      },
      {
        word: "wish",
        sentence: "He closed his eyes, made a ___, and blew out the candles.",
        hintAr: "أمنية.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 5
  {
    slug: "the-quiet-neighbor",
    order: 5,
    level: "A2",
    tone: "serious",
    icon: "house",
    title: "The Quiet Neighbor",
    titleAr: "الجار الهادئ",
    summary: "Mr. Hall never says hello. On Wednesday, his light is off.",
    summaryAr: "السيد هول لا يلقي التحية أبداً. وفي يوم الأربعاء، كان نوره مطفأ.",
    cast: { Jenny: "ash", "Mr. Hall": "calm-male", Peter: "russ" },
    sections: [
      {
        title: "Good Morning, Mr. Hall",
        titleAr: "صباح الخير يا سيد هول",
        lines: [
          {
            en: "Jenny moved into her new apartment in the spring. Her neighbor in 4B was an old man called Mr. Hall.",
            ar: "انتقلت جيني إلى شقتها الجديدة في الربيع. وكان جارها في 4B رجلاً عجوزاً اسمه السيد هول.",
          },
          {
            en: "Every morning, she said hello. Every morning, he only nodded.",
            ar: "كل صباح كانت تقول له صباح الخير. وكل صباح كان يكتفي بإيماءة من رأسه.",
          },
          {
            en: "He lived alone. He never had visitors. Every day at eight, he watered the plants in front of his door.",
            ar: "كان يعيش وحده. ولم تكن له زيارات. وكل يوم في الثامنة، كان يسقي النباتات أمام بابه.",
          },
          {
            who: "Jenny",
            en: "Some people just don't like to talk.",
            ar: "بعض الناس لا يحبون الكلام ببساطة.",
          },
          {
            en: 'So Jenny stopped trying. After three months, she only said, "Morning," and walked away.',
            ar: "فتوقفت جيني عن المحاولة. وبعد ثلاثة أشهر، صارت تقول فقط: «صباح الخير» وتمضي.",
          },
        ],
        question: {
          en: "What did Mr. Hall do when Jenny said hello?",
          ar: "ماذا كان يفعل السيد هول عندما تقول له جيني صباح الخير؟",
          options: [
            { en: "He only nodded", ar: "كان يومئ برأسه فقط" },
            { en: "He talked for a long time", ar: "كان يتحدث طويلاً" },
            { en: "He closed his door", ar: "كان يغلق بابه" },
          ],
          answer: 0,
          evidence: 1,
        },
      },
      {
        title: "No Water on Wednesday",
        titleAr: "لا ماء يوم الأربعاء",
        lines: [
          {
            en: "On Wednesday morning, Jenny walked past 4B. The plants were dry.",
            ar: "صباح الأربعاء، مرّت جيني أمام 4B. كانت النباتات جافة.",
          },
          {
            en: "The light in the apartment was off. There was a newspaper on the floor.",
            ar: "كان النور في الشقة مطفأً. وكانت هناك صحيفة على الأرض.",
          },
          {
            en: "On Thursday, there were two newspapers. The plants looked sad.",
            ar: "يوم الخميس، صارت هناك صحيفتان. وبدت النباتات حزينة.",
          },
          {
            who: "Jenny",
            en: "That's strange. He always waters them at eight.",
            ar: "هذا غريب. إنه يسقيها دائماً في الثامنة.",
          },
          {
            en: "On Friday, she knocked on the door. Nobody answered. She knocked again, harder.",
            ar: "يوم الجمعة، طرقت الباب. لم يجب أحد. طرقت مرة أخرى بقوة أكبر.",
          },
          {
            en: "Then she heard a very weak voice from inside.",
            ar: "ثم سمعت صوتاً ضعيفاً جداً من الداخل.",
          },
          {
            who: "Mr. Hall",
            en: "Help... please.",
            ar: "النجدة... من فضلكم.",
          },
        ],
        question: {
          en: "How did Jenny know something was wrong?",
          ar: "كيف عرفت جيني أن هناك خطباً ما؟",
          options: [
            { en: "She heard loud music", ar: "سمعت موسيقى عالية" },
            {
              en: "The plants were dry and the newspapers stayed on the floor",
              ar: "كانت النباتات جافة وبقيت الصحف على الأرض",
            },
            { en: "Mr. Hall called her", ar: "اتصل بها السيد هول" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "The Door",
        titleAr: "الباب",
        lines: [
          {
            en: "Jenny ran downstairs and found the building manager, Peter.",
            ar: "ركضت جيني إلى الطابق السفلي ووجدت مدير المبنى، بيتر.",
          },
          {
            who: "Jenny",
            en: "Peter, quick! Mr. Hall needs help. I need the key to 4B!",
            ar: "بيتر، بسرعة! السيد هول يحتاج إلى مساعدة. أحتاج مفتاح 4B!",
          },
          {
            who: "Peter",
            en: "Fourth floor? I'm coming!",
            ar: "الطابق الرابع؟ أنا قادم!",
          },
          {
            en: "He ran up the stairs with the key, and Jenny ran behind him.",
            ar: "ركض صاعداً الدرج ومعه المفتاح، وركضت جيني خلفه.",
          },
          {
            en: "They opened the door and found Mr. Hall on the bathroom floor. He was very pale and very cold.",
            ar: "فتحا الباب ووجدا السيد هول على أرضية الحمّام. كان شاحباً جداً وبارداً جداً.",
          },
          {
            who: "Mr. Hall",
            en: "I fell on Tuesday night. I couldn't reach my phone.",
            ar: "سقطتُ ليلة الثلاثاء. لم أستطع الوصول إلى هاتفي.",
          },
          {
            en: "Peter called an ambulance. In ten minutes, two nurses carried Mr. Hall out on a bed with wheels.",
            ar: "اتصل بيتر بسيارة الإسعاف. وبعد عشر دقائق، حمل ممرضان السيد هول على سرير بعجلات.",
          },
        ],
        question: {
          en: "Why couldn't Mr. Hall call for help?",
          ar: "لماذا لم يستطع السيد هول طلب المساعدة؟",
          options: [
            { en: "His phone was broken", ar: "كان هاتفه معطلاً" },
            { en: "He did not know the number", ar: "لم يكن يعرف الرقم" },
            { en: "He could not reach his phone", ar: "لم يستطع الوصول إلى هاتفه" },
          ],
          answer: 2,
          evidence: 5,
        },
      },
      {
        title: "Visiting Hours",
        titleAr: "ساعات الزيارة",
        lines: [
          {
            en: "Mr. Hall stayed in the hospital for two weeks. He had a broken hip, but the doctors said he was going to be fine.",
            ar: "بقي السيد هول في المستشفى أسبوعين. كان لديه كسر في الورك، لكن الأطباء قالوا إنه سيتعافى.",
          },
          {
            en: "Jenny visited him on Sunday with a small plant.",
            ar: "زارته جيني يوم الأحد ومعها نبتة صغيرة.",
          },
          {
            who: "Mr. Hall",
            en: "Why did you knock on my door?",
            ar: "لماذا طرقتِ بابي؟",
          },
          {
            who: "Jenny",
            en: "Because you water your plants at eight every day. And on Wednesday, you didn't.",
            ar: "لأنك تسقي نباتاتك في الثامنة كل يوم. وفي الأربعاء لم تفعل.",
          },
          {
            en: "Mr. Hall looked at her for a long time. Then he smiled for the first time.",
            ar: "نظر السيد هول إليها طويلاً. ثم ابتسم لأول مرة.",
          },
          {
            en: 'Now, every morning in the building, somebody says, "Good morning, Jenny!" first.',
            ar: "والآن، كل صباح في المبنى، هناك من يقول أولاً: «صباح الخير يا جيني!»",
          },
        ],
        question: {
          en: "Why did Jenny knock on Mr. Hall's door?",
          ar: "لماذا طرقت جيني باب السيد هول؟",
          options: [
            { en: "He did not water his plants", ar: "لم يسقِ نباتاته" },
            { en: "She wanted to borrow something", ar: "أرادت أن تستعير شيئاً" },
            { en: "There was a party", ar: "كانت هناك حفلة" },
          ],
          answer: 0,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "What was different in the building at the end?",
      ar: "ما الذي اختلف في المبنى في النهاية؟",
      options: [
        {
          en: "People said good morning to Jenny first",
          ar: "صار الناس يقولون صباح الخير لجيني أولاً",
        },
        { en: "Mr. Hall moved to another building", ar: "انتقل السيد هول إلى مبنى آخر" },
        { en: "Jenny moved to a new apartment", ar: "انتقلت جيني إلى شقة جديدة" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "newspaper",
        sentence: "There was a ___ on the floor.",
        hintAr: "الصحيفة.",
      },
      {
        word: "weak",
        sentence: "Then she heard a very ___ voice from inside.",
        hintAr: "ضعيف.",
      },
      {
        word: "knock",
        sentence: "Why did you ___ on my door?",
        hintAr: "يطرق.",
      },
      {
        word: "ambulance",
        sentence: "Peter called an ___.",
        hintAr: "سيارة الإسعاف.",
      },
      {
        word: "plant",
        sentence: "Jenny visited him on Sunday with a small ___.",
        hintAr: "النبتة.",
      },
    ],
  },
];
