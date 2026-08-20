import { useEffect, useState } from 'react'
import { Menu, Plus } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'
import { TransactionModal } from './components/TransactionModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'
import { MoreSheet } from './components/MoreSheet'
import { Logo } from './components/Logo'
import { Dashboard } from './pages/Dashboard'
import { TransactionsPage } from './pages/Transactions'
import { BudgetPage } from './pages/Budget'
import { ReportsPage } from './pages/Reports'
import { SettingsPage } from './pages/Settings'
import { AIAdviserPage } from './pages/AIAdviser'
import { BillingPage } from './pages/Billing'
import { CalendarPage } from './pages/Calendar'
import { FounderPage } from './pages/Founder'
import { useCloudFinance } from './hooks/useCloudFinance'
import { useHashPage } from './hooks/useHashPage'
import { useTheme } from './hooks/useTheme'
import { useSubscription } from './hooks/useSubscription'
import { useFounderAccess } from './hooks/useFounderAccess'
import { useAuth } from './context/AuthContext'
import { exportTransactionsCsv } from './utils/csv'
import type { Transaction } from './types'

export default function App() {
  const { user, loading: authLoading, displayName, signOut } = useAuth()
  const { state, setState, ready, syncStatus } = useCloudFinance(user?.id)
  const { plan, isPro, refresh: refreshPlan } = useSubscription(user?.id)
  const { isFounder } = useFounderAccess(user?.id, user?.email)
  const [page, setPage] = useHashPage()
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('pesapilot-sidebar-collapsed') === 'true')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [newTransactionDate, setNewTransactionDate] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ kind:'delete-tx'|'reset'; transaction?:Transaction } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  useTheme(state.settings.theme)

  useEffect(() => { localStorage.setItem('pesapilot-sidebar-collapsed', String(collapsed)) }, [collapsed])
  useEffect(() => {
    if (!authLoading && !user) window.location.replace('/login?next=%2Fapp%23%2Fdashboard')
  }, [authLoading, user])
  useEffect(() => {
    document.title = `MoneyCove · ${page === 'ai' ? 'AI Adviser' : page === 'billing' ? 'Plan & Billing' : page === 'founder' ? 'Founder Control' : page[0].toUpperCase()+page.slice(1)}`
  }, [page])

  if (authLoading || !user) return <div className="grid min-h-dvh place-items-center bg-slate-950 text-sm font-bold text-slate-300">Opening your MoneyCove account…</div>

  const userName = displayName || 'MoneyCove user'
  const userEmail = user.email || ''
  const notify = (message:string) => { setToast(message); window.setTimeout(()=>setToast(null),2200) }
  const openAdd = () => { setEditing(null); setNewTransactionDate(null); setModalOpen(true) }
  const openAddForDate = (date:string) => { setEditing(null); setNewTransactionDate(date); setModalOpen(true) }
  const upgrade = () => setPage('billing')

  const saveTransaction = (transaction:Transaction) => {
    setState(current => {
      const exists=current.transactions.some(t=>t.id===transaction.id)
      return { ...current, transactions: exists ? current.transactions.map(t=>t.id===transaction.id?transaction:t) : [transaction,...current.transactions] }
    })
    setModalOpen(false); setEditing(null); setNewTransactionDate(null)
    notify(state.transactions.some(t=>t.id===transaction.id)?'Transaction updated':'Transaction added successfully')
  }

  const confirmAction = () => {
    if (!confirm) return
    if (confirm.kind==='delete-tx' && confirm.transaction) {
      const id=confirm.transaction.id
      setState(current=>({...current,transactions:current.transactions.filter(t=>t.id!==id)}))
      notify('Transaction deleted')
    }
    if (confirm.kind==='reset') {
      setState(current=>({...current,transactions:[],monthlyBudget:0,categoryBudgets:[]}))
      setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))
      notify('Finance data reset. Your cloud workspace is now empty.')
    }
    setConfirm(null)
  }

  const logout = async () => {
    setModalOpen(false); setEditing(null); setNewTransactionDate(null); setMobileMoreOpen(false); setConfirm(null)
    await signOut()
    window.location.replace('/login')
  }

  let content: React.ReactNode
  if (!ready) {
    content = <section className="panel"><div className="grid min-h-64 place-items-center text-sm font-bold text-slate-400">Loading your finance workspace…</div></section>
  } else if (page==='transactions') {
    content = <TransactionsPage transactions={state.transactions} currency={state.settings.currency} userName={userName} isPro={isPro} onUpgrade={upgrade} onAdd={openAdd} onEdit={t=>{setEditing(t);setModalOpen(true)}} onDelete={t=>setConfirm({kind:'delete-tx',transaction:t})}/>
  } else if (page==='budget') {
    content = <BudgetPage transactions={state.transactions} month={month} budget={state.monthlyBudget} setBudget={v=>setState(current=>({...current,monthlyBudget:v}))} categoryBudgets={state.categoryBudgets} setCategoryBudgets={v=>setState(current=>({...current,categoryBudgets:v}))} currency={state.settings.currency} userName={userName} isPro={isPro} onUpgrade={upgrade} notify={notify}/>
  } else if (page==='reports') {
    content = <ReportsPage transactions={state.transactions} month={month} budget={state.monthlyBudget} categoryBudgets={state.categoryBudgets} currency={state.settings.currency} userName={userName} isPro={isPro} onUpgrade={upgrade}/>
  } else if (page==='ai') {
    content = <AIAdviserPage state={state} userName={userName} isPro={isPro} onUpgrade={upgrade}/>
  } else if (page==='billing') {
    content = <BillingPage plan={plan} userName={userName} userEmail={userEmail} refresh={refreshPlan}/>
  } else if (page==='calendar') {
    content = <CalendarPage transactions={state.transactions} currency={state.settings.currency} onAddDate={openAddForDate} onEdit={t=>{setEditing(t);setNewTransactionDate(null);setModalOpen(true)}} onDelete={t=>setConfirm({kind:'delete-tx',transaction:t})}/>
  } else if (page==='founder' && isFounder) {
    content = <FounderPage/>
  } else if (page==='settings') {
    content = <SettingsPage settings={state.settings} userName={userName} userEmail={userEmail} plan={plan} syncStatus={syncStatus} setSettings={settings=>setState(current=>({...current,settings}))} onExport={()=>{exportTransactionsCsv(state.transactions);notify('CSV export downloaded')}} onReset={()=>setConfirm({kind:'reset'})} onLogout={()=>void logout()} onBilling={upgrade}/>
  } else {
    content = <Dashboard transactions={state.transactions} month={month} setMonth={setMonth} budget={state.monthlyBudget} currency={state.settings.currency} userName={userName} onAdd={openAdd} onViewAll={()=>setPage('transactions')}/>
  }

  return <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} theme={state.settings.theme} toggleTheme={()=>setState(current=>({...current,settings:{...current.settings,theme:current.settings.theme==='dark'?'light':'dark'}}))} userName={userName} userEmail={userEmail} isPro={isPro} isFounder={isFounder} onLogout={()=>void logout()}/>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden"><Logo/><div className="flex items-center gap-2"><button className="icon-btn sm:hidden" onClick={()=>openAdd()}><Plus size={19}/></button><button className="icon-btn" onClick={()=>setMobileMoreOpen(true)} aria-label="Open more"><Menu size={19}/></button></div></header>
    <main className={`min-h-dvh pb-28 pt-7 transition-[padding] duration-200 lg:pb-10 lg:pt-10 ${collapsed?'lg:pl-[84px]':'lg:pl-[248px]'}`}><div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">{content}</div></main>
    <MobileNav page={page} setPage={setPage} onAdd={openAdd} onMore={()=>setMobileMoreOpen(true)}/>
    <MoreSheet open={mobileMoreOpen} onClose={()=>setMobileMoreOpen(false)} setPage={setPage} userName={userName} userEmail={userEmail} isPro={isPro} isFounder={isFounder} onLogout={()=>void logout()}/>
    <TransactionModal open={modalOpen} currency={state.settings.currency} transaction={editing} initialDate={newTransactionDate} onClose={()=>{setModalOpen(false);setEditing(null);setNewTransactionDate(null)}} onSave={saveTransaction}/>
    <ConfirmDialog open={Boolean(confirm)} requirePhrase={confirm?.kind==='reset'?'RESET':undefined} title={confirm?.kind==='reset'?'Reset all finance data?':'Delete this transaction?'} message={confirm?.kind==='reset'?'This clears all transactions, your monthly budget and category budgets from this MoneyCove account. This action cannot be undone.':'This action cannot be undone.'} confirmLabel={confirm?.kind==='reset'?'Reset data':'Delete'} onCancel={()=>setConfirm(null)} onConfirm={confirmAction}/>
    <Toast message={toast}/>
  </div>
}
