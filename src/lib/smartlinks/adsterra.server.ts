import type { NetworkPlacement, NetworkStat, SmartLinkProvider } from "./provider";

const API_BASE = "https://api3.adsterratools.com/publisher";

function token() {
  const value = process.env.ADSTERRA_API_TOKEN?.trim();
  if (!value) throw new Error("Adsterra integration is not configured yet.");
  return value;
}

async function getItems(endpoint: string, query?: URLSearchParams): Promise<unknown[]> {
  const url = new URL(`${API_BASE}${endpoint}`);
  query?.forEach((value, key) => url.searchParams.append(key, value));
  const response = await fetch(url, {
    headers: { Accept: "application/json", "X-API-Key": token() },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as { items?: unknown[]; message?: string };
  if (!response.ok || !Array.isArray(body.items)) {
    throw new Error(body.message || `Adsterra API error ${response.status}.`);
  }
  return body.items;
}

const text = (value: unknown) => (value == null ? "" : String(value));
const number = (value: unknown) => Number(value ?? 0) || 0;

function placementFrom(item: unknown): NetworkPlacement | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const id = text(row.id ?? row.placement_id ?? row.placement);
  const url = text(row.url ?? row.link ?? row.smartlink_url ?? row.direct_url);
  if (!id || !url.startsWith("https://")) return null;
  return {
    id,
    title: text(row.title ?? row.name ?? row.alias) || `SmartLink ${id}`,
    url,
  };
}

function statFrom(item: unknown): NetworkStat | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const date = text(row.date ?? row.stat_date).slice(0, 10);
  const placementId = text(row.placement_id ?? row.placement);
  if (!date || !placementId) return null;
  return {
    date,
    placementId,
    placementSubId: text(row.placement_sub_id ?? row.sub_id ?? row.psid),
    country: text(row.country ?? row.geo),
    device: text(row.device),
    referrer: text(row.referrer),
    impressions: number(row.impressions),
    clicks: number(row.clicks),
    revenue: number(row.revenue),
  };
}

export class AdsterraProvider implements SmartLinkProvider {
  readonly key = "adsterra";

  async listPlacements() {
    const items = await getItems("/placements.json");
    return items.map(placementFrom).filter((item): item is NetworkPlacement => Boolean(item));
  }

  async getStats({ from, to }: { from: string; to: string }) {
    const query = new URLSearchParams({ start_date: from, finish_date: to });
    ["date", "placement", "placement_sub_id", "country"].forEach((dimension) =>
      query.append("group_by[]", dimension),
    );
    const items = await getItems("/stats.json", query);
    return items.map(statFrom).filter((item): item is NetworkStat => Boolean(item));
  }

  buildRedirectUrl(destinationUrl: string, placementSubId: string) {
    const url = new URL(destinationUrl);
    if (url.protocol !== "https:") throw new Error("Invalid network destination.");
    url.searchParams.set("psid", placementSubId);
    return url;
  }
}

export function getSmartLinkProvider(key: string): SmartLinkProvider {
  if (key === "adsterra") return new AdsterraProvider();
  throw new Error("Unsupported SmartLink provider.");
}