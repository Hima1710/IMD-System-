-- Create purchases table for reports (if missing)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  supplier_name TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own shop purchases" ON purchases
FOR SELECT USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own shop purchases" ON purchases
FOR INSERT WITH CHECK (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own shop purchases" ON purchases
FOR UPDATE USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_purchases_shop_id ON purchases(shop_id);

-- Insert sample data (optional - for testing)
INSERT INTO purchases (shop_id, supplier_name, total_amount) VALUES
  ((SELECT id FROM shops LIMIT 1), 'مورد عام', 12500.00),
  ((SELECT id FROM shops LIMIT 1), 'مورد قطع غيار', 8500.50);
