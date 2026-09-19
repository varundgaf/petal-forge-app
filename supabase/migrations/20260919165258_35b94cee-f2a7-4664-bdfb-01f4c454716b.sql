CREATE TABLE public.networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_key text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.networks TO service_role;
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.smart_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_id uuid NOT NULL REFERENCES public.networks(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  traffic_source text NOT NULL CHECK (char_length(traffic_source) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{5,63}$'),
  placement_sub_id text NOT NULL UNIQUE CHECK (placement_sub_id ~ '^[A-Za-z0-9_-]{8,80}$'),
  network_placement_id text,
  destination_url text NOT NULL CHECK (destination_url ~ '^https://'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.smart_links TO service_role;
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.network_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  smart_link_id uuid NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  network_id uuid NOT NULL REFERENCES public.networks(id) ON DELETE RESTRICT,
  stat_date date NOT NULL,
  country text NOT NULL DEFAULT '',
  device text NOT NULL DEFAULT '',
  referrer text NOT NULL DEFAULT '',
  impressions bigint NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks bigint NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  revenue numeric(14,6) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  ctr numeric(12,6) NOT NULL DEFAULT 0 CHECK (ctr >= 0),
  cpm numeric(14,6) NOT NULL DEFAULT 0 CHECK (cpm >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (smart_link_id, stat_date, country, device, referrer)
);
GRANT ALL ON public.network_stats TO service_role;
ALTER TABLE public.network_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.publisher_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  smart_link_id uuid NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  earning_date date NOT NULL,
  gross_revenue numeric(14,6) NOT NULL DEFAULT 0 CHECK (gross_revenue >= 0),
  revenue_share numeric(5,2) NOT NULL CHECK (revenue_share >= 0 AND revenue_share <= 100),
  publisher_revenue numeric(14,6) NOT NULL DEFAULT 0 CHECK (publisher_revenue >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (smart_link_id, earning_date)
);
GRANT ALL ON public.publisher_earnings TO service_role;
ALTER TABLE public.publisher_earnings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.traffic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_id uuid NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  ip_fingerprint text NOT NULL,
  country text,
  device text,
  referrer_host text,
  user_agent_class text,
  is_suspicious boolean NOT NULL DEFAULT false,
  suspicion_reason text
);
GRANT ALL ON public.traffic_events TO service_role;
ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.api_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  rows_received integer NOT NULL DEFAULT 0 CHECK (rows_received >= 0),
  rows_written integer NOT NULL DEFAULT 0 CHECK (rows_written >= 0),
  error_code text
);
GRANT ALL ON public.api_sync_logs TO service_role;
ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX smart_links_user_created_idx ON public.smart_links(user_id, created_at DESC);
CREATE INDEX smart_links_active_slug_idx ON public.smart_links(slug) WHERE status = 'active';
CREATE INDEX network_stats_user_date_idx ON public.network_stats(user_id, stat_date DESC);
CREATE INDEX network_stats_link_date_idx ON public.network_stats(smart_link_id, stat_date DESC);
CREATE INDEX publisher_earnings_user_date_idx ON public.publisher_earnings(user_id, earning_date DESC);
CREATE INDEX traffic_events_link_time_idx ON public.traffic_events(smart_link_id, occurred_at DESC);
CREATE INDEX traffic_events_fingerprint_time_idx ON public.traffic_events(ip_fingerprint, occurred_at DESC);
CREATE INDEX api_sync_logs_network_started_idx ON public.api_sync_logs(network_id, started_at DESC);

CREATE TRIGGER trg_networks_updated BEFORE UPDATE ON public.networks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_smart_links_updated BEFORE UPDATE ON public.smart_links FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_network_stats_updated BEFORE UPDATE ON public.network_stats FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_publisher_earnings_updated BEFORE UPDATE ON public.publisher_earnings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.networks (name, provider_key, is_active)
VALUES ('Adsterra', 'adsterra', true)
ON CONFLICT (provider_key) DO UPDATE SET name = EXCLUDED.name, is_active = true;