import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  displayName: string
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function displayNameFor(user: User | null) {
  if (!user) return ''
  const fromMeta = String(user.user_metadata?.full_name || user.user_metadata?.name || '').trim()
  if (fromMeta) return fromMeta
  return user.email?.split('@')[0] || 'MoneyCove user'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const client = supabase
    let alive = true
    client.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setLoading(false)
      if (data.session?.user) {
        const authUser = data.session.user
        const fullName = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || '').trim()
        void client.from('pesapilot_profiles').upsert({
          user_id: authUser.id,
          full_name: fullName || null,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
      if (nextSession?.user) {
        const authUser = nextSession.user
        const fullName = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || '').trim()
        void client.from('pesapilot_profiles').upsert({
          user_id: authUser.id,
          full_name: fullName || null,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    })

    return () => {
      alive = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: supabaseConfigured,
    displayName: displayNameFor(session?.user ?? null),
    signOut: async () => {
      if (supabase) await supabase.auth.signOut()
      setSession(null)
    },
    refreshUser: async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getUser()
      if (data.user && session) setSession({ ...session, user: data.user })
    },
  }), [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
