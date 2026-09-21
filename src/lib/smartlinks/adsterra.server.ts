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
    console.error("Adsterra request failed", { endpoint, status: response.status, message: body.message });
    throw new Error("The SmartLink network is temporarily unavailable.");
  }
  return body.items;
}

const text = (value: unknown) => (value == null ? "" : String(value));
const number = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
const clippedText = (value: unknown, length: number) => text(value).slice(0, length);

function placementFrom(item: unknown): NetworkPlacement | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const id = clippedText(row.id ?? row.placement_id ?? row.placement, 100);
  const url = text(row.url ?? row.link ?? row.smartlink_url ?? row.direct_url);
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { return null; }
  if (!id || parsedUrl.protocol !== "https:") return null;
  return {
    id,
    title: clippedText(row.title ?? row.name ?? row.alias, 120) || `SmartLink ${id}`,
    url: parsedUrl.toString(),
  };
}

function statFrom(item: unknown): NetworkStat | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const date = text(row.date ?? row.stat_date).slice(0, 10);
  const placementId = clippedText(row.placement_id ?? row.placement, 100);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !placementId || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) return null;
  return {
    date,
    placementId,
    placementSubId: clippedText(row.placement_sub_id ?? row.sub_id ?? row.psid, 100),
    country: clippedText(row.country ?? row.geo, 100),
    device: clippedText(row.device, 100),
    referrer: clippedText(row.referrer, 500),
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