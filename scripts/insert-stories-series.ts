/**
 * Adds 12 new Stories lessons (4 per tier), pushed live to Supabase — three
 * genuine 4-episode arcs, each with the SAME recurring character(s) and
 * setting carried across all four episodes, unlike the existing 68 stories
 * (each an independent one-off vignette with a new cast every time — see
 * the content audit this script follows). English sentences + Arabic
 * translations only, matching the existing catalog's own scope (no ES/TR
 * content_translations rows for these either).
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-stories-series.ts
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// stories-mode level ids, fetched once via scripts/scratch/stories-meta.ts.
const LEVEL_ID: Record<1 | 2 | 3, string> = {
  1: "420c7cc5-d17c-4862-858e-73e5ddbbb07d",
  2: "ae3a34f5-14bf-427f-b9b3-78ac7702842e",
  3: "e6bf826a-a0e4-4da4-81d4-5cca26c51463",
};

interface Sentence {
  en: string;
  ar: string;
}

interface StoryLesson {
  id: string;
  level: 1 | 2 | 3;
  order: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  isFree: boolean;
  sentences: Sentence[];
}

const STORIES: StoryLesson[] = [
  // --- Beginner arc: Sami's Coffee Cart ---
  {
    id: "story-67",
    level: 1,
    order: 69,
    title: "The First Cup",
    titleAr: "الفنجان الأول",
    description: "Sami opens his tiny coffee cart and waits nervously for his very first customer",
    descriptionAr: "يفتح سامي عربة قهوته الصغيرة وينتظر بقلق أول زبون له",
    isFree: true,
    sentences: [
      {
        en: "Sami woke up before the sun on his very first day",
        ar: "استيقظ سامي قبل شروق الشمس في أول يوم له.",
      },
      {
        en: "He had saved money for months to buy his little coffee cart",
        ar: "كان قد ادخر المال لأشهر ليشتري عربة القهوة الصغيرة.",
      },
      {
        en: "He pushed it to the corner near the old park",
        ar: "دفعها إلى الزاوية القريبة من الحديقة القديمة.",
      },
      {
        en: "His hands were shaking as he made the first cup",
        ar: "كانت يداه ترتجفان وهو يعد الفنجان الأول.",
      },
      {
        en: "An hour passed and no one stopped by his cart",
        ar: "مرت ساعة ولم يتوقف أحد عند عربته.",
      },
      { en: "He started to think this was a big mistake", ar: "بدأ يعتقد أن هذا كان خطأً كبيراً." },
      {
        en: "Then an old man in a gray coat walked up slowly",
        ar: "ثم اقترب رجل عجوز يرتدي معطفاً رمادياً ببطء.",
      },
      {
        en: "One coffee please the old man said with a small smile",
        ar: 'قال الرجل العجوز بابتسامة صغيرة: "قهوة واحدة من فضلك."',
      },
      {
        en: "Sami's hands stopped shaking as he poured the first cup",
        ar: "توقفت يدا سامي عن الارتجاف وهو يسكب الفنجان الأول.",
      },
      {
        en: "The old man took one sip and nodded slowly",
        ar: "أخذ الرجل العجوز رشفة واحدة وأومأ برأسه ببطء.",
      },
      {
        en: "This is the best coffee on this street he said",
        ar: 'قال: "هذه أفضل قهوة في هذا الشارع."',
      },
    ],
  },
  {
    id: "story-68",
    level: 1,
    order: 70,
    title: "The Regular",
    titleAr: "الزبون الدائم",
    description: "The old man from the first morning becomes Sami's most loyal customer",
    descriptionAr: "يصبح الرجل العجوز من الصباح الأول أكثر زبائن سامي وفاءً",
    isFree: false,
    sentences: [
      {
        en: "The old man came back again the very next morning",
        ar: "عاد الرجل العجوز مرة أخرى في صباح اليوم التالي.",
      },
      {
        en: "His name was Mr Adel and he lived nearby",
        ar: "كان اسمه السيد عادل وكان يسكن قريباً.",
      },
      {
        en: "He always ordered the same coffee at the same time",
        ar: "كان دائماً يطلب نفس القهوة في نفس الوقت.",
      },
      {
        en: "Sami began to prepare it before Mr Adel even arrived",
        ar: "بدأ سامي يحضّرها قبل أن يصل السيد عادل حتى.",
      },
      {
        en: "Slowly a few more customers started to notice the little cart",
        ar: "بدأ بضعة زبائن آخرين يلاحظون العربة الصغيرة تدريجياً.",
      },
      {
        en: "Mr Adel always sat on the same bench nearby",
        ar: "كان السيد عادل يجلس دائماً على نفس المقعد القريب.",
      },
      {
        en: "He watched the street and talked with Sami between customers",
        ar: "كان يراقب الشارع ويتحدث مع سامي بين الزبائن.",
      },
      {
        en: "He told Sami stories about the neighborhood many years ago",
        ar: "أخبر سامي بقصص عن الحي منذ سنوات عديدة.",
      },
      {
        en: "Sami started looking forward to their morning conversation",
        ar: "بدأ سامي يتشوق لحديثهما الصباحي.",
      },
      {
        en: "You remind me of my son Mr Adel said one day",
        ar: 'قال السيد عادل ذات يوم: "أنت تذكرني بابني."',
      },
      {
        en: "Sami didn't know what to say so he just smiled",
        ar: "لم يعرف سامي ماذا يقول فابتسم فقط.",
      },
    ],
  },
  {
    id: "story-69",
    level: 1,
    order: 71,
    title: "The Rainy Morning",
    titleAr: "الصباح الماطر",
    description: "A storm keeps every customer away except the one Sami least expected",
    descriptionAr: "تُبعد العاصفة كل الزبائن باستثناء من لم يتوقعه سامي",
    isFree: false,
    sentences: [
      {
        en: "Dark clouds filled the sky on a cold Tuesday morning",
        ar: "ملأت الغيوم الداكنة السماء في صباح ثلاثاء بارد.",
      },
      {
        en: "Sami pushed his cart to the corner anyway",
        ar: "دفع سامي عربته إلى الزاوية رغم ذلك.",
      },
      {
        en: "The rain started before he could even open the umbrella",
        ar: "بدأ المطر قبل أن يتمكن حتى من فتح المظلة.",
      },
      {
        en: "The street stayed completely empty for almost two hours",
        ar: "بقي الشارع فارغاً تماماً لما يقارب الساعتين.",
      },
      {
        en: "Sami sat down and wondered if he should just go home",
        ar: "جلس سامي وتساءل إن كان عليه العودة إلى المنزل فحسب.",
      },
      {
        en: "Then he saw a familiar gray coat coming through the rain",
        ar: "ثم رأى معطفاً رمادياً مألوفاً قادماً عبر المطر.",
      },
      {
        en: "Mr Adel walked up holding one large umbrella",
        ar: "اقترب السيد عادل حاملاً مظلة كبيرة واحدة.",
      },
      {
        en: "I figured you'd still be here he said cheerfully",
        ar: 'قال بمرح: "توقعت أنك ما زلت هنا."',
      },
      {
        en: "He held the umbrella over the cart while Sami made the coffee",
        ar: "أمسك المظلة فوق العربة بينما كان سامي يعد القهوة.",
      },
      {
        en: "They laughed together as the rain grew even louder",
        ar: "ضحكا معاً بينما ازداد صوت المطر.",
      },
      {
        en: "Some days Mr Adel said the coffee matters less than the company",
        ar: 'قال السيد عادل: "في بعض الأيام، القهوة أقل أهمية من الرفقة."',
      },
    ],
  },
  {
    id: "story-70",
    level: 1,
    order: 72,
    title: "The Line Around the Corner",
    titleAr: "الطابور حول الزاوية",
    description: "Months later Sami's little cart has become the whole street's favorite stop",
    descriptionAr: "بعد أشهر، أصبحت عربة سامي الصغيرة المحطة المفضلة للشارع بأكمله",
    isFree: false,
    sentences: [
      {
        en: "Six months later the cart had a line every single morning",
        ar: "بعد ستة أشهر، صار للعربة طابور كل صباح.",
      },
      {
        en: "Sami had to wake up even earlier to prepare everything",
        ar: "كان على سامي أن يستيقظ أبكر لتحضير كل شيء.",
      },
      {
        en: "He hired a young helper to keep up with the orders",
        ar: "وظّف مساعداً شاباً لمواكبة الطلبات.",
      },
      {
        en: "Mr Adel still came every morning at the very same time",
        ar: "ما زال السيد عادل يأتي كل صباح في نفس الوقت بالضبط.",
      },
      {
        en: "He never had to wait in the long line anymore",
        ar: "لم يعد عليه الانتظار في الطابور الطويل بعد الآن.",
      },
      {
        en: "Sami always had his coffee ready before he reached the front",
        ar: "كان سامي دائماً يجهّز قهوته قبل أن يصل إلى المقدمة.",
      },
      {
        en: "A local newspaper even wrote a short story about the cart",
        ar: "كتبت صحيفة محلية حتى قصة قصيرة عن العربة.",
      },
      {
        en: "Sami kept the little clipping taped inside the cart",
        ar: "احتفظ سامي بالقصاصة الصغيرة ملصقة داخل العربة.",
      },
      {
        en: "None of this would have happened without that first rainy morning he said",
        ar: 'قال: "لم يكن أي من هذا ليحدث لولا ذلك الصباح الماطر الأول."',
      },
      { en: "Mr Adel just smiled and raised his cup", ar: "ابتسم السيد عادل فقط ورفع فنجانه." },
      {
        en: "To the best coffee on this street he said again",
        ar: 'قال مجدداً: "لأفضل قهوة في هذا الشارع."',
      },
    ],
  },
  // --- Intermediate arc: Dana at the Bookstore ---
  {
    id: "story-71",
    level: 2,
    order: 73,
    title: "The Interview",
    titleAr: "المقابلة",
    description: "Dana walks into a small bookstore for an interview she's determined not to blow",
    descriptionAr: "تدخل دانا إلى مكتبة صغيرة لمقابلة عمل عازمة على ألا تفسدها",
    isFree: true,
    sentences: [
      {
        en: "Dana had read about the bookstore online the night before",
        ar: "قرأت دانا عن المكتبة على الإنترنت في الليلة السابقة.",
      },
      {
        en: "It was small and slightly crowded with towers of books",
        ar: "كانت صغيرة ومزدحمة قليلاً بأبراج من الكتب.",
      },
      {
        en: "The owner Mr Farouk barely looked up when she walked in",
        ar: "بالكاد رفع السيد فاروق، صاحب المكتبة، نظره حين دخلت.",
      },
      { en: "He asked her what she was currently reading", ar: "سألها عمّا تقرأه حالياً." },
      {
        en: "Dana admitted she hadn't finished a book in almost a year",
        ar: "اعترفت دانا بأنها لم تنهِ كتاباً منذ عام تقريباً.",
      },
      {
        en: "She expected that honesty to end the interview immediately",
        ar: "توقعت أن ينهي هذا الصدق المقابلة على الفور.",
      },
      {
        en: "Instead Mr Farouk finally looked up and smiled slightly",
        ar: "بدلاً من ذلك، رفع السيد فاروق نظره أخيراً وابتسم قليلاً.",
      },
      { en: "At least you're not pretending he said", ar: 'قال: "على الأقل أنتِ لا تتظاهرين."' },
      {
        en: "He handed her a worn paperback and asked her to read the first page",
        ar: "أعطاها كتاباً ورقياً بالياً وطلب منها قراءة الصفحة الأولى.",
      },
      {
        en: "She read it slowly and something in her actually relaxed",
        ar: "قرأتها ببطء، وشعرت بشيء ما بداخلها يرتاح فعلاً.",
      },
      {
        en: "Can you start on Monday Mr Farouk asked",
        ar: 'سأل السيد فاروق: "هل يمكنك البدء يوم الاثنين؟"',
      },
    ],
  },
  {
    id: "story-72",
    level: 2,
    order: 74,
    title: "The Difficult Customer",
    titleAr: "الزبون الصعب",
    description:
      "A furious customer tests Dana's very first week and teaches her something unexpected",
    descriptionAr: "يختبر زبون غاضب أسبوع دانا الأول ويعلّمها شيئاً غير متوقع",
    isFree: false,
    sentences: [
      {
        en: "By Wednesday Dana finally felt comfortable behind the counter",
        ar: "بحلول الأربعاء، شعرت دانا أخيراً بالراحة خلف الطاولة.",
      },
      {
        en: "Then a man stormed in demanding a refund for a torn book",
        ar: "ثم اقتحم رجل المكان مطالباً باسترداد ثمن كتاب ممزق.",
      },
      {
        en: "Dana explained calmly that the store couldn't refund used books",
        ar: "أوضحت دانا بهدوء أن المكتبة لا تسترد ثمن الكتب المستعملة.",
      },
      {
        en: "The man raised his voice and several customers turned to look",
        ar: "رفع الرجل صوته والتفت عدة زبائن للنظر.",
      },
      {
        en: "Dana felt her face turning red but kept her voice steady",
        ar: "شعرت دانا بوجهها يحمرّ لكنها حافظت على ثبات صوتها.",
      },
      {
        en: "She offered to exchange the book for a new copy instead",
        ar: "عرضت استبدال الكتاب بنسخة جديدة بدلاً من ذلك.",
      },
      {
        en: "The man paused clearly not expecting that response",
        ar: "توقف الرجل، ومن الواضح أنه لم يتوقع ذلك الرد.",
      },
      {
        en: "He took the new copy and left without another word",
        ar: "أخذ النسخة الجديدة وغادر دون كلمة أخرى.",
      },
      {
        en: "Mr Farouk had watched the entire exchange from the back shelf",
        ar: "كان السيد فاروق قد راقب الموقف بأكمله من الرف الخلفي.",
      },
      {
        en: "You didn't apologize for something that wasn't your fault he noted",
        ar: 'لاحظ قائلاً: "لم تعتذري عن شيء ليس خطأك."',
      },
      {
        en: "That's exactly the kind of thing I hired you for he added",
        ar: 'أضاف: "هذا بالضبط نوع الأشياء التي وظفتك من أجلها."',
      },
    ],
  },
  {
    id: "story-73",
    level: 2,
    order: 75,
    title: "The Book Club Idea",
    titleAr: "فكرة نادي الكتاب",
    description:
      "Dana pitches an idea to save the quiet bookstore and Mr Farouk isn't easily convinced",
    descriptionAr: "تطرح دانا فكرة لإنقاذ المكتبة الهادئة والسيد فاروق ليس سهل الإقناع",
    isFree: false,
    sentences: [
      {
        en: "Sales had been slow for the past several weeks",
        ar: "كانت المبيعات بطيئة خلال الأسابيع الماضية.",
      },
      {
        en: "Dana noticed the same regular customers browsing without buying much",
        ar: "لاحظت دانا نفس الزبائن الدائمين يتصفحون دون شراء الكثير.",
      },
      {
        en: "She suggested starting a small evening book club",
        ar: "اقترحت بدء نادي كتاب مسائي صغير.",
      },
      {
        en: "Mr Farouk raised an eyebrow and said people don't read anymore",
        ar: "رفع السيد فاروق حاجباً وقال إن الناس لم يعودوا يقرأون.",
      },
      {
        en: "Dana argued that people still wanted to talk about books together",
        ar: "جادلت دانا بأن الناس ما زالوا يريدون التحدث عن الكتب معاً.",
      },
      {
        en: "He finally agreed to let her try it just once",
        ar: "وافق أخيراً على أن تجربها لمرة واحدة فقط.",
      },
      {
        en: "Dana spent the whole week designing a small flyer",
        ar: "قضت دانا الأسبوع كله في تصميم منشور صغير.",
      },
      {
        en: "She picked a short novel that she genuinely loved herself",
        ar: "اختارت رواية قصيرة أحبتها هي بصدق.",
      },
      {
        en: "Only three people signed up by Friday afternoon",
        ar: "سجّل ثلاثة أشخاص فقط بحلول عصر الجمعة.",
      },
      {
        en: "Mr Farouk said that was three more than he expected",
        ar: "قال السيد فاروق إن هذا أكثر بثلاثة مما توقع.",
      },
      {
        en: "Dana decided that Wednesday night she would find out for sure",
        ar: "قررت دانا أنها ستكتشف الحقيقة مساء الأربعاء.",
      },
    ],
  },
  {
    id: "story-74",
    level: 2,
    order: 76,
    title: "Opening Night",
    titleAr: "ليلة الافتتاح",
    description:
      "The first book club meeting arrives and Dana isn't sure anyone will actually show up",
    descriptionAr: "تصل أول جلسة لنادي الكتاب ودانا غير متأكدة أن أحداً سيحضر فعلاً",
    isFree: false,
    sentences: [
      {
        en: "Dana arranged eight chairs in a small circle near the window",
        ar: "رتبت دانا ثمانية كراسٍ في دائرة صغيرة قرب النافذة.",
      },
      {
        en: "Only three chairs were needed but she wanted to feel hopeful",
        ar: "كانت هناك حاجة لثلاثة كراسٍ فقط لكنها أرادت أن تشعر بالأمل.",
      },
      {
        en: "At six o'clock exactly the three members walked in together",
        ar: "في تمام الساعة السادسة، دخل الأعضاء الثلاثة معاً.",
      },
      {
        en: "Behind them two more people Dana didn't recognize walked in too",
        ar: "خلفهم، دخل شخصان آخران لم تعرفهما دانا أيضاً.",
      },
      {
        en: "They had seen the flyer taped to the coffee shop window",
        ar: "كانا قد رأيا المنشور الملصق على نافذة المقهى.",
      },
      {
        en: "By six fifteen every single chair in the circle was filled",
        ar: "بحلول السادسة وربعاً، امتلأت كل الكراسي في الدائرة.",
      },
      {
        en: "The conversation started slowly then grew louder and more excited",
        ar: "بدأ الحديث ببطء ثم ازداد صوتاً وحماساً.",
      },
      {
        en: "Mr Farouk stood quietly by the register just watching and listening",
        ar: "وقف السيد فاروق بهدوء قرب الصندوق يراقب ويستمع فقط.",
      },
      {
        en: "When the last member left he was still smiling",
        ar: "عندما غادر آخر عضو، كان لا يزال يبتسم.",
      },
      {
        en: "Order sixteen more copies for next month he told Dana",
        ar: 'قال لدانا: "اطلبي ستة عشر نسخة إضافية للشهر القادم."',
      },
      {
        en: "Dana smiled and started writing down the list immediately",
        ar: "ابتسمت دانا وبدأت بكتابة القائمة فوراً.",
      },
    ],
  },
  // --- Advanced arc: The Voicemail ---
  {
    id: "story-75",
    level: 3,
    order: 77,
    title: "The Voicemail",
    titleAr: "الرسالة الصوتية",
    description: "An unfamiliar number leaves a voicemail I almost don't listen to",
    descriptionAr: "رقم غير مألوف يترك رسالة صوتية كدت لا أستمع إليها",
    isFree: true,
    sentences: [
      {
        en: "The voicemail notification sat there for almost two full days",
        ar: "بقي إشعار الرسالة الصوتية معلقاً لما يقارب يومين كاملين.",
      },
      {
        en: "I recognized the voice before he'd even said his name",
        ar: "تعرفت على الصوت قبل أن يذكر اسمه حتى.",
      },
      {
        en: "We hadn't spoken in nearly four years by that point",
        ar: "لم نتحدث منذ ما يقارب أربع سنوات حتى تلك اللحظة.",
      },
      {
        en: "His voice sounded older tired somehow smaller than I remembered",
        ar: "بدا صوته أكبر سناً، متعباً، وبطريقة ما أصغر مما أتذكر.",
      },
      {
        en: "He said our mother had asked about me again recently",
        ar: "قال إن والدتنا سألت عني مجدداً مؤخراً.",
      },
      {
        en: "He didn't apologize and honestly I hadn't expected him to",
        ar: "لم يعتذر، وبصراحة لم أكن أتوقع منه ذلك.",
      },
      {
        en: "He simply left his number and said call whenever",
        ar: "ترك رقمه فقط وقال اتصل في أي وقت تشاء.",
      },
      {
        en: "I played the message three more times after that",
        ar: "شغّلت الرسالة ثلاث مرات إضافية بعد ذلك.",
      },
      {
        en: "Every old argument I remembered started replaying in my head",
        ar: "بدأت كل الخلافات القديمة التي أتذكرها تعيد نفسها في ذهني.",
      },
      {
        en: "I still couldn't decide if I was angry or just relieved",
        ar: "ما زلت غير قادر على تحديد إن كنت غاضباً أم مرتاحاً فقط.",
      },
      {
        en: "I saved his number but didn't call back that night",
        ar: "حفظت رقمه لكنني لم أتصل به تلك الليلة.",
      },
    ],
  },
  {
    id: "story-76",
    level: 3,
    order: 78,
    title: "The Call",
    titleAr: "الاتصال",
    description: "I finally call the number back and neither of us knows how to start",
    descriptionAr: "أتصل أخيراً بالرقم ولا أحد منا يعرف كيف يبدأ",
    isFree: false,
    sentences: [
      {
        en: "I waited another full week before I actually dialed the number",
        ar: "انتظرت أسبوعاً كاملاً آخر قبل أن أتصل بالرقم فعلاً.",
      },
      {
        en: "He picked up on the second ring which surprised me",
        ar: "رد بعد الرنة الثانية، وهو ما فاجأني.",
      },
      {
        en: "Neither of us said anything for what felt like a long moment",
        ar: "لم يقل أي منا شيئاً لما بدا لحظة طويلة.",
      },
      {
        en: "He finally asked how work was going these days",
        ar: "سأل أخيراً كيف يسير العمل هذه الأيام.",
      },
      {
        en: "It was such a small question for four years of silence",
        ar: "كان سؤالاً صغيراً جداً مقابل أربع سنوات من الصمت.",
      },
      {
        en: "I answered anyway because the silence felt worse than talking",
        ar: "أجبت رغم ذلك لأن الصمت بدا أسوأ من الحديث.",
      },
      {
        en: "Slowly the conversation moved to safer smaller topics",
        ar: "انتقل الحديث تدريجياً إلى مواضيع أصغر وأكثر أماناً.",
      },
      {
        en: "Neither of us mentioned the reason we'd stopped speaking at all",
        ar: "لم يذكر أي منا سبب توقفنا عن الحديث أصلاً.",
      },
      {
        en: "Near the end he asked if I wanted to meet in person",
        ar: "قرب النهاية، سألني إن كنت أرغب باللقاء شخصياً.",
      },
      {
        en: "I said maybe which was the most honest answer I had",
        ar: "قلت ربما، وكانت أصدق إجابة أملكها.",
      },
      {
        en: "We hung up without solving anything and somehow that felt fine",
        ar: "أنهينا الاتصال دون حل أي شيء، وبطريقة ما شعرت أن هذا مقبول.",
      },
    ],
  },
  {
    id: "story-77",
    level: 3,
    order: 79,
    title: "The Visit",
    titleAr: "الزيارة",
    description: "We finally sit across from each other and the silence says almost everything",
    descriptionAr: "نجلس أخيراً وجهاً لوجه والصمت يقول كل شيء تقريباً",
    isFree: false,
    sentences: [
      {
        en: "We agreed to meet at a quiet cafe neither of us had chosen before",
        ar: "اتفقنا على اللقاء في مقهى هادئ لم يختره أي منا من قبل.",
      },
      {
        en: "I arrived early and immediately regretted arriving early",
        ar: "وصلت مبكراً وندمت فوراً على وصولي مبكراً.",
      },
      {
        en: "When he walked in he looked smaller than his voice had suggested",
        ar: "عندما دخل، بدا أصغر مما أوحى به صوته.",
      },
      {
        en: "We shook hands awkwardly then sat down across from each other",
        ar: "تصافحنا بحرج ثم جلسنا وجهاً لوجه.",
      },
      {
        en: "For a while we talked about nothing that actually mattered",
        ar: "لفترة، تحدثنا عن أشياء لا تهم فعلاً.",
      },
      {
        en: "Then he mentioned our father's old house almost by accident",
        ar: "ثم ذكر منزل والدنا القديم كأنه بالصدفة.",
      },
      {
        en: "Something in his voice cracked slightly on that one sentence",
        ar: "انكسر شيء ما في صوته قليلاً عند تلك الجملة.",
      },
      {
        en: "I realized he had been carrying this as long as I had",
        ar: "أدركت أنه كان يحمل هذا لمدة طويلة مثلي تماماً.",
      },
      {
        en: "Neither of us fully explained the years we had lost",
        ar: "لم يشرح أي منا بالكامل السنوات التي خسرناها.",
      },
      {
        en: "We didn't need to really we both already understood",
        ar: "لم نكن بحاجة لذلك فعلاً، كلانا فهم بالفعل.",
      },
      {
        en: "Before leaving he hugged me and it lasted longer than expected",
        ar: "قبل أن يغادر، عانقني، ودامت العناقة أطول مما توقعت.",
      },
    ],
  },
  {
    id: "story-78",
    level: 3,
    order: 80,
    title: "What We Didn't Say",
    titleAr: "ما لم نقله",
    description:
      "Months later I realize the relationship didn't need every question answered to heal",
    descriptionAr: "بعد أشهر، أدرك أن العلاقة لم تكن بحاجة لإجابة كل سؤال كي تُشفى",
    isFree: false,
    sentences: [
      {
        en: "Months have passed since that first awkward cup of coffee",
        ar: "مرت أشهر منذ ذلك الفنجان الأول المحرج من القهوة.",
      },
      {
        en: "We talk almost every week now usually about small things",
        ar: "نتحدث تقريباً كل أسبوع الآن، عادة عن أمور صغيرة.",
      },
      {
        en: "We still haven't discussed the exact reason we stopped speaking",
        ar: "ما زلنا لم نناقش السبب الدقيق لتوقفنا عن الحديث.",
      },
      {
        en: "For a long time I thought that conversation was necessary",
        ar: "لفترة طويلة، ظننت أن ذلك الحديث كان ضرورياً.",
      },
      {
        en: "Now I'm genuinely not sure it ever needs to happen",
        ar: "الآن، لست متأكداً حقاً أنه بحاجة للحدوث أبداً.",
      },
      {
        en: "Some wounds it turns out don't require a full explanation",
        ar: "يبدو أن بعض الجروح لا تتطلب تفسيراً كاملاً.",
      },
      {
        en: "They only require someone willing to show up again",
        ar: "إنها تتطلب فقط شخصاً مستعداً للحضور مجدداً.",
      },
      {
        en: "My brother calls more often than I ever expected him to",
        ar: "يتصل أخي أكثر بكثير مما توقعت منه يوماً.",
      },
      {
        en: "Last week he asked if I wanted to visit our mother together",
        ar: "الأسبوع الماضي سألني إن كنت أرغب بزيارة والدتنا معاً.",
      },
      {
        en: "I said yes without thinking twice about it at all",
        ar: "قلت نعم دون التفكير مرتين في الأمر إطلاقاً.",
      },
      {
        en: "Some doors it turns out were never fully closed at all",
        ar: "يبدو أن بعض الأبواب لم تُغلق بالكامل أبداً.",
      },
    ],
  },
];

async function main() {
  const lessonRows = STORIES.map((s) => ({
    id: s.id,
    mode: "stories" as const,
    level_id: LEVEL_ID[s.level],
    order_index: s.order,
    title: s.title,
    title_ar: s.titleAr,
    description: s.description,
    description_ar: s.descriptionAr,
    is_free: s.isFree,
  }));

  const { error: lessonError } = await supabase
    .from("lessons")
    .upsert(lessonRows, { onConflict: "id", ignoreDuplicates: true });
  if (lessonError) throw lessonError;
  console.log(`Inserted/confirmed ${lessonRows.length} lessons.`);

  const sentenceRows = STORIES.flatMap((s) =>
    s.sentences.map((sent, index) => ({
      id: `${s.id}-s${index + 1}`,
      lesson_id: s.id,
      order_index: index + 1,
      en: sent.en,
      ar: sent.ar,
    })),
  );

  const { error: sentenceError } = await supabase
    .from("sentences")
    .upsert(sentenceRows, { onConflict: "id", ignoreDuplicates: true });
  if (sentenceError) throw sentenceError;
  console.log(`Inserted/confirmed ${sentenceRows.length} sentences.`);
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
