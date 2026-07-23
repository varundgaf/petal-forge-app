import { Link } from "@tanstack/react-router";
import { TrendingUp, Github, Twitter, Linkedin } from "lucide-react";

const cols = [
  {
    heading: "Product",
    links: [
      { to: "/features", label: "Features" },
      { to: "/pricing", label: "Pricing" },
      { to: "/about", label: "Publisher Portal" },
      { to: "/about", label: "Admin Control" },
      { to: "/about", label: "Backend CMS" },
    ],
  },
  {
    heading: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/about", label: "Careers" },
      { to: "/about", label: "Blog" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { to: "/about", label: "Docs" },
      { to: "/about", label: "API Reference" },
      { to: "/about", label: "Status" },
      { to: "/about", label: "Security" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { to: "/about", label: "Privacy" },
      { to: "/about", label: "Terms" },
      { to: "/about", label: "DPA" },
      { to: "/about", label: "Cookies" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-money">
                <TrendingUp className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-semibold">AdProfitly</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Enterprise ad monetization and analytics for publishers and advertisers worldwide.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.heading}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                {c.heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l, i) => (
                  <li key={i}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AdProfitly, Inc. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            API status:{" "}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              operational
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
