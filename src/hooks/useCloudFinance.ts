import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AppState } from '../types'

const initialState: AppState = {
  transactions: [],
  monthlyBudget: 0,
  categoryBudgets: [],
  settings: { currency: 'USD', theme: 'light' },
}

export type SyncStatus = 'loading' | 'synced' | 'saving' | 'offline' | 'error'

function hasMeaningfulFinance(state: AppState | null | undefined) {
  if (!state) return false
  return state.transactions.length > 0 || state.monthlyBudget > 0 || state.categoryBudgets.length > 0
}

function normalizeState(value: unknown): AppState {
  const state = (value && typeof value === 'object' ? value : {}) as Partial<AppState>
  return {
    transactions: Array.isArray(state.transactions) ? state.transactions : [],
    monthlyBudget: Number.isFinite(state.monthlyBudget) ? Number(state.monthlyBudget) : 0,
    categoryBudgets: Array.isArray(state.categoryBudgets) ? state.categoryBudgets : [],
    settings: {
      currency: state.settings?.currency ?? 'USD',
      theme: state.settings?.theme ?? 'light',
    },
    }
}

export function useCloudFinance(userId: string | undefined) {
  const localKey = userId ? `pesapilot-cloud-cache-${userId}` : 'pesapilot-cloud-cache'
  const [state, setState] = useState<AppState>(initialState)
  const [ready, setReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [syncTick, setSyncTick] = useState(0)
  const saveTimer = useRef<number | null>(null)
  const firstLoadedState = useRef<string>('')

  useEffect(() => {
    if (!userId || !supabase) {
      setReady(false)
      setSyncStatus('error')
      return
    }

    let alive = true
    setReady(false)
    setSyncStatus('loading')

    const cached = localStorage.getItem(localKey)
    let cachedState: AppState | null = null
    if (cached) {
      try {
        cachedState = normalizeState(JSON.parse(cached))
        setState(cachedState)
      } catch {
        cachedState = null
      }
    }

    ;(async () => {
      const { data, error } = await supabase
        .from('pesapilot_finance_states')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle()

      if (!alive) return
      if (error) {
        console.error('MoneyCove cloud load failed', error)
        setReady(true)
        setSyncStatus(navigator.onLine ? 'error' : 'offline')
        return
      }

      const cloudState = data?.state ? normalizeState(data.state) : null
      let legacyState: AppState | null = null
      const legacyRaw = localStorage.getItem('pesapilot-data-v1.1') || localStorage.getItem('pesapilot-data-v1.2')
      if (legacyRaw) {
        try { legacyState = normalizeState(JSON.parse(legacyRaw)) } catch { legacyState = null }
      }

      // Important migration/safety rule: an existing but completely empty cloud row
      // must not erase meaningful finance data already cached on this device.
      const localCandidate = hasMeaningfulFinance(cachedState) ? cachedState : hasMeaningfulFinance(legacyState) ? legacyState : null
      const shouldPromoteLocal = Boolean(localCandidate && !hasMeaningfulFinance(cloudState))
      const nextState = shouldPromoteLocal ? localCandidate! : cloudState ?? cachedState ?? legacyState ?? initialState

      setState(nextState)
      localStorage.setItem(localKey, JSON.stringify(nextState))
      firstLoadedState.current = JSON.stringify(nextState)
      setReady(true)
      setSyncStatus('synced')

      if (!data || shouldPromoteLocal) {
        const { error: promoteError } = await supabase.rpc('moneycove_save_finance_state', { p_state: nextState })
        if (promoteError) {
          console.error('MoneyCove cloud migration save failed', promoteError)
          setSyncStatus('error')
        }
      }
    })()

    return () => { alive = false }
  }, [userId, localKey])

  useEffect(() => {
    if (!ready || !userId || !supabase) return
    localStorage.setItem(localKey, JSON.stringify(state))

    const serialized = JSON.stringify(state)
    if (serialized === firstLoadedState.current) return

    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    setSyncStatus(navigator.onLine ? 'saving' : 'offline')
    saveTimer.current = window.setTimeout(async () => {
      if (!navigator.onLine) {
        setSyncStatus('offline')
        return
      }
      const { error } = await supabase!.rpc('moneycove_save_finance_state', { p_state: state })
      if (error) {
        console.error('MoneyCove cloud save failed', error)
        setSyncStatus('error')
      } else {
        firstLoadedState.current = serialized
        setSyncStatus('synced')
      }
    }, 650)

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [state, ready, userId, localKey, syncTick])

  useEffect(() => {
    const online = () => {
      setSyncStatus('saving')
      setSyncTick(tick => tick + 1)
    }
    const offline = () => setSyncStatus('offline')
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  return { state, setState, ready, syncStatus }
}
