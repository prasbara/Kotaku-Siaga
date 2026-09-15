import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/config";

export const createClient = () =>
  createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
