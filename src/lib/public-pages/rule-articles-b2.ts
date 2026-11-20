/**
 * The second wave of public rule pages, the B2 rules that carry a mistake Arabic speakers make (see
 * rule-articles.ts for what an article is and how it is checked).
 */

import type { RuleArticle } from "./types";

export const RULE_ARTICLES_B2: Readonly<Record<string, RuleArticle>> = {
  "b2-14": {
    h1: "الفرق بين used to و be used to و get used to في الإنجليزية",
    description:
      "ما الفرق بين used to + فعل وbe used to + -ing وget used to؟ ثلاث صيغ متشابهة تُربك الكثيرين، مع جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ثلاث صيغ متشابهة" },
      {
        kind: "table",
        head: ["الصيغة", "المعنى", "مثال"],
        rows: [
          ["used to + فعل", "عادة قديمة انتهت", "I used to live in Mosul."],
          ["be used to + -ing", "معتاد عليه الآن", "I am used to getting up early."],
          [
            "get used to + -ing",
            "أتعوّد تدريجياً",
            "It took me a month to get used to living in a big city.",
          ],
        ],
      },
      { kind: "h2", text: "كيف أفرّق؟" },
      {
        kind: "list",
        items: [
          "إذا جاء بعد used to فعل بصيغته الأساسية فهي عادة كانت في الماضي.",
          "إذا جاء بعد be used to فعل مع -ing فأنت معتاد عليه الآن.",
          "get used to هي عملية التعوّد نفسها، وbe used to هي النتيجة بعدها.",
        ],
      },
      { kind: "h2", text: "تنبيه" },
      {
        kind: "p",
        text: "في be used to وget used to تكون to حرف جر، فيأتي بعدها اسم أو فعل مع -ing: I am used to the noise. I am used to working at night.",
      },
    ],
    examplesAr: [
      "أنا معتاد على الاستيقاظ مبكراً.",
      "هي غير معتادة على القيادة من جهة اليسار.",
      "احتجت شهراً لأعتاد على العيش في مدينة كبيرة.",
      "هو معتاد على العمل ليلاً.",
      "لسنا معتادين على الأكل بهذا التأخر.",
      "هل أنت معتاد على التكلم بالإنجليزية كل يوم؟",
    ],
    faqs: [
      {
        q: "هل أقول I am used to get up؟",
        a: "لا. بعد be used to نستعمل -ing: I am used to getting up.",
      },
      {
        q: "ما الفرق بين used to وbe used to؟",
        a: "used to + فعل لعادة كانت في الماضي وانتهت: I used to live in Mosul. أما be used to + -ing فمعتاد عليه الآن: I am used to living in Erbil.",
      },
      {
        q: "كيف أقول «تعوّدت» بالإنجليزية؟",
        a: "نقول I got used to it لحدث التعوّد، وI am used to it لحالتي الآن.",
      },
    ],
  },

  "b2-19": {
    h1: "provided و as long as و in case و otherwise: الفرق بينها",
    description:
      "ما معنى provided وas long as وin case وotherwise؟ والخطأ الشائع بين in case وif، مع جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "أربع كلمات، أربعة معانٍ" },
      {
        kind: "table",
        head: ["الكلمة", "المعنى", "مثال"],
        rows: [
          ["provided / providing", "بشرط أن", "You can borrow my car provided you drive carefully."],
          ["as long as", "ما دام، بشرط أن", "I'll lend you the book as long as you give it back."],
          ["in case", "تحسباً لـ", "Take an umbrella in case it rains."],
          ["otherwise", "وإلا", "Hurry up, otherwise we will miss the bus."],
        ],
      },
      { kind: "h2", text: "in case ليست if" },
      {
        kind: "p",
        text: "in case تعني أنك تفعل الشيء قبل أن يحدث الأمر، احتياطاً: Take an umbrella in case it rains (خذ المظلة الآن، فربما تمطر). أما if فتعني بعد أن يحدث الأمر: If it rains, I'll take an umbrella (آخذها عندما تمطر).",
      },
      { kind: "h2", text: "provided وas long as" },
      {
        kind: "p",
        text: "تدخلان الشرط مثل if لكن بقوة أكبر: لا يحدث الأمر إلا بهذا الشرط. وهما متقاربتان في المعنى، وprovided أكثر رسمية.",
      },
    ],
    examplesAr: [
      "يمكنك استعارة سيارتي بشرط أن تقود بحذر.",
      "خذ مظلة تحسباً لأن تمطر.",
      "أسرع، وإلا فستفوتنا الحافلة.",
      "سأعيرك الكتاب ما دمت ستعيده.",
      "اكتبه تحسباً لأن تنسى.",
      "ارتدِ خوذة، وإلا فقد تتأذى.",
    ],
    faqs: [
      {
        q: "ما الفرق بين in case وif؟",
        a: "in case لما نفعله قبل أن يحدث الأمر احتياطاً، وif لما نفعله بعد أن يحدث. Take a coat in case it gets cold. If it gets cold, I'll wear it.",
      },
      {
        q: "هل provided وprovided that متساويتان؟",
        a: "نعم. that اختيارية: provided you finish أو provided that you finish.",
      },
    ],
  },

  "b2-28": {
    h1: "أفعال النقل في الإنجليزية: suggest و admit و promise و refuse",
    description:
      "أي فعل بعده -ing وأي فعل بعده to؟ admit وdeny وsuggest مع -ing، وpromise وrefuse وoffer مع to، والخطأ الشائع suggested me to، مع أمثلة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ثلاثة أنماط" },
      {
        kind: "table",
        head: ["النمط", "الأفعال", "مثال"],
        rows: [
          ["+ -ing", "admit، deny، suggest", "He admitted stealing the money."],
          ["+ to + فعل", "promise، refuse، offer، agree", "He promised to call me tonight."],
          ["+ شخص + not to + فعل", "warn", "The guide warned us not to touch the paintings."],
        ],
      },
      { kind: "h2", text: "خطأ شائع مع suggest" },
      {
        kind: "p",
        text: "بعد suggest لا نضع شخصاً ثم to. نقول She suggested going out، أو She suggested that we go out. ولا نقول She suggested me to go out.",
      },
      { kind: "h2", text: "كيف نحفظها؟" },
      {
        kind: "p",
        text: "احفظ كل فعل مع نمطه، مثل admit + -ing وpromise + to. والأسهل أن تحفظ جملة مثال لكل فعل.",
      },
    ],
    examplesAr: [
      "اعترف بسرقة المال.",
      "اقترحت الذهاب إلى الحديقة.",
      "وعد أن يتصل بي الليلة.",
      "رفضوا دفع الفاتورة.",
      "أنكرت أنها كسرت النافذة.",
      "حذّرنا المرشد من لمس اللوحات.",
    ],
    faqs: [
      {
        q: "هل أقول She suggested me to go؟",
        a: "لا. نقول She suggested going أو She suggested that I go.",
      },
      {
        q: "هل أقول admit to doing أم admit doing؟",
        a: "الاثنان صحيحان: He admitted stealing. He admitted to stealing. لكن لا نقول admitted to steal.",
      },
    ],
  },

  "b2-29": {
    h1: "must و can't و might: كيف نخمّن بالإنجليزية (modals of deduction)",
    description:
      "كيف نقول «لا بد أنه» و«لا يمكن أن يكون» و«ربما» بالإنجليزية؟ must وcan't وmight، والخطأ الشائع mustn't، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "درجات اليقين" },
      {
        kind: "table",
        head: ["اليقين", "الفعل", "مثال"],
        rows: [
          ["متأكد أنه صحيح", "must", "He has been working all day. He must be tired."],
          ["متأكد أنه غير صحيح", "can't", "That can't be Ali. He is in Dubai."],
          ["ربما", "might / may / could", "He might be in the library."],
        ],
      },
      { kind: "h2", text: "الخطأ الشائع" },
      {
        kind: "p",
        text: "للتخمين السلبي نستعمل can't لا mustn't: That can't be true. أما mustn't فتعني «ممنوع»: You mustn't park here.",
      },
      { kind: "h2", text: "الصيغة" },
      {
        kind: "p",
        text: "بعد هذه الأفعال نضع be أو فعلاً بصيغته الأساسية: He must be tired. She might know the answer.",
      },
    ],
    examplesAr: [
      "يعمل طوال اليوم. لا بد أنه متعب.",
      "هي في المطار الآن، فلا يمكن أن تكون في البيت.",
      "لست متأكداً أين هو. ربما يكون في المكتبة.",
      "الأضواء مضاءة. لا بد أن أحداً في الداخل.",
      "لا يمكن أن يكون هذا علياً. هو في دبي.",
      "اسمع هذا الصوت. لا بد أنه الجيران.",
    ],
    faqs: [
      {
        q: "هل أقول That mustn't be true؟",
        a: "لا. للتخمين نقول That can't be true. أما mustn't فتعني «ممنوع».",
      },
      {
        q: "ما الفرق بين might وmust؟",
        a: "must يعني أنك متأكد تقريباً، وmight يعني أنه احتمال فقط.",
      },
    ],
  },

  "b2-32": {
    h1: "الفرق بين be supposed to و be allowed to في الإنجليزية",
    description:
      "ما معنى be supposed to وbe allowed to؟ المتوقع مقابل المسموح، والخطأ الشائع suppose to بلا d، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "المتوقع والمسموح" },
      {
        kind: "table",
        head: ["الصيغة", "المعنى", "مثال"],
        rows: [
          ["be supposed to", "من المفترض أو المتوقع منك", "You are supposed to be at school at eight."],
          ["be allowed to", "مسموح لك", "Visitors are allowed to take photos here."],
          ["not allowed to", "ممنوع", "Students aren't allowed to eat in the library."],
        ],
      },
      { kind: "h2", text: "كيف أفرّق؟" },
      {
        kind: "p",
        text: "be supposed to عما يُنتظر أن يحدث حسب الخطة أو القاعدة، وقد لا يحدث: I was supposed to call her, but I forgot. أما be allowed to فعن الإذن: هل يُسمح لك أو لا.",
      },
      { kind: "h2", text: "انتبه للكتابة" },
      {
        kind: "p",
        text: "نكتب supposed وallowed بالـ d في آخرهما: I was supposed to call. Children aren't allowed to enter. ولا نكتب suppose to.",
      },
    ],
    examplesAr: [
      "من المفترض أن تكون في المدرسة في الثامنة.",
      "غير مسموح لنا باستعمال الهواتف في الامتحان.",
      "كان من المفترض أن أتصل بها لكنني نسيت.",
      "مسموح للزوار بالتصوير هنا.",
      "من المفترض أن يصل عند الظهر.",
      "لا يُسمح للطلاب بالأكل في المكتبة.",
    ],
    faqs: [
      {
        q: "هل أكتب I was suppose to؟",
        a: "لا. نكتب supposed بالـ d: I was supposed to.",
      },
      {
        q: "ما الفرق بين be supposed to وmust؟",
        a: "must إلزام قوي. أما be supposed to فعن المتوقع أو المفترض، وقد لا يحدث.",
      },
    ],
  },

  "b2-34": {
    h1: "الجملة الموصولة مع حرف الجر في الإنجليزية: the man with whom I work",
    description:
      "كيف نضع حرف الجر قبل whom وwhich؟ ولماذا لا نقول with who؟ الصيغة الرسمية والعادية، مع جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "صيغتان للمعنى نفسه" },
      {
        kind: "table",
        head: ["رسمية (حرف الجر قبل whom أو which)", "عادية (حرف الجر في الآخر)"],
        rows: [
          ["the man with whom I work", "the man I work with"],
          ["the house in which I live", "the house I live in"],
          ["the woman to whom I spoke", "the woman I spoke to"],
        ],
      },
      { kind: "h2", text: "القاعدة" },
      {
        kind: "list",
        items: [
          "إذا وضعنا حرف الجر قبل الكلمة الموصولة نستعمل whom للأشخاص وwhich للأشياء فقط.",
          "لا نستعمل who ولا that بعد حرف الجر: لا نقول with who ولا in that.",
          "وإذا بقي حرف الجر في آخر الجملة جاز أن نستعمل who أو that أو نحذفهما.",
        ],
      },
    ],
    examplesAr: [
      "هذا هو الرجل الذي أعمل معه.",
      "البيت الذي أسكن فيه قديم جداً.",
      "المرأة التي تحدثت إليها كانت لطيفة جداً.",
      "الكرسي الذي جلس عليه كان مكسوراً.",
      "الناس الذين سافرنا معهم كانوا ودودين.",
      "المدينة التي وُلدتُ فيها قريبة من البحر.",
    ],
    faqs: [
      {
        q: "هل أقول with who؟",
        a: "لا. بعد حرف الجر نستعمل whom: the man with whom I work. أو نؤخر حرف الجر: the man I work with.",
      },
      {
        q: "أيهما أفضل في الكلام؟",
        a: "الصيغة العادية (the man I work with) أكثر استعمالاً في الكلام، أما صيغة whom فأكثر رسمية وتناسب الكتابة.",
      },
    ],
  },

  "b2-35": {
    h1: "جملة -ing في الإنجليزية (participle clauses): Walking home, I met a friend",
    description:
      "كيف نختصر جملتين بجملة -ing؟ وما شرط الفاعل الواحد؟ شرح الصيغة وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "الفكرة" },
      {
        kind: "p",
        text: "حين يفعل الشخص نفسه فعلين، نختصر الأول بصيغة -ing: Walking home, I met a friend. وهي تساوي While I was walking home, I met a friend.",
      },
      {
        kind: "table",
        head: ["الجملة الكاملة", "المختصرة"],
        rows: [
          ["While I was walking home, I met an old friend.", "Walking home, I met an old friend."],
          ["Because she felt tired, she went to bed early.", "Feeling tired, she went to bed early."],
          ["After he had finished the work, he went home.", "Having finished the work, he went home."],
        ],
      },
      { kind: "h2", text: "شرط مهم" },
      {
        kind: "p",
        text: "الفاعل في الجزأين يجب أن يكون نفسه. في Walking home, I met a friend أنا من مشى وأنا من قابل. ولا نقول Walking home, the rain started، لأن المطر لا يمشي.",
      },
      { kind: "h2", text: "Having + التصريف الثالث" },
      {
        kind: "p",
        text: "نستعمل Having + past participle حين يقع الفعل الأول قبل الثاني: Having eaten, we left.",
      },
    ],
    examplesAr: [
      "أثناء مشيي إلى البيت قابلت صديقاً قديماً.",
      "لأنها شعرت بالتعب نامت مبكراً.",
      "بعد أن أنهى العمل ذهب إلى البيت.",
      "عندما فتح الباب رأى قطة.",
      "وهي تنتظر الحافلة قرأت كتاباً.",
      "وأنا أنظر من النافذة رأيت طائراً.",
    ],
    faqs: [
      {
        q: "هل أقول Walk home, I met a friend؟",
        a: "لا. نستعمل -ing: Walking home, I met a friend.",
      },
      {
        q: "ما الخطأ في Walking home, the rain started؟",
        a: "الفاعل مختلف: المشي لي والمطر للسماء. يجب أن يكون الفاعل واحداً: Walking home, I got wet.",
      },
    ],
  },

  "b2-45": {
    h1: "الأفعال والصفات التي لها حرف جر ثابت: afraid of و good at و depend on",
    description:
      "لماذا نقول good at وليس good in؟ حروف الجر الثابتة بعد الصفات والأفعال وكيف نحفظها، مع جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "أشهر الأزواج" },
      {
        kind: "table",
        head: ["الكلمة", "حرف الجر", "مثال"],
        rows: [
          ["afraid", "of", "I am afraid of dogs."],
          ["good", "at", "She is good at drawing."],
          ["interested", "in", "He is interested in learning Spanish."],
          ["wait", "for", "We are waiting for the bus."],
          ["depend", "on", "It depends on the weather."],
          ["listen", "to", "Please listen to the teacher."],
        ],
      },
      { kind: "h2", text: "لا تترجم حرفاً بحرف" },
      {
        kind: "p",
        text: "حروف الجر العربية لا تطابق الإنجليزية. نقول بالعربية «ماهر في الرياضيات» لكن بالإنجليزية good at maths. فاحفظ الكلمة مع حرفها كأنهما كلمة واحدة.",
      },
      { kind: "h2", text: "ماذا بعد حرف الجر؟" },
      {
        kind: "p",
        text: "بعد حرف الجر نضع اسماً أو فعلاً بصيغة -ing: She is good at drawing. ولا نقول good at draw.",
      },
    ],
    examplesAr: [
      "أخاف من الكلاب.",
      "هي ماهرة في الرسم.",
      "ننتظر الحافلة.",
      "هو مهتم بتعلم الإسبانية.",
      "هذا يعتمد على الطقس.",
      "من فضلك استمع إلى المعلم.",
    ],
    faqs: [
      {
        q: "هل أقول good in maths؟",
        a: "لا. نقول good at maths. الصفة good تأخذ at مع المهارات.",
      },
      {
        q: "كيف أحفظ حروف الجر؟",
        a: "احفظ الكلمة مع حرفها في جملة قصيرة، مثل afraid of dogs. وتجنّب ترجمة حرف الجر من العربية.",
      },
    ],
  },
};
