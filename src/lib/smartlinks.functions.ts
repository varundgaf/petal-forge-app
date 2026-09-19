import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type DateRange = { from: string; to: string };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[0-9a-f-]{36}$/i;

function rangeInput(data: DateRange) {
  if (!datePattern.test(data.from) || !datePattern.test(data.to) || data.from > data.to) {
    throw new Error("Invalid date range.");
  }
  return data;
}

function idInput(data: { id: string }) {
  if (!idPattern.test(data.id)) throw new Error("Invalid SmartLink.");
  return data;
}

function cleanText(value: string, label: string) {
  const clean = value.trim();
  if (!clean || clean.length > 120) throw new Error(`${label} must be between 1 and 120 characters.`);
  return clean;
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const listSmartLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await admin();
    const { data: links, error } = await supabaseAdmin
      .from("smart_links")
      .select("id,name,traffic_source,slug,status,created_at,network_placement_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (links ?? []).map((link) => link.id);
    const stats = ids.length
      ? await supabaseAdmin.from("network_stats").select("smart_link_id,clicks,revenue,impressions").eq("user_id", context.userId).in("smart_link_id", ids)
      : { data: [], error: null };
    if (stats.error) throw new Error(stats.error.message);

    const totals = new Map<string, { clicks: number; revenue: number; impressions: number }>();
    for (const row of stats.data ?? []) {
      const current = totals.get(row.smart_link_id) ?? { clicks: 0, revenue: 0, impressions: 0 };
      current.clicks += Number(row.clicks);
      current.revenue += Number(row.revenue);
      current.impressions += Number(row.impressions);
      totals.set(row.smart_link_id, current);
    }

    return (links ?? []).map((link) => {
      const total = totals.get(link.id) ?? { clicks: 0, revenue: 0, impressions: 0 };
      return {
        ...link,
        ...total,
        cpm: total.impressions ? (total.revenue / total.impressions) * 1000 : 0,
        branded_url: `https://adprofitly.com/go/${link.slug}`,
      };
    });
  });

export const listNetworkPlacements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getSmartLinkProvider } = await import("@/lib/smartlinks/adsterra.server");
    return getSmartLinkProvider("adsterra").listPlacements();
  });

export const createSmartLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string; trafficSource: string; placementId: string }) => data)
  .handler(async ({ context, data }) => {
    const name = cleanText(data.name, "Name");
    const trafficSource = cleanText(data.trafficSource, "Traffic source");
    if (!data.placementId || data.placementId.length > 100) throw new Error("Choose an approved SmartLink placement.");

    const supabaseAdmin = await admin();
    const { data: network, error: networkError } = await supabaseAdmin
      .from("networks")
      .select("id,provider_key")
      .eq("provider_key", "adsterra")
      .eq("is_active", true)
      .single();
    if (networkError || !network) throw new Error("SmartLink network is unavailable.");

    const { getSmartLinkProvider } = await import("@/lib/smartlinks/adsterra.server");
    const placements = await getSmartLinkProvider(network.provider_key).listPlacements();
    const placement = placements.find((item) => item.id === data.placementId);
    if (!placement) throw new Error("This placement is not approved by the network.");

    const slug = randomBytes(9).toString("base64url").toLowerCase();
    const placementSubId = `ap_${context.userId.replaceAll("-", "").slice(0, 8)}_${randomBytes(6).toString("hex")}`;
    const { data: row, error } = await supabaseAdmin
      .from("smart_links")
      .insert({
        user_id: context.userId,
        network_id: network.id,
        name,
        traffic_source: trafficSource,
        slug,
        placement_sub_id: placementSubId,
        network_placement_id: placement.id,
        destination_url: placement.url,
      })
      .select("id,name,slug,status")
      .single();
    if (error) throw new Error(error.message);
    return { ...row, branded_url: `https://adprofitly.com/go/${row.slug}` };
  });

export const setSmartLinkStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "active" | "paused" }) => ({ ...idInput(data), status: data.status }))
  .handler(async ({ context, data }) => {
    if (!(["active", "paused"] as const).includes(data.status)) throw new Error("Invalid status.");
    const supabaseAdmin = await admin();
    const { error, count } = await supabaseAdmin
      .from("smart_links")
      .update({ status: data.status }, { count: "exact" })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("SmartLink not found.");
    return { ok: true };
  });

export const deleteSmartLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ context, data }) => {
    const supabaseAdmin = await admin();
    const { error, count } = await supabaseAdmin
      .from("smart_links")
      .delete({ count: "exact" })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("SmartLink not found.");
    return { ok: true };
  });

export const getSmartLinkAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DateRange & { smartLinkId?: string }) => ({ ...rangeInput(data), smartLinkId: data.smartLinkId }))
  .handler(async ({ context, data }) => {
    if (data.smartLinkId && !idPattern.test(data.smartLinkId)) throw new Error("Invalid SmartLink.");
    const supabaseAdmin = await admin();
    let query = supabaseAdmin
      .from("network_stats")
      .select("smart_link_id,stat_date,country,device,referrer,impressions,clicks,revenue")
      .eq("user_id", context.userId)
      .gte("stat_date", data.from)
      .lte("stat_date", data.to)
      .order("stat_date", { ascending: true });
    if (data.smartLinkId) query = query.eq("smart_link_id", data.smartLinkId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const syncSmartLinkStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(rangeInput)
  .handler(async ({ context, data }) => {
    const supabaseAdmin = await admin();
    const { data: network, error: networkError } = await supabaseAdmin
      .from("networks")
      .select("id,provider_key")
      .eq("provider_key", "adsterra")
      .single();
    if (networkError || !network) throw new Error("SmartLink network is unavailable.");

    const { data: links, error: linksError } = await supabaseAdmin
      .from("smart_links")
      .select("id,user_id,network_placement_id,placement_sub_id")
      .eq("user_id", context.userId)
      .eq("network_id", network.id);
    if (linksError) throw new Error(linksError.message);
    if (!links?.length) return { rows: 0 };

    const { getSmartLinkProvider } = await import("@/lib/smartlinks/adsterra.server");
    const stats = await getSmartLinkProvider(network.provider_key).getStats(data);
    const rows = stats.flatMap((stat) => {
      const link = links.find((item) =>
        item.network_placement_id === stat.placementId &&
        (!stat.placementSubId || item.placement_sub_id === stat.placementSubId),
      );
      if (!link) return [];
      return [{
        user_id: link.user_id,
        smart_link_id: link.id,
        network_id: network.id,
        stat_date: stat.date,
        country: stat.country,
        device: stat.device,
        referrer: stat.referrer,
        impressions: stat.impressions,
        clicks: stat.clicks,
        revenue: stat.revenue,
        ctr: stat.impressions ? (stat.clicks / stat.impressions) * 100 : 0,
        cpm: stat.impressions ? (stat.revenue / stat.impressions) * 1000 : 0,
      }];
    });
    if (rows.length) {
      const { error } = await supabaseAdmin.from("network_stats").upsert(rows, {
        onConflict: "smart_link_id,stat_date,country,device,referrer",
      });
      if (error) throw new Error(error.message);
    }
    return { rows: rows.length };
  });