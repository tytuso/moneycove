import { ArrowDownRight, ArrowUpRight, Landmark, WalletCards } from 'lucide-react'
import { budgetPercentage, formatCurrency } from '../utils/finance'
import type { CurrencyCode } from '../types'

export function SummaryCards({ income, expenses, balance, budget, currency }: { income: number; expenses: number; balance: number; budget: number; currency: CurrencyCode }) {
  const used = budgetPercentage(expenses, budget)
  const remaining = Math.max(0, budget - expenses)
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article className="metric-card metric-featured">
      <div className="metric-icon bg-white/15 text-white"><WalletCards size={20}/></div>
      <p className="metric-label !text-teal-50/80">Current balance</p>
      <p className="metric-value !text-white">{formatCurrency(balance, currency)}</p>
      <p className="mt-2 text-xs font-semibold text-teal-50/70">Income minus expenses</p>
    </article>
    <article className="metric-card"><div className="metric-icon bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><ArrowUpRight size={20}/></div><p className="metric-label">Total income</p><p className="metric-value">{formatCurrency(income, currency)}</p><p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600"><ArrowUpRight size={13}/> Money in</p></article>
    <article className="metric-card"><div className="metric-icon bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><ArrowDownRight size={20}/></div><p className="metric-label">Total expenses</p><p className="metric-value">{formatCurrency(expenses, currency)}</p><p className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-600"><ArrowDownRight size={13}/> Money out</p></article>
    <article className="metric-card"><div className="flex items-start justify-between"><div className="metric-icon bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"><Landmark size={20}/></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-500 dark:bg-slate-800">{Math.round(used)}%</span></div><p className="metric-label">Monthly budget</p><p className="metric-value">{formatCurrency(budget, currency)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${used > 100 ? 'bg-rose-500' : used > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(used, 100)}%` }}/></div><p className="mt-2 text-xs font-semibold text-slate-500">{formatCurrency(expenses, currency)} used · {formatCurrency(remaining, currency)} left</p></article>
  </div>
}
