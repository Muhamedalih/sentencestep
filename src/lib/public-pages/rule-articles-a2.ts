/**
 * The second wave of public rule pages, the A2–B1 rules that carry a mistake Arabic speakers make (see
 * rule-articles.ts for what an article is and how it is checked).
 */

import type { RuleArticle } from "./types";

export const RULE_ARTICLES_A2: Readonly<Record<string, RuleArticle>> = {
  "a2-14": {
    h1: "التصريف الثالث الشاذ في الإنجليزية (past participle): seen و gone و written",
    description:
      "ما الأفعال التي لها شكل ثالث شاذ؟ ولماذا نقول I have seen وليس I have saw؟ جدول لأشهر الأفعال وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ما هو التصريف الثالث؟" },
      {
        kind: "p",
        text: "بعد have أو has نستعمل التصريف الثالث للفعل (past participle) لا الماضي البسيط: I have seen that film. وكثير من الأفعال الشائعة يتغيّر شكلها في التصريف الثالث، ويجب حفظها.",
      },
      { kind: "h2", text: "أشهر الأفعال" },
      {
        kind: "table",
        head: ["الفعل", "الماضي البسيط", "التصريف الثالث"],
        rows: [
          ["see", "saw", "seen"],
          ["go", "went", "gone"],
          ["do", "did", "done"],
          ["eat", "ate", "eaten"],
          ["write", "wrote", "written"],
          ["take", "took", "taken"],
          ["make", "made", "made"],
          ["buy", "bought", "bought"],
        ],
      },
      { kind: "h2", text: "طريقة الحفظ" },
      {
        kind: "p",
        text: "احفظ الأشكال الثلاثة معاً (see، saw، seen) لا الفعل وحده. وفي بعض الأفعال يتساوى الماضي البسيط والتصريف الثالث مثل made وbought وhad، وهذه أسهل.",
      },
    ],
    examplesAr: [
      "شاهدت ذلك الفيلم مرتين.",
      "كتبت رسالة طويلة.",
      "ذهبوا إلى السوق.",
      "هل تناولت الفطور؟",
      "أخذ قلمي.",
      "أنجزنا واجبنا.",
    ],
    faqs: [
      {
        q: "هل أقول I have ate؟",
        a: "لا. بعد have نستعمل التصريف الثالث: I have eaten.",
      },
      {
        q: "كيف أعرف التصريف الثالث لفعل؟",
        a: "الأفعال المنتظمة تنتهي بـ -ed مثل played. أما الشاذة فتُحفظ، فابدأ بالأكثر استعمالاً: be وhave وdo وgo وsee وeat وtake وmake.",
      },
    ],
  },

  "a2-33": {
    h1: "as … as في الإنجليزية: كيف نقول «مثل» و«بنفس»",
    description:
      "كيف نقارن بالتساوي بـ as … as؟ والخطأ الشائع as tall than، وthe same as وdifferent from، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "الصيغ" },
      {
        kind: "table",
        head: ["المعنى", "الصيغة", "مثال"],
        rows: [
          ["متساوٍ", "as + صفة + as", "My phone is as expensive as yours."],
          ["أقل من", "not as + صفة + as", "He is not as tall as his brother."],
          ["نفس الشيء", "the same as", "My bag is the same as yours."],
          ["مختلف", "different from", "My bag is different from yours."],
        ],
      },
      { kind: "h2", text: "خطآن شائعان" },
      {
        kind: "list",
        items: [
          "لا نستعمل than مع as: as tall as، وليس as tall than. فـ than للمقارنة بالأكثر: taller than.",
          "بعد as الثانية يأتي الضمير: as tall as me، أو as tall as I am.",
        ],
      },
    ],
    examplesAr: [
      "هاتفي غالٍ مثل هاتفك.",
      "هو ليس بطول أخيه.",
      "هذا الامتحان صعب مثل الأخير.",
      "حقيبتي مثل حقيبتك تماماً.",
      "بيتها مختلف عن بيتي.",
      "أنا سعيد اليوم مثل طفل.",
    ],
    faqs: [
      {
        q: "ما الفرق بين as … as وthan؟",
        a: "as … as للتساوي: as tall as. وthan للتفضيل: taller than. ولا نجمع بينهما.",
      },
      {
        q: "هل أقول different to أو different from؟",
        a: "different from هي الأشهر والأكثر قبولاً. أما different to فتُسمع في الإنجليزية البريطانية.",
      },
    ],
  },

  "a2-51": {
    h1: "unless في الإنجليزية: معناها if not",
    description:
      "ما معنى unless؟ ولماذا لا نقول unless you don't study؟ القاعدة والأخطاء الشائعة وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "المعنى" },
      {
        kind: "p",
        text: "unless تعني «إلا إذا» أو «ما لم»، أي if … not: Unless you hurry, you will be late. وهي مثل If you don't hurry, you will be late.",
      },
      {
        kind: "table",
        head: ["مع unless", "مع if"],
        rows: [
          ["Unless you study, you will fail.", "If you don't study, you will fail."],
          ["I won't go out unless the rain stops.", "I won't go out if the rain doesn't stop."],
          ["Unless you leave now, you will miss the bus.", "If you don't leave now, you will miss the bus."],
        ],
      },
      { kind: "h2", text: "نقطة مهمة" },
      {
        kind: "p",
        text: "unless فيها معنى النفي أصلاً، فيأتي بعدها فعل مثبت. ولو أضفنا not صار نفياً مزدوجاً: لا نقول Unless you don't hurry. نقول Unless you hurry.",
      },
    ],
    examplesAr: [
      "ما لم تدرس فسترسب في الاختبار.",
      "لن أخرج إلا إذا توقف المطر.",
      "ما لم تغادر الآن فستفوتك الحافلة.",
      "ستغضب إلا إذا اعتذرت.",
      "لا نستطيع أن نبدأ إلا إذا حضر الجميع.",
      "لن يساعدك إلا إذا طلبت منه.",
    ],
    faqs: [
      {
        q: "هل أستعمل unless مع الفعل المنفي؟",
        a: "لا. نقول Unless you study وليس Unless you don't study.",
      },
      {
        q: "هل unless وif … not متساويتان؟",
        a: "في أغلب الجمل نعم، فيمكنك أن تكتب If you don't hurry بدل Unless you hurry.",
      },
    ],
  },

  "a2-55": {
    h1: "الفرق بين although و however في الإنجليزية",
    description:
      "متى نستعمل although ومتى نستعمل however؟ ولماذا لا نجمع although وbut؟ القاعدة والأخطاء الشائعة وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "أين تقع كل كلمة؟" },
      {
        kind: "table",
        head: ["الكلمة", "موقعها", "مثال"],
        rows: [
          [
            "although / though",
            "في أول الجملة أو وسطها، وبعدها جملة كاملة",
            "Although it was cold, we went out.",
          ],
          ["however", "تبدأ جملة جديدة وبعدها فاصلة", "It was cold. However, we went out."],
        ],
      },
      { kind: "h2", text: "لا نجمع although وbut" },
      {
        kind: "p",
        text: "تكفي كلمة واحدة تربط الفكرتين: Although it was cold, we went out. أو It was cold, but we went out. ولا نقول Although it was cold, but we went out.",
      },
      { kind: "h2", text: "although وthough" },
      {
        kind: "p",
        text: "though بمعنى although، وهي أكثر شيوعاً في الكلام: She passed the exam, though she did not study much.",
      },
    ],
    examplesAr: [
      "رغم أن المطر كان يهطل ذهبنا إلى الحديقة.",
      "نجحت في الامتحان مع أنها لم تدرس كثيراً.",
      "كانت رحلة طويلة. لكننا استمتعنا بها.",
      "رغم أنه غني فهو غير سعيد.",
      "كان الطعام رخيصاً. لكنه لم يكن جيداً.",
      "أحب الشقة مع أنها صغيرة.",
    ],
    faqs: [
      {
        q: "هل أقول Although … but؟",
        a: "لا. نختار واحدة: Although it was cold, we went out. أو It was cold, but we went out.",
      },
      {
        q: "هل نضع فاصلة بعد however؟",
        a: "نعم. نكتب However, we enjoyed it. ونضعها في أول الجملة.",
      },
    ],
  },

  "a2-56": {
    h1: "to و for و so that: كيف نذكر السبب أو الغرض في الإنجليزية",
    description:
      "كيف نقول «لكي» و«من أجل» بالإنجليزية؟ الفرق بين to + فعل وfor + اسم وso that، والخطأ الشائع for buy، مع أمثلة مترجمة وتمرين.",
    blocks: [
      { kind: "h2", text: "أربع صيغ للغرض" },
      {
        kind: "table",
        head: ["الصيغة", "مثال"],
        rows: [
          ["to + فعل", "I went to the shop to buy some milk."],
          ["for + اسم", "I went to the bank for some money."],
          ["in order to + فعل", "I left early in order to be on time."],
          ["so that + جملة", "We left early so that we wouldn't be late."],
        ],
      },
      { kind: "h2", text: "كيف تختار؟" },
      {
        kind: "list",
        items: [
          "إذا كان الغرض فعلاً نضع to: I use this app to learn new words.",
          "إذا كان الغرض اسماً نضع for: I went to the bank for some money.",
          "إذا كان الغرض جملة كاملة بفاعل جديد نضع so that: She studies hard so that she can pass the exam.",
          "ولا نقول for buy. نقول to buy أو for bread.",
        ],
      },
    ],
    examplesAr: [
      "ذهبت إلى المحل لأشتري بعض الحليب.",
      "تدرس بجد لكي تنجح في الامتحان.",
      "اتصل بي ليقول مرحباً.",
      "خرجنا مبكراً لكي لا نتأخر.",
      "أستعمل هذا التطبيق لأتعلم كلمات جديدة.",
      "ذهبت إلى البنك لآخذ بعض المال.",
    ],
    faqs: [
      {
        q: "هل أقول for buy؟",
        a: "لا. مع الفعل نقول to buy، ومع الاسم نقول for bread.",
      },
      {
        q: "ما الفرق بين to وin order to؟",
        a: "المعنى واحد. in order to أكثر رسمية قليلاً: I left early in order to be on time.",
      },
      {
        q: "متى أستعمل so that؟",
        a: "حين يأتي بعد الغرض فاعل وفعل: so that she can pass. وغالباً مع can أو could أو would.",
      },
    ],
  },

  "a2-57": {
    h1: "الأفعال التي بعدها to + فعل: want و hope و plan و decide",
    description:
      "بعد want وhope وplan وdecide وpromise وlearn نستعمل to + الفعل الأساسي لا -ing. جدول وأمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "القاعدة" },
      {
        kind: "p",
        text: "بعض الأفعال يأتي بعدها to ثم الفعل الأساسي: I hope to travel next year. She decided to stay. ولا نقول I decided going.",
      },
      {
        kind: "table",
        head: ["الفعل", "مثال"],
        rows: [
          ["hope", "I hope to see you soon."],
          ["decide", "She decided to stay at home."],
          ["plan", "We plan to visit Erbil in the summer."],
          ["promise", "He promised to call me."],
          ["agree", "They agreed to help us."],
          ["learn", "She learned to swim when she was five."],
        ],
      },
      { kind: "h2", text: "نصيحة للحفظ" },
      {
        kind: "p",
        text: "هذه الأفعال كلها عن النيّات والوعود والقرارات: want وhope وplan وdecide وpromise وagree وlearn. وبعدها دائماً to + الفعل الأساسي.",
      },
    ],
    examplesAr: [
      "آمل أن أراك قريباً.",
      "قررت البقاء في البيت.",
      "نخطط لزيارة أربيل في الصيف.",
      "وعد أن يتصل بي.",
      "وافقوا على مساعدتنا.",
      "تعلمت السباحة وهي في الخامسة.",
    ],
    faqs: [
      {
        q: "هل أقول I decided going؟",
        a: "لا. بعد decide نستعمل to + فعل: I decided to go.",
      },
      {
        q: "هل كل الأفعال تأخذ to + فعل؟",
        a: "لا. بعض الأفعال تأخذ -ing مثل enjoy وfinish: I enjoy reading. فنحفظ كل فعل مع ما يأخذه بعده.",
      },
    ],
  },
};
