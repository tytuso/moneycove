import { Cell, Line, LineChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurrencyCode } from '../types'
import { formatCompactCurrency, formatCurrency } from '../utils/finance'

const palette = ['#0f766e','#4f46e5','#f59e0b','#e11d48','#0ea5e9','#8b5cf6','#14b8a6','#f97316']
const tooltipStyle = { borderRadius: 14, border: '1px solid rgba(148,163,184,.25)', boxShadow: '0 12px 28px rgba(15,23,42,.10)' }

export function SpendingDonut({ data, currency }: { data: { name: string; value: number }[]; currency: CurrencyCode }) {
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">{data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]}/>)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer></div>
}

export function IncomeExpenseBars({ data, currency }: { data: { month: string; income: number; expenses: number }[]; currency: CurrencyCode }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="rgba(148,163,184,.18)"/><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => formatCompactCurrency(v, currency)}/><Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={tooltipStyle}/><Bar dataKey="income" fill="#10b981" radius={[6,6,0,0]}/><Bar dataKey="expenses" fill="#6366f1" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
}

export function SpendingTrend({ data, currency }: { data: { label: string; value: number }[]; currency: CurrencyCode }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><CartesianGrid vertical={false} stroke="rgba(148,163,184,.18)"/><XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => formatCompactCurrency(v, currency)}/><Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={tooltipStyle}/><Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={false} activeDot={{ r: 5 }}/></LineChart></ResponsiveContainer></div>
}
