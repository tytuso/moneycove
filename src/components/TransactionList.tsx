import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { categoryIcons } from '../data/categories'
import { formatCurrency } from '../utils/finance'
import type { CurrencyCode, Transaction } from '../types'

export function TransactionList({ transactions, currency, compact = false, onEdit, onDelete }: { transactions: Transaction[]; currency: CurrencyCode; compact?: boolean; onEdit?: (t: Transaction) => void; onDelete?: (t: Transaction) => void }) {
  return <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
    {transactions.map((t) => {
      const Icon = categoryIcons[t.category as keyof typeof categoryIcons] ?? MoreHorizontal
      return <div key={t.id} className="transaction-row group flex min-w-0 items-center gap-2.5 py-3.5 sm:gap-3">
        <div className={`transaction-icon grid size-10 shrink-0 place-items-center rounded-2xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><Icon size={18}/></div>
        <div className="min-w-0 flex-1">
          <div className="transaction-description truncate font-bold text-slate-800 dark:text-slate-100">{t.description}</div>
          <div className="transaction-meta mt-0.5 flex min-w-0 items-center gap-1.5 font-semibold text-slate-400"><span className="truncate">{t.category}</span><span className="shrink-0">•</span><time className="shrink-0">{new Date(`${t.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></div>
        </div>
        <div className="transaction-amount-wrap min-w-0 shrink-0 text-right"><div className={`transaction-amount whitespace-nowrap font-extrabold tracking-[-0.035em] ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</div></div>
        {!compact && <div className="transaction-actions flex shrink-0 gap-0.5 opacity-100 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100"><button className="icon-btn transaction-action-btn" onClick={() => onEdit?.(t)} aria-label="Edit transaction"><Pencil size={15}/></button><button className="icon-btn transaction-action-btn text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => onDelete?.(t)} aria-label="Delete transaction"><Trash2 size={15}/></button></div>}
      </div>
    })}
  </div>
}
