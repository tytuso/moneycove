import type { Category, CurrencyCode, Transaction } from '../types'

export const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const filterByMonth = (transactions: Transaction[], month: Date) => {
  const key = getMonthKey(month)
  return transactions.filter((t) => t.date.startsWith(key))
}

export const totalByType = (transactions: Transaction[], type: 'income' | 'expense') =>
  transactions.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0)

export const getTotals = (transactions: Transaction[]) => {
  const income = totalByType(transactions, 'income')
  const expenses = totalByType(transactions, 'expense')
  return { income, expenses, balance: income - expenses, savings: income - expenses, savingsRate: income ? ((income - expenses) / income) * 100 : 0 }
}

export const categoryTotals = (transactions: Transaction[]) => transactions
  .filter((t) => t.type === 'expense')
  .reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})

export const budgetPercentage = (spent: number, budget: number) => budget > 0 ? (spent / budget) * 100 : 0

export const monthOverMonth = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export const formatCurrency = (amount: number, currency: CurrencyCode) => {
  const code = String(currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
    }).format(amount).replace(/\u00a0/g, ' ')
  } catch {
    return `${code} ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  }
}

export const formatCompactCurrency = (amount: number, currency: CurrencyCode) => {
  const code = String(currency || 'USD').toUpperCase()
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  if (abs < 1000) return formatCurrency(amount, code)
  const suffix = abs >= 1_000_000_000 ? 'B' : abs >= 1_000_000 ? 'M' : 'K'
  const divisor = abs >= 1_000_000_000 ? 1_000_000_000 : abs >= 1_000_000 ? 1_000_000 : 1_000
  return `${sign}${code} ${(abs / divisor).toFixed(abs >= 10_000_000 ? 0 : 1)}${suffix}`
}

export const getBudgetMessage = (percent: number) => {
  if (percent > 100) return "You've exceeded your monthly budget."
  if (percent > 80) return "You're getting close to your monthly budget limit."
  if (percent >= 50) return "You're halfway through your monthly budget."
  return "You're doing great. Your spending is under control."
}

export const topCategory = (transactions: Transaction[]): { category: Category | null; amount: number } => {
  const totals = categoryTotals(transactions)
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  return entries.length ? { category: entries[0][0] as Category, amount: entries[0][1] } : { category: null, amount: 0 }
}
