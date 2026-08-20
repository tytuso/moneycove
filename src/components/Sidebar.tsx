import { BarChart3, Brain, ChevronLeft, ChevronRight, CreditCard, Crown, CalendarDays, LayoutDashboard, LogOut, Moon, PieChart, ReceiptText, Settings, Sun } from 'lucide-react'
import { Logo } from './Logo'
import type { PageKey } from '../hooks/useHashPage'
import type { ThemeMode } from '../types'
import { APP_VERSION } from '../version'

const items = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['transactions', ReceiptText, 'Transactions'],
  ['budget', PieChart, 'Budget'],
  ['reports', BarChart3, 'Reports'],
  ['ai', Brain, 'AI Adviser'],
  ['billing', CreditCard, 'Plan & billing'],
  ['calendar', CalendarDays, 'Calendar'],
  ['settings', Settings, 'Settings'],
] as const

export function Sidebar({ page, setPage, collapsed, setCollapsed, theme, toggleTheme, userName, userEmail, isPro, isFounder, onLogout }: { page: PageKey; setPage: (p: PageKey) => void; collapsed: boolean; setCollapsed: (v: boolean) => void; theme: ThemeMode; toggleTheme: () => void; userName: string; userEmail: string; isPro: boolean; isFounder: boolean; onLogout: () => void }) {
  const initial = userName.trim().charAt(0).toUpperCase() || 'U'
  return <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200/80 bg-white/95 backdrop-blur-xl transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950/95 lg:flex lg:flex-col ${collapsed ? 'w-[84px]' : 'w-[248px]'}`}>
    <div className="flex h-20 items-center px-5"><Logo compact={collapsed}/></div>
    <nav className="flex-1 space-y-1 px-3">{items.map(([key,Icon,label])=><button key={key} onClick={()=>setPage(key)} className={`nav-item ${page===key?'nav-item-active':''} ${collapsed?'justify-center px-0':''}`} title={collapsed?label:undefined}><Icon size={19}/>{!collapsed&&<span className="flex min-w-0 flex-1 items-center justify-between"><span>{label}</span>{key==='ai'&&<span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[.12em] ${isPro?'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300':'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{isPro?'Pro':'Locked'}</span>}</span>}</button>)}{isFounder&&<button onClick={()=>setPage('founder')} className={`nav-item ${page==='founder'?'nav-item-active':''} ${collapsed?'justify-center px-0':''}`} title={collapsed?'Founder':undefined}><Crown size={19}/>{!collapsed&&<span>Founder</span>}</button>}</nav>
    <div className="relative space-y-2 border-t border-slate-200/70 p-3 dark:border-slate-800">
      <div className={`flex items-center gap-3 rounded-2xl bg-slate-50 p-2 dark:bg-slate-900 ${collapsed?'justify-center':''}`} title={collapsed?`${userName} · ${isPro?'Pro':'Free'}`:undefined}><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-indigo-600 text-sm font-black text-white">{initial}</div>{!collapsed&&<div className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">{userName}</div><div className="mt-0.5 truncate text-[10px] font-bold text-slate-400">{isPro?'Pro plan':userEmail}</div></div>}</div>
      <button className={`nav-item ${collapsed?'justify-center px-0':''}`} onClick={toggleTheme}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>} {!collapsed&&<span>{theme==='dark'?'Light mode':'Dark mode'}</span>}</button>
      <button className={`nav-item text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 ${collapsed?'justify-center px-0':''}`} onClick={onLogout}><LogOut size={19}/>{!collapsed&&<span>Log out</span>}</button>
      {!collapsed&&<div className="px-3 text-[11px] font-semibold text-slate-400">MoneyCove v{APP_VERSION}</div>}
      <button className="absolute -right-3 top-3 grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400" onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle sidebar">{collapsed?<ChevronRight size={14}/>:<ChevronLeft size={14}/>}</button>
    </div>
  </aside>
}
