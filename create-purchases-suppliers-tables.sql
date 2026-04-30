-- ================================================
-- IMD POS - Purchases & Suppliers Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_debt DECIMAL(12,2) DEFAULT 0,
  total_purchases DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Suppliers
CREATE POLICY "Suppliers are viewable by shop members"
  ON suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL AND shop_id IN (
    SELECT shop_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Suppliers are insertable by shop members"
  ON suppliers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND shop_id IN (
    SELECT shop_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Suppliers are updatable by shop members"
  ON suppliers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND shop_id IN (
    SELECT shop_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Suppliers are deletable by shop members"
  ON suppliers FOR DELETE
  USING (auth.uid() IS NOT NULL AND shop_id IN (
    SELECT shop_id FROM profiles WHERE id = auth.uid()
  ));

-- Purchase Items Table (for individual items in a purchase)
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Purchase Items
CREATE POLICY "Purchase items are viewable by shop members"
  ON purchase_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    purchase_id IN (
      SELECT id FROM purchases WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Purchase items are insertable by shop members"
  ON purchase_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    purchase_id IN (
      SELECT id FROM purchases WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Purchase items are deletable by shop members"
  ON purchase_items FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    purchase_id IN (
      SELECT id FROM purchases WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ================================================
-- Trigger to auto-update stock_quantity on purchase
-- ================================================
CREATE OR REPLACE FUNCTION update_product_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase stock when purchase is confirmed/completed
  IF NEW.status = 'completed' AND TG_OP = 'INSERT' THEN
    -- Update each product item
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id AND shop_id IN (SELECT shop_id FROM purchases WHERE id = NEW.purchase_id);
  END IF;
  
  -- Decrease stock when purchase is cancelled
  IF OLD.status = 'completed' AND NEW.status = 'cancelled' AND TG_OP = 'UPDATE' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - OLD.quantity,
        updated_at = now()
    WHERE id = OLD.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for purchase_items
DROP TRIGGER IF EXISTS trg_update_stock_on_purchase ON purchase_items;
CREATE TRIGGER trg_update_stock_on_purchase
AFTER INSERT OR UPDATE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_purchase();

-- ================================================
-- Sales Items Table (for invoice items)
-- ================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Sale Items
CREATE POLICY "Sale items are viewable by shop members"
  ON sale_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    sale_id IN (
      SELECT id FROM sales WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Sale items are insertable by shop members"
  ON sale_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    sale_id IN (
      SELECT id FROM sales WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ================================================
-- Trigger to auto-decrement stock on sale
-- ================================================
CREATE OR REPLACE FUNCTION decrement_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id AND shop_id IN (SELECT shop_id FROM sales WHERE id = NEW.sale_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sale_items
DROP TRIGGER IF EXISTS trg_decrement_stock_on_sale ON sale_items;
CREATE TRIGGER trg_decrement_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_sale();

-- ================================================
-- Indexes for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_shop_id ON suppliers(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchases_shop_id ON purchases(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
