import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShieldCheck, Info } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/traffic-quality")({
  component: TrafficQualityPage,
  head: () => ({
    meta: [
      { title: "Traffic Quality — AdProfitly" },
      {
        name: "description",
        content:
          "Monitor invalid traffic, suspicious clicks, CTR anomalies and GEO/device consistency across your AdProfitly inventory.",
      },
      { property: "og:title", content: "Traffic Quality — AdProfitly" },
      {
        property: "og:description",
        content: "Traffic quality score, anomaly signals and security events for your publisher account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Row = {
  date: string;
  pageviews: number | null;
  impressions: number;
  clicks: number;
  revenue: number;
  country: string | null;
};

async function fetchTrafficQuality(): Promise<Row[]> {
  const since = format(subDays(new Date(), 89), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("revenue_events")
    .select("date, pageviews, impressions, clicks, revenue, country")
    .gte("date", since)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

const RANGES = [
  { label: "24 Hours", days: 1 },
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
] as const;

type Status = "normal" | "attention" | "risk" | "unknown";

const STATUS_META: Record<Status, { dot: string; text: string; label: string }> = {
  normal: { dot: "bg-emerald-500", text: "text-emerald-500", label: "Normal" },
  attention: { dot: "bg-amber-500", text: "text-amber-500", label: "Attention" },
  risk: { dot: "bg-red-500", text: "text-red-500", label: "High Risk" },
  unknown: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Data collection required" },
};

/** Configurable weights — each signal deducts up to `weight` points from 100. */
const WEIGHTS = {
  invalid: 20,
  suspiciousClicks: 15,
  automated: 15,
  ctrAnomaly: 20,
  spike: 15,
  geo: 10,
  device: 5,
};

function pct(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function scoreBand(score: number) {
  if (score >= 90) return { label: "Excellent", tone: "text-emerald-500", emoji: "🟢" };
  if (score >= 75) return { label: "Healthy", tone: "text-emerald-500", emoji: "🟢" };
  if (score >= 50) return { label: "Needs Attention", tone: "text-amber-500", emoji: "🟡" };
  if (score >= 25) return { label: "High Risk", tone: "text-red-500", emoji: "🔴" };
  return { label: "Critical", tone: "text-red-500", emoji: "🔴" };
}

function TrafficQualityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["traffic-quality"],
    queryFn: fetchTrafficQuality,
  });
  const [rangeIdx, setRangeIdx] = useState(2);
  const range = RANGES[rangeIdx];

  const model = useMemo(() => {
    const rows = data ?? [];
    const from = format(subDays(new Date(), Math.max(range.days - 1, 0)), "yyyy-MM-dd");
    const win = rows.filter((r) => r.date >= from);

    const agg = (rs: Row[]) =>
      rs.reduce(
        (a, r) => ({
          impressions: a.impressions + Number(r.impressions ?? 0),
          clicks: a.clicks + Number(r.clicks ?? 0),
          pageviews: a.pageviews + Number(r.pageviews ?? 0),
          revenue: a.revenue + Number(r.revenue ?? 0),
        }),
        { impressions: 0, clicks: 0, pageviews: 0, revenue: 0 },
      );

    const totals = agg(win);
    const hasData = totals.impressions > 0;

    // Per-day series
    const byDate = new Map<string, { impressions: number; clicks: number; pageviews: number }>();
    for (const r of rows) {
      const c = byDate.get(r.date) ?? { impressions: 0, clicks: 0, pageviews: 0 };
      c.impressions += Number(r.impressions ?? 0);
      c.clicks += Number(r.clicks ?? 0);
      c.pageviews += Number(r.pageviews ?? 0);
      byDate.set(r.date, c);
    }
    const days = Array.from(byDate, ([date, v]) => ({ date, ...v })).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const ctrOf = (imp: number, clk: number) => (imp > 0 ? (clk / imp) * 100 : 0);
    const ctr = ctrOf(totals.impressions, totals.clicks);

    // Baseline = the 30 days preceding the selected window
    const baseFrom = format(subDays(new Date(), range.days + 29), "yyyy-MM-dd");
    const base = agg(rows.filter((r) => r.date >= baseFrom && r.date < from));
    const baseCtr = ctrOf(base.impressions, base.clicks);
    const ctrDelta = baseCtr > 0 ? ((ctr - baseCtr) / baseCtr) * 100 : 0;

    // Traffic spike: max daily impressions in window vs baseline daily average
    const windowDays = days.filter((d) => d.date >= from);
    const baseDays = days.filter((d) => d.date >= baseFrom && d.date < from);
    const baseAvg = baseDays.length
      ? baseDays.reduce((s, d) => s + d.impressions, 0) / baseDays.length
      : 0;
    const peak = windowDays.reduce((m, d) => Math.max(m, d.impressions), 0);
    const spikeRatio = baseAvg > 0 ? peak / baseAvg : 0;

    // Invalid traffic proxy: impressions that exceed recorded pageviews
    const hasPageviews = totals.pageviews > 0;
    const invalidPct = hasPageviews
      ? Math.max(0, pct(totals.impressions - totals.pageviews, totals.impressions))
      : null;

    // Suspicious clicks proxy: clicks beyond a 3% CTR ceiling on any given day
    const suspiciousClicks = windowDays.reduce(
      (s, d) => s + Math.max(0, d.clicks - d.impressions * 0.03),
      0,
    );
    const suspiciousPct = pct(suspiciousClicks, Math.max(totals.clicks, 1));

    // GEO concentration
    const byCountry = new Map<string, number>();
    for (const r of win)
      byCountry.set(r.country ?? "Unknown", (byCountry.get(r.country ?? "Unknown") ?? 0) + Number(r.impressions ?? 0));
    const geoRows = Array.from(byCountry, ([country, impressions]) => {
      const cRows = win.filter((r) => (r.country ?? "Unknown") === country);
      const a = agg(cRows);
      return {
        country,
        impressions,
        clicks: a.clicks,
        ctr: ctrOf(a.impressions, a.clicks),
      };
    }).sort((a, b) => b.impressions - a.impressions);
    const topGeoShare = geoRows.length ? pct(geoRows[0].impressions, totals.impressions) : 0;

    // Score
    let deductions = 0;
    if (hasData) {
      if (invalidPct !== null) deductions += Math.min(WEIGHTS.invalid, (invalidPct / 30) * WEIGHTS.invalid);
      deductions += Math.min(WEIGHTS.suspiciousClicks, (suspiciousPct / 25) * WEIGHTS.suspiciousClicks);
      if (Math.abs(ctrDelta) > 40)
        deductions += Math.min(WEIGHTS.ctrAnomaly, ((Math.abs(ctrDelta) - 40) / 100) * WEIGHTS.ctrAnomaly);
      if (spikeRatio > 2)
        deductions += Math.min(WEIGHTS.spike, ((spikeRatio - 2) / 3) * WEIGHTS.spike);
      if (topGeoShare > 80)
        deductions += Math.min(WEIGHTS.geo, ((topGeoShare - 80) / 20) * WEIGHTS.geo);
    }
    const score = hasData ? Math.max(0, Math.min(100, Math.round(100 - deductions))) : null;

    const chart = windowDays.map((d) => {
      const dInvalid = d.pageviews > 0 ? Math.max(0, pct(d.impressions - d.pageviews, d.impressions)) : 0;
      const dSuspicious = pct(Math.max(0, d.clicks - d.impressions * 0.03), Math.max(d.clicks, 1));
      const dCtr = ctrOf(d.impressions, d.clicks);
      const dev = baseCtr > 0 ? Math.abs((dCtr - baseCtr) / baseCtr) * 100 : 0;
      const q = Math.max(
        0,
        Math.min(100, Math.round(100 - dInvalid * 0.6 - dSuspicious * 0.6 - Math.max(0, dev - 40) * 0.2)),
      );
      return {
        date: d.date,
        quality: q,
        invalid: Number(dInvalid.toFixed(2)),
        suspicious: Number(dSuspicious.toFixed(2)),
      };
    });

    return {
      hasData,
      score,
      totals,
      ctr,
      baseCtr,
      ctrDelta,
      spikeRatio,
      invalidPct,
      suspiciousClicks,
      suspiciousPct,
      geoRows,
      topGeoShare,
      chart,
    };
  }, [data, range.days]);

  const band = model.score !== null ? scoreBand(model.score) : null;

  const cards: Array<{ label: string; value: string; status: Status; hint: string }> = [
    {
      label: "Invalid Traffic %",
      value: model.invalidPct === null ? "Data collection required" : `${model.invalidPct.toFixed(2)}%`,
      status:
        model.invalidPct === null
          ? "unknown"
          : model.invalidPct > 20
            ? "risk"
            : model.invalidPct > 8
              ? "attention"
              : "normal",
      hint: "Impressions recorded above measured pageviews.",
    },
    {
      label: "Suspicious Clicks",
      value: model.hasData
        ? `${Math.round(model.suspiciousClicks).toLocaleString()} (${model.suspiciousPct.toFixed(1)}%)`
        : "Data collection required",
      status: !model.hasData
        ? "unknown"
        : model.suspiciousPct > 15
          ? "risk"
          : model.suspiciousPct > 5
            ? "attention"
            : "normal",
      hint: "Clicks above a 3% daily CTR ceiling.",
    },
    {
      label: "Suspected Automated Traffic",
      value: "Not available",
      status: "unknown",
      hint: "Bot & datacenter signals require detection data collection.",
    },
    {
      label: "CTR Anomaly",
      value: model.baseCtr > 0 ? `${model.ctrDelta >= 0 ? "+" : ""}${model.ctrDelta.toFixed(1)}%` : "Data collection required",
      status:
        model.baseCtr <= 0
          ? "unknown"
          : Math.abs(model.ctrDelta) > 80
            ? "risk"
            : Math.abs(model.ctrDelta) > 40
              ? "attention"
              : "normal",
      hint: `CTR ${model.ctr.toFixed(2)}% vs baseline ${model.baseCtr.toFixed(2)}%.`,
    },
    {
      label: "Traffic Spike",
      value: model.spikeRatio > 0 ? `${model.spikeRatio.toFixed(2)}× baseline` : "Data collection required",
      status:
        model.spikeRatio <= 0
          ? "unknown"
          : model.spikeRatio > 4
            ? "risk"
            : model.spikeRatio > 2
              ? "attention"
              : "normal",
      hint: "Peak daily impressions vs 30-day average.",
    },
    {
      label: "GEO Consistency",
      value: model.hasData ? `${model.topGeoShare.toFixed(0)}% top country` : "Data collection required",
      status: !model.hasData
        ? "unknown"
        : model.topGeoShare > 90
          ? "risk"
          : model.topGeoShare > 80
            ? "attention"
            : "normal",
      hint: "Concentration of impressions in a single country.",
    },
    {
      label: "Device Anomaly",
      value: "Not available",
      status: "unknown",
      hint: "Device-level breakdown is not collected yet.",
    },
  ];

  const events = useMemo(() => {
    const out: Array<{ severity: Status; title: string; detail: string; time: string }> = [];
    const now = format(new Date(), "MMM d, HH:mm");
    if (model.baseCtr > 0 && Math.abs(model.ctrDelta) > 40)
      out.push({
        severity: Math.abs(model.ctrDelta) > 80 ? "risk" : "attention",
        title: "Unusual CTR change",
        detail: `CTR moved ${model.ctrDelta.toFixed(1)}% against your 30-day baseline.`,
        time: now,
      });
    if (model.spikeRatio > 2)
      out.push({
        severity: model.spikeRatio > 4 ? "risk" : "attention",
        title: "Traffic spike detected",
        detail: `Peak day reached ${model.spikeRatio.toFixed(2)}× your average daily impressions.`,
        time: now,
      });
    if (model.invalidPct !== null && model.invalidPct > 8)
      out.push({
        severity: model.invalidPct > 20 ? "risk" : "attention",
        title: "Suspicious traffic pattern",
        detail: `${model.invalidPct.toFixed(1)}% of impressions exceed measured pageviews.`,
        time: now,
      });
    if (!out.length && model.hasData)
      out.push({
        severity: "normal",
        title: "Traffic quality stable",
        detail: "No anomalies detected across available signals.",
        time: now,
      });
    return out;
  }, [model]);

  const recommendation = !model.hasData
    ? { tone: "unknown" as Status, title: "Data collection required", body: "Traffic data is not yet available for this range." }
    : model.score !== null && model.score >= 75
      ? { tone: "normal" as Status, title: "No action required", body: "Your traffic quality is currently healthy." }
      : model.score !== null && model.score >= 50
        ? {
            tone: "attention" as Status,
            title: "Review traffic source",
            body: "Traffic from one source is significantly above your normal baseline.",
          }
        : {
            tone: "risk" as Status,
            title: "Investigate traffic",
            body: "Suspicious activity has increased significantly across available signals.",
          };

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Traffic Quality</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Traffic Quality Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anomaly signals derived from your recorded analytics. Detection feeds can be connected later.
        </p>
      </div>

      {/* Score */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Traffic Quality Score</p>
          {isLoading ? (
            <p className="mt-1 font-display text-4xl font-semibold">…</p>
          ) : model.score === null ? (
            <p className="mt-1 font-display text-2xl font-semibold text-muted-foreground">
              Data collection required
            </p>
          ) : (
            <>
              <p className="mt-1 font-display text-4xl font-semibold">
                {model.score} <span className="text-xl text-muted-foreground">/ 100</span>
              </p>
              <p className={cn("mt-1 text-sm font-medium", band?.tone)}>
                {band?.emoji} {band?.label}
              </p>
            </>
          )}
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {model.score === null
              ? "Once impressions and pageviews are recorded, a score will be calculated from your live analytics."
              : model.score >= 75
                ? "Your traffic currently shows low levels of suspicious activity."
                : "Some signals are outside your normal baseline — review the details below."}
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-lg font-semibold">{isLoading ? "…" : c.value}</p>
            <p className={cn("mt-1 flex items-center gap-1.5 text-xs font-medium", STATUS_META[c.status].text)}>
              <span className={cn("h-2 w-2 rounded-full", STATUS_META[c.status].dot)} />
              {STATUS_META[c.status].label}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Traffic Quality Over Time</h2>
          <div className="flex gap-2">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRangeIdx(i)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  rangeIdx === i
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/40",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : model.chart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Data collection required
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={model.chart}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Line type="monotone" dataKey="quality" name="Quality Score" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="invalid" name="Invalid Traffic %" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="suspicious" name="Suspicious Traffic %" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Events */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Recent Security Events</h2>
          <ul className="space-y-3">
            {events.length === 0 && (
              <li className="text-sm text-muted-foreground">Data collection required</li>
            )}
            {events.map((e) => (
              <li
                key={e.title}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", STATUS_META[e.severity].dot)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{e.time}</span>
                <button
                  type="button"
                  onClick={() => setRangeIdx(2)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View details
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 font-display text-lg font-semibold">What should you do?</h2>
          <p className={cn("flex items-center gap-2 text-sm font-medium", STATUS_META[recommendation.tone].text)}>
            <span className={cn("h-2 w-2 rounded-full", STATUS_META[recommendation.tone].dot)} />
            {recommendation.title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{recommendation.body}</p>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            VPN/proxy, bot detection, duplicate IP and advanced fraud signals are not available yet — data
            collection required.
          </p>
        </div>
      </div>

      {/* GEO & Devices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-display text-lg font-semibold">GEO Traffic</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Country</th>
                  <th className="px-6 py-3 text-right font-medium">Impressions</th>
                  <th className="px-6 py-3 text-right font-medium">Clicks</th>
                  <th className="px-6 py-3 text-right font-medium">CTR</th>
                  <th className="px-6 py-3 text-right font-medium">Quality</th>
                </tr>
              </thead>
              <tbody>
                {model.geoRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {isLoading ? "Loading…" : "Data collection required"}
                    </td>
                  </tr>
                ) : (
                  model.geoRows.slice(0, 6).map((g) => {
                    const s: Status = g.ctr > 6 ? "risk" : g.ctr > 4 ? "attention" : "normal";
                    return (
                      <tr key={g.country} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-3 font-medium">{g.country}</td>
                        <td className="px-6 py-3 text-right font-mono">{g.impressions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-mono">{g.clicks.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-mono">{g.ctr.toFixed(2)}%</td>
                        <td className="px-6 py-3 text-right">
                          <span className={cn("text-xs font-medium", STATUS_META[s].text)}>
                            {STATUS_META[s].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Devices</h2>
          <ul className="space-y-3">
            {["Mobile", "Desktop", "Tablet"].map((d) => (
              <li key={d} className="flex items-center justify-between text-sm">
                <span className="font-medium">{d}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  Data collection required
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Device-level attribution is not recorded yet. This section will populate automatically once device
            data is available.
          </p>
        </div>
      </div>
    </div>
  );
}
