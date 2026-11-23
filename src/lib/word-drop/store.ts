import { createClient } from "@/lib/supabase/server";

import type { DailyScoreInput } from "./scores";

/**
 * Reads and writes of the Word Drop daily challenge (see 20250361000000_word_drop_daily.sql). Session
 * aware client throughout: RLS limits the write to the caller's own row, and the two read functions
 * hand back aggregates only. Every caller treats a failure as "no ranking" (the functions do not exist
 * on a project that has not applied the migration): a missing optional feature must never take the
 * game down.
 */

/** One country on the day's board. */
export interface CountryStanding {
  country: string;
  players: number;
  average: number;
}

/** The caller's own place among the players of their level that day. */
export interface MyPlace {
  best: number;
  rank: number;
  total: number;
}

export interface DailyBoard {
  countries: CountryStanding[];
  mine: MyPlace | null;
}

export async function recordDailyScore(
  input: DailyScoreInput,
  country: string | null,
): Promise<{ best: number; improved: boolean } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_word_drop_daily", {
    p_day: input.day,
    p_level: input.level,
    p_score: input.score,
    p_accuracy: input.accuracy,
    p_wpm: input.wpm,
    p_words: input.words,
    p_country: country,
  });
  if (error) throw error;
  const row = data?.[0];
  return row ? { best: row.out_best, improved: row.out_improved } : null;
}

export async function loadDailyBoard(day: string): Promise<DailyBoard> {
  const supabase = await createClient();
  const [countries, mine] = await Promise.all([
    supabase.rpc("word_drop_daily_board", { p_day: day }),
    supabase.rpc("word_drop_daily_rank", { p_day: day }),
  ]);
  if (countries.error) throw countries.error;
  if (mine.error) throw mine.error;
  const place = mine.data?.[0];
  return {
    countries: (countries.data ?? []).map((row) => ({
      country: row.country,
      players: row.players,
      average: row.avg_score,
    })),
    mine: place ? { best: place.my_score, rank: place.my_rank, total: place.total } : null,
  };
}
