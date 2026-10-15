import type { PassageSeed } from "@/data/passages/types";

/**
 * Level B2, first half — the level above B1, and meant to be harder in every way
 * that matters to a reader who has finished B1, not merely longer: the words are
 * less common (testimony, deliberate, circular, contempt), the sentences carry
 * more than one idea (reported speech, the past perfect, conditionals, relative
 * and participle clauses), the register moves between the everyday and the
 * formal, and the questions rarely ask what happened — they ask what it means:
 * what a sentence implies, why someone did something, what the writer is hinting
 * at, what a word means in its context. Four options instead of three.
 *
 * Like every other passage these are real-life scenes with a turn and a payoff,
 * and each was written against everything already in the library (the passages,
 * the Daily Lessons, the Stories) so it repeats none of them
 * (see scripts/check-passage-duplicates.ts).
 */

export const B2_PASSAGES_PART_1: PassageSeed[] = [
  // ───────────────────────────────────────────────────────── 1
  {
    slug: "twelve-strangers",
    order: 1,
    level: "B2",
    tone: "serious",
    icon: "briefcase",
    title: "Twelve Strangers",
    titleAr: "اثنا عشر غريباً",
    summary: "Eleven jurors were ready to go home. One was not.",
    summaryAr: "كان أحد عشر محلَّفاً مستعدين للعودة إلى بيوتهم. وواحدة لم تكن مستعدة.",
    cast: { Diane: "zara", "Mr. Okafor": "calm-male", Tyler: "russ", "Court Reporter": "ash" },
    sections: [
      {
        title: "Eleven to One",
        titleAr: "أحد عشر مقابل واحد",
        lines: [
          {
            en: "After three days of testimony, twelve strangers sat in a windowless room with a table, a jug of water and one question: had Danny Walsh stolen eleven thousand dollars from the restaurant where he worked?",
            ar: "بعد ثلاثة أيام من الشهادات، جلس اثنا عشر غريباً في غرفة بلا نوافذ فيها طاولة وإبريق ماء وسؤال واحد: هل سرق داني والش أحد عشر ألف دولار من المطعم الذي يعمل فيه؟",
          },
          {
            who: "Mr. Okafor",
            en: "Before we begin, let's see where everyone stands. Raise your hand if you believe he is guilty.",
            ar: "قبل أن نبدأ، لنرَ أين يقف كل واحد منا. ارفعوا أيديكم إن كنتم تعتقدون أنه مذنب.",
          },
          {
            en: "Eleven hands went up within seconds. The twelfth, which belonged to a night-shift nurse named Diane, stayed on the table.",
            ar: "ارتفعت أحد عشر يداً في ثوانٍ. أما اليد الثانية عشرة، التي تعود إلى ممرضة تعمل في المناوبة الليلية تُدعى ديان، فبقيت على الطاولة.",
          },
          {
            who: "Tyler",
            en: "You can't be serious. He had the keys, he was alone in the building, and the money disappeared. What else do you need?",
            ar: "لا يمكن أن تكوني جادة. كانت معه المفاتيح، وكان وحده في المبنى، واختفى المال. ماذا تحتاجين أكثر؟",
          },
          {
            who: "Diane",
            en: "I need to be sure. Not almost sure. Sure.",
            ar: "أحتاج أن أكون متأكدة. لا شبه متأكدة. متأكدة.",
          },
          {
            who: "Mr. Okafor",
            en: "That is her right, Tyler. Our job is to deliberate, not to vote and go home.",
            ar: "هذا حقها يا تايلر. مهمتنا أن نتداول، لا أن نصوّت ونعود إلى بيوتنا.",
          },
        ],
        question: {
          en: "Why did Diane keep her hand on the table?",
          ar: "لماذا أبقت ديان يدها على الطاولة؟",
          options: [
            { en: "She had known the defendant personally", ar: "كانت تعرف المتهم شخصياً" },
            {
              en: "She was not yet certain that he was guilty",
              ar: "لم تكن متأكدة بعد من أنه مذنب",
            },
            { en: "She had not understood the question", ar: "لم تفهم السؤال" },
            { en: "She wanted the others to leave quickly", ar: "أرادت أن يغادر الآخرون بسرعة" },
          ],
          answer: 1,
          evidence: 4,
        },
      },
      {
        title: "The Manager's Story",
        titleAr: "رواية المدير",
        lines: [
          {
            en: "Diane asked to see the transcript of the restaurant manager's testimony. He was the prosecution's main witness, and she had written three words beside his name in her notebook: times don't match.",
            ar: "طلبت ديان الاطلاع على نص شهادة مدير المطعم. كان الشاهد الرئيسي للادعاء، وكانت قد كتبت بجانب اسمه في دفترها ثلاث كلمات: الأوقات لا تتطابق.",
          },
          {
            who: "Diane",
            en: "On Tuesday, he said he saw Danny leave at eleven-forty. On Wednesday, under pressure, it became 'around midnight.' Nobody noticed, because nobody was listening.",
            ar: "يوم الثلاثاء قال إنه رأى داني يغادر في الحادية عشرة وأربعين دقيقة. وفي الأربعاء، تحت الضغط، صارت «حوالي منتصف الليل». لم يلاحظ أحد، لأن أحداً لم يكن يصغي.",
          },
          {
            who: "Tyler",
            en: "People forget small details. It doesn't change what happened.",
            ar: "الناس ينسون التفاصيل الصغيرة. هذا لا يغيّر ما حدث.",
          },
          {
            who: "Diane",
            en: "Twenty minutes isn't small. The safe was opened at eleven-fifty-five. If Danny left at eleven-forty, he couldn't have done it. If he left at midnight, he could.",
            ar: "عشرون دقيقة ليست تفصيلاً صغيراً. فُتحت الخزنة في الحادية عشرة وخمس وخمسين دقيقة. إذا غادر داني في الحادية عشرة وأربعين فلا يمكن أن يكون هو الفاعل. وإذا غادر عند منتصف الليل فيمكن.",
          },
          {
            who: "Mr. Okafor",
            en: "She is right that the timing matters. Let us ask the judge to have the testimony read back to us.",
            ar: "إنها محقة في أن التوقيت مهم. لنطلب من القاضي أن تُقرأ علينا الشهادة مجدداً.",
          },
          {
            en: "Tyler sighed loudly and checked his watch. He had a shift at six the next morning, and he was not the only one who wanted to go home.",
            ar: "تنهد تايلر بصوت عالٍ ونظر إلى ساعته. كان لديه دوام في السادسة من صباح اليوم التالي، ولم يكن الوحيد الذي يريد العودة إلى بيته.",
          },
        ],
        question: {
          en: "Why was the exact time so important?",
          ar: "لماذا كان التوقيت الدقيق مهماً إلى هذا الحد؟",
          options: [
            { en: "It showed when the restaurant had closed", ar: "كان يبيّن متى أُغلق المطعم" },
            {
              en: "It proved that the manager had stolen the money",
              ar: "كان يثبت أن المدير هو من سرق المال",
            },
            {
              en: "It showed when the jury had started its work",
              ar: "كان يبيّن متى بدأت هيئة المحلفين عملها",
            },
            {
              en: "It decided whether Danny could have been there when the safe was opened",
              ar: "كان يحدد ما إذا كان داني يمكن أن يكون موجوداً عندما فُتحت الخزنة",
            },
          ],
          answer: 3,
          evidence: 3,
        },
      },
      {
        title: "Read It Back",
        titleAr: "اقرؤوها مرة أخرى",
        lines: [
          {
            en: "The court reporter was brought in, and for an hour the room listened to words it had already heard once, only now nobody was staring at the clock.",
            ar: "أُحضرت كاتبة المحكمة، وظلت الغرفة ساعة تُصغي إلى كلمات سبق أن سمعتها مرة، لكن لم يكن أحد هذه المرة يحدّق في الساعة.",
          },
          {
            who: "Court Reporter",
            en: "Question: What time did the defendant leave? Answer: Eleven-forty. Question: Are you certain? Answer: Well, around midnight, I suppose.",
            ar: "السؤال: في أي وقت غادر المتهم؟ الجواب: الحادية عشرة وأربعون دقيقة. السؤال: هل أنت متأكد؟ الجواب: حسناً، حوالي منتصف الليل على ما أظن.",
          },
          {
            en: "Nobody spoke. The words sounded different now, without the manager's confident voice and the prosecutor's calm certainty to carry them.",
            ar: "لم يتكلم أحد. بدت الكلمات مختلفة الآن، بلا صوت المدير الواثق ولا يقين المدعي العام الهادئ ليحملها.",
          },
          {
            who: "Mr. Okafor",
            en: "I was an engineer for forty years. When two measurements disagree by twenty minutes, I don't choose the one I prefer. I stop and ask why.",
            ar: "عملتُ مهندساً أربعين سنة. حين يختلف قياسان بعشرين دقيقة، لا أختار الذي يعجبني. أتوقف وأسأل: لماذا؟",
          },
          {
            en: "A woman in the corner, silent all day, remembered that the manager also had a key to the safe, and that the defense had never been allowed to ask why the restaurant was losing money.",
            ar: "تذكّرت امرأة في الزاوية، كانت صامتة طوال اليوم، أن المدير أيضاً كان يملك مفتاح الخزنة، وأن الدفاع لم يُسمح له قط بأن يسأل لماذا كان المطعم يخسر المال.",
          },
          {
            who: "Diane",
            en: "I'm not saying he's innocent. I'm saying nobody has proved he's guilty.",
            ar: "أنا لا أقول إنه بريء. أقول إن أحداً لم يثبت أنه مذنب.",
          },
        ],
        question: {
          en: 'What does Mr. Okafor mean when he says he doesn\'t "choose the one I prefer"?',
          ar: "ماذا يقصد السيد أوكافور حين يقول إنه لا «يختار الذي يعجبه»؟",
          options: [
            {
              en: "He will not pick between conflicting facts without first asking why they differ",
              ar: "لن يختار بين وقائع متعارضة دون أن يسأل أولاً لماذا تختلف",
            },
            {
              en: "He trusts the first measurement more than the second",
              ar: "يثق بالقياس الأول أكثر من الثاني",
            },
            { en: "He dislikes working with numbers", ar: "لا يحب العمل بالأرقام" },
            {
              en: "He thinks both measurements are probably wrong",
              ar: "يظن أن القياسين خاطئان على الأرجح",
            },
          ],
          answer: 0,
          evidence: 3,
        },
      },
      {
        title: "Not Proven",
        titleAr: "لم يثبت",
        lines: [
          {
            en: "At nine o'clock, they voted again. This time, twelve hands rose for \"not guilty,\" and Tyler's was the last, lifted reluctantly, like something heavy.",
            ar: "عند التاسعة صوّتوا مرة أخرى. وهذه المرة ارتفعت اثنتا عشرة يداً لصالح «غير مذنب»، وكانت يد تايلر آخرها، رُفعت على مضض كأنها شيء ثقيل.",
          },
          {
            who: "Tyler",
            en: "I still think he might have done it. I just can't say it has been proven.",
            ar: "ما زلت أظن أنه ربما فعلها. لكنني لا أستطيع أن أقول إن ذلك قد ثبت.",
          },
          {
            who: "Diane",
            en: "That is exactly the difference between 'might have' and 'did.' Our whole job is knowing which one we are allowed to decide on.",
            ar: "هذا بالضبط هو الفرق بين «ربما فعل» و«فعل». مهمتنا كلها أن نعرف أيهما يحق لنا أن نحكم به.",
          },
          {
            en: "The next morning, the foreman handed the verdict to the judge. Danny Walsh, who had hardly slept for four days, closed his eyes and said nothing.",
            ar: "في صباح اليوم التالي سلّم رئيس هيئة المحلفين الحكم إلى القاضي. أما داني والش، الذي بالكاد نام أربعة أيام، فأغمض عينيه ولم يقل شيئاً.",
          },
          {
            en: "Diane never saw any of the other jurors again. But for years she remembered that eleven people had been ready to decide in four minutes, and that it had taken one person to make them wait.",
            ar: "لم ترَ ديان أياً من بقية المحلفين بعد ذلك. لكنها تذكّرت لسنوات أن أحد عشر شخصاً كانوا مستعدين للحسم في أربع دقائق، وأن الأمر احتاج إلى شخص واحد ليجعلهم ينتظرون.",
          },
        ],
        question: {
          en: "Why was Tyler the last to raise his hand?",
          ar: "لماذا كان تايلر آخر من رفع يده؟",
          options: [
            { en: "He believed that Danny was innocent", ar: "كان يعتقد أن داني بريء" },
            {
              en: "He had not been listening to the discussion",
              ar: "لم يكن يصغي إلى النقاش",
            },
            {
              en: "He still suspected Danny, but accepted that nothing had been proved",
              ar: "كان لا يزال يشك في داني، لكنه قبل بأن شيئاً لم يثبت",
            },
            { en: "He wanted to vote differently from Diane", ar: "أراد أن يصوّت بخلاف ديان" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
    ],
    closing: {
      en: "What is the main idea of the story?",
      ar: "ما الفكرة الرئيسية للقصة؟",
      options: [
        {
          en: "A jury should decide quickly so that nobody wastes time",
          ar: "ينبغي أن تحسم هيئة المحلفين بسرعة حتى لا يضيع وقت أحد",
        },
        {
          en: "Taking doubt seriously can protect a person from a mistake",
          ar: "أخذ الشك على محمل الجد قد يحمي شخصاً من الخطأ",
        },
        {
          en: "Witnesses can never be trusted in court",
          ar: "لا يمكن الوثوق بالشهود في المحكمة أبداً",
        },
        { en: "Engineers make the best jurors", ar: "المهندسون هم أفضل المحلفين" },
      ],
      answer: 1,
    },
    words: [
      {
        word: "windowless",
        sentence: "After three days of testimony, twelve strangers sat in a ___ room",
        hintAr: "بلا نوافذ.",
      },
      {
        word: "transcript",
        sentence: "Diane asked to see the ___ of the restaurant manager's testimony.",
        hintAr: "نص مكتوب لما قيل.",
      },
      {
        word: "deliberate",
        sentence: "Our job is to ___, not to vote and go home.",
        hintAr: "يتداول.",
      },
      {
        word: "reluctantly",
        sentence: "Tyler's was the last, lifted ___, like something heavy.",
        hintAr: "على مضض.",
      },
      {
        word: "foreman",
        sentence: "The next morning, the ___ handed the verdict to the judge.",
        hintAr: "رئيس هيئة المحلفين.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 2
  {
    slug: "window-number-nine",
    order: 2,
    level: "B2",
    tone: "funny",
    icon: "mail",
    title: "Window Number Nine",
    titleAr: "الشباك رقم تسعة",
    summary: "Kevin needed one stamp. The stamp needed a form. The form needed Kevin.",
    summaryAr: "كان كيفن يحتاج إلى ختم واحد. والختم يحتاج إلى استمارة. والاستمارة تحتاج إلى كيفن.",
    cast: { Kevin: "russ", "Mrs. Alvarez": "autumn", "Mr. Pruitt": "calm-male", Zoe: "ash" },
    sections: [
      {
        title: "Number Four Hundred and Twelve",
        titleAr: "الرقم أربعمئة واثنا عشر",
        lines: [
          {
            en: "Kevin had one simple goal that Tuesday: to renew his driver's license before it expired on Friday.",
            ar: "كان لكيفن هدف بسيط في ذلك الثلاثاء: أن يجدّد رخصة قيادته قبل أن تنتهي صلاحيتها يوم الجمعة.",
          },
          {
            en: "He arrived at the Department of Motor Vehicles at eight, took a ticket and sat down with the optimism of a man who had not yet read the instructions.",
            ar: "وصل إلى دائرة المركبات في الثامنة، وأخذ بطاقة دور، وجلس بتفاؤل رجل لم يقرأ التعليمات بعد.",
          },
          {
            en: "His ticket said four hundred and twelve. The screen said fifty-one. Kevin did the math and decided that he should have brought a sleeping bag.",
            ar: "كانت بطاقته تحمل الرقم أربعمئة واثني عشر. وكانت الشاشة تُظهر الرقم واحداً وخمسين. أجرى كيفن الحساب وقرر أنه كان ينبغي أن يحضر كيس نوم.",
          },
          {
            en: "Six hours, two vending-machine lunches and one lost argument with a broken coffee machine later, a robotic voice finally called his number.",
            ar: "وبعد ست ساعات، ووجبتي غداء من آلة البيع، وجدال خاسر مع آلة قهوة معطلة، نادى صوت آلي أخيراً رقمه.",
          },
          {
            en: "Kevin walked to window nine with a folder of documents and the confidence of a man who felt he had earned something.",
            ar: "مشى كيفن نحو الشباك التاسع ومعه مجلد من الأوراق وثقة رجل يشعر بأنه استحق شيئاً.",
          },
          {
            who: "Mrs. Alvarez",
            en: "Documents, please. Proof of identity, proof of address and your expired license.",
            ar: "الأوراق من فضلك. إثبات الهوية، وإثبات العنوان، ورخصتك المنتهية.",
          },
        ],
        question: {
          en: 'What does the narrator suggest by saying Kevin sat down "with the optimism of a man who had not yet read the instructions"?',
          ar: "ماذا يوحي الراوي بقوله إن كيفن جلس «بتفاؤل رجل لم يقرأ التعليمات بعد»؟",
          options: [
            {
              en: "Kevin had studied the instructions carefully",
              ar: "كان كيفن قد درس التعليمات بعناية",
            },
            { en: "Kevin was nervous about the instructions", ar: "كان كيفن قلقاً من التعليمات" },
            {
              en: "Kevin expected an easy process, and he was about to be disappointed",
              ar: "كان كيفن يتوقع إجراءً سهلاً، وكان على وشك أن يخيب أمله",
            },
            { en: "Kevin disliked reading anything", ar: "كان كيفن لا يحب قراءة أي شيء" },
          ],
          answer: 2,
          evidence: 1,
        },
      },
      {
        title: "Proof of Address",
        titleAr: "إثبات العنوان",
        lines: [
          {
            en: "Kevin handed over his passport and a printout of his electricity bill. Mrs. Alvarez studied the paper as though it might explode.",
            ar: "سلّم كيفن جواز سفره وورقة مطبوعة بفاتورة الكهرباء. فحصت السيدة ألفاريز الورقة كأنها قد تنفجر.",
          },
          {
            who: "Mrs. Alvarez",
            en: "This is a printout. We only accept original documents.",
            ar: "هذه نسخة مطبوعة. نحن نقبل المستندات الأصلية فقط.",
          },
          {
            who: "Kevin",
            en: "It's an online bill. There is no original. The company stopped sending paper two years ago.",
            ar: "هذه فاتورة إلكترونية. لا يوجد أصل. توقفت الشركة عن إرسال الورق قبل سنتين.",
          },
          {
            who: "Mrs. Alvarez",
            en: "Then you will need a stamped letter from the company confirming that no original exists.",
            ar: "إذن ستحتاج إلى رسالة مختومة من الشركة تؤكد أنه لا يوجد أصل.",
          },
          {
            en: "Kevin phoned the electricity company from the waiting room. After forty minutes of piano music, a cheerful representative explained that a stamped letter required proof of identity, specifically a valid driver's license.",
            ar: "اتصل كيفن بشركة الكهرباء من قاعة الانتظار. وبعد أربعين دقيقة من موسيقى البيانو، شرح له موظف مبتهج أن الرسالة المختومة تتطلب إثبات هوية، وتحديداً رخصة قيادة سارية.",
          },
          {
            who: "Kevin",
            en: "My license is the reason I'm here!",
            ar: "رخصتي هي سبب وجودي هنا!",
          },
        ],
        question: {
          en: "Why couldn't Kevin obtain the letter he needed?",
          ar: "لماذا لم يستطع كيفن الحصول على الرسالة التي يحتاجها؟",
          options: [
            {
              en: "The company required the very license that he was trying to renew",
              ar: "كانت الشركة تشترط الرخصة نفسها التي يحاول تجديدها",
            },
            {
              en: "The company had stopped sending letters",
              ar: "كانت الشركة قد توقفت عن إرسال الرسائل",
            },
            { en: "The representative could not hear him", ar: "لم يكن الموظف يستطيع سماعه" },
            { en: "He had forgotten his passport", ar: "كان قد نسي جواز سفره" },
          ],
          answer: 0,
          evidence: 4,
        },
      },
      {
        title: "The Back of the Form",
        titleAr: "ظهر الاستمارة",
        lines: [
          {
            en: "Defeated, Kevin sat on the floor beside the vending machine. A teenager waiting for her learner's permit offered him half her sandwich without asking a single question.",
            ar: "جلس كيفن مهزوماً على الأرض بجانب آلة البيع. وعرضت عليه مراهقة تنتظر رخصة المتدرّب نصف شطيرتها دون أن تسأل سؤالاً واحداً.",
          },
          {
            who: "Zoe",
            en: "You're stuck in a loop, aren't you? My uncle was stuck for a month. He says there's something on the back of the form.",
            ar: "أنت عالق في حلقة مفرغة، أليس كذلك؟ عمي ظلّ عالقاً شهراً كاملاً. يقول إن هناك شيئاً مكتوباً على ظهر الاستمارة.",
          },
          {
            en: "Kevin turned the form over. At the very bottom, in tiny grey letters, it said: 'Applicants facing circular requirements should present this page to a supervisor.'",
            ar: "قلب كيفن الاستمارة. وفي أسفلها تماماً، بحروف رمادية صغيرة، كُتب: «على المتقدمين الذين يواجهون شروطاً دائرية أن يقدّموا هذه الصفحة إلى مشرف».",
          },
          {
            en: "He read it three times. The office had known about the problem all along. It had simply printed the solution where nobody would look.",
            ar: "قرأها ثلاث مرات. كان المكتب يعرف المشكلة منذ البداية. لكنه طبع الحل في مكان لن ينظر إليه أحد.",
          },
          {
            who: "Kevin",
            en: "Who reads the back of a form?",
            ar: "ومن يقرأ ظهر الاستمارة؟",
          },
          {
            who: "Zoe",
            en: "Apparently, nobody. That's why my uncle was here for a month.",
            ar: "يبدو أن لا أحد. ولهذا ظلّ عمي هنا شهراً.",
          },
        ],
        question: {
          en: 'What does the narrator imply by saying the office "had simply printed the solution where nobody would look"?',
          ar: "ماذا يوحي الراوي بقوله إن المكتب «طبع الحل في مكان لن ينظر إليه أحد»؟",
          options: [
            {
              en: "The office wanted applicants to find the answer quickly",
              ar: "كان المكتب يريد أن يجد المتقدمون الجواب بسرعة",
            },
            { en: "The solution was printed on the wrong form", ar: "طُبع الحل على استمارة خاطئة" },
            {
              en: "The supervisor had hidden the form on purpose",
              ar: "أخفى المشرف الاستمارة عمداً",
            },
            {
              en: "The answer existed, but in a place that almost no one would notice",
              ar: "كان الجواب موجوداً، لكن في مكان لا يلاحظه أحد تقريباً",
            },
          ],
          answer: 3,
          evidence: 3,
        },
      },
      {
        title: "The Humans",
        titleAr: "البشر",
        lines: [
          {
            en: "Mr. Pruitt, the supervisor, had not smiled since the previous administration. He read the sentence on the back of the form, sighed deeply and stamped it before Kevin had finished explaining.",
            ar: "لم يبتسم السيد بروت، المشرف، منذ الإدارة السابقة. قرأ الجملة المكتوبة على ظهر الاستمارة، وتنهد بعمق، وختمها قبل أن ينتهي كيفن من الشرح.",
          },
          {
            who: "Mr. Pruitt",
            en: "Circular requirement. We get about forty a day. Most people find that sentence on their third visit.",
            ar: "شرط دائري. يصلنا نحو أربعين حالة يومياً. معظم الناس يجدون تلك الجملة في زيارتهم الثالثة.",
          },
          {
            who: "Kevin",
            en: "Forty a day? Then why isn't it on the front?",
            ar: "أربعون في اليوم؟ إذن لماذا ليست على الواجهة؟",
          },
          {
            who: "Mr. Pruitt",
            en: "The front is for the regulations. The back is for the humans.",
            ar: "الواجهة للأنظمة. أما الظهر فللبشر.",
          },
          {
            en: "Ten minutes later, Kevin walked out with a temporary license and the strange feeling of having been let in on a secret. In the parking lot, he passed a man frowning at the same form.",
            ar: "بعد عشر دقائق خرج كيفن ومعه رخصة مؤقتة وشعور غريب بأنه أُطلع على سرّ. وفي موقف السيارات، مرّ برجل يحدّق عابساً في الاستمارة نفسها.",
          },
          {
            who: "Kevin",
            en: "Turn it over. Trust me.",
            ar: "اقلبها. ثق بي.",
          },
        ],
        question: {
          en: 'What does Mr. Pruitt mean by "The front is for the regulations. The back is for the humans"?',
          ar: "ماذا يقصد السيد بروت بقوله «الواجهة للأنظمة. أما الظهر فللبشر»؟",
          options: [
            { en: "The back of the form is less important", ar: "ظهر الاستمارة أقل أهمية" },
            {
              en: "The official rules are on the front, but real help for real people is hidden at the back",
              ar: "القواعد الرسمية على الواجهة، أما المساعدة الحقيقية للناس فمخبأة في الظهر",
            },
            {
              en: "Humans are not allowed to read the front",
              ar: "لا يُسمح للبشر بقراءة الواجهة",
            },
            { en: "Only supervisors can read the back", ar: "المشرفون وحدهم يستطيعون قراءة الظهر" },
          ],
          answer: 1,
          evidence: 3,
        },
      },
    ],
    closing: {
      en: "What is ironic about the way Kevin's problem was solved?",
      ar: "ما المفارقة في الطريقة التي حُلّت بها مشكلة كيفن؟",
      options: [
        {
          en: "The system had contained the solution all along, but hid it from the people who needed it",
          ar: "كان النظام يحمل الحل منذ البداية، لكنه أخفاه عن الذين يحتاجون إليه",
        },
        { en: "Kevin solved it by breaking the rules", ar: "حلّ كيفن المشكلة بمخالفة القواعد" },
        {
          en: "A teenager had to fill in the form for him",
          ar: "اضطرت مراهقة إلى ملء الاستمارة بدلاً منه",
        },
        { en: "The supervisor refused to help at first", ar: "رفض المشرف المساعدة في البداية" },
      ],
      answer: 0,
    },
    words: [
      {
        word: "optimism",
        sentence:
          "He arrived at the Department of Motor Vehicles at eight, took a ticket and sat down with the ___ of a man who had not yet read the instructions.",
        hintAr: "تفاؤل.",
      },
      {
        word: "defeated",
        sentence: "___, Kevin sat on the floor beside the vending machine.",
        hintAr: "منهزم.",
      },
      {
        word: "circular",
        sentence: "Applicants facing ___ requirements should present this page to a supervisor.",
        hintAr: "دائري.",
      },
      {
        word: "supervisor",
        sentence: "Applicants facing circular requirements should present this page to a ___.",
        hintAr: "مشرف.",
      },
      {
        word: "regulations",
        sentence: "The front is for the ___.",
        hintAr: "أنظمة.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────── 3
  {
    slug: "the-reference-letter",
    order: 3,
    level: "B2",
    tone: "inspiring",
    icon: "book",
    title: "The Reference Letter",
    titleAr: "خطاب التوصية",
    summary:
      "Marcus needed a reference letter. He knew exactly one person to ask, and she had every reason to refuse.",
    summaryAr:
      "كان ماركوس يحتاج إلى خطاب توصية. لم يكن يعرف سوى شخص واحد يطلبه منه، وكان لديها كل الأسباب لترفض.",
    cast: { Marcus: "russ", "Mrs. Holloway": "autumn", "Principal Bell": "calm-male" },
    sections: [
      {
        title: "A Knock on the Door",
        titleAr: "طَرقٌ على الباب",
        lines: [
          {
            en: "Mrs. Holloway had retired from teaching eleven years earlier, but former students still visited her small house, usually when they needed something.",
            ar: "تقاعدت السيدة هولواي من التدريس قبل إحدى عشرة سنة، لكن طلابها السابقين ظلوا يزورون بيتها الصغير، عادةً حين يحتاجون إلى شيء.",
          },
          {
            en: "On a rainy Thursday, a tall man in a nervous suit knocked on her door. It took her a full minute to recognize Marcus Reed, who had once locked a substitute teacher in the supply closet.",
            ar: "في يوم خميس ممطر، طرق رجل طويل يرتدي بدلة متوترة بابها. احتاجت إلى دقيقة كاملة لتتعرف إلى ماركوس ريد، الذي كان قد حبس ذات مرة معلماً بديلاً في خزانة المستلزمات.",
          },
          {
            who: "Marcus",
            en: "Mrs. Holloway, I know you have no reason to help me. But I'm applying to be a teacher, and the school needs a reference from someone who knew me as a student.",
            ar: "سيدة هولواي، أعرف أنه ليس لديك سبب لمساعدتي. لكنني أتقدّم لوظيفة معلم، والمدرسة تحتاج إلى خطاب توصية من شخص عرفني طالباً.",
          },
          {
            who: "Mrs. Holloway",
            en: "A reference. From me. For you.",
            ar: "توصية. مني أنا. لك أنت.",
          },
          {
            en: "She did not say yes, and she did not say no. She poured two cups of tea with the slowness of someone choosing her words.",
            ar: "لم تقل نعم، ولم تقل لا. سكبت كوبين من الشاي ببطء من يختار كلماته.",
          },
          {
            who: "Mrs. Holloway",
            en: "I will write what is true, Marcus. Only what is true. If that isn't enough, I can't help you.",
            ar: "سأكتب ما هو حقيقي يا ماركوس. الحقيقي فقط. وإن لم يكن ذلك كافياً فلا أستطيع مساعدتك.",
          },
        ],
        question: {
          en: 'What does Mrs. Holloway mean when she says she will write "only what is true"?',
          ar: "ماذا تقصد السيدة هولواي حين تقول إنها ستكتب «الحقيقي فقط»؟",
          options: [
            {
              en: "She will not exaggerate his good points or hide his faults",
              ar: "لن تبالغ في محاسنه ولن تخفي عيوبه",
            },
            { en: "She will refuse to write the letter", ar: "سترفض كتابة الخطاب" },
            { en: "She will only mention his best qualities", ar: "ستذكر أفضل صفاته فقط" },
            { en: "She will ask the school to decide", ar: "ستطلب من المدرسة أن تقرر" },
          ],
          answer: 0,
          evidence: 5,
        },
      },
      {
        title: "What She Remembered",
        titleAr: "ما تذكّرته",
        lines: [
          {
            en: "When he left, she sat for a long time in front of a blank sheet of paper. The truth was not simple. Marcus had been loud, restless and often rude.",
            ar: "حين غادر، جلست طويلاً أمام ورقة بيضاء. لم تكن الحقيقة بسيطة. فقد كان ماركوس صاخباً ومتململاً وفظاً في كثير من الأحيان.",
          },
          {
            en: "But she remembered the morning after he cracked a classroom window with a football. He had come back alone, before school, with a new pane of glass paid for with his own savings.",
            ar: "لكنها تذكّرت الصباح التالي لليوم الذي كسر فيه نافذة صف بكرة قدم. عاد وحده قبل الدوام ومعه لوح زجاج جديد دفع ثمنه من مدّخراته.",
          },
          {
            en: "She remembered the winter his father lost his job, when Marcus began arriving an hour early. Not to study, but because the school building was warm.",
            ar: "وتذكّرت الشتاء الذي فقد فيه أبوه عمله، حين بدأ ماركوس يصل قبل الموعد بساعة. لا ليدرس، بل لأن مبنى المدرسة كان دافئاً.",
          },
          {
            en: "She remembered that he had defended a younger boy against bullies twice, and that afterwards he had pretended it was nothing.",
            ar: "وتذكّرت أنه دافع مرتين عن ولد أصغر منه ضد متنمّرين، وأنه تظاهر بعد ذلك بأن الأمر لا شيء.",
          },
          {
            en: 'She could have written "energetic and talented." It would have been polite, and it would have been false. Instead, she wrote for three hours, tore up two drafts and began again.',
            ar: "كان بإمكانها أن تكتب «نشيط وموهوب». كان ذلك سيكون لبقاً، وكان سيكون كاذباً. وبدلاً من ذلك كتبت ثلاث ساعات، ومزّقت مسودتين، وبدأت من جديد.",
          },
        ],
        question: {
          en: "Why did Mrs. Holloway tear up two drafts?",
          ar: "لماذا مزّقت السيدة هولواي مسودتين؟",
          options: [
            { en: "She could not remember Marcus clearly", ar: "لم تكن تتذكر ماركوس بوضوح" },
            {
              en: "She was afraid the school would refuse him",
              ar: "كانت تخشى أن ترفضه المدرسة",
            },
            {
              en: "She wanted the letter to be honest rather than merely polite",
              ar: "أرادت أن يكون الخطاب صادقاً لا مجرد لبق",
            },
            {
              en: "She had made too many spelling mistakes",
              ar: "كانت قد ارتكبت أخطاء إملائية كثيرة",
            },
          ],
          answer: 2,
          evidence: 4,
        },
      },
      {
        title: "The Interview",
        titleAr: "المقابلة",
        lines: [
          {
            en: "Two weeks later, Marcus sat across from Principal Bell, a calm man with a gray beard and a folder open on his desk.",
            ar: "بعد أسبوعين جلس ماركوس قبالة المدير بيل، رجل هادئ ذي لحية رمادية ومجلد مفتوح على مكتبه.",
          },
          {
            who: "Principal Bell",
            en: "I have read Mrs. Holloway's letter several times. I would like to read you one sentence.",
            ar: "قرأت خطاب السيدة هولواي عدة مرات. أود أن أقرأ عليك جملة واحدة.",
          },
          {
            en: "Marcus felt his stomach turn. He was certain the sentence would be about the supply closet.",
            ar: "شعر ماركوس بمعدته تنقلب. كان متأكداً من أن الجملة ستكون عن خزانة المستلزمات.",
          },
          {
            who: "Principal Bell",
            en: "'Marcus was the most difficult student I ever taught, and the only one I never stopped believing in.'",
            ar: "«كان ماركوس أصعب طالب علّمته في حياتي، والوحيد الذي لم أتوقف يوماً عن الإيمان به.»",
          },
          {
            en: "The room was quiet. Marcus stared at his hands and discovered that he could not swallow.",
            ar: "ساد الهدوء الغرفة. حدّق ماركوس في يديه واكتشف أنه لا يستطيع أن يبتلع ريقه.",
          },
          {
            who: "Principal Bell",
            en: "Most reference letters describe a perfect candidate who does not exist. This one describes a real person who has changed. In my experience, those are the teachers children trust.",
            ar: "معظم خطابات التوصية تصف مرشحاً مثالياً لا وجود له. أما هذا فيصف شخصاً حقيقياً تغيّر. وبحسب خبرتي، هؤلاء هم المعلمون الذين يثق بهم الأطفال.",
          },
        ],
        question: {
          en: "Why did Principal Bell value Mrs. Holloway's letter?",
          ar: "لماذا قدّر المدير بيل خطاب السيدة هولواي؟",
          options: [
            {
              en: "It listed all of Marcus's achievements",
              ar: "لأنه عدّد كل إنجازات ماركوس",
            },
            {
              en: "It described a real, changed person instead of a perfect one",
              ar: "لأنه وصف شخصاً حقيقياً تغيّر بدلاً من شخص مثالي",
            },
            { en: "It was longer than the other letters", ar: "لأنه كان أطول من الخطابات الأخرى" },
            {
              en: "It promised that Marcus would never cause trouble",
              ar: "لأنه وعد بأن ماركوس لن يسبّب أي مشكلة",
            },
          ],
          answer: 1,
          evidence: 5,
        },
      },
      {
        title: "Room Fourteen",
        titleAr: "الغرفة أربعة عشر",
        lines: [
          {
            en: "Marcus started in September, in Room Fourteen, with thirty-one students and a stomach full of nerves.",
            ar: "بدأ ماركوس العمل في سبتمبر في الغرفة أربعة عشر، مع واحد وثلاثين طالباً ومعدة مليئة بالتوتر.",
          },
          {
            en: "On the first morning, a boy in the back row put his feet on the desk and stared at him with open contempt.",
            ar: "وفي الصباح الأول وضع ولد في الصف الأخير قدميه على المقعد وحدّق فيه بازدراء صريح.",
          },
          {
            en: "Marcus recognized the look. He had worn it himself for years.",
            ar: "تعرّف ماركوس على تلك النظرة. فقد ارتداها هو نفسه سنوات.",
          },
          {
            who: "Marcus",
            en: "Feet down, please. And stay a moment after class. You're not in trouble. I just think you're smarter than you let people see.",
            ar: "أنزل قدميك من فضلك. وابقَ لحظة بعد الحصة. لست في مشكلة. أظن فقط أنك أذكى مما تدع الناس يرون.",
          },
          {
            en: "The boy looked surprised, then suspicious, then, very slightly, curious.",
            ar: "بدت المفاجأة على الولد، ثم الشك، ثم، بقدر ضئيل جداً، الفضول.",
          },
          {
            en: "That evening, Marcus wrote a note on a plain white card and mailed it to a small house across town.",
            ar: "في ذلك المساء كتب ماركوس ملاحظة على بطاقة بيضاء بسيطة وأرسلها بالبريد إلى بيت صغير في الجهة الأخرى من المدينة.",
          },
          {
            who: "Marcus",
            en: "Dear Mrs. Holloway, I got the job. I think I will need a lot of tea and a lot of patience. Thank you for trusting the true version of me.",
            ar: "عزيزتي السيدة هولواي، حصلت على الوظيفة. أظن أنني سأحتاج إلى كثير من الشاي وكثير من الصبر. شكراً لأنك وثقتِ بالنسخة الحقيقية مني.",
          },
        ],
        question: {
          en: "Why did Marcus speak to the boy in the back row the way he did?",
          ar: "لماذا خاطب ماركوس الولد في الصف الأخير بهذه الطريقة؟",
          options: [
            {
              en: "He wanted to punish the boy in front of the class",
              ar: "أراد أن يعاقب الولد أمام الصف",
            },
            { en: "He was afraid of the boy", ar: "كان يخاف من الولد" },
            { en: "He wanted the principal to notice him", ar: "أراد أن يلاحظه المدير" },
            {
              en: "He recognized a version of his younger self in the boy and wanted to reach him",
              ar: "تعرّف في الولد على صورة من نفسه حين كان أصغر وأراد أن يصل إليه",
            },
          ],
          answer: 3,
          evidence: 2,
        },
      },
    ],
    closing: {
      en: "What is the central message of the story?",
      ar: "ما الرسالة الأساسية للقصة؟",
      options: [
        {
          en: "Teachers should never forgive bad behavior",
          ar: "على المعلمين ألا يغفروا سوء السلوك أبداً",
        },
        {
          en: "A reference letter must always be positive",
          ar: "يجب أن يكون خطاب التوصية إيجابياً دائماً",
        },
        {
          en: "Honest belief in a person can change their future",
          ar: "الإيمان الصادق بشخص ما يمكن أن يغيّر مستقبله",
        },
        { en: "Young people should avoid taking risks", ar: "على الشباب أن يتجنبوا المخاطرة" },
      ],
      answer: 2,
    },
    words: [
      {
        word: "substitute",
        sentence: "who had once locked a ___ teacher in the supply closet.",
        hintAr: "بديل.",
      },
      {
        word: "reference",
        sentence:
          "But I'm applying to be a teacher, and the school needs a ___ from someone who knew me as a student.",
        hintAr: "توصية.",
      },
      {
        word: "restless",
        sentence: "Marcus had been loud, ___ and often rude.",
        hintAr: "متململ.",
      },
      {
        word: "candidate",
        sentence: "Most reference letters describe a perfect ___ who does not exist.",
        hintAr: "مرشّح.",
      },
      {
        word: "contempt",
        sentence:
          "On the first morning, a boy in the back row put his feet on the desk and stared at him with open ___.",
        hintAr: "ازدراء.",
      },
    ],
  },
];
