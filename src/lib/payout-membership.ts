export const PAYOUT_PLANS = [
  {
    id: "net30",
    name: "Standard",
    cycle: "Net-30",
    intervalDays: 30,
    monthlyPrice: 0,
    description: "The default publisher payout membership.",
    features: ["₹0 monthly fee", "$50 minimum payout", "14-day IVT verification"],
  },
  {
    id: "net15",
    name: "Faster Payout",
    cycle: "Net-15",
    intervalDays: 15,
    monthlyPrice: 500,
    description: "A shorter payout cycle assigned by an administrator.",
    features: ["Net-15 payout cycle", "$50 minimum payout", "14-day IVT verification"],
  },
  {
    id: "net7",
    name: "Priority Payout",
    cycle: "Net-7",
    intervalDays: 7,
    monthlyPrice: 999,
    description: "The fastest payout cycle with priority membership.",
    features: ["Net-7 payout cycle", "$50 minimum payout", "14-day IVT verification"],
  },
] as const;

export type PayoutPlanId = (typeof PAYOUT_PLANS)[number]["id"];
export type MembershipStatus = "free" | "active" | "expired";

export type PayoutMembership = {
  user_id: string;
  payout_plan: PayoutPlanId;
  monthly_price: number | string;
  membership_status: MembershipStatus;
  activated_at: string;
  expires_at: string | null;
  last_modified_by: string | null;
  updated_at: string;
};

export function getPayoutPlan(id: string) {
  return PAYOUT_PLANS.find((plan) => plan.id === id) ?? PAYOUT_PLANS[0];
}

export function defaultMembership(userId: string): PayoutMembership {
  return {
    user_id: userId,
    payout_plan: "net30",
    monthly_price: 0,
    membership_status: "free",
    activated_at: new Date(0).toISOString(),
    expires_at: null,
    last_modified_by: null,
    updated_at: new Date(0).toISOString(),
  };
}

export function effectiveMembershipStatus(
  membership: Pick<PayoutMembership, "payout_plan" | "membership_status" | "expires_at">,
  now = new Date(),
): MembershipStatus {
  if (membership.payout_plan === "net30") return "free";
  if (membership.expires_at && new Date(membership.expires_at).getTime() <= now.getTime()) {
    return "expired";
  }
  return membership.membership_status;
}
