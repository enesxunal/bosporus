-- Pfand: ürünlere bağlı depozito (otomatik sepet satırı için)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pfand_sku TEXT;

CREATE INDEX IF NOT EXISTS idx_products_pfand_sku
  ON products (pfand_sku)
  WHERE pfand_sku IS NOT NULL;
