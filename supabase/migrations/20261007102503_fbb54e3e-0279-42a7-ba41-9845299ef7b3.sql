CREATE OR REPLACE FUNCTION public.replace_smartlink_report(_network_id uuid, _user_id uuid, _from date, _to date, _rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE written integer;
BEGIN
 IF _from > _to OR _to - _from > 365 OR jsonb_typeof(_rows) <> 'array' THEN RAISE EXCEPTION 'Invalid report'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(_network_id::text || coalesce(_user_id::text, 'all')));
 IF EXISTS (SELECT 1 FROM jsonb_to_recordset(_rows) AS r(smart_link_id uuid, stat_date date) LEFT JOIN public.smart_links s ON s.id=r.smart_link_id WHERE s.id IS NULL OR s.network_id <> _network_id OR (_user_id IS NOT NULL AND s.user_id <> _user_id) OR r.stat_date IS NULL OR r.stat_date < _from OR r.stat_date > _to) THEN RAISE EXCEPTION 'Invalid report ownership'; END IF;
 DELETE FROM public.network_stats WHERE network_id=_network_id AND (_user_id IS NULL OR user_id=_user_id) AND stat_date BETWEEN _from AND _to;
 INSERT INTO public.network_stats (user_id,smart_link_id,network_id,stat_date,country,device,referrer,impressions,clicks,revenue,ctr,cpm)
 SELECT s.user_id,s.id,_network_id,r.stat_date,coalesce(r.country,''),'','',sum(r.impressions),sum(r.clicks),sum(r.revenue),CASE WHEN sum(r.impressions)>0 THEN sum(r.clicks)*100.0/sum(r.impressions) ELSE 0 END,CASE WHEN sum(r.impressions)>0 THEN sum(r.revenue)*1000.0/sum(r.impressions) ELSE 0 END FROM jsonb_to_recordset(_rows) AS r(smart_link_id uuid,stat_date date,country text,impressions bigint,clicks bigint,revenue numeric) JOIN public.smart_links s ON s.id=r.smart_link_id GROUP BY s.user_id,s.id,r.stat_date,coalesce(r.country,'');
 GET DIAGNOSTICS written = ROW_COUNT;
 DELETE FROM public.publisher_earnings e USING public.smart_links s WHERE e.smart_link_id=s.id AND s.network_id=_network_id AND (_user_id IS NULL OR s.user_id=_user_id) AND e.earning_date BETWEEN _from AND _to;
 INSERT INTO public.publisher_earnings (user_id,smart_link_id,earning_date,gross_revenue,revenue_share,publisher_revenue)
 SELECT n.user_id,n.smart_link_id,n.stat_date,sum(n.revenue),p.revenue_share,sum(n.revenue)*p.revenue_share/100 FROM public.network_stats n JOIN public.profiles p ON p.id=n.user_id WHERE n.network_id=_network_id AND (_user_id IS NULL OR n.user_id=_user_id) AND n.stat_date BETWEEN _from AND _to GROUP BY n.user_id,n.smart_link_id,n.stat_date,p.revenue_share;
 UPDATE public.networks SET last_synced_at=now() WHERE id=_network_id;
 RETURN written;
END; $$;
REVOKE ALL ON FUNCTION public.replace_smartlink_report(uuid,uuid,date,date,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.replace_smartlink_report(uuid,uuid,date,date,jsonb) TO service_role;