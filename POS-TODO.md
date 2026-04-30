# POS Enhancements TODO

- [x] Step 1: Read shops/customers table schemas via Supabase queries if needed (check structure)
- [x] Step 2: Add customer state/select in POS page (fetch customers by shop_id)
- [x] Step 3: Extend invoice schema? (add customer_id if missing) - check first (added to insert)
- [x] Step 4: Implement dynamic shop data fetch (name/location/phone)
- [ ] Step 5: Add autoPrint toggle, printMode state (localStorage)
- [ ] Step 6: Build thermal print template (80mm CSS, bold totals, QR)
- [ ] Step 7: Build standard print template (A4, shop header, watermark)
- [ ] Step 8: QR code gen (canvas for invoiceId+date)
- [ ] Step 9: Update success modal + auto-print logic
- [x] Step 10: Update processSale to include customer_id
- [ ] Step 11: Test full flow + prints

Progress: Customer + basic dynamic shop complete. Next: Print engine + QR.
