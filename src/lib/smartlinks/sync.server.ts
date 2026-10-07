import { getSmartLinkProvider } from "./adsterra.server";

export async function syncReports(range: { from: string; to: string }, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: network, error: networkError } = await supabaseAdmin.from("networks").select("id,provider_key").eq("provider_key", "adsterra").eq("is_active", true).single();
  if (networkError || !network) throw new Error("SmartLink network is unavailable.");
  const { data: log, error: logError } = await supabaseAdmin.from("api_sync_logs").insert({ network_id: network.id, status: "running" }).select("id").single();
  if (logError || !log) throw new Error("Could not start reporting sync.");
  try {
    const { data: links, error } = await supabaseAdmin.from("smart_links").select("id,network_placement_id,placement_sub_id").eq("network_id", network.id).eq("user_id", userId);
    if (error) throw error;
    const stats = links?.length ? await getSmartLinkProvider(network.provider_key).getStats(range) : [];
    const rows = stats.flatMap((stat) => {
      const link = links?.find((item) => item.network_placement_id === stat.placementId && item.placement_sub_id === stat.placementSubId);
      return link ? [{ smart_link_id: link.id, stat_date: stat.date, country: stat.country, impressions: stat.impressions, clicks: stat.clicks, revenue: stat.revenue }] : [];
    });
    const { data: written, error: writeError } = await supabaseAdmin.rpc("replace_smartlink_report", { _network_id: network.id, _user_id: userId, _from: range.from, _to: range.to, _rows: rows });
    if (writeError) throw writeError;
    const { error: finishError } = await supabaseAdmin.from("api_sync_logs").update({ status: "success", finished_at: new Date().toISOString(), rows_received: stats.length, rows_written: written ?? 0 }).eq("id", log.id);
    if (finishError) throw finishError;
    return { rows: written ?? 0 };
  } catch (error) {
    await supabaseAdmin.from("api_sync_logs").update({ status: "failed", finished_at: new Date().toISOString(), error_code: "report_sync_failed" }).eq("id", log.id);
    console.error("SmartLink reporting sync failed", error instanceof Error ? error.message : "Unknown error");
    throw new Error(error instanceof Error && error.message.includes("network") ? error.message : "Analytics could not be synced. Please try again.");
  }
}