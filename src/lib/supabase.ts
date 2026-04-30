import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Auth will not work properly.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper types aligned with database schema
export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  shop_id: string | null
  role: string | null
  created_at: string
}

export type Shop = {
  id: string
  name: string
  business_type: string
  owner_id: string | null
  is_active: boolean
  created_at: string
}

export type Customer = {
  id: string
  shop_id: string
  name: string
  phone: string | null
  address: string | null
  account_number: string | null
  category: string | null
  status: string | null
  total_debt: number
  credit_limit: number
  created_at: string
}

export type Supplier = {
  id: string
  shop_id: string
  name: string
  phone: string | null
  address: string | null
  total_owed: number
  created_at: string
}

export type Product = {
  id: string
  shop_id: string
  name: string
  category_id: string | null
  barcode: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  is_active: boolean
  created_at: string
}

export type Purchase = {
  id: string
  shop_id: string
  supplier_id: string | null
  supplier_name: string
  total_amount: number
  status: string
  created_at: string
}

export type PurchaseItem = {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_cost: number
  created_at: string
}

// New types for Phase 7 Schema Alignment
export type Account = {
  id: string
  shop_id: string
  name: string
  account_type: string
  balance: number
  created_at: string
}

export type AccountLedger = {
  id: string
  shop_id: string
  account_id: string | null
  customer_id: string | null
  supplier_id: string | null
  transaction_type: string
  amount: number
  balance_after: number | null
  reference_id: string | null
  description: string | null
  created_at: string
}

export type Invoice = {
  id: string
  shop_id: string
  customer_id: string | null
  account_id: string | null
  invoice_number: string
  invoice_type: string
  total_amount: number
  status: string
  created_at: string
}

export type InvoiceItem = {
  id: string
  shop_id: string
  invoice_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  cost_price: number
  total: number
  created_at: string
}

export type InvoicePayment = {
  id: string
  invoice_id: string
  method: string
  amount: number
  reference: string | null
  created_at: string
}

export type Category = {
  id: string
  shop_id: string
  name: string
  created_at: string
}

export type Expense = {
  id: string
  shop_id: string
  account_id: string | null
  expense_number: string
  category: string
  amount: number
  notes: string | null
  expense_date: string
  created_at: string
}

export type DebtPayment = {
  id: string
  shop_id: string
  account_id: string | null
  customer_id: string | null
  supplier_id: string | null
  amount: number
  payment_type: string
  notes: string | null
  created_at: string
}
