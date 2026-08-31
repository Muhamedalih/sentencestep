import {
  computeAbandonmentRate,
  computeAverageDurationSeconds,
  computeCompletionRate,
  pairDurationsSeconds,
} from "@/lib/analytics/insights-domain";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { LearningMode } from "@/types/content";

export interface LessonInsight {
  lessonId: string;
  started: number;
  completed: number;
  completionRate: number;
  abandonmentRate: number;
  averageDurationSeconds: number | null;
}

const STARTED_NAMES = ["LESSON_STARTED", "STORY_STARTED", "CONVERSATION_STARTED"];
const COMPLETED_NAMES = ["LESSON_COMPLETED", "STORY_COMPLETED", "CONVERSATION_COMPLETED"];

interface EventRow {
  event_name: string;
  event_properties: unknown;
  created_at: string;
}

function lessonIdOf(row: EventRow): string | null {
  const properties = row.event_properties;
  if (properties && typeof properties === "object" && "lessonId" in properties) {
    const value = (properties as { lessonId?: unknown }).lessonId;
    return typeof value === "string" ? value : null;
  }
  return null;
}

/**
 * Per-lesson product insight — which content is started most, completed
 * most, and abandoned most (started with no matching completion), plus how
 * long a completion typically takes. Server-only: reads analytics_events
 * via the service-role client, since ordinary users can't read this table
 * (see the Milestone 10 migration).
 */
export async function getContentInsights(mode?: LearningMode): Promise<LessonInsight[]> {
  const supabase = createServiceRoleClient();

  const query = supabase
    .from("analytics_events")
    .select("event_name, event_properties, created_at")
    .in("event_name", [...STARTED_NAMES, ...COMPLETED_NAMES]);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).filter((row) => {
    if (!mode) return true;
    const properties = row.event_properties;
    const rowMode =
      properties && typeof properties === "object" && "mode" in properties
        ? (properties as { mode?: unknown }).mode
        : undefined;
    return rowMode === mode;
  });

  const startedByLesson = new Map<string, number[]>();
  const completedByLesson = new Map<string, number[]>();

  for (const row of rows) {
    const lessonId = lessonIdOf(row);
    if (!lessonId) continue;
    const timestamp = new Date(row.created_at).getTime();

    if (STARTED_NAMES.includes(row.event_name)) {
      const list = startedByLesson.get(lessonId) ?? [];
      list.push(timestamp);
      startedByLesson.set(lessonId, list);
    } else if (COMPLETED_NAMES.includes(row.event_name)) {
      const list = completedByLesson.get(lessonId) ?? [];
      list.push(timestamp);
      completedByLesson.set(lessonId, list);
    }
  }

  const lessonIds = new Set([...startedByLesson.keys(), ...completedByLesson.keys()]);

  return Array.from(lessonIds).map((lessonId) => {
    const startedAt = startedByLesson.get(lessonId) ?? [];
    const completedAt = completedByLesson.get(lessonId) ?? [];
    const durations = pairDurationsSeconds(startedAt, completedAt);

    return {
      lessonId,
      started: startedAt.length,
      completed: completedAt.length,
      completionRate: computeCompletionRate(startedAt.length, completedAt.length),
      abandonmentRate: computeAbandonmentRate(startedAt.length, completedAt.length),
      averageDurationSeconds: computeAverageDurationSeconds(durations),
    };
  });
}

export interface UpgradeFunnelInsight {
  upgradeViews: number;
  ctaClicks: number;
  conversionRate: number;
}

/** Coarse product-funnel visibility: how many upgrade-page views turn into an upgrade attempt. Does not (and cannot yet) include an actual paid conversion — see Milestone 8. */
export async function getUpgradeFunnel(): Promise<UpgradeFunnelInsight> {
  const supabase = createServiceRoleClient();

  const [{ count: upgradeViews, error: viewsError }, { count: ctaClicks, error: clicksError }] =
    await Promise.all([
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", "UPGRADE_VIEWED"),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", "UPGRADE_CTA_CLICKED"),
    ]);

  if (viewsError) throw viewsError;
  if (clicksError) throw clicksError;

  const views = upgradeViews ?? 0;
  const clicks = ctaClicks ?? 0;

  return {
    upgradeViews: views,
    ctaClicks: clicks,
    conversionRate: computeCompletionRate(views, clicks),
  };
}
