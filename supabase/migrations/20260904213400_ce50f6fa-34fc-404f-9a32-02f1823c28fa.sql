ALTER TABLE public.revenue_events
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS bot_impressions bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proxy_impressions bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicate_ip_clicks bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_visitors bigint NOT NULL DEFAULT 0;