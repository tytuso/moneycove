import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FOUNDER_EMAIL = 'opiotitus333@gmail.com'
const FOUNDER_FUNCTION = 'https://dpmajonvvhopjnupgfpq.supabase.co/functions/v1/pesapilot-founder'

export function useFounderAccess(userId: string | undefined, email?: string | null) {
  const normalized = String(email || '').trim().toLowerCase()
  const eligible = Boolean(userId) && normalized === FOUNDER_EMAIL
  const [isFounder, setIsFounder] = useState(false)
  const [loading, setLoading] = useState(eligible)

  useEffect(() => {
    let alive = true
    if (!eligible || !supabase) {
      setIsFounder(false)
      setLoading(false)
      return
    }
    setLoading(true)
    ;(async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session
        if (!session) throw new Error('No session')
        const response = await fetch(FOUNDER_FUNCTION, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'list' }),
        })
        if (!alive) return
        setIsFounder(response.ok)
      } catch {
        if (alive) setIsFounder(false)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [eligible, userId])

  return { isFounder, loading }
}
