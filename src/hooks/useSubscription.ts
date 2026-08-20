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
      setPlan({ tier: 'free', status: 'free', currentPeriodEnd: null, loading: false })
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

  return { plan, isPro: plan.tier === 'pro', refresh }
}
