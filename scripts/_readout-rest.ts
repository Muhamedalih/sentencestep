/**
 * Read-only access to the live database for the readout scripts (sentence-bank-readout.ts,
 * today-readout.ts): the service role, GET requests only, nothing is ever written. Loaded with
 *   npx tsx --env-file=.env.local scripts/<name>.ts
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

export function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/** Every row a REST query matches, 1000 at a time. */
export async function all<R>(path: string): Promise<R[]> {
  const rows: R[] = [];
  for (let from = 0; ; from += 1000) {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${from}-${from + 999}`,
        "Range-Unit": "items",
      },
    });
    if (!response.ok) {
      throw new Error(
        `${path.split("?")[0]}: ${response.status} ${(await response.text()).slice(0, 160)}`,
      );
    }
    const page = (await response.json()) as R[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

/** Like `all`, but a table that cannot be read (say, a migration not applied yet) gives no rows and a warning. */
export async function allOrEmpty<R>(path: string): Promise<R[]> {
  try {
    return await all<R>(path);
  } catch (error) {
    console.warn(`WARNING: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

export interface RolloutRow {
  feature: string;
  mode: string;
  percent: number;
  emails: string[];
  updated_at: string;
}

export const readRollouts = () =>
  all<RolloutRow>("rollouts?select=feature,mode,percent,emails,updated_at");

/** The ids of the admin accounts, which are left out of every comparison between learners. */
export async function readAdminIds(): Promise<Set<string>> {
  const rows = await all<{ id: string }>("profiles?select=id&role=eq.admin");
  return new Set(rows.map((row) => row.id));
}
