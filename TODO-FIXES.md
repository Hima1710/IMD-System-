# Task Completion TODO

## ✅ Completed Issues

### 1. cost_price Column - Fixed (PGRST204)
- **Files:** `src/app/dashboard/inventory/page.tsx`, `src/app/dashboard/products/page.tsx`
- **Solution:** Made `cost_price` optional using spread operator - only included when > 0
- **Status:** ✅ DONE

### 2. PWA Icon Fix
- **File:** `public/manifest.json`
- **Solution:** Removed broken PNG icon references, now uses single SVG icon `/icons/icon.svg`
- **Status:** ✅ DONE

### 3. Purchases API - Updated
- **File:** `src/app/api/purchases/route.ts`
- **Changes:**
  - Now accepts `supplier_id` and resolves to `supplier_name` on server side
  - Uses `shop_id` for data isolation in all queries
  - Proper error handling
- **Status:** ✅ DONE

### 4. Purchases Page - Enhanced
- **File:** `src/app/dashboard/purchases/page.tsx`
- **Changes:**
  - Added `selectedSupplierId` state
  - Supplier dropdown integrated with database
  - "+ إضافة مورد جديد" option works
  - Proper shop_id scoping
- **Status:** ✅ DONE

### 5. Inventory Page - Category Enhancement
- **File:** `src/app/dashboard/inventory/page.tsx`
- **Changes:**
  - Added "+ إضافة فئة جديدة" option in category dropdown
- **Status:** ✅ DONE

## Database Requirements (Already Exist)

The following tables must exist in Supabase:
- ✅ `purchases` - with columns: shop_id, supplier_name, supplier_id, total_amount, status
- ✅ `purchase_items` - with columns: purchase_id, product_id, quantity, unit_cost  
- ✅ `suppliers` - with columns: shop_id, name, is_active
- ✅ `products` - with columns: shop_id, name, selling_price, stock_quantity
- ✅ `categories` - with columns: shop_id, name
