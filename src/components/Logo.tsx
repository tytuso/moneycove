export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-teal-600/15">M</div>
    {!compact && <div><div className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">MoneyCove</div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Clarity for every money decision</div></div>}
  </div>
}
