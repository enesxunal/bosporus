-- Bosporus GmbH E-Commerce Schema (MVP)
-- Loyalty system intentionally excluded

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('b2c', 'b2b_pending', 'b2b_approved');
CREATE TYPE order_type AS ENUM ('delivery', 'click_collect');
CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);
CREATE TYPE base_unit AS ENUM ('kg', 'piece', 'box', 'palette');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'b2c',
  company_name TEXT,
  company_address TEXT,
  vat_id TEXT,
  vat_verified BOOLEAN NOT NULL DEFAULT FALSE,
  locale TEXT NOT NULL DEFAULT 'de',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_tr TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  name_de TEXT NOT NULL,
  name_tr TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  image_url TEXT,
  base_unit base_unit NOT NULL DEFAULT 'piece',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  price_b2c NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_b2b NUMERIC(10,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(10,2),
  promo_from DATE,
  promo_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_slug);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_name_de ON products USING gin (to_tsvector('german', name_de));

-- Delivery zones
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,
  name_tr TEXT,
  zip_prefixes TEXT[] NOT NULL,
  min_order_amount NUMERIC(10,2) NOT NULL,
  delivery_days INT[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  sort_order INT NOT NULL DEFAULT 0
);

-- Pickup time slots (30-min windows, Mo-Sa 00:00-18:00)
CREATE TABLE pickup_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (weekday, start_time)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  is_b2b BOOLEAN NOT NULL DEFAULT FALSE,
  subtotal_net NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_gross NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  delivery_zip_code TEXT,
  delivery_address JSONB,
  pickup_date DATE,
  pickup_slot_id UUID REFERENCES pickup_slots(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  unit_price_net NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL,
  line_total_gross NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'b2c');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read: categories, products (B2B prices hidden via view), zones, slots
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "zones_public_read" ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "slots_public_read" ON pickup_slots FOR SELECT USING (is_active = true);

-- Profiles: own row only
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Orders: own orders
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

-- Seed delivery zones (Köln area)
INSERT INTO delivery_zones (name_de, name_tr, zip_prefixes, min_order_amount, delivery_days, sort_order) VALUES
  ('Köln Zentrum', 'Köln Merkez', ARRAY['50667','50668','50670','50672','50674','50676','50677','50678','50679','50733','50735','50737','50739'], 150, '{1,2,3,4,5,6}', 1),
  ('Köln Umland', 'Köln Çevresi', ARRAY['50','51'], 300, '{1,3,5}', 2),
  ('NRW Weit', 'Geniş NRW', ARRAY['52','53','54','55','56','57','58','59'], 500, '{2,5}', 3);

-- Seed pickup slots: Mo-Sa (1-6), every 30 min 00:00-18:00
DO $$
DECLARE
  d INT;
  h INT;
  m INT;
  t_start TIME;
  t_end TIME;
BEGIN
  FOR d IN 1..6 LOOP
    FOR h IN 0..17 LOOP
      FOR m IN 0..1 LOOP
        t_start := make_time(h, m * 30, 0);
        t_end := t_start + INTERVAL '30 minutes';
        IF t_end <= TIME '18:30' THEN
          INSERT INTO pickup_slots (weekday, start_time, end_time)
          VALUES (d, t_start, t_end)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
