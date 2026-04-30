# Multi-Tenant Implementation Fixes

## Status: In Progress

### Issues to Fix:

- [x] 1. inventory/page.tsx - Replace demo data with Supabase queries
- [ ] 2. sales/new/page.tsx - Replace demo data with Supabase queries  
- [ ] 3. dashboard/page.tsx - Fix ledger type -> transaction_type
- [ ] 4. sales/page.tsx - Add real invoice fetching
- [ ] 5. settings/page.tsx - Add shop profile completion redirect

---

## Fix 1: Inventory Page

Replace hardcoded demo data with:

```typescript
// Fetch products from Supabase
const { data: productsData } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shop.id)
  .order('name')
```

---

## Fix 2: Sales/New Page

Replace demoProducts and demoCustomers with Supabase queries:

```typescript
// Fetch products
const { data: productsData } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shop.id)
  .eq('is_active', true)
  .gt('stock', 0)
  .order('name')

// Fetch customers  
const { data: customersData } = await supabase
  .from('customers')
  .select('id, name, phone, total_debt')
  .eq('shop_id', shop.id)
  .order('name')
```

---

## Fix 3: Dashboard Ledger

Change:

```typescript
.filter((t) => t.type === 'income')
```

To:

```typescript
.filter((t) => t.transaction_type === 'income')
```

---

## Fix 4: Sales Page

Fetch real invoice data:

```typescript
const { data: invoicesData } = await supabase
  .from('invoices')
  .select('*, customers(name)')
  .eq('shop_id', shop.id)
  .order('created_at', { ascending: false })
  .limit(10)
```

---

## Fix 5: Settings Redirect

Add shop profile completion check:

```typescript
// In Settings page
useEffect(() => {
  if (!shop?.id && isAuthenticated) {
    // Force shop profile completion
    router.push('/dashboard/settings?action=complete-profile')
  }
}, [shop?.id, isAuthenticated])
