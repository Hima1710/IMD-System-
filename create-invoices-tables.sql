-- Complete Database Schema for Muslim Tech POS System
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- INVOICES TABLE (Sales)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  discount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_type TEXT DEFAULT 'cash' CHECK (payment_type IN ('cash', 'debt', 'card')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop invoices" ON invoices
  FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can insert own shop invoices" ON invoices
  FOR INSERT WITH CHECK (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can update own shop invoices" ON invoices
  FOR UPDATE USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop invoice items" ON invoice_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE id = invoice_items.invoice_id 
    AND shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Shop owners can insert own shop invoice items" ON invoice_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM invoices 
    WHERE id = invoice_items.invoice_id 
    AND shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  ));

-- Index
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- ============================================
-- PRODUCTS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  category TEXT,
  cost_price NUMERIC(15, 2) DEFAULT 0,
  selling_price NUMERIC(15, 2) DEFAULT 0,
  stock_quantity NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop products" ON products
  FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can insert own shop products" ON products
  FOR INSERT WITH CHECK (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can update own shop products" ON products
  FOR UPDATE USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);

-- ============================================
-- CUSTOMERS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  total_debt NUMERIC(15, 2) DEFAULT 0,
  credit_limit NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop customers" ON customers
  FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can insert own shop customers" ON customers
  FOR INSERT WITH CHECK (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can update own shop customers" ON customers
  FOR UPDATE USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_customers_shop_id ON customers(shop_id);

-- ============================================
-- ACCOUNTS TABLE (Financial)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('cash', 'bank', 'wallet')),
  balance NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop accounts" ON accounts
  FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can manage own shop accounts" ON accounts
  FOR ALL USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_accounts_shop_id ON accounts(shop_id);

-- ============================================
-- ACCOUNT LEDGER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS account_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for account_ledger
ALTER TABLE account_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop ledger" ON account_ledger
  FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can insert own shop ledger" ON account_ledger
  FOR INSERT WITH CHECK (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_account_ledger_shop_id ON account_ledger(shop_id);
CREATE INDEX idx_account_ledger_created_at ON account_ledger(created_at DESC);
CREATE INDEX idx_account_ledger_transaction_type ON account_ledger(transaction_type);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view own shop categories" ON categories
  FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Shop owners can manage own shop categories" ON categories
  FOR ALL USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_categories_shop_id ON categories(shop_id);
