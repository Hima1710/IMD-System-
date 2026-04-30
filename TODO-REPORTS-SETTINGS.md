# Phase 8 Final: Reports & Settings Implementation Plan

## Information Gathered
- Settings & Reports pages exist as "Coming Soon" placeholders
- Shop type: id, name, business_type, owner_id, is_active, created_at (add address?)
- Tables: shops (update), invoices (total_amount, add invoice_type?), purchases, customers.total_debt
- UI pattern: gradient-text h1, card containers, modals, shop.id always used

## Plan

### 1. Settings Page - PRIORITY
- Form fields: name, business_type (select), phone, address
- Load current shop data
- Update only `.eq('id', shop.id)`
- Success toast
- Logout button

### 2. Reports Page
- Cards: Total Sales (invoices sum total_amount where invoice_type='sale'), Total Purchases, Customer Debts (customers.total_debt sum)
- Simple bar chart or CSS grid for trends (monthly sales?)
- All `.eq('shop_id', shop.id')`

## Dependent Files
- src/app/dashboard/settings/page.tsx (rewrite)
- src/app/dashboard/reports/page.tsx (rewrite)
- src/lib/supabase.ts (add invoice_type? if missing)

## Followup Steps
1. Implement Settings
2. Test shop update
3. Implement Reports
4. `npm run dev` test
5. Completion
