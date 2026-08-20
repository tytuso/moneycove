import type { ExpenseCategory, IncomeCategory } from '../types'
import {
  Banknote, BriefcaseBusiness, Bus, Clapperboard, GraduationCap, Gift, HeartPulse,
  Home, Landmark, Laptop, MoreHorizontal, Receipt, ShoppingBag, Smartphone, TrendingUp,
  UtensilsCrossed, WalletCards
} from 'lucide-react'

export const incomeCategories: IncomeCategory[] = ['Salary', 'Business', 'Freelance', 'Gift', 'Investment', 'Other']
export const expenseCategories: ExpenseCategory[] = ['Food', 'Transport', 'Rent', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Education', 'Business', 'Airtime/Data', 'Other']

export const categoryIcons = {
  Salary: Banknote,
  Business: BriefcaseBusiness,
  Freelance: Laptop,
  Gift,
  Investment: TrendingUp,
  Other: MoreHorizontal,
  Food: UtensilsCrossed,
  Transport: Bus,
  Rent: Home,
  Utilities: Receipt,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Education: GraduationCap,
  'Airtime/Data': Smartphone,
  Savings: Landmark,
  Wallet: WalletCards
} as const
