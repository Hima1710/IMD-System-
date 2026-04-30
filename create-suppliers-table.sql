-- Create Suppliers Table for Multi-tenant ERP System

-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS suppliers CASCADE;

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  total_owed NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers (must match shop_id)
CREATE POLICY "Suppliers are viewable by shop owners"
  ON suppliers FOR SELECT
  USING (auth.uid() IN (
    SELECT owner_id FROM shops WHERE id = suppliers.shop_id
  ) OR auth.uid() IN (
    SELECT id FROM profiles WHERE shop_id = suppliers.shop_id AND role = 'superadmin'
  ));

CREATE POLICY "Suppliers are insertable by shop owners"
  ON suppliers FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT owner_id FROM shops WHERE id = suppliers.shop_id
  ));

CREATE POLICY "Suppliers are updatable by shop owners"
  ON suppliers FOR UPDATE
  USING (auth.uid() IN (
    SELECT owner_id FROM shops WHERE id = suppliers.shop_id
  ));

CREATE POLICY "Suppliers are deletable by shop owners"
  ON suppliers FOR DELETE
  USING (auth.uid() IN (
    SELECT owner_id FROM shops WHERE id = suppliers.shop_id
  ));

-- Create index for faster queries
CREATE INDEX idx_suppliers_shop_id ON suppliers(shop_id);
CREATE INDEX idx_suppliers_created_at ON suppliers(created_at DESC);

-- Add comments
COMMENT ON TABLE suppliers IS 'الموردين - Suppliers Table for multi-tenant ERP';
COMMENT ON COLUMN suppliers.shop_id IS 'معرف المتجر المرتبط';
COMMENT ON COLUMN suppliers.name IS 'اسم المورد';
COMMENT ON COLUMN suppliers.phone IS 'رقم هاتف المورد';
COMMENT ON COLUMN suppliers.total_owed IS 'المبلغ المستحق للمورد';

-- Insert sample data for testing (will only work if you have shops)
-- INSERT INTO suppliers (shop_id, name, phone, total_owed) VALUES
-- ('your-shop-id', 'مورد电子产品', '+201000000001', 5000.00),
-- ('your-shop-id', 'مورد مواد غذائية', '+201000000002', 3500.00);
