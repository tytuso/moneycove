import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type PlanTier = 'free' | 'pro'
export type PlanState = {
  tier: PlanTier
  status: 'free' | 'active' | 'past_due' | 'cancelled'
  currentPeriodEnd: string | null
  loading: boolean
}

const freePlan: PlanState = { tier: 'free', status: 'free', currentPeriodEnd: null, loading: true }

export function useSubscription(userId: string | undefined) {
  const [plan, setPlan] = useState<PlanState>(freePlan)

  const refresh = useCallback(async () => {
    if (!userId || !supabase) {
      setPlan({ ...freePlan, loading: false })
      return
    }
    const { data, error } = await supabase
      .from('pesapilot_subscriptions')
      .select('plan,status,current_period_end')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      // A suspended mobile PWA can briefly resume with a stale access token. Do not
      // downgrade an already-known Pro user because of one transient auth request.
      setPlan(current => current.loading ? { ...freePlan, loading: false } : { ...current, loading: false })
      return
    }

    let row = data
    if (!row) {
      const { error: insertError } = await supabase
        .from('pesapilot_subscriptions')
        .insert({ user_id: userId, plan: 'free', status: 'free' })
      if (insertError && insertError.code !== '23505') {
        setPlan({ tier: 'free', status: 'free', currentPeriodEnd: null, loading: false })
        return
      }
      const { data: created } = await supabase
        .from('pesapilot_subscriptions')
        .select('plan,status,current_period_end')
        .eq('user_id', userId)
        .maybeSingle()
      row = created
    }

    if (!row) {
      setPlan({ tier: 'free', status: 'free', currentPeriodEnd: null, loading: false })
      return
    }

    const expires = row.current_period_end ? new Date(row.current_period_end) : null
    const active = row.plan === 'pro' && row.status === 'active' && (!expires || expires.getTime() > Date.now())
    setPlan({
      tier: active ? 'pro' : 'free',
      status: active ? 'active' : (row.status === 'past_due' || row.status === 'cancelled' ? row.status : 'free'),
      currentPeriodEnd: active ? row.current_period_end : null,
      loading: false,
    })
  }, [userId])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!userId || !supabase) return
    const client = supabase
    const scheduleRefresh = () => { window.setTimeout(() => { void refresh() }, 0) }
    const onVisible = () => { if (document.visibilityState === 'visible') scheduleRefresh() }
    const onFocus = () => scheduleRefresh()
    const onPageShow = () => scheduleRefresh()
    const onOnline = () => scheduleRefresh()
    const { data: authSubscription } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') scheduleRefresh()
    })
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('online', onOnline)
    return () => {
      authSubscription.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('online', onOnline)
    }
  }, [userId, refresh])

  return { plan, isPro: plan.tier === 'pro', refresh }
}
