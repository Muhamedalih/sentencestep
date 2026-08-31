/**
 * Tops up existing Word Lists groups with more words where the topic
 * genuinely supports it — never past 30 per group (see the user's own cap).
 * Health/Food/Animals get +10 (→30): naturally huge everyday domains, the
 * clearest examples. Every other group gets +5 (→25), a modest top-up
 * rather than padding — Colors/Weather included, since even a "narrow"
 * domain has a handful more genuinely common words worth adding.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-word-lists-topup.ts
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

interface WordSeed {
  word: string;
  sentence: string;
  hintAr: string;
}

// Each group's NEW words only, starting at order_index 21 — existing 1-20 rows are untouched.
const TOPUP: Record<string, WordSeed[]> = {
  health: [
    { word: "doctor", sentence: "The ___ checked his blood pressure twice.", hintAr: "الطبيب." },
    {
      word: "nurse",
      sentence: "A kind ___ helped her find the right room.",
      hintAr: "الممرض/الممرضة.",
    },
    {
      word: "hospital",
      sentence: "They rushed him to the ___ after the accident.",
      hintAr: "المستشفى.",
    },
    { word: "medicine", sentence: "Take this ___ twice a day with food.", hintAr: "الدواء." },
    {
      word: "headache",
      sentence: "She had a bad ___ after staring at the screen all day.",
      hintAr: "الصداع.",
    },
    {
      word: "vaccine",
      sentence: "The clinic offers a free flu ___ every fall.",
      hintAr: "اللقاح.",
    },
    { word: "surgery", sentence: "He needs ___ to fix his knee.", hintAr: "الجراحة." },
    {
      word: "pharmacy",
      sentence: "I picked up my prescription from the ___.",
      hintAr: "الصيدلية.",
    },
    { word: "patient", sentence: "The doctor saw every ___ on time today.", hintAr: "المريض." },
    {
      word: "emergency",
      sentence: "Call an ambulance, this is an ___.",
      hintAr: "الحالة الطارئة.",
    },
  ],
  food: [
    { word: "soup", sentence: "She made a warm ___ for the cold night.", hintAr: "الشوربة." },
    { word: "salad", sentence: "He orders a fresh ___ with almost every meal.", hintAr: "السلطة." },
    {
      word: "coffee",
      sentence: "I can't start my morning without a cup of ___.",
      hintAr: "القهوة.",
    },
    { word: "juice", sentence: "She squeezed fresh orange ___ for breakfast.", hintAr: "العصير." },
    {
      word: "snack",
      sentence: "He grabbed a quick ___ before the meeting.",
      hintAr: "الوجبة الخفيفة.",
    },
    { word: "dessert", sentence: "We shared a chocolate ___ after dinner.", hintAr: "الحلوى." },
    { word: "oven", sentence: "Put the bread in the ___ for twenty minutes.", hintAr: "الفرن." },
    { word: "boil", sentence: "Let the water ___ before adding the pasta.", hintAr: "يغلي." },
    {
      word: "grocery",
      sentence: "I need to do the ___ shopping this weekend.",
      hintAr: "البقالة.",
    },
    { word: "appetite", sentence: "A long walk always gives me a big ___.", hintAr: "الشهية." },
  ],
  animals: [
    { word: "whale", sentence: "A ___ surfaced near the boat for a moment.", hintAr: "الحوت." },
    {
      word: "dolphin",
      sentence: "A ___ jumped out of the water beside the ship.",
      hintAr: "الدلفين.",
    },
    {
      word: "shark",
      sentence: "Swimmers were warned about a ___ near the beach.",
      hintAr: "سمك القرش.",
    },
    {
      word: "snake",
      sentence: "A ___ was sleeping under a rock in the garden.",
      hintAr: "الثعبان.",
    },
    { word: "frog", sentence: "A small ___ jumped across the wet path.", hintAr: "الضفدع." },
    { word: "bee", sentence: "A ___ landed on the flower near the window.", hintAr: "النحلة." },
    { word: "owl", sentence: "An ___ called out somewhere in the dark forest.", hintAr: "البومة." },
    { word: "eagle", sentence: "An ___ circled slowly above the mountain.", hintAr: "النسر." },
    { word: "camel", sentence: "A ___ can go for days without drinking water.", hintAr: "الجمل." },
    {
      word: "giraffe",
      sentence: "The ___ stretched its neck to reach the leaves.",
      hintAr: "الزرافة.",
    },
  ],
  family: [
    {
      word: "spouse",
      sentence: "Please bring your ___ to the company dinner.",
      hintAr: "الزوج أو الزوجة.",
    },
    { word: "widow", sentence: "She became a ___ at a young age.", hintAr: "الأرملة." },
    {
      word: "orphan",
      sentence: "The charity supports every ___ in the village.",
      hintAr: "اليتيم.",
    },
    {
      word: "guardian",
      sentence: "Her uncle became her legal ___ after the accident.",
      hintAr: "الوصي.",
    },
    { word: "fiance", sentence: "She introduced her ___ to the whole family.", hintAr: "الخطيب." },
  ],
  house: [
    { word: "apartment", sentence: "They just moved into a small ___ downtown.", hintAr: "الشقة." },
    { word: "furniture", sentence: "All the ___ arrived a week late.", hintAr: "الأثاث." },
    {
      word: "balcony",
      sentence: "We drink coffee on the ___ every morning.",
      hintAr: "الشرفة/البلكونة.",
    },
    { word: "rent", sentence: "The ___ goes up a little every year here.", hintAr: "الإيجار." },
    {
      word: "landlord",
      sentence: "Our ___ finally fixed the broken heater.",
      hintAr: "المؤجر/صاحب العقار.",
    },
  ],
  clothes: [
    { word: "sweater", sentence: "Put on a ___, it's chilly tonight.", hintAr: "السترة الصوفية." },
    {
      word: "jeans",
      sentence: "He wears the same pair of ___ almost every day.",
      hintAr: "الجينز.",
    },
    { word: "suit", sentence: "He wore a dark ___ to the interview.", hintAr: "البدلة." },
    {
      word: "boots",
      sentence: "Her ___ were still muddy from the hike.",
      hintAr: "الحذاء الطويل.",
    },
    {
      word: "sunglasses",
      sentence: "She forgot her ___ at the beach again.",
      hintAr: "النظارة الشمسية.",
    },
  ],
  friendship: [
    {
      word: "kindness",
      sentence: "Her ___ made a hard week much easier.",
      hintAr: "اللطف/الطيبة.",
    },
    { word: "respect", sentence: "Real friendship is built on mutual ___.", hintAr: "الاحترام." },
    {
      word: "encourage",
      sentence: "A good friend will always ___ you to try again.",
      hintAr: "يشجّع.",
    },
    {
      word: "confide",
      sentence: "She likes to ___ in her oldest friend.",
      hintAr: "يبوح بسر لشخص يثق به.",
    },
    {
      word: "rivalry",
      sentence: "Their friendly ___ pushed them both to improve.",
      hintAr: "التنافس.",
    },
  ],
  shopping: [
    {
      word: "mall",
      sentence: "We spent the whole afternoon at the ___.",
      hintAr: "المركز التجاري.",
    },
    { word: "coupon", sentence: "She used a ___ to get ten percent off.", hintAr: "قسيمة الخصم." },
    {
      word: "brand",
      sentence: "He only buys one ___ of running shoes.",
      hintAr: "العلامة التجارية.",
    },
    {
      word: "quality",
      sentence: "The ___ of this jacket is really good for the price.",
      hintAr: "الجودة.",
    },
    {
      word: "checkout",
      sentence: "The line at the ___ was too long today.",
      hintAr: "منطقة الدفع.",
    },
  ],
  weather: [
    { word: "hail", sentence: "___ damaged several cars parked outside.", hintAr: "البرَد." },
    {
      word: "drizzle",
      sentence: "A light ___ started as we left the house.",
      hintAr: "رذاذ المطر الخفيف.",
    },
    { word: "heatwave", sentence: "A ___ hit the city for almost a week.", hintAr: "موجة الحر." },
    {
      word: "overcast",
      sentence: "The sky stayed ___ the whole afternoon.",
      hintAr: "غائم بالكامل.",
    },
    { word: "mild", sentence: "The weather has been ___ for this time of year.", hintAr: "معتدل." },
  ],
  work: [
    {
      word: "career",
      sentence: "She's building a solid ___ in design.",
      hintAr: "المسيرة المهنية.",
    },
    { word: "training", sentence: "New employees get a week of ___.", hintAr: "التدريب." },
    {
      word: "workplace",
      sentence: "The company improved safety across the whole ___.",
      hintAr: "مكان العمل.",
    },
    { word: "manager", sentence: "Her ___ approved the new schedule.", hintAr: "المدير المباشر." },
    { word: "vacation", sentence: "He's taking a two-week ___ in August.", hintAr: "الإجازة." },
  ],
  politics: [
    { word: "government", sentence: "The ___ announced new tax rules today.", hintAr: "الحكومة." },
    { word: "president", sentence: "The ___ gave a speech last night.", hintAr: "الرئيس." },
    { word: "election", sentence: "The next ___ is scheduled for spring.", hintAr: "الانتخابات." },
    { word: "vote", sentence: "Millions of people will ___ this weekend.", hintAr: "يصوّت." },
    {
      word: "parliament",
      sentence: "The bill was approved by ___ yesterday.",
      hintAr: "البرلمان.",
    },
  ],
  finance: [
    { word: "loan", sentence: "They took out a ___ to buy the car.", hintAr: "القرض." },
    { word: "debt", sentence: "It took him years to pay off his ___.", hintAr: "الدَّين." },
    { word: "savings", sentence: "She keeps her ___ in a separate account.", hintAr: "المدخرات." },
    { word: "credit", sentence: "He paid for the flight using ___.", hintAr: "الائتمان." },
    { word: "profit", sentence: "The store made a small ___ this quarter.", hintAr: "الربح." },
  ],
  technology: [
    { word: "password", sentence: "Don't share your ___ with anyone.", hintAr: "كلمة المرور." },
    { word: "software", sentence: "The company released new ___ last week.", hintAr: "البرمجيات." },
    { word: "device", sentence: "Charge your ___ before the trip.", hintAr: "الجهاز." },
    {
      word: "internet",
      sentence: "The ___ went down for an hour this morning.",
      hintAr: "الإنترنت.",
    },
    {
      word: "download",
      sentence: "It took a while to ___ the whole file.",
      hintAr: "يُنزّل (ملف).",
    },
  ],
  environment: [
    {
      word: "wildlife",
      sentence: "The reserve protects ___ across a huge area.",
      hintAr: "الحياة البرية.",
    },
    {
      word: "habitat",
      sentence: "Cutting down trees destroys the animals' ___.",
      hintAr: "الموطن الطبيعي.",
    },
    {
      word: "deforestation",
      sentence: "___ has slowed down in the region this year.",
      hintAr: "إزالة الغابات.",
    },
    { word: "solar", sentence: "They installed ___ panels on the roof.", hintAr: "شمسي." },
    { word: "landfill", sentence: "Most of this waste ends up in a ___.", hintAr: "مكب النفايات." },
  ],
  education: [
    {
      word: "textbook",
      sentence: "She forgot her math ___ at home again.",
      hintAr: "الكتاب المدرسي.",
    },
    { word: "homework", sentence: "He finished his ___ before dinner.", hintAr: "الواجب المنزلي." },
    {
      word: "quiz",
      sentence: "We have a short ___ at the start of class.",
      hintAr: "اختبار قصير.",
    },
    {
      word: "campus",
      sentence: "The ___ was quiet during the summer break.",
      hintAr: "الحرم الجامعي.",
    },
    {
      word: "tutor",
      sentence: "A private ___ helped her improve her grades.",
      hintAr: "المدرّس الخاص.",
    },
  ],
  media: [
    { word: "podcast", sentence: "She listens to a news ___ every morning.", hintAr: "البودكاست." },
    { word: "blog", sentence: "He writes a travel ___ in his free time.", hintAr: "المدونة." },
    { word: "editor", sentence: "The ___ cut the article down by half.", hintAr: "المحرر." },
    { word: "trending", sentence: "The video has been ___ all week.", hintAr: "رائج/متصدر." },
    {
      word: "hashtag",
      sentence: "The campaign used a simple ___ to spread the message.",
      hintAr: "الهاشتاغ.",
    },
  ],
  travel: [
    { word: "airport", sentence: "We arrived at the ___ two hours early.", hintAr: "المطار." },
    { word: "flight", sentence: "Our ___ was delayed by an hour.", hintAr: "الرحلة الجوية." },
    { word: "hotel", sentence: "The ___ was right next to the beach.", hintAr: "الفندق." },
    { word: "tourist", sentence: "The old town is full of ___s in summer.", hintAr: "السائح." },
    { word: "map", sentence: "She checked the ___ before leaving the hotel.", hintAr: "الخريطة." },
  ],
  colors: [
    { word: "navy", sentence: "He wore a ___ blazer to the wedding.", hintAr: "كحلي (أزرق داكن)." },
    { word: "teal", sentence: "The walls were painted a calm ___.", hintAr: "أزرق مخضر." },
    { word: "coral", sentence: "Her dress was a soft ___ color.", hintAr: "لون مرجاني." },
    { word: "ivory", sentence: "The invitation card was printed on ___ paper.", hintAr: "عاجي." },
    { word: "bronze", sentence: "She won the ___ medal in the race.", hintAr: "برونزي." },
  ],
};

async function main() {
  const wordRows = Object.entries(TOPUP).flatMap(([groupId, words]) =>
    words.map((w, index) => ({
      id: `${groupId}-${w.word.replace(/\s+/g, "-")}`,
      group_id: groupId,
      order_index: 21 + index,
      target_word: w.word,
      sentence: w.sentence,
      hint_ar: w.hintAr,
    })),
  );

  const { error } = await supabase
    .from("vocabulary_words")
    .upsert(wordRows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  console.log(
    `Inserted/confirmed ${wordRows.length} top-up vocabulary_words across ${Object.keys(TOPUP).length} groups.`,
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
