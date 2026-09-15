/**
 * Helper to dynamically resolve Supabase credentials.
 * Supports standard names AND Vercel Supabase Integration prefixed names
 * (e.g., NEXT_PUBLIC_sb_publishable_..._SUPABASE_URL).
 */

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://njvwdjbaatdjgtuwstie.supabase.co'
  )
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_8NgDDO9xMhkMk8v0aBZGRQ_ruE9gRrb'
  )
}

export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'sb_secret_YVZngOJmOtUUtZuNXQ92-Q_lLLalASJ'
  )
}
