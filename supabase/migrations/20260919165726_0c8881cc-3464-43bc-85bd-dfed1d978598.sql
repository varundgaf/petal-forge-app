REVOKE ALL ON TABLE public.networks FROM anon, authenticated;
REVOKE ALL ON TABLE public.smart_links FROM anon, authenticated;
REVOKE ALL ON TABLE public.network_stats FROM anon, authenticated;
REVOKE ALL ON TABLE public.publisher_earnings FROM anon, authenticated;
REVOKE ALL ON TABLE public.traffic_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.api_sync_logs FROM anon, authenticated;

CREATE POLICY "Service role manages networks"
ON public.networks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages smart links"
ON public.smart_links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages network stats"
ON public.network_stats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages publisher earnings"
ON public.publisher_earnings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages traffic events"
ON public.traffic_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages API sync logs"
ON public.api_sync_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);