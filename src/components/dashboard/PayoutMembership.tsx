import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, Clock3, Crown, IndianRupee, ShieldCheck, Zap } from "lucide-react";
import { getPayoutMembership } from "@/lib/membership.functions";
import {
  defaultMembership,
  effectiveMembershipStatus,
  getPayoutPlan,
  PAYOUT_PLANS,
} from "@/lib/payout-membership";
import { useAuth } from "@/lib/auth-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const planIcons = { net30: Clock3, net15: Zap, net7: Crown };
const formatDate = (value: string | null) =>
  value && !value.startsWith("1970-01-01")
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export function PayoutMembership() {
  const userId = useAuth((state) => state.user?.id);
  const getMembership = useServerFn(getPayoutMembership);
  const { data, error, isLoading } = useQuery({
    queryKey: ["payout-membership", userId],
    queryFn: () => getMembership(),
    enabled: Boolean(userId),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const membership = data ?? defaultMembership(userId ?? "");
  const currentPlan = getPayoutPlan(membership.payout_plan);
  const status = effectiveMembershipStatus(membership);

  return (
    <section className="space-y-4" aria-labelledby="payout-membership-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Membership</p>
          <h2 id="payout-membership-title" className="mt-1 font-display text-xl font-semibold">
            Payout Membership
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your plan is assigned by AdProfitly. No subscription payment is collected here.
          </p>
        </div>
        <Badge variant={status === "expired" ? "destructive" : "outline"} className="capitalize">
          {status === "free" ? "Free membership" : status}
        </Badge>
      </div>

      {error ? (
        <Card className="border-destructive/40 p-4 text-sm text-destructive">
          Membership details could not be loaded. Please refresh to try again.
        </Card>
      ) : (
        <Card className="border-primary/30 bg-card p-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MembershipFact
              icon={ShieldCheck}
              label="Current membership plan"
              value={isLoading ? "Loading…" : currentPlan.name}
              detail={currentPlan.cycle}
            />
            <MembershipFact
              icon={IndianRupee}
              label="Monthly plan price"
              value={`₹${currentPlan.monthlyPrice.toLocaleString("en-IN")}`}
              detail="Admin-assigned; no auto-billing"
            />
            <MembershipFact
              icon={CalendarDays}
              label="Membership status"
              value={status === "free" ? "Free" : status === "active" ? "Active" : "Expired"}
              detail={`Activated ${formatDate(membership.activated_at)}`}
            />
            <MembershipFact
              icon={Clock3}
              label="Plan expiry date"
              value={formatDate(membership.expires_at)}
              detail={membership.payout_plan === "net30" ? "No expiry on Standard" : "If applicable"}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PAYOUT_PLANS.map((plan) => {
          const Icon = planIcons[plan.id];
          const current = membership.payout_plan === plan.id && !isLoading && !error;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col overflow-hidden border-border/70 bg-card/50 p-5 transition-colors",
                current && "border-primary bg-primary/[0.06] shadow-lg shadow-primary/5",
              )}
            >
              {current && (
                <Badge className="absolute right-4 top-4 gap-1">
                  <Check className="h-3 w-3" /> Current plan
                </Badge>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {plan.name}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-display text-2xl font-semibold">{plan.cycle}</p>
                <p className="font-display text-xl font-semibold text-primary">
                  ₹{plan.monthlyPrice.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-muted-foreground">/month</span>
                </p>
              </div>
              <p className="mt-3 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {current ? (
                  <Badge variant="outline" className="w-full justify-center py-2">
                    Your assigned plan
                  </Badge>
                ) : plan.id === "net30" ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Default plan
                  </Badge>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Coming soon · Contact admin
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function MembershipFact({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <p className="mt-2 font-display text-lg font-semibold capitalize">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
