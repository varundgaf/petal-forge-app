import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Shield,
  Zap,
  Users,
  LineChart,
  Layers,
  Check,
  Sparkles,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "AdProfitly — Enterprise Ad Monetization Platform" },
      {
        name: "description",
        content:
          "Real-time revenue analytics, campaign management, and Adsterra integration for publishers and advertisers. Enterprise-grade AdTech in one console.",
      },
      { property: "og:title", content: "AdProfitly — Enterprise Ad Monetization Platform" },
      {
        property: "og:description",
        content: "Real-time revenue analytics, campaign management, and Adsterra integration for publishers and advertisers. Enterprise-grade AdTech in one console.",
      },
    ],
  }),
});

function HomePage() {
  return (
    <PublicLayout>
      <Hero />
      <LogoStrip />
      <Features />
      <RevenuePanel />
      <ForWho />
      <AdsterraSection />
      <CTA />
    </PublicLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-1.5 h-3 w-3" /> New · Adsterra native sync
          </Badge>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            The revenue engine for
            <br />
            <span className="text-gradient-money">modern ad publishers.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AdProfitly unifies revenue analytics, campaign management, and Adsterra reporting into
            one enterprise console. Ship faster, monetize smarter, sleep easier.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="hero">
              <Link to="/register">
                Start free trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/features">Explore platform</Link>
            </Button>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            No credit card · 14-day trial · SOC 2 ready
          </p>
        </div>

        <HeroPanel />
      </div>
    </section>
  );
}

function HeroPanel() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="rounded-2xl border border-border bg-card/60 p-2 shadow-elev-3 backdrop-blur-xl">
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive/60" />
              <div className="h-2 w-2 rounded-full bg-warning/60" />
              <div className="h-2 w-2 rounded-full bg-primary/70" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                console.adprofitly.com/publisher/revenue
              </span>
            </div>
            <span className="font-mono text-xs text-primary">● live</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              { l: "Revenue (30d)", v: "$284,914", t: "+18.2%" },
              { l: "eCPM", v: "$4.72", t: "+6.1%" },
              { l: "Fill rate", v: "94.1%", t: "+2.4pt" },
              { l: "Impressions", v: "60.3M", t: "+11.8%" },
            ].map((k) => (
              <div key={k.l} className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground">{k.l}</div>
                <div className="mt-1 font-display text-2xl font-semibold">{k.v}</div>
                <div className="mt-1 font-mono text-xs text-primary">{k.t}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Revenue by day</span>
              <span className="font-mono text-xs text-muted-foreground">USD · UTC</span>
            </div>
            <SparkChart />
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkChart() {
  const bars = [42, 55, 48, 62, 58, 71, 66, 78, 74, 86, 82, 91, 88, 95, 92, 104, 98, 112, 108, 121, 118, 128, 124, 138, 132, 144, 141, 152, 148, 162];
  const max = Math.max(...bars);
  return (
    <div className="flex h-32 items-end gap-1">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-gradient-money opacity-90"
          style={{ height: `${(b / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function LogoStrip() {
  return (
    <section className="border-y border-border/60 bg-surface py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Trusted by revenue teams at
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {["MEDIAWAVE", "PIXELFORGE", "REVENUE.CO", "STRATOS", "NORTHBEAM", "ADHIVE", "OUTLIER"].map(
            (n) => (
              <span key={n} className="font-display text-lg font-semibold tracking-widest">
                {n}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: BarChart3,
    title: "Real-time analytics",
    body: "Revenue, impressions, CTR, CPM, RPM streamed with sub-minute latency across every site and ad unit.",
  },
  {
    icon: Globe2,
    title: "Global geo insights",
    body: "Country, device, browser, OS, and referrer breakdowns with drill-down and CSV/Excel export.",
  },
  {
    icon: Layers,
    title: "Adsterra native sync",
    body: "Scheduled sync pulls daily and monthly reports into your dashboard — no spreadsheets, no CSVs.",
  },
  {
    icon: Zap,
    title: "Campaign builder",
    body: "Advertisers ship campaigns with creatives, audiences, geo targeting, and budget guardrails in minutes.",
  },
  {
    icon: Shield,
    title: "Enterprise-grade security",
    body: "SOC 2 ready, JWT + refresh tokens, 2FA, granular RBAC, and complete audit logs on every action.",
  },
  {
    icon: Users,
    title: "Multi-tenant by design",
    body: "Publisher, advertiser, and admin roles with row-level scoping. Teams, invites, and permissions built in.",
  },
];

function Features() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Platform</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything an AdTech team needs.
          </h2>
          <p className="mt-4 text-muted-foreground">
            One codebase. One console. Publishers, advertisers, and operations aligned around live
            revenue data.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-gradient-money group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RevenuePanel() {
  return (
    <section className="border-y border-border/60 bg-surface py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Adsterra Integration
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Every Adsterra metric,{" "}
            <span className="text-gradient-money">automatically synced.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            AdProfitly pulls reports, revenue, impressions, requests, fill rate, CTR, CPM, eCPM,
            RPM, and country and device breakdowns from Adsterra on your schedule.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Scheduled daily + monthly sync",
              "Admin can sync all publishers at once",
              "Publishers only see their own reports",
              "Secure backend-only Adsterra endpoints",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" />
              <span className="font-medium">Country report</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">Adsterra · last 7d</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { c: "United States", imp: "18.4M", cpm: "$6.42", rev: "$118,124" },
              { c: "United Kingdom", imp: "6.2M", cpm: "$5.12", rev: "$31,744" },
              { c: "Germany", imp: "4.8M", cpm: "$4.88", rev: "$23,424" },
              { c: "India", imp: "12.1M", cpm: "$1.24", rev: "$15,004" },
              { c: "Brazil", imp: "5.4M", cpm: "$1.86", rev: "$10,044" },
            ].map((r) => (
              <div
                key={r.c}
                className="grid grid-cols-4 items-center gap-3 rounded-lg border border-border bg-surface-elevated p-3"
              >
                <span className="text-sm font-medium">{r.c}</span>
                <span className="font-mono text-xs text-muted-foreground">{r.imp}</span>
                <span className="font-mono text-xs">{r.cpm}</span>
                <span className="text-right font-mono text-sm text-primary">{r.rev}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ForWho() {
  const cards = [
    {
      role: "For Publishers",
      title: "Every ad unit, every dollar, tracked.",
      body: "Sites, domains, ad units, traffic sources, countries, devices — all in one live dashboard with payouts.",
      link: "/features",
    },
    {
      role: "For Advertisers",
      title: "Launch campaigns that scale.",
      body: "Build campaigns with creatives, audiences, geo targeting, and pixel tracking. Reports and billing built in.",
      link: "/features",
    },
    {
      role: "For Admin Teams",
      title: "Operate the platform end-to-end.",
      body: "Users, KYC, plans, coupons, CMS, roles, permissions, audit logs, and system health — all one click away.",
      link: "/features",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.role}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  {c.role}
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">{c.body}</p>
              </div>
              <Link
                to={c.link}
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdsterraSection() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-8 lg:grid-cols-4 lg:p-12">
          {[
            { k: "99.99%", l: "Historical uptime" },
            { k: "<180ms", l: "P95 API latency" },
            { k: "SOC 2", l: "Type II ready" },
            { k: "24×7", l: "Enterprise support" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-4xl font-semibold text-gradient-money">{s.k}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-hero p-10 text-center lg:p-16">
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Ready to see your revenue clearly?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign up in under 60 seconds. Connect your Adsterra account and see the first sync land
            live.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="hero">
              <Link to="/register">
                Start free trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
