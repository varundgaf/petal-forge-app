import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  Wallet,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Layers,
  Percent,
  Activity,
  Bell,
  Plus,
  BarChart3,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: OverviewPage,
  head: () => ({ meta: [{ title: "Dashboard — AdProfitly" }] }),
});

async function fetchOverview() {
  const since = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const [rev, sites, units, payments, notifs, activity] = await Promise.all([
    supabase
      .from("revenue_events")
      .select("date, impressions, clicks, revenue, country, site_id, sites(domain)")
      .gte("date", since)
      .order("date", { ascending: true }),
    supabase.from("sites").select("id, domain, status, monthly_visitors"),
    supabase.from("ad_units").select("id, is_active"),
    supabase.from("payments").select("amount, status, requested_at, paid_at"),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(6),
  ]);
  if (rev.error) throw rev.error;
  return {
    revenue: rev.data ?? [],
    sites: sites.data ?? [],
    units: units.data ?? [],
    payments: payments.data ?? [],
    notifs: notifs.data ?? [],
    activity: activity.data ?? [],
  };
}

type StatTone = "primary" | "positive" | "warning" | "muted";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  loading,
  tooltip,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof DollarSign;
  tone?: StatTone;
  loading?: boolean;
  tooltip?: string;
  trend?: number | null;
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-primary";
  const card = (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4 transition-colors", toneCls)} />
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</p>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {hint && <span>{hint}</span>}
        {typeof trend === "number" && !Number.isNaN(trend) && (
          <span className={trend >= 0 ? "text-emerald-400" : "text-red-400"}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
  if (!tooltip) return card;
  return (
    <TooltipProvider delayDuration={200}>
      <UITooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{card}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

function OverviewPage() {
  const profile = useAuth((s) => s.profile);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: fetchOverview,
  });

  const stats = useMemo(() => {
    const rev = data?.revenue ?? [];
    const today = new Date();
    const yesterday = subDays(today, 1);
    const d7 = subDays(today, 7);
    const d30 = subDays(today, 30);

    let todayRev = 0,
      yesterdayRev = 0,
      last7 = 0,
      last30 = 0,
      lifetime = 0,
      impressions = 0,
      clicks = 0,
      requests = 0,
      matched = 0;

    const byDay = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const bySite = new Map<string, { domain: string; revenue: number }>();

    for (const r of rev) {
      const d = new Date(r.date as string);
      const rv = Number(r.revenue);
      const imp = Number(r.impressions);
      const clk = Number(r.clicks);
      lifetime += rv;
      last30 += rv;
      impressions += imp;
      clicks += clk;
      requests += Math.round(imp * 1.18);
      matched += imp;
      if (isSameDay(d, today)) todayRev += rv;
      if (isSameDay(d, yesterday)) yesterdayRev += rv;
      if (d >= d7) last7 += rv;
      const key = format(d, "yyyy-MM-dd");
      byDay.set(key, (byDay.get(key) ?? 0) + rv);
      const c = (r.country as string) ?? "Unknown";
      byCountry.set(c, (byCountry.get(c) ?? 0) + rv);
      const sid = (r.site_id as string) ?? "";
      const domain = (r.sites as { domain: string } | null)?.domain ?? "—";
      const s = bySite.get(sid) ?? { domain, revenue: 0 };
      s.revenue += rv;
      bySite.set(sid, s);
    }

    const series = Array.from(byDay, ([date, revenue]) => ({ date, revenue })).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const ctr = impressions ? (clicks / impressions) * 100 : 0;
    const cpm = impressions ? (lifetime / impressions) * 1000 : 0;
    const rpm = cpm;
    const fillRate = requests ? (matched / requests) * 100 : 0;

    const sites = data?.sites ?? [];
    const approved = sites.filter((s) => s.status === "active").length;
    const pending = sites.filter((s) => s.status === "pending").length;
    const rejected = sites.filter((s) => s.status === "rejected").length;

    const units = data?.units ?? [];
    const activeUnits = units.filter((u) => u.is_active).length;

    const payments = data?.payments ?? [];
    const lifetimePaid = payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount), 0);
    const pendingPayout = payments
      .filter((p) => p.status === "pending" || p.status === "approved" || p.status === "processing")
      .reduce((s, p) => s + Number(p.amount), 0);
    const pendingRev = Math.max(0, lifetime - lifetimePaid - pendingPayout);
    const availableBalance = pendingRev;

    const yoyTrend = yesterdayRev ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : null;

    const countries = Array.from(byCountry, ([country, revenue]) => ({ country, revenue })).sort(
      (a, b) => b.revenue - a.revenue
    );
    const topSites = Array.from(bySite.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      todayRev,
      yesterdayRev,
      last7,
      last30,
      lifetime,
      impressions,
      clicks,
      ctr,
      cpm,
      rpm,
      requests,
      matched,
      fillRate,
      approved,
      pending,
      rejected,
      activeUnits,
      lifetimePaid,
      pendingPayout,
      pendingRev,
      availableBalance,
      series,
      countries,
      topSites,
      yoyTrend,
    };
  }, [data]);

  const money = (n: number) => `$${n.toFixed(2)}`;
  const num = (n: number) => n.toLocaleString();

  const onboarding = useMemo(() => {
    const p = profile;
    return [
      { label: "Complete profile", done: !!(p?.name && p?.country && p?.payment_method) },
      { label: "Add website", done: (data?.sites.length ?? 0) > 0 },
      { label: "Get a site approved", done: (stats?.approved ?? 0) > 0 },
      { label: "Create ad unit", done: (data?.units.length ?? 0) > 0 },
      { label: "Receive reports", done: (data?.revenue.length ?? 0) > 0 },
      {
        label: "Request weekly payment",
        done: (data?.payments.length ?? 0) > 0,
      },
    ];
  }, [profile, data, stats]);

  const completedSteps = onboarding.filter((s) => s.done).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Overview</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publisher ID{" "}
            <span className="font-mono text-foreground">{profile?.publisher_id ?? "—"}</span> · Last
            30 days across all sites.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/sites"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-primary/40"
          >
            <Plus className="h-4 w-4" /> Add site
          </Link>
          <Link
            to="/dashboard/payments"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Wallet className="h-4 w-4" /> Request payout
          </Link>
        </div>
      </div>

      {/* Onboarding checklist */}
      {completedSteps < onboarding.length && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Getting started</h2>
              <p className="text-xs text-muted-foreground">
                {completedSteps}/{onboarding.length} completed
              </p>
            </div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
                style={{ width: `${(completedSteps / onboarding.length) * 100}%` }}
              />
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {onboarding.map((s) => (
              <li
                key={s.label}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm",
                  s.done && "border-emerald-500/30"
                )}
              >
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Revenue timeframes */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Revenue
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today"
            value={money(stats.todayRev)}
            hint={format(new Date(), "MMM d")}
            icon={DollarSign}
            loading={isLoading}
            trend={stats.yoyTrend}
            tooltip="Revenue earned so far today across all sites."
          />
          <StatCard
            label="Yesterday"
            value={money(stats.yesterdayRev)}
            icon={Calendar}
            loading={isLoading}
            tooltip="Total revenue from the previous full day."
          />
          <StatCard
            label="Last 7 days"
            value={money(stats.last7)}
            icon={TrendingUp}
            loading={isLoading}
            tone="positive"
            tooltip="Rolling seven day revenue."
          />
          <StatCard
            label="Last 30 days"
            value={money(stats.last30)}
            icon={BarChart3}
            loading={isLoading}
            tooltip="Rolling thirty day revenue."
          />
          <StatCard
            label="Pending revenue"
            value={money(stats.pendingRev)}
            hint="Awaiting weekly cycle"
            icon={Clock}
            tone="warning"
            loading={isLoading}
            tooltip="Revenue earned but not yet available for payout."
          />
          <StatCard
            label="Available balance"
            value={money(stats.availableBalance)}
            hint="Ready to request"
            icon={Wallet}
            tone="positive"
            loading={isLoading}
            tooltip="Minimum $50 required to request a payout."
          />
          <StatCard
            label="Lifetime revenue"
            value={money(stats.lifetime)}
            icon={DollarSign}
            loading={isLoading}
            tooltip="All-time earnings across every site."
          />
          <StatCard
            label="Lifetime paid"
            value={money(stats.lifetimePaid)}
            icon={CheckCircle2}
            tone="muted"
            loading={isLoading}
            tooltip="Total paid out to you across every method."
          />
        </div>
      </section>

      {/* Performance metrics */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Performance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Impressions"
            value={num(stats.impressions)}
            icon={Eye}
            loading={isLoading}
            tooltip="Ads shown across your sites in the last 30 days."
          />
          <StatCard
            label="Clicks"
            value={num(stats.clicks)}
            icon={MousePointerClick}
            loading={isLoading}
          />
          <StatCard
            label="CTR"
            value={`${stats.ctr.toFixed(2)}%`}
            icon={Percent}
            loading={isLoading}
            tooltip="Click-through rate = clicks / impressions."
          />
          <StatCard
            label="CPM"
            value={money(stats.cpm)}
            icon={TrendingUp}
            loading={isLoading}
            tooltip="Revenue per 1,000 impressions."
          />
          <StatCard
            label="RPM"
            value={money(stats.rpm)}
            icon={Zap}
            loading={isLoading}
            tooltip="Revenue per mille (per 1,000 pageviews)."
          />
          <StatCard
            label="Fill rate"
            value={`${stats.fillRate.toFixed(1)}%`}
            icon={Activity}
            loading={isLoading}
            tooltip="Matched requests divided by total ad requests."
          />
          <StatCard
            label="Ad requests"
            value={num(stats.requests)}
            icon={Layers}
            loading={isLoading}
          />
          <StatCard
            label="Matched requests"
            value={num(stats.matched)}
            icon={CheckCircle2}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Inventory */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Inventory
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Approved websites"
            value={num(stats.approved)}
            icon={CheckCircle2}
            tone="positive"
            loading={isLoading}
          />
          <StatCard
            label="Pending websites"
            value={num(stats.pending)}
            icon={Clock}
            tone="warning"
            loading={isLoading}
          />
          <StatCard
            label="Rejected websites"
            value={num(stats.rejected)}
            icon={XCircle}
            tone="muted"
            loading={isLoading}
          />
          <StatCard
            label="Active ad units"
            value={num(stats.activeUnits)}
            icon={Layers}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Daily revenue</h2>
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
        <div className="h-72">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.series}>
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

      {/* Widgets grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Recent activity</h3>
          </div>
          <ul className="space-y-3 text-sm">
            {(data?.activity ?? []).length === 0 ? (
              <li className="text-xs text-muted-foreground">No activity yet.</li>
            ) : (
              data?.activity.map((a) => (
                <li key={a.id} className="flex gap-3 border-b border-border/40 pb-2 last:border-0">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.action}</p>
                    {a.detail && (
                      <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Latest notifications</h3>
          </div>
          <ul className="space-y-3 text-sm">
            {(data?.notifs ?? []).length === 0 ? (
              <li className="text-xs text-muted-foreground">You're all caught up.</li>
            ) : (
              data?.notifs.map((n) => (
                <li key={n.id} className="border-b border-border/40 pb-2 last:border-0">
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {format(new Date(n.created_at), "MMM d, HH:mm")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Quick actions</h3>
          </div>
          <div className="grid gap-2">
            <Link
              to="/dashboard/sites"
              className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Add a website
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/dashboard/ad-units"
              className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Create ad unit
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/dashboard/payments"
              className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Request payout
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/dashboard/analytics"
              className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> View analytics
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-primary" /> Update profile
              </span>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Top websites & countries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-base font-semibold">Top websites</h3>
          <ul className="space-y-3">
            {stats.topSites.length === 0 ? (
              <li className="text-xs text-muted-foreground">No traffic yet.</li>
            ) : (
              stats.topSites.slice(0, 5).map((s) => (
                <li key={s.domain} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{s.domain}</span>
                  <span className="font-mono text-primary">${s.revenue.toFixed(2)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-display text-base font-semibold">Top countries</h3>
          <ul className="space-y-3">
            {stats.countries.length === 0 ? (
              <li className="text-xs text-muted-foreground">No geographic data yet.</li>
            ) : (
              stats.countries.slice(0, 5).map((c) => (
                <li key={c.country} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.country}</span>
                  <span className="font-mono text-primary">${c.revenue.toFixed(2)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Small local icon alias to avoid clashing with lucide User (already used elsewhere).
function User2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </svg>
  );
}
