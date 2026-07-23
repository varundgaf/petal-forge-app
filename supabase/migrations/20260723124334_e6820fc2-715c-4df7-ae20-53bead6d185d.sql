
-- ================= Profile expansions =================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_cycle TEXT DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles(lower(username)) WHERE username IS NOT NULL;

-- ================= Site expansions =================
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS ad_network TEXT,
  ADD COLUMN IF NOT EXISTS rev_share_override NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ================= Payment invoice url =================
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- ================= Notifications broadcast flag =================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- ================= Support tickets =================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_owner_select" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tickets_owner_insert" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_admin_all" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_support_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_msg_owner_read" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "ticket_msg_owner_reply" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND is_admin = false
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "ticket_msg_admin_all" ON public.ticket_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ================= CMS content =================
CREATE TABLE IF NOT EXISTS public.cms_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cms_content TO anon, authenticated;
GRANT ALL ON public.cms_content TO service_role;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_public_read" ON public.cms_content
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "cms_admin_all" ON public.cms_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ================= Platform settings =================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_all" ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default CMS keys
INSERT INTO public.cms_content (key, value) VALUES
  ('company', '{"name":"AdProfitly","support_email":"support@adprofitly.com","support_phone":"","whatsapp":"","telegram":"","discord":"","facebook":"","instagram":"","linkedin":"","twitter":"","youtube":"","address":""}'::jsonb),
  ('seo', '{"title":"AdProfitly","description":"Enterprise ad monetization","og_image":"","favicon":""}'::jsonb),
  ('home', '{"hero_title":"","hero_subtitle":"","features":[]}'::jsonb),
  ('legal', '{"privacy":"","terms":"","cookies":""}'::jsonb),
  ('faq', '{"items":[]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_settings (key, value) VALUES
  ('defaults', '{"revenue_share":70,"min_payout":50,"currency":"USD","payment_cycle":"weekly"}'::jsonb),
  ('maintenance', '{"enabled":false,"message":""}'::jsonb),
  ('smtp', '{"host":"","port":587,"user":"","from_email":"","from_name":"AdProfitly"}'::jsonb),
  ('branding', '{"logo_url":"","primary_color":"","favicon_url":""}'::jsonb),
  ('security', '{"require_2fa_for_admin":true,"session_hours":24}'::jsonb)
ON CONFLICT (key) DO NOTHING;
