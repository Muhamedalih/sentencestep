import {
  PAY_PRESS_EVENT,
  PRACTICE_EVENTS,
  summarizeStrip,
  type StripLaterEvent,
  type StripOrder,
  type StripReadout,
} from "@/lib/premium-strip/readout";
import { STRIP_SOURCE } from "@/lib/premium-strip/source";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/** PostgREST returns at most 1000 rows a call, so a long list is read in pages up to this many rows. */
const PAGE = 1000;
const MAX_ROWS = 20000;
/** User ids per `in (...)` filter, to keep the request address short. */
const ID_CHUNK = 100;
const TABLE_ROWS = 50;

async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

function text(properties: unknown, key: string): string | null {
  const value = (properties as Record<string, unknown> | null)?.[key];
  return typeof value === "string" ? value : null;
}

export interface StripCounter extends StripReadout {
  /** The first press ever recorded, or null before there is one. */
  countingSince: string | null;
  /** Email addresses of the newest people in the table. */
  emails: Map<string, string>;
}

/**
 * Everything on Admin > Premium strip, read with the service-role client (analytics_events and
 * payment_orders are not readable by a session), so the caller must already have passed the admin gate.
 */
export async function getPremiumStripCounter(): Promise<StripCounter> {
  const supabase = createServiceRoleClient();

  const [staff, pressRows] = await Promise.all([
    readAll<{ id: string }>((from, to) =>
      supabase.from("profiles").select("id").in("role", ["admin", "editor"]).range(from, to),
    ),
    readAll<{ user_id: string | null; created_at: string; event_properties: unknown }>((from, to) =>
      supabase
        .from("analytics_events")
        .select("user_id, created_at, event_properties")
        .eq("event_name", "UPGRADE_VIEWED")
        .eq("event_properties->>src", STRIP_SOURCE)
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
  ]);
  const staffIds = new Set(staff.map((row) => row.id));
  const presses = pressRows.map((row) => ({
    userId: row.user_id,
    at: row.created_at,
    country: text(row.event_properties, "country"),
  }));

  const ids = [
    ...new Set(
      presses.flatMap((press) =>
        press.userId && !staffIds.has(press.userId) ? [press.userId] : [],
      ),
    ),
  ];
  const since = pressRows[0]?.created_at ?? null;
  const events: StripLaterEvent[] = [];
  const orders: StripOrder[] = [];
  for (let start = 0; since && start < ids.length; start += ID_CHUNK) {
    const chunk = ids.slice(start, start + ID_CHUNK);
    const [eventRows, orderRows] = await Promise.all([
      readAll<{
        user_id: string | null;
        event_name: string;
        created_at: string;
        event_properties: unknown;
      }>((from, to) =>
        supabase
          .from("analytics_events")
          .select("user_id, event_name, created_at, event_properties")
          .in("user_id", chunk)
          .in("event_name", [PAY_PRESS_EVENT, ...PRACTICE_EVENTS])
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .range(from, to),
      ),
      readAll<{ user_id: string; status: string; created_at: string }>((from, to) =>
        supabase
          .from("payment_orders")
          .select("user_id, status, created_at")
          .eq("provider_env", "live")
          .in("user_id", chunk)
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .range(from, to),
      ),
    ]);
    for (const row of eventRows) {
      if (!row.user_id) continue;
      events.push({
        userId: row.user_id,
        name: row.event_name,
        at: row.created_at,
        plan: text(row.event_properties, "plan"),
        method: text(row.event_properties, "method"),
      });
    }
    for (const row of orderRows) {
      orders.push({ userId: row.user_id, at: row.created_at, status: row.status });
    }
  }

  const readout = summarizeStrip({ presses, events, orders, staffIds });
  const emails = new Map<string, string>();
  await Promise.all(
    readout.people.slice(0, TABLE_ROWS).map(async ({ userId }) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emails.set(userId, data.user.email);
    }),
  );

  return {
    ...readout,
    people: readout.people,
    countingSince: since,
    emails,
  };
}
