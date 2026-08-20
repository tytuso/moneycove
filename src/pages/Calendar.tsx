import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Plus, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react'
import { TransactionList } from '../components/TransactionList'
import { formatCurrency, getTotals } from '../utils/finance'
import type { CurrencyCode, Transaction } from '../types'

type CalendarView = 'month' | 'year'

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2026, index, 1).toLocaleDateString(undefined, { month: 'long' }))

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

function calendarGrid(cursor: Date) {
  const first = startOfMonth(cursor)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset)
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
}

export function CalendarPage({ transactions, currency, onAddDate, onEdit, onDelete }: { transactions: Transaction[]; currency: CurrencyCode; onAddDate: (date: string) => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void }) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => startOfMonth(today))
  const [view, setView] = useState<CalendarView>('month')
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(today))

  const byDate = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    transactions.forEach((transaction) => {
      const existing = map.get(transaction.date) ?? []
      existing.push(transaction)
      map.set(transaction.date, existing)
    })
    map.forEach((items) => items.sort((a, b) => b.amount - a.amount))
    return map
  }, [transactions])

  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
  const monthTransactions = useMemo(() => transactions.filter((transaction) => transaction.date.startsWith(monthPrefix)), [transactions, monthPrefix])
  const monthTotals = useMemo(() => getTotals(monthTransactions), [monthTransactions])
  const selectedTransactions = byDate.get(selectedDate) ?? []
  const selectedTotals = getTotals(selectedTransactions)
  const selectedDateObject = fromDateKey(selectedDate)
  const days = calendarGrid(cursor)

  const move = (direction: number) => {
    if (view === 'year') {
      setCursor(new Date(cursor.getFullYear() + direction, cursor.getMonth(), 1))
      return
    }
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1)
    setCursor(next)
    setSelectedDate(toDateKey(next))
  }

  const goToday = () => {
    const now = new Date()
    setCursor(startOfMonth(now))
    setSelectedDate(toDateKey(now))
    setView('month')
  }

  const selectDay = (date: Date) => {
    setSelectedDate(toDateKey(date))
    if (date.getMonth() !== cursor.getMonth() || date.getFullYear() !== cursor.getFullYear()) setCursor(startOfMonth(date))
  }

  const openMonth = (monthIndex: number) => {
    const next = new Date(cursor.getFullYear(), monthIndex, 1)
    setCursor(next)
    setSelectedDate(toDateKey(next))
    setView('month')
  }

  const visibleTitle = view === 'year'
    ? String(cursor.getFullYear())
    : cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return <div>
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="eyebrow">Financial calendar</div>
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">See exactly when money moved. Dates with transactions are marked with a red activity dot.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button className={`seg-btn ${view === 'month' ? 'seg-btn-active' : ''}`} onClick={() => setView('month')}>Month</button>
          <button className={`seg-btn ${view === 'year' ? 'seg-btn-active' : ''}`} onClick={() => setView('year')}>Year</button>
        </div>
        <button className="secondary-btn" onClick={goToday}>Today</button>
        <button className="primary-btn" onClick={() => onAddDate(selectedDate)}><Plus size={17}/> Add transaction</button>
      </div>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <section className="metric-card"><span className="metric-icon bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><TrendingUp size={19}/></span><div className="metric-label">Income this month</div><div className="metric-value">{formatCurrency(monthTotals.income, currency)}</div></section>
      <section className="metric-card"><span className="metric-icon bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"><TrendingDown size={19}/></span><div className="metric-label">Expenses this month</div><div className="metric-value">{formatCurrency(monthTotals.expenses, currency)}</div></section>
      <section className="metric-card"><span className="metric-icon bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><ReceiptText size={19}/></span><div className="metric-label">Transactions this month</div><div className="metric-value">{monthTransactions.length}</div></section>
    </div>

    <section className="panel mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="settings-icon text-teal-700"><CalendarDays size={19}/></span>
          <div><div className="eyebrow">{view === 'month' ? 'Month view' : 'Year overview'}</div><h2 className="section-title">{visibleTitle}</h2></div>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => move(-1)} aria-label={view === 'year' ? 'Previous year' : 'Previous month'}><ChevronLeft size={18}/></button>
          <button className="icon-btn" onClick={() => move(1)} aria-label={view === 'year' ? 'Next year' : 'Next month'}><ChevronRight size={18}/></button>
        </div>
      </div>

      {view === 'month' ? <>
        <div className="mt-6 grid grid-cols-7 border-b border-slate-100 pb-2 dark:border-slate-800">
          {dayNames.map((day) => <div key={day} className="px-1 text-center text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{day}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((date) => {
            const key = toDateKey(date)
            const dayTransactions = byDate.get(key) ?? []
            const isCurrentMonth = date.getMonth() === cursor.getMonth() && date.getFullYear() === cursor.getFullYear()
            const isSelected = key === selectedDate
            const isToday = key === toDateKey(today)
            return <button key={key} onClick={() => selectDay(date)} className={`group relative min-h-[66px] rounded-2xl border p-2 text-left transition sm:min-h-[92px] sm:p-3 ${isSelected ? 'border-teal-400 bg-teal-50/80 dark:border-teal-700 dark:bg-teal-500/10' : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'} ${!isCurrentMonth ? 'opacity-40' : ''}`}>
              <span className={`inline-grid size-7 place-items-center rounded-full text-xs font-black ${isToday ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-700 dark:text-slate-200'}`}>{date.getDate()}</span>
              {dayTransactions.length > 0 && <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 sm:bottom-3 sm:left-3 sm:right-3"><span className="size-2 shrink-0 rounded-full bg-rose-500"/><span className="hidden truncate text-[10px] font-extrabold text-slate-400 sm:inline">{dayTransactions.length} {dayTransactions.length === 1 ? 'transaction' : 'transactions'}</span></div>}
            </button>
          })}
        </div>
      </> : <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {monthNames.map((name, monthIndex) => {
          const prefix = `${cursor.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`
          const monthItems = transactions.filter((transaction) => transaction.date.startsWith(prefix))
          const totals = getTotals(monthItems)
          const activityDays = new Set(monthItems.map((transaction) => Number(transaction.date.slice(8, 10))))
          const daysInMonth = new Date(cursor.getFullYear(), monthIndex + 1, 0).getDate()
          return <button key={name} onClick={() => openMonth(monthIndex)} className="rounded-[22px] border border-slate-200/80 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800">
            <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-black text-slate-900 dark:text-white">{name}</div><div className="mt-1 text-[11px] font-bold text-slate-400">{monthItems.length} {monthItems.length === 1 ? 'transaction' : 'transactions'}</div></div>{monthItems.length > 0 && <span className="mt-1 size-2 rounded-full bg-rose-500"/>}</div>
            <div className="mt-4 flex gap-4 text-[11px] font-bold"><span className="text-emerald-600 dark:text-emerald-400">+ {formatCurrency(totals.income, currency)}</span><span className="text-rose-500">- {formatCurrency(totals.expenses, currency)}</span></div>
            <div className="mt-4 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1" aria-label={`${activityDays.size} active days in ${name}`}>
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => <span key={day} title={`${name} ${day}`} className={`h-1.5 rounded-full ${activityDays.has(day) ? 'bg-rose-500' : 'bg-slate-100 dark:bg-slate-800'}`}/>) }
            </div>
          </button>
        })}
      </div>}
    </section>

    {view === 'month' && <section className="panel mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="eyebrow">Selected day</div><h2 className="section-title">{selectedDateObject.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><p className="mt-1 text-xs font-semibold text-slate-400">{selectedTransactions.length ? `${selectedTransactions.length} financial ${selectedTransactions.length === 1 ? 'entry' : 'entries'} on this date.` : 'No money activity recorded on this date.'}</p></div>
        <button className="secondary-btn" onClick={() => onAddDate(selectedDate)}><Plus size={16}/> Add on this date</button>
      </div>
      {selectedTransactions.length > 0 ? <>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Income</div><div className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedTotals.income, currency)}</div></div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Expenses</div><div className="mt-1 text-sm font-black text-rose-500">{formatCurrency(selectedTotals.expenses, currency)}</div></div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Net movement</div><div className={`mt-1 text-sm font-black ${selectedTotals.balance >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-500'}`}>{formatCurrency(selectedTotals.balance, currency)}</div></div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-1 dark:border-slate-800"><TransactionList transactions={selectedTransactions} currency={currency} onEdit={onEdit} onDelete={onDelete}/></div>
      </> : <div className="mt-6 grid min-h-40 place-items-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center dark:border-slate-700 dark:bg-slate-800/30"><div><CircleDollarSign size={28} className="mx-auto text-slate-300 dark:text-slate-600"/><div className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">Nothing recorded here yet</div><p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Add an income or expense and this day will receive a red activity dot.</p></div></div>}
    </section>}
  </div>
}
