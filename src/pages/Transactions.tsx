import { FileDown, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { TransactionList } from '../components/TransactionList'
import { expenseCategories, incomeCategories } from '../data/categories'
import { exportTransactionsPdf } from '../utils/pdf'
import type { CurrencyCode, Transaction } from '../types'

export function TransactionsPage({ transactions, currency, userName, isPro, onUpgrade, onAdd, onEdit, onDelete }: { transactions: Transaction[]; currency: CurrencyCode; userName: string; isPro: boolean; onUpgrade: () => void; onAdd: () => void; onEdit: (t: Transaction) => void; onDelete: (t: Transaction) => void }) {
  const [type, setType] = useState<'all'|'income'|'expense'>('all')
  const [category, setCategory] = useState('all')
  const [period, setPeriod] = useState<'all'|'current'|'previous'|'custom'>('all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const filtered = useMemo(() => {
    const now = new Date(); const current = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; const prevD = new Date(now.getFullYear(), now.getMonth()-1, 1); const previous = `${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`
    return [...transactions].filter((t) => type === 'all' || t.type === type).filter((t) => category === 'all' || t.category === category).filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase())).filter((t) => period === 'all' || (period === 'current' && t.date.startsWith(current)) || (period === 'previous' && t.date.startsWith(previous)) || (period === 'custom' && (!from || t.date >= from) && (!to || t.date <= to))).sort((a,b) => b.date.localeCompare(a.date))
  }, [transactions, type, category, period, search, from, to])
  return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow">Money activity</div><h1 className="page-title">Transactions</h1><p className="page-subtitle">Search, filter, edit and clean up your financial records.</p></div><div className="flex flex-wrap gap-2"><button className="secondary-btn" onClick={()=>isPro?exportTransactionsPdf({ transactions: filtered, currency, userName, title: 'Transaction Statement' }):onUpgrade()}><FileDown size={17}/> Export PDF {!isPro&&<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-400 dark:bg-slate-800">PRO</span>}</button><button className="primary-btn hidden sm:inline-flex" onClick={onAdd}><Plus size={17}/> Add Transaction</button></div></div>
    <section className="panel mt-6"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]"><label className="search-box"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search descriptions..."/></label><select className="filter-select" value={type} onChange={(e) => setType(e.target.value as typeof type)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select><select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{[...new Set([...incomeCategories, ...expenseCategories])].map((c) => <option key={c}>{c}</option>)}</select><select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}><option value="all">All dates</option><option value="current">Current month</option><option value="previous">Previous month</option><option value="custom">Custom range</option></select></div>{period === 'custom' && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60"><SlidersHorizontal size={16} className="text-slate-400"/><input type="date" className="filter-select" value={from} onChange={(e) => setFrom(e.target.value)}/><span className="text-xs font-bold text-slate-400">to</span><input type="date" className="filter-select" value={to} onChange={(e) => setTo(e.target.value)}/></div>}
    <div className="mt-4 border-t border-slate-100 pt-2 dark:border-slate-800">{filtered.length ? <TransactionList transactions={filtered} currency={currency} onEdit={onEdit} onDelete={onDelete}/> : <EmptyState onAdd={onAdd}/>}</div></section>
  </div>
}
