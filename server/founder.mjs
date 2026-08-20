import { requireApiUser } from './supabaseAdmin.mjs'

function founderEmails() {
  return String(process.env.MONEYCOVE_FOUNDER_EMAILS || process.env.MONYRA_FOUNDER_EMAILS || process.env.PESAPILOT_FOUNDER_EMAILS || process.env.FOUNDER_EMAILS || 'opiotitus333@gmail.com')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export async function requireFounder(req) {
  const result = await requireApiUser(req)
  const email = String(result.user.email || '').trim().toLowerCase()
  if (!email || !founderEmails().includes(email)) {
    throw Object.assign(new Error('Founder access required.'), { statusCode: 403 })
  }
  return result
}
