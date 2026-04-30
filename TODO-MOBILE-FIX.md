# Mobile Responsive Layout Fix - TODO

## Step 1: Update Dashboard Layout (src/app/dashboard/layout.tsx)
- [x] Add Mobile Hamburger Button (visible only on mobile `block md:hidden`)
- [ ] Create Mobile Drawer with slide-in animation and backdrop overlay
- [ ] Add Close Button (X icon) inside the drawer
- [ ] Implement navigation with active states
- [ ] Auto-close drawer when link is clicked

## Step 2: Verify Individual Pages
- [ ] Dashboard page - verify responsive containers
- [ ] Customers page - verify responsive containers  
- [ ] Check other pages for consistency

## Step 3: Test Mobile Responsiveness
- [ ] Test hamburger menu functionality
- [ ] Test drawer transition/animation
- [ ] Test active link highlighting
- [ ] Verify table overflow-x-auto on mobile

## Step 4: Schema Sync Verification
- [ ] Verify total_debt field is used
- [ ] Verify transaction_type field is used
- [ ] Verify shop_id for multi-tenancy
