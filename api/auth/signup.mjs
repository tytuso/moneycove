import { adminClient, sendError } from '../../server/supabaseAdmin.mjs'
import { sendWelcomeEmail } from '../../server/email.mjs'

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  try {
    const name = String(req.body?.name || '').trim()
    const email = cleanEmail(req.body?.email)
    const password = String(req.body?.password || '')
    if (name.length < 2 || name.length > 80) throw Object.assign(new Error('Enter your name.'), { statusCode: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error('Enter a valid email address.'), { statusCode: 400 })
    if (password.length < 8 || password.length > 128) throw Object.assign(new Error('Use a password between 8 and 128 characters.'), { statusCode: 400 })

    const admin = adminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (error) {
      const message = String(error.message || '').toLowerCase()
      if (message.includes('already') || message.includes('registered') || error.status === 422) {
        throw Object.assign(new Error('An account already exists with this email. Sign in instead.'), { statusCode: 409 })
      }
      throw error
    }

    const userId = data.user?.id
    if (userId) {
      await Promise.allSettled([
        admin.from('pesapilot_profiles').upsert({ user_id: userId, full_name: name, last_seen_at: new Date().toISOString() }),
        admin.from('pesapilot_subscriptions').upsert({ user_id: userId, plan: 'free', status: 'free', updated_at: new Date().toISOString() }),
        admin.from('pesapilot_finance_states').upsert({ user_id: userId, state: { transactions: [], monthlyBudget: 0, categoryBudgets: [], settings: { currency: 'USD', theme: 'light' } }, updated_at: new Date().toISOString() }),
      ])
    }

    // Welcome email is optional and never blocks account creation.
    await sendWelcomeEmail({ email, name }).catch((err) => console.warn('Welcome email error', err))
    return res.status(201).json({ ok: true })
  } catch (error) {
    return sendError(res, error)
  }
}
