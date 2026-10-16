import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B2, third set — the same step as the first two: less common words
 * (discrepancy, installments, patriarch, accomplice), sentences that carry more than one
 * idea, and questions that ask what something means or implies rather than what happened.
 * Both were written against everything already in the library (the passages, the Daily
 * Lessons, the Stories), so they repeat none of them
 * (see scripts/check-passage-duplicates.ts).
 */

export const B2_PASSAGES_PART_3: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 7
  {
    slug: "the-discrepancy",
    order: 7,
    level: "B2",
    tone: "serious",
    icon: "briefcase",
    title: "The Discrepancy",
    titleAr: "التباين",
    summary: "Claire's job was to check that everything matched. Then something didn't.",
    summaryAr: "كان عمل كلير أن تتأكد من أن كل شيء متطابق. ثم لم يعد كذلك.",
    cast: { Claire: "autumn", "Mr. Callahan": "russ", "Mrs. Bell": "zara" },
    sections: [
      {
        title: "A Small Number",
        titleAr: "رقم صغير",
        lines: [
          {
            en: "Claire Donovan was three months into an internship at the Harbor Light Foundation, a charity serving hot meals to nine hundred people a night.",
            ar: "كانت كلير دونوفان قد أمضت ثلاثة أشهر في تدريب لدى مؤسسة «هاربر لايت»، وهي جمعية خيرية تقدّم وجبات ساخنة لتسعمئة شخص كل ليلة.",
          },
          {
            en: "Her job was dull and exact: match each invoice to the bank statements. For eleven weeks, everything had matched.",
            ar: "كان عملها رتيباً ودقيقاً: أن تطابق كل فاتورة مع كشوف الحساب المصرفي. وطوال أحد عشر أسبوعاً كان كل شيء متطابقاً.",
          },
          {
            en: "Then, on a gray Thursday, she found a discrepancy: Brightline Supplies had been paid twice for the same invoice, again and again.",
            ar: "ثم في يوم خميس رمادي وجدت تبايناً: فقد دُفع لشركة «برايتلاين للتوريدات» مرتين عن الفاتورة نفسها، مراراً وتكراراً.",
          },
          {
            en: "She checked three times, since an intern's mistake is likelier than an institution's. By evening, the answer was clear: thirty-eight thousand dollars, over three years.",
            ar: "تحقّقت ثلاث مرات، لأن خطأ المتدرّبة أرجح من خطأ مؤسسة. وبحلول المساء كان الجواب واضحاً: ثمانية وثلاثون ألف دولار، على مدى ثلاث سنوات.",
          },
          {
            en: "Mr. Callahan, the founder, had hired her when nobody else answered. She could pretend she had never seen it, and that thought frightened her more than the number.",
            ar: "كان السيد كالاهان، المؤسِّس، قد وظّفها حين لم يردّ عليها أحد غيره. وكان بوسعها أن تتظاهر بأنها لم ترَ شيئاً، وهذا الخاطر أخافها أكثر من الرقم.",
          },
        ],
        question: {
          en: "Why did Claire check the figures three times?",
          ar: "لماذا راجعت كلير الأرقام ثلاث مرات؟",
          options: [
            { en: "She enjoyed working with numbers", ar: "كانت تستمتع بالعمل مع الأرقام" },
            {
              en: "She thought the mistake might be her own",
              ar: "ظنّت أن الخطأ قد يكون خطأها هي",
            },
            { en: "Mr. Callahan had told her to", ar: "كان السيد كالاهان قد طلب منها ذلك" },
            { en: "She wanted to impress her supervisor", ar: "أرادت أن تُعجب مشرفها" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "Mrs. Bell",
        titleAr: "السيدة بيل",
        lines: [
          {
            en: "The next morning, Claire took her folder to Mrs. Bell, the bookkeeper, who had worked there for thirty-one years and was said to remember every dollar the charity had ever spent.",
            ar: "في صباح اليوم التالي حملت كلير ملفها إلى السيدة بيل، المحاسبة، التي عملت هناك واحداً وثلاثين عاماً، ويُقال إنها تتذكر كل دولار أنفقته الجمعية.",
          },
          {
            who: "Claire",
            en: "I'm probably wrong, but a vendor called Brightline seems to have been paid more than once.",
            ar: "ربما أكون مخطئة، لكن يبدو أن مورّداً اسمه «برايتلاين» قد دُفع له أكثر من مرة.",
          },
          {
            en: "Mrs. Bell didn't open the folder. She glanced at the door, then at Claire, and lowered her voice.",
            ar: "لم تفتح السيدة بيل الملف. نظرت إلى الباب ثم إلى كلير، وخفضت صوتها.",
          },
          {
            who: "Mrs. Bell",
            en: "Every few years, somebody asks me about Brightline. And every time, they stop asking.",
            ar: "كل بضع سنوات يسألني أحدهم عن «برايتلاين». وفي كل مرة يكفّ عن السؤال.",
          },
          {
            en: "Claire waited for more. Instead, Mrs. Bell turned back to her screen, as though the conversation had been a draft she'd decided not to send.",
            ar: "انتظرت كلير المزيد. لكن السيدة بيل عادت إلى شاشتها، كأن المحادثة مسودة قرّرت ألا ترسلها.",
          },
          {
            who: "Mrs. Bell",
            en: "Numbers have no loyalties, dear. People do. Don't confuse the two. Check what you've seen, then decide who you want to be once you've seen it.",
            ar: "الأرقام ليست لها ولاءات يا عزيزتي. الناس لهم ولاءات. لا تخلطي بين الأمرين. تحقّقي مما رأيتِ، ثم قرّري من تريدين أن تكوني بعد أن رأيتِه.",
          },
        ],
        question: {
          en: "What does Mrs. Bell imply with her remark about loyalties?",
          ar: "ماذا تلمّح السيدة بيل بملاحظتها عن الولاءات؟",
          options: [
            { en: "Accounting software cannot be trusted", ar: "لا يمكن الوثوق ببرامج المحاسبة" },
            {
              en: "Claire should ignore the figures she found",
              ar: "على كلير أن تتجاهل الأرقام التي وجدتها",
            },
            { en: "She was angry with Brightline", ar: "كانت غاضبة من «برايتلاين»" },
            {
              en: "Loyalty to a person may keep people silent about what the numbers show",
              ar: "قد يدفع الولاء لشخصٍ ما الناس إلى السكوت عمّا تُظهره الأرقام",
            },
          ],
          answer: 3,
          evidence: 5,
        },
      },
      {
        title: "The Weekend",
        titleAr: "عطلة نهاية الأسبوع",
        lines: [
          {
            en: "Claire spent the weekend at her kitchen table, with the bank statements spread around her like a map. By Sunday night, nothing about the picture was ambiguous.",
            ar: "قضت كلير عطلة نهاية الأسبوع إلى طاولة مطبخها، وكشوف الحساب منشورة حولها كأنها خريطة. وبحلول مساء الأحد لم يكن في الصورة ما هو غامض.",
          },
          {
            en: "The duplicate payments had gone to an account bearing the vendor's name but belonging to someone else, and every one had been approved by the same signature: Raymond Fisher, the treasurer.",
            ar: "كانت المدفوعات المكررة قد ذهبت إلى حساب يحمل اسم المورّد لكنه يعود إلى شخص آخر، وكلٌّ منها اعتُمد بالتوقيع نفسه: ريموند فيشر، أمين الصندوق.",
          },
          {
            en: "She knew Raymond Fisher. Everyone did. He carried peppermints in his pockets, never missed a fundraising dinner, and had been Mr. Callahan's closest friend since boyhood.",
            ar: "كانت تعرف ريموند فيشر. وكان الجميع يعرفونه. يحمل النعناع في جيوبه، ولا يفوّت عشاءً لجمع التبرعات، وكان أقرب أصدقاء السيد كالاهان منذ الصبا.",
          },
          {
            en: "She printed everything, put it in an envelope and slept for two hours. At seven, she asked for fifteen minutes of Mr. Callahan's time.",
            ar: "طبعت كل شيء ووضعته في ظرف ونامت ساعتين. وفي السابعة طلبت من السيد كالاهان خمس عشرة دقيقة من وقته.",
          },
          {
            en: "She was no longer afraid of being wrong. She was afraid of being right.",
            ar: "لم تعد تخاف أن تكون مخطئة. صارت تخاف أن تكون على صواب.",
          },
        ],
        question: {
          en: "What does the last sentence suggest about Claire?",
          ar: "ماذا توحي الجملة الأخيرة عن كلير؟",
          options: [
            { en: "She no longer trusted her own calculations", ar: "لم تعد تثق بحساباتها" },
            {
              en: "She dreaded what her discovery would mean for people she respected",
              ar: "كانت تخشى ما سيعنيه اكتشافها لأناس تحترمهم",
            },
            { en: "She wanted to avoid Mr. Callahan", ar: "أرادت أن تتجنب السيد كالاهان" },
            { en: "She had decided to say nothing", ar: "كانت قد قررت ألا تقول شيئاً" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "Fifteen Minutes",
        titleAr: "خمس عشرة دقيقة",
        lines: [
          {
            en: "Mr. Callahan received her with tea and the warmth of a man who had never turned anyone away. Claire described what she had found in a voice that shook only twice.",
            ar: "استقبلها السيد كالاهان بالشاي ودفء رجل لم يردّ أحداً قط. وصفت كلير ما وجدته بصوت ارتجف مرتين فقط.",
          },
          {
            en: "He listened without interrupting. When she finished, he took off his glasses, and for a long time the only sound was the old radiator.",
            ar: "أصغى دون أن يقاطعها. وحين انتهت خلع نظارته، ولوقت طويل لم يكن هناك إلا صوت المدفأة القديمة.",
          },
          {
            who: "Mr. Callahan",
            en: "I wondered who would find it first.",
            ar: "كنت أتساءل من سيكتشفه أولاً.",
          },
          {
            en: "Claire stared at him. It took her a moment to understand that this was not a surprise, but a confession of another kind.",
            ar: "حدّقت كلير فيه. واحتاجت إلى لحظة لتفهم أن هذا لم يكن مفاجأة، بل اعترافاً من نوع آخر.",
          },
          {
            who: "Mr. Callahan",
            en: "I've known for two years. Raymond's wife was ill, the bills were enormous, and he swore he'd repay everything. I believed him because I wanted to. I even replaced some of the money myself.",
            ar: "أعرف منذ سنتين. كانت زوجة ريموند مريضة، والفواتير هائلة، وأقسم أنه سيسدّد كل شيء. صدّقته لأنني أردت ذلك. بل عوّضت جزءاً من المال بنفسي.",
          },
          {
            who: "Mr. Callahan",
            en: "The worst part was never the money. It was how easy it was to stay silent.",
            ar: "الجزء الأسوأ لم يكن المال قط. كان مدى سهولة التزام الصمت.",
          },
        ],
        question: {
          en: "What can we conclude about Mr. Callahan from his words?",
          ar: "ماذا نستنتج عن السيد كالاهان من كلامه؟",
          options: [
            { en: "He had stolen the money himself", ar: "كان هو من سرق المال" },
            { en: "He had never suspected a problem", ar: "لم يشتبه قط بوجود مشكلة" },
            {
              en: "He had known about the problem and chosen not to act",
              ar: "كان يعرف بالمشكلة واختار ألا يتصرف",
            },
            { en: "He planned to blame the intern", ar: "كان ينوي أن يلوم المتدرّبة" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "Everything Matched",
        titleAr: "كل شيء متطابق",
        lines: [
          {
            en: "On Monday, Claire sent the envelope to the chairwoman of the board, with a plain email: no adjectives, her full name at the bottom.",
            ar: "يوم الاثنين أرسلت كلير الظرف إلى رئيسة مجلس الإدارة، مع رسالة بسيطة: بلا صفات، واسمها الكامل في أسفلها.",
          },
          {
            en: "Raymond Fisher resigned before lunch and agreed to repay every dollar in monthly installments.",
            ar: "استقال ريموند فيشر قبل الغداء ووافق على ردّ كل دولار بأقساط شهرية.",
          },
          {
            en: 'At the annual dinner, Mr. Callahan told four hundred donors all of it. From the back of the room, Claire counted him saying "I" eleven times.',
            ar: "في العشاء السنوي أخبر السيد كالاهان أربعمئة متبرّع بكل شيء. ومن آخر القاعة عدّت كلير كم مرة قال «أنا»: إحدى عشرة مرة.",
          },
          {
            en: "She expected the donations to collapse. Instead, they rose by a fifth: people trust a charity more when it shows them its worst day.",
            ar: "توقعت أن تنهار التبرعات. لكنها ارتفعت بمقدار الخُمس: فالناس يثقون بالجمعية أكثر حين تُريهم أسوأ أيامها.",
          },
          {
            en: "A few weeks later, Mrs. Bell put a mug of tea on Claire's desk.",
            ar: "بعد أسابيع قليلة وضعت السيدة بيل كوب شاي على مكتب كلير.",
          },
          {
            who: "Mrs. Bell",
            en: "Every few years, somebody asks. You are the first one who didn't stop.",
            ar: "كل بضع سنوات يسأل أحدهم. أنتِ أول من لم يتوقف.",
          },
          {
            en: "Claire picked up the mug. The next invoice was already waiting on her screen. It matched.",
            ar: "رفعت كلير الكوب. كانت الفاتورة التالية تنتظرها على الشاشة. لقد كانت متطابقة.",
          },
        ],
        question: {
          en: "Why did the donations increase after Mr. Callahan's speech?",
          ar: "لماذا ازدادت التبرعات بعد خطاب السيد كالاهان؟",
          options: [
            { en: "The foundation spent less on dinners", ar: "أنفقت المؤسسة أقل على العشاءات" },
            {
              en: "The donors felt sorry for the foundation",
              ar: "شعر المتبرعون بالأسى على المؤسسة",
            },
            { en: "Raymond Fisher gave a large gift", ar: "قدّم ريموند فيشر هبة كبيرة" },
            {
              en: "People trusted an organization that was honest about its mistakes",
              ar: "وثق الناس بمؤسسة تصدق في الحديث عن أخطائها",
            },
          ],
          answer: 3,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "Which sentence best expresses the main idea of the story?",
      ar: "أي جملة تعبّر على أفضل وجه عن الفكرة الرئيسة للقصة؟",
      options: [
        {
          en: "Integrity sometimes means acting when staying silent would be easier",
          ar: "النزاهة تعني أحياناً أن تتصرف حين يكون السكوت أسهل",
        },
        {
          en: "Charities should not hire interns",
          ar: "ينبغي ألا توظّف الجمعيات الخيرية متدرّبين",
        },
        { en: "Old friends can always be trusted", ar: "يمكن الوثوق بالأصدقاء القدامى دائماً" },
        { en: "Numbers matter more than people", ar: "الأرقام أهم من الناس" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "discrepancy",
        sentence: "Then, on a gray Thursday, she found a ___:",
        hintAr: "تباين.",
      },
      {
        word: "invoice",
        sentence: "Her job was dull and exact: match each ___ to the bank statements.",
        hintAr: "فاتورة.",
      },
      {
        word: "loyalties",
        sentence: "Numbers have no ___, dear.",
        hintAr: "ولاءات.",
      },
      {
        word: "treasurer",
        sentence: "approved by the same signature: Raymond Fisher, the ___.",
        hintAr: "أمين الصندوق.",
      },
      {
        word: "installments",
        sentence: "agreed to repay every dollar in monthly ___.",
        hintAr: "أقساط.",
      },
      {
        word: "donors",
        sentence: "Mr. Callahan told four hundred ___ all of it.",
        hintAr: "متبرّعون.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 8
  {
    slug: "the-flamingo",
    order: 8,
    level: "B2",
    tone: "funny",
    icon: "house",
    title: "The Flamingo",
    titleAr: "الفلامنغو",
    summary: "Nobody had ever admitted buying it. Everybody had given it away.",
    summaryAr: "لم يعترف أحد قط بأنه اشتراه. لكن الجميع أهدوه لغيرهم.",
    cast: { Ellie: "ash", "Uncle Rick": "russ", "Aunt Pam": "zara", "Grandpa Joe": "calm-male" },
    sections: [
      {
        title: "The Rules",
        titleAr: "القواعد",
        lines: [
          {
            en: "In the Whitfield family, the holiday gift exchange had one unbreakable tradition, and it had nothing to do with generosity. It was called the Flamingo.",
            ar: "في عائلة ويتفيلد كان لتبادل الهدايا في العطلة تقليد واحد لا يُمسّ، وليس له علاقة بالكرم. كان اسمه «الفلامنغو».",
          },
          {
            en: "The Flamingo was a brass lamp in the shape of a flamingo wearing sunglasses. It had first appeared twelve years ago, wrapped in newspaper, and nobody had ever admitted buying it.",
            ar: "كان الفلامنغو مصباحاً نحاسياً على شكل طائر فلامنغو يضع نظارة شمسية. ظهر أول مرة قبل اثنتي عشرة سنة، ملفوفاً في ورق صحف، ولم يعترف أحد قط بأنه اشتراه.",
          },
          {
            en: "Since then, it had passed from relative to relative, reappearing every December in new paper before a new victim.",
            ar: "ومنذ ذلك الحين انتقل من قريب إلى قريب، ويعود كل ديسمبر بورق جديد أمام ضحية جديدة.",
          },
          {
            en: "The rules were unwritten but sacred: look delighted, never reveal where it came from, and pass it on within a year.",
            ar: "وكانت القواعد غير مكتوبة لكنها مقدسة: أظهر السعادة، ولا تكشف مصدره، ومرّره خلال عام.",
          },
          {
            en: "Aunt Pam, the family historian, kept a chart on her fridge: seven households, four kinds of wrapping paper and one failed attempt to bury it in her garden.",
            ar: "كانت العمة بام، مؤرخة العائلة، تحتفظ بجدول على ثلاجتها: سبعة بيوت، وأربعة أنواع من ورق التغليف، ومحاولة فاشلة واحدة لدفنه في حديقتها.",
          },
        ],
        question: {
          en: "Why does the family keep passing the lamp around?",
          ar: "لماذا تواصل العائلة تمرير المصباح؟",
          options: [
            { en: "They believe it is valuable", ar: "يعتقدون أنه ثمين" },
            { en: "Nobody has the courage to throw it away", ar: "لا أحد يملك الشجاعة ليرميه" },
            {
              en: "Passing it on has become a game the whole family enjoys",
              ar: "أصبح تمريره لعبة تستمتع بها العائلة كلها",
            },
            {
              en: "It is the only gift they can afford",
              ar: "إنه الهدية الوحيدة التي يستطيعون شراءها",
            },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Victim",
        titleAr: "الضحية",
        lines: [
          {
            en: "This year, the lamp landed on Ellie. She unwrapped the box slowly while thirty relatives pretended not to watch.",
            ar: "هذا العام وقع المصباح على إيلي. فتحت الصندوق ببطء بينما يتظاهر ثلاثون من أقاربها بأنهم لا يراقبون.",
          },
          {
            en: "She recognized the shape through the paper: the long neck, the tiny sunglasses. The room went silent, and a cousin coughed to hide a laugh.",
            ar: "عرفت الشكل من خلال الورق: العنق الطويل، والنظارة الشمسية الصغيرة. ساد الصمت في الغرفة، وسعل ابن عم ليخفي ضحكة.",
          },
          {
            who: "Ellie",
            en: "Oh. Wow. It's... exactly what I wanted.",
            ar: "آه. يا للروعة. إنه... بالضبط ما كنت أريده.",
          },
          {
            en: "Across the table, Uncle Rick's face was a masterpiece of innocence. It was so perfect that she immediately suspected him.",
            ar: "على الجهة المقابلة من الطاولة كان وجه العم ريك تحفة من البراءة. كان كاملاً إلى درجة أنها اشتبهت فيه على الفور.",
          },
          {
            who: "Uncle Rick",
            en: "I've never seen that thing in my life.",
            ar: "لم أرَ هذا الشيء في حياتي.",
          },
          {
            en: "Ellie now had twelve months to find a victim of her own. Every obvious target had already been used. Only one person had never received the Flamingo: Grandpa Joe, the eighty-three-year-old patriarch.",
            ar: "صار أمام إيلي اثنا عشر شهراً لتجد ضحيتها. فقد استُخدم كل هدف واضح من قبل. ولم يكن هناك إلا شخص واحد لم يتلقَّ الفلامنغو من قبل: الجدّ جو، كبير العائلة ذو الثالثة والثمانين.",
          },
        ],
        question: {
          en: "What can we infer from the way Uncle Rick looked?",
          ar: "ماذا نستنتج من هيئة العم ريك؟",
          options: [
            { en: "He was angry with Ellie", ar: "كان غاضباً من إيلي" },
            { en: "He had never seen the lamp", ar: "لم يرَ المصباح من قبل" },
            { en: "He wanted to keep the lamp for himself", ar: "أراد أن يحتفظ بالمصباح لنفسه" },
            {
              en: "He was probably the one who had given it to her",
              ar: "ربما كان هو من أهداه إليها",
            },
          ],
          answer: 3,
          evidence: 3,
        },
      },
      {
        title: "Operation Flamingo",
        titleAr: "عملية الفلامنغو",
        lines: [
          {
            en: 'Ellie spent eleven months planning. She considered a box marked "vacuum cleaner," then a fake birthday cake, and rejected both: her grandfather could smell a trick from three rooms away.',
            ar: "قضت إيلي أحد عشر شهراً في التخطيط. فكّرت في صندوق مكتوب عليه «مكنسة كهربائية»، ثم في كعكة عيد ميلاد مزيفة، ورفضت الفكرتين: فجدّها يشمّ الحيلة من ثلاث غرف.",
          },
          {
            en: "In October, she confessed everything to Aunt Pam, who gasped and then smiled, like a woman who had waited years for an accomplice.",
            ar: "في أكتوبر اعترفت بكل شيء للعمة بام، فشهقت ثم ابتسمت، كامرأة انتظرت سنوات شريكاً في الجريمة.",
          },
          {
            who: "Aunt Pam",
            en: "Joe has never been caught. It's a matter of family honor.",
            ar: "جو لم يُضبط قط. إنها مسألة شرف عائلي.",
          },
          {
            en: "Together they built the perfect disguise: the lamp inside a toolbox, inside a wooden crate stamped FRAGILE, wrapped in the crossword page of Grandpa Joe's favorite newspaper.",
            ar: "بنتا معاً التنكّر المثالي: المصباح داخل صندوق عدّة، داخل صندوق خشبي مختوم بعبارة «قابل للكسر»، ملفوف بصفحة الكلمات المتقاطعة من صحيفة الجدّ جو المفضلة.",
          },
          {
            en: "On the day of the dinner, they slid the crate under the table and waited. Ellie's hands were sweating. She felt like a spy.",
            ar: "في يوم العشاء دسّتا الصندوق تحت الطاولة وانتظرتا. كانت يدا إيلي تتعرقان. شعرت كأنها جاسوسة.",
          },
        ],
        question: {
          en: "Why did Ellie reject the vacuum-cleaner box and the fake cake?",
          ar: "لماذا رفضت إيلي صندوق المكنسة وكعكة العيد المزيفة؟",
          options: [
            {
              en: "She was sure her grandfather would see through them",
              ar: "كانت واثقة أن جدّها سيكشفهما",
            },
            { en: "They were too expensive", ar: "كانتا باهظتين" },
            { en: "Aunt Pam had forbidden them", ar: "كانت العمة بام قد منعتهما" },
            { en: "She wanted a smaller gift", ar: "أرادت هدية أصغر" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
      {
        title: "Grandpa Joe",
        titleAr: "الجدّ جو",
        lines: [
          {
            en: "The crate stood in the middle of the living room. Grandpa Joe studied it for a long time, then the crossword, then the faces around him.",
            ar: "وقف الصندوق في منتصف غرفة المعيشة. تأمّله الجدّ جو طويلاً، ثم الكلمات المتقاطعة، ثم الوجوه من حوله.",
          },
          {
            en: "He opened it with the patience of a man defusing a bomb. Layer after layer, until the brass flamingo, sunglasses and all, sat on his knees.",
            ar: "فتحه بصبر رجل ينزع فتيل قنبلة. طبقة بعد طبقة، حتى استقر الفلامنغو النحاسي، بنظارته وكل شيء، على ركبتيه.",
          },
          {
            en: "Thirty relatives held their breath. Aunt Pam studied the ceiling. Uncle Rick studied his shoes.",
            ar: "حبس ثلاثون قريباً أنفاسهم. تأمّلت العمة بام السقف. وتأمّل العم ريك حذاءه.",
          },
          {
            who: "Grandpa Joe",
            en: "Twelve years. Twelve years I've been waiting for this to come back to me.",
            ar: "اثنتا عشرة سنة. اثنتا عشرة سنة وأنا أنتظر أن يعود إليّ هذا.",
          },
          {
            en: "A murmur ran around the room. Back to him?",
            ar: "سرى همس في الغرفة. يعود إليه؟",
          },
          {
            who: "Grandpa Joe",
            en: "I bought it at a gas station and gave it to Rick as a joke. I wanted to see how long it would last. I've kept a notebook: seven houses, four papers, one funeral in the garden.",
            ar: "اشتريته من محطة وقود وأعطيته لريك على سبيل المزاح. أردت أن أرى كم سيدوم. احتفظت بدفتر: سبعة بيوت، وأربعة أوراق تغليف، وجنازة واحدة في الحديقة.",
          },
        ],
        question: {
          en: 'What does Grandpa Joe\'s phrase "come back to me" reveal?',
          ar: "ماذا تكشف عبارة الجدّ جو «يعود إليّ»؟",
          options: [
            {
              en: "He had received the lamp as a gift once before",
              ar: "كان قد تلقّى المصباح هدية من قبل",
            },
            { en: "He disliked the lamp more than anyone", ar: "كان يكره المصباح أكثر من أي شخص" },
            { en: "He had stolen the lamp from Rick", ar: "كان قد سرق المصباح من ريك" },
            {
              en: "He was the one who had started the tradition",
              ar: "كان هو من بدأ هذا التقليد",
            },
          ],
          answer: 3,
          evidence: 5,
        },
      },
      {
        title: "Property of the Family",
        titleAr: "ملك العائلة",
        lines: [
          {
            who: "Uncle Rick",
            en: "You? It was you? I've suffered for twelve years!",
            ar: "أنت؟ كنت أنت؟ لقد عانيت اثنتي عشرة سنة!",
          },
          {
            who: "Grandpa Joe",
            en: "You suffered? I watched you hide it in a box of tea bags. It was the best day of my year.",
            ar: "عانيت؟ شاهدتك تخبئه في علبة أكياس شاي. كان أفضل يوم في سنتي.",
          },
          {
            en: "The room exploded: laughter, accusations, thirty people rebuilding twelve years of holidays from scratch. Aunt Pam took out her chart and, for the first time, wrote a name at the very top.",
            ar: "انفجرت الغرفة: ضحك واتهامات وثلاثون شخصاً يعيدون بناء اثنتي عشرة سنة من العطلات من الصفر. وأخرجت العمة بام جدولها وكتبت، لأول مرة، اسماً في أعلاه.",
          },
          {
            en: "Grandpa Joe set the flamingo on the mantel, beside a photograph of his late wife, who, he said, had been the only one who knew.",
            ar: "وضع الجدّ جو الفلامنغو على رفّ المدفأة، بجانب صورة زوجته الراحلة، التي كانت، كما قال، الوحيدة التي عرفت.",
          },
          {
            en: "It never went back into a box. But every December, the whole family still gathers around the mantel and, with great ceremony, pretends to see it for the first time.",
            ar: "لم يعد قط إلى صندوق. لكن العائلة كلها ما زالت تجتمع كل ديسمبر حول رفّ المدفأة وتتظاهر، بمراسم عظيمة، بأنها تراه للمرة الأولى.",
          },
        ],
        question: {
          en: "Why did Aunt Pam write a name at the top of her chart?",
          ar: "لماذا كتبت العمة بام اسماً في أعلى جدولها؟",
          options: [
            {
              en: "She wanted to record the person who had received it last",
              ar: "أرادت أن تسجّل آخر من تلقّاه",
            },
            {
              en: "She finally knew who had started the chain",
              ar: "عرفت أخيراً من بدأ السلسلة",
            },
            { en: "She wanted to punish Uncle Rick", ar: "أرادت أن تعاقب العم ريك" },
            { en: "She had forgotten the earlier names", ar: "كانت قد نسيت الأسماء السابقة" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
    ],
    closing: {
      en: "What does the Flamingo come to mean for the family?",
      ar: "ماذا يصبح الفلامنغو بالنسبة إلى العائلة؟",
      options: [
        { en: "A reminder of an old argument", ar: "تذكير بخلاف قديم" },
        { en: "A shared joke that keeps them together", ar: "نكتة مشتركة تُبقيهم معاً" },
        { en: "A valuable family treasure", ar: "كنز عائلي ثمين" },
        { en: "A punishment for bad behavior", ar: "عقاب على سوء السلوك" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "tradition",
        sentence: "the holiday gift exchange had one unbreakable ___",
        hintAr: "تقليد.",
      },
      {
        word: "victim",
        sentence: "reappearing every December in new paper before a new ___.",
        hintAr: "ضحية.",
      },
      {
        word: "accomplice",
        sentence: "like a woman who had waited years for an ___.",
        hintAr: "شريك في الجريمة.",
      },
      {
        word: "patriarch",
        sentence: "Grandpa Joe, the eighty-three-year-old ___.",
        hintAr: "كبير العائلة.",
      },
      {
        word: "mantel",
        sentence: "Grandpa Joe set the flamingo on the ___, beside a photograph of his late wife",
        hintAr: "رفّ المدفأة.",
      },
      {
        word: "ceremony",
        sentence: "with great ___, pretends to see it for the first time.",
        hintAr: "مراسم.",
      },
    ],
  },
];
