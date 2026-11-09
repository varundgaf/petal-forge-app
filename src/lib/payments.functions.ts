import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { PaymentSnapshot } from "./payment-types";
import { validatePayoutAmount } from "./payments/amount";

export const getPaymentSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { admin?: boolean }) =>
    z.object({ admin: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    if (data.admin) {
      const role = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (role.error || !role.data) throw new Error("Admin access required");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: snapshot, error } = await supabaseAdmin.rpc("payment_snapshot", {
      u: context.userId,
      all_publishers: data.admin ?? false,
    });
    if (error) throw new Error(error.message);
    return snapshot as unknown as PaymentSnapshot;
  });

export const paymentOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { operation: string; payload: Record<string, unknown> }) =>
    z.object({ operation: z.string().max(60), payload: z.record(z.unknown()) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const publicOperations = ["accept_policy", "save_account", "request_payout", "appeal"];
    if (!publicOperations.includes(data.operation)) {
      const role = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (role.error || !role.data) throw new Error("Admin access required");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (["request_payout", "admin_request_payout"].includes(data.operation)) {
      const userId = data.operation === "request_payout" ? context.userId : z.string().uuid().parse(data.payload.user_id);
      const snapshot = await supabaseAdmin.rpc("payment_snapshot", { u: userId, all_publishers: false });
      if (snapshot.error) throw new Error(snapshot.error.message);
      const state = snapshot.data as unknown as PaymentSnapshot;
      validatePayoutAmount(z.string().parse(data.payload.amount), String(state.policy.minimum), String(state.balances.available));
    }
    const { data: result, error } = await supabaseAdmin.rpc("payment_operate", {
      actor: context.userId,
      operation: data.operation,
      d: data.payload as any,
    });
    if (error) throw new Error(error.message);
    return result;
  });
