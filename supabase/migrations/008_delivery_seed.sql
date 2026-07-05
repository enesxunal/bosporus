-- Teslimat bölgeleri ve gel-al saatleri (boşsa seed)

INSERT INTO delivery_zones (name_de, name_tr, zip_prefixes, min_order_amount, delivery_days, sort_order)
SELECT * FROM (VALUES
  ('Köln Zentrum', 'Köln Merkez', ARRAY['50667','50668','50670','50672','50674','50676','50677','50678','50679','50733','50735','50737','50739']::TEXT[], 150::NUMERIC, ARRAY[1,2,3,4,5,6]::INT[], 1),
  ('Köln Umland', 'Köln Çevresi', ARRAY['50','51']::TEXT[], 300::NUMERIC, ARRAY[1,3,5]::INT[], 2),
  ('NRW Weit', 'Geniş NRW', ARRAY['52','53','54','55','56','57','58','59']::TEXT[], 500::NUMERIC, ARRAY[2,5]::INT[], 3)
) AS v(name_de, name_tr, zip_prefixes, min_order_amount, delivery_days, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM delivery_zones LIMIT 1);

-- Gel-al slotları: Pzt–Cmt 00:00–18:00, 30 dk
DO $$
DECLARE
  wd INT;
  h INT;
  m INT;
  st TIME;
  en TIME;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pickup_slots LIMIT 1) THEN
    FOR wd IN 1..6 LOOP
      FOR h IN 0..17 LOOP
        FOR m IN 0..1 LOOP
          IF h = 17 AND m = 1 THEN CONTINUE; END IF;
          st := make_time(h, CASE WHEN m = 0 THEN 0 ELSE 30 END, 0);
          en := make_time(
            CASE WHEN m = 1 THEN h + 1 ELSE h END,
            CASE WHEN m = 1 THEN 0 ELSE 30 END,
            0
          );
          INSERT INTO pickup_slots (weekday, start_time, end_time, max_orders, is_active)
          VALUES (wd, st, en, 10, true)
          ON CONFLICT (weekday, start_time) DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END IF;
END $$;
