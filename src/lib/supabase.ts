import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// MoneyCove commercial edition is intentionally tied to the Nile Core Supabase project.
// These values are public client credentials, so keeping safe fallbacks here avoids a
// broken login screen when Vercel public env vars have not been added yet.
const DEFAULT_URL = 'https://dpmajonvvhopjnupgfpq.supabase.co'
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_64LPWeBCLp_4yxDvB5XGiw_rwcFcgO7'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_URL
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim() || DEFAULT_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) throw new Error('MoneyCove cloud services are temporarily unavailable.')
  return supabase
}
