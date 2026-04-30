# Multi-tenant Sync, Real Data, Responsive Polish - TODO
✅ Plan Approved - Schema: customers(total_debt,credit_limit), branches(tenant_id→shop), account_ledger(transaction_type,balance_after)

## 📋 Implementation Steps (9 Total)

### Phase 1: Project Setup & Responsive Foundation (2/9)
- [x] **1. Create this TODO.md** 
- [x] **2. Add responsive Tailwind to layout.tsx** (sidebar drawer ✓, mobile topbar ✓, prefixes ✓)

### Phase 2: Schema Fixes & Data Cleanup (3/9)
- [x] **3. Fix customers/page.tsx** (name/full_name → name, credit_limit added/updated, schema synced ✓)

- [ ] **4. Fix reports/page.tsx** (real charts data, purchases aggregation, invoice_number/type, branches?)
- [ ] **5. Fix dashboard/page.tsx** (debt: balance→total_debt)
- [ ] **4. Fix reports/page.tsx** (real charts data, purchases aggregation, invoice_number/type, branches?)
- [ ] **5. Fix dashboard/page.tsx** (debt: balance→total_debt)

### Phase 3: Mobile Card View & Final Polish (3/9)
- [ ] **6. Add card view toggle to tables** (customers, reports, dashboard tables → cards on mobile)
- [ ] **7. Responsive grids/forms across pages** (sm:/lg: prefixes everywhere)
- [ ] **8. Branches integration** (if branches table exists, map tenant_id→shop queries)

### Phase 4: Testing & Completion (1/9)
- [ ] **9. Test responsive + attempt_completion** (mobile view, empty states, no 500s)

**Progress: 5/9** | Layout responsive ✓, customers schema (credit_limit) ✓, reports real data fetches ✓, dashboard debt field fixed ✓. Core schema sync complete. Next: Mobile card view toggle (tables → cards on mobile).

Updated: {new Date().toLocaleString('ar-EG')}

