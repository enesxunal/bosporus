-- B2B min sipariş 500 € (teslimat); ilk sipariş ücretsiz getirme kodda

UPDATE delivery_settings
SET
  min_order_amount = 500,
  updated_at = NOW()
WHERE segment = 'b2b_delivery'
  AND min_order_amount > 500;
