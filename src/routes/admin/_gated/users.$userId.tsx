import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, KeyRound, ShieldOff, ShieldCheck, MailCheck, Crown, History } from "lucide-react";
import {
  getUserDetail,
  updateUser,
  setUserStatus,
  deleteUser,
  resetUserPassword,
  verifyUserEmail,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changePayoutMembership } from "@/lib/membership.functions";
import { defaultMembership, getPayoutPlan, PAYOUT_PLANS, type PayoutPlanId } from "@/lib/payout-membership";

export const Route = createFileRoute("/admin/_gated/users/$userId")({
  component: UserDetail,
});

function UserDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getUserDetail);
  const updFn = useServerFn(updateUser);
  const statusFn = useServerFn(setUserStatus);
  const delFn = useServerFn(deleteUser);
  const pwFn = useServerFn(resetUserPassword);
  const verifyFn = useServerFn(verifyUserEmail);
  const changePlanFn = useServerFn(changePayoutMembership);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => getFn({ data: { userId } }),
  });

  const [form, setForm] = useState<any>({});
  const [newPw, setNewPw] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState<{
    plan: PayoutPlanId;
    activationDate: string;
    expiryDate: string;
    reason: string;
  }>({ plan: "net30", activationDate: "", expiryDate: "", reason: "" });

  useEffect(() => {
    if (data?.profile) setForm({ ...data.profile });
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => updFn({ data: { userId, patch: form } }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: (status: "active" | "suspended" | "banned") =>
      statusFn({ data: { userId, status } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => delFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      navigate({ to: "/admin/users" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetPw = useMutation({
    mutationFn: () => pwFn({ data: { userId, password: newPw } }),
    onSuccess: () => {
      toast.success("Password reset");
      setNewPw("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const verifyEmail = useMutation({
    mutationFn: () => verifyFn({ data: { userId } }),
    onSuccess: () => toast.success("Email verified"),
    onError: (e: any) => toast.error(e.message),
  });

  const changePlan = useMutation({
    mutationFn: () =>
      changePlanFn({
        data: {
          userId,
          plan: planForm.plan,
          activationDate: planForm.activationDate,
          expiryDate: planForm.plan === "net30" ? null : planForm.expiryDate || null,
          reason: planForm.reason,
        },
      }),
    onSuccess: () => {
      toast.success("Payout membership updated");
      setPlanOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
      qc.invalidateQueries({ queryKey: ["payout-membership", userId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data?.profile) return <div className="text-muted-foreground">Loading…</div>;

  const p = data.profile;
  const membership = data.membership ?? defaultMembership(userId);
  const membershipPlan = getPayoutPlan(membership.payout_plan);
  const openPlanChange = () => {
    setPlanForm({
      plan: membership.payout_plan as PayoutPlanId,
      activationDate: membership.activated_at.startsWith("1970-01-01")
        ? new Date().toISOString().slice(0, 10)
        : membership.activated_at.slice(0, 10),
      expiryDate: membership.expires_at?.slice(0, 10) ?? "",
      reason: "",
    });
    setPlanOpen(true);
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/users" })}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Users
          </Button>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            {p.name ?? p.email}
          </h1>
          <p className="text-sm text-muted-foreground">
            {p.publisher_id} · Joined {new Date(p.created_at).toLocaleDateString()} · Roles:{" "}
            {data.roles.join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeStatus.mutate("active")}
            disabled={changeStatus.isPending}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeStatus.mutate("suspended")}
            disabled={changeStatus.isPending}
          >
            Suspend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeStatus.mutate("banned")}
            disabled={changeStatus.isPending}
          >
            <ShieldOff className="mr-1.5 h-4 w-4" /> Ban
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Delete this user permanently? This cannot be undone.")) del.mutate();
            }}
            disabled={del.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card className="border-primary/25 bg-card/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 text-primary">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Payout Membership</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Admin-assigned plan. No payment gateway or automatic subscription deduction.
              </p>
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={openPlanChange}>
            Change plan
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MembershipDetail label="Current plan" value={`${membershipPlan.name} · ${membershipPlan.cycle}`} />
          <MembershipDetail label="Monthly price" value={`₹${membershipPlan.monthlyPrice.toLocaleString("en-IN")}`} />
          <MembershipDetail label="Status" value={membership.membership_status} />
          <MembershipDetail label="Activated" value={new Date(membership.activated_at).toLocaleDateString()} />
          <MembershipDetail
            label="Expires"
            value={membership.expires_at ? new Date(membership.expires_at).toLocaleDateString() : "No expiry"}
          />
        </div>
        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Plan change history
          </div>
          {data.membershipHistory.length ? (
            <ul className="space-y-3">
              {data.membershipHistory.slice(0, 5).map((entry: any) => (
                <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <div>
                    <p>
                      <span className="capitalize text-muted-foreground">{entry.previous_plan ?? "Not assigned"}</span>
                      {" → "}
                      <span className="font-medium uppercase">{entry.new_plan}</span>
                      <span className="text-muted-foreground">
                        {" · by "}{entry.changed_by_profile?.name ?? entry.changed_by_profile?.email ?? "Admin"}
                      </span>
                    </p>
                    {entry.reason && <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No manual plan changes yet.</p>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/40 p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Profile</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Username">
              <Input value={form.username ?? ""} onChange={(e) => set("username", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Company">
              <Input value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} />
            </Field>
            <Field label="Language">
              <Input value={form.language ?? ""} onChange={(e) => set("language", e.target.value)} placeholder="en" />
            </Field>
            <Field label="Timezone">
              <Input value={form.timezone ?? ""} onChange={(e) => set("timezone", e.target.value)} />
            </Field>
            <Field label="Payment method">
              <Select
                value={form.payment_method ?? ""}
                onValueChange={(v) => set("payment_method", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="wire">Wire</SelectItem>
                  <SelectItem value="crypto_btc">Crypto BTC</SelectItem>
                  <SelectItem value="crypto_usdt">Crypto USDT</SelectItem>
                  <SelectItem value="payoneer">Payoneer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment destination">
              <Input
                value={form.payment_email ?? ""}
                onChange={(e) => set("payment_email", e.target.value)}
              />
            </Field>
            <Field label="Revenue share %">
              <Input
                type="number"
                value={form.revenue_share ?? ""}
                onChange={(e) => set("revenue_share", e.target.value)}
              />
            </Field>
            <Field label="Minimum payout">
              <Input
                type="number"
                value={form.min_payout ?? ""}
                onChange={(e) => set("min_payout", e.target.value)}
              />
            </Field>
            <Field label="Payment cycle">
              <Select value={form.payment_cycle ?? ""} onValueChange={(v) => set("payment_cycle", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Currency">
              <Input value={form.currency ?? ""} onChange={(e) => set("currency", e.target.value)} placeholder="USD" />
            </Field>
            <Field label="Tax ID / VAT">
              <Input value={form.tax_id ?? ""} onChange={(e) => set("tax_id", e.target.value)} />
            </Field>
            <Field label="KYC status">
              <Select value={form.kyc_status ?? ""} onValueChange={(v) => set("kyc_status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status ?? ""} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Label className="mb-1.5 block text-xs">Internal notes</Label>
            <Textarea
              rows={3}
              value={form.admin_notes ?? ""}
              onChange={(e) => set("admin_notes", e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending} variant="hero">
              <Save className="mr-1.5 h-4 w-4" /> Save changes
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/40 p-5">
            <h2 className="mb-3 text-sm font-semibold">Account actions</h2>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs">Reset password</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="New password (min 8)"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetPw.mutate()}
                    disabled={newPw.length < 8 || resetPw.isPending}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => verifyEmail.mutate()}
                disabled={verifyEmail.isPending}
              >
                <MailCheck className="mr-1.5 h-4 w-4" /> Force verify email
              </Button>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/40 p-5">
            <h2 className="mb-3 text-sm font-semibold">Websites ({data.sites.length})</h2>
            <ul className="space-y-1.5 text-sm">
              {data.sites.slice(0, 8).map((s: any) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="truncate text-muted-foreground">{s.domain}</span>
                  <Badge variant="outline" className="capitalize">
                    {s.status}
                  </Badge>
                </li>
              ))}
              {!data.sites.length && (
                <li className="text-xs text-muted-foreground">No sites</li>
              )}
            </ul>
          </Card>

          <Card className="border-border/60 bg-card/40 p-5">
            <h2 className="mb-3 text-sm font-semibold">Recent payments</h2>
            <ul className="space-y-1.5 text-sm">
              {data.payments.slice(0, 6).map((p: any) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    ${Number(p.amount).toFixed(2)}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {p.status}
                  </Badge>
                </li>
              ))}
              {!data.payments.length && (
                <li className="text-xs text-muted-foreground">No payments</li>
              )}
            </ul>
          </Card>

          <Card className="border-border/60 bg-card/40 p-5">
            <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {data.activity.slice(0, 8).map((a: any) => (
                <li key={a.id}>
                  <span className="text-foreground">{a.action}</span>
                  {a.detail ? ` — ${a.detail}` : ""}
                </li>
              ))}
              {!data.activity.length && <li>No activity recorded</li>}
            </ul>
          </Card>
        </div>
      </div>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change payout membership</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs">Membership plan</Label>
              <Select
                value={planForm.plan}
                onValueChange={(plan) => setPlanForm((current) => ({ ...current, plan: plan as PayoutPlanId }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYOUT_PLANS.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} · {plan.cycle} · ₹{plan.monthlyPrice}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-xs">Activation date</Label>
                <Input
                  type="date"
                  value={planForm.activationDate}
                  onChange={(event) => setPlanForm((current) => ({ ...current, activationDate: event.target.value }))}
                />
              </div>
              {planForm.plan !== "net30" && (
                <div>
                  <Label className="mb-1.5 block text-xs">Expiry date (optional)</Label>
                  <Input
                    type="date"
                    value={planForm.expiryDate}
                    onChange={(event) => setPlanForm((current) => ({ ...current, expiryDate: event.target.value }))}
                  />
                </div>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Internal reason (optional)</Label>
              <Textarea
                rows={3}
                value={planForm.reason}
                onChange={(event) => setPlanForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Reason for this upgrade, downgrade or date change"
              />
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
              Confirm change from <strong>{membershipPlan.name} ({membershipPlan.cycle})</strong> to{" "}
              <strong>{getPayoutPlan(planForm.plan).name} ({getPayoutPlan(planForm.plan).cycle})</strong>.
              No charge or subscription deduction will be made.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
              <Button
                variant="hero"
                onClick={() => changePlan.mutate()}
                disabled={
                  changePlan.isPending ||
                  !planForm.activationDate ||
                  Boolean(planForm.expiryDate && planForm.expiryDate <= planForm.activationDate)
                }
              >
                {changePlan.isPending ? "Saving…" : "Confirm plan change"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MembershipDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
