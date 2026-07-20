import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — AdProfitly" }] }),
});

async function fetchAnalytics() {
  const since = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("revenue_events")
    .select("date, impressions, clicks, revenue, country, site_id, sites(domain)")
    .gte("date", since);
  if (error) throw error;

  const byCountry = new Map<string, number>();
  const bySite = new Map<string, { domain: string; revenue: number; impressions: number }>();
  const byDate = new Map<string, { date: string; impressions: number; clicks: number }>();

  for (const r of data ?? []) {
    const country = (r.country as string) ?? "Unknown";
    byCountry.set(country, (byCountry.get(country) ?? 0) + Number(r.revenue));

    const sid = r.site_id as string;
    const domain = (r.sites as { domain: string } | null)?.domain ?? "—";
    const s = bySite.get(sid) ?? { domain, revenue: 0, impressions: 0 };
    s.revenue += Number(r.revenue);
    s.impressions += Number(r.impressions);
    bySite.set(sid, s);

    const d = r.date as string;
    const cur = byDate.get(d) ?? { date: d, impressions: 0, clicks: 0 };
    cur.impressions += Number(r.impressions);
    cur.clicks += Number(r.clicks);
    byDate.set(d, cur);
  }

  return {
    countries: Array.from(byCountry, ([country, revenue]) => ({ country, revenue })).sort(
      (a, b) => b.revenue - a.revenue
    ),
    sites: Array.from(bySite.values()).sort((a, b) => b.revenue - a.revenue),
    dailyTraffic: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-analytics"], queryFn: fetchAnalytics });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Analytics</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Traffic & performance
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Daily impressions vs clicks</h2>
        <div className="h-72">
          {isLoading || !data ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyTraffic}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Top countries</h2>
          <ul className="space-y-3">
            {data?.countries.slice(0, 5).map((c) => (
              <li key={c.country} className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.country}</span>
                <span className="font-mono text-primary">${c.revenue.toFixed(2)}</span>
              </li>
            )) ?? <li className="text-sm text-muted-foreground">Loading…</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Top sites</h2>
          <ul className="space-y-3">
            {data?.sites.slice(0, 5).map((s) => (
              <li key={s.domain} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{s.domain}</span>
                <span className="font-mono text-primary">${s.revenue.toFixed(2)}</span>
              </li>
            )) ?? <li className="text-sm text-muted-foreground">Loading…</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
