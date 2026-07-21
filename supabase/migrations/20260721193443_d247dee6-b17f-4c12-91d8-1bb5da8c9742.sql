
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS telegram TEXT,
  ADD COLUMN IF NOT EXISTS discord TEXT,
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method,
  ADD COLUMN IF NOT EXISTS payment_email TEXT,
  ADD COLUMN IF NOT EXISTS publisher_id TEXT UNIQUE;

-- Backfill publisher_id for existing rows
UPDATE public.profiles
SET publisher_id = 'PUB-' || LPAD((100000 + (abs(hashtext(id::text)) % 900000))::text, 6, '0')
WHERE publisher_id IS NULL;

-- Extend payment_status enum with approved / rejected
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'approved' AND enumtypid = 'public.payment_status'::regtype) THEN
    ALTER TYPE public.payment_status ADD VALUE 'approved';
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = 'public.payment_status'::regtype) THEN
    ALTER TYPE public.payment_status ADD VALUE 'rejected';
  END IF;
END$$;

-- Payments reference id
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS reference_id TEXT;

UPDATE public.payments
SET reference_id = 'PAY-' || UPPER(substr(md5(id::text), 1, 10))
WHERE reference_id IS NULL;

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notifications" ON public.notifications;
CREATE POLICY "own notifications" ON public.notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Activity log
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own activity" ON public.activity_logs;
CREATE POLICY "own activity" ON public.activity_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user to seed notifications & activity, plus richer site mix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_site_ok UUID;
  v_site_pending UUID;
  v_site_rejected UUID;
  v_unit1 UUID;
  v_unit2 UUID;
  v_pub_id TEXT;
  i INTEGER;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'publisher');
  v_pub_id := 'PUB-' || LPAD((100000 + (abs(hashtext(NEW.id::text)) % 900000))::text, 6, '0');

  INSERT INTO public.profiles (id, email, name, company, publisher_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'company',
    v_pub_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  IF v_role = 'publisher' THEN
    v_site_ok := gen_random_uuid();
    v_site_pending := gen_random_uuid();
    v_site_rejected := gen_random_uuid();
    INSERT INTO public.sites (id, user_id, domain, category, status, monthly_visitors) VALUES
      (v_site_ok, NEW.id, 'techdaily.example.com', 'Technology', 'active', 245000),
      (v_site_pending, NEW.id, 'newlaunch.example.com', 'Business', 'pending', 12000),
      (v_site_rejected, NEW.id, 'oldblog.example.com', 'Lifestyle', 'rejected', 4200);

    v_unit1 := gen_random_uuid();
    v_unit2 := gen_random_uuid();
    INSERT INTO public.ad_units (id, user_id, site_id, name, format, size, adsterra_zone_id, is_active) VALUES
      (v_unit1, NEW.id, v_site_ok, 'Header Banner', 'banner', '728x90', 'zone_' || substr(md5(random()::text), 1, 8), true),
      (v_unit2, NEW.id, v_site_ok, 'In-Article Native', 'native', 'responsive', 'zone_' || substr(md5(random()::text), 1, 8), true);

    FOR i IN 0..29 LOOP
      INSERT INTO public.revenue_events (user_id, site_id, ad_unit_id, date, impressions, clicks, revenue, cpm, country) VALUES
        (NEW.id, v_site_ok, v_unit1, CURRENT_DATE - i, 18000 + (random()*8000)::int, 220 + (random()*180)::int, round((45 + random()*35)::numeric, 2), round((2.1 + random()*1.4)::numeric, 2), 'US'),
        (NEW.id, v_site_ok, v_unit2, CURRENT_DATE - i, 12000 + (random()*5000)::int, 340 + (random()*220)::int, round((62 + random()*28)::numeric, 2), round((4.2 + random()*1.8)::numeric, 2), 'UK');
    END LOOP;

    INSERT INTO public.payments (user_id, amount, method, status, destination, reference_id, paid_at) VALUES
      (NEW.id, 1245.80, 'paypal', 'paid', 'user@paypal.example', 'PAY-' || UPPER(substr(md5(random()::text), 1, 10)), now() - INTERVAL '14 days'),
      (NEW.id, 842.35, 'crypto_usdt', 'pending', 'TXn...abc123', 'PAY-' || UPPER(substr(md5(random()::text), 1, 10)), NULL);

    INSERT INTO public.notifications (user_id, title, body, kind) VALUES
      (NEW.id, 'Welcome to AdProfitly', 'Your publisher account is ready. Complete your profile to speed up approvals.', 'info'),
      (NEW.id, 'Site approved', 'techdaily.example.com is now serving live ads.', 'success'),
      (NEW.id, 'Site pending review', 'newlaunch.example.com is queued for verification (usually 24–48h).', 'info');

    INSERT INTO public.activity_logs (user_id, action, detail) VALUES
      (NEW.id, 'Account created', 'Publisher ID ' || v_pub_id),
      (NEW.id, 'Site added', 'techdaily.example.com'),
      (NEW.id, 'Ad unit created', 'Header Banner'),
      (NEW.id, 'Payment processed', '$1,245.80 via PayPal');
  END IF;

  RETURN NEW;
END;
$function$;
