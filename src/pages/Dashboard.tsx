import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import { ChartsDashboard } from './DashboardCharts'
import { MonthPicker } from '../components/MonthPicker'
import { SummaryCards } from '../components/SummaryCards'
import { TransactionList } from '../components/TransactionList'
import { EmptyState } from '../components/EmptyState'
import { filterByMonth, getTotals } from '../utils/finance'
import type { CurrencyCode, Transaction } from '../types'

export function Dashboard({ transactions, month, setMonth, budget, currency, userName, onAdd, onViewAll }: { transactions: Transaction[]; month: Date; setMonth: (d: Date) => void; budget: number; currency: CurrencyCode; userName: string; onAdd: () => void; onViewAll: () => void }) {
  const list = filterByMonth(transactions, month)
  const totals = getTotals(list)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const latest = [...list].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)

  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="eyebrow">Personal finance</div>
        <h1 className="page-title">{greeting}, {userName} <span aria-hidden>👋</span></h1>
        <p className="page-subtitle">Here’s how your money is looking this month.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MonthPicker month={month} onChange={setMonth}/>
        <button className="primary-btn hidden sm:inline-flex" onClick={onAdd}><Plus size={17}/> Add Transaction</button>
      </div>
    </div>

    <div className="mt-6"><SummaryCards {...totals} budget={budget} currency={currency}/></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
      <ChartsDashboard transactions={list} currency={currency}/>
      <section className="panel">
        <div className="panel-head"><div><div className="eyebrow">Latest activity</div><h2 className="section-title">Recent transactions</h2></div>{latest.length > 0 && <button className="text-btn" onClick={onViewAll}>View all <ArrowRight size={14}/></button>}</div>
        {latest.length ? <TransactionList transactions={latest} currency={currency} compact/> : <EmptyState onAdd={onAdd}/>} 
      </section>
    </div>

    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-indigo-50 p-5 dark:border-teal-900/50 dark:from-teal-950/30 dark:to-indigo-950/30 sm:flex-row sm:items-center">
      <div className="grid size-11 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300"><Sparkles size={20}/></div>
      <div className="flex-1"><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Your MoneyCove is ready</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Start with your first income or expense. Your finance records stay locally on this device.</p></div>
      <button className="secondary-btn bg-white dark:bg-slate-900" onClick={onAdd}>Start tracking</button>
    </div>
  </div>
}
