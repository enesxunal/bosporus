-- Internal first-touch acquisition attribution.
-- Additive only: no backfill and no historical source inference.

CREATE TABLE IF NOT EXISTS user_acquisition (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (
    source IN (
      'google_ads',
      'facebook',
      'instagram',
      'tiktok',
      'organic',
      'direct',
      'referral',
      'unknown'
    )
  ),
  medium TEXT NOT NULL CHECK (
    medium IN ('paid', 'social', 'organic', 'direct', 'referral', 'unknown')
  ),
  campaign TEXT CHECK (
    campaign IS NULL
    OR (
      char_length(campaign) BETWEEN 1 AND 100
      AND campaign ~ '^[a-z0-9][a-z0-9._~-]*$'
    )
  ),
  click_id_type TEXT CHECK (
    click_id_type IS NULL OR click_id_type IN ('gclid', 'fbclid', 'ttclid')
  ),
  first_seen_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_acquisition_source
  ON user_acquisition(source);

CREATE INDEX IF NOT EXISTS idx_user_acquisition_first_seen
  ON user_acquisition(first_seen_at DESC);

ALTER TABLE user_acquisition ENABLE ROW LEVEL SECURITY;

-- No client policies: authenticated clients cannot read or write attribution.
-- The trusted server claim endpoint and admin aggregate use the service role.
REVOKE ALL ON TABLE user_acquisition FROM anon, authenticated;
