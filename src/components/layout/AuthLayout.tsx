import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TrendingUp, ArrowLeft } from "lucide-react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-hero lg:block">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-money shadow-glow">
              <TrendingUp className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold">AdProfitly</span>
          </Link>

          <div>
            <blockquote className="max-w-md">
              <p className="font-display text-2xl font-medium leading-snug text-foreground">
                "AdProfitly gave our team one console for revenue, campaigns, and Adsterra data.
                We cut reporting time by 82%."
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-accent" />
                <div>
                  <div className="text-sm font-semibold">Priya Sharma</div>
                  <div className="text-xs text-muted-foreground">Head of Yield, MediaWave</div>
                </div>
              </footer>
            </blockquote>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border/30 pt-6">
              <Stat value="$4.2B+" label="Revenue tracked" />
              <Stat value="12K+" label="Publishers" />
              <Stat value="99.99%" label="Uptime" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-money">
                <TrendingUp className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-semibold">AdProfitly</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && (
              <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-xl font-semibold text-gradient-money">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
