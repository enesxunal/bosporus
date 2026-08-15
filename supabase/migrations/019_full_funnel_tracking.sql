-- Full-funnel visitor tracking (all visitors, guests included).
-- Additive only: no drop, no backfill, no destructive update.
-- PII-free: only first-party anonymous_id / session_id, coarse device,
-- normalized source and bucketed funnel metadata are stored.
-- Existing approved-B2B tracking (b2b_funnel_events) is left untouched.

CREATE TABLE IF NOT EXISTS site_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT CHECK (
    anonymous_id IS NULL
    OR anonymous_id ~ '^[0-9a-fA-F-]{16,64}$'
  ),
  session_id TEXT CHECK (
    session_id IS NULL
    OR session_id ~ '^[0-9a-fA-F-]{16,64}$'
  ),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL CHECK (
    event_name IN (
      'site_visit',
      'product_view',
      'add_to_cart',
      'cart_view',
      'min_order_blocked',
      'register_view',
      'login_view',
      'registration_started',
      'registration_completed',
      'b2b_application_submitted',
      'begin_checkout',
      'quick_order_view',
      'quick_order_used',
      'purchase'
    )
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- At least one first-party identity must be present.
  CONSTRAINT site_funnel_events_identity_present
    CHECK (anonymous_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_site_funnel_events_created
  ON site_funnel_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_funnel_events_name_created
  ON site_funnel_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_funnel_events_anon_created
  ON site_funnel_events(anonymous_id, created_at DESC)
  WHERE anonymous_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_site_funnel_events_user_created
  ON site_funnel_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_site_funnel_events_session
  ON site_funnel_events(session_id)
  WHERE session_id IS NOT NULL;

-- Idempotency for session-scoped events (e.g. one site_visit per session).
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_funnel_events_dedupe
  ON site_funnel_events(event_name, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE site_funnel_events ENABLE ROW LEVEL SECURITY;

-- No client policies: only trusted server code (service role) reads/writes.
REVOKE ALL ON TABLE site_funnel_events FROM anon, authenticated;

-- Non-destructive mapping between anonymous first-party journeys and
-- authenticated users. Past events are never rewritten; the dashboard
-- unifies journeys through this mapping at query time.
CREATE TABLE IF NOT EXISTS visitor_identity_links (
  anonymous_id TEXT NOT NULL CHECK (anonymous_id ~ '^[0-9a-fA-F-]{16,64}$'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (anonymous_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_visitor_identity_links_user
  ON visitor_identity_links(user_id);

ALTER TABLE visitor_identity_links ENABLE ROW LEVEL SECURITY;

-- No client policies: server session is the source of truth for user_id.
REVOKE ALL ON TABLE visitor_identity_links FROM anon, authenticated;
