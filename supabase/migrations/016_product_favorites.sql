-- Product favorites (per authenticated user)
-- products.id = UUID PK (001_initial_schema)

CREATE TABLE IF NOT EXISTS product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_favorites_user ON product_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_product ON product_favorites(product_id);

ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_favorites_select_own" ON product_favorites;
DROP POLICY IF EXISTS "product_favorites_insert_own" ON product_favorites;
DROP POLICY IF EXISTS "product_favorites_delete_own" ON product_favorites;

CREATE POLICY "product_favorites_select_own"
  ON product_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "product_favorites_insert_own"
  ON product_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_favorites_delete_own"
  ON product_favorites FOR DELETE
  USING (auth.uid() = user_id);
