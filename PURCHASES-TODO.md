# Phase 7: Purchases Module Progress

## Steps (Purchases First):

### 1. Types & Schema (Completed)\n- [x] Add types to `src/lib/supabase.ts`: Customer, Product, Purchase, PurchaseItem (fixed TS formatting)\n\n### 2. Purchases API (Completed)\n- [x] Created `src/app/api/purchases/route.ts`: POST purchase + items, stock increment"
</xai:function_call name="read_file">
<parameter name="path">d:/poss/src/app/dashboard/purchases/page.tsx

### 2. Purchases UI (`src/app/dashboard/purchases/page.tsx`)
- [ ] Replace placeholder with form: Supplier dropdown/create, dynamic items (product select, qty, cost), totals
- [ ] Recent purchases table
- [ ] Safe JSX, compact dark UI matching POS

### 3. Purchases API (`src/app/api/purchases/route.ts`)
- [ ] POST /api/purchases: Insert purchase + items, increment products.stock_quantity by shop_id
- [ ] GET /api/purchases: Recent for shop

### 4. Test Purchases
- [ ] npm run dev
- [ ] Create purchase → verify DB inserts + inventory update
- [ ] UI responsive/table updates

### 5. Customers Module (Next)
- [ ] Customers page: Searchable table w/ total_debt, "Pay Debt" modal
- [ ] APIs: GET customers, POST pay-debt

### 6. Polish & Completion
- [ ] Multi-tenant filters (shop_id everywhere)
- [ ] Error handling, loading states

**Current:** Ready to implement types, then Purchases page + API.
