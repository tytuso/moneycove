import { Brain, FileDown, Infinity as InfinityIcon, LockKeyhole, MessageSquarePlus, Send, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { exportAiSummaryPdf } from '../utils/pdf'
import { parseAiContent } from '../utils/aiText'
import type { AppState } from '../types'

const prompts = [
  'Summarize my finances this month and tell me what stands out.',
  'Where can I reduce spending without touching essentials?',
  'Build a realistic budget for next month from my recent spending.',
  'Which spending category should I watch most closely?',
  'How is my savings rate changing over the last six months?',
  'What are three practical money habits I should focus on next?',
]

type AiStatus = { founder: boolean; limit: number | null; used: number; remaining: number | null }
type Conversation = { id: string; title: string; createdAt: string; updatedAt: string }
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }

type ApiPayload = {
  founder?: boolean
  limit?: number | null
  used?: number
  remaining?: number | null
  conversations?: Conversation[]
  conversation?: Conversation
  messages?: ChatMessage[]
  conversationId?: string
  answer?: string
  error?: string
}

async function invokeAi(body: Record<string, unknown>, allowRetry = true) {
  if (!supabase) throw new Error('MoneyCove cloud services are not configured.')
  const { data, error } = await supabase.functions.invoke('moneycove-ai-adviser', { body })
  if (error) {
    let message = 'AI Adviser could not respond.'
    let status = 0
    try {
      status = Number(error.context?.status || 0)
      const context = await error.context?.clone?.().json?.() ?? await error.context?.json?.()
      if (context?.error) message = context.error
    } catch {}

    const authFailure = status === 401 || /session.*(invalid|expired)|invalid.*session|jwt/i.test(message)
    if (allowRetry && authFailure) {
      const refreshed = await supabase.auth.refreshSession()
      if (!refreshed.error && refreshed.data.session) return invokeAi(body, false)
    }
    throw new Error(message)
  }
  const payload = (data || {}) as ApiPayload
  if (payload.error) throw new Error(payload.error)
  return payload
}

