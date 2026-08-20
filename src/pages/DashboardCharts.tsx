import { SpendingDonut } from '../components/Charts'
import { categoryTotals, formatCurrency, topCategory } from '../utils/finance'
import type { CurrencyCode, Transaction } from '../types'

export function ChartsDashboard({ transactions, currency }: { transactions: Transaction[]; currency: CurrencyCode }) {
  const totals = categoryTotals(transactions)
  const data = Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  const top = topCategory(transactions)
  return <section className="panel"><div className="panel-head"><div><div className="eyebrow">Spending picture</div><h2 className="section-title">Where your money went</h2></div></div>{data.length ? <div className="grid items-center md:grid-cols-[1fr_.8fr]"><SpendingDonut data={data} currency={currency}/><div className="space-y-3">{data.slice(0,5).map((d) => <div key={d.name} className="flex items-center justify-between gap-4"><span className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{d.name}</span><span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(d.value, currency)}</span></div>)}{top.category && <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"><strong className="text-slate-800 dark:text-slate-100">{top.category}</strong> is your biggest spending category this month.</div>}</div></div> : <div className="grid h-64 place-items-center text-sm font-semibold text-slate-400">Add expenses to unlock your spending chart.</div>}</section>
}
