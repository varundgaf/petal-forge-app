import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: OverviewPage,
  head: () => ({ meta: [{ title: "Dashboard — AdProfitly" }] }),
});

interface RevenueRow {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
}

async function fetchOverview() {
  const since = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("revenue_events")
    .select("date, impressions, clicks, revenue")
    .gte("date", since)
    .order("date", { ascending: true });
  if (error) throw error;

  const byDate = new Map<string, RevenueRow>();
  for (const r of data ?? []) {
    const key = r.date as string;
    const cur = byDate.get(key) ?? { date: key, impressions: 0, clicks: 0, revenue: 0 };
    cur.impressions += Number(r.impressions);
    cur.clicks += Number(r.clicks);
    cur.revenue += Number(r.revenue);
    byDate.set(key, cur);
  }
  const series = Array.from(byDate.values());
  const totals = series.reduce(
    (a, b) => ({
      impressions: a.impressions + b.impressions,
      clicks: a.clicks + b.clicks,
      revenue: a.revenue + b.revenue,
    }),
    { impressions: 0, clicks: 0, revenue: 0 }
  );
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpm = totals.impressions ? (totals.revenue / totals.impressions) * 1000 : 0;
  return { series, totals, ctr, cpm };
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof DollarSign;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: fetchOverview,
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Overview</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Revenue at a glance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days across all sites.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={data ? `$${data.totals.revenue.toFixed(2)}` : "—"}
          hint="30-day total"
          icon={DollarSign}
        />
        <StatCard
          label="Impressions"
          value={data ? data.totals.impressions.toLocaleString() : "—"}
          hint="Delivered"
          icon={Eye}
        />
        <StatCard
          label="Clicks"
          value={data ? data.totals.clicks.toLocaleString() : "—"}
          hint={data ? `CTR ${data.ctr.toFixed(2)}%` : ""}
          icon={MousePointerClick}
        />
        <StatCard
          label="Avg CPM"
          value={data ? `$${data.cpm.toFixed(2)}` : "—"}
          hint="Per 1K impressions"
          icon={TrendingUp}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Daily revenue</h2>
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
        <div className="h-72">
          {isLoading || !data ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `$${v}`}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  labelFormatter={(d) => format(new Date(d as string), "MMM d, yyyy")}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
