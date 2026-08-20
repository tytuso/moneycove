import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import type { CategoryBudget, CurrencyCode, Transaction } from '../types'
import { budgetPercentage, categoryTotals, filterByMonth, getTotals, monthOverMonth, topCategory } from './finance'
import { parseAiContent } from './aiText'

type RGB = [number, number, number]
type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

export interface PdfReportContext {
  userName: string
  transactions: Transaction[]
  month: Date
  budget: number
  categoryBudgets: CategoryBudget[]
  currency: CurrencyCode
}

const C = {
  ink: [15, 23, 42] as RGB,
  slate: [71, 85, 105] as RGB,
  muted: [148, 163, 184] as RGB,
  line: [226, 232, 240] as RGB,
  paper: [248, 250, 252] as RGB,
  teal: [15, 118, 110] as RGB,
  tealDark: [17, 94, 89] as RGB,
  indigo: [79, 70, 229] as RGB,
  emerald: [5, 150, 105] as RGB,
  rose: [225, 29, 72] as RGB,
  amber: [217, 119, 6] as RGB,
  white: [255, 255, 255] as RGB,
}

const chartColors: RGB[] = [
  [15, 118, 110],
  [79, 70, 229],
  [14, 165, 233],
  [217, 119, 6],
  [225, 29, 72],
  [100, 116, 139],
]

