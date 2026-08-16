import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfMonth, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — AdProfitly" },
      {
        name: "description",
        content:
          "Daily revenue, pageviews, impressions, clicks, CTR and eCPM analytics for your AdProfitly publisher account.",
      },
      { property: "og:title", content: "Analytics — AdProfitly" },
      {
        property: "og:description",
        content: "Track daily revenue, CTR and eCPM performance across your sites.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Row = {
  date: string;
  pageviews: number;
  impressions: number;
  clicks: number;
  revenue: number;
  country: string | null;
  site_id: string | null;
  sites: { domain: string } | null;
};

async function fetchAnalytics(): Promise<Row[]> {
  const since = format(subDays(new Date(), 364), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("revenue_events")
    .select("date, pageviews, impressions, clicks, revenue, country, site_id, sites(domain)")
    .gte("date", since)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

const PRESETS = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Custom Range",
] as const;
type Preset = (typeof PRESETS)[number];

function presetRange(p: Preset, from: string, to: string) {
  const today = new Date();
  switch (p) {
    case "Today":
      return { from: iso(today), to: iso(today) };
    case "Yesterday":
      return { from: iso(subDays(today, 1)), to: iso(subDays(today, 1)) };
    case "Last 7 Days":
      return { from: iso(subDays(today, 6)), to: iso(today) };
    case "Last 30 Days":
      return { from: iso(subDays(today, 29)), to: iso(today) };
    case "This Month":
      return { from: iso(startOfMonth(today)), to: iso(today) };
    default:
      return { from, to };
  }
}

function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-analytics"], queryFn: fetchAnalytics });
  const [preset, setPreset] = useState<Preset>("Last 30 Days");
  const [custom, setCustom] = useState({
    from: iso(subDays(new Date(), 11)),
    to: iso(new Date()),
  });

  const range = presetRange(preset, custom.from, custom.to);

  const view = useMemo(() => {
    const rows = (data ?? []).filter((r) => r.date >= range.from && r.date <= range.to);

    const byDate = new Map<
      string,
      { date: string; revenue: number; pageviews: number; impressions: number; clicks: number }
    >();
    const byCountry = new Map<string, number>();
    const bySite = new Map<string, { domain: string; revenue: number; impressions: number }>();

    for (const r of rows) {
      const rev = Number(r.revenue);
      const imp = Number(r.impressions);
      const clk = Number(r.clicks);
      const pv = Number(r.pageviews ?? 0);

      const cur = byDate.get(r.date) ?? {
        date: r.date,
        revenue: 0,
        pageviews: 0,
        impressions: 0,
        clicks: 0,
      };
      cur.revenue += rev;
      cur.pageviews += pv;
      cur.impressions += imp;
      cur.clicks += clk;
      byDate.set(r.date, cur);

      const country = r.country ?? "Unknown";
      byCountry.set(country, (byCountry.get(country) ?? 0) + rev);

      const sid = r.site_id ?? "—";
      const s = bySite.get(sid) ?? { domain: r.sites?.domain ?? "—", revenue: 0, impressions: 0 };
      s.revenue += rev;
      s.impressions += imp;
      bySite.set(sid, s);
    }

    const daily = Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        ctr: d.impressions ? (d.clicks / d.impressions) * 100 : 0,
        ecpm: d.impressions ? (d.revenue / d.impressions) * 1000 : 0,
      }));

    const totals = daily.reduce(
      (a, d) => ({
        revenue: a.revenue + d.revenue,
        pageviews: a.pageviews + d.pageviews,
        impressions: a.impressions + d.impressions,
        clicks: a.clicks + d.clicks,
      }),
      { revenue: 0, pageviews: 0, impressions: 0, clicks: 0 }
    );

    return {
      daily,
      totals: {
        ...totals,
        ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
        ecpm: totals.impressions ? (totals.revenue / totals.impressions) * 1000 : 0,
      },
      countries: Array.from(byCountry, ([country, revenue]) => ({ country, revenue })).sort(
        (a, b) => b.revenue - a.revenue
      ),
      sites: Array.from(bySite.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }, [data, range.from, range.to]);

  const num = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Analytics</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Traffic &amp; performance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(range.from), "MMM d, yyyy")} – {format(new Date(range.to), "MMM d, yyyy")}
        </p>
      </div>

      {/* Date filters */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                preset === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        {preset === "Custom Range" && (
          <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={custom.from}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={custom.to}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Revenue", value: `$${view.totals.revenue.toFixed(2)}`, tone: true },
          { label: "Pageviews", value: num(view.totals.pageviews) },
          { label: "Impressions", value: num(view.totals.impressions) },
          { label: "Clicks", value: num(view.totals.clicks) },
          { label: "CTR", value: `${view.totals.ctr.toFixed(2)}%` },
          { label: "eCPM", value: `$${view.totals.ecpm.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                "mt-2 font-display text-xl font-semibold",
                s.tone && "text-primary"
              )}
            >
              {isLoading ? "…" : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Daily impressions vs clicks</h2>
        <div className="h-72">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.daily}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.05)", radius: 6 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />

                <Bar dataKey="impressions" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Daily revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.daily}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => `$${Number(v).toFixed(2)}`}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Daily eCPM</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.daily}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => `$${Number(v).toFixed(2)}`}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ecpm"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily earnings table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold">Daily earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Revenue</th>
                <th className="px-6 py-3 text-right font-medium">Pageviews</th>
                <th className="px-6 py-3 text-right font-medium">Impressions</th>
                <th className="px-6 py-3 text-right font-medium">Clicks</th>
                <th className="px-6 py-3 text-right font-medium">CTR</th>
                <th className="px-6 py-3 text-right font-medium">eCPM</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : view.daily.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No data in this range.
                  </td>
                </tr>
              ) : (
                view.daily.map((d) => (
                  <tr key={d.date} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-3 text-muted-foreground">
                      {format(new Date(d.date), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-primary">
                      ${d.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono">{num(d.pageviews)}</td>
                    <td className="px-6 py-3 text-right font-mono">{num(d.impressions)}</td>
                    <td className="px-6 py-3 text-right font-mono">{num(d.clicks)}</td>
                    <td className="px-6 py-3 text-right font-mono">{d.ctr.toFixed(2)}%</td>
                    <td className="px-6 py-3 text-right font-mono">${d.ecpm.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Top countries</h2>
          <ul className="space-y-3">
            {view.countries.slice(0, 5).map((c) => (
              <li key={c.country} className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.country}</span>
                <span className="font-mono text-primary">${c.revenue.toFixed(2)}</span>
              </li>
            ))}
            {view.countries.length === 0 && (
              <li className="text-sm text-muted-foreground">No data.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Top sites</h2>
          <ul className="space-y-3">
            {view.sites.slice(0, 5).map((s) => (
              <li key={s.domain} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{s.domain}</span>
                <span className="font-mono text-primary">${s.revenue.toFixed(2)}</span>
              </li>
            ))}
            {view.sites.length === 0 && <li className="text-sm text-muted-foreground">No data.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
