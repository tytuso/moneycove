import { useEffect, useMemo, useState } from 'react'
import { Crown, RefreshCw, Search, ShieldCheck, Sparkles, UserRound, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

type FounderUser = {
  id: string
  email: string
  name: string
  createdAt: string
  lastSignInAt: string | null
  plan: 'free' | 'pro'
  status: string
  currentPeriodEnd: string | null
  provider: string | null
  financeUpdatedAt: string | null
  aiThisMonth: number
  lastPayment: { amount:number; currency:string; reference:string|null; created_at:string } | null
}

type Stats = { totalUsers:number; proUsers:number; freeUsers:number; aiRequestsThisMonth:number }

async function authHeaders() {
  const session = (await supabase?.auth.getSession())?.data.session
  if (!session) throw new Error('Your session expired. Sign in again.')
  return { Authorization: `Bearer ${session.access_token}` }
}

export function FounderPage() {
  const [users,setUsers]=useState<FounderUser[]>([])
  const [stats,setStats]=useState<Stats>({totalUsers:0,proUsers:0,freeUsers:0,aiRequestsThisMonth:0})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [query,setQuery]=useState('')
  const [busyId,setBusyId]=useState('')
  const [reference,setReference]=useState<Record<string,string>>({})

  const load=async()=>{setLoading(true);setError('');try{const headers=await authHeaders();const response=await fetch('https://dpmajonvvhopjnupgfpq.supabase.co/functions/v1/pesapilot-founder',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({action:'list'})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to load founder dashboard.');setUsers(data.users||[]);setStats(data.stats||{totalUsers:0,proUsers:0,freeUsers:0,aiRequestsThisMonth:0})}catch(err){setError(err instanceof Error?err.message:'Unable to load founder dashboard.')}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])

  const visible=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return users;return users.filter(user=>`${user.name} ${user.email}`.toLowerCase().includes(q))},[users,query])

  const mutate=async(userId:string,action:'grant_pro'|'revoke_pro')=>{setBusyId(userId);setError('');try{const headers=await authHeaders();const response=await fetch('https://dpmajonvvhopjnupgfpq.supabase.co/functions/v1/pesapilot-founder',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(action==='grant_pro'?{action,userId,days:30,amount:5,currency:'USD',reference:reference[userId]||''}:{action,userId})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to update plan.');await load()}catch(err){setError(err instanceof Error?err.message:'Unable to update plan.')}finally{setBusyId('')}}

  return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow">Founder control</div><h1 className="page-title">MoneyCove Founder</h1><p className="page-subtitle">Manage users, manual $5 payments and Pro access from one private control page.</p></div><button className="secondary-btn" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/>{loading?'Refreshing…':'Refresh'}</button></div>
    {error&&<div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[Users,'Users',stats.totalUsers],[Crown,'Pro users',stats.proUsers],[UserRound,'Free users',stats.freeUsers],[Sparkles,'AI requests this month',stats.aiRequestsThisMonth]].map(([Icon,label,value])=>{const I=Icon as typeof Users;return <section key={String(label)} className="panel"><I size={20} className="text-teal-700 dark:text-teal-300"/><div className="mt-5 text-xs font-black uppercase tracking-[.16em] text-slate-400">{String(label)}</div><div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{Number(value)}</div></section>})}</div>
    <section className="panel mt-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-teal-700"/><h2 className="section-title">Accounts & Pro access</h2></div><p className="mt-1 text-xs font-semibold text-slate-500">After you confirm a $5 payment, add its reference and grant 30 days of Pro.</p></div><label className="relative block w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="field-input pl-9" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email"/></label></div>
      <div className="mt-6 overflow-x-auto"><table className="min-w-[900px] w-full text-left text-xs"><thead><tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800"><th className="pb-3 pr-4 font-black uppercase tracking-[.12em]">User</th><th className="pb-3 pr-4 font-black uppercase tracking-[.12em]">Plan</th><th className="pb-3 pr-4 font-black uppercase tracking-[.12em]">Activity</th><th className="pb-3 pr-4 font-black uppercase tracking-[.12em]">Payment reference</th><th className="pb-3 font-black uppercase tracking-[.12em]">Action</th></tr></thead><tbody>{visible.map(user=><tr key={user.id} className="border-b border-slate-100 align-top dark:border-slate-800/70"><td className="py-4 pr-4"><div className="font-black text-slate-900 dark:text-white">{user.name||'Unnamed user'}</div><div className="mt-1 font-semibold text-slate-500">{user.email}</div><div className="mt-1 text-[10px] text-slate-400">Joined {new Date(user.createdAt).toLocaleDateString()}</div></td><td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 font-black uppercase tracking-[.10em] ${user.plan==='pro'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300':'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{user.plan}</span>{user.currentPeriodEnd&&<div className="mt-2 text-[10px] font-semibold text-slate-400">Until {new Date(user.currentPeriodEnd).toLocaleDateString()}</div>}</td><td className="py-4 pr-4"><div className="font-bold text-slate-700 dark:text-slate-300">AI: {user.aiThisMonth}/40</div><div className="mt-1 text-[10px] text-slate-400">{user.lastSignInAt?`Last sign-in ${new Date(user.lastSignInAt).toLocaleDateString()}`:'No sign-in yet'}</div></td><td className="py-4 pr-4"><input className="field-input min-w-[190px]" value={reference[user.id]??user.lastPayment?.reference??''} onChange={e=>setReference(current=>({...current,[user.id]:e.target.value}))} placeholder="e.g. TXN-12345"/></td><td className="py-4"><div className="flex gap-2">{user.plan==='pro'?<button className="secondary-btn min-h-9 px-3 text-xs" disabled={busyId===user.id} onClick={()=>void mutate(user.id,'revoke_pro')}>{busyId===user.id?'Saving…':'Revoke Pro'}</button>:<button className="primary-btn min-h-9 px-3 text-xs" disabled={busyId===user.id} onClick={()=>void mutate(user.id,'grant_pro')}>{busyId===user.id?'Saving…':'Grant 30 days'}</button>}</div></td></tr>)}</tbody></table>{!loading&&visible.length===0&&<div className="py-12 text-center text-sm font-bold text-slate-400">No matching users.</div>}</div>
    </section></div>
}
