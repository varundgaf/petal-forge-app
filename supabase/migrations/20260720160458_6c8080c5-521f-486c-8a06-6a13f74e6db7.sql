
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'advertiser');
CREATE TYPE public.site_status AS ENUM ('pending', 'active', 'paused', 'rejected');
CREATE TYPE public.ad_format AS ENUM ('banner', 'native', 'popunder', 'social_bar', 'interstitial', 'video');
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE public.payment_method AS ENUM ('paypal', 'wire', 'crypto_btc', 'crypto_usdt', 'payoneer');
CREATE TYPE public.kyc_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  avatar_url TEXT,
  kyc_status public.kyc_status NOT NULL DEFAULT 'unverified',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ SITES ============
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  category TEXT,
  status public.site_status NOT NULL DEFAULT 'pending',
  monthly_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sites" ON public.sites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all sites" ON public.sites FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ AD UNITS ============
CREATE TABLE public.ad_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format public.ad_format NOT NULL,
  size TEXT,
  adsterra_zone_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_units TO authenticated;
GRANT ALL ON public.ad_units TO service_role;
ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad_units" ON public.ad_units FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all ad_units" ON public.ad_units FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ REVENUE EVENTS ============
CREATE TABLE public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  ad_unit_id UUID REFERENCES public.ad_units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  revenue NUMERIC(12,4) NOT NULL DEFAULT 0,
  cpm NUMERIC(10,4) NOT NULL DEFAULT 0,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revenue_user_date ON public.revenue_events(user_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_events TO authenticated;
GRANT ALL ON public.revenue_events TO service_role;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own revenue" ON public.revenue_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all revenue" ON public.revenue_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  destination TEXT,
  tx_hash TEXT,
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_sites_updated BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_ad_units_updated BEFORE UPDATE ON public.ad_units FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ NEW USER HANDLER + DEMO SEED ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
  v_site1 UUID;
  v_site2 UUID;
  v_unit1 UUID;
  v_unit2 UUID;
  v_unit3 UUID;
  i INTEGER;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'publisher');

  INSERT INTO public.profiles (id, email, name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'company'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  -- Seed demo data only for publishers
  IF v_role = 'publisher' THEN
    v_site1 := gen_random_uuid();
    v_site2 := gen_random_uuid();
    INSERT INTO public.sites (id, user_id, domain, category, status, monthly_visitors) VALUES
      (v_site1, NEW.id, 'techdaily.example.com', 'Technology', 'active', 245000),
      (v_site2, NEW.id, 'lifestylehub.example.com', 'Lifestyle', 'active', 128500);

    v_unit1 := gen_random_uuid();
    v_unit2 := gen_random_uuid();
    v_unit3 := gen_random_uuid();
    INSERT INTO public.ad_units (id, user_id, site_id, name, format, size, adsterra_zone_id, is_active) VALUES
      (v_unit1, NEW.id, v_site1, 'Header Banner', 'banner', '728x90', 'zone_' || substr(md5(random()::text), 1, 8), true),
      (v_unit2, NEW.id, v_site1, 'In-Article Native', 'native', 'responsive', 'zone_' || substr(md5(random()::text), 1, 8), true),
      (v_unit3, NEW.id, v_site2, 'Mobile Social Bar', 'social_bar', 'mobile', 'zone_' || substr(md5(random()::text), 1, 8), true);

    -- 30 days of revenue per unit
    FOR i IN 0..29 LOOP
      INSERT INTO public.revenue_events (user_id, site_id, ad_unit_id, date, impressions, clicks, revenue, cpm, country) VALUES
        (NEW.id, v_site1, v_unit1, CURRENT_DATE - i, 18000 + (random()*8000)::int, 220 + (random()*180)::int, round((45 + random()*35)::numeric, 2), round((2.1 + random()*1.4)::numeric, 2), 'US'),
        (NEW.id, v_site1, v_unit2, CURRENT_DATE - i, 12000 + (random()*5000)::int, 340 + (random()*220)::int, round((62 + random()*28)::numeric, 2), round((4.2 + random()*1.8)::numeric, 2), 'UK'),
        (NEW.id, v_site2, v_unit3, CURRENT_DATE - i, 8500 + (random()*4000)::int, 190 + (random()*140)::int, round((28 + random()*22)::numeric, 2), round((3.1 + random()*1.2)::numeric, 2), 'DE');
    END LOOP;

    INSERT INTO public.payments (user_id, amount, method, status, destination, paid_at) VALUES
      (NEW.id, 1245.80, 'paypal', 'paid', 'user@paypal.example', now() - INTERVAL '14 days'),
      (NEW.id, 842.35, 'crypto_usdt', 'pending', 'TXn...abc123', NULL);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
