import { categoryTotals, filterByMonth, getTotals } from '../utils/finance'
import type { AppState } from '../types'

export function buildFinanceContext(state: AppState) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const transactions = filterByMonth(state.transactions, date)
    const totals = getTotals(transactions)
    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      income: totals.income,
      expenses: totals.expenses,
      savings: totals.savings,
      savingsRate: Number(totals.savingsRate.toFixed(1)),
      categories: categoryTotals(transactions),
    }
  })
  const recentTransactions = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 80)
    .map(({ type, amount, category, date, description }) => ({ type, amount, category, date, description }))

  return {
    currency: state.settings.currency,
    monthlyBudget: state.monthlyBudget,
    categoryBudgets: state.categoryBudgets,
    sixMonthSummary: months,
    recentTransactions,
  }
}
