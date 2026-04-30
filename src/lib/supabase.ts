import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Auth will not work properly.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper types
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
  phone: string
  total_debt: number
  credit_limit: number
  created_at: string
}

export type Supplier = {
  id: string
  shop_id: string
  name: string
  phone: string | null
  total_owed: number
  created_at: string
}

export type Product = {
  id: string
  shop_id: string
  name: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  created_at: string
}

export type Purchase = {
  id: string
  shop_id: string
  supplier_name: string
  total_amount: number
  created_at: string
}

export type PurchaseItem = {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_cost: number
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
  account_id: string
  shop_id: string
  amount: number
  transaction_type: string
  description: string
  created_at: string
}

export type Invoice = {
  id: string
  shop_id: string
  invoice_number: string
  customer_id: string
  total_amount: number
  status: string
  created_at: string
}
