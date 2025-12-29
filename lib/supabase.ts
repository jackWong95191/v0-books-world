import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Simple Supabase client without authentication
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
