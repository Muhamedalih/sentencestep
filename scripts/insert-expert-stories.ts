/**
 * Adds Stories level 4 ("Hidden Gems", Expert / C1) and its first ten lessons (story-214..223).
 * Every lesson goes in as DRAFT + premium (visible to admins only) with `voice_generation_excluded`
 * on, so no cron ever narrates it: the owner narrates and publishes from the admin pages.
 * Arabic, Spanish and Turkish are written for every title, description, sentence and word.
 *
 *   npx tsx --env-file=.env.local scripts/insert-expert-stories.ts          (dry run: validates + prints)
 *   npx tsx --env-file=.env.local scripts/insert-expert-stories.ts --apply  (writes the level + lessons)
 *
 * Re-runnable: a level or lesson that already exists is left alone, and nothing existing is ever updated.
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";
import { expertStories, type ExpertStory } from "./expert-stories-content";

const CHRISTOPHER = "elevenlabs-ssfu0elfp3qeur4j2bwd";
const JESSA = "elevenlabs-https-elevenlabs-io-voices-yj30vwtgjxshezdagsv9";

const LEVEL = {
  index: 4,
  title: "Hidden Gems",
  titleAr: "جواهر مخبّأة",
  titleEs: "Joyas Escondidas",
  titleTr: "Gizli Hazineler",
};

const MAX_SENTENCES = 9;
const MIN_SENTENCES = 7;
const MAX_WORDS_PER_SENTENCE = 16;

function stripPunctuation(word: string): string {
  return word.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "").replace(/'s$/i, "");
}

export function validate(stories: ExpertStory[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const story of stories) {
    if (ids.has(story.id)) problems.push(`${story.id}: duplicate id`);
    ids.add(story.id);
    if (orders.has(story.order)) problems.push(`${story.id}: duplicate order ${story.order}`);
    orders.add(story.order);
    if (story.sentences.length < MIN_SENTENCES || story.sentences.length > MAX_SENTENCES) {
      problems.push(`${story.id}: ${story.sentences.length} sentences`);
    }
    for (const field of [
      "title",
      "titleAr",
      "titleEs",
      "titleTr",
      "desc",
      "descAr",
      "descEs",
      "descTr",
    ] as const) {
      if (!story[field].trim()) problems.push(`${story.id}: empty ${field}`);
    }
    const seenWords = new Set<string>();
    story.sentences.forEach((sentence, i) => {
      const label = `${story.id}-s${i + 1}`;
      const words = sentence.en.split(" ");
      if (words.length > MAX_WORDS_PER_SENTENCE) problems.push(`${label}: ${words.length} words`);
      if (words.length !== sentence.tokens.length) problems.push(`${label}: token mismatch`);
      for (const field of ["ar", "es", "tr"] as const) {
        if (!sentence[field].trim()) problems.push(`${label}: empty ${field} sentence`);
      }
      for (const token of sentence.tokens) {
        for (const field of ["ar", "es", "tr"] as const) {
          if (!token[field]) problems.push(`${label}: "${token.en}" has no ${field} gloss`);
        }
        seenWords.add(stripPunctuation(token.en).toLowerCase());
      }
    });
    if (story.targets.length < 2 || story.targets.length > 3) {
      problems.push(`${story.id}: ${story.targets.length} target words`);
    }
    for (const target of story.targets) {
      if (!seenWords.has(target.en.toLowerCase())) {
        problems.push(`${story.id}: target "${target.en}" is not a word of the story`);
      }
    }
  }
  return problems;
}

async function main() {
  const problems = validate(expertStories);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  for (const story of expertStories) {
    const counts = story.sentences.map((s) => s.en.split(" ").length);
    const total = counts.reduce((a, b) => a + b, 0);
    console.log(
      `${story.id} "${story.title}" ${story.sentences.length} sentences, ${total} words, avg ${(total / counts.length).toFixed(1)}, max ${Math.max(...counts)}; targets: ${story.targets.map((t) => t.en).join(", ")}`,
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

  const translate = async (
    locale: "ar" | "es" | "tr",
    contentType: "level" | "lesson" | "sentence",
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

  // 1. The level.
  let { data: level } = await supabase
    .from("levels")
    .select("id")
    .eq("mode", "stories")
    .eq("index", LEVEL.index)
    .maybeSingle();
  if (level) {
    console.log(`level ${LEVEL.index} already exists (${level.id}), left alone.`);
  } else {
    const { data, error } = await supabase
      .from("levels")
      .insert({
        mode: "stories",
        index: LEVEL.index,
        title: LEVEL.title,
        title_ar: LEVEL.titleAr,
      })
      .select("id")
      .single();
    if (error) throw new Error(`level: ${error.message}`);
    level = data;
    await translate("ar", "level", level.id, "title", LEVEL.titleAr, LEVEL.title);
    await translate("es", "level", level.id, "title", LEVEL.titleEs, LEVEL.title);
    await translate("tr", "level", level.id, "title", LEVEL.titleTr, LEVEL.title);
    console.log(`level ${LEVEL.index} created (${level.id}).`);
  }

  // 2. The lessons (draft, premium, never narrated by a cron).
  for (const story of expertStories) {
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", story.id)
      .maybeSingle();
    if (existing) {
      console.log(`${story.id} already exists, left alone.`);
      continue;
    }
    const { error: lessonError } = await supabase.from("lessons").insert({
      id: story.id,
      mode: "stories",
      level_id: level.id,
      order_index: story.order,
      title: story.title,
      title_ar: story.titleAr,
      description: story.desc,
      description_ar: story.descAr,
      is_free: false,
      status: "draft",
      voice_id: story.narrator === "male" ? CHRISTOPHER : JESSA,
      voice_generation_excluded: true,
      created_at: now(),
      updated_at: now(),
    });
    if (lessonError) throw new Error(`lesson ${story.id}: ${lessonError.message}`);

    const rows = story.sentences.map((sentence, i) => ({
      id: `${story.id}-s${i + 1}`,
      lesson_id: story.id,
      order_index: i + 1,
      en: sentence.en,
      ar: sentence.ar,
      speaker: null,
      audio_url: null,
      word_translations: sentence.tokens.map((t) => ({ en: t.en, ar: t.ar })),
      created_at: now(),
      updated_at: now(),
    }));
    const { error: sentenceError } = await supabase.from("sentences").insert(rows);
    if (sentenceError) throw new Error(`sentences ${story.id}: ${sentenceError.message}`);

    for (const locale of ["es", "tr"] as const) {
      const title = locale === "es" ? story.titleEs : story.titleTr;
      const desc = locale === "es" ? story.descEs : story.descTr;
      await translate(locale, "lesson", story.id, "title", title, story.title);
      await translate(locale, "lesson", story.id, "description", desc, story.desc);
      for (const [i, sentence] of story.sentences.entries()) {
        const id = rows[i]!.id;
        await translate(locale, "sentence", id, "text", sentence[locale], sentence.en);
        await translate(
          locale,
          "sentence",
          id,
          "word_translations",
          sentence.tokens.map((t) => ({ en: t.en, text: t[locale] })),
          sentence.en,
        );
      }
    }
    console.log(`${story.id} inserted (draft, premium, with ES/TR).`);
  }
}

if (process.argv[1] && /insert-expert-stories/.test(process.argv[1])) {
  main().catch((error) => {
    console.error("FAILED:", error);
    process.exit(1);
  });
}
