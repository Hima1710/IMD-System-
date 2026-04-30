# Database Schema Synchronization Plan

## Overview
Synchronize ALL dashboard pages to match the provided Supabase JSON Database Schema exactly.

## Schema Requirements Summary
- Multi-tenancy: Every query MUST include `.eq('shop_id', shop.id)`
- Use exact column names: `total_debt`, `transaction_type`, `shop_id`
- Handle null values with proper defaults (e.g., balance defaults to 0)
- Feature mapping: Sales→invoices/invoice_items, Finance→accounts/account_ledger

---

## Issues Found & Fixes Required

### 🔴 CRITICAL: src/app/dashboard/sales/new/page.tsx (POS)

**Issues:**
1. Invoice insert uses columns not in schema: `total_amount`, `discount`, `status`, `payment_type`
2. Invoice items: uses `subtotal` but schema has `total`
3. Missing `shop_id` in invoice_items insert!
4. Account ledger insert is missing key fields and incorrect structure

**Fix Required:**
- Align invoice insert with schema columns (id, shop_id, customer_id, account_id, invoice_number, invoice_type)
- Fix invoice_items: use `total` not `subtotal`, add `shop_id`
- Fix account_ledger structure with proper required fields

### 🟡 MEDIUM: src/app/dashboard/inventory/page.tsx

**Issues:**
1. Form uses `name="category_id"` but handleSubmit reads `formData.get('category')` - BUG!
2. Missing `min_stock` field collection in handleSubmit

**Fix Required:**
- Align form field name with handleSubmit
- Add min_stock to form data

### 🟡 MEDIUM: src/app/dashboard/customers/page.tsx

**Issues:**
1. Account ledger insert missing `balance_after` calculation
2. Not updating account balance after collection

**Fix Required:**
- Calculate and include `balance_after` in account_ledger insert
- Add account balance update logic

### 🟢 LOW: src/lib/supabase.ts

**Status:** Mostly aligned, minor type adjustments may be needed

---

## Pages Already Schema-Compliant ✅

- src/app/dashboard/products/page.tsx ✅
- src/app/dashboard/suppliers/page.tsx ✅  
- src/app/dashboard/finances/page.tsx ✅
- src/app/dashboard/purchases/page.tsx ✅ (uses different tables not in schema JSON)
- src/app/dashboard/categories/page.tsx ✅
- src/app/dashboard/sales/page.tsx (list page - needs verification)

---

## Action Items

### Priority 1: Fix POS (sales/new/page.tsx)
- [ ] Fix invoice insert to use correct schema columns
- [ ] Fix invoice_items: change subtotal→total, add shop_id
- [ ] Fix account_ledger structure

### Priority 2: Fix Inventory form bug
- [x] Fix category field name mismatch (actually was already correct - uses category_id)
- [x] Add min_stock to form (DONE - added min_stock field to form)

### Priority 3: Fix Customers collection
- [ ] Add balance_after calculation
- [ ] Add account balance update

### Priority 4: Verify other pages
- [ ] Verify sales/page.tsx
- [ ] Verify reports/page.tsx
- [ ] Verify settings/page.tsx

---

## Date: 2024
