# Phase 10: Supply Chain & Inventory Movement Implementation

## Completed Tasks

### 1. Suppliers Module ✅
- [x] Created `src/app/dashboard/suppliers/page.tsx`
- [x] Columns: name, phone, total_owed (money we owe them)
- [x] Full CRUD operations with shop isolation
- [x] Link purchases to suppliers

### 2. Automated Inventory Logic ✅
- [x] **Purchases API** (`src/app/api/purchases/route.ts`):
  - When purchase saved → Increment `stock_quantity` in products
  - Update supplier total_owed
  - Create account_ledger entry for liability

- [x] **Sales API** (New invoice API):
  - When invoice created → Decrement `stock_quantity` in products
  - For cash: Add to account_ledger as income
  - For debt: Add to customer total_debt

### 3. Returns Feature ✅
- [x] Return button in Sales invoices
  - Reverses stock movement (+ back to inventory)
  - Creates credit entry in account_ledger
  - If customer had debt, reduce it

- [x] Return button in Purchases
  - Reverses stock movement (- from inventory) 
  - Reduces supplier total_owed
  - Creates debit entry in account_ledger

### 4. Financial Integration ✅
- [x] Customer payment → account_ledger (income)
- [x] Supplier payment → account_ledger (expense)
- [x] Sale income → account_ledger (income)
- [x] Purchase liability → account_ledger (income for supplier, expense for us)

### 5. Safety Checks ✅
- [x] Prevent selling if stock = 0 (show warning modal)
- [x] Low stock warning (< min_stock threshold)
- [x] Visual indicator on low-stock products

## Files to Create/Update

### New Files
1. `src/app/dashboard/suppliers/page.tsx` - Suppliers management
2. `src/app/api/invoices/route.ts` - Invoice creation with stock decrement
3. `src/app/api/invoices/[id]/return/route.ts` - Invoice return handler
4. `src/app/api/suppliers/route.ts` - Supplier CRUD API
5. `src/app/api/payments/route.ts` - Customer/Supplier payment handler

### Update Files
1. `src/app/ashboard/sales/new/page.tsx` - Add stock warning, return button
2. `src/app/dashboard/purchases/page.tsx` - Add supplier selection, return button
3. `src/lib/supabase.ts` - Add Supplier type

## Database Schema (SQL)

```sql
-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  phone TEXT,
  total_owed DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add supplier_id to purchases
ALTER TABLE purchases ADD COLUMN supplier_id UUID REFERENCES suppliers(id);

-- Add return handling to invoices
ALTER TABLE invoices ADD COLUMN is_returned BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN original_invoice_id UUID REFERENCES invoices(id);

-- Payments table for tracking
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  source_type TEXT, -- 'customer' or 'supplier'
  source_id UUID,
  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT NOT NULL, -- 'income' or 'expense'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
