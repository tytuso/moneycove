import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MonthPicker({ month, onChange }: { month: Date; onChange: (month: Date) => void }) {
  const shift = (delta: number) => onChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))
  return <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <button onClick={() => shift(-1)} className="icon-btn" aria-label="Previous month"><ChevronLeft size={17}/></button>
    <div className="min-w-32 px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-200">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
    <button onClick={() => shift(1)} className="icon-btn" aria-label="Next month"><ChevronRight size={17}/></button>
  </div>
}
