CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_pub_id TEXT;
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
    INSERT INTO public.notifications (user_id, title, body, kind) VALUES
      (NEW.id, 'Welcome to AdProfitly', 'Your publisher account is ready. Add your first website to start monetizing.', 'info');

    INSERT INTO public.activity_logs (user_id, action, detail) VALUES
      (NEW.id, 'Account created', 'Publisher ID ' || v_pub_id);
  END IF;

  RETURN NEW;
END;
$function$;