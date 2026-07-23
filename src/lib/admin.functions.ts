import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: admin only");
}

async function logAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: any,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    meta: meta ?? null,
  });
}

// ---------- Bootstrap ----------

export const verifyOrBootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: already } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (already) return { isAdmin: true, bootstrapped: false };

    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase().trim();
    if (!bootstrapEmail) return { isAdmin: false, bootstrapped: false };

    const callerEmail = (context.claims.email as string | undefined)?.toLowerCase().trim();
    if (!callerEmail || callerEmail !== bootstrapEmail) {
      return { isAdmin: false, bootstrapped: false };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only allow bootstrap if no admin exists yet
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { isAdmin: false, bootstrapped: false };

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insErr) throw new Error(insErr.message);

    await logAction(context.userId, "admin.bootstrap", "user", context.userId, {
      email: callerEmail,
    });
    return { isAdmin: true, bootstrapped: true };
  });

// ---------- Dashboard stats ----------

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      publishers,
      activePub,
      banned,
      sitesPending,
      sitesActive,
      sitesRejected,
      payPending,
      payPaid,
      revToday,
      revMonth,
      revTotal,
    ] = await Promise.all([
      supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "publisher"),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "banned"),
      supabaseAdmin.from("sites").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("sites").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("sites").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabaseAdmin.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("payments").select("*", { count: "exact", head: true }).eq("status", "paid"),
      supabaseAdmin.from("revenue_events").select("revenue").eq("date", new Date().toISOString().slice(0, 10)),
      supabaseAdmin
        .from("revenue_events")
        .select("revenue")
        .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      supabaseAdmin.from("revenue_events").select("revenue"),
    ]);

    const sum = (rows: any) =>
      (rows.data as { revenue: number }[] | null)?.reduce((a, r) => a + Number(r.revenue), 0) ?? 0;

    return {
      totalPublishers: publishers.count ?? 0,
      activePublishers: activePub.count ?? 0,
      bannedUsers: banned.count ?? 0,
      pendingWebsites: sitesPending.count ?? 0,
      approvedWebsites: sitesActive.count ?? 0,
      rejectedWebsites: sitesRejected.count ?? 0,
      pendingPayments: payPending.count ?? 0,
      paidPayments: payPaid.count ?? 0,
      todayRevenue: sum(revToday),
      monthRevenue: sum(revMonth),
      totalRevenue: sum(revTotal),
    };
  });

// ---------- Users ----------

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string; limit?: number }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles")
      .select("id,email,name,company,phone,country,status,publisher_id,revenue_share,min_payout,kyc_status,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.search) q = q.or(`email.ilike.%${data.search}%,name.ilike.%${data.search}%,company.ilike.%${data.search}%`);
    if (data.status) q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, roles, sites, payments, revenue, activity, notifications] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId),
      supabaseAdmin.from("sites").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }),
      supabaseAdmin.from("payments").select("*").eq("user_id", data.userId).order("requested_at", { ascending: false }),
      supabaseAdmin.from("revenue_events").select("date,revenue,impressions,clicks").eq("user_id", data.userId).order("date", { ascending: false }).limit(30),
      supabaseAdmin.from("activity_logs").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("notifications").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(50),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    return {
      profile: profile.data,
      roles: (roles.data ?? []).map((r) => r.role),
      sites: sites.data ?? [],
      payments: payments.data ?? [],
      revenue: revenue.data ?? [],
      activity: activity.data ?? [],
      notifications: notifications.data ?? [],
    };
  });

const profilePatchSchema = z.object({
  name: z.string().max(120).nullish(),
  company: z.string().max(120).nullish(),
  username: z.string().max(60).nullish(),
  email: z.string().email().nullish(),
  phone: z.string().max(40).nullish(),
  country: z.string().max(60).nullish(),
  language: z.string().max(20).nullish(),
  timezone: z.string().max(60).nullish(),
  currency: z.string().max(10).nullish(),
  tax_id: z.string().max(120).nullish(),
  payment_cycle: z.string().max(20).nullish(),
  payment_method: z.enum(["paypal", "wire", "crypto_btc", "crypto_usdt", "payoneer"]).nullish(),
  payment_email: z.string().max(200).nullish(),
  revenue_share: z.coerce.number().min(0).max(100).nullish(),
  min_payout: z.coerce.number().min(0).nullish(),
  status: z.enum(["active", "suspended", "banned"]).nullish(),
  admin_notes: z.string().max(4000).nullish(),
  kyc_status: z.enum(["unverified", "pending", "verified", "rejected"]).nullish(),
  phone_verified: z.boolean().nullish(),
  email_verified: z.boolean().nullish(),
  website: z.string().max(200).nullish(),
  avatar_url: z.string().max(500).nullish(),
});

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; patch: z.infer<typeof profilePatchSchema> }) => ({
    userId: z.string().uuid().parse(d.userId),
    patch: profilePatchSchema.parse(d.patch),
  }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = Object.fromEntries(
      Object.entries(data.patch).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    );
    const { error } = await supabaseAdmin.from("profiles").update(patch as any).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, "user.update", "user", data.userId, patch);
    return { ok: true };
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; status: "active" | "suspended" | "banned" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, `user.${data.status}`, "user", data.userId);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, "user.delete", "user", data.userId);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) => ({
    userId: z.string().uuid().parse(d.userId),
    password: z.string().min(8).max(72).parse(d.password),
  }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await logAction(context.userId, "user.reset_password", "user", data.userId);
    return { ok: true };
  });

export const verifyUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    await logAction(context.userId, "user.verify_email", "user", data.userId);
    return { ok: true };
  });

// ---------- Sites ----------

export const listSites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("sites")
      .select("id,domain,category,status,monthly_visitors,user_id,created_at, profiles!inner(email,name,publisher_id)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search) q = q.ilike("domain", `%${data.search}%`);
    if (data.status) q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setSiteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { siteId: string; status: "active" | "pending" | "paused" | "rejected" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").update({ status: data.status }).eq("id", data.siteId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, `site.${data.status}`, "site", data.siteId);
    return { ok: true };
  });

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { siteId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").delete().eq("id", data.siteId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, "site.delete", "site", data.siteId);
    return { ok: true };
  });

// ---------- Payments ----------

export const listPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; status?: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("payments")
      .select("*, profiles!inner(email,name,publisher_id)")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status as any);
    if (data.search) q = q.or(`reference_id.ilike.%${data.search}%,destination.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    paymentId: string;
    status?: "pending" | "processing" | "paid" | "failed" | "approved" | "rejected";
    tx_hash?: string;
    notes?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.status) {
      patch.status = data.status;
      if (data.status === "paid") patch.paid_at = new Date().toISOString();
    }
    if (data.tx_hash !== undefined) patch.tx_hash = data.tx_hash;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await supabaseAdmin.from("payments").update(patch).eq("id", data.paymentId);
    if (error) throw new Error(error.message);
    await logAction(context.userId, "payment.update", "payment", data.paymentId, patch);
    return { ok: true };
  });

// ---------- Audit logs ----------

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*, profiles:admin_id(email,name)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
