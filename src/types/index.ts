export type TransactionType = 'income' | 'expense'

export type IncomeCategory = 'Salary' | 'Business' | 'Freelance' | 'Gift' | 'Investment' | 'Other'
export type ExpenseCategory = 'Food' | 'Transport' | 'Rent' | 'Utilities' | 'Shopping' | 'Entertainment' | 'Health' | 'Education' | 'Business' | 'Airtime/Data' | 'Other'
export type Category = IncomeCategory | ExpenseCategory

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category: Category
  date: string
  note?: string
}

export type CurrencyCode = string
export type ThemeMode = 'light' | 'dark' | 'system'

export interface UserSettings {
  currency: CurrencyCode
  theme: ThemeMode
}

export interface CategoryBudget {
  category: ExpenseCategory
  limit: number
}

export interface AppState {
  transactions: Transaction[]
  monthlyBudget: number
  categoryBudgets: CategoryBudget[]
  settings: UserSettings
}
