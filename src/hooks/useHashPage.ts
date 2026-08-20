import { useEffect, useState } from 'react'

export type PageKey = 'dashboard' | 'transactions' | 'budget' | 'reports' | 'ai' | 'billing' | 'calendar' | 'settings' | 'founder'
const valid: PageKey[] = ['dashboard', 'transactions', 'budget', 'reports', 'ai', 'billing', 'calendar', 'settings', 'founder']

export function useHashPage() {
  const read = (): PageKey => {
    const value = window.location.hash.replace('#/', '') as PageKey
    return valid.includes(value) ? value : 'dashboard'
  }
  const [page, setPageState] = useState<PageKey>(read)
  useEffect(() => {
    const handler = () => setPageState(read())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  const setPage = (next: PageKey) => { window.location.hash = `/${next}`; setPageState(next) }
  return [page, setPage] as const
}
