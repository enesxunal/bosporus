-- Guest checkout fields
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS pickup_slot_label TEXT;

-- Orders inserted via API with service_role key (bypasses RLS)