export function AIAdviserPage({ state, userName, isPro, onUpgrade }: { state: AppState; userName: string; isPro: boolean; onUpgrade: () => void }) {
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const refreshConversations = async (preferredId?: string | null) => {
    const data = await invokeAi({ action: 'conversations' })
    const next = data.conversations || []
    setConversations(next)
    const target = preferredId || activeConversationId || next[0]?.id || null
    if (target) await openConversation(target, false)
  }

  const openConversation = async (id: string, showLoading = true) => {
    if (showLoading) setLoadingChat(true)
    setError('')
    try {
      const data = await invokeAi({ action: 'messages', conversationId: id })
      setActiveConversationId(id)
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open this conversation.')
    } finally {
      if (showLoading) setLoadingChat(false)
    }
  }

  useEffect(() => {
    if (!isPro || !supabase) return
    let alive = true
    ;(async () => {
      try {
        const [statusData, conversationData] = await Promise.all([
          invokeAi({ action: 'status' }),
          invokeAi({ action: 'conversations' }),
        ])
        if (!alive) return
        setStatus({
          founder: Boolean(statusData.founder),
          limit: statusData.limit ?? null,
          used: statusData.used || 0,
          remaining: statusData.remaining ?? null,
        })
        const next = conversationData.conversations || []
        setConversations(next)
        if (next[0]?.id) {
          const messageData = await invokeAi({ action: 'messages', conversationId: next[0].id })
          if (!alive) return
          setActiveConversationId(next[0].id)
          setMessages(messageData.messages || [])
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Could not load AI conversations.')
      }
    })()
    return () => { alive = false }
  }, [isPro])

  const latestPair = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role !== 'assistant') continue
      const assistant = messages[index]
      for (let q = index - 1; q >= 0; q -= 1) {
        if (messages[q].role === 'user') return { question: messages[q].content, answer: assistant.content }
      }
    }
    return null
  }, [messages])

  if (!isPro) {
    return <div><div className="eyebrow">MoneyCove Pro</div><h1 className="page-title">AI Money Adviser</h1><p className="page-subtitle">Ask budgeting and spending questions using the financial records already saved in your account.</p><section className="panel mt-6 overflow-hidden"><div className="mx-auto max-w-2xl py-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-950 text-white"><LockKeyhole size={24}/></div><div className="mt-5 text-xs font-black uppercase tracking-[.18em] text-teal-700">Pro feature</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-slate-950 dark:text-white">Turn your money history into practical next steps.</h2><p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">MoneyCove AI reviews your saved income, expenses, category totals and budgets when you ask a question. It focuses on everyday money organization—not investment recommendations.</p><div className="mt-6 grid gap-2 text-left sm:grid-cols-2">{prompts.slice(0,4).map(p=><div key={p} className="rounded-2xl bg-slate-50 p-4 text-xs font-bold leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Sparkles size={15} className="mb-2 text-teal-600"/>{p}</div>)}</div><button className="primary-btn mt-7" onClick={onUpgrade}>Upgrade to Pro — $5/month</button></div></section></div>
  }

  const startNew = () => {
    setActiveConversationId(null)
    setMessages([])
    setQuestion('')
    setError('')
  }

  const ask = async (event?: FormEvent) => {
    event?.preventDefault()
    const clean = question.trim()
    if (!clean || busy || !supabase) return
    setBusy(true)
    setError('')
    const optimisticUser: ChatMessage = { id: `local-${Date.now()}`, role: 'user', content: clean, createdAt: new Date().toISOString() }
    setMessages(current => [...current, optimisticUser])
    setQuestion('')
    try {
      const data = await invokeAi({ action: 'ask', question: clean, conversationId: activeConversationId })
      const conversationId = data.conversationId || activeConversationId
      if (conversationId) {
        setActiveConversationId(conversationId)
        setMessages(data.messages || [])
        setConversations(data.conversations || conversations)
      } else if (data.answer) {
        setMessages(current => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.answer || '', createdAt: new Date().toISOString() }])
      }
      setStatus(current => ({
        founder: Boolean(data.founder ?? current?.founder),
        limit: data.limit ?? current?.limit ?? 40,
        used: data.founder ? (current?.used || 0) + 1 : Math.max(0, (data.limit || 40) - (data.remaining ?? 0)),
        remaining: data.remaining ?? null,
      }))
    } catch (err) {
      setMessages(current => current.filter(message => message.id !== optimisticUser.id))
      setQuestion(clean)
      setError(err instanceof Error ? err.message : 'AI Adviser could not respond.')
    } finally {
      setBusy(false)
    }
  }

  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow">MoneyCove Pro</div><h1 className="page-title">AI Money Adviser</h1><p className="page-subtitle">Your conversations stay saved to your MoneyCove account, so you can continue where you left off.</p></div>{status?.founder?<div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-xs font-extrabold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"><InfinityIcon size={15}/> Founder · unlimited AI</div>:status?.remaining!==null&&status?.remaining!==undefined?<div className="rounded-full bg-teal-50 px-3 py-2 text-xs font-extrabold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{status.remaining} of 40 AI requests left this month</div>:null}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[.62fr_1.38fr]">
      <aside className="panel h-fit xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3"><div><div className="eyebrow">Recent</div><h2 className="section-title mt-1">Conversations</h2></div><button type="button" className="icon-btn" onClick={startNew} aria-label="New conversation"><MessageSquarePlus size={18}/></button></div>
        <div className="mt-4 grid gap-2">
          {conversations.length ? conversations.slice(0,4).map(conversation => <button key={conversation.id} type="button" onClick={()=>void openConversation(conversation.id)} className={`rounded-2xl border p-4 text-left transition ${activeConversationId===conversation.id?'border-teal-300 bg-teal-50/70 dark:border-teal-800 dark:bg-teal-500/10':'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'}`}><div className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-800 dark:text-slate-100">{conversation.title}</div><div className="mt-2 text-[11px] font-bold text-slate-400">{new Date(conversation.updatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div></button>) : <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold leading-6 text-slate-400 dark:border-slate-800">Your latest four MoneyCove AI conversations will appear here.</div>}
        </div>
        <button type="button" className="secondary-btn mt-4 w-full justify-center" onClick={startNew}><MessageSquarePlus size={15}/> New conversation</button>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"><Brain size={16} className="mb-2 text-indigo-600"/>Your finance data stays in your MoneyCove account. MoneyCove AI is for budgeting and money organization, not investment, tax, legal or credit advice.</div>
      </aside>

      <section className="panel min-h-[560px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800"><div><div className="eyebrow">Conversation</div><div className="mt-1 text-base font-black text-slate-950 dark:text-white">{activeConversationId ? conversations.find(item=>item.id===activeConversationId)?.title || 'MoneyCove conversation' : 'New conversation'}</div></div>{latestPair&&<button type="button" className="secondary-btn" onClick={()=>exportAiSummaryPdf({messages,userName,currency:state.settings.currency,conversationTitle:conversations.find(item=>item.id===activeConversationId)?.title || 'MoneyCove conversation'})}><FileDown size={15}/> Download conversation PDF</button>}</div>

        <div className="py-5">
          {loadingChat ? <div className="grid min-h-56 place-items-center text-sm font-bold text-slate-400">Opening conversation…</div> : messages.length ? <div className="space-y-5">{messages.map(message => message.role==='user' ? <div key={message.id} className="ml-auto max-w-[88%] rounded-[22px] rounded-br-md bg-slate-950 px-4 py-3 text-sm font-semibold leading-6 text-white dark:bg-white dark:text-slate-950">{message.content}</div> : <div key={message.id} className="max-w-[96%] rounded-[22px] rounded-bl-md bg-slate-50 px-5 py-4 dark:bg-slate-900"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-teal-700 dark:text-teal-300"><Sparkles size={14}/> MoneyCove AI</div><div className="space-y-3 text-sm font-medium leading-7 text-slate-700 dark:text-slate-300">{parseAiContent(message.content).map((block,index)=>block.kind==='heading'?<h3 key={index} className="pt-1 text-base font-black tracking-[-.02em] text-slate-950 dark:text-white">{block.text}</h3>:block.kind==='bullet'?<div key={index} className="flex gap-3"><span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-teal-500"/><span>{block.text}</span></div>:block.kind==='table'?<div key={index} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><tbody>{block.rows.map((row,rowIndex)=><tr key={rowIndex} className={rowIndex===0?'bg-slate-950 font-extrabold text-white':'border-t border-slate-100 dark:border-slate-800'}>{row.map((cell,cellIndex)=><td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table></div></div>:<p key={index}>{block.text}</p>)}</div></div>)}</div> : <div className="py-6"><div className="mx-auto max-w-xl text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"><Sparkles size={21}/></div><h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">What would you like to understand?</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-500">Ask about the financial records already saved in your MoneyCove account.</p></div></div>}

          {!messages.length && <div className="mt-2"><div className="mb-3 text-xs font-black uppercase tracking-[.14em] text-slate-400">Quick questions</div><div className="flex flex-wrap gap-2">{prompts.slice(0,4).map(prompt=><button key={prompt} type="button" onClick={()=>setQuestion(prompt)} className="rounded-full border border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-teal-800 dark:hover:bg-teal-500/10">{prompt}</button>)}</div></div>}
        </div>

        {error&&<div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
        <form onSubmit={ask} className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800"><label className="field-label">Ask MoneyCove</label><textarea className="field-input min-h-24 resize-y py-3" value={question} onChange={event=>setQuestion(event.target.value)} placeholder="Ask a follow-up or start a new money question…" maxLength={800}/><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-semibold text-slate-400">Conversations are saved automatically to your account.</span><button className="primary-btn justify-center" disabled={busy||!question.trim()}>{busy?'Thinking…':<>Ask adviser <Send size={16}/></>}</button></div></form>
      </section>
    </div>
  </div>
}
