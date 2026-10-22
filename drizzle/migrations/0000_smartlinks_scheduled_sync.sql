CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE TABLE IF NOT EXISTS public.cron_tokens (name text PRIMARY KEY, token text NOT NULL);
REVOKE ALL ON public.cron_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cron_tokens TO service_role;
ALTER TABLE public.cron_tokens ENABLE ROW LEVEL SECURITY;
INSERT INTO public.cron_tokens(name, token) VALUES ('smartlinks_sync', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) ON CONFLICT (name) DO NOTHING;
SELECT cron.schedule('smartlinks-sync-hourly', '5 * * * *', $$
  SELECT net.http_post(
    url := 'https://adprofitly.com/api/public/smartlinks-sync',
    headers := jsonb_build_object('Content-Type','application/json','x-sync-token',(SELECT token FROM public.cron_tokens WHERE name='smartlinks_sync')),
    body := '{}'::jsonb);
$$);