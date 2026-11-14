CREATE TABLE public.publisher_payout_memberships (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  payout_plan text NOT NULL DEFAULT 'net30' CHECK (payout_plan IN ('net30','net15','net7')),
  monthly_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (
    (payout_plan = 'net30' AND monthly_price = 0) OR
    (payout_plan = 'net15' AND monthly_price = 500) OR
    (payout_plan = 'net7' AND monthly_price = 999)
  ),
  membership_status text NOT NULL DEFAULT 'free' CHECK (membership_status IN ('free','active','expired')),
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  last_modified_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > activated_at)
);
GRANT SELECT ON public.publisher_payout_memberships TO authenticated;
GRANT ALL ON public.publisher_payout_memberships TO service_role;
ALTER TABLE public.publisher_payout_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publishers read own membership and admins read all"
ON public.publisher_payout_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.payout_membership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_plan text CHECK (previous_plan IN ('net30','net15','net7')),
  new_plan text NOT NULL CHECK (new_plan IN ('net30','net15','net7')),
  monthly_price numeric(10,2) NOT NULL,
  membership_status text NOT NULL CHECK (membership_status IN ('free','active','expired')),
  activated_at timestamptz NOT NULL,
  expires_at timestamptz,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payout_membership_history TO authenticated;
GRANT ALL ON public.payout_membership_history TO service_role;
ALTER TABLE public.payout_membership_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publishers read own plan history and admins read all"
ON public.payout_membership_history FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX payout_membership_history_user_created_idx
ON public.payout_membership_history(user_id, created_at DESC);

INSERT INTO public.publisher_payout_memberships(user_id)
SELECT id FROM public.profiles
ON CONFLICT(user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.initialize_payout_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.publisher_payout_memberships(user_id)
  VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.initialize_payout_membership() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_payout_membership() TO service_role;
CREATE TRIGGER initialize_payout_membership
AFTER INSERT ON public.profiles FOR EACH ROW
EXECUTE FUNCTION public.initialize_payout_membership();

CREATE OR REPLACE FUNCTION public.change_payout_membership(
  actor uuid,
  target uuid,
  new_plan text,
  starts timestamptz,
  ends timestamptz,
  change_reason text DEFAULT NULL
) RETURNS public.publisher_payout_memberships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  previous public.publisher_payout_memberships;
  result public.publisher_payout_memberships;
  new_status text;
  new_price numeric(10,2);
BEGIN
  IF NOT public.has_role(actor, 'admin') THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;
  IF new_plan NOT IN ('net30','net15','net7') THEN
    RAISE EXCEPTION 'Invalid payout plan';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = target) THEN
    RAISE EXCEPTION 'Publisher not found';
  END IF;
  IF starts IS NULL THEN
    starts := now();
  END IF;
  IF ends IS NOT NULL AND ends <= starts THEN
    RAISE EXCEPTION 'Expiry date must be after activation date';
  END IF;
  new_price := CASE new_plan WHEN 'net30' THEN 0 WHEN 'net15' THEN 500 ELSE 999 END;
  new_status := CASE
    WHEN new_plan = 'net30' THEN 'free'
    WHEN ends IS NOT NULL AND ends <= now() THEN 'expired'
    ELSE 'active'
  END;

  PERFORM pg_advisory_xact_lock(hashtext(target::text));
  SELECT * INTO previous FROM public.publisher_payout_memberships WHERE user_id = target FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.publisher_payout_memberships(user_id) VALUES(target) RETURNING * INTO previous;
  END IF;

  UPDATE public.publisher_payout_memberships SET
    payout_plan = new_plan,
    monthly_price = new_price,
    membership_status = new_status,
    activated_at = starts,
    expires_at = CASE WHEN new_plan = 'net30' THEN NULL ELSE ends END,
    last_modified_by = actor,
    updated_at = now()
  WHERE user_id = target
  RETURNING * INTO result;

  INSERT INTO public.payout_membership_history(
    user_id, previous_plan, new_plan, monthly_price, membership_status,
    activated_at, expires_at, changed_by, reason
  ) VALUES(
    target, previous.payout_plan, new_plan, new_price, new_status,
    result.activated_at, result.expires_at, actor, nullif(trim(change_reason), '')
  );
  INSERT INTO public.audit_logs(admin_id, action, target_type, target_id, meta)
  VALUES(actor, 'membership.change_plan', 'publisher', target::text, jsonb_build_object(
    'previous_plan', previous.payout_plan,
    'new_plan', new_plan,
    'activated_at', result.activated_at,
    'expires_at', result.expires_at,
    'reason', nullif(trim(change_reason), '')
  ));
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.change_payout_membership(uuid,uuid,text,timestamptz,timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_payout_membership(uuid,uuid,text,timestamptz,timestamptz,text) TO service_role;