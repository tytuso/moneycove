import { Menu, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/features', 'Features'],
  ['/pricing', 'Pricing'],
  ['/blog', 'Blog'],
  ['/about', 'About'],
] as const

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  return <div className="min-h-dvh bg-white text-slate-950">
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a href="/" className="shrink-0"><Logo /></a>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map(([href,label]) => <a key={href} href={href} className="text-sm font-bold text-slate-500 transition hover:text-slate-950">{label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a className="secondary-btn" href={user?"/app#/dashboard":"/login"}>{user?"Dashboard":"Sign in"}</a>
          <a className="primary-btn" href={user?"/app#/dashboard":"/signup"}>{user?"Open MoneyCove":"Start free"}</a>
        </div>
        <button className="icon-btn md:hidden" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">{open ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
      {open && <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
        <div className="mx-auto grid max-w-[1200px] gap-2">
          {links.map(([href,label]) => <a key={href} href={href} className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50">{label}</a>)}
          <div className="mt-2 grid grid-cols-2 gap-2"><a className="secondary-btn" href={user?"/app#/dashboard":"/login"}>{user?"Dashboard":"Sign in"}</a><a className="primary-btn" href={user?"/app#/dashboard":"/signup"}>{user?"Open app":"Start free"}</a></div>
        </div>
      </div>}
    </header>
    {children}
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_.6fr_.6fr]">
        <div><div className="w-fit rounded-2xl bg-white px-4 py-3"><Logo/></div><p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-400">A calm expense tracker and budget planner for people who want clearer everyday money decisions.</p><p className="mt-5 text-xs font-semibold text-slate-500">MoneyCove is a product of Nile AI Solutions.</p></div>
        <div><h3 className="text-xs font-black uppercase tracking-[.18em] text-white">Product</h3><div className="mt-4 grid gap-3 text-sm font-semibold"><a href="/features">Features</a><a href="/pricing">Pricing</a><a href="/blog">Blog</a><a href={user?"/app#/dashboard":"/login"}>{user?"Dashboard":"Sign in"}</a></div></div>
        <div><h3 className="text-xs font-black uppercase tracking-[.18em] text-white">Company</h3><div className="mt-4 grid gap-3 text-sm font-semibold"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs font-semibold text-slate-500">© 2026 Nile AI Solutions. MoneyCove helps with budgeting and spending visibility; it does not provide investment, tax or legal advice.</div>
    </footer>
  </div>
}
