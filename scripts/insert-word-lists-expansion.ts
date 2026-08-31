/**
 * One-time push of 9 new Word Lists groups (3 per tier: Beginner/
 * Intermediate/Advanced), 20 words each, into the live Supabase project —
 * bringing every tier from 3 groups to 6, matching the existing 9 groups'
 * exact shape (see 20250143000000_word_lists_seed_content.sql). No English/
 * Arabic-only translation rows are added, matching that same precedent (the
 * existing 9 groups have none either — ES/TR falls back the same way for
 * both old and new content, not a regression this script introduces).
 *
 * Themes are deliberately distinct from the existing 9 (Family/Colors/
 * Animals, Friendship/Travel/Health, Politics/Finance/Technology) — no two
 * groups, old or new, cover the same topic.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-word-lists-expansion.ts
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

interface GroupSeed {
  id: string;
  level: 1 | 2 | 3;
  order: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
}

interface WordSeed {
  word: string;
  sentence: string;
  hintAr: string;
}

const GROUPS: GroupSeed[] = [
  {
    id: "food",
    level: 1,
    order: 10,
    title: "Food",
    titleAr: "الطعام",
    description: "Everyday food words for meals, groceries, and eating out.",
    descriptionAr: "مفردات طعام يومية للوجبات والتسوق وتناول الطعام خارج المنزل.",
  },
  {
    id: "house",
    level: 1,
    order: 11,
    title: "House",
    titleAr: "المنزل",
    description: "The rooms and everyday things around a home.",
    descriptionAr: "غرف المنزل والأشياء اليومية الموجودة فيه.",
  },
  {
    id: "clothes",
    level: 1,
    order: 12,
    title: "Clothes",
    titleAr: "الملابس",
    description: "What people actually wear, and the words for talking about it.",
    descriptionAr: "ما يرتديه الناس فعلاً، والكلمات المستخدمة للحديث عنه.",
  },
  {
    id: "shopping",
    level: 2,
    order: 13,
    title: "Shopping",
    titleAr: "التسوق",
    description: "The vocabulary of buying things — in a store or online.",
    descriptionAr: "مفردات شراء الأشياء — من متجر أو عبر الإنترنت.",
  },
  {
    id: "weather",
    level: 2,
    order: 14,
    title: "Weather",
    titleAr: "الطقس",
    description: "How people actually talk about the weather, day to day.",
    descriptionAr: "كيف يتحدث الناس فعلاً عن الطقس، يوماً بعد يوم.",
  },
  {
    id: "work",
    level: 2,
    order: 15,
    title: "Work",
    titleAr: "العمل",
    description: "The everyday language of jobs, offices, and getting things done.",
    descriptionAr: "اللغة اليومية للوظائف والمكاتب وإنجاز المهام.",
  },
  {
    id: "environment",
    level: 3,
    order: 16,
    title: "Environment",
    titleAr: "البيئة",
    description: "The vocabulary that shows up whenever people discuss the planet.",
    descriptionAr: "المفردات التي تظهر دائماً عند الحديث عن كوكب الأرض.",
  },
  {
    id: "education",
    level: 3,
    order: 17,
    title: "Education",
    titleAr: "التعليم",
    description: "School, university, and everything that comes with studying seriously.",
    descriptionAr: "المدرسة والجامعة وكل ما يرافق الدراسة الجادة.",
  },
  {
    id: "media",
    level: 3,
    order: 18,
    title: "Media",
    titleAr: "الإعلام",
    description: "News, social platforms, and how information actually spreads today.",
    descriptionAr: "الأخبار ومنصات التواصل وكيف تنتشر المعلومات فعلاً اليوم.",
  },
];

const WORDS: Record<string, WordSeed[]> = {
  food: [
    { word: "bread", sentence: "Could you pass me the ___, please?", hintAr: "الخبز." },
    { word: "rice", sentence: "We usually have ___ with dinner.", hintAr: "الأرز." },
    { word: "water", sentence: "Can I get a glass of ___?", hintAr: "الماء." },
    { word: "milk", sentence: "He drinks a glass of ___ every morning.", hintAr: "الحليب." },
    { word: "egg", sentence: "She boiled an ___ for breakfast.", hintAr: "البيضة." },
    { word: "cheese", sentence: "This sandwich needs more ___.", hintAr: "الجبن." },
    { word: "meat", sentence: "He doesn't eat ___ on Fridays.", hintAr: "اللحم." },
    { word: "chicken", sentence: "We're having grilled ___ tonight.", hintAr: "الدجاج (كطعام)." },
    {
      word: "fish",
      sentence: "The restaurant serves fresh ___ every day.",
      hintAr: "السمك (كطعام).",
    },
    { word: "vegetable", sentence: "Try to eat at least one ___ with lunch.", hintAr: "الخضار." },
    { word: "fruit", sentence: "She packed some ___ for the trip.", hintAr: "الفاكهة." },
    { word: "sugar", sentence: "He takes his tea with a little ___.", hintAr: "السكر." },
    { word: "salt", sentence: "This soup needs a pinch of ___.", hintAr: "الملح." },
    { word: "breakfast", sentence: "We never skip ___ in this house.", hintAr: "وجبة الفطور." },
    { word: "lunch", sentence: "Let's grab ___ together tomorrow.", hintAr: "وجبة الغداء." },
    { word: "dinner", sentence: "___ is ready, come to the table.", hintAr: "وجبة العشاء." },
    { word: "restaurant", sentence: "They opened a new ___ downtown.", hintAr: "المطعم." },
    { word: "menu", sentence: "Can I see the ___, please?", hintAr: "قائمة الطعام." },
    { word: "recipe", sentence: "She found the ___ online last night.", hintAr: "وصفة الطبخ." },
    { word: "hungry", sentence: "I'm too ___ to wait any longer.", hintAr: "جائع." },
  ],
  house: [
    { word: "kitchen", sentence: "She's cooking dinner in the ___.", hintAr: "المطبخ." },
    {
      word: "bedroom",
      sentence: "His ___ is upstairs, next to the bathroom.",
      hintAr: "غرفة النوم.",
    },
    {
      word: "bathroom",
      sentence: "The ___ light stopped working this morning.",
      hintAr: "الحمام.",
    },
    { word: "window", sentence: "Open the ___, it's warm in here.", hintAr: "النافذة." },
    { word: "door", sentence: "Please close the ___ behind you.", hintAr: "الباب." },
    { word: "table", sentence: "We put the flowers on the ___.", hintAr: "الطاولة." },
    { word: "chair", sentence: "Pull up a ___ and join us.", hintAr: "الكرسي." },
    { word: "bed", sentence: "The cat sleeps on my ___ every night.", hintAr: "السرير." },
    { word: "sofa", sentence: "He fell asleep on the ___ watching TV.", hintAr: "الأريكة." },
    { word: "key", sentence: "I can't find my house ___ anywhere.", hintAr: "المفتاح." },
    { word: "roof", sentence: "Rain was hitting the ___ all night.", hintAr: "السقف." },
    { word: "garden", sentence: "They grow tomatoes in the ___ every summer.", hintAr: "الحديقة." },
    { word: "stairs", sentence: "Watch your step going down the ___.", hintAr: "الدرج." },
    { word: "mirror", sentence: "She checked her hair in the ___.", hintAr: "المرآة." },
    { word: "lamp", sentence: "Turn on the ___, it's getting dark.", hintAr: "المصباح." },
    {
      word: "curtain",
      sentence: "Could you close the ___, the sun is bright.",
      hintAr: "الستارة.",
    },
    { word: "neighbor", sentence: "Our ___ waters our plants when we travel.", hintAr: "الجار." },
    { word: "address", sentence: "Can you send me your ___?", hintAr: "العنوان." },
    { word: "clean", sentence: "We ___ the whole house every Saturday.", hintAr: "ينظف." },
    {
      word: "move",
      sentence: "They're going to ___ to a bigger place next month.",
      hintAr: "ينتقل (للسكن).",
    },
  ],
  clothes: [
    { word: "shirt", sentence: "He spilled coffee on his new ___.", hintAr: "القميص." },
    { word: "pants", sentence: "These ___ are too long for me.", hintAr: "البنطال." },
    { word: "dress", sentence: "She wore a blue ___ to the party.", hintAr: "الفستان." },
    { word: "shoes", sentence: "My ___ got wet in the rain.", hintAr: "الحذاء." },
    { word: "socks", sentence: "I can never find matching ___.", hintAr: "الجوارب." },
    { word: "jacket", sentence: "Bring a ___, it gets cold at night.", hintAr: "السترة/الجاكيت." },
    { word: "hat", sentence: "He wore a ___ to block the sun.", hintAr: "القبعة." },
    { word: "scarf", sentence: "She wrapped a warm ___ around her neck.", hintAr: "الوشاح." },
    { word: "gloves", sentence: "Put your ___ on, it's freezing outside.", hintAr: "القفازات." },
    { word: "belt", sentence: "His pants need a ___ to stay up.", hintAr: "الحزام." },
    { word: "size", sentence: "What ___ do you wear in shoes?", hintAr: "المقاس." },
    {
      word: "fit",
      sentence: "These jeans don't ___ me anymore.",
      hintAr: "يلائم/يناسب (بالمقاس).",
    },
    {
      word: "outfit",
      sentence: "She wore a stylish ___ to the interview.",
      hintAr: "الزي/الإطلالة الكاملة.",
    },
    { word: "wear", sentence: "What are you going to ___ tonight?", hintAr: "يرتدي." },
    { word: "cotton", sentence: "This shirt is made of pure ___.", hintAr: "القطن." },
    { word: "wool", sentence: "The sweater is warm because it's ___.", hintAr: "الصوف." },
    { word: "laundry", sentence: "I need to do the ___ this weekend.", hintAr: "الغسيل." },
    { word: "iron", sentence: "Could you ___ this shirt for me?", hintAr: "يكوي." },
    { word: "button", sentence: "A ___ came off my coat yesterday.", hintAr: "الزر." },
    { word: "pocket", sentence: "He keeps his phone in his back ___.", hintAr: "الجيب." },
  ],
  shopping: [
    { word: "store", sentence: "The ___ closes at nine on weekdays.", hintAr: "المتجر." },
    { word: "price", sentence: "The ___ went up again this month.", hintAr: "السعر." },
    { word: "cash", sentence: "He paid in ___ instead of card.", hintAr: "النقد." },
    {
      word: "receipt",
      sentence: "Keep the ___ in case you need to return it.",
      hintAr: "الإيصال.",
    },
    { word: "discount", sentence: "We got a nice ___ on the jacket.", hintAr: "الخصم." },
    { word: "sale", sentence: "The store is having a big ___ this weekend.", hintAr: "التخفيضات." },
    { word: "expensive", sentence: "That watch looked way too ___ for me.", hintAr: "غالٍ." },
    {
      word: "cheap",
      sentence: "This market sells vegetables ___er than the mall.",
      hintAr: "رخيص.",
    },
    { word: "cart", sentence: "She filled her ___ with groceries.", hintAr: "عربة التسوق." },
    { word: "bag", sentence: "Do you need a ___ for that?", hintAr: "الكيس/الحقيبة." },
    {
      word: "refund",
      sentence: "They gave me a full ___ for the broken item.",
      hintAr: "استرداد المبلغ.",
    },
    { word: "exchange", sentence: "Can I ___ this for a different color?", hintAr: "يستبدل." },
    { word: "customer", sentence: "The ___ asked to speak with a manager.", hintAr: "الزبون." },
    { word: "cashier", sentence: "The ___ scanned each item quickly.", hintAr: "أمين الصندوق." },
    {
      word: "online",
      sentence: "I did most of my shopping ___ this year.",
      hintAr: "عبر الإنترنت.",
    },
    { word: "delivery", sentence: "___ usually takes about three days.", hintAr: "التوصيل." },
    { word: "order", sentence: "I placed an ___ for new shoes last night.", hintAr: "الطلب." },
    {
      word: "budget",
      sentence: "We're trying to stay within our ___ this month.",
      hintAr: "الميزانية.",
    },
    {
      word: "afford",
      sentence: "I don't think we can ___ that right now.",
      hintAr: "يستطيع تحمل التكلفة.",
    },
    { word: "wallet", sentence: "He left his ___ at the checkout counter.", hintAr: "المحفظة." },
  ],
  weather: [
    { word: "sunny", sentence: "It's been ___ all week.", hintAr: "مشمس." },
    { word: "cloudy", sentence: "The sky turned ___ around noon.", hintAr: "غائم." },
    { word: "rainy", sentence: "Bring an umbrella, it looks ___ today.", hintAr: "ممطر." },
    { word: "windy", sentence: "It was too ___ to fly a kite.", hintAr: "عاصف (رياح قوية)." },
    { word: "storm", sentence: "A ___ knocked out the power last night.", hintAr: "العاصفة." },
    { word: "thunder", sentence: "The kids got scared by the ___.", hintAr: "الرعد." },
    { word: "lightning", sentence: "___ lit up the whole sky for a second.", hintAr: "البرق." },
    { word: "snow", sentence: "The kids played in the ___ all afternoon.", hintAr: "الثلج." },
    { word: "fog", sentence: "Drive carefully, there's ___ on the road.", hintAr: "الضباب." },
    {
      word: "temperature",
      sentence: "The ___ dropped a lot after sunset.",
      hintAr: "درجة الحرارة.",
    },
    {
      word: "degree",
      sentence: "It's about thirty ___s outside right now.",
      hintAr: "درجة (قياس حرارة).",
    },
    { word: "humid", sentence: "Summers here are hot and ___.", hintAr: "رطب." },
    { word: "freezing", sentence: "It's ___ out there, wear a coat.", hintAr: "شديد البرودة." },
    { word: "forecast", sentence: "The ___ says it'll rain tomorrow.", hintAr: "توقعات الطقس." },
    { word: "umbrella", sentence: "I forgot my ___ at the office again.", hintAr: "المظلة." },
    { word: "season", sentence: "Autumn is my favorite ___.", hintAr: "الفصل (فصول السنة)." },
    { word: "climate", sentence: "The ___ here is dry most of the year.", hintAr: "المناخ." },
    { word: "breeze", sentence: "A cool ___ came in through the window.", hintAr: "النسيم." },
    { word: "flood", sentence: "Heavy rain caused a ___ downtown.", hintAr: "الفيضان." },
    {
      word: "drought",
      sentence: "The region has struggled with ___ for years.",
      hintAr: "الجفاف.",
    },
  ],
  work: [
    { word: "job", sentence: "She just started a new ___ this week.", hintAr: "الوظيفة." },
    { word: "office", sentence: "He spends most of his day at the ___.", hintAr: "المكتب." },
    {
      word: "boss",
      sentence: "My ___ asked me to finish the report today.",
      hintAr: "المدير/الرئيس بالعمل.",
    },
    { word: "colleague", sentence: "I grabbed lunch with a ___ from work.", hintAr: "الزميل." },
    { word: "meeting", sentence: "We have a team ___ at ten.", hintAr: "الاجتماع." },
    {
      word: "deadline",
      sentence: "The ___ for this project is Friday.",
      hintAr: "الموعد النهائي.",
    },
    { word: "salary", sentence: "Her ___ went up after the promotion.", hintAr: "الراتب." },
    {
      word: "interview",
      sentence: "He has a job ___ tomorrow morning.",
      hintAr: "المقابلة (وظيفية).",
    },
    { word: "resume", sentence: "She updated her ___ before applying.", hintAr: "السيرة الذاتية." },
    { word: "hire", sentence: "The company plans to ___ five more people.", hintAr: "يوظّف." },
    { word: "fire", sentence: "They had to ___ him after the incident.", hintAr: "يفصل من العمل." },
    { word: "promotion", sentence: "He got a ___ after two years there.", hintAr: "الترقية." },
    {
      word: "schedule",
      sentence: "Can you check your ___ for next week?",
      hintAr: "الجدول الزمني.",
    },
    { word: "task", sentence: "I still have three ___s left today.", hintAr: "المهمة." },
    { word: "project", sentence: "We're behind schedule on this ___.", hintAr: "المشروع." },
    { word: "client", sentence: "The ___ asked for a few changes.", hintAr: "العميل (بالأعمال)." },
    {
      word: "email",
      sentence: "I'll send you an ___ with the details.",
      hintAr: "البريد الإلكتروني.",
    },
    { word: "overtime", sentence: "He worked ___ to finish the report.", hintAr: "العمل الإضافي." },
    { word: "resign", sentence: "She decided to ___ at the end of the month.", hintAr: "يستقيل." },
    {
      word: "teamwork",
      sentence: "Good ___ made the project finish early.",
      hintAr: "العمل الجماعي.",
    },
  ],
  environment: [
    {
      word: "environment",
      sentence: "We need to protect the ___ for future generations.",
      hintAr: "البيئة.",
    },
    { word: "pollution", sentence: "Air ___ is getting worse in big cities.", hintAr: "التلوث." },
    {
      word: "climate",
      sentence: "Scientists warn that the ___ is changing quickly.",
      hintAr: "المناخ.",
    },
    { word: "recycle", sentence: "We ___ paper and plastic at home.", hintAr: "يعيد التدوير." },
    {
      word: "plastic",
      sentence: "This store stopped using ___ bags last year.",
      hintAr: "البلاستيك.",
    },
    { word: "waste", sentence: "The factory produces a lot of ___.", hintAr: "النفايات." },
    { word: "energy", sentence: "Solar panels turn sunlight into ___.", hintAr: "الطاقة." },
    { word: "renewable", sentence: "Wind is a ___ source of energy.", hintAr: "متجدد." },
    { word: "oil", sentence: "Cars that run on ___ produce more pollution.", hintAr: "النفط." },
    { word: "emission", sentence: "New laws aim to cut carbon ___s.", hintAr: "الانبعاثات." },
    { word: "forest", sentence: "A large ___ was destroyed by the fire.", hintAr: "الغابة." },
    {
      word: "species",
      sentence: "This ___ only lives in one part of the world.",
      hintAr: "النوع (كائن حي).",
    },
    { word: "extinct", sentence: "That bird has been ___ for decades.", hintAr: "منقرض." },
    { word: "drought", sentence: "The ___ affected crops across the region.", hintAr: "الجفاف." },
    {
      word: "sustainable",
      sentence: "The company switched to more ___ packaging.",
      hintAr: "مستدام.",
    },
    {
      word: "conservation",
      sentence: "The park focuses on wildlife ___.",
      hintAr: "الحفاظ (على البيئة).",
    },
    {
      word: "ecosystem",
      sentence: "Removing one species can harm the whole ___.",
      hintAr: "النظام البيئي.",
    },
    { word: "carbon", sentence: "Flights add a lot of ___ to the air.", hintAr: "الكربون." },
    {
      word: "glacier",
      sentence: "The ___ has shrunk noticeably in ten years.",
      hintAr: "النهر الجليدي.",
    },
    {
      word: "awareness",
      sentence: "The campaign raised ___ about ocean pollution.",
      hintAr: "الوعي/التوعية.",
    },
  ],
  education: [
    { word: "university", sentence: "She's studying medicine at ___.", hintAr: "الجامعة." },
    {
      word: "degree",
      sentence: "He earned his ___ after four years.",
      hintAr: "الشهادة الجامعية.",
    },
    {
      word: "scholarship",
      sentence: "She received a full ___ to study abroad.",
      hintAr: "المنحة الدراسية.",
    },
    { word: "exam", sentence: "The final ___ is next Monday.", hintAr: "الامتحان." },
    { word: "grade", sentence: "He got a good ___ on his essay.", hintAr: "الدرجة/العلامة." },
    {
      word: "lecture",
      sentence: "The professor's ___ ran twenty minutes late.",
      hintAr: "المحاضرة.",
    },
    {
      word: "classroom",
      sentence: "Our ___ was too small for thirty students.",
      hintAr: "الصف الدراسي.",
    },
    {
      word: "curriculum",
      sentence: "The school updated its ___ this year.",
      hintAr: "المنهج الدراسي.",
    },
    {
      word: "assignment",
      sentence: "I still need to finish my history ___.",
      hintAr: "الواجب الدراسي.",
    },
    { word: "graduate", sentence: "She'll ___ from college next spring.", hintAr: "يتخرج." },
    {
      word: "tuition",
      sentence: "___ at that university is very high.",
      hintAr: "الرسوم الدراسية.",
    },
    { word: "major", sentence: "His ___ is computer science.", hintAr: "التخصص الجامعي." },
    {
      word: "semester",
      sentence: "This ___ has been busier than the last.",
      hintAr: "الفصل الدراسي.",
    },
    {
      word: "professor",
      sentence: "The ___ answered every question patiently.",
      hintAr: "الأستاذ الجامعي.",
    },
    { word: "research", sentence: "Her ___ focuses on renewable energy.", hintAr: "البحث العلمي." },
    { word: "skill", sentence: "Public speaking is a useful ___ to have.", hintAr: "المهارة." },
    { word: "knowledge", sentence: "Reading is a great way to gain ___.", hintAr: "المعرفة." },
    { word: "literacy", sentence: "The program aims to improve adult ___.", hintAr: "محو الأمية." },
    {
      word: "discipline",
      sentence: "It takes ___ to study every day after work.",
      hintAr: "الانضباط.",
    },
    {
      word: "mentor",
      sentence: "Her ___ helped her plan her whole career.",
      hintAr: "المرشد/الموجّه.",
    },
  ],
  media: [
    { word: "news", sentence: "Did you see the ___ this morning?", hintAr: "الأخبار." },
    {
      word: "journalist",
      sentence: "The ___ interviewed three witnesses at the scene.",
      hintAr: "الصحفي.",
    },
    { word: "article", sentence: "She wrote an ___ about local schools.", hintAr: "المقال." },
    {
      word: "headline",
      sentence: "The ___ caught everyone's attention right away.",
      hintAr: "العنوان الرئيسي (خبر).",
    },
    {
      word: "broadcast",
      sentence: "The event was ___ live on national TV.",
      hintAr: "البث (المباشر).",
    },
    { word: "channel", sentence: "He switched to a different news ___.", hintAr: "القناة." },
    {
      word: "interview",
      sentence: "The actor gave an ___ about her new film.",
      hintAr: "المقابلة (إعلامية).",
    },
    { word: "source", sentence: "A reliable ___ confirmed the story.", hintAr: "المصدر." },
    { word: "audience", sentence: "The show has a huge young ___.", hintAr: "الجمهور." },
    { word: "platform", sentence: "The app became a popular ___ for creators.", hintAr: "المنصة." },
    {
      word: "influencer",
      sentence: "An ___ promoted the product online.",
      hintAr: "المؤثر (سوشيال ميديا).",
    },
    { word: "content", sentence: "She posts new ___ every single day.", hintAr: "المحتوى." },
    { word: "viral", sentence: "The video went ___ within a few hours.", hintAr: "منتشر بسرعة." },
    { word: "comment", sentence: "He left a kind ___ under her post.", hintAr: "التعليق." },
    {
      word: "subscribe",
      sentence: "___ to the channel for weekly updates.",
      hintAr: "يشترك (بمتابعة قناة).",
    },
    {
      word: "censorship",
      sentence: "The report criticized government ___.",
      hintAr: "الرقابة/الحجب.",
    },
    { word: "bias", sentence: "Readers accused the paper of political ___.", hintAr: "التحيّز." },
    { word: "rumor", sentence: "Social media makes a ___ spread faster.", hintAr: "الشائعة." },
    { word: "privacy", sentence: "People worry about their online ___.", hintAr: "الخصوصية." },
    {
      word: "coverage",
      sentence: "The election got heavy media ___.",
      hintAr: "التغطية (الإعلامية).",
    },
  ],
};

async function main() {
  const groupRows = GROUPS.map((g) => ({
    id: g.id,
    level: g.level,
    order_index: g.order,
    title: g.title,
    title_ar: g.titleAr,
    description: g.description,
    description_ar: g.descriptionAr,
    is_free: false,
    status: "published" as const,
  }));

  const { error: groupError } = await supabase
    .from("word_groups")
    .upsert(groupRows, { onConflict: "id", ignoreDuplicates: true });
  if (groupError) throw groupError;
  console.log(`Inserted/confirmed ${groupRows.length} word_groups.`);

  const wordRows = GROUPS.flatMap((g) =>
    WORDS[g.id]!.map((w, index) => ({
      id: `${g.id}-${w.word.replace(/\s+/g, "-")}`,
      group_id: g.id,
      order_index: index + 1,
      target_word: w.word,
      sentence: w.sentence,
      hint_ar: w.hintAr,
    })),
  );

  const { error: wordError } = await supabase
    .from("vocabulary_words")
    .upsert(wordRows, { onConflict: "id", ignoreDuplicates: true });
  if (wordError) throw wordError;
  console.log(`Inserted/confirmed ${wordRows.length} vocabulary_words.`);
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
