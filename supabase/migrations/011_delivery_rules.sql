-- Teslimat kuralları: B2B/B2C min sipariş, km bantları, ücretsiz eşik

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2);

CREATE TABLE IF NOT EXISTS delivery_settings (
  segment TEXT PRIMARY KEY,
  min_order_amount NUMERIC(10,2) NOT NULL,
  free_delivery_threshold NUMERIC(10,2),
  max_distance_km NUMERIC(6,2),
  depot_lat NUMERIC(10,7) NOT NULL DEFAULT 50.9647,
  depot_lng NUMERIC(10,7) NOT NULL DEFAULT 6.8792,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_fee_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL REFERENCES delivery_settings(segment) ON DELETE CASCADE,
  max_km NUMERIC(6,2) NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (segment, max_km)
);

ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_fee_bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_settings_read" ON delivery_settings FOR SELECT USING (true);
CREATE POLICY "delivery_fee_bands_read" ON delivery_fee_bands FOR SELECT USING (true);

INSERT INTO delivery_settings (segment, min_order_amount, free_delivery_threshold, max_distance_km)
VALUES
  ('b2c_delivery', 100, 250, 40),
  ('b2b_delivery', 1000, 2500, 50),
  ('b2c_pickup', 50, NULL, NULL),
  ('b2b_pickup', 500, NULL, NULL)
ON CONFLICT (segment) DO UPDATE SET
  min_order_amount = EXCLUDED.min_order_amount,
  free_delivery_threshold = EXCLUDED.free_delivery_threshold,
  max_distance_km = EXCLUDED.max_distance_km;

INSERT INTO delivery_fee_bands (segment, max_km, fee_amount, sort_order)
VALUES
  ('b2c_delivery', 10, 20, 1),
  ('b2c_delivery', 20, 30, 2),
  ('b2c_delivery', 30, 40, 3),
  ('b2c_delivery', 40, 50, 4),
  ('b2b_delivery', 10, 20, 1),
  ('b2b_delivery', 20, 30, 2),
  ('b2b_delivery', 30, 40, 3),
  ('b2b_delivery', 40, 50, 4),
  ('b2b_delivery', 50, 60, 5)
ON CONFLICT (segment, max_km) DO UPDATE SET
  fee_amount = EXCLUDED.fee_amount,
  sort_order = EXCLUDED.sort_order;
