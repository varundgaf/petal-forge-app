import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  FileCheck2,
  Wallet,
  Bell,
  LifeBuoy,
  PieChart,
  Percent,
  Upload,
  MapPin,
  LayoutGrid,
  KeyRound,
  FileText,
  ScrollText,
  Code2,
  Server,
  Lock,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "AdProfitly — Enterprise Publisher Monetization Platform" },
      {
        name: "description",
        content:
          "Unified revenue dashboard, multi-network monetization, publisher management, verification, payouts, and CMS — one enterprise platform for modern publishers.",
      },
      { property: "og:title", content: "AdProfitly — Enterprise Publisher Monetization Platform" },
      {
        property: "og:description",
        content:
          "Unified revenue dashboard, multi-network monetization, publisher management, verification, payouts, and CMS — one enterprise platform for modern publishers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <BentoPlatform />
      <TrustStats />
      <ForWho />
      <StatsRibbon />
      <CTA />
    </PublicLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-1.5 h-3 w-3" /> Enterprise publisher platform
          </Badge>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            The revenue engine for
            <br />
            <span className="text-gradient-money">modern ad publishers.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AdProfitly unifies revenue analytics, publisher management, website verification, and
            payouts into one enterprise console. Ship faster, monetize smarter, sleep easier.
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
    <div className="relative mx-auto mt-16 max-w-5xl animate-fade-in">
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
              <div
                key={k.l}
                className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-elev-2"
              >
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
    title: "Unified Revenue Dashboard",
    body: "Monitor all publisher earnings from one enterprise dashboard with real-time insights and drill-down reporting.",
  },
  {
    icon: Layers,
    title: "Multi-Network Revenue",
    body: "Connect multiple monetization partners through one platform while keeping reports, payments and websites organized.",
  },
  {
    icon: Users,
    title: "Publisher Management",
    body: "Approve publishers, review websites, assign revenue shares and manage every account from one secure platform.",
  },
  {
    icon: Percent,
    title: "Manual Revenue Control",
    body: "Administrators keep complete control over reports, balances and payouts — no automated overrides, ever.",
  },
  {
    icon: Globe2,
    title: "Enterprise Reporting",
    body: "Beautiful dashboards for revenue, RPM, CTR, impressions, clicks, pageviews, and country-level insights.",
  },
  {
    icon: FileCheck2,
    title: "Website Verification",
    body: "Meta tag, DNS, HTML file and ads.txt verification workflows built directly into the platform.",
  },
  {
    icon: Wallet,
    title: "Secure Payments",
    body: "Review balances, approve payouts, and maintain a complete audit-friendly payment history.",
  },
  {
    icon: ScrollText,
    title: "Backend CMS",
    body: "Manage landing pages, FAQs, contact details, company info, support and branding — no code required.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    body: "SOC 2 ready, JWT + refresh tokens, 2FA, granular RBAC, and complete audit logs on every action.",
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "Broadcast platform updates and account alerts to every publisher segment from one control plane.",
  },
  {
    icon: LifeBuoy,
    title: "Support Center",
    body: "Built-in ticketing with priorities, internal notes, and full conversation history for every publisher.",
  },
  {
    icon: MapPin,
    title: "Country Analytics",
    body: "Country, device, browser, OS, and referrer breakdowns with drill-down and CSV/Excel export.",
  },
  {
    icon: Upload,
    title: "Manual Report Imports",
    body: "Import daily and monthly reports via CSV, Excel, or JSON — bulk update thousands of rows in seconds.",
  },
  {
    icon: LayoutGrid,
    title: "Ad Unit Management",
    body: "Create, tag, and organize ad units per site with copyable zone IDs and per-unit performance.",
  },
  {
    icon: KeyRound,
    title: "Role Based Access",
    body: "Publisher, admin, and operator roles with row-level scoping. Teams, invites, and permissions built in.",
  },
  {
    icon: FileText,
    title: "Audit Logs",
    body: "Every admin action captured with actor, IP, device, old value and new value — immutable by design.",
  },
  {
    icon: Code2,
    title: "REST APIs",
    body: "Programmatic access to publishers, reports, payments and settings for deep enterprise integrations.",
  },
  {
    icon: PieChart,
    title: "Revenue Sharing",
    body: "Configure per-publisher and per-site revenue shares with overrides and full historical tracking.",
  },
];

