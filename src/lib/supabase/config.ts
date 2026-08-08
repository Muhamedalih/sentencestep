/**
 * Whether a real Supabase project is linked. Until both env vars are set,
 * the app runs entirely on local data — see src/lib/content.ts.
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
