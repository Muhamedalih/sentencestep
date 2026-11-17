/**
 * Three new emotional Stories lessons (story-211..213), one per level, none repeating a theme or a
 * story already in Stories or Daily Lessons. Inserted as DRAFT + premium, so only an admin sees them,
 * with `voice_generation_excluded` on so the Cartesia/ElevenLabs cron never narrates them.
 *
 *   npx tsx --env-file=.env.local scripts/insert-emotional-stories.ts          (dry run)
 *   npx tsx --env-file=.env.local scripts/insert-emotional-stories.ts --apply  (writes)
 *
 * Re-runnable: a lesson that already exists is left alone.
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";
import { ES, TR } from "./emotional-stories-translations";

const CHRISTOPHER = "elevenlabs-ssfu0elfp3qeur4j2bwd";
const JESSA = "elevenlabs-https-elevenlabs-io-voices-yj30vwtgjxshezdagsv9";

// stories-mode level ids (same as scripts/insert-stories-series.ts)
const LEVEL_ID: Record<1 | 2 | 3, string> = {
  1: "420c7cc5-d17c-4862-858e-73e5ddbbb07d",
  2: "ae3a34f5-14bf-427f-b9b3-78ac7702842e",
  3: "e6bf826a-a0e4-4da4-81d4-5cca26c51463",
};

interface S {
  en: string;
  ar: string;
  /** One Arabic gloss per English token (split on spaces), joined by "|". */
  w: string;
}

interface L {
  id: string;
  level: 1 | 2 | 3;
  order: number;
  voiceId: string;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  sentences: S[];
}

