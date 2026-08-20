import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://dpmajonvvhopjnupgfpq.supabase.co'

export function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Supabase server secret is missing.')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

export async function requireApiUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = String(authHeader).startsWith('Bearer ') ? String(authHeader).slice(7) : ''
  if (!token) throw Object.assign(new Error('Authentication required.'), { statusCode: 401 })
  const admin = adminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw Object.assign(new Error('Your session is invalid or expired.'), { statusCode: 401 })
  return { user: data.user, admin }
}

export function sendError(res, error) {
  console.error(error)
  const status = Number(error?.statusCode) || 500
  res.status(status).json({ error: status >= 500 ? 'The server could not complete this request.' : error.message })
}
