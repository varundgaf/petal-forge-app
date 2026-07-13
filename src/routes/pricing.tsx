import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — AdProfitly" },
      {
        name: "description",
        content:
          "Simple, revenue-scaled pricing. Start free. Scale to Growth or Enterprise as your traffic and campaigns grow.",
      },
      { property: "og:title", content: "Pricing — AdProfitly" },
      {
        property: "og:description",
        content: "Simple, revenue-scaled pricing for publishers and advertisers.",
      },
    ],
  }),
});

const plans = [
  {
    name: "Starter",
    price: "$0",
    tag: "/ month",
    desc: "For small publishers testing the waters.",
    cta: "Start free",
    features: [
      "Up to 5 sites",
      "Basic revenue analytics",
      "Daily Adsterra sync",
      "CSV export",
      "Email support",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    price: "$149",
    tag: "/ month",
    desc: "For scaling teams that need real-time data.",
    cta: "Start Growth trial",
    features: [
      "Unlimited sites & ad units",
      "Real-time analytics",
      "Hourly Adsterra sync",
      "CSV + Excel export",
      "5 team members",
      "2FA & audit logs",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    tag: "",
    desc: "For platforms operating at scale.",
    cta: "Talk to sales",
    features: [
      "Unlimited everything",
      "Dedicated infrastructure",
      "SSO / SAML + SCIM",
      "SOC 2 report & DPA",
      "Custom SLAs (99.99%)",
      "24×7 named CSM",
      "Custom Adsterra sync",
    ],
    highlight: false,
  },
];

function PricingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Pricing</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Scales with your <span className="text-gradient-money">revenue.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Every plan includes analytics, Adsterra sync, and enterprise security.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                p.highlight
                  ? "border-primary/60 bg-card shadow-glow"
                  : "border-border bg-card/60"
              }`}
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-8 bg-gradient-money text-primary-foreground">
                  Most popular
                </Badge>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.tag}</span>
              </div>
              <Button
                asChild
                className="mt-6"
                variant={p.highlight ? "hero" : "outline"}
                size="lg"
              >
                <Link to={p.name === "Enterprise" ? "/contact" : "/register"}>
                  {p.cta} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-semibold">
            Questions we get a lot
          </h2>
          <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
            {[
              {
                q: "How does the Adsterra integration work?",
                a: "Connect your Adsterra API key in Settings. AdProfitly syncs reports on your schedule and ingests them into your dashboard automatically.",
              },
              {
                q: "Can I switch plans anytime?",
                a: "Yes. Upgrade or downgrade whenever. Changes prorate to the day.",
              },
              {
                q: "Do you offer volume discounts?",
                a: "Enterprise pricing is based on revenue tracked and features required. Talk to sales for a custom quote.",
              },
              {
                q: "Is my data secure?",
                a: "AdProfitly is SOC 2 Type II ready with encryption in transit and at rest, RBAC, and full audit logs.",
              },
            ].map((f) => (
              <div key={f.q} className="p-6">
                <h3 className="font-display font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
