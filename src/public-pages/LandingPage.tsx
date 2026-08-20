import { ArrowRight, BarChart3, Brain, Check, Cloud, FileText, PieChart, ReceiptText, ShieldCheck, Sparkles, WalletCards } from 'lucide-react'
import { SEO } from '../components/SEO'
import { PublicLayout } from './PublicLayout'

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MoneyCove',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: 'Expense tracker and budget planner with cloud sync, financial reports and optional AI budgeting guidance.',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
    { '@type': 'Offer', price: '5', priceCurrency: 'USD', name: 'Pro' },
  ],
}

export function LandingPage() {
  return <PublicLayout>
    <SEO title="MoneyCove — Expense Tracker & Budget Planner" description="Track income, expenses and budgets, sync your money data across devices and unlock optional AI-powered spending guidance." path="/" jsonLd={softwareJsonLd}/>
    <main>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0"><div className="absolute -left-32 -top-28 size-[34rem] rounded-full bg-teal-500/20 blur-3xl"/><div className="absolute -bottom-36 right-0 size-[34rem] rounded-full bg-indigo-500/20 blur-3xl"/><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:25px_25px] opacity-40"/></div>
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_.95fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-teal-200"><Sparkles size={15}/> Clarity for every money decision</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">See where your money goes. Decide what happens next.</h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">MoneyCove brings expense tracking, budgets, charts, cloud sync and premium AI guidance into one calm personal-finance dashboard.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="/signup" className="primary-btn min-w-40">Start free <ArrowRight size={17}/></a><a href="/features" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-extrabold text-white transition hover:bg-white/10">Explore features</a></div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400"><span className="flex items-center gap-1.5"><Check size={14} className="text-teal-300"/> Free plan</span><span className="flex items-center gap-1.5"><Check size={14} className="text-teal-300"/> Multi-device cloud sync</span><span className="flex items-center gap-1.5"><Check size={14} className="text-teal-300"/> Installable PWA</span></div>
          </div>
          <div className="relative">
            <div className="rounded-[32px] border border-white/10 bg-white/[.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-3xl bg-gradient-to-br from-teal-600 to-indigo-600 p-5"><WalletCards size={22}/><p className="mt-7 text-xs font-bold text-teal-100">Current balance</p><p className="mt-1 text-3xl font-black">USD 4,280</p><p className="mt-2 text-xs text-teal-100">Income minus expenses</p></div><div className="rounded-3xl bg-white p-5 text-slate-950"><BarChart3 className="text-indigo-600" size={22}/><p className="mt-7 text-xs font-bold text-slate-400">This month</p><p className="mt-1 text-3xl font-black">58.8%</p><p className="mt-2 text-xs font-semibold text-emerald-600">Savings rate</p></div></div>
              <div className="mt-3 rounded-3xl bg-white p-5 text-slate-950"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">Spending picture</p><h3 className="mt-1 text-xl font-black">Your month at a glance</h3></div><PieChart className="text-teal-600"/></div><div className="mt-5 grid gap-3"><div><div className="flex justify-between text-xs font-bold"><span>Rent</span><span>51%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 w-[51%] rounded-full bg-slate-800"/></div></div><div><div className="flex justify-between text-xs font-bold"><span>Food</span><span>18%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 w-[18%] rounded-full bg-teal-600"/></div></div><div><div className="flex justify-between text-xs font-bold"><span>Transport</span><span>10%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 w-[10%] rounded-full bg-indigo-500"/></div></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6"><div className="max-w-2xl"><div className="eyebrow">Everything connected</div><h2 className="mt-2 text-4xl font-black tracking-[-.04em]">One place for the money decisions you make every month.</h2><p className="mt-4 text-base font-medium leading-7 text-slate-500">Start with the essentials for free. Upgrade only when you want deeper reports and AI-powered guidance.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[[ReceiptText,'Track every transaction','Record income and expenses with categories, dates and notes.'],[PieChart,'Plan your budget','Set a monthly target and see how much remains as you spend.'],[BarChart3,'Understand patterns','Use category breakdowns and trends instead of guessing where money went.'],[Cloud,'Sync across devices','Your account keeps finance data available when you move between supported devices.'],[FileText,'Export your records','CSV and a monthly expense PDF are free. Pro adds premium branded statements, full financial reports and AI summary PDFs.'],[Brain,'Ask MoneyCove AI','Pro users can ask budgeting and spending questions using their own financial summary.']].map(([Icon,title,text]) => { const C=Icon as typeof ReceiptText; return <div key={String(title)} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_8px_35px_rgba(15,23,42,.04)]"><div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white"><C size={20}/></div><h3 className="mt-5 text-lg font-black">{String(title)}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-500">{String(text)}</p></div>})}
      </div></section>

      <section className="bg-slate-50"><div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2"><div><div className="eyebrow">Built for confidence</div><h2 className="mt-2 text-4xl font-black tracking-[-.04em]">Real accounts. Secure sessions. Clear controls.</h2><p className="mt-4 text-base font-medium leading-7 text-slate-500">MoneyCove uses account-based cloud storage so you can sign out, return later and continue from your saved data.</p><div className="mt-7 grid gap-3">{['Email and password account access','Remembered Supabase sessions','Row-level security for user finance data','Server-side AI and payment secrets','Simple account and data controls'].map(item=><div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700"><ShieldCheck size={18} className="text-teal-700"/>{item}</div>)}</div></div><div className="rounded-[32px] bg-slate-950 p-7 text-white"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-teal-300"><Brain size={16}/> MoneyCove Pro</div><h3 className="mt-4 text-3xl font-black tracking-[-.04em]">AI guidance that starts with your numbers.</h3><p className="mt-4 text-sm font-medium leading-6 text-slate-300">Ask questions such as “Why did I spend more this month?” or “Build a realistic budget for next month.” The adviser receives a structured summary of your MoneyCove data only when you choose to use it.</p><div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold text-slate-400">Example question</p><p className="mt-2 text-lg font-black">“Where can I cut spending without touching rent?”</p><p className="mt-4 text-sm leading-6 text-slate-300">MoneyCove AI compares categories, budget progress and recent patterns, then returns practical budgeting ideas—not investment recommendations.</p></div></div></div></section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6"><div className="rounded-[36px] bg-gradient-to-br from-teal-700 via-teal-700 to-indigo-700 px-6 py-12 text-center text-white sm:px-10"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10"><Sparkles/></div><h2 className="mx-auto mt-5 max-w-2xl text-4xl font-black tracking-[-.04em]">Start with clarity. Upgrade when you want more intelligence.</h2><p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-teal-50">The Free plan handles everyday tracking and budgeting. MoneyCove Pro is $5 per month for AI Adviser and premium reporting.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><a className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-teal-800" href="/signup">Create free account</a><a className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-black text-white" href="/pricing">Compare plans</a></div></div></section>
    </main>
  </PublicLayout>
}
