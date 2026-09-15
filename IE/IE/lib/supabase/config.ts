/**
 * Helper to dynamically resolve Supabase credentials.
 * Supports standard names AND Vercel Supabase Integration prefixed names
 * (e.g., NEXT_PUBLIC_sb_publishable_..._SUPABASE_URL).
 */

export function getSupabaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  }

  // Check for Vercel Supabase Integration auto-generated variable names
  for (const [key, val] of Object.entries(process.env)) {
    if (key.endsWith('_SUPABASE_URL') && val) {
      return val
    }
  }

  return 'https://njvwdjbaatdjgtuwstie.supabase.co'
}

export function getSupabaseAnonKey(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  // Check for Vercel Supabase Integration auto-generated variable names
  for (const [key, val] of Object.entries(process.env)) {
    if (
      (key.endsWith('_SUPABASE_ANON_KEY') || key.endsWith('_SUPABASE_PUBLISHABLE_KEY')) &&
      val
    ) {
      return val
    }
  }

  return 'sb_publishable_8NgDDO9xMhkMk8v0aBZGRQ_ruE9gRrb'
}

export function getSupabaseServiceRoleKey(): string {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('dummy')) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  // Check for Vercel Supabase Integration auto-generated variable names
  for (const [key, val] of Object.entries(process.env)) {
    if (
      (key.endsWith('_SUPABASE_SERVICE_ROLE_KEY') || key.endsWith('_SUPABASE_SECRET_KEY')) &&
      val
    ) {
      return val
    }
  }

  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_YVZngOJmOtUUtZuNXQ92-Q_lLLalASJ'
}
