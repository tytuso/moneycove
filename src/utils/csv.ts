import type { Transaction } from '../types'

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export const exportTransactionsCsv = (transactions: Transaction[]) => {
  const rows = [
    ['Date', 'Type', 'Category', 'Description', 'Amount', 'Notes'],
    ...transactions.map((t) => [t.date, t.type, t.category, t.description, t.amount, t.note ?? ''])
  ]
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const now = new Date()
  a.href = url
  a.download = `moneycove-transactions-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
