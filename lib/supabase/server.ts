import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey } from './config'

/**
 * isSupabaseConfigured — checks if Supabase env vars are present and non-placeholder.
 * PRODUCTION: Returns true only when real credentials are configured.
 * Use this to return explicit 503 errors instead of silent fake-data fallbacks.
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey() || getSupabaseAnonKey()
  return (
    !!url &&
    url.startsWith('https://') &&
    !url.includes('dummy') &&
    !url.includes('placeholder') &&
    !!key &&
    key.length > 20
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies cannot be set
          }
        },
      },
    }
  )
}

/**
 * createAdminClient — Privileged server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses Row Level Security (RLS) for server operations: moderation, data ingestion, and cron.
 *
 * CRITICAL FIX FOR INTERMITTENT STATUS UPDATE ERROR:
 * Previously used createServerClient with cookieStore, which extracted the browser's user token
 * from cookies and attached Authorization: Bearer <user_token> to PostgREST requests, overriding
 * the service role key. If the browser had a citizen auth cookie, RLS rejected administrative
 * updates with 0 rows modified / PGRST116.
 *
 * Pure supabase-js client with persistSession: false guarantees service_role privileges regardless
 * of what cookies the client sends.
 */
export async function createAdminClient() {
  return createSupabaseClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

