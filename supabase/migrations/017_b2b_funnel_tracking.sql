-- Approved B2B funnel tracking (server-written, PII-free metadata)
-- Existing approved profiles intentionally remain approved_at = NULL.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS b2b_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL CHECK (
    event_name IN (
      'b2b_account_approved',
      'b2b_first_login_after_approval',
      'approved_b2b_view_item',
      'approved_b2b_add_to_cart',
      'approved_b2b_begin_checkout',
      'approved_b2b_purchase',
      'min_order_blocked',
      'quick_order_used',
      'favorite_used'
    )
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2b_funnel_events_name_created
  ON b2b_funnel_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_b2b_funnel_events_user_created
  ON b2b_funnel_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_b2b_funnel_events_user_dedupe
  ON b2b_funnel_events(user_id, event_name, dedupe_key)
  WHERE user_id IS NOT NULL AND dedupe_key IS NOT NULL;

ALTER TABLE b2b_funnel_events ENABLE ROW LEVEL SECURITY;

-- No client policies: only trusted server code using the service role can read/write.
REVOKE ALL ON TABLE b2b_funnel_events FROM anon, authenticated;
