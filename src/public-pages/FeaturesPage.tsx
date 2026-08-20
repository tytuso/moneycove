import { BarChart3, Brain, CalendarDays, Cloud, FileDown, PieChart, ReceiptText, ShieldCheck, Smartphone } from 'lucide-react'
import { SEO } from '../components/SEO'
import { PublicLayout } from './PublicLayout'

const features = [
  [ReceiptText,'Income & expense tracking','Record transactions with category, date, description and optional notes. Search, filter, edit and delete whenever you need.'],
  [PieChart,'Monthly & category budgets','Set a monthly spending target and optional category limits so you can see progress before the month ends.'],
  [BarChart3,'Reports & visual trends','See income versus expenses, cumulative spending, savings rate and category breakdowns from a clean dashboard.'],
  [CalendarDays,'Financial calendar','Browse month and year views, spot transaction days with activity dots, and open any date to see exactly what moved.'],
  [Cloud,'Secure cloud sync','Commercial MoneyCove stores your finance state against your signed-in account so your session and records can follow you across devices.'],
  [FileDown,'CSV & premium PDF exports','Free users can export CSV and a monthly expense PDF. Pro users unlock branded transaction, budget, full monthly financial and AI summary PDFs.'],
  [Brain,'AI Money Adviser','Pro users can ask budgeting and spending questions using a structured summary of their own MoneyCove activity.'],
  [Smartphone,'Mobile-first PWA','Install MoneyCove from a supported browser and use a phone-friendly bottom navigation experience.'],
  [ShieldCheck,'Privacy-conscious architecture','Authentication, cloud data, payments and AI calls are separated so private server keys never ship in the browser bundle.'],
] as const

export function FeaturesPage(){
  return <PublicLayout><SEO title="MoneyCove Features — Expense Tracking, Budgets, Reports & AI" description="Explore MoneyCove features including expense tracking, budgets, cloud sync, financial reports, PWA support and the Pro AI Money Adviser." path="/features"/>
    <main className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:py-20"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow">Product features</div><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Everything you need to understand everyday money.</h1><p className="mt-5 text-base font-medium leading-7 text-slate-500">MoneyCove keeps the basics simple, then adds more intelligence when you need it.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2">{features.map(([Icon,title,text])=><div key={title} className="rounded-[28px] border border-slate-200 p-6 sm:p-7"><div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white"><Icon size={20}/></div><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-500">{text}</p></div>)}</div><div className="mt-12 rounded-[32px] bg-slate-950 p-8 text-white sm:flex sm:items-center sm:justify-between"><div><div className="text-xs font-black uppercase tracking-[.18em] text-teal-300">Ready to use it?</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Start free. No Pro payment required.</h2></div><a href="/signup" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-slate-950 sm:mt-0">Create account</a></div></main>
  </PublicLayout>
}
