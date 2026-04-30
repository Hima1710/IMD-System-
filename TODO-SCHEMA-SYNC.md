# Schema Synchronization Implementation TODO

## Progress Tracker

### Phase 1: Foundation (Types)
- [ ] 1.1 Update `src/lib/supabase.ts` types to match exact schema column names
  - [ ] InvoiceItem: subtotal → total
  - [ ] Add null default annotations

### Phase 2: Critical Sales (POS) Page
- [ ] 2.1 Fix invoice items insert: Add missing `shop_id`
- [ ] 2.2 Fix invoice items: `subtotal` → `total`
- [ ] 2.3 Fix invoice items: Add `cost_price` field
- [ ] 2.4 Fix account_ledger insert: Add `customer_id` / `account_id`
- [ ] 2.5 Fix account_ledger insert: Add `reference_id` (invoice ID)
- [ ] 2.6 Fix account_ledger insert: Add `balance_after` calculation
- [ ] 2.7 Ensure all queries use `.eq('shop_id', shop.id)`
- [ ] 2.8 Ensure stock updates happen for every sale
- [ ] 2.9 Mobile UI scaling fixes (text-xs labels, responsive sizing)

### Phase 3: Inventory Page
- [ ] 3.1 Fix form field mismatch: `category` → `category_id`
- [ ] 3.2 Add `min_stock` collection from form
- [ ] 3.3 Ensure all queries use `.eq('shop_id', shop.id)`
- [ ] 3.4 Mobile UI scaling fixes

### Phase 4: Customers Page
- [ ] 4.1 Fix account_ledger insert: Add `customer_id`
- [ ] 4.2 Fix account_ledger insert: Add `balance_after`
- [ ] 4.3 Fix account_ledger insert: Add `reference_id`
- [ ] 4.4 Add missing form fields: `address`, `account_number`, `category`, `status`
- [ ] 4.5 Ensure all queries use `.eq('shop_id', shop.id)`
- [ ] 4.6 Mobile UI scaling fixes

### Phase 5: Products Page
- [ ] 5.1 Verify `is_active` default handling
- [ ] 5.2 Ensure all queries use `.eq('shop_id', shop.id)`

### Phase 6: Suppliers Page
- [ ] 6.1 Add `address` field to form
- [ ] 6.2 Ensure all queries use `.eq('shop_id', shop.id)`

### Phase 7: Finances Page
- [ ] 7.1 Add null safety: `balance || 0`
- [ ] 7.2 Ensure all queries use `.eq('shop_id', shop.id)`

### Phase 8: Dashboard Main Page
- [ ] 7.1 Add null safety for calculations
- [ ] 7.2 Ensure all queries use `.eq('shop_id', shop.id)`

### Phase 9: Purchases API
- [ ] 9.1 Ensure stock updates for every purchase
- [ ] 9.2 Ensure
