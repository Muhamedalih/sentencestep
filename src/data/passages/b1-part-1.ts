import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B1 passages, first half. The same real-life scenes, told the way an
 * intermediate learner can follow them: longer sentences with a second clause
 * ("who had learned", "if you hurry"), the present perfect and the past perfect
 * where a story needs them, reported speech, and the small idioms people really
 * use. The lines are still short enough to be heard once and understood.
 */

export const B1_PASSAGES_PART_1: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 1
  {
    slug: "reply-all",
    order: 1,
    level: "B1",
    tone: "funny",
    icon: "mail",
    title: "Reply All",
    titleAr: "الرد على الجميع",
    summary: "Mark clicked the wrong button. Four hundred people read the truth.",
    summaryAr: "ضغط مارك على الزر الخطأ. فقرأ أربعمئة شخص الحقيقة.",
    cast: { Mark: "russ", Tina: "ash", "Mr. Whitfield": "calm-male" },
    sections: [
      {
        title: "A Terrible Coffee",
        titleAr: "قهوة فظيعة",
        lines: [
          {
            en: "Mark had worked at the same company for six years, and he knew one rule very well: never complain at the office.",
            ar: "عمل مارك في الشركة نفسها ست سنوات، وكان يعرف قاعدة واحدة جيداً: لا تشتكِ أبداً في المكتب.",
          },
          {
            en: 'On Monday morning, the CEO, Mr. Whitfield, sent an email to all four hundred employees. The subject was: "Meet our wonderful new coffee machine!"',
            ar: "صباح الاثنين، أرسل المدير التنفيذي السيد ويتفيلد رسالة بريد إلى جميع الموظفين الأربعمئة. كان العنوان: «تعرّفوا على ماكينة القهوة الجديدة الرائعة!»",
          },
          {
            en: "Mark tried the coffee. It tasted like warm dishwater with a little bit of sadness.",
            ar: "جرّب مارك القهوة. كان طعمها كماء غسيل الأطباق الدافئ مع قليل من الحزن.",
          },
          {
            en: 'A few minutes later, his friend Tina forwarded the email to him. She only wrote one word: "Thoughts?"',
            ar: "بعد دقائق، أعادت صديقته تينا توجيه الرسالة إليه. كتبت كلمة واحدة فقط: «رأيك؟»",
          },
          {
            who: "Mark",
            en: "Finally, somebody asks the real question.",
            ar: "أخيراً، هناك من يطرح السؤال الحقيقي.",
          },
          {
            en: "He started to type quickly. He was tired, he was angry, and he was very honest.",
            ar: "بدأ يكتب بسرعة. كان متعباً وغاضباً وصريحاً جداً.",
          },
        ],
        question: {
          en: "What did Tina write to Mark?",
          ar: "ماذا كتبت تينا لمارك؟",
          options: [
            { en: "A long complaint", ar: "شكوى طويلة" },
            { en: 'One word: "Thoughts?"', ar: "كلمة واحدة: «رأيك؟»" },
            { en: "An invitation to lunch", ar: "دعوة إلى الغداء" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
      {
        title: "The Wrong Button",
        titleAr: "الزر الخطأ",
        lines: [
          {
            en: 'Mark wrote: "Honestly, this coffee is a crime. Whoever bought this machine has never tasted coffee in their life."',
            ar: "كتب مارك: «بصراحة، هذه القهوة جريمة. من اشترى هذه الماكينة لم يذق القهوة في حياته.»",
          },
          {
            en: "He continued: \"And I will NOT wear a funny hat on Friday. I'm thirty-eight years old. If Mr. Whitfield wants to look ridiculous, that's his problem.\"",
            ar: "وتابع: «ولن أرتدي قبعة مضحكة يوم الجمعة. عمري ثمانٍ وثلاثون سنة. إن أراد السيد ويتفيلد أن يبدو سخيفاً فتلك مشكلته.»",
          },
          {
            en: "He read it once, smiled, and clicked the button on the right side of the screen.",
            ar: "قرأها مرة واحدة، وابتسم، وضغط على الزر الموجود على الجانب الأيمن من الشاشة.",
          },
          {
            en: 'It was the wrong button. It was "Reply All."',
            ar: "كان الزر الخطأ. كان «الرد على الجميع».",
            pause: { after: "wrong button." },
          },
          {
            en: "For ten seconds, nothing happened. Then Mark's phone started to buzz. And buzz. And buzz.",
            ar: "لعشر ثوانٍ، لم يحدث شيء. ثم بدأ هاتف مارك يهتز. ويهتز. ويهتز.",
            pause: { after: "nothing happened." },
          },
          {
            who: "Mark",
            en: "No. No, no, no, no.",
            ar: "لا. لا، لا، لا، لا.",
          },
          {
            en: "Across the building, four hundred people were reading his words at the same time.",
            ar: "في أرجاء المبنى، كان أربعمئة شخص يقرؤون كلماته في اللحظة نفسها.",
          },
        ],
        question: {
          en: "What mistake did Mark make?",
          ar: "ما الخطأ الذي ارتكبه مارك؟",
          options: [
            { en: "He wrote to the wrong person", ar: "كتب إلى الشخص الخطأ" },
            { en: "He forgot to write a subject", ar: "نسي أن يكتب عنواناً" },
            { en: 'He clicked "Reply All"', ar: "ضغط على «الرد على الجميع»" },
          ],
          answer: 2,
          evidence: 3,
        },
      },
      {
        title: "Four Hundred Readers",
        titleAr: "أربعمئة قارئ",
        lines: [
          {
            en: "In the next hour, Mark received eighty-seven replies. Most of them were only one line long.",
            ar: "في الساعة التالية، تلقّى مارك سبعة وثمانين رداً. معظمها لم يتجاوز سطراً واحداً.",
          },
          {
            en: '"Best email of my career." "Finally, somebody said it." "I won\'t wear the hat either."',
            ar: "«أفضل رسالة في مسيرتي.» «أخيراً قالها أحد.» «أنا أيضاً لن أرتدي القبعة.»",
          },
          {
            who: "Tina",
            en: "Mark, you're a hero! Three people in my department cried from laughing.",
            ar: "مارك، أنت بطل! ثلاثة أشخاص في قسمي بكوا من شدة الضحك.",
          },
          {
            en: "Mark was not laughing. He thought about hiding in the bathroom. Then he thought about hiding in his car. Then he thought about looking for a new job.",
            ar: "لم يكن مارك يضحك. فكّر في الاختباء في الحمّام. ثم فكّر في الاختباء في سيارته. ثم فكّر في البحث عن عمل جديد.",
          },
          {
            en: 'At noon, a new email arrived. The subject was: "Please come to my office." It was from Mr. Whitfield.',
            ar: "عند الظهر، وصلت رسالة جديدة. كان العنوان: «تفضّل إلى مكتبي». كانت من السيد ويتفيلد.",
          },
          {
            who: "Mark",
            en: "This is it. I'm finished.",
            ar: "هذه هي النهاية. انتهى أمري.",
          },
          {
            en: "He walked up to the tenth floor like a man walking to his own funeral.",
            ar: "صعد إلى الطابق العاشر كرجل يمشي إلى جنازته.",
          },
        ],
        question: {
          en: "Where did Mark go at noon?",
          ar: "إلى أين ذهب مارك عند الظهر؟",
          options: [
            { en: "To the CEO's office", ar: "إلى مكتب المدير التنفيذي" },
            { en: "To the coffee machine", ar: "إلى ماكينة القهوة" },
            { en: "Home", ar: "إلى البيت" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "The Boss",
        titleAr: "المدير",
        lines: [
          {
            en: "Mr. Whitfield's office was large and very quiet. He was sitting behind a big desk with Mark's email open on his computer.",
            ar: "كان مكتب السيد ويتفيلد واسعاً وهادئاً جداً. كان يجلس خلف مكتب كبير ورسالة مارك مفتوحة على حاسوبه.",
          },
          {
            who: "Mr. Whitfield",
            en: "Sit down, Mark. I read your email. All three times.",
            ar: "اجلس يا مارك. لقد قرأت رسالتك. ثلاث مرات.",
            pause: { after: "your email." },
          },
          {
            who: "Mark",
            en: "Sir, I can explain. I didn't mean to send it to everyone. I'm very sorry about the machine... and about the hat.",
            ar: "سيدي، أستطيع أن أشرح. لم أقصد إرسالها إلى الجميع. أنا آسف جداً بشأن الماكينة... وبشأن القبعة.",
          },
          {
            en: "Mr. Whitfield was silent for a long moment. Then, to Mark's great surprise, he started to laugh.",
            ar: "ظلّ السيد ويتفيلد صامتاً لحظة طويلة. ثم، وإلى دهشة مارك الكبيرة، بدأ يضحك.",
          },
          {
            who: "Mr. Whitfield",
            en: "You know, you're the first person in six years who has told me the truth. The coffee is terrible. I bought the cheapest machine.",
            ar: "أتعرف؟ أنت أول شخص منذ ست سنوات يقول لي الحقيقة. القهوة فظيعة. لقد اشتريت أرخص ماكينة.",
          },
          {
            who: "Mr. Whitfield",
            en: 'Nobody ever complains to me. Everybody says, "Great idea, sir." I wish I had more people like you.',
            ar: "لا أحد يشتكي لي أبداً. الجميع يقولون: «فكرة رائعة يا سيدي.» أتمنى لو كان عندي المزيد من أمثالك.",
          },
        ],
        question: {
          en: "Why was Mr. Whitfield happy about the email?",
          ar: "لماذا سُرّ السيد ويتفيلد بالرسالة؟",
          options: [
            { en: "Mark praised the new machine", ar: "امتدح مارك الماكينة الجديدة" },
            { en: "Mark told him the truth", ar: "قال له مارك الحقيقة" },
            { en: "Mark promised to work more", ar: "وعد مارك بأن يعمل أكثر" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "A New Machine",
        titleAr: "ماكينة جديدة",
        lines: [
          {
            en: "By the end of the week, the old coffee machine had disappeared from the fifth floor.",
            ar: "بنهاية الأسبوع، اختفت ماكينة القهوة القديمة من الطابق الخامس.",
          },
          {
            en: 'A new one stood in its place, with a small sign on the front: "Chosen by Mark."',
            ar: "ووقفت ماكينة جديدة مكانها، وعليها لافتة صغيرة في الأمام: «اختيار مارك.»",
          },
          {
            en: "On Friday, everybody wore normal clothes. Nobody wore a funny hat. Nobody, except Mr. Whitfield.",
            ar: "يوم الجمعة، ارتدى الجميع ملابس عادية. لم يرتدِ أحد قبعة مضحكة. لا أحد، ما عدا السيد ويتفيلد.",
          },
          {
            who: "Mr. Whitfield",
            en: "I'm the boss. I can look ridiculous if I want to.",
            ar: "أنا المدير. يمكنني أن أبدو سخيفاً إن أردت.",
          },
          {
            en: "Mark learned two lessons that week. First: always check the button before you click it.",
            ar: "تعلّم مارك درسين في ذلك الأسبوع. الأول: تحقّق دائماً من الزر قبل أن تضغط عليه.",
          },
          {
            en: "Second: sometimes the truth is exactly what the boss needs to hear, even if he doesn't know it yet.",
            ar: "والثاني: أحياناً تكون الحقيقة بالضبط ما يحتاج المدير إلى سماعه، حتى لو لم يكن يعلم ذلك بعد.",
          },
        ],
        question: {
          en: "What happened to the old coffee machine?",
          ar: "ماذا حدث لماكينة القهوة القديمة؟",
          options: [
            { en: "A new one replaced it", ar: "حلّت محلها ماكينة جديدة" },
            { en: "It was moved to another floor", ar: "نُقلت إلى طابق آخر" },
            { en: "It was fixed", ar: "أُصلحت" },
          ],
          answer: 0,
          evidence: 0,
        },
      },
    ],
    closing: {
      en: "How did Mark feel when he went to the CEO's office?",
      ar: "كيف شعر مارك وهو ذاهب إلى مكتب المدير التنفيذي؟",
      options: [
        { en: "He was excited about a promotion", ar: "كان متحمساً لترقية" },
        { en: "He was proud of his email", ar: "كان فخوراً برسالته" },
        { en: "He was sure he would lose his job", ar: "كان متأكداً أنه سيفقد وظيفته" },
      ],
      answer: 2,
    },
    words: [
      {
        word: "complain",
        sentence:
          "Mark had worked at the same company for six years, and he knew one rule very well: never ___ at the office.",
        hintAr: "يشتكي.",
      },
      {
        word: "crime",
        sentence: "Honestly, this coffee is a ___.",
        hintAr: "الجريمة.",
      },
      {
        word: "ridiculous",
        sentence: "If Mr. Whitfield wants to look ___, that's his problem.",
        hintAr: "سخيف، مضحك.",
      },
      {
        word: "department",
        sentence: "Mark, you're a hero! Three people in my ___ cried from laughing.",
        hintAr: "القسم.",
      },
      {
        word: "explain",
        sentence: "Sir, I can ___. I didn't mean to send it to everyone.",
        hintAr: "يشرح، يوضّح.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 2
  {
    slug: "the-wrong-number",
    order: 2,
    level: "B1",
    tone: "funny",
    icon: "smartphone",
    title: "A Seat at the Table",
    titleAr: "مقعد على الطاولة",
    summary: "A text for a grandson reached a stranger. The stranger came to dinner.",
    summaryAr: "رسالة موجّهة إلى حفيد وصلت إلى غريب. فجاء الغريب إلى العشاء.",
    cast: { Ethan: "russ", "Mrs. Walker": "autumn", Dylan: "calm-male" },
    sections: [
      {
        title: "A Message from Nowhere",
        titleAr: "رسالة من المجهول",
        lines: [
          {
            en: "It was the week of Thanksgiving, and the university dormitory was almost empty. Everyone had gone home, except Ethan.",
            ar: "كان أسبوع عيد الشكر، وكان سكن الجامعة شبه خالٍ. فقد عاد الجميع إلى بيوتهم، ما عدا إيثان.",
          },
          {
            en: "His family lived two thousand miles away, and a plane ticket cost more than he had in the bank.",
            ar: "كانت عائلته تعيش على بعد ألفي ميل، وكانت تذكرة الطائرة تكلّف أكثر مما في حسابه المصرفي.",
          },
          {
            en: "On Wednesday night, he was eating instant noodles and watching a very old movie, when his phone buzzed.",
            ar: "مساء الأربعاء، كان يأكل المعكرونة سريعة التحضير ويشاهد فيلماً قديماً جداً، عندما اهتز هاتفه.",
          },
          {
            en: 'The message came from a number he did not know: "Dinner is at four on Thursday, sweetheart! Bring a friend if you like. Love, Grandma."',
            ar: "جاءت الرسالة من رقم لا يعرفه: «العشاء في الرابعة يوم الخميس يا حبيبي! أحضر صديقاً إن أردت. مع حبي، جدتك.»",
          },
          {
            who: "Ethan",
            en: "I don't think this is for me.",
            ar: "لا أظن أن هذه الرسالة لي.",
          },
          {
            en: "He looked at the screen for a long time. He felt strangely sad and strangely curious at the same time.",
            ar: "حدّق في الشاشة طويلاً. شعر بحزن غريب وفضول غريب في الوقت نفسه.",
          },
        ],
        question: {
          en: "Why was Ethan alone that week?",
          ar: "لماذا كان إيثان وحيداً ذلك الأسبوع؟",
          options: [
            { en: "He did not like his family", ar: "لم يكن يحب عائلته" },
            { en: "He had to work all week", ar: "كان عليه أن يعمل طوال الأسبوع" },
            {
              en: "His family lived far away and a ticket was too expensive",
              ar: "كانت عائلته بعيدة وتذكرة الطائرة غالية جداً",
            },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "Not Your Grandson",
        titleAr: "لستُ حفيدك",
        lines: [
          {
            who: "Ethan",
            en: "Hi! I think you have the wrong number. I'm not your grandson. I'm a student.",
            ar: "مرحباً! أظن أنك أخطأت في الرقم. لستُ حفيدك. أنا طالب.",
          },
          {
            en: "The answer came in less than a minute.",
            ar: "جاء الرد في أقل من دقيقة.",
          },
          {
            who: "Mrs. Walker",
            en: "Oh dear! I'm so sorry. My grandson changed his number again. Who is this?",
            ar: "يا إلهي! أنا آسفة جداً. حفيدي غيّر رقمه مرة أخرى. من أنت؟",
          },
          {
            who: "Ethan",
            en: "I'm Ethan. No problem. Enjoy your dinner!",
            ar: "أنا إيثان. لا بأس. استمتعي بعشائك!",
          },
          {
            en: "He thought the conversation was over. But the phone buzzed again.",
            ar: "ظنّ أن المحادثة انتهت. لكن الهاتف اهتز مرة أخرى.",
          },
          {
            who: "Mrs. Walker",
            en: "Ethan, do you have plans for Thanksgiving? You sound like a boy who needs a good meal.",
            ar: "إيثان، هل لديك خطط لعيد الشكر؟ يبدو أنك فتى يحتاج إلى وجبة جيدة.",
          },
          {
            who: "Ethan",
            en: "Honestly, no. My family lives far away. I'm eating noodles.",
            ar: "بصراحة، لا. عائلتي تعيش بعيداً. أنا آكل معكرونة سريعة.",
          },
        ],
        question: {
          en: "What did Mrs. Walker ask Ethan?",
          ar: "ماذا سألت السيدة والكر إيثان؟",
          options: [
            { en: "If he knew her grandson", ar: "إن كان يعرف حفيدها" },
            { en: "If he had plans for Thanksgiving", ar: "إن كانت لديه خطط لعيد الشكر" },
            { en: "If he could cook turkey", ar: "إن كان يستطيع طهي الديك الرومي" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Should I Go?",
        titleAr: "هل أذهب؟",
        lines: [
          {
            who: "Mrs. Walker",
            en: "Noodles?! No, no, no. Come to dinner at four. Bring a friend. There will be too much food, as always.",
            ar: "معكرونة سريعة؟! لا، لا، لا. تعال إلى العشاء في الرابعة. أحضر صديقاً. سيكون هناك طعام كثير جداً، كالعادة.",
          },
          {
            en: "Ethan called his friend Dylan, who lived off campus, and read the messages to him.",
            ar: "اتصل إيثان بصديقه ديلان، الذي يسكن خارج الحرم الجامعي، وقرأ عليه الرسائل.",
          },
          {
            who: "Dylan",
            en: "A stranger invited you to dinner by text? That's the beginning of every horror movie!",
            ar: "غريبة دعتك إلى العشاء برسالة؟ هذه بداية كل فيلم رعب!",
          },
          {
            who: "Ethan",
            en: "She's somebody's grandmother, Dylan. She said I sounded like a boy who needs a good meal.",
            ar: "إنها جدة أحدهم يا ديلان. قالت إنني أبدو كفتى يحتاج إلى وجبة جيدة.",
          },
          {
            who: "Dylan",
            en: "Okay. But I'm coming with you. And if we're not back by nine, I'm calling the police.",
            ar: "حسناً. لكنني سأذهب معك. وإن لم نعد قبل التاسعة سأتصل بالشرطة.",
          },
          {
            en: "That was how two hungry students found themselves in front of a small white house on Thursday at four o'clock.",
            ar: "وهكذا وجد طالبان جائعان نفسيهما أمام بيت أبيض صغير يوم الخميس في الرابعة.",
          },
        ],
        question: {
          en: "What did Dylan say they should do?",
          ar: "ماذا قال ديلان إنه ينبغي أن يفعلا؟",
          options: [
            {
              en: "Go together, and call the police if they were late",
              ar: "يذهبان معاً، ويتصلان بالشرطة إن تأخّرا",
            },
            { en: "Stay at home", ar: "يبقيان في البيت" },
            { en: "Go alone and not tell anyone", ar: "يذهب إيثان وحده ولا يخبر أحداً" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "Thursday at Four",
        titleAr: "الخميس في الرابعة",
        lines: [
          {
            en: "The door opened before they knocked. A small woman with silver hair opened her arms as if she had known them for years.",
            ar: "فُتح الباب قبل أن يطرقاه. فتحت امرأة صغيرة بشعر فضي ذراعيها كأنها تعرفهما منذ سنوات.",
          },
          {
            who: "Mrs. Walker",
            en: "You must be Ethan! And you must be the friend. Come in, come in. You're both too thin.",
            ar: "لا بد أنك إيثان! وأنت الصديق. تفضلا، تفضلا. أنتما نحيفان أكثر من اللازم.",
          },
          {
            en: "Inside, the house smelled of turkey, apples, and cinnamon. Fourteen people were sitting around a long table.",
            ar: "في الداخل، كانت رائحة البيت رائحة ديك رومي وتفاح وقرفة. كان أربعة عشر شخصاً يجلسون حول طاولة طويلة.",
          },
          {
            en: "Her real grandson, Ben, shook Ethan's hand and laughed. \"So you're the guy who stole my dinner invitation.\"",
            ar: "صافح بن، حفيدها الحقيقي، إيثان وضحك: «إذن أنت من سرق دعوة العشاء الخاصة بي.»",
          },
          {
            en: "Nobody asked Ethan embarrassing questions. They only passed him more potatoes, more turkey, and more pie, until he could not move.",
            ar: "لم يسأل أحد إيثان أسئلة محرجة. اكتفوا بتمرير المزيد من البطاطس والديك الرومي والفطيرة إليه حتى لم يعد قادراً على الحراك.",
          },
          {
            who: "Ethan",
            en: "Mrs. Walker, this is the best Thanksgiving of my life.",
            ar: "سيدة والكر، هذا أفضل عيد شكر في حياتي.",
          },
          {
            who: "Mrs. Walker",
            en: "And it was an accident, dear. Imagine what a good thing a wrong number can be.",
            ar: "وقد كان مصادفة يا عزيزي. تخيّل كم يمكن أن يكون الرقم الخطأ شيئاً جميلاً.",
            pause: { after: "accident, dear." },
          },
        ],
        question: {
          en: "How did the family treat Ethan?",
          ar: "كيف عاملت العائلة إيثان؟",
          options: [
            { en: "They asked him many hard questions", ar: "سألته أسئلة كثيرة صعبة" },
            { en: "They ignored him", ar: "تجاهلته" },
            { en: "They welcomed him like one of their own", ar: "رحّبت به كأنه واحد منهم" },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Next Thanksgiving",
        titleAr: "عيد الشكر التالي",
        lines: [
          {
            en: "A year later, on the Monday of Thanksgiving week, Ethan's phone buzzed.",
            ar: "بعد سنة، يوم الاثنين من أسبوع عيد الشكر، اهتز هاتف إيثان.",
          },
          {
            who: "Mrs. Walker",
            en: "This time, the number is correct. Four o'clock on Thursday. Bring your friend, and bring an appetite.",
            ar: "هذه المرة الرقم صحيح. الرابعة يوم الخميس. أحضر صديقك، وأحضر شهيتك.",
          },
          {
            en: 'Ethan smiled. He had saved her name in his phone as "Grandma Walker" a long time ago.',
            ar: "ابتسم إيثان. كان قد حفظ اسمها في هاتفه باسم «الجدة والكر» منذ زمن طويل.",
          },
          {
            en: "The year after that, he went again. And the year after that.",
            ar: "وفي السنة التي تلتها، ذهب مجدداً. وفي التي بعدها كذلك.",
          },
          {
            en: "When Ethan graduated from university, his own family was far away again. But in the front row, a small woman with silver hair was crying and clapping louder than anyone.",
            ar: "عندما تخرّج إيثان من الجامعة، كانت عائلته بعيدة مرة أخرى. لكن في الصف الأول كانت امرأة صغيرة بشعر فضي تبكي وتصفّق بصوت أعلى من الجميع.",
          },
          {
            who: "Ethan",
            en: "Some people say it was a mistake. I think it was the best message I never should have received.",
            ar: "يقول بعض الناس إنه كان خطأ. أما أنا فأظن أنها كانت أفضل رسالة ما كان ينبغي أن تصلني.",
          },
        ],
        question: {
          en: "Where was Mrs. Walker when Ethan graduated?",
          ar: "أين كانت السيدة والكر عندما تخرّج إيثان؟",
          options: [
            { en: "In the front row", ar: "في الصف الأول" },
            { en: "At home", ar: "في البيت" },
            { en: "On a plane", ar: "في طائرة" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What did Mrs. Walker become to Ethan over the years?",
      ar: "ماذا صارت السيدة والكر بالنسبة لإيثان على مرّ السنين؟",
      options: [
        { en: "His teacher at the university", ar: "معلمته في الجامعة" },
        { en: "Like a grandmother", ar: "مثل جدّة له" },
        { en: "A neighbor from his dormitory", ar: "جارة من سكنه الجامعي" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "stranger",
        sentence: "A ___ invited you to dinner by text?",
        hintAr: "الغريب.",
      },
      {
        word: "cinnamon",
        sentence: "Inside, the house smelled of turkey, apples, and ___.",
        hintAr: "القرفة.",
      },
      {
        word: "embarrassing",
        sentence: "Nobody asked Ethan ___ questions.",
        hintAr: "محرج.",
      },
      {
        word: "invitation",
        sentence: "So you're the guy who stole my dinner ___.",
        hintAr: "الدعوة.",
      },
      {
        word: "accident",
        sentence: "And it was an ___, dear.",
        hintAr: "الحادث، المصادفة.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 3
  {
    slug: "the-honest-mechanic",
    order: 3,
    level: "B1",
    tone: "serious",
    icon: "briefcase",
    title: "The Honest Mechanic",
    titleAr: "الميكانيكي الأمين",
    summary: "Rachel's car broke down. Walt could have charged her ten times more.",
    summaryAr: "تعطلت سيارة راشيل. وكان بوسع والت أن يطلب منها عشرة أضعاف.",
    cast: { Rachel: "zara", Walt: "calm-male", Tyler: "russ" },
    sections: [
      {
        title: "Smoke on the Highway",
        titleAr: "دخان على الطريق",
        lines: [
          {
            en: "Rachel was a nurse, and she worked very hard. On Friday, she finally had a free evening, and she was driving three hours to see her daughter's school play.",
            ar: "كانت راشيل ممرضة وتعمل بجد شديد. يوم الجمعة، حصلت أخيراً على مساء حر، وكانت تقود ثلاث ساعات لتشاهد مسرحية ابنتها المدرسية.",
          },
          {
            en: "Halfway there, a strange noise came from under the car. Then white smoke began to rise from the front.",
            ar: "في منتصف الطريق، صدر صوت غريب من تحت السيارة. ثم بدأ دخان أبيض يتصاعد من الأمام.",
          },
          {
            who: "Rachel",
            en: "No. Not today. Please, not today.",
            ar: "لا. ليس اليوم. أرجوك، ليس اليوم.",
          },
          {
            en: "She stopped on the side of the road and called a tow truck. An hour later, her car arrived at a small garage in a town she had never heard of.",
            ar: "توقفت على جانب الطريق واتصلت بسيارة سحب. وبعد ساعة، وصلت سيارتها إلى ورشة صغيرة في بلدة لم تسمع بها من قبل.",
          },
          {
            en: 'The sign above the door said: "Walt\'s Garage — Since 1989."',
            ar: "كانت اللافتة فوق الباب تقول: «ورشة والت — منذ عام 1989.»",
          },
          {
            en: "Rachel had already imagined the worst: a new engine, two thousand dollars, and no play.",
            ar: "كانت راشيل قد تخيّلت الأسوأ: محرّك جديد، وألفا دولار، ولا مسرحية.",
          },
        ],
        question: {
          en: "What had Rachel imagined?",
          ar: "ماذا كانت راشيل قد تخيّلت؟",
          options: [
            { en: "A free repair", ar: "إصلاحاً مجانياً" },
            { en: "A very short repair", ar: "إصلاحاً قصيراً جداً" },
            { en: "A very expensive repair", ar: "إصلاحاً غالياً جداً" },
          ],
          answer: 2,
          evidence: 5,
        },
      },
      {
        title: "The Diagnosis",
        titleAr: "التشخيص",
        lines: [
          {
            en: "Walt was an old man with grey hands and a calm voice. He lifted the hood and looked inside for ten minutes without a word.",
            ar: "كان والت رجلاً عجوزاً بيدين رماديتين وصوت هادئ. رفع غطاء المحرك ونظر إلى الداخل عشر دقائق بلا كلمة.",
          },
          {
            who: "Walt",
            en: "Good news, ma'am. It's not the engine.",
            ar: "أخبار جيدة يا سيدتي. ليست المشكلة في المحرك.",
          },
          {
            who: "Walt",
            en: "It's a small rubber belt. It broke and made a lot of smoke. The part costs twelve dollars.",
            ar: "إنه سير مطاطي صغير. انقطع وصنع دخاناً كثيراً. ثمن القطعة اثنا عشر دولاراً.",
          },
          {
            en: "His young assistant, Tyler, pulled him aside and whispered. Rachel could still hear every word.",
            ar: "سحب مساعده الشاب، تايلر، والت جانباً وهمس. لكن راشيل ظلت تسمع كل كلمة.",
          },
          {
            who: "Tyler",
            en: "Boss, she's from the city. She doesn't know anything about cars. We could say it's the water pump and charge her four hundred.",
            ar: "يا زعيم، إنها من المدينة. لا تعرف شيئاً عن السيارات. يمكننا أن نقول إنها مضخة الماء ونطلب منها أربعمئة.",
          },
          {
            who: "Walt",
            en: "She wouldn't know. But I would.",
            ar: "هي لن تعرف. لكنني أنا سأعرف.",
            pause: { after: "wouldn't know." },
          },
        ],
        question: {
          en: "What was wrong with Rachel's car?",
          ar: "ما المشكلة في سيارة راشيل؟",
          options: [
            { en: "A dead engine", ar: "محرك ميت" },
            { en: "A broken rubber belt", ar: "سير مطاطي مقطوع" },
            { en: "A flat tire", ar: "إطار مثقوب" },
          ],
          answer: 1,
          evidence: 2,
        },
      },
      {
        title: "Forty Dollars",
        titleAr: "أربعون دولاراً",
        lines: [
          {
            en: "Walt fixed the car in thirty-five minutes. When he finished, he wiped his hands on an old cloth and wrote the bill.",
            ar: "أصلح والت السيارة في خمس وثلاثين دقيقة. وعندما انتهى، مسح يديه بخرقة قديمة وكتب الفاتورة.",
          },
          {
            who: "Walt",
            en: "Forty dollars. Twelve for the belt, twenty-eight for my time.",
            ar: "أربعون دولاراً. اثنا عشر للسير، وثمانية وعشرون لوقتي.",
          },
          {
            who: "Rachel",
            en: "Forty? Sir, I thought it would cost thousands. Please, take more. You saved my whole weekend.",
            ar: "أربعون؟ يا سيدي، ظننت أن الأمر سيكلّف آلافاً. أرجوك، خذ أكثر. لقد أنقذت عطلتي بأكملها.",
          },
          {
            who: "Walt",
            en: "The price is the price. Now go. If you hurry, you won't miss your daughter's play.",
            ar: "السعر هو السعر. والآن اذهبي. إن أسرعتِ، فلن تفوتك مسرحية ابنتك.",
          },
          {
            en: "Rachel arrived at the school just as the lights went down. Her daughter, dressed as a tree, was standing on the stage.",
            ar: "وصلت راشيل إلى المدرسة في اللحظة التي خُفضت فيها الأضواء. كانت ابنتها، وهي ترتدي زي شجرة، تقف على المسرح.",
          },
          {
            en: "She had only one line. She said it perfectly. And Rachel, in the last row, cried more than she had cried in a year.",
            ar: "كان لديها سطر واحد فقط. قالته بإتقان. وبكت راشيل، في الصف الأخير، أكثر مما بكت في سنة كاملة.",
          },
        ],
        question: {
          en: "How much did Walt charge?",
          ar: "كم طلب والت؟",
          options: [
            { en: "Four hundred dollars", ar: "أربعمئة دولار" },
            { en: "Two thousand dollars", ar: "ألفي دولار" },
            { en: "Forty dollars", ar: "أربعين دولاراً" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "A Hard Year",
        titleAr: "عام صعب",
        lines: [
          {
            en: "Two years later, things were not going well for Walt. A big car-repair company had opened at the edge of town, with a bright sign and cheap advertisements.",
            ar: "بعد عامين، لم تكن الأمور على ما يرام مع والت. فقد افتتحت شركة كبيرة لإصلاح السيارات على أطراف البلدة، بلافتة لامعة وإعلانات رخيصة.",
          },
          {
            en: "Customers came less and less. One Monday, Walt sat alone in his empty garage and counted his money twice. It was not enough for the rent.",
            ar: "قلّ الزبائن أكثر فأكثر. في أحد أيام الاثنين، جلس والت وحده في ورشته الفارغة وعدّ نقوده مرتين. لم تكن كافية للإيجار.",
          },
          {
            who: "Walt",
            en: "Maybe it's time to close, Tyler.",
            ar: "ربما حان وقت الإغلاق يا تايلر.",
          },
          {
            who: "Tyler",
            en: "Boss, wait. Look at the phone. Something strange is happening.",
            ar: "يا زعيم، انتظر. انظر إلى الهاتف. يحدث شيء غريب.",
          },
          {
            en: "The phone was ringing without stopping. Cars were waiting outside. A line of people stretched down the street.",
            ar: "كان الهاتف يرنّ بلا توقف. كانت سيارات تنتظر في الخارج. ووقف طابور من الناس على امتداد الشارع.",
          },
          {
            who: "Tyler",
            en: "Somebody wrote about you on the internet. It has two hundred thousand shares.",
            ar: "كتب أحدهم عنك على الإنترنت. وقد حصل على مئتي ألف مشاركة.",
          },
        ],
        question: {
          en: "Why did customers suddenly come?",
          ar: "لماذا جاء الزبائن فجأة؟",
          options: [
            { en: "Walt lowered his prices", ar: "خفّض والت أسعاره" },
            { en: "Somebody wrote about Walt online", ar: "كتب أحدهم عن والت على الإنترنت" },
            { en: "A new road opened", ar: "افتُتح طريق جديد" },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Fair Prices",
        titleAr: "أسعار عادلة",
        lines: [
          {
            en: "It was Rachel. She had told the story of the old mechanic who charged her forty dollars when he could have charged four hundred.",
            ar: "كانت راشيل. فقد روت قصة الميكانيكي العجوز الذي طلب منها أربعين دولاراً بينما كان بوسعه أن يطلب أربعمئة.",
          },
          {
            en: "People from three different states drove to Walt's garage, just to meet the honest man and bring him their cars.",
            ar: "قاد أشخاص من ثلاث ولايات مختلفة سياراتهم إلى ورشة والت، فقط ليقابلوا الرجل الأمين ويقدّموا له سياراتهم.",
          },
          {
            en: "That week, Walt and Tyler worked from morning until night. They fixed more cars than in the whole year before.",
            ar: "في ذلك الأسبوع، عمل والت وتايلر من الصباح حتى الليل. أصلحا سيارات أكثر مما أصلحا في السنة السابقة بأكملها.",
          },
          {
            who: "Tyler",
            en: "Boss, I owe you an apology. I was wrong about the water pump trick.",
            ar: "يا زعيم، أنا مدين لك باعتذار. لقد كنت مخطئاً بشأن حيلة مضخة الماء.",
          },
          {
            who: "Walt",
            en: "Don't worry, son. I didn't do it for the internet. I only did it so I could sleep at night.",
            ar: "لا تقلق يا بني. لم أفعل ذلك من أجل الإنترنت. فعلتُه فقط لأتمكن من النوم ليلاً.",
          },
          {
            en: 'The next morning, Tyler painted a new sentence under the old sign: "Fair prices. Honest work."',
            ar: "في الصباح التالي، كتب تايلر جملة جديدة تحت اللافتة القديمة: «أسعار عادلة. عمل أمين.»",
          },
        ],
        question: {
          en: "Why did Walt say he had been honest?",
          ar: "لماذا قال والت إنه كان أميناً؟",
          options: [
            { en: "So he could sleep at night", ar: "ليتمكن من النوم ليلاً" },
            { en: "Because he felt sorry for Rachel", ar: "لأنه شعر بالأسف تجاه راشيل" },
            { en: "Because he forgot the price", ar: "لأنه نسي السعر" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
    ],
    closing: {
      en: "What did Tyler want Walt to do at first?",
      ar: "ماذا أراد تايلر من والت أن يفعل في البداية؟",
      options: [
        { en: "Fix the car for free", ar: "أن يصلح السيارة مجاناً" },
        { en: "Send Rachel to another garage", ar: "أن يرسل راشيل إلى ورشة أخرى" },
        {
          en: "Say it was the water pump and charge Rachel more",
          ar: "أن يقول إنها مضخة الماء ويطلب من راشيل مبلغاً أكبر",
        },
      ],
      answer: 2,
    },
    words: [
      {
        word: "hood",
        sentence: "He lifted the ___ and looked inside for ten minutes without a word.",
        hintAr: "غطاء المحرك.",
      },
      {
        word: "pump",
        sentence: "We could say it's the water ___ and charge her four hundred.",
        hintAr: "المضخّة.",
      },
      {
        word: "assistant",
        sentence: "His young ___, Tyler, pulled him aside and whispered.",
        hintAr: "المساعد.",
      },
      {
        word: "mechanic",
        sentence:
          "She had told the story of the old ___ who charged her forty dollars when he could have charged four hundred.",
        hintAr: "الميكانيكي.",
      },
      {
        word: "apology",
        sentence: "Boss, I owe you an ___. I was wrong about the water pump trick.",
        hintAr: "الاعتذار.",
      },
    ],
  },
];
