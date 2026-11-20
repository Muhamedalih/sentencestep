/**
 * The written layer of the public rule pages: only the rules listed here have a page (see types.ts).
 * They come in waves, each one the rules where the Arabic speaker's own mistake is the point (each has a
 * "mistake" note in teach.ts), so the page answers what an Arabic speaker actually searches: the first
 * twelve are below, and the other 22 of the 34 such rules are in rule-articles-a1.ts, -a2.ts and -b2.ts.
 * More rules are added the same way: add an entry and the page, its sitemap entry and its links appear
 * with it.
 *
 * Every article is checked by public-pages.test.ts: six translated examples in the order of the rule's
 * prepared sentences, a real answer under each question, and enough words to be worth reading.
 */

import { RULE_ARTICLES_A1 } from "./rule-articles-a1";
import { RULE_ARTICLES_A2 } from "./rule-articles-a2";
import { RULE_ARTICLES_B2 } from "./rule-articles-b2";
import type { RuleArticle } from "./types";

const FIRST_TWELVE: Readonly<Record<string, RuleArticle>> = {
  "a2-16": {
    h1: "الفرق بين for و since في الإنجليزية",
    description:
      "متى نستعمل for ومتى نستعمل since؟ القاعدة في سطر، الخطأ الشائع عند الناطقين بالعربية، 6 أمثلة مترجمة وتمرين تكتب فيه الجواب بنفسك.",
    blocks: [
      { kind: "h2", text: "كيف تختار بين for و since؟" },
      {
        kind: "p",
        text: "اسأل نفسك سؤالاً واحداً قبل أن تكتب: هل أذكر وقت البداية أم طول الوقت؟ الأول مع since، والثاني مع for. وكلاهما يأتي غالباً مع المضارع التام (have / has + past participle).",
      },
      {
        kind: "table",
        head: ["نقطة في الزمن: since", "مدة من الزمن: for"],
        rows: [
          ["since Monday", "for a week"],
          ["since 2019", "for ten minutes"],
          ["since morning", "for two years"],
          ["since I was ten", "for ages"],
        ],
      },
    ],
    examplesAr: [
      "أعيش في البصرة منذ عشر سنوات.",
      "تعمل هنا منذ عام 2018.",
      "نحن أصدقاء منذ كنّا أطفالاً.",
      "يدرس الإنجليزية منذ شهرين.",
      "لم يرونا منذ وقت طويل.",
      "عندي هذا الهاتف منذ يوم الاثنين.",
    ],
    faqs: [
      {
        q: "كلاهما يُترجم «منذ»، فكيف أعرف أيهما أستعمل؟",
        a: "انظر إلى ما يأتي بعده. إذا كان وقتاً محدداً (يوم، سنة، حدث) فاستعمل since. إذا كان طولاً من الوقت (شهرين، ساعة، سنوات) فاستعمل for.",
      },
      {
        q: "هل يأتي بعد since جملة كاملة؟",
        a: "نعم. يمكن أن يأتي بعدها وقت (since Monday) أو جملة في الماضي البسيط (since I moved here).",
      },
      {
        q: "هل أستعمل for مع الماضي البسيط أيضاً؟",
        a: "نعم، لكن المعنى يتغيّر: I lived there for five years تعني أنني لم أعد أسكن هناك، أما I have lived there for five years فتعني أنني ما زلت أسكن هناك.",
      },
    ],
  },

  "a2-18": {
    h1: "الفرق بين present perfect و past simple في الإنجليزية",
    description:
      "متى نستعمل الماضي البسيط ومتى نستعمل present perfect؟ القاعدة بسؤال واحد، الخطأ الشائع مع yesterday، أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "القاعدة بسؤال واحد" },
      {
        kind: "p",
        text: "اسأل: هل ذكرتُ وقتاً انتهى (yesterday، last week، in 2020، two years ago)؟ إن نعم فنستعمل الماضي البسيط. وإن لم أذكر وقتاً، أو كان للحدث أثر في الحاضر، فنستعمل present perfect (have / has + past participle).",
      },
      {
        kind: "table",
        head: ["الماضي البسيط: وقت انتهى", "present perfect: بلا وقت محدد"],
        rows: [
          ["I saw him yesterday.", "I have seen him."],
          ["She went to Basra in 2019.", "She has been to Basra twice."],
          ["We met two years ago.", "We have met before."],
        ],
      },
      { kind: "h2", text: "كلمات تعطيك الجواب" },
      {
        kind: "list",
        items: [
          "مع الماضي البسيط: yesterday، last week، last year، in 2020، two years ago، when I was a child.",
          "مع present perfect: ever، never، already، yet، just، so far.",
        ],
      },
    ],
    examplesAr: [
      "شاهدتُ ذلك الفيلم الأسبوع الماضي.",
      "شاهدتُ ذلك الفيلم ثلاث مرات.",
      "ذهبت إلى البصرة عام 2019.",
      "زارت البصرة مرتين.",
      "التقينا قبل سنتين.",
      "ضاعت مفاتيحه، لذلك لا يستطيع فتح الباب.",
    ],
    faqs: [
      {
        q: "هل أستعمل present perfect مع yesterday؟",
        a: "لا. yesterday وlast year وago تدل على وقت انتهى، فنستعمل الماضي البسيط: I saw him yesterday.",
      },
      {
        q: "ما الفرق بين have been to وhave gone to؟",
        a: "She has been to Basra تعني أنها ذهبت وعادت. أما She has gone to Basra فتعني أنها ذهبت وهي هناك الآن.",
      },
      {
        q: "ومتى أستعمل present perfect للحدث الذي له أثر الآن؟",
        a: "حين لا نذكر وقتاً ويهمنا أثر الحدث في الحاضر: He has lost his keys (فهو لا يستطيع فتح الباب الآن).",
      },
    ],
  },

  "a1-28": {
    h1: "الجملة الإنجليزية بلا فعل: لماذا نكتب is و am و are؟",
    description:
      "في العربية نقول «هي في البيت» بلا فعل، أما الإنجليزية فتحتاج be دائماً. شرح مبسّط للناطقين بالعربية مع أمثلة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "الفرق بين العربية والإنجليزية" },
      {
        kind: "p",
        text: "في العربية نبني جملة كاملة بلا فعل في المضارع: «البيت كبير»، «هي في البيت». في الإنجليزية لا بدّ من فعل في كل جملة، وإذا لم يكن في الجملة فعل آخر نضع فعل be: The house is big. She is at home.",
      },
      { kind: "h2", text: "أي صيغة من be نكتب؟" },
      {
        kind: "table",
        head: ["الفاعل", "نكتب"],
        rows: [
          ["I", "am"],
          ["he / she / it", "is"],
          ["you / we / they", "are"],
        ],
      },
      { kind: "h2", text: "طريقة سريعة للتأكد" },
      {
        kind: "p",
        text: "قبل أن تنهي الجملة اسأل: أين الفعل؟ إذا كانت جملتك اسماً ثم صفة أو مكاناً مثل The tea hot فهي ناقصة. أضف be فتصير: The tea is hot.",
      },
    ],
    examplesAr: [
      "أمي في المطبخ.",
      "الأطفال في المدرسة.",
      "أنا متعب جداً اليوم.",
      "بغداد مدينة كبيرة.",
      "أنت محق.",
      "الشاي حار.",
    ],
    faqs: [
      {
        q: "لماذا لا نقول She at home؟",
        a: "لأن الإنجليزية تحتاج فعلاً في كل جملة، والفعل المناسب هنا هو be: She is at home.",
      },
      {
        q: "كيف أعرف هل أستعمل am أو is أو are؟",
        a: "بحسب الفاعل: am مع I، وis مع he وshe وit، وare مع you وwe وthey.",
      },
      {
        q: "أين أضع be في السؤال؟",
        a: "في أول السؤال: Is she at home? Are you ready?",
      },
    ],
  },

  "a1-33": {
    h1: "ترتيب الصفة والاسم في الإنجليزية: الصفة قبل الاسم",
    description:
      "في العربية الصفة بعد الاسم «بيت كبير»، وفي الإنجليزية قبله: a big house. شرح القاعدة والاستثناء مع أمثلة مترجمة وتمرين.",
    blocks: [
      { kind: "h2", text: "القاعدة بمقارنة" },
      {
        kind: "table",
        head: ["العربية", "الإنجليزية"],
        rows: [
          ["بيت كبير", "a big house"],
          ["سيارة حمراء", "a red car"],
          ["مدينة قديمة", "an old city"],
        ],
      },
      { kind: "h2", text: "ملاحظتان صغيرتان" },
      {
        kind: "list",
        items: [
          "الصفة لا تتغير مع الجمع ولا مع المؤنث: a tall man وa tall woman وtall people.",
          "نستعمل an قبل الصفة التي تبدأ بصوت متحرك: an old city، an interesting book.",
        ],
      },
      { kind: "h2", text: "وإذا جاءت بعد الفعل؟" },
      {
        kind: "p",
        text: "بعد be تأتي الصفة وحدها: The house is big. أما إذا ذكرت الاسم فتأتي الصفة قبله: It is a big house.",
      },
    ],
    examplesAr: [
      "إنه بيت كبير.",
      "أشرب شاياً حاراً.",
      "هي معلمة شابة.",
      "عندنا سيارة حمراء.",
      "أحب حذائي الجديد.",
      "إنها مدينة قديمة.",
    ],
    faqs: [
      {
        q: "هل تتغير الصفة الإنجليزية مع المفرد والجمع؟",
        a: "لا. الصفة تبقى كما هي: a big house وtwo big houses.",
      },
      {
        q: "ماذا لو كان عندي أكثر من صفة؟",
        a: "نضعها كلها قبل الاسم: a big old house. وفي البداية يكفي أن تتذكر أن الصفات كلها قبل الاسم.",
      },
    ],
  },

  "a1-38": {
    h1: "الفرق بين how much و how many",
    description:
      "متى نستعمل how much ومتى نستعمل how many؟ القاعدة بسؤال واحد، والخطأ الشائع how many money، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "اسأل: هل أستطيع عدّه؟" },
      {
        kind: "p",
        text: "إذا كان الشيء يُعدّ (واحد، اثنان، ثلاثة…) فنستعمل how many مع الجمع: How many books? وإذا كان لا يُعدّ (ماء، سكر، مال) فنستعمل how much: How much water? ونستعمل how much أيضاً للسؤال عن السعر: How much is this phone?",
      },
      {
        kind: "table",
        head: ["how many + جمع معدود", "how much + غير معدود أو سعر"],
        rows: [
          ["How many eggs?", "How much sugar?"],
          ["How many students?", "How much money?"],
          ["How many brothers?", "How much is it?"],
        ],
      },
    ],
    examplesAr: [
      "كم طالباً في صفك؟",
      "بكم هذا الهاتف؟",
      "كم من الماء تشرب؟",
      "كم أخاً لديك؟",
      "كم من السكر تريد في شايك؟",
      "كم بيضة نحتاج؟",
    ],
    faqs: [
      {
        q: "هل نقول how many money؟",
        a: "لا. المال لا يُعدّ في الإنجليزية، فنقول how much money.",
      },
      {
        q: "كيف أسأل عن السعر؟",
        a: "نقول How much is it? أو How much is this phone? وللجمع: How much are these shoes?",
      },
    ],
  },

  "a2-41": {
    h1: "متى لا نستعمل the في الإنجليزية؟",
    description:
      "في العربية نقول «أحب الموسيقى» بـ «ال»، وفي الإنجليزية I like music بلا the. القاعدة والعبارات الثابتة مثل at school وby bus وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "القاعدة" },
      {
        kind: "p",
        text: "عندما نتكلم عن شيء بشكل عام (الموسيقى عموماً، الكلاب عموماً، الماء) لا نستعمل the ولا a: I like music. Dogs are loyal. Water is important. ونستعمل the فقط إذا قصدنا شيئاً محدداً: I like the music in this film.",
      },
      { kind: "h2", text: "عبارات ثابتة بلا the" },
      {
        kind: "table",
        head: ["العبارة", "المعنى"],
        rows: [
          ["at school", "في المدرسة"],
          ["at home", "في البيت"],
          ["at work", "في العمل"],
          ["go to bed", "يذهب إلى السرير (لينام)"],
          ["by bus", "بالحافلة"],
        ],
      },
    ],
    examplesAr: [
      "أحب الموسيقى. أستمع إليها كل يوم.",
      "أحب الكلاب لكنني لا أحب القطط.",
      "أختي في المدرسة الآن.",
      "نذهب إلى العمل بالحافلة.",
      "هو في السرير. إنه مريض.",
      "الماء مهم للحياة.",
    ],
    faqs: [
      {
        q: "هل أقول I like the music أم I like music؟",
        a: "I like music إذا قصدت الموسيقى عموماً. وI like the music إذا قصدت موسيقى محددة، مثل موسيقى فيلم شاهدته.",
      },
      {
        q: "لماذا نقول at school بلا the؟",
        a: "لأنها عبارة ثابتة تدل على الدراسة نفسها لا على المبنى: She is at school تعني أنها تدرس الآن. وإذا قصدت المبنى فقل: I am at the school.",
      },
    ],
  },

  "a2-13": {
    h1: "used to في الإنجليزية: كيف نتكلم عن عادات الماضي",
    description:
      "متى نستعمل used to؟ الفرق بينها وبين الماضي البسيط، وصيغة use to في السؤال والنفي، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ماذا تعني used to؟" },
      {
        kind: "p",
        text: "نستعمل used to + الفعل الأساسي للكلام عن عادة أو حالة كانت في الماضي ولم تعد الآن: I used to live in Mosul (كنت أسكن في الموصل، ولا أسكن فيها الآن).",
      },
      { kind: "h2", text: "الإثبات والنفي والسؤال" },
      {
        kind: "table",
        head: ["الصيغة", "مثال"],
        rows: [
          ["إثبات: used to", "I used to play football."],
          ["نفي: didn't use to", "I didn't use to like fish."],
          ["سؤال: Did … use to", "Did you use to swim?"],
        ],
      },
      { kind: "h2", text: "متى نختار الماضي البسيط بدلها؟" },
      {
        kind: "p",
        text: "لحدث وقع مرة واحدة أو في وقت محدد نستعمل الماضي البسيط: I went there yesterday. ولا نقول I used to go there yesterday.",
      },
    ],
    examplesAr: [
      "عندما كنت طفلاً كنت ألعب في الشارع.",
      "كان جدي يملك محلاً صغيراً.",
      "كنا نسكن في بغداد، أما الآن فنسكن في أربيل.",
      "هل كنت تمشي إلى المدرسة؟",
      "لم تكن تحب القهوة سابقاً، أما الآن فتحبها.",
      "كانت هنا سينما.",
    ],
    faqs: [
      {
        q: "لماذا نكتب use to بلا d في السؤال والنفي؟",
        a: "لأن did تدل على الماضي، فيرجع الفعل إلى شكله الأساسي: Did you use to swim? I didn't use to like fish.",
      },
      {
        q: "هل used to هي نفسها be used to؟",
        a: "لا. used to + فعل تعني عادة قديمة. أما be used to + ‏-ing فتعني «معتاد على» الآن، وهي قاعدة أخرى.",
      },
    ],
  },

  "a2-26": {
    h1: "should و shouldn't: كيف نعطي نصيحة بالإنجليزية",
    description:
      "استعمال should للنصيحة وshouldn't للنهي عنها، والخطأ الشائع should to، مع أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ما الذي نقوله بـ should؟" },
      {
        kind: "p",
        text: "نستعمل should لنقول «ينبغي» أو «من الأفضل»: You should rest (من الأفضل أن ترتاح). وshouldn't للعكس: You shouldn't eat so much (لا ينبغي أن تأكل كثيراً).",
      },
      { kind: "h2", text: "ثلاث قواعد قصيرة" },
      {
        kind: "list",
        items: [
          "بعد should يأتي الفعل الأساسي بلا to: She should go.",
          "لا نضيف -s مع he وshe وit: She should go، وليس She shoulds go.",
          "في السؤال تتقدم should: Should I call him?",
        ],
      },
    ],
    examplesAr: [
      "تبدو متعباً. من الأفضل أن تنام مبكراً.",
      "لا ينبغي أن تأكل كل هذا السكر.",
      "عندها سعال شديد. عليها أن تراجع طبيباً.",
      "هل أتصل به الآن؟",
      "لا ينبغي أن نتأخر عن الامتحان.",
      "عليك أن تشرب ماء أكثر.",
    ],
    faqs: [
      {
        q: "هل should مثل must؟",
        a: "لا. should نصيحة، أي «من الأفضل». أما must فإلزام أقوى: You must wear a seat belt.",
      },
      {
        q: "كيف أطلب نصيحة؟",
        a: "نقول What should I do? أو Should I take the job?",
      },
    ],
  },

  "a2-39": {
    h1: "something و anyone و nobody: الفرق بين some- و any- و no-",
    description:
      "كيف نكوّن something وanyone وnobody وeverywhere، ومتى نستعمل some- أو any-، والخطأ الشائع I don't know nothing، مع أمثلة وتمرين.",
    blocks: [
      { kind: "h2", text: "الجدول كاملاً" },
      {
        kind: "table",
        head: ["البداية", "شخص", "شيء", "مكان"],
        rows: [
          ["some-", "someone / somebody", "something", "somewhere"],
          ["any-", "anyone / anybody", "anything", "anywhere"],
          ["no-", "no one / nobody", "nothing", "nowhere"],
          ["every-", "everyone / everybody", "everything", "everywhere"],
        ],
      },
      { kind: "h2", text: "متى some- ومتى any-؟" },
      {
        kind: "p",
        text: "نستعمل some- في الجمل المثبتة والعروض: I need something. Would you like something to drink? ونستعمل any- في الأسئلة والنفي: Do you need anything? I didn't see anyone.",
      },
      { kind: "h2", text: "نقطة مهمة عن النفي" },
      {
        kind: "p",
        text: "nobody وnothing وnowhere فيها معنى النفي أصلاً، فلا نضيف معها not: I know nothing. أو نستعمل any- مع not: I don't know anything. الاثنتان صحيحتان، لكن لا نجمع بينهما.",
      },
    ],
    examplesAr: [
      "أنا عطشان. أريد أن أشرب شيئاً.",
      "هل يوجد أحد في البيت؟",
      "لا أحد يعرف الجواب. إنه صعب جداً.",
      "لم أرَ شيئاً في المحل.",
      "الجميع هنا. لنبدأ.",
      "لا أجد مفاتيحي في أي مكان.",
    ],
    faqs: [
      {
        q: "هل نكتب some thing أم something؟",
        a: "كلمة واحدة: something. وكذلك anyone وnobody وeverywhere.",
      },
      {
        q: "هل أقول I don't know nothing؟",
        a: "لا. نقول I know nothing أو I don't know anything.",
      },
    ],
  },

  "b2-15": {
    h1: "الشرط الثالث (third conditional) في الإنجليزية",
    description:
      "كيف نتكلم عن ماضٍ لم يحدث باستعمال if + had + التصريف الثالث وwould have. الخطأ الشائع، أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "الصيغة" },
      {
        kind: "p",
        text: "if + had + past participle، ثم would have + past participle: If I had studied, I would have passed (لو كنت قد درست لنجحت).",
      },
      {
        kind: "table",
        head: ["جزء if", "جزء النتيجة"],
        rows: [
          ["If I had studied", "I would have passed."],
          ["If she had known", "she would have helped us."],
          ["If we had left earlier", "we would have caught the train."],
        ],
      },
      { kind: "h2", text: "لماذا نستعمله؟" },
      {
        kind: "p",
        text: "للكلام عن شيء لم يحدث في الماضي وعن نتيجته المتخيَّلة، وغالباً مع ندم أو عتب: If I had left earlier, I would have caught the train (لكنني لم أخرج مبكراً فلم ألحق بالقطار).",
      },
      { kind: "h2", text: "الاختصار في الكلام" },
      {
        kind: "p",
        text: "نختصر had وwould إلى 'd: If I'd studied, I'd have passed.",
      },
    ],
    examplesAr: [
      "لو كنت قد درست لنجحت في الامتحان.",
      "لو كانت تعلم لساعدتنا.",
      "لو خرجنا مبكراً لألحقنا القطار.",
      "لو لم تمطر لذهبنا إلى الشاطئ.",
      "لو درس بجد أكثر لنجح.",
      "كانوا سيفوزون لو لعبوا أفضل.",
    ],
    faqs: [
      {
        q: "ما الفرق بين الشرط الثاني والثالث؟",
        a: "الثاني (if + past simple, would) عن حاضر أو مستقبل متخيَّل: If I had money, I would buy a car. والثالث عن ماضٍ لم يحدث: If I had had money, I would have bought a car.",
      },
      {
        q: "هل أضع would have في جزء if؟",
        a: "لا. جزء if فيه had فقط: If I had studied. وwould have في جزء النتيجة.",
      },
    ],
  },

  "b2-39": {
    h1: "الفرق بين despite و in spite of و although",
    description:
      "despite وin spite of وalthough كلها بمعنى «رغم»، لكن ما بعدها يختلف. شرح مبسّط، الخطأ الشائع despite of، أمثلة مترجمة وتمرين كتابة.",
    blocks: [
      { kind: "h2", text: "ما الذي يأتي بعدها؟" },
      {
        kind: "table",
        head: ["الكلمة", "ما بعدها", "مثال"],
        rows: [
          ["despite", "اسم أو -ing", "Despite the rain, we went out."],
          ["in spite of", "اسم أو -ing", "In spite of the rain, we went out."],
          ["although / though", "جملة كاملة", "Although it was raining, we went out."],
        ],
      },
      { kind: "h2", text: "قاعدتان" },
      {
        kind: "list",
        items: [
          "لا نقول despite of. نقول despite أو in spite of.",
          "بعد despite وin spite of لا نضع فاعلاً وفعلاً: نقول Despite the rain أو Despite being tired. وإذا أردنا جملة كاملة نستعمل although.",
        ],
      },
    ],
    examplesAr: [
      "رغم المطر ذهبنا إلى الحديقة.",
      "ذهب إلى العمل رغم صداعه.",
      "رغم تعبها أنهت العمل.",
      "نجحت في الامتحان رغم أنها لم تدرس كثيراً.",
      "رغم أن الوقت كان متأخراً واصلنا الحديث.",
      "استمتعوا بالرحلة رغم الطقس السيئ.",
    ],
    faqs: [
      {
        q: "هل despite وin spite of تعنيان الشيء نفسه؟",
        a: "نعم، كلتاهما بمعنى «رغم». الفرق في الشكل فقط: despite كلمة واحدة وin spite of ثلاث كلمات.",
      },
      {
        q: "هل أستعمل but مع although؟",
        a: "لا. نستعمل واحدة منهما فقط: Although it was cold, we went out. وليس Although it was cold, but we went out.",
      },
    ],
  },

  "a1-31": {
    h1: "الأسماء المعدودة وغير المعدودة في الإنجليزية",
    description:
      "كيف نفرّق بين الاسم المعدود وغير المعدود، ولماذا لا نقول informations وwaters، ومتى نستعمل is مع news وhomework. أمثلة مترجمة وتمرين.",
    blocks: [
      { kind: "h2", text: "الفكرة" },
      {
        kind: "p",
        text: "الاسم المعدود نستطيع عدّه: one apple، two apples. والاسم غير المعدود لا نعدّه مباشرة: water، rice، money، music. ليس له جمع، ولا نضع قبله a أو an.",
      },
      {
        kind: "table",
        head: ["معدود", "غير معدود"],
        rows: [
          ["an apple / two apples", "water"],
          ["a book / three books", "rice"],
          ["a student / ten students", "money"],
        ],
      },
      { kind: "h2", text: "كيف نعدّ غير المعدود؟" },
      {
        kind: "p",
        text: "نستعمل وحدة قياس قبله: a glass of water، a kilo of rice، a piece of advice.",
      },
      { kind: "h2", text: "كلمات تخدعك" },
      {
        kind: "p",
        text: "هذه الكلمات غير معدودة في الإنجليزية: news، information، homework، furniture، advice. لذلك نقول The news is good، وليس The news are good.",
      },
    ],
    examplesAr: [
      "الأخبار جيدة جداً اليوم.",
      "المال في حقيبتي.",
      "واجبي صعب.",
      "الرز رخيص في العراق.",
      "الأثاث جديد.",
      "عندي ثلاثة كتب.",
    ],
    faqs: [
      {
        q: "هل أقول informations؟",
        a: "لا. information غير معدودة وليس لها جمع: I need some information.",
      },
      {
        q: "كيف أطلب شيئاً غير معدود بكمية؟",
        a: "نستعمل وحدة: a glass of water، a piece of advice. أو كلمات الكمية مثل some وmuch وa little.",
      },
    ],
  },
};

/** Every rule that has a public page. */
export const RULE_ARTICLES: Readonly<Record<string, RuleArticle>> = {
  ...FIRST_TWELVE,
  ...RULE_ARTICLES_A1,
  ...RULE_ARTICLES_A2,
  ...RULE_ARTICLES_B2,
};
