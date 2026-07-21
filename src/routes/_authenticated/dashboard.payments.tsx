import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { addDays, format, nextMonday } from "date-fns";
import { Wallet, Plus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/payments")({
  component: PaymentsPage,
  head: () => ({ meta: [{ title: "Payments — AdProfitly" }] }),
});

const METHODS = ["paypal", "wire", "crypto_btc", "crypto_usdt", "payoneer"] as const;
const MIN_PAYOUT = 50;

async function fetchPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function fetchRevenueTotal() {
  const { data, error } = await supabase.from("revenue_events").select("revenue");
  if (error) throw error;
  return (data ?? []).reduce((s, r) => s + Number(r.revenue), 0);
}

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "paid":
      return "default";
    case "approved":
    case "processing":
      return "outline";
    case "pending":
      return "secondary";
    case "rejected":
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

function PaymentsPage() {
  const qc = useQueryClient();
  const profile = useAuth((s) => s.profile);
  const { data: payments, isLoading } = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const { data: revenue } = useQuery({ queryKey: ["revenue-total"], queryFn: fetchRevenueTotal });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: 0,
    method: (profile?.payment_method ?? "paypal") as (typeof METHODS)[number],
    destination: profile?.payment_email ?? "",
  });

  const paidTotal =
    payments?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const pendingTotal =
    payments
      ?.filter((p) => ["pending", "approved", "processing"].includes(p.status))
      .reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const availableBalance = Math.max(0, (revenue ?? 0) - paidTotal - pendingTotal);
  const nextPaymentDate = nextMonday(new Date());
  const canRequest = availableBalance >= MIN_PAYOUT;

  const request = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Profile not loaded");
      if (form.amount < MIN_PAYOUT) throw new Error(`Minimum payout is $${MIN_PAYOUT}`);
      if (form.amount > availableBalance)
        throw new Error(`Max available: $${availableBalance.toFixed(2)}`);
      const reference_id = `PAY-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
      const { error } = await supabase.from("payments").insert({
        user_id: profile.id,
        amount: form.amount,
        method: form.method,
        destination: form.destination || null,
        status: "pending",
        reference_id,
      });
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        user_id: profile.id,
        action: "Payout requested",
        detail: `$${form.amount.toFixed(2)} via ${form.method.replace("_", " ").toUpperCase()}`,
      });
    },
    onSuccess: () => {
      toast.success("Payout requested. You'll be notified on the next weekly cycle.");
      qc.invalidateQueries({ queryKey: ["payments"] });
      setOpen(false);
      setForm({
        amount: 0,
        method: (profile?.payment_method ?? "paypal") as (typeof METHODS)[number],
        destination: profile?.payment_email ?? "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Payments</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly payouts every Monday · Minimum ${MIN_PAYOUT}.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={!canRequest}>
              <Plus className="mr-2 h-4 w-4" />
              Request payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request weekly payout</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                request.mutate();
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Available:{" "}
                <span className="font-mono text-primary">${availableBalance.toFixed(2)}</span> ·
                Minimum <span className="font-mono">${MIN_PAYOUT}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={MIN_PAYOUT}
                  max={availableBalance}
                  required
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={form.method}
                  onValueChange={(v) => setForm({ ...form, method: v as (typeof METHODS)[number] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest">Destination</Label>
                <Input
                  id="dest"
                  placeholder="Email, wallet address, or account #"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={request.isPending || form.amount < MIN_PAYOUT}
              >
                {request.isPending ? "Submitting…" : "Submit request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!canRequest && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          <Info className="h-4 w-4 shrink-0" />
          You need at least{" "}
          <span className="font-mono">${MIN_PAYOUT}</span> in available balance to request a
          payment. You have <span className="font-mono">${availableBalance.toFixed(2)}</span>.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Available</p>
          <p className="mt-2 font-display text-2xl font-semibold text-primary">
            ${availableBalance.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="mt-2 font-display text-2xl font-semibold">${pendingTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifetime paid</p>
          <p className="mt-2 font-display text-2xl font-semibold">${paidTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Next weekly cycle
          </p>
          <p className="mt-2 font-display text-lg font-semibold">
            {format(nextPaymentDate, "MMM d, yyyy")}
          </p>
          <p className="text-xs text-muted-foreground">
            in {Math.max(1, Math.ceil((+nextPaymentDate - Date.now()) / 86400000))} days
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Method</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Reference ID</th>
              <th className="px-6 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : payments?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No payouts yet.</p>
                </td>
              </tr>
            ) : (
              payments?.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(p.requested_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">
                    ${Number(p.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 uppercase">{p.method.replace("_", " ")}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(p.status)} className="capitalize">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {p.reference_id ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {p.notes ??
                      (p.paid_at
                        ? `Paid ${format(new Date(p.paid_at), "MMM d")}`
                        : p.destination ?? "—")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// keep addDays import used to avoid tree-shake noise if referenced later
void addDays;