export const emotionalStories: L[] = [
  {
    id: "story-211",
    level: 1,
    order: 213,
    voiceId: JESSA,
    title: "Mama's Tired Hands",
    titleAr: "يدا ماما المتعبتان",
    desc: "After a long day, a little boy finds a way to say thank you",
    descAr: "بعد يوم طويل، يجد صبي صغير طريقته ليقول شكراً",
    sentences: [
      {
        en: "Mama came home from work very late",
        ar: "جاءت ماما إلى البيت متأخرة جداً من العمل.",
        w: "ماما|جاءت|للبيت|من|العمل|جداً|متأخراً",
      },
      {
        en: "Her hands were red and tired",
        ar: "كانت يداها حمراوين ومتعبتين.",
        w: "لها|يدان|كانتا|حمراوين|و|متعبتين",
      },
      {
        en: "She started to wash the dishes slowly",
        ar: "بدأت تغسل الصحون ببطء.",
        w: "هي|بدأت|أن|تغسل|ال|صحون|ببطء",
      },
      {
        en: '"Mama, sit down," said little Tom',
        ar: "قال الصغير توم: «ماما، اجلسي».",
        w: "ماما|اجلسي|إلى أسفل|قال|الصغير|توم",
      },
      {
        en: "He washed every cup and every plate by himself",
        ar: "غسل كل فنجان وكل صحن بنفسه.",
        w: "هو|غسل|كل|فنجان|و|كل|صحن|بـ|نفسه",
      },
      {
        en: "Then he kissed her tired hands",
        ar: "ثم قبّل يديها المتعبتين.",
        w: "ثم|هو|قبّل|لها|متعبتين|يدين",
      },
      {
        en: '"These hands work all day for me," he whispered',
        ar: "همس: «هاتان اليدان تعملان طوال اليوم من أجلي».",
        w: "هذه|اليدان|تعمل|طوال|اليوم|من أجل|أنا|هو|همس",
      },
      {
        en: 'Mama cried and said, "Now they are the happiest hands in the world."',
        ar: "بكت ماما وقالت: «الآن هما أسعد يدين في العالم».",
        w: "ماما|بكت|و|قالت|الآن|هما|تكونان|ال|أسعد|يدين|في|ال|عالم",
      },
    ],
  },
  {
    id: "story-212",
    level: 2,
    order: 214,
    voiceId: CHRISTOPHER,
    title: "The Dog Ate the Ring",
    titleAr: "الكلب أكل الخاتم",
    desc: "He planned the perfect proposal, and his dog had other plans",
    descAr: "خطط لطلب زواج مثالي، وكان لكلبه خطط أخرى",
    sentences: [
      {
        en: "I practiced my proposal for a month in front of my dog, Max",
        ar: "تدربت على طلب الزواج شهراً كاملاً أمام كلبي ماكس.",
        w: "أنا|تدربت|على|طلب الزواج|لمدة|واحد|شهر|في|أمام|من|لي|كلب|ماكس",
      },
      {
        en: "On Friday, I left the ring box on the table for one minute",
        ar: "يوم الجمعة تركت علبة الخاتم على الطاولة لدقيقة واحدة.",
        w: "في|الجمعة|أنا|تركت|ال|خاتم|علبة|على|ال|طاولة|لمدة|واحدة|دقيقة",
      },
      {
        en: "When I came back, the box was empty and Max looked guilty",
        ar: "حين عدت كانت العلبة فارغة وبدا ماكس مذنباً.",
        w: "عندما|أنا|عدت|للخلف|ال|علبة|كانت|فارغة|و|ماكس|بدا|مذنباً",
      },
      {
        en: "I rushed to the vet, and Lina came with me, very worried",
        ar: "أسرعت إلى الطبيب البيطري، وجاءت لينا معي قلقة جداً.",
        w: "أنا|أسرعت|إلى|ال|بيطري|و|لينا|جاءت|مع|أنا|جداً|قلقة",
      },
      {
        en: "The doctor showed us an X-ray with a tiny ring inside Max",
        ar: "أرانا الطبيب صورة أشعة فيها خاتم صغير داخل ماكس.",
        w: "ال|طبيب|أرانا|لنا|صورة|أشعة سينية|فيها|واحد|صغير|خاتم|داخل|ماكس",
      },
      {
        en: "Lina laughed so hard that she had to sit down",
        ar: "ضحكت لينا بشدة حتى اضطرت أن تجلس.",
        w: "لينا|ضحكت|جداً|بشدة|لدرجة أن|هي|اضطرت|أن|تجلس|إلى أسفل",
      },
      {
        en: '"I wanted a perfect moment," I said, "but the ring is inside the dog."',
        ar: "قلت: «أردت لحظة مثالية، لكن الخاتم داخل الكلب».",
        w: "أنا|أردت|واحدة|مثالية|لحظة|أنا|قلت|لكن|ال|خاتم|يكون|داخل|ال|كلب",
      },
      {
        en: 'She wiped her tears and said, "Ask me anyway."',
        ar: "مسحت دموعها وقالت: «اسألني على أي حال».",
        w: "هي|مسحت|لها|دموع|و|قالت|اسأل|أنا|على أي حال",
      },
      {
        en: "In a waiting room full of cats, I knelt down and asked, and she said yes",
        ar: "في غرفة انتظار مليئة بالقطط ركعت وسألتها، فقالت نعم.",
        w: "في|ال|انتظار|غرفة|مليئة|من|قطط|أنا|ركعت|إلى أسفل|و|سألت|و|هي|قالت|نعم",
      },
    ],
  },
  {
    id: "story-213",
    level: 3,
    order: 215,
    voiceId: JESSA,
    title: "My Mother's Four Words",
    titleAr: "كلمات أمي الأربع",
    desc: "She never learned English, until the day her daughter graduated",
    descAr: "لم تتعلم الإنجليزية قط، حتى يوم تخرّج ابنتها",
    sentences: [
      {
        en: "My mother never learned English, because she worked two jobs to raise me",
        ar: "لم تتعلم أمي الإنجليزية قط، لأنها عملت في وظيفتين لتربيني.",
        w: "لي|أم|أبداً|تعلمت|الإنجليزية|لأن|هي|عملت|اثنتين|وظائف|لـ|تربي|أنا",
      },
      {
        en: "She cleaned offices at night and never once complained",
        ar: "كانت تنظف المكاتب ليلاً ولم تشتكِ ولو مرة.",
        w: "هي|نظفت|مكاتب|في|الليل|و|أبداً|مرة|اشتكت",
      },
      {
        en: "On my graduation day, she sat in the back row in her best dress",
        ar: "في يوم تخرجي جلست في الصف الأخير بأجمل فستان لديها.",
        w: "في|لي|تخرج|يوم|هي|جلست|في|ال|الخلفي|صف|في|لها|أفضل|فستان",
      },
      {
        en: "When they called my name, she stood up before everyone else",
        ar: "وحين نادوا اسمي وقفت قبل الجميع.",
        w: "عندما|هم|نادوا|لي|اسم|هي|وقفت|للأعلى|قبل|الجميع|الآخرين",
      },
      {
        en: "Afterward, she took my face in her hands and spoke slowly",
        ar: "بعد ذلك أخذت وجهي بين يديها وتكلمت ببطء.",
        w: "بعد ذلك|هي|أخذت|لي|وجه|في|لها|يدين|و|تكلمت|ببطء",
      },
      {
        en: '"I\'m proud of you," she said in careful, practiced English',
        ar: "«أنا فخورة بك»، قالتها بإنجليزية حذرة ومتمرَّنة.",
        w: "أنا|فخورة|ب|ك|هي|قالت|ب|حذرة|متمرنة|إنجليزية",
      },
      {
        en: "She had practiced those four words for months, alone, on the bus",
        ar: "كانت تتدرب على هذه الكلمات الأربع شهوراً، وحدها، في الحافلة.",
        w: "هي|كانت|تدربت|تلك|أربع|كلمات|لمدة|أشهر|وحدها|على|ال|الحافلة",
      },
      {
        en: "I had waited my whole life to hear them, in any language",
        ar: "انتظرت طوال حياتي أن أسمعها، بأي لغة كانت.",
        w: "أنا|كنت|انتظرت|لي|كل|حياة|لـ|أسمع|هم|في|أي|لغة",
      },
      {
        en: "I cried because she worked harder for those four words than I did for my degree",
        ar: "بكيت، لأنها تعبت من أجل هذه الكلمات الأربع أكثر مما تعبت أنا من أجل شهادتي.",
        w: "أنا|بكيت|لأن|هي|عملت|أكثر جهداً|من أجل|تلك|أربع|كلمات|من|أنا|فعلت|من أجل|لي|شهادة",
      },
    ],
  },
];

