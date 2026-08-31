import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** How many failed attempts for the same email, within WINDOW_MINUTES, before signIn refuses to even try the password. */
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
/** Rows older than this are opportunistically cleaned up on each check — small enough a full table scan never happens, no separate cron job needed for a ledger this size. */
const RETENTION_HOURS = 24;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * True when this email has hit MAX_FAILED_ATTEMPTS failures in the last
 * WINDOW_MINUTES — signIn's cue to refuse the attempt before even calling
 * signInWithPassword. Fails OPEN (returns false, i.e. "not locked out")
 * when the service role isn't configured, same as every other
 * service-role-dependent feature in this codebase degrading gracefully
 * rather than breaking sign-in entirely for an environment that never had
 * this key set up — Supabase Auth's own endpoint-level rate limits still
 * apply regardless.
 */
export async function isLoginLockedOut(email: string): Promise<boolean> {
  if (!isServiceRoleConfigured()) return false;

  const normalized = normalizeEmail(email);
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", normalized)
    .eq("success", false)
    .gte("created_at", since);

  if (error) return false;
  return (count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

/** Records one sign-in attempt (success or failure) — the write half of the lockout check above. Best-effort: a logging failure must never block the sign-in it's recording. */
export async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  try {
    const supabase = createServiceRoleClient();
    const normalized = normalizeEmail(email);
    await supabase.from("login_attempts").insert({ email: normalized, success });

    const cutoff = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();
    await supabase.from("login_attempts").delete().lt("created_at", cutoff);
  } catch (error) {
    console.error("[login-rate-limit] recordLoginAttempt failed", error);
  }
}
