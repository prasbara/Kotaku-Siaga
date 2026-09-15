import { createServerClient } from '@supabase/ssr'
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

export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
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
            // Server Component
          }
        },
      },
    }
  )
}