export function validate(lessons: L[]): string[] {
  const problems: string[] = [];
  for (const lesson of lessons) {
    if (lesson.sentences.length < 7 || lesson.sentences.length > 9) {
      problems.push(`${lesson.id}: ${lesson.sentences.length} sentences`);
    }
    for (const [i, s] of lesson.sentences.entries()) {
      const tokens = s.en.split(" ").length;
      const glosses = s.w.split("|").length;
      if (tokens !== glosses)
        problems.push(`${lesson.id}-s${i + 1}: ${tokens} words, ${glosses} glosses`);
      for (const [name, table] of [
        ["es", ES],
        ["tr", TR],
      ] as const) {
        const row = table[lesson.id]?.s[i];
        if (!row) {
          problems.push(`${lesson.id}-s${i + 1}: missing ${name}`);
          continue;
        }
        const n = row[1].split("|").length;
        if (n !== tokens)
          problems.push(`${lesson.id}-s${i + 1} ${name}: ${n} glosses for ${tokens} words`);
      }
    }
  }
  return problems;
}

async function main() {
  const problems = validate(emotionalStories);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  for (const l of emotionalStories) {
    const words = l.sentences.map((s) => s.en.split(" ").length);
    console.log(
      `${l.id} L${l.level} "${l.title}" ${l.sentences.length} sentences, avg ${(words.reduce((a, b) => a + b, 0) / words.length).toFixed(1)} words`,
    );
  }
  if (!process.argv.includes("--apply")) {
    console.log("\nDry run only. Add --apply to write.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = () => new Date().toISOString();

  for (const lesson of emotionalStories) {
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lesson.id)
      .maybeSingle();
    if (existing) {
      console.log(`${lesson.id} already exists, left alone.`);
      continue;
    }
    const { error: lessonError } = await supabase.from("lessons").insert({
      id: lesson.id,
      mode: "stories",
      level_id: LEVEL_ID[lesson.level],
      order_index: lesson.order,
      title: lesson.title,
      title_ar: lesson.titleAr,
      description: lesson.desc,
      description_ar: lesson.descAr,
      is_free: false,
      status: "draft",
      voice_id: lesson.voiceId,
      voice_generation_excluded: true,
      created_at: now(),
      updated_at: now(),
    });
    if (lessonError) throw new Error(`lesson ${lesson.id}: ${lessonError.message}`);

    const rows = lesson.sentences.map((s, i) => {
      const tokens = s.en.split(" ");
      const glosses = s.w.split("|");
      return {
        id: `${lesson.id}-s${i + 1}`,
        lesson_id: lesson.id,
        order_index: i + 1,
        en: s.en,
        ar: s.ar,
        speaker: null,
        audio_url: null,
        word_translations: tokens.map((en, k) => ({ en, ar: glosses[k]! })),
        created_at: now(),
        updated_at: now(),
      };
    });
    const { error: sentenceError } = await supabase.from("sentences").insert(rows);
    if (sentenceError) throw new Error(`sentences ${lesson.id}: ${sentenceError.message}`);
    const upsert = async (
      locale: "es" | "tr",
      contentType: "lesson" | "sentence",
      contentId: string,
      field: string,
      value: unknown,
      source: string,
    ) => {
      const { error } = await supabase.from("content_translations").upsert(
        {
          content_type: contentType,
          content_id: contentId,
          field,
          locale,
          value: value as never,
          status: "approved",
          is_stale: false,
          source_snapshot: source,
          previous_value: null,
          updated_at: now(),
        },
        { onConflict: "content_type,content_id,field,locale" },
      );
      if (error) throw new Error(`translation ${contentId}/${field}/${locale}: ${error.message}`);
    };
    for (const [locale, table] of [
      ["es", ES],
      ["tr", TR],
    ] as const) {
      const tr = table[lesson.id]!;
      await upsert(locale, "lesson", lesson.id, "title", tr.title, lesson.title);
      await upsert(locale, "lesson", lesson.id, "description", tr.desc, lesson.desc);
      for (const [i, [text, glosses]] of tr.s.entries()) {
        const id = rows[i]!.id;
        const en = lesson.sentences[i]!.en;
        await upsert(locale, "sentence", id, "text", text, en);
        const g = glosses.split("|");
        await upsert(
          locale,
          "sentence",
          id,
          "word_translations",
          en.split(" ").map((token, k) => ({ en: token, text: g[k]! })),
          en,
        );
      }
    }
    console.log(`${lesson.id} inserted (draft, premium, with ES/TR).`);
  }
}

if (process.argv[1] && /insert-emotional-stories/.test(process.argv[1])) {
  main().catch((error) => {
    console.error("FAILED:", error);
    process.exit(1);
  });
}
