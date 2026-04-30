# Phase 8: Implementing Remaining Modules TODO

## Current Progress
- [x] AppContext & Schema aligned
- [x] POS, Inventory, Purchases, Sales implemented

## Remaining Steps (Priority Order)

### 1. Customers Page (/dashboard/customers) ✅
   - [x] Create TODO.md
   - [x] Implement search table (full_name → name, phone, total_debt)
   - [x] Add customer modal (CRUD)
   - [x] Implement "Collect Payment" (update total_debt, insert account_ledger income)
   - [ ] Test debt collection flow

### 2. Finance Page (/dashboard/finance) ✅
   - [x] Fetch accounts.balance (current balances)
   - [x] Recent account_ledger history (transaction_type, amount)
   - [x] Cards: Cash on hand, Total movements
   - [x] Table for transactions

### 3. Reports Page (/dashboard/reports)
   - [ ] Total Sales (invoices)
   - [ ] Total Purchases
   - [ ] Net Profit
   - [ ] Top products

### 4. Settings Page (/dashboard/settings)
   - [ ] Update shop details form
   - [ ] Logout/Reset cache

## Testing
- [ ] Verify all queries use `.eq('shop_id', shop.id)`
- [ ] Test multi-tenant isolation
- [ ] npm run dev → manual navigation/tests
- [ ] attempt_completion
