import { requireFounder } from '../../server/founder.mjs'
import { sendError } from '../../server/supabaseAdmin.mjs'

function daysFromNow(value) {
  const days = Math.max(1, Math.min(365, Number(value) || 30))
  return days
}

export default async function handler(req, res) {
  try {
    const { user: founder, admin } = await requireFounder(req)

    if (req.method === 'GET') {
      const { data: profiles, error: profilesError } = await admin.from('pesapilot_profiles').select('user_id,full_name,joined_at,last_seen_at').order('joined_at', { ascending: false }).limit(1000)
      if (profilesError) throw profilesError
      const profileRows = profiles || []
      const profileIds = new Set(profileRows.map((row) => row.user_id))
      const profileMap = new Map(profileRows.map((row) => [row.user_id, row]))
      const { data: listed, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (usersError) throw usersError
      const users = (listed?.users || []).filter((account) => profileIds.has(account.id))
      const userIds = users.map((user) => user.id)
      const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)

      const [subscriptionsResult, financeResult, aiResult, paymentsResult] = await Promise.all([
        userIds.length ? admin.from('pesapilot_subscriptions').select('user_id,plan,status,current_period_end,provider,provider_reference,updated_at').in('user_id', userIds) : { data: [] },
        userIds.length ? admin.from('pesapilot_finance_states').select('user_id,updated_at').in('user_id', userIds) : { data: [] },
        userIds.length ? admin.from('pesapilot_ai_usage').select('user_id,created_at').in('user_id', userIds).gte('created_at', monthStart.toISOString()) : { data: [] },
        admin.from('pesapilot_manual_payments').select('user_id,amount,currency,reference,created_at').order('created_at', { ascending: false }).limit(100),
      ])
      if (subscriptionsResult.error) throw subscriptionsResult.error
      if (financeResult.error) throw financeResult.error
      if (aiResult.error) throw aiResult.error
      if (paymentsResult.error) throw paymentsResult.error

      const subscriptions = new Map((subscriptionsResult.data || []).map((row) => [row.user_id, row]))
      const finance = new Map((financeResult.data || []).map((row) => [row.user_id, row]))
      const aiCounts = new Map()
      for (const row of aiResult.data || []) aiCounts.set(row.user_id, (aiCounts.get(row.user_id) || 0) + 1)
      const paymentsByUser = new Map()
      for (const row of paymentsResult.data || []) if (!paymentsByUser.has(row.user_id)) paymentsByUser.set(row.user_id, row)

      const rows = users.map((account) => {
        const sub = subscriptions.get(account.id)
        const expiry = sub?.current_period_end ? new Date(sub.current_period_end) : null
        const active = sub?.plan === 'pro' && sub?.status === 'active' && (!expiry || expiry.getTime() > Date.now())
        return {
          id: account.id,
          email: account.email || '',
          name: String(profileMap.get(account.id)?.full_name || account.user_metadata?.full_name || account.user_metadata?.name || '').trim(),
          createdAt: profileMap.get(account.id)?.joined_at || account.created_at,
          lastSignInAt: account.last_sign_in_at || null,
          plan: active ? 'pro' : 'free',
          status: active ? 'active' : (sub?.status || 'free'),
          currentPeriodEnd: active ? sub?.current_period_end || null : null,
          provider: sub?.provider || null,
          financeUpdatedAt: finance.get(account.id)?.updated_at || null,
          aiThisMonth: aiCounts.get(account.id) || 0,
          lastPayment: paymentsByUser.get(account.id) || null,
        }
      }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

      return res.status(200).json({
        users: rows,
        stats: {
          totalUsers: rows.length,
          proUsers: rows.filter((row) => row.plan === 'pro').length,
          freeUsers: rows.filter((row) => row.plan === 'free').length,
          aiRequestsThisMonth: Array.from(aiCounts.values()).reduce((sum, value) => sum + value, 0),
        },
      })
    }

    if (req.method === 'POST') {
      const action = String(req.body?.action || '')
      const userId = String(req.body?.userId || '')
      if (!userId) throw Object.assign(new Error('Choose a user.'), { statusCode: 400 })

      if (action === 'grant_pro') {
        const days = daysFromNow(req.body?.days)
        const reference = String(req.body?.reference || '').trim().slice(0, 160) || null
        const note = String(req.body?.note || '').trim().slice(0, 500) || null
        const amount = Number(req.body?.amount) || 5
        const currency = String(req.body?.currency || 'USD').toUpperCase().slice(0, 3)
        const { data, error } = await admin.rpc('pesapilot_founder_grant_pro', {
          p_user_id: userId,
          p_days: days,
          p_reference: reference,
          p_amount: amount,
          p_currency: currency,
          p_founder_id: founder.id,
          p_note: note,
        })
        if (error) throw error
        return res.status(200).json({ ok: true, currentPeriodEnd: data })
      }

      if (action === 'revoke_pro') {
        const { error } = await admin.rpc('pesapilot_founder_revoke_pro', { p_user_id: userId, p_founder_id: founder.id })
        if (error) throw error
        return res.status(200).json({ ok: true })
      }

      throw Object.assign(new Error('Unknown founder action.'), { statusCode: 400 })
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  } catch (error) {
    return sendError(res, error)
  }
}
