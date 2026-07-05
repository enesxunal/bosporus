-- Kampanya e-posta başlığı (headline) ayrı saklansın

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS headline TEXT;

UPDATE email_campaigns
  SET headline = subject
  WHERE headline IS NULL;
