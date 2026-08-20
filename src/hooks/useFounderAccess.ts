import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FOUNDER_EMAIL = 'opiotitus333@gmail.com'
const FOUNDER_FUNCTION = 'https://dpmajonvvhopjnupgfpq.supabase.co/functions/v1/pesapilot-founder'

export function useFounderAccess(userId: string | undefined, email?: string | null) {
  const normalized = String(email || '').trim().toLowerCase()
  const eligible = Boolean(userId) && normalized === FOUNDER_EMAIL
  const [isFounder, setIsFounder] = useState(false)
  const [loading, setLoading] = useState(eligible)

  const checkAccess = useCallback(async () => {
    if (!eligible || !supabase) {
      setIsFounder(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      let session = (await supabase.auth.getSession()).data.session
      if (!session) throw new Error('No session')

      const callFounder = (token: string) => fetch(FOUNDER_FUNCTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'list' }),
      })

      let response = await callFounder(session.access_token)
      if (response.status === 401) {
        const refreshed = await supabase.auth.refreshSession()
        if (refreshed.data.session) {
          session = refreshed.data.session
          response = await callFounder(session.access_token)
        }
      }
      setIsFounder(response.ok)
    } catch {
      setIsFounder(false)
    } finally {
      setLoading(false)
    }
  }, [eligible])

  useEffect(() => { void checkAccess() }, [checkAccess, userId])

  useEffect(() => {
    if (!eligible || !supabase) return
    const schedule = () => window.setTimeout(() => { void checkAccess() }, 0)
    const onVisible = () => { if (document.visibilityState === 'visible') schedule() }
    const onFocus = () => schedule()
    const onPageShow = () => schedule()
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') schedule()
    })
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      authSubscription.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [eligible, checkAccess])

  return { isFounder, loading, refresh: checkAccess }
}
