/**
 * The second wave of public rule pages, the A1 rules that carry a mistake Arabic speakers make (see
 * rule-articles.ts for what an article is and how it is checked).
 */

import type { RuleArticle } from "./types";

export const RULE_ARTICLES_A1: Readonly<Record<string, RuleArticle>> = {
  "a1-25": {
    h1: "ضمائر الفاعل في الإنجليزية: I و he و she و it و we و they",
    description:
      "متى نستعمل I وyou وhe وshe وit وwe وthey؟ ولماذا لا نحذف الفاعل في الإنجليزية كما نفعل بالعربية؟ جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "الضمائر السبعة" },
      {
        kind: "table",
        head: ["الضمير", "نستعمله لـ", "مثال"],
        rows: [
          ["I", "أنا (المتكلم)", "I am a student."],
          ["you", "أنت أو أنتم (المخاطَب)", "You are right."],
          ["he", "رجل أو ولد", "He is a teacher."],
          ["she", "امرأة أو بنت", "She is a nurse."],
          ["it", "شيء أو حيوان", "It is a cat."],
          ["we", "نحن", "We study together."],
          ["they", "هم أو هنّ", "They live here."],
        ],
      },
      { kind: "h2", text: "لماذا لا نحذف الفاعل؟" },
      {
        kind: "p",
        text: "في العربية يكفي أن نقول «تدرس الإنجليزية» لأن الفعل نفسه يدل على الفاعل. أما في الإنجليزية فالفعل لا يدل على من فعل، فلا بدّ أن نذكر الفاعل: She studies English. ولا نقول Studies English.",
      },
      { kind: "h2", text: "كيف تختار الضمير؟" },
      {
        kind: "p",
        text: "انظر إلى من تتحدث عنه: امرأة واحدة (she)، رجل واحد (he)، شيء أو حيوان (it)، أكثر من واحد (they). مثال: My parents live in Basra. They are happy there.",
      },
    ],
    examplesAr: [
      "سارة أختي. هي ممرضة.",
      "علي أخي. هو طالب.",
      "عندي قطة. إنها بيضاء.",
      "ليلى وأنا صديقتان. ندرس معاً.",
      "والداي يسكنان في البصرة. هما سعيدان هناك.",
      "هل أنت جائع؟ نعم، أنا جائع.",
    ],
    faqs: [
      {
        q: "هل you للمفرد وللجمع؟",
        a: "نعم. you تُستعمل للمخاطَب الواحد وللجماعة، وللمذكر وللمؤنث: You are my friend. You are my friends.",
      },
      {
        q: "هل يمكن أن أبدأ الجملة بالفعل كما في العربية؟",
        a: "لا، إلا في الأسئلة والأوامر. في الجملة الخبرية نبدأ بالفاعل: She is happy. وليس Is happy.",
      },
    ],
  },

  "a1-26": {
    h1: "النفي مع be في الإنجليزية: isn't و aren't و I'm not",
    description:
      "كيف ننفي الجملة مع am وis وare؟ ولماذا لا نستعمل don't معها؟ القاعدة والأخطاء الشائعة وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ضع not بعد be" },
      {
        kind: "p",
        text: "للنفي مع be نضع not بعدها مباشرة: I am not tired. He is not at home. They are not ready. وفي الكلام نختصر: isn't وaren't.",
      },
      {
        kind: "table",
        head: ["الإثبات", "النفي", "الاختصار"],
        rows: [
          ["I am", "I am not", "I'm not"],
          ["he / she / it is", "he / she / it is not", "isn't"],
          ["you / we / they are", "you / we / they are not", "aren't"],
        ],
      },
      { kind: "h2", text: "تذكّر" },
      {
        kind: "list",
        items: [
          "الاختصار isn't وaren't شائع في الكلام. وفي الكتابة الرسمية نفضّل is not وare not.",
          "بعد not نكمل الجملة كما هي: She isn't at home. He isn't a doctor. It isn't cold.",
          "لا نغيّر ترتيب الجملة في النفي: الفاعل ثم be ثم not.",
        ],
      },
    ],
    examplesAr: [
      "علي في المدرسة. هو ليس في البيت.",
      "المحلات مغلقة. إنها ليست مفتوحة.",
      "لست جائعاً. أريد بعض الشاي.",
      "أختي ممرضة. هي ليست معلمة.",
      "نحن لسنا متأخرين. الحصة تبدأ في التاسعة.",
      "الجو ليس بارداً اليوم.",
    ],
    faqs: [
      {
        q: "كيف أنفي I am؟",
        a: "نقول I am not أو I'm not. ولا نقول I amn't.",
      },
      {
        q: "هل يصح أن أقول She doesn't tired؟",
        a: "لا. don't وdoesn't لا تأتي مع be. نقول She isn't tired.",
      },
      {
        q: "ما الفرق بين isn't وis not؟",
        a: "المعنى واحد. isn't اختصار يُستعمل في الكلام والكتابة غير الرسمية.",
      },
    ],
  },

  "a1-29": {
    h1: "العمر والمشاعر في الإنجليزية: I am 20 و I am hungry",
    description:
      "بالعربية نقول «عندي 20 سنة» و«أنا جائع»، وفي الإنجليزية نستعمل be لا have. شرح للقاعدة مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "نستعمل be وليس have" },
      {
        kind: "p",
        text: "للعمر نقول I am twenty. وللمشاعر والحالة الجسدية نقول I am hungry وI am cold. ولا نقول I have hungry ولا I have 20 years.",
      },
      {
        kind: "table",
        head: ["بالعربية", "بالإنجليزية"],
        rows: [
          ["عندي 20 سنة", "I am 20 (years old)."],
          ["أنا جائع", "I am hungry."],
          ["أنا عطشان", "I am thirsty."],
          ["أشعر بالبرد", "I am cold."],
          ["أنا خائف", "I am afraid."],
        ],
      },
      { kind: "h2", text: "أمثلة على ما يأخذ be" },
      {
        kind: "list",
        items: [
          "الحالة الجسدية: hungry، thirsty، cold، hot، tired.",
          "المشاعر: happy، sad، afraid، angry.",
          "العمر: I am ten. أو I am ten years old.",
        ],
      },
    ],
    examplesAr: [
      "ليلى عمرها عشر سنوات.",
      "أنا عطشان. أريد قليلاً من الماء.",
      "إنه الشتاء ونحن نشعر بالبرد.",
      "أخي يخاف من الكلاب.",
      "هل أنت جائع؟",
      "هم متعبون بعد الرحلة.",
    ],
    faqs: [
      {
        q: "كيف أقول إن عمري 20 سنة؟",
        a: "نقول I am 20 أو I am twenty years old. ولا نقول I have 20 years.",
      },
      {
        q: "هل أستعمل have مع أي شعور؟",
        a: "لا. مع الجوع والعطش والبرد والخوف نستعمل be: I am hungry. أما have فتأتي مع الأمراض مثل I have a headache.",
      },
    ],
  },

  "a1-30": {
    h1: "متى نستعمل it في الإنجليزية؟ الأشياء والحيوانات والطقس",
    description:
      "في العربية كل شيء «هو» أو «هي»، وفي الإنجليزية الشيء it لا he ولا she. القاعدة وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "it للأشياء والحيوانات" },
      {
        kind: "p",
        text: "نستعمل it للشيء (طاولة، سيارة، هاتف) وللحيوان العادي (cat، dog): I have a car. It is old. ولا نقول She is old عن السيارة، حتى لو كانت كلمتها مؤنثة في العربية.",
      },
      { kind: "h2", text: "it مع الطقس والوقت" },
      {
        kind: "p",
        text: "نستعمل it أيضاً للطقس والوقت: It is cold. It is nine o'clock. It is sunny today.",
      },
      {
        kind: "table",
        head: ["الاستعمال", "مثال"],
        rows: [
          ["شيء", "It is a table."],
          ["حيوان", "It is a cat."],
          ["الطقس", "It is cold."],
          ["الوقت", "It is nine o'clock."],
        ],
      },
    ],
    examplesAr: [
      "عندي حاسوب محمول. إنه جديد.",
      "انظر إلى القمر. إنه جميل.",
      "قطتي صغيرة. تنام طوال اليوم.",
      "الطقس لطيف. الجو مشمس.",
      "أحب هذا الكتاب. إنه ممتع جداً.",
      "عندنا حديقة. إنها خلف البيت.",
    ],
    faqs: [
      {
        q: "هل أستعمل he أو she للحيوان الأليف؟",
        a: "الأصل أن نقول it للحيوان. لكن حين يكون حيواناً أليفاً نعرفه باسمه، يقول بعض الناس he أو she.",
      },
      {
        q: "ما الفاعل في جملة It is cold؟",
        a: "it هنا فاعل شكلي. الجملة الإنجليزية تحتاج فاعلاً دائماً، فنضع it في جمل الطقس والوقت.",
      },
    ],
  },

  "a1-32": {
    h1: "mine و yours و his و hers: ضمائر الملكية في الإنجليزية",
    description:
      "الفرق بين my وmine وyour وyours، ولماذا لا نضع اسماً بعد mine. جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "صفة الملكية وضمير الملكية" },
      {
        kind: "p",
        text: "my وyour وhis وher وour وtheir تأتي قبل الاسم: my bag. أما mine وyours وhis وhers وours وtheirs فتقف وحدها بدل الاسم: The bag is mine.",
      },
      {
        kind: "table",
        head: ["قبل الاسم", "وحدها"],
        rows: [
          ["my bag", "mine"],
          ["your bag", "yours"],
          ["his bag", "his"],
          ["her bag", "hers"],
          ["our bag", "ours"],
          ["their bag", "theirs"],
        ],
      },
      { kind: "h2", text: "قاعدة سهلة" },
      {
        kind: "p",
        text: "إذا كتبت الاسم بعد الكلمة فاستعمل my وyour وher. وإذا انتهت الجملة بالكلمة فاستعمل mine وyours وhers: It is my bag. It is mine. ولا نقول It is mine bag.",
      },
    ],
    examplesAr: [
      "هذا هاتفي. إنه لي.",
      "ذلك معطفك. إنه لك.",
      "اشترينا هذه السيارة. إنها لنا.",
      "سارة عندها حقيبة حمراء. الحقيبة الحمراء لها.",
      "علي وعمر عندهما كلب. الكلب لهما.",
      "توم عنده دراجة جديدة. الدراجة الجديدة له.",
    ],
    faqs: [
      {
        q: "ما الفرق بين my وmine؟",
        a: "my تأتي قبل اسم: my phone. وmine تأتي وحدها: The phone is mine.",
      },
      {
        q: "هل أقول It is mine bag؟",
        a: "لا. نقول It is my bag أو It is mine.",
      },
    ],
  },

  "a1-39": {
    h1: "الطلب والعرض بأدب في الإنجليزية: Can I و Could you و Would you like",
    description:
      "كيف نطلب شيئاً أو نطلب مساعدة أو نعرض شيئاً بأدب؟ Can I وCould you وWould you like مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ثلاثة أنماط" },
      {
        kind: "table",
        head: ["الغرض", "النمط", "مثال"],
        rows: [
          ["نطلب شيئاً لأنفسنا", "Can I … ? / Could I … ?", "Can I have a glass of water?"],
          ["نطلب من أحد أن يفعل شيئاً", "Could you … ? / Can you … ?", "Could you help me, please?"],
          ["نعرض شيئاً", "Would you like … ?", "Would you like some tea?"],
        ],
      },
      { kind: "h2", text: "كيف نكون أكثر أدباً؟" },
      {
        kind: "p",
        text: "Could أكثر أدباً من Can، ونضيف please في آخر الجملة: Could you open the window, please? وبعد can وcould نضع الفعل الأساسي بلا to: Can I go? وليس Can I to go?",
      },
      { kind: "h2", text: "كيف نجيب؟" },
      {
        kind: "p",
        text: "عن Would you like some tea? نقول للقبول Yes, please. وللرفض No, thank you.",
      },
    ],
    examplesAr: [
      "هل يمكنني الحصول على كأس ماء؟",
      "هل يمكنك مساعدتي من فضلك؟",
      "هل تحب بعض الشاي؟",
      "هل يمكنني الجلوس هنا؟",
      "هل يمكنك أن تتكلم ببطء من فضلك؟",
      "هل تحب أن تأتي معنا؟",
    ],
    faqs: [
      {
        q: "هل أقول Do you could؟",
        a: "لا. could فعل مساعد يأتي في أول السؤال: Could you open the window?",
      },
      {
        q: "ما الفرق بين Can I وCould I؟",
        a: "المعنى واحد تقريباً، لكن Could أكثر أدباً، وتناسب الغرباء والمواقف الرسمية.",
      },
    ],
  },

  "a1-42": {
    h1: "want to و need to و would like to: الفعل بعد to",
    description:
      "بعد want وneed وwould like نستعمل to ثم الفعل الأساسي. الخطأ الشائع I want learn وShe wants to goes، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "الصيغة" },
      {
        kind: "p",
        text: "want أو need أو would like، ثم to، ثم الفعل الأساسي: I want to learn English. She needs to go. We would like to sit here.",
      },
      {
        kind: "table",
        head: ["الفعل", "مثال"],
        rows: [
          ["want", "He wants to buy a new phone."],
          ["need", "I need to sleep early tonight."],
          ["would like", "They would like to sit near the window."],
        ],
      },
      { kind: "h2", text: "ثلاث نقاط" },
      {
        kind: "list",
        items: [
          "لا نحذف to: I want to learn، وليس I want learn.",
          "الفعل بعد to يبقى بشكله الأساسي، بلا -s ولا -ing: She wants to go.",
          "الفعل الأول هو الذي يأخذ -s مع he وshe وit: He wants، She needs.",
        ],
      },
    ],
    examplesAr: [
      "أريد أن أتعلم الإنجليزية.",
      "هي بحاجة إلى الذهاب إلى الطبيب.",
      "نودّ زيارة البصرة.",
      "يريد شراء هاتف جديد.",
      "أحتاج إلى النوم مبكراً الليلة.",
      "يودّون الجلوس قرب النافذة.",
    ],
    faqs: [
      {
        q: "هل أقول I want to learning؟",
        a: "لا. بعد to نضع الفعل الأساسي: I want to learn.",
      },
      {
        q: "ما الفرق بين want وwould like؟",
        a: "want مباشرة، وwould like أكثر أدباً: I would like a coffee.",
      },
      {
        q: "هل أضيف s للفعل الثاني مع she؟",
        a: "لا. s تأتي مع الفعل الأول فقط: She wants to go.",
      },
    ],
  },

  "a1-43": {
    h1: "next to و between و behind و in front of: حروف الجر للمكان",
    description:
      "كيف نصف مكان الشيء بـ next to وbetween وbehind وin front of؟ والخطأ الشائع behind of، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "أربعة حروف جر" },
      {
        kind: "table",
        head: ["الكلمة", "المعنى", "مثال"],
        rows: [
          ["next to", "بجانب", "I sit next to my friend."],
          ["between", "بين اثنين", "The cafe is between the bank and the shop."],
          ["behind", "خلف", "The garden is behind the house."],
          ["in front of", "أمام", "The car is in front of the house."],
        ],
      },
      { kind: "h2", text: "لا نضيف of" },
      {
        kind: "p",
        text: "نقول behind the door وbetween the chairs وnext to the bank، بلا of بعدها. الوحيدة التي فيها of هي in front of، وهي عبارة ثابتة من ثلاث كلمات.",
      },
      { kind: "h2", text: "وقريب منها" },
      {
        kind: "p",
        text: "near تعني «قريب من»، وتأتي بلا to ولا of: The school is near my house.",
      },
    ],
    examplesAr: [
      "البنك على اليسار والمحل على اليمين. المقهى بينهما.",
      "الحديقة في مؤخرة البيت. إنها خلف البيت.",
      "السيارة في مقدمة البيت. إنها أمام البيت.",
      "نجلس جنباً إلى جنب. أجلس بجانب صديقي.",
      "المدرسة ليست بعيدة. إنها قريبة من بيتي.",
      "القطة تختبئ في مؤخرة الأريكة. إنها خلف الأريكة.",
    ],
    faqs: [
      {
        q: "هل نقول behind of؟",
        a: "لا. نقول behind فقط: The cat is behind the door.",
      },
      {
        q: "متى أستعمل between؟",
        a: "بين شيئين: between the bank and the shop. وبين مجموعة كبيرة نستعمل among.",
      },
    ],
  },
};
