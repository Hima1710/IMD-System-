# Mobile UI Fix - TODO

## Status: COMPLETED ✓

## 1. Dashboard Layout (layout.tsx) - Hamburger Menu Fix
- [x] Add mobile hamburger button (block md:hidden)
- [x] Create mobile slide-over drawer with dimmed backdrop
- [x] Add close button (X icon) in drawer
- [x] Add all navigation links to mobile drawer
- [x] Ensure drawer closes on link click
- [x] Apply active state styling for current page
- [x] High z-index for overlay

## 2. Responsive Page Containers
- [x] Check dashboard page has w-full px-4 md:px-8 (in layout.tsx)
- [x] Check customers page tables in overflow-x-auto
- [x] Check finances page tables in overflow-x-auto

## 3. Schema Verification
- [x] Verify total_debt is used (not balance/debt)
- [x] Verify transaction_type is used (not type)
- [x] Verify shop_id is used
