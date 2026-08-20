import { useEffect, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { categoryIcons, expenseCategories, incomeCategories } from '../data/categories'
import type { CurrencyCode, Transaction, TransactionType } from '../types'

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10)

export function TransactionModal({ open, currency, transaction, initialDate, onClose, onSave }: { open: boolean; currency: CurrencyCode; transaction?: Transaction | null; initialDate?: string | null; onClose: () => void; onSave: (transaction: Transaction) => void }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType(transaction?.type ?? 'expense')
    setAmount(transaction ? String(transaction.amount) : '')
    setDescription(transaction?.description ?? '')
    setCategory(transaction?.category ?? (transaction?.type === 'income' ? 'Salary' : 'Food'))
    setDate(transaction?.date ?? initialDate ?? today())
    setNote(transaction?.note ?? '')
    setError('')
  }, [open, transaction, initialDate])

  const categories = useMemo(() => type === 'income' ? incomeCategories : expenseCategories, [type])
  useEffect(() => { if (!categories.includes(category as never)) setCategory(categories[0]) }, [type, categories, category])

  if (!open) return null
  const numeric = Number(amount)
  const displayAmount = Number.isFinite(numeric) && numeric > 0 ? new Intl.NumberFormat().format(numeric) : '0'
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !Number.isFinite(numeric) || numeric <= 0 || !date) { setError('Add a valid amount, description and date.'); return }
    onSave({ id: transaction?.id ?? crypto.randomUUID(), type, amount: numeric, description: description.trim(), category: category as Transaction['category'], date, note: note.trim() || undefined })
  }

  return <div className="modal-backdrop"><form onSubmit={submit} className="dialog-card max-h-[92vh] max-w-2xl overflow-y-auto">
    <div className="sticky -top-6 z-10 -mx-6 -mt-6 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><div><h2 className="text-xl font-black text-slate-900 dark:text-white">{transaction ? 'Edit transaction' : 'Add transaction'}</h2><p className="mt-1 text-xs font-semibold text-slate-400">Keep your money picture up to date.</p></div><button type="button" onClick={onClose} className="icon-btn"><X size={18}/></button></div>
    <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800"><button type="button" className={`seg-btn ${type === 'expense' ? 'seg-btn-active' : ''}`} onClick={() => setType('expense')}>Expense</button><button type="button" className={`seg-btn ${type === 'income' ? 'seg-btn-active' : ''}`} onClick={() => setType('income')}>Income</button></div>
    <div className="mt-5"><label className="field-label">Amount</label><div className="amount-input-wrap"><span>{currency}</span><input autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0" aria-label="Amount"/></div><p className="mt-1.5 text-right text-xs font-bold text-slate-400">{currency} {displayAmount}</p></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="field-label">Description</span><input className="field-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries"/></label><label><span className="field-label">Date</span><input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)}/></label></div>
    <div className="mt-4"><span className="field-label">Category</span><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{categories.map((cat) => { const Icon = categoryIcons[cat as keyof typeof categoryIcons]; return <button type="button" key={cat} onClick={() => setCategory(cat)} className={`category-btn ${category === cat ? 'category-btn-active' : ''}`}><span className="relative"><Icon size={18}/>{category === cat && <Check size={10} className="absolute -right-2 -top-2 rounded-full bg-teal-600 p-0.5 text-white"/>}</span><span className="truncate">{cat}</span></button>})}</div></div>
    <label className="mt-4 block"><span className="field-label">Note <span className="font-medium text-slate-400">(optional)</span></span><textarea className="field-input min-h-20 resize-none" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth remembering?"/></label>
    {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 dark:bg-rose-500/10">{error}</p>}
    <div className="mt-6 flex justify-end gap-2"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn">{transaction ? 'Save changes' : 'Add transaction'}</button></div>
  </form></div>
}
