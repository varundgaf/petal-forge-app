import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultMembership,
  effectiveMembershipStatus,
  getPayoutPlan,
} from "./payout-membership.ts";

test("every publisher defaults to Standard Net-30 at ₹0", () => {
  const membership = defaultMembership("00000000-0000-0000-0000-000000000000");
  assert.equal(membership.payout_plan, "net30");
  assert.equal(membership.membership_status, "free");
  assert.equal(getPayoutPlan(membership.payout_plan).monthlyPrice, 0);
  assert.equal(getPayoutPlan(membership.payout_plan).intervalDays, 30);
});

test("Faster Payout is Net-15 at ₹500 per month", () => {
  assert.equal(getPayoutPlan("net15").intervalDays, 15);
  assert.equal(getPayoutPlan("net15").monthlyPrice, 500);
});

test("Priority Payout is Net-7 at ₹999 per month", () => {
  assert.equal(getPayoutPlan("net7").intervalDays, 7);
  assert.equal(getPayoutPlan("net7").monthlyPrice, 999);
});

test("an expired paid membership cannot display as active", () => {
  assert.equal(
    effectiveMembershipStatus(
      { payout_plan: "net15", membership_status: "active", expires_at: "2026-11-01T00:00:00Z" },
      new Date("2026-11-14T00:00:00Z"),
    ),
    "expired",
  );
});

test("the ₹50 payout minimum and 14-day verification remain in every plan", () => {
  for (const id of ["net30", "net15", "net7"]) {
    assert.ok(getPayoutPlan(id).features.includes("$50 minimum payout"));
    assert.ok(getPayoutPlan(id).features.includes("14-day IVT verification"));
  }
});
