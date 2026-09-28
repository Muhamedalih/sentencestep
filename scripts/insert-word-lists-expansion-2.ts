/**
 * One-time push of 6 new Word Lists groups (2 per tier: Beginner/
 * Intermediate/Advanced), 25 words each, into the live Supabase project —
 * bringing every tier from 6 groups to 8.
 *
 * Inserted as status: "draft" on purpose (not "published" like every prior
 * seed/expansion/topup script) — the group_groups RLS policy ("Published
 * word groups are public; admins see all", see
 * supabase/migrations/20250119000000_word_lists.sql) means a draft row is
 * visible only to an admin session (via is_admin()), never to a learner.
 * Flip each group's status to "published" from Admin > Word Lists once
 * it's been reviewed — this script deliberately does not do that itself.
 *
 * Themes are distinct from all 18 existing groups (Family/Colors/Animals/
 * Food/House/Clothes, Friendship/Travel/Health/Shopping/Weather/Work,
 * Politics/Finance/Technology/Environment/Education/Media) — every target
 * word below was checked by hand against all ~465 existing words and
 * against the other 5 new groups; none repeat.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-word-lists-expansion-2.ts
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
    id: "body",
    level: 1,
    order: 19,
    title: "Body",
    titleAr: "الجسم",
    description: "The body parts people actually talk about — from head to toe.",
    descriptionAr: "أجزاء الجسم التي يتحدث عنها الناس فعلاً، من الرأس إلى القدم.",
  },
  {
    id: "transportation",
    level: 1,
    order: 20,
    title: "Transportation",
    titleAr: "المواصلات",
    description: "How people actually get around — cars, trains, and everything on the road.",
    descriptionAr: "كيف يتنقل الناس فعلاً — السيارات والقطارات وكل ما يتعلق بالطريق.",
  },
  {
    id: "sports",
    level: 2,
    order: 21,
    title: "Sports",
    titleAr: "الرياضة",
    description: "The vocabulary of games, matches, and staying active.",
    descriptionAr: "مفردات الألعاب والمباريات والنشاط البدني.",
  },
  {
    id: "emotions",
    level: 2,
    order: 22,
    title: "Emotions",
    titleAr: "المشاعر",
    description: "The feelings people actually name when talking about their day.",
    descriptionAr: "المشاعر التي يسميها الناس فعلاً عند الحديث عن يومهم.",
  },
  {
    id: "law",
    level: 3,
    order: 23,
    title: "Law",
    titleAr: "القانون",
    description: "The vocabulary of courts, contracts, and the legal system.",
    descriptionAr: "مفردات المحاكم والعقود والنظام القانوني.",
  },
  {
    id: "science",
    level: 3,
    order: 24,
    title: "Science",
    titleAr: "العلوم",
    description:
      "The language of experiments, theories, and how researchers actually talk about them.",
    descriptionAr: "لغة التجارب والنظريات وكيف يتحدث الباحثون عنها فعلاً.",
  },
];

const WORDS: Record<string, WordSeed[]> = {
  body: [
    { word: "head", sentence: "He hit his ___ on the low doorway.", hintAr: "الرأس." },
    { word: "hair", sentence: "She dyed her ___ a bright red color.", hintAr: "الشعر." },
    { word: "eye", sentence: "Close one ___ and look through the camera.", hintAr: "العين." },
    { word: "ear", sentence: "He whispered the answer in my ___.", hintAr: "الأذن." },
    { word: "nose", sentence: "The dog sniffed the ground with its ___.", hintAr: "الأنف." },
    { word: "mouth", sentence: "Don't talk with food in your ___.", hintAr: "الفم." },
    {
      word: "tooth",
      sentence: "She lost a ___ playing hockey last year.",
      hintAr: "السن أو الضرس.",
    },
    { word: "tongue", sentence: "He burned his ___ on the hot soup.", hintAr: "اللسان." },
    { word: "neck", sentence: "The scarf kept her ___ warm all winter.", hintAr: "الرقبة." },
    { word: "shoulder", sentence: "He carried the bag over one ___.", hintAr: "الكتف." },
    { word: "arm", sentence: "She broke her ___ falling off the bike.", hintAr: "الذراع." },
    { word: "elbow", sentence: "He leaned his ___ on the table.", hintAr: "المرفق." },
    { word: "hand", sentence: "Raise your ___ if you know the answer.", hintAr: "اليد." },
    { word: "finger", sentence: "She cut her ___ chopping onions.", hintAr: "الإصبع." },
    { word: "nail", sentence: "He painted his sister's ___s bright pink.", hintAr: "الظفر." },
    { word: "chest", sentence: "The doctor listened to his ___ carefully.", hintAr: "الصدر." },
    { word: "back", sentence: "Lifting the box hurt his ___.", hintAr: "الظهر." },
    {
      word: "stomach",
      sentence: "Her ___ growled during the meeting.",
      hintAr: "المعدة أو البطن.",
    },
    { word: "leg", sentence: "He stretched his ___s before the race.", hintAr: "الساق أو الرجل." },
    { word: "knee", sentence: "She scraped her ___ falling off the swing.", hintAr: "الركبة." },
    { word: "ankle", sentence: "He twisted his ___ on the uneven path.", hintAr: "الكاحل." },
    { word: "foot", sentence: "Watch your ___, the step is broken.", hintAr: "القدم." },
    { word: "toe", sentence: "She stubbed her ___ on the bed frame.", hintAr: "إصبع القدم." },
    { word: "skin", sentence: "Use sunscreen to protect your ___.", hintAr: "الجلد أو البشرة." },
    { word: "wrist", sentence: "He wears his watch on his left ___.", hintAr: "المعصم." },
  ],
  transportation: [
    { word: "car", sentence: "We drove to the coast in my brother's ___.", hintAr: "السيارة." },
    {
      word: "bus",
      sentence: "The ___ arrives at the corner every ten minutes.",
      hintAr: "الحافلة.",
    },
    { word: "train", sentence: "She takes the ___ to work every morning.", hintAr: "القطار." },
    {
      word: "bicycle",
      sentence: "He rides his ___ to school every day.",
      hintAr: "الدراجة الهوائية.",
    },
    {
      word: "motorcycle",
      sentence: "A ___ passed us quickly on the highway.",
      hintAr: "الدراجة النارية.",
    },
    { word: "taxi", sentence: "We called a ___ to get to the airport.", hintAr: "سيارة الأجرة." },
    { word: "subway", sentence: "The ___ was packed during rush hour.", hintAr: "مترو الأنفاق." },
    {
      word: "truck",
      sentence: "A large ___ delivered the furniture this morning.",
      hintAr: "الشاحنة.",
    },
    { word: "ship", sentence: "The ___ sailed out of the harbor at noon.", hintAr: "السفينة." },
    { word: "boat", sentence: "They rowed the small ___ across the lake.", hintAr: "القارب." },
    {
      word: "driver",
      sentence: "The ___ stopped to let the children cross.",
      hintAr: "السائق.",
    },
    { word: "passenger", sentence: "Every ___ must wear a seatbelt.", hintAr: "الراكب." },
    { word: "traffic", sentence: "___ was heavy on the way home tonight.", hintAr: "حركة المرور." },
    { word: "highway", sentence: "We took the ___ to save some time.", hintAr: "الطريق السريع." },
    { word: "fuel", sentence: "The car ran out of ___ near the bridge.", hintAr: "الوقود." },
    { word: "engine", sentence: "The mechanic fixed the ___ in an hour.", hintAr: "المحرك." },
    { word: "wheel", sentence: "One ___ on the cart is wobbly.", hintAr: "العجلة." },
    {
      word: "brake",
      sentence: "He hit the ___ before the light turned red.",
      hintAr: "الفرامل.",
    },
    { word: "horn", sentence: "The driver honked his ___ at the cat.", hintAr: "بوق السيارة." },
    {
      word: "license",
      sentence: "You need a driving ___ to rent a car.",
      hintAr: "الرخصة.",
    },
    {
      word: "garage",
      sentence: "She parked the car in the ___ overnight.",
      hintAr: "المرآب أو الكراج.",
    },
    {
      word: "seatbelt",
      sentence: "Please fasten your ___ before we start driving.",
      hintAr: "حزام الأمان.",
    },
    {
      word: "parking",
      sentence: "___ near the stadium is almost impossible to find.",
      hintAr: "موقف السيارات.",
    },
    {
      word: "pedestrian",
      sentence: "Cars must stop for a ___ at the crosswalk.",
      hintAr: "المشاة.",
    },
    {
      word: "route",
      sentence: "We took a shorter ___ to avoid the traffic.",
      hintAr: "الطريق أو المسار.",
    },
  ],
  sports: [
    { word: "team", sentence: "Our ___ won the championship last year.", hintAr: "الفريق." },
    {
      word: "player",
      sentence: "The best ___ on the field scored twice.",
      hintAr: "اللاعب.",
    },
    {
      word: "coach",
      sentence: "The ___ called a timeout before the final minute.",
      hintAr: "المدرب.",
    },
    {
      word: "referee",
      sentence: "The ___ gave a yellow card for that foul.",
      hintAr: "الحكم.",
    },
    { word: "score", sentence: "What's the ___ at halftime?", hintAr: "النتيجة." },
    {
      word: "goal",
      sentence: "She scored the winning ___ in the last minute.",
      hintAr: "الهدف.",
    },
    { word: "match", sentence: "The ___ was postponed because of the storm.", hintAr: "المباراة." },
    {
      word: "championship",
      sentence: "They've won the ___ three years in a row.",
      hintAr: "البطولة.",
    },
    {
      word: "stadium",
      sentence: "The ___ was completely full for the final.",
      hintAr: "الملعب أو الاستاد.",
    },
    {
      word: "tournament",
      sentence: "He's playing in a chess ___ this weekend.",
      hintAr: "البطولة (منافسة).",
    },
    { word: "medal", sentence: "She won a gold ___ in swimming.", hintAr: "الميدالية." },
    {
      word: "fitness",
      sentence: "Regular exercise improves your overall ___.",
      hintAr: "اللياقة البدنية.",
    },
    { word: "gym", sentence: "He goes to the ___ three times a week.", hintAr: "صالة الرياضة." },
    {
      word: "exercise",
      sentence: "Try to ___ for thirty minutes every day.",
      hintAr: "يمارس الرياضة.",
    },
    {
      word: "jog",
      sentence: "She likes to ___ along the river every morning.",
      hintAr: "يهرول أو يركض بخفة.",
    },
    { word: "stretch", sentence: "Always ___ before you start running.", hintAr: "يمدد العضلات." },
    {
      word: "opponent",
      sentence: "His ___ was much taller than him.",
      hintAr: "الخصم أو المنافس.",
    },
    {
      word: "victory",
      sentence: "The whole town celebrated the team's ___.",
      hintAr: "الانتصار.",
    },
    {
      word: "defeat",
      sentence: "It was a hard ___ to accept after such a good season.",
      hintAr: "الهزيمة.",
    },
    {
      word: "penalty",
      sentence: "The team scored from a ___ in the second half.",
      hintAr: "ضربة الجزاء.",
    },
    {
      word: "foul",
      sentence: "The referee called a ___ near the goal line.",
      hintAr: "المخالفة.",
    },
    {
      word: "sprint",
      sentence: "She had to ___ the last hundred meters.",
      hintAr: "العدو السريع.",
    },
    {
      word: "marathon",
      sentence: "He finished his first ___ in under four hours.",
      hintAr: "سباق الماراثون.",
    },
    {
      word: "athlete",
      sentence: "Every ___ on the team practices six days a week.",
      hintAr: "الرياضي المحترف.",
    },
    { word: "whistle", sentence: "The coach blew his ___ to start practice.", hintAr: "الصافرة." },
  ],
  emotions: [
    { word: "happy", sentence: "She felt ___ when she saw her old friend.", hintAr: "سعيد." },
    { word: "sad", sentence: "He looked ___ after hearing the news.", hintAr: "حزين." },
    { word: "angry", sentence: "She got ___ when the flight was cancelled.", hintAr: "غاضب." },
    { word: "afraid", sentence: "The child was ___ of the dark.", hintAr: "خائف." },
    { word: "surprised", sentence: "I was ___ to see him at the party.", hintAr: "متفاجئ." },
    {
      word: "nervous",
      sentence: "She felt ___ before the job interview.",
      hintAr: "متوتر أو قلق.",
    },
    { word: "excited", sentence: "The kids were ___ about the trip.", hintAr: "متحمس." },
    {
      word: "bored",
      sentence: "He got ___ waiting at the station for an hour.",
      hintAr: "ضجران أو ملول.",
    },
    { word: "proud", sentence: "Her parents were ___ of her graduation.", hintAr: "فخور." },
    {
      word: "embarrassed",
      sentence: "He felt ___ after tripping in front of everyone.",
      hintAr: "محرج.",
    },
    {
      word: "confused",
      sentence: "I'm ___ about which bus to take.",
      hintAr: "مرتبك أو حائر.",
    },
    {
      word: "relieved",
      sentence: "She felt ___ when the test results came back normal.",
      hintAr: "مرتاح البال بعد قلق.",
    },
    { word: "anxious", sentence: "He felt ___ about the results of his test.", hintAr: "قلق." },
    { word: "calm", sentence: "Try to stay ___ during the interview.", hintAr: "هادئ." },
    {
      word: "frustrated",
      sentence: "He was ___ after losing his keys twice.",
      hintAr: "محبط أو منزعج.",
    },
    {
      word: "curious",
      sentence: "The child was ___ about how the toy worked.",
      hintAr: "فضولي.",
    },
    { word: "hopeful", sentence: "She remained ___ despite the bad news.", hintAr: "متفائل." },
    { word: "grateful", sentence: "I'm ___ for all your help this year.", hintAr: "ممتن." },
    {
      word: "disappointed",
      sentence: "He was ___ when the trip got cancelled.",
      hintAr: "خائب الأمل.",
    },
    { word: "confident", sentence: "She felt ___ walking into the exam.", hintAr: "واثق من نفسه." },
    {
      word: "overwhelmed",
      sentence: "He felt ___ by all the emails after vacation.",
      hintAr: "غارق بالمهام أو مرهق.",
    },
    { word: "terrified", sentence: "She was ___ of flying for years.", hintAr: "مرعوب." },
    {
      word: "ashamed",
      sentence: "He felt ___ after forgetting her birthday.",
      hintAr: "خجلان أو يشعر بالعار.",
    },
    {
      word: "cheerful",
      sentence: "The waiter was ___ even during the busy shift.",
      hintAr: "مرح أو بشوش.",
    },
    {
      word: "miserable",
      sentence: "He felt ___ stuck in traffic for two hours.",
      hintAr: "بائس أو تعيس.",
    },
  ],
  law: [
    {
      word: "lawsuit",
      sentence: "The company settled the ___ out of court.",
      hintAr: "الدعوى القضائية.",
    },
    {
      word: "verdict",
      sentence: "The jury reached a ___ after six hours.",
      hintAr: "الحكم أو القرار القضائي.",
    },
    {
      word: "evidence",
      sentence: "The lawyer presented new ___ to the court.",
      hintAr: "الدليل أو البينة.",
    },
    {
      word: "witness",
      sentence: "A ___ described exactly what happened that night.",
      hintAr: "الشاهد.",
    },
    {
      word: "defendant",
      sentence: "The ___ pleaded not guilty to the charge.",
      hintAr: "المتهم.",
    },
    {
      word: "plaintiff",
      sentence: "The ___ asked the court for full compensation.",
      hintAr: "المدعي.",
    },
    { word: "attorney", sentence: "She hired an ___ to review the contract.", hintAr: "المحامي." },
    { word: "jury", sentence: "Twelve people were chosen for the ___.", hintAr: "هيئة المحلفين." },
    {
      word: "contract",
      sentence: "Both sides signed the ___ yesterday afternoon.",
      hintAr: "العقد.",
    },
    {
      word: "clause",
      sentence: "A single ___ in the contract caused the whole dispute.",
      hintAr: "بند في عقد أو قانون.",
    },
    {
      word: "testimony",
      sentence: "Her ___ convinced the jury of his innocence.",
      hintAr: "الشهادة.",
    },
    {
      word: "custody",
      sentence: "The parents share ___ of their two children.",
      hintAr: "الحضانة أو الوصاية.",
    },
    {
      word: "felony",
      sentence: "He was charged with a ___ for the break-in.",
      hintAr: "جناية، جريمة كبرى.",
    },
    {
      word: "misdemeanor",
      sentence: "Shoplifting is usually treated as a ___.",
      hintAr: "جنحة، جريمة بسيطة.",
    },
    {
      word: "appeal",
      sentence: "Her lawyer plans to file an ___ next week.",
      hintAr: "الاستئناف.",
    },
    {
      word: "warrant",
      sentence: "Police obtained a ___ to search the house.",
      hintAr: "مذكرة قضائية.",
    },
    {
      word: "tribunal",
      sentence: "The case was referred to an international ___.",
      hintAr: "محكمة أو هيئة قضائية خاصة.",
    },
    {
      word: "arbitration",
      sentence: "The two companies settled the dispute through ___.",
      hintAr: "التحكيم.",
    },
    { word: "negligence", sentence: "The driver was found guilty of ___.", hintAr: "الإهمال." },
    {
      word: "settlement",
      sentence: "They reached a ___ before the trial began.",
      hintAr: "التسوية القضائية.",
    },
    {
      word: "plea",
      sentence: "He entered a guilty ___ in court today.",
      hintAr: "الإقرار أو الدفع القضائي.",
    },
    {
      word: "statute",
      sentence: "This ___ has been in effect since 1990.",
      hintAr: "القانون أو النص التشريعي.",
    },
    {
      word: "injunction",
      sentence: "The court issued an ___ to stop construction.",
      hintAr: "أمر قضائي بالمنع.",
    },
    {
      word: "prosecutor",
      sentence: "The ___ presented the case against him.",
      hintAr: "المدعي العام.",
    },
    {
      word: "acquit",
      sentence: "The jury voted to ___ him of all charges.",
      hintAr: "يبرّئ من التهمة.",
    },
  ],
  science: [
    {
      word: "hypothesis",
      sentence: "Her ___ turned out to be correct after the test.",
      hintAr: "الفرضية.",
    },
    {
      word: "experiment",
      sentence: "They ran the ___ three times to confirm the result.",
      hintAr: "التجربة العلمية.",
    },
    {
      word: "theory",
      sentence: "Scientists proposed a new ___ to explain the data.",
      hintAr: "النظرية.",
    },
    { word: "molecule", sentence: "Water is made of a simple ___ structure.", hintAr: "الجزيء." },
    { word: "gene", sentence: "A single ___ can affect eye color.", hintAr: "الجين الوراثي." },
    {
      word: "evolution",
      sentence: "The museum has an exhibit about human ___.",
      hintAr: "التطور.",
    },
    {
      word: "laboratory",
      sentence: "The samples were sent to a ___ for testing.",
      hintAr: "المختبر.",
    },
    {
      word: "observation",
      sentence: "The report is based on months of careful ___.",
      hintAr: "الملاحظة العلمية.",
    },
    { word: "variable", sentence: "Researchers changed one ___ at a time.", hintAr: "المتغير." },
    {
      word: "data",
      sentence: "The team collected ___ from over a thousand people.",
      hintAr: "البيانات.",
    },
    {
      word: "analysis",
      sentence: "The ___ showed a clear pattern in the results.",
      hintAr: "التحليل.",
    },
    {
      word: "chemical",
      sentence: "The factory uses several ___s in the process.",
      hintAr: "المادة الكيميائية.",
    },
    {
      word: "reaction",
      sentence: "The ___ produced a bright blue gas.",
      hintAr: "التفاعل الكيميائي.",
    },
    {
      word: "organism",
      sentence: "Every living ___ needs some form of energy.",
      hintAr: "الكائن الحي.",
    },
    {
      word: "bacteria",
      sentence: "The infection was caused by common ___.",
      hintAr: "البكتيريا.",
    },
    { word: "virus", sentence: "Scientists are studying how the ___ spreads.", hintAr: "الفيروس." },
    { word: "atom", sentence: "Every ___ contains a nucleus and electrons.", hintAr: "الذرة." },
    {
      word: "particle",
      sentence: "A tiny ___ of dust floated in the light.",
      hintAr: "الجسيم الدقيق.",
    },
    { word: "gravity", sentence: "___ pulls every object toward the ground.", hintAr: "الجاذبية." },
    {
      word: "velocity",
      sentence: "The car's ___ doubled in just ten seconds.",
      hintAr: "السرعة المتجهة.",
    },
    { word: "mass", sentence: "The scale measures the ___ of each sample.", hintAr: "الكتلة." },
    {
      word: "frequency",
      sentence: "The radio picks up signals at a certain ___.",
      hintAr: "التردد.",
    },
    {
      word: "magnetic",
      sentence: "The compass needle points toward the ___ north.",
      hintAr: "مغناطيسي.",
    },
    {
      word: "spectrum",
      sentence: "The prism split the light into a full ___.",
      hintAr: "الطيف الضوئي.",
    },
    {
      word: "equation",
      sentence: "She solved the ___ in under a minute.",
      hintAr: "المعادلة الرياضية.",
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
    status: "draft" as const,
  }));

  const { error: groupError } = await supabase
    .from("word_groups")
    .upsert(groupRows, { onConflict: "id", ignoreDuplicates: true });
  if (groupError) throw groupError;

  const wordRows = Object.entries(WORDS).flatMap(([groupId, words]) =>
    words.map((w, index) => ({
      id: `${groupId}-${w.word.replace(/\s+/g, "-")}`,
      group_id: groupId,
      order_index: index + 1,
      target_word: w.word,
      sentence: w.sentence,
      hint_ar: w.hintAr,
    })),
  );

  const { error: wordsError } = await supabase
    .from("vocabulary_words")
    .upsert(wordRows, { onConflict: "id", ignoreDuplicates: true });
  if (wordsError) throw wordsError;

  console.log(
    `Inserted/confirmed ${groupRows.length} draft word_groups and ${wordRows.length} vocabulary_words.`,
  );
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