const monthLabel = (month: Date) => month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
const generatedLabel = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const dateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const moneyForPdf = (amount: number, currency: CurrencyCode) => {
  const code = String(currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'code' }).format(amount).replace(/\u00a0/g, ' ')
  } catch {
    return `${code} ${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
}

const fileMonth = (month: Date) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
const safeName = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user'

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, fill: RGB, radius = 3) {
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
}

function addBrandHeader(doc: jsPDF, title: string, subtitle: string, userName: string) {
  const width = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.ink)
  doc.rect(0, 0, width, 39, 'F')
  doc.setFillColor(...C.teal)
  doc.circle(18, 17, 7, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('M', 18, 18.8, { align: 'center' })
  doc.setFontSize(17)
  doc.text('MoneyCove', 29, 14.8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.4)
  doc.setTextColor(174, 196, 205)
  doc.text('CLARITY FOR EVERY MONEY DECISION', 29, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(...C.white)
  doc.text(title, 14, 31.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.7)
  doc.setTextColor(185, 199, 211)
  doc.text(subtitle, width - 14, 14.5, { align: 'right' })
  doc.text(`Prepared for ${userName}`, width - 14, 20, { align: 'right' })
  doc.text(`Generated ${generatedLabel()}`, width - 14, 25.5, { align: 'right' })
}

function addPageHeading(doc: jsPDF, eyebrow: string, title: string, description: string) {
  doc.setTextColor(...C.tealDark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text(eyebrow.toUpperCase(), 14, 51)
  doc.setTextColor(...C.ink)
  doc.setFontSize(19)
  doc.text(title, 14, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C.slate)
  doc.text(description, 14, 66)
}

function addMetricCard(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, accent: RGB, helper?: string) {
  roundRect(doc, x, y, w, 25, C.paper, 3.5)
  doc.setFillColor(...accent)
  doc.roundedRect(x, y, 2.2, 25, 1.1, 1.1, 'F')
  doc.setTextColor(...C.slate)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(label.toUpperCase(), x + 6, y + 7)
  doc.setTextColor(...C.ink)
  doc.setFontSize(11.2)
  doc.text(value, x + 6, y + 14)
  if (helper) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.7)
    doc.setTextColor(...C.muted)
    doc.text(helper, x + 6, y + 20)
  }
}

function addBudgetProgress(doc: jsPDF, y: number, spent: number, budget: number, currency: CurrencyCode) {
  const width = 182
  roundRect(doc, 14, y, width, 31, C.paper, 4)
  const pct = budgetPercentage(spent, budget)
  const remaining = budget - spent
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.ink)
  doc.setFontSize(10)
  doc.text('Monthly budget', 20, y + 8)
  doc.setFontSize(8)
  doc.setTextColor(...C.slate)
  doc.text(`${moneyForPdf(spent, currency)} spent`, 20, y + 14)
  doc.text(`${remaining >= 0 ? moneyForPdf(remaining, currency) : moneyForPdf(Math.abs(remaining), currency) + ' over'} remaining`, 20, y + 19)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...(pct > 100 ? C.rose : pct > 80 ? C.amber : C.teal))
  doc.setFontSize(13)
  doc.text(`${Math.round(pct)}%`, 188, y + 10, { align: 'right' })
  doc.setTextColor(...C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text(budget > 0 ? `of ${moneyForPdf(budget, currency)}` : 'No budget set', 188, y + 15, { align: 'right' })
  doc.setFillColor(...C.line)
  doc.roundedRect(20, y + 24, 168, 3, 1.5, 1.5, 'F')
  const barWidth = budget > 0 ? Math.min(168, 168 * Math.min(pct, 100) / 100) : 0
  if (barWidth > 0) {
    doc.setFillColor(...(pct > 100 ? C.rose : pct > 80 ? C.amber : C.teal))
    doc.roundedRect(20, y + 24, barWidth, 3, 1.5, 1.5, 'F')
  }
}

function getPieData(transactions: Transaction[]) {
  const entries = Object.entries(categoryTotals(transactions)).sort((a, b) => b[1] - a[1])
  if (entries.length <= 5) return entries.map(([name, value]) => ({ name, value }))
  const primary = entries.slice(0, 5).map(([name, value]) => ({ name, value }))
  const other = entries.slice(5).reduce((sum, [, value]) => sum + value, 0)
  return [...primary, { name: 'Other', value: other }]
}

function drawDonutChart(doc: jsPDF, x: number, y: number, data: Array<{ name: string; value: number }>, currency: CurrencyCode) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  roundRect(doc, x, y, 182, 75, C.paper, 4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...C.ink)
  doc.text('Spending by category', x + 6, y + 9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  doc.setFontSize(6.7)
  doc.text('Share of expenses for this reporting period', x + 6, y + 14)

  const centerX = x + 40
  const centerY = y + 43
  const radius = 21
  const inner = 12.5

  if (total <= 0) {
    doc.setDrawColor(...C.line)
    doc.setLineWidth(7)
    doc.circle(centerX, centerY, radius - 3.5, 'S')
    doc.setTextColor(...C.muted)
    doc.setFontSize(7)
    doc.text('No expenses', centerX, centerY + 1, { align: 'center' })
    return
  }

  // Build the donut using small filled radial polygons. This keeps the chart vector-based
  // and avoids adding a screenshot dependency just for PDF export.
  let angle = -Math.PI / 2
  data.forEach((item, index) => {
    const sweep = (item.value / total) * Math.PI * 2
    const steps = Math.max(6, Math.ceil(sweep / 0.08))
    doc.setFillColor(...chartColors[index % chartColors.length])
    for (let step = 0; step < steps; step += 1) {
      const a1 = angle + sweep * (step / steps)
      const a2 = angle + sweep * ((step + 1) / steps)
      const points = [
        [centerX + Math.cos(a1) * inner, centerY + Math.sin(a1) * inner],
        [centerX + Math.cos(a1) * radius, centerY + Math.sin(a1) * radius],
        [centerX + Math.cos(a2) * radius, centerY + Math.sin(a2) * radius],
        [centerX + Math.cos(a2) * inner, centerY + Math.sin(a2) * inner],
      ]
      const [first, ...rest] = points
      const vectors = rest.map((point, pointIndex) => {
        const previous = points[pointIndex]
        return [point[0] - previous[0], point[1] - previous[1]] as [number, number]
      })
      vectors.push([first[0] - points[points.length - 1][0], first[1] - points[points.length - 1][1]])
      doc.lines(vectors, first[0], first[1], [1, 1], 'F', true)
    }
    angle += sweep
  })

  doc.setTextColor(...C.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(moneyForPdf(total, currency), centerX, centerY - 1, { align: 'center', maxWidth: 23 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(...C.muted)
  doc.text('TOTAL SPEND', centerX, centerY + 5, { align: 'center' })

  let legendY = y + 24
  data.forEach((item, index) => {
    const pct = total ? item.value / total * 100 : 0
    doc.setFillColor(...chartColors[index % chartColors.length])
    doc.roundedRect(x + 79, legendY - 3, 3, 3, 0.7, 0.7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(...C.ink)
    doc.text(item.name, x + 85, legendY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.slate)
    doc.text(`${pct.toFixed(1)}%`, x + 174, legendY, { align: 'right' })
    doc.setFontSize(6.4)
    doc.setTextColor(...C.muted)
    doc.text(moneyForPdf(item.value, currency), x + 85, legendY + 4.5)
    legendY += 9
  })
}

function addInsights(doc: jsPDF, y: number, context: PdfReportContext, current: Transaction[]) {
  const totals = getTotals(current)
  const previous = filterByMonth(context.transactions, new Date(context.month.getFullYear(), context.month.getMonth() - 1, 1))
  const previousTotals = getTotals(previous)
  const biggest = topCategory(current)
  const change = monthOverMonth(totals.expenses, previousTotals.expenses)
  const budgetUsed = context.budget > 0 ? Math.round(totals.expenses / context.budget * 100) : 0
  const insights = [
    biggest.category ? `${biggest.category} is your largest spending category at ${moneyForPdf(biggest.amount, context.currency)}.` : 'Add expense transactions to unlock category insights.',
    `Expenses are ${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'higher' : 'lower'} than the previous month.`,
    context.budget > 0 ? `You have used ${budgetUsed}% of your monthly budget.` : 'No monthly budget has been set for this period.',
    totals.income > 0 ? `Your savings rate is ${totals.savingsRate.toFixed(1)}% of income.` : 'Add income to calculate your savings rate.',
  ]
  roundRect(doc, 14, y, 182, 44, C.paper, 4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...C.ink)
  doc.text('Financial highlights', 20, y + 9)
  let itemY = y + 17
  insights.forEach((text) => {
    doc.setFillColor(...C.teal)
    doc.circle(21, itemY - 1.2, 1.2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.1)
    doc.setTextColor(...C.slate)
    doc.text(text, 26, itemY, { maxWidth: 162 })
    itemY += 7
  })
}

function addFooter(doc: jsPDF, footerText = 'MoneyCove - Personal finance report - Generated locally in your browser') {
  const pages = doc.getNumberOfPages()
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...C.line)
    doc.line(14, height - 12, width - 14, height - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(footerText, 14, height - 7)
    doc.text(`Page ${page} of ${pages}`, width - 14, height - 7, { align: 'right' })
  }
}

function addTransactionsTable(doc: jsPDF, transactions: Transaction[], currency: CurrencyCode, startY: number) {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: sorted.map((transaction) => [
      dateLabel(transaction.date),
      transaction.description,
      transaction.category,
      transaction.type === 'income' ? 'Income' : 'Expense',
      moneyForPdf(transaction.amount, currency),
    ]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 7.2, cellPadding: 2.7, textColor: C.slate, lineColor: C.line, lineWidth: 0.1 },
    headStyles: { fillColor: C.ink, textColor: C.white, fontStyle: 'bold', fontSize: 7.2 },
    alternateRowStyles: { fillColor: C.paper },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 57 },
      2: { cellWidth: 32 },
      3: { cellWidth: 23 },
      4: { cellWidth: 44, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        data.cell.styles.textColor = data.cell.raw === 'Income' ? C.emerald : C.rose
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
  return (doc as PdfWithTable).lastAutoTable?.finalY ?? startY
}

function addCategoryBudgetTable(doc: jsPDF, context: PdfReportContext, current: Transaction[], startY: number) {
  const totals = categoryTotals(current)
  if (!context.categoryBudgets.length) {
    roundRect(doc, 14, startY, 182, 22, C.paper, 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C.ink)
    doc.text('No category budgets yet', 20, startY + 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text('Set category limits in MoneyCove to see a detailed budget table here.', 20, startY + 15)
    return startY + 22
  }
  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14, bottom: 18 },
    head: [['Category', 'Budget', 'Spent', 'Remaining', 'Used']],
    body: context.categoryBudgets.map((item) => {
      const spent = totals[item.category] ?? 0
      const remaining = item.limit - spent
      return [
        item.category,
        moneyForPdf(item.limit, context.currency),
        moneyForPdf(spent, context.currency),
        remaining >= 0 ? moneyForPdf(remaining, context.currency) : `${moneyForPdf(Math.abs(remaining), context.currency)} over`,
        `${Math.round(budgetPercentage(spent, item.limit))}%`,
      ]
    }),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 7.2, cellPadding: 2.8, textColor: C.slate, lineColor: C.line, lineWidth: 0.1 },
    headStyles: { fillColor: C.ink, textColor: C.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: C.paper },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 39, halign: 'right' },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 43, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
  })
  return (doc as PdfWithTable).lastAutoTable?.finalY ?? startY
}

function newDocument() {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
}

export function exportFinancialReportPdf(context: PdfReportContext) {
  const doc = newDocument()
  const current = filterByMonth(context.transactions, context.month)
  const totals = getTotals(current)

  addBrandHeader(doc, 'Financial Report', monthLabel(context.month), context.userName)
  addPageHeading(doc, 'Monthly overview', monthLabel(context.month), 'A polished snapshot of your income, spending, budget and financial activity.')

  const gap = 3
  const cardWidth = (182 - gap * 3) / 4
  addMetricCard(doc, 14, 74, cardWidth, 'Balance', moneyForPdf(totals.balance, context.currency), totals.balance >= 0 ? C.teal : C.rose, `${current.length} transaction${current.length === 1 ? '' : 's'}`)
  addMetricCard(doc, 14 + (cardWidth + gap), 74, cardWidth, 'Income', moneyForPdf(totals.income, context.currency), C.emerald)
  addMetricCard(doc, 14 + (cardWidth + gap) * 2, 74, cardWidth, 'Expenses', moneyForPdf(totals.expenses, context.currency), C.rose)
  addMetricCard(doc, 14 + (cardWidth + gap) * 3, 74, cardWidth, 'Savings rate', `${totals.savingsRate.toFixed(1)}%`, C.indigo, moneyForPdf(totals.savings, context.currency))

  addBudgetProgress(doc, 104, totals.expenses, context.budget, context.currency)
  drawDonutChart(doc, 14, 142, getPieData(current), context.currency)
  addInsights(doc, 224, context, current)

  doc.addPage()
  addBrandHeader(doc, 'Budget Detail', monthLabel(context.month), context.userName)
  addPageHeading(doc, 'Budget performance', 'Monthly and category budgets', 'See where your spending sits against the limits you set.')
  addBudgetProgress(doc, 75, totals.expenses, context.budget, context.currency)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.ink)
  doc.setFontSize(10)
  doc.text('Category budgets', 14, 117)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text('Budget limits and actual spending for this month.', 14, 122)
  addCategoryBudgetTable(doc, context, current, 128)

  doc.addPage()
  addBrandHeader(doc, 'Transactions', monthLabel(context.month), context.userName)
  addPageHeading(doc, 'Activity ledger', `${current.length} transaction${current.length === 1 ? '' : 's'}`, 'Income and expense records included in this monthly report.')
  const y = 75
  if (current.length) {
    addTransactionsTable(doc, current, context.currency, y)
  } else {
    roundRect(doc, 14, y, 182, 25, C.paper, 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.ink)
    doc.text('No transactions for this month', 20, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text('Add income or expenses in MoneyCove and export the report again.', 20, y + 17)
  }

  addFooter(doc)
  doc.save(`moneycove-financial-report-${fileMonth(context.month)}-${safeName(context.userName)}.pdf`)
}

export function exportTransactionsPdf({ transactions, currency, userName, title = 'Transaction Statement' }: { transactions: Transaction[]; currency: CurrencyCode; userName: string; title?: string }) {
  const doc = newDocument()
  const totals = getTotals(transactions)
  addBrandHeader(doc, title, `${transactions.length} records`, userName)
  addPageHeading(doc, 'Transaction export', 'Financial activity', 'A clean statement of the transactions currently shown in MoneyCove.')

  const gap = 4
  const cardWidth = (182 - gap * 2) / 3
  addMetricCard(doc, 14, 75, cardWidth, 'Income', moneyForPdf(totals.income, currency), C.emerald)
  addMetricCard(doc, 14 + cardWidth + gap, 75, cardWidth, 'Expenses', moneyForPdf(totals.expenses, currency), C.rose)
  addMetricCard(doc, 14 + (cardWidth + gap) * 2, 75, cardWidth, 'Net', moneyForPdf(totals.balance, currency), totals.balance >= 0 ? C.teal : C.rose)

  if (transactions.length) {
    addTransactionsTable(doc, transactions, currency, 109)
  } else {
    roundRect(doc, 14, 109, 182, 25, C.paper, 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.ink)
    doc.text('No matching transactions', 20, 119)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text('Change your filters or add a transaction before exporting.', 20, 126)
  }
  addFooter(doc)
  doc.save(`moneycove-transactions-${new Date().toISOString().slice(0, 10)}-${safeName(userName)}.pdf`)
}

export function exportBudgetPdf(context: PdfReportContext) {
  const doc = newDocument()
  const current = filterByMonth(context.transactions, context.month)
  const totals = getTotals(current)
  addBrandHeader(doc, 'Budget Report', monthLabel(context.month), context.userName)
  addPageHeading(doc, 'Budget performance', monthLabel(context.month), 'A focused view of your monthly spending limit and category guardrails.')
  addBudgetProgress(doc, 76, totals.expenses, context.budget, context.currency)

  const cardWidth = 58
  addMetricCard(doc, 14, 116, cardWidth, 'Budget', moneyForPdf(context.budget, context.currency), C.indigo)
  addMetricCard(doc, 76, 116, cardWidth, 'Spent', moneyForPdf(totals.expenses, context.currency), C.rose)
  addMetricCard(doc, 138, 116, cardWidth, 'Remaining', moneyForPdf(Math.abs(context.budget - totals.expenses), context.currency), context.budget - totals.expenses >= 0 ? C.teal : C.rose, context.budget - totals.expenses < 0 ? 'Over budget' : 'Available')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.ink)
  doc.setFontSize(10)
  doc.text('Category budget detail', 14, 157)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text('Track category limits against actual expense totals.', 14, 162)
  addCategoryBudgetTable(doc, context, current, 168)
  addFooter(doc)
  doc.save(`moneycove-budget-${fileMonth(context.month)}-${safeName(context.userName)}.pdf`)
}


export function exportMonthlyExpensePdf(context: PdfReportContext) {
  const doc = newDocument()
  const current = filterByMonth(context.transactions, context.month).filter((transaction) => transaction.type === 'expense')
  const total = current.reduce((sum, transaction) => sum + transaction.amount, 0)
  addBrandHeader(doc, 'Monthly Expense Report', monthLabel(context.month), context.userName)
  addPageHeading(doc, 'Expense summary', monthLabel(context.month), 'Your monthly expense activity, category breakdown and spending total.')
  addMetricCard(doc, 14, 75, 58, 'Expenses', moneyForPdf(total, context.currency), C.rose, `${current.length} expense${current.length === 1 ? '' : 's'}`)
  const biggest = topCategory(current)
  addMetricCard(doc, 76, 75, 58, 'Largest category', biggest.category || 'None', C.indigo, biggest.category ? moneyForPdf(biggest.amount, context.currency) : 'No expense data')
  addMetricCard(doc, 138, 75, 58, 'Budget used', context.budget > 0 ? `${Math.round(total / context.budget * 100)}%` : '—', C.teal, context.budget > 0 ? `of ${moneyForPdf(context.budget, context.currency)}` : 'No budget set')
  drawDonutChart(doc, 14, 109, getPieData(current), context.currency)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.ink)
  doc.text('Expense activity', 14, 193)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text('All expenses recorded for this month.', 14, 198)
  if (current.length) addTransactionsTable(doc, current, context.currency, 204)
  else {
    roundRect(doc, 14, 204, 182, 25, C.paper, 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.ink)
    doc.text('No expenses for this month', 20, 214)
  }
  addFooter(doc)
  doc.save(`moneycove-monthly-expenses-${fileMonth(context.month)}-${safeName(context.userName)}.pdf`)
}

export function exportAiSummaryPdf({ messages, userName, currency, conversationTitle = 'MoneyCove conversation' }: { messages: Array<{ role: 'user' | 'assistant'; content: string; createdAt?: string }>; userName: string; currency: CurrencyCode; conversationTitle?: string }) {
  const doc = newDocument()
  const generated = new Date()
  const transcript = messages.filter(message => message.content.trim())
  const exchangeCount = transcript.filter(message => message.role === 'user').length

  addBrandHeader(doc, 'AI Conversation Brief', generated.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), userName)
  addPageHeading(doc, 'MoneyCove intelligence', 'Your complete AI conversation', 'A private, polished record of your questions and MoneyCove AI guidance from this conversation.')

  roundRect(doc, 14, 75, 182, 34, C.paper, 5)
  doc.setFillColor(...C.teal)
  doc.roundedRect(14, 75, 3, 34, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.tealDark)
  doc.text('CONVERSATION', 22, 84)
  doc.setFontSize(11)
  doc.setTextColor(...C.ink)
  const titleLines = doc.splitTextToSize(conversationTitle || 'MoneyCove conversation', 116).slice(0, 2)
  doc.text(titleLines, 22, 92)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(...C.muted)
  doc.text(`${exchangeCount} question${exchangeCount === 1 ? '' : 's'} · ${transcript.length} message${transcript.length === 1 ? '' : 's'} · Currency ${currency}`, 22, 103)

  let y = 120
  const addContinuationHeader = () => {
    doc.addPage()
    addBrandHeader(doc, 'AI Conversation Brief', `Currency: ${currency}`, userName)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C.tealDark)
    doc.text('CONVERSATION - CONTINUED', 14, 50)
    y = 58
  }
  const ensureSpace = (needed: number) => {
    if (y + needed > 272) addContinuationHeader()
  }

  const renderAssistantBlocks = (content: string) => {
    const blocks = parseAiContent(content)
    if (!blocks.length) {
      const lines = doc.splitTextToSize(content, 164)
      const h = Math.max(9, lines.length * 4.5 + 4)
      ensureSpace(h)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.3)
      doc.setTextColor(...C.slate)
      doc.text(lines, 20, y + 2)
      y += h
      return
    }

    for (const block of blocks) {
      if (block.kind === 'heading') {
        ensureSpace(14)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...C.ink)
        doc.text(block.text, 20, y + 2)
        doc.setDrawColor(...C.line)
        doc.line(20, y + 5, 190, y + 5)
        y += 11
        continue
      }
      if (block.kind === 'bullet') {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.1)
        const lines = doc.splitTextToSize(block.text, 155)
        const h = Math.max(8, lines.length * 4.4 + 3)
        ensureSpace(h)
        doc.setFillColor(...C.teal)
        doc.circle(22, y + 2, 1.05, 'F')
        doc.setTextColor(...C.slate)
        doc.text(lines, 27, y + 3)
        y += h
        continue
      }
      if (block.kind === 'table') {
        const rows = block.rows.filter(row => row.length)
        if (!rows.length) continue
        const columns = Math.max(...rows.map(row => row.length))
        const colWidth = 170 / Math.max(columns, 1)
        const rowHeights = rows.map(row => Math.max(...row.map(cell => doc.splitTextToSize(cell, Math.max(28, colWidth - 7)).length), 1) * 4 + 5)
        rows.forEach((row, rowIndex) => {
          const rowHeight = rowHeights[rowIndex]
          ensureSpace(rowHeight + 2)
          doc.setFillColor(...(rowIndex === 0 ? C.ink : rowIndex % 2 ? C.paper : C.white))
          doc.rect(20, y, 170, rowHeight, 'F')
          row.forEach((cell, cellIndex) => {
            doc.setFont('helvetica', rowIndex === 0 ? 'bold' : 'normal')
            doc.setFontSize(rowIndex === 0 ? 7 : 7.3)
            doc.setTextColor(...(rowIndex === 0 ? C.white : C.slate))
            doc.text(doc.splitTextToSize(cell, Math.max(26, colWidth - 7)), 24 + cellIndex * colWidth, y + 5.5)
          })
          y += rowHeight
        })
        y += 4
        continue
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.2)
      doc.setTextColor(...C.slate)
      const lines = doc.splitTextToSize(block.text, 164)
      const h = Math.max(8, lines.length * 4.5 + 3)
      ensureSpace(h)
      doc.text(lines, 20, y + 3)
      y += h
    }
  }

  if (!transcript.length) {
    roundRect(doc, 14, y, 182, 25, C.paper, 4)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.ink)
    doc.text('No conversation messages were available for this export.', 20, y + 11)
    y += 31
  }

  transcript.forEach((message, index) => {
    if (message.role === 'user') {
      const lines = doc.splitTextToSize(message.content, 158)
      const cardHeight = Math.max(25, 15 + lines.length * 4.7)
      ensureSpace(cardHeight + 9)
      roundRect(doc, 20, y, 176, cardHeight, [241, 245, 249], 5)
      doc.setFillColor(...C.indigo)
      doc.roundedRect(20, y, 3, cardHeight, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.8)
      doc.setTextColor(...C.indigo)
      doc.text(`YOU · QUESTION ${transcript.slice(0, index + 1).filter(item => item.role === 'user').length}`, 28, y + 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.6)
      doc.setTextColor(...C.ink)
      doc.text(lines, 28, y + 16)
      y += cardHeight + 7
      return
    }

    ensureSpace(18)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(...C.tealDark)
    doc.text('MONEYCOVE AI', 20, y + 2)
    doc.setFillColor(...C.teal)
    doc.circle(16.8, y - 0.2, 2.1, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(5.2)
    doc.text('M', 16.8, y + 1.3, { align: 'center' })
    y += 9
    renderAssistantBlocks(message.content)
    y += 9
  })

  ensureSpace(28)
  roundRect(doc, 14, y, 182, 23, [241, 245, 249], 4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.3)
  doc.setTextColor(...C.ink)
  doc.text('A clearer view, not a promise.', 20, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(...C.muted)
  doc.text('MoneyCove AI provides informational budgeting guidance based on your saved records. It is not investment, tax, legal or credit advice.', 20, y + 14, { maxWidth: 166 })

  addFooter(doc, 'MoneyCove - Complete AI conversation - Private to your account')
  doc.save(`moneycove-ai-conversation-${new Date().toISOString().slice(0,10)}-${safeName(userName)}.pdf`)
}