function Features() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Platform</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything a modern publisher platform needs.
          </h2>
          <p className="mt-4 text-muted-foreground">
            One codebase. One console. Publishers, operators, and finance aligned around live
            revenue data.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-2"
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
            Enterprise Reporting
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Every metric that matters,{" "}
            <span className="text-gradient-money">one clear view.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Track revenue, impressions, requests, fill rate, CTR, CPM, eCPM, RPM, plus country and
            device breakdowns — updated continuously across every site and ad unit.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Manual and imported report entry (CSV, Excel, JSON)",
              "Admins control balances, payouts, and revenue share",
              "Publishers only see their own performance and payouts",
              "Enterprise-grade RBAC, audit logs and SSO-ready security",
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
            <span className="font-mono text-xs text-muted-foreground">last 7d</span>
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

const bento = [
  { icon: Users, title: "Publisher Portal", body: "Self-serve dashboard for revenue, sites and payouts.", span: "lg:col-span-2" },
  { icon: FileCheck2, title: "Website Verification", body: "Meta tag, DNS, HTML file and ads.txt flows.", span: "" },
  { icon: BarChart3, title: "Analytics", body: "Revenue, RPM, CTR, impressions, clicks and country insights.", span: "" },
  { icon: Wallet, title: "Payments", body: "Approve payouts, mark paid, and archive full history.", span: "" },
  { icon: Server, title: "Admin Control", body: "Full command over publishers, sites, payments and roles.", span: "lg:col-span-2" },
  { icon: ScrollText, title: "Backend CMS", body: "Edit landing, FAQ, footer, legal and branding live.", span: "" },
  { icon: Bell, title: "Notifications", body: "Broadcasts, alerts and per-account announcements.", span: "" },
  { icon: LifeBuoy, title: "Support", body: "Ticketing with priorities, internal notes and history.", span: "" },
];

function BentoPlatform() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Enterprise Platform</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            One platform. Every workflow.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A tightly integrated suite covering the entire publisher lifecycle — from onboarding to
            payouts.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {bento.map((b) => (
            <div
              key={b.title}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-2 ${b.span}`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-gradient-money group-hover:text-primary-foreground">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { val, ref };
}

function TrustStat({ target, suffix, prefix, label }: { target: number; suffix?: string; prefix?: string; label: string }) {
  const { val, ref } = useCounter(target);
  const formatted = target >= 1000 ? val.toLocaleString() : val.toString();
  return (
    <div ref={ref} className="rounded-2xl border border-border bg-card p-6 text-center">
      <div className="font-display text-4xl font-semibold text-gradient-money">
        {prefix}
        {formatted}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function TrustStats() {
  return (
    <section className="border-y border-border/60 bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Trusted at scale</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for enterprise revenue teams.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <TrustStat target={4200} suffix="+" label="Active Publishers" />
          <TrustStat target={12800} suffix="+" label="Verified Websites" />
          <TrustStat target={186000} suffix="+" label="Monthly Reports Processed" />
          <TrustStat target={140} suffix="+" label="Countries Supported" />
          <TrustStat target={99} suffix=".99%" label="Platform Uptime" />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Shield, label: "SOC 2 Ready" },
            { icon: Lock, label: "GDPR Compliant" },
            { icon: KeyRound, label: "2FA + RBAC" },
            { icon: FileText, label: "Immutable Audit Logs" },
          ].map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground"
            >
              <t.icon className="h-3 w-3 text-primary" />
              {t.label}
            </span>
          ))}
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
      role: "For Operators",
      title: "Run the platform end-to-end.",
      body: "Approve publishers, verify sites, assign revenue shares, and manage payouts from one console.",
      link: "/features",
    },
    {
      role: "For Admin Teams",
      title: "Total control, zero surprises.",
      body: "Users, KYC, plans, coupons, CMS, roles, permissions, audit logs, and system health — one click away.",
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
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-2"
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

function StatsRibbon() {
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
            Sign up in under 60 seconds. Add your first website and start monetizing from day one.
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
