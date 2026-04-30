-- SQL Script to create purchases tables (Run in Supabase SQL Editor)
-- Multi-tenant: all filter by shop_id

-- Enable RLS for security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Main purchases table (similar to invoices)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  purchase_number TEXT UNIQUE,
  total_amount NUMERIC DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC NOT NULL CHECK (unit_cost >= 0),
  subtotal NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
CREATE POLICY "Shop owners can manage purchases" ON purchases
  FOR ALL USING (shop_id = auth.uid()::uuid) WITH CHECK (shop_id = auth.uid()::uuid);

CREATE POLICY "Shop owners can manage purchase items" ON purchase_items
  FOR ALL USING (EXISTS (SELECT 1 FROM purchases WHERE id = purchase_id AND shop_id = auth.uid()::uuid)) WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE id = purchase_id AND shop_id = auth.uid()::uuid));

-- Indexes for performance
CREATE INDEX idx_purchases_shop_id ON purchases(shop_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product_id ON purchase_items(product_id);

-- Function to auto-generate purchase_number (like INV-YYYYMMDD-###)
CREATE OR REPLACE FUNCTION generate_purchase_number(shop_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM '-[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM purchases 
  WHERE shop_id = shop_id_param 
    AND purchase_number LIKE 'PURCH-%' || year_month || '%';
  
  RETURN 'PURCH-' || year_month || '-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to set purchase_number
CREATE OR REPLACE FUNCTION set_purchase_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_number IS NULL THEN
    NEW.purchase_number := generate_purchase_number(NEW.shop_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_purchase_number
  BEFORE INSERT ON purchases
  FOR EACH ROW EXECUTE PROCEDURE set_purchase_number();

-- Stock increment function
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity NUMERIC, p_shop_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id AND shop_id = p_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
