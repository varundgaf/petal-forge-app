import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — AdProfitly" },
      {
        name: "description",
        content:
          "AdProfitly builds the enterprise revenue console for ad publishers and advertisers. Learn about our mission, team, and platform philosophy.",
      },
      { property: "og:title", content: "About AdProfitly" },
      {
        property: "og:description",
        content: "Enterprise revenue console for ad publishers and advertisers.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">About</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Built for teams who ship <span className="text-gradient-money">ad revenue.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            We spent a decade running AdOps at global publishers. AdProfitly is what we always
            wished existed — one console, live data, no spreadsheets.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              t: "Live over batch",
              b: "Reporting should never be next-day. Every metric on AdProfitly streams in real time.",
            },
            {
              t: "One source of truth",
              b: "Adsterra reports, revenue, campaigns, and payments unified in one schema.",
            },
            {
              t: "Enterprise, not enterprisey",
              b: "SOC 2, RBAC, audit logs — without a 40-page onboarding PDF.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold">{c.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-surface py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-semibold tracking-tight">
            Numbers we're proud of
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { k: "$4.2B+", l: "Tracked" },
              { k: "12K+", l: "Publishers" },
              { k: "60M+", l: "Daily events" },
              { k: "99.99%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-3xl font-semibold text-gradient-money">{s.k}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold">Want to join?</h2>
          <p className="mt-3 text-muted-foreground">
            We're hiring backend, frontend, and AdOps engineers. Fully remote.
          </p>
          <Button asChild size="lg" variant="hero" className="mt-6">
            <Link to="/contact">
              Get in touch <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
