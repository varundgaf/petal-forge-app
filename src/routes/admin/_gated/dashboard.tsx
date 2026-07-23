import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  UserMinus,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Activity,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { getAdminStats, getDashboardExtras } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/_gated/dashboard")({
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: any;
  accent?: string;
}) {
  return (
    <Card className="border-border/60 bg-card/40 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent ?? "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

function Dashboard() {
  const fn = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fn(),
    refetchInterval: 30000,
  });

  const fmt = (n?: number) =>
    (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const money = (n?: number) =>
    `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Real-time platform metrics. {isLoading ? "Loading…" : "Live"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Publishers" value={fmt(data?.totalPublishers)} icon={UsersIcon} />
        <StatCard
          label="Active Publishers"
          value={fmt(data?.activePublishers)}
          icon={UserCheck}
          accent="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          label="Banned Users"
          value={fmt(data?.bannedUsers)}
          icon={UserX}
          accent="bg-red-500/10 text-red-500"
        />
        <StatCard label="Pending Websites" value={fmt(data?.pendingWebsites)} icon={Clock} />
        <StatCard
          label="Approved Websites"
          value={fmt(data?.approvedWebsites)}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          label="Rejected Websites"
          value={fmt(data?.rejectedWebsites)}
          icon={XCircle}
          accent="bg-red-500/10 text-red-500"
        />
        <StatCard label="Pending Payments" value={fmt(data?.pendingPayments)} icon={Clock} />
        <StatCard
          label="Paid Payments"
          value={fmt(data?.paidPayments)}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's Revenue" value={money(data?.todayRevenue)} icon={DollarSign} />
        <StatCard label="Monthly Revenue" value={money(data?.monthRevenue)} icon={DollarSign} />
        <StatCard label="Total Revenue" value={money(data?.totalRevenue)} icon={DollarSign} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">System status</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Database</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Auth service</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Server functions</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </li>
          </ul>
        </Card>
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Security posture</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Row-level security enforced on all publisher tables.</li>
            <li>Admin actions are recorded in the audit log.</li>
            <li>Service role restricted to server functions.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
