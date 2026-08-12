ALTER TABLE public.revenue_events ADD COLUMN IF NOT EXISTS pageviews bigint NOT NULL DEFAULT 0;

-- uniqueness enforced at seed time instead (existing data contains duplicates)