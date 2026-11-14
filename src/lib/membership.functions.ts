import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { defaultMembership, type PayoutMembership } from "./payout-membership";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

export const getPayoutMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("publisher_payout_memberships")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Membership details are unavailable");
    return (data ?? defaultMembership(context.userId)) as PayoutMembership;
  });

export const changePayoutMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    userId: string;
    plan: "net30" | "net15" | "net7";
    activationDate: string;
    expiryDate?: string | null;
    reason?: string;
  }) =>
    z
      .object({
        userId: z.string().uuid(),
        plan: z.enum(["net30", "net15", "net7"]),
        activationDate: dateString,
        expiryDate: dateString.nullish(),
        reason: z.string().max(1000).optional(),
      })
      .refine(
        (value) =>
          !value.expiryDate || value.expiryDate > value.activationDate,
        "Expiry date must be after activation date",
      )
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role.error || !role.data) throw new Error("Admin access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: membership, error } = await supabaseAdmin.rpc("change_payout_membership", {
      actor: context.userId,
      target: data.userId,
      new_plan: data.plan,
      starts: `${data.activationDate}T00:00:00.000Z`,
      ends: (data.expiryDate ? `${data.expiryDate}T00:00:00.000Z` : null) as unknown as string,
      change_reason: data.reason?.trim() || undefined,
    });
    if (error) throw new Error(error.message);
    return membership as PayoutMembership;
  });
