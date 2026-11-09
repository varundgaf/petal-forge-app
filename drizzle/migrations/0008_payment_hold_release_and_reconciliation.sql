ALTER FUNCTION public.payment_operate(uuid,text,jsonb) RENAME TO payment_operate_core;
CREATE OR REPLACE FUNCTION public.payment_operate(actor uuid,operation text,d jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE u uuid; b public.publisher_earnings_batches; pay public.payments; amount numeric; source_amount numeric; key text; result jsonb; BEGIN
IF operation IN ('batch_reconcile','payment_unhold') THEN
IF NOT public.has_role(actor,'admin') THEN RAISE EXCEPTION 'Admin permission required'; END IF;
IF nullif(trim(d->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Documented reconciliation reason required'; END IF;
IF operation='batch_reconcile' THEN SELECT * INTO b FROM public.publisher_earnings_batches WHERE id=(d->>'batch_id')::uuid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Batch not found'; END IF; u:=b.user_id;
IF b.source='website' THEN SELECT coalesce(sum(e.revenue*p.revenue_share/100),0) INTO source_amount FROM public.revenue_events e JOIN public.profiles p ON p.id=e.user_id WHERE e.user_id=u AND e.site_id IS NOT NULL AND e.date=b.period_start;
ELSIF b.source='smartlink' THEN SELECT coalesce(sum(n.revenue*p.revenue_share/100),0) INTO source_amount FROM public.network_stats n JOIN public.profiles p ON p.id=n.user_id WHERE n.user_id=u AND n.source='api' AND n.stat_date=b.period_start; ELSE RAISE EXCEPTION 'Unsupported source reconciliation'; END IF;
IF source_amount<>b.gross THEN RAISE EXCEPTION 'Source amount does not match the recorded batch. Resolve source evidence first'; END IF;
UPDATE public.publisher_earnings_batches SET reconciliation_open=false,investigation_open=false,approved=false,status=CASE WHEN finalized_at IS NULL THEN 'under_verification' ELSE 'finalized' END WHERE id=b.id;
ELSE SELECT * INTO pay FROM public.payments WHERE id=(d->>'payment_id')::uuid FOR UPDATE; IF NOT FOUND OR pay.lifecycle_status<>'on_hold' OR pay.status='paid' THEN RAISE EXCEPTION 'Held unpaid payment required'; END IF; u:=pay.user_id;
UPDATE public.payments SET lifecycle_status=CASE WHEN status IN ('approved','pending') THEN 'payment_eligible' ELSE status::text END,hold_reason=NULL WHERE id=pay.id; END IF;
INSERT INTO public.publisher_payment_events(user_id,payment_id,batch_id,kind,reason,actor_id,idempotency_key) VALUES(u,pay.id,b.id,operation,d->>'reason',actor,coalesce(d->>'key',gen_random_uuid()::text));
INSERT INTO public.audit_logs(admin_id,action,target_type,target_id,meta) VALUES(actor,'finance.'||operation,'payment_management',coalesce(pay.id,b.id)::text,jsonb_build_object('reason',d->>'reason'));
PERFORM public.payment_notify(u,'Payment hold updated',d->>'reason'); RETURN jsonb_build_object('ok',true);
END IF;
-- Stable keys make retried admin transitions return the previously committed result.
key:=d->>'key'; IF key IS NOT NULL AND EXISTS(SELECT 1 FROM public.publisher_payment_events WHERE idempotency_key=key AND actor_id=actor) THEN RETURN jsonb_build_object('ok',true,'replayed',true); END IF;
IF operation='payment_release' THEN
SELECT * INTO pay FROM public.payments WHERE id=(d->>'payment_id')::uuid; IF NOT EXISTS(SELECT 1 FROM public.publisher_policy_acceptances a JOIN public.publisher_payment_policy p ON p.version=a.version WHERE a.user_id=pay.user_id) THEN RAISE EXCEPTION 'Current policy acknowledgement required'; END IF;
IF EXISTS(SELECT 1 FROM public.publisher_payment_accounts WHERE user_id=pay.user_id AND (method<>pay.method OR destination IS DISTINCT FROM pay.destination)) THEN RAISE EXCEPTION 'Payment account changed; reconcile existing payout before release'; END IF;
END IF;
result:=public.payment_operate_core(actor,operation,d); RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.payment_operate(uuid,text,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.payment_operate(uuid,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.payment_operate_core(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;