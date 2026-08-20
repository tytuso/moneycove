import { useEffect, useState } from 'react'
import { Cloud, Download, FileSpreadsheet, FileText, LogOut, RotateCcw, Save, ShieldCheck } from 'lucide-react'
import { Logo } from '../components/Logo'
import { CURRENCY_CODES, currencyName } from '../data/currencies'
import type { SyncStatus } from '../hooks/useCloudFinance'
import type { PlanState } from '../hooks/useSubscription'
import type { CurrencyCode, ThemeMode, UserSettings } from '../types'
import { APP_VERSION } from '../version'

export function SettingsPage({ settings, userName, userEmail, plan, syncStatus, setSettings, onExportCsv, onExportPdf, onUpdateDisplayName, onReset, onLogout, onBilling }: {
  settings: UserSettings
  userName: string
  userEmail: string
  plan: PlanState
  syncStatus: SyncStatus
  setSettings: (s: UserSettings) => void
  onExportCsv: () => void
  onExportPdf: () => void
  onUpdateDisplayName: (name: string) => Promise<void>
  onReset: () => void
  onLogout: () => void
  onBilling: () => void
}) {
  const themes: ThemeMode[] = ['light', 'dark', 'system']
  const [displayName, setDisplayName] = useState(userName)
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState('')
  const syncCopy = { loading: 'Loading cloud data…', saving: 'Saving changes…', synced: 'Cloud data synced', offline: 'Offline · changes cached locally', error: 'Cloud sync needs attention' }[syncStatus]

  useEffect(() => setDisplayName(userName), [userName])

  const saveDisplayName = async () => {
    const next = displayName.trim().replace(/\s+/g, ' ')
    if (next.length < 2) { setNameMessage('Enter at least 2 characters.'); return }
    setSavingName(true)
    setNameMessage('')
    try {
      await onUpdateDisplayName(next)
      setNameMessage('Display name updated.')
    } catch (error) {
      setNameMessage(error instanceof Error ? error.message : 'Could not update display name.')
    } finally {
      setSavingName(false)
    }
  }

  return <div>
    <div><div className="eyebrow">Preferences & account</div><h1 className="page-title">Settings</h1><p className="page-subtitle">Adjust your account experience, base currency, appearance and finance data.</p></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.8fr]">
      <section className="panel">
        <div className="panel-head"><div><div className="eyebrow">Profile</div><h2 className="section-title">Account & preferences</h2></div></div>
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-indigo-600 text-sm font-black text-white">{userName.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{userName}</div><div className="mt-1 truncate text-xs font-semibold text-slate-400">{userEmail}</div></div>
          <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] ${plan.tier === 'pro' ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{plan.tier}</div>
        </div>
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-slate-100 p-3 text-xs font-bold text-slate-500 dark:border-slate-800"><Cloud size={16} className="text-teal-600" />{syncCopy}</div>

        <div className="mb-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="field-label">Display name</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="field-input flex-1" value={displayName} maxLength={80} onChange={e => setDisplayName(e.target.value)} placeholder="How your name appears in MoneyCove" />
            <button type="button" className="primary-btn shrink-0" disabled={savingName || displayName.trim() === userName.trim()} onClick={() => void saveDisplayName()}><Save size={16} />{savingName ? 'Saving…' : 'Save name'}</button>
          </div>
          <div className={`mt-2 text-xs font-semibold ${nameMessage.includes('updated') ? 'text-teal-600' : 'text-slate-400'}`}>{nameMessage || 'Used in greetings, reports, PDFs and your account profile.'}</div>
        </div>

        <label className="block"><span className="field-label">Base currency</span><select className="field-input" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value as CurrencyCode })}>{CURRENCY_CODES.map(code => <option key={code} value={code}>{code} — {currencyName(code)}</option>)}</select><span className="mt-2 block text-xs font-semibold leading-5 text-slate-400">New accounts start in USD. Changing this setting changes how amounts are displayed; it does not convert historical amounts using exchange rates.</span></label>
        <div className="mt-5"><span className="field-label">Theme</span><div className="grid grid-cols-3 gap-2">{themes.map(theme => <button key={theme} className={`seg-btn capitalize ${settings.theme === theme ? 'seg-btn-active' : ''}`} onClick={() => setSettings({ ...settings, theme })}>{theme}</button>)}</div></div>
      </section>

      <section className="panel">
        <div className="panel-head"><div><div className="eyebrow">Data & access</div><h2 className="section-title">Account controls</h2></div></div>
        <div className="space-y-3">
          <div className="rounded-[22px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
            <div className="flex items-start gap-3"><span className="settings-icon"><Download size={18} /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-extrabold text-slate-800 dark:text-slate-100">Export transactions</strong><small className="mt-0.5 block text-xs font-semibold leading-5 text-slate-400">Take your current records with you as a spreadsheet or a polished MoneyCove statement.</small></span></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="secondary-btn min-w-0 px-3" onClick={onExportCsv}><FileSpreadsheet size={16} /><span>CSV</span></button>
              <button type="button" className="primary-btn min-w-0 px-3" onClick={onExportPdf}><FileText size={16} /><span>Premium PDF</span></button>
            </div>
          </div>
          <button className="settings-action" onClick={onBilling}><span className="settings-icon text-indigo-600"><ShieldCheck size={18} /></span><span><strong>Plan & billing</strong><small>View Free or Pro status and renew paid access.</small></span></button>
          <button className="settings-action group" onClick={onReset}><span className="settings-icon text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10"><RotateCcw size={18} /></span><span><strong className="text-rose-600">Reset all finance data</strong><small>Clear transactions, monthly budget and category budgets from this account.</small></span></button>
          <button className="settings-action group" onClick={onLogout}><span className="settings-icon text-slate-500"><LogOut size={18} /></span><span><strong>Log out</strong><small>Sign out of this device. Your saved cloud finance data remains in your account.</small></span></button>
        </div>
      </section>
    </div>
    <section className="panel mt-6 flex flex-col gap-5 sm:flex-row sm:items-center"><Logo /><div className="flex-1"><div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Built as a global personal finance workspace.</div><div className="mt-1 text-xs font-semibold leading-5 text-slate-400">MoneyCove v{APP_VERSION} · Cloud-synced account data · Free and Pro plans</div></div></section>
  </div>
}
