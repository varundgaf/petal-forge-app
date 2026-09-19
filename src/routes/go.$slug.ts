import { createHash } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

const missing = () => new Response("SmartLink not found.", { status: 404 });

function classifyUserAgent(value: string) {
  if (/bot|crawler|spider|headless|curl|wget|python|httpclient/i.test(value)) return "bot";
  if (/mobile|android|iphone|ipad/i.test(value)) return "mobile";
  return "desktop";
}

export const Route = createFileRoute("/go/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!/^[a-z0-9][a-z0-9-]{5,63}$/.test(params.slug)) return missing();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: link, error } = await supabaseAdmin
          .from("smart_links")
          .select("id,user_id,destination_url,placement_sub_id,status,networks!inner(provider_key,is_active)")
          .eq("slug", params.slug)
          .eq("status", "active")
          .maybeSingle();
        if (error || !link) return missing();

        const network = link.networks as unknown as { provider_key: string; is_active: boolean };
        if (!network.is_active) return missing();

        const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ip = forwarded || request.headers.get("cf-connecting-ip") || "unknown";
        const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-24) || "adprofitly";
        const fingerprint = createHash("sha256").update(`${salt}:${ip}`).digest("hex");
        const userAgent = request.headers.get("user-agent") || "";
        const userAgentClass = classifyUserAgent(userAgent);
        const since = new Date(Date.now() - 60_000).toISOString();
        const { count } = await supabaseAdmin
          .from("traffic_events")
          .select("id", { count: "exact", head: true })
          .eq("smart_link_id", link.id)
          .eq("ip_fingerprint", fingerprint)
          .gte("occurred_at", since);
        const excessive = (count ?? 0) >= 20;
        const suspicious = userAgentClass === "bot" || excessive || !userAgent;
        const reason = userAgentClass === "bot" ? "automated_user_agent" : excessive ? "rate_limit" : !userAgent ? "missing_user_agent" : null;

        const referrer = request.headers.get("referer");
        let referrerHost: string | null = null;
        try { referrerHost = referrer ? new URL(referrer).hostname.slice(0, 253) : null; } catch { referrerHost = null; }
        const country = request.headers.get("cf-ipcountry")?.slice(0, 3) || null;
        await supabaseAdmin.from("traffic_events").insert({
          smart_link_id: link.id,
          user_id: link.user_id,
          ip_fingerprint: fingerprint,
          country,
          device: userAgentClass === "bot" ? null : userAgentClass,
          referrer_host: referrerHost,
          user_agent_class: userAgentClass,
          is_suspicious: suspicious,
          suspicion_reason: reason,
        });

        if (excessive) return new Response("Too many requests.", { status: 429, headers: { "Retry-After": "60" } });
        const { getSmartLinkProvider } = await import("@/lib/smartlinks/adsterra.server");
        const destination = getSmartLinkProvider(network.provider_key).buildRedirectUrl(link.destination_url, link.placement_sub_id);
        return new Response(null, {
          status: 302,
          headers: { Location: destination.toString(), "Cache-Control": "no-store", "Referrer-Policy": "strict-origin-when-cross-origin" },
        });
      },
    },
  },
});