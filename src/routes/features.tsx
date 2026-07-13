import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Globe2,
  Shield,
  Zap,
  Users,
  Layers,
  Wallet,
  KeyRound,
  Bell,
  Cpu,
  FileSpreadsheet,
  Fingerprint,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: "Features — AdProfitly" },
      {
        name: "description",
        content:
          "Real-time revenue analytics, campaign builder, Adsterra sync, RBAC, audit logs, and every enterprise AdTech feature publishers and advertisers need.",
      },
      { property: "og:title", content: "Features — AdProfitly" },
      {
        property: "og:description",
        content:
          "Revenue analytics, campaign management, Adsterra sync, and enterprise-grade security.",
      },
    ],
  }),
});

const groups = [
  {
    heading: "Analytics & Reporting",
    color: "text-primary",
    items: [
      { icon: BarChart3, t: "Real-time revenue", b: "Live impressions, CTR, CPM, RPM, eCPM." },
      { icon: Globe2, t: "Geo & device", b: "Country, browser, OS, device, referrer breakdowns." },
      { icon: FileSpreadsheet, t: "CSV & Excel export", b: "Every table exportable in one click." },
      { icon: Layers, t: "Adsterra sync", b: "Daily and monthly scheduled sync built in." },
    ],
  },
  {
    heading: "Campaigns & Monetization",
    color: "text-info",
    items: [
      { icon: Zap, t: "Campaign builder", b: "Creatives, audiences, geo, and budgets." },
      { icon: Wallet, t: "Payments & payouts", b: "Track invoices, withdrawals, KYC status." },
      { icon: Cpu, t: "Pixel & API keys", b: "Advertiser pixel + secure API access." },
      { icon: Bell, t: "Notifications", b: "Threshold alerts and system events." },
    ],
  },
  {
    heading: "Security & Operations",
    color: "text-warning",
    items: [
      { icon: Shield, t: "RBAC + audit logs", b: "Every action stored, every role scoped." },
      { icon: Fingerprint, t: "2FA & session mgmt", b: "TOTP + refresh-token rotation." },
      { icon: KeyRound, t: "JWT auth", b: "Access + refresh tokens with silent renew." },
      { icon: Users, t: "Multi-tenant teams", b: "Publisher / advertiser / admin separation." },
    ],
  },
];

function FeaturesPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Features</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Every module you need to run{" "}
            <span className="text-gradient-money">a modern AdTech business.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Publisher analytics, advertiser campaigns, admin operations, and Adsterra reporting in
            one enterprise-grade platform.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {groups.map((g) => (
            <div key={g.heading}>
              <h2 className={`font-mono text-xs uppercase tracking-[0.3em] ${g.color}`}>
                {g.heading}
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {g.items.map((it) => (
                  <div
                    key={it.t}
                    className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                  >
                    <it.icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-display text-lg font-semibold">{it.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{it.b}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
