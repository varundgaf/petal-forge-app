import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Wallet, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

async function fetchPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function fetchAvailable() {
  const { data, error } = await supabase.from("revenue_events").select("revenue");
  if (error) throw error;
  const total = (data ?? []).reduce((sum, r) => sum + Number(r.revenue), 0);
  return total;
}

function statusColor(s: string) {
  switch (s) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "processing":
      return "outline";
    default:
      return "destructive";
  }
}

function PaymentsPage() {
  const qc = useQueryClient();
  const { data: payments, isLoading } = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const { data: available } = useQuery({ queryKey: ["revenue-total"], queryFn: fetchAvailable });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: 0,
    method: "paypal" as (typeof METHODS)[number],
    destination: "",
  });

  const paidTotal =
    payments?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const pendingTotal =
    payments?.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const availableForPayout = Math.max(0, (available ?? 0) - paidTotal - pendingTotal);

  const request = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      if (form.amount <= 0) throw new Error("Enter a valid amount");
      if (form.amount > availableForPayout)
        throw new Error(`Max available: $${availableForPayout.toFixed(2)}`);
      const { error } = await supabase.from("payments").insert({
        user_id: userData.user.id,
        amount: form.amount,
        method: form.method,
        destination: form.destination || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout requested.");
      qc.invalidateQueries({ queryKey: ["payments"] });
      setOpen(false);
      setForm({ amount: 0, method: "paypal", destination: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Payments</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Payouts</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={availableForPayout <= 0}>
              <Plus className="mr-2 h-4 w-4" />
              Request payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request payout</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                request.mutate();
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Available: <span className="font-mono text-primary">${availableForPayout.toFixed(2)}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={1}
                  max={availableForPayout}
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
                disabled={request.isPending}
              >
                {request.isPending ? "Submitting…" : "Submit request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Available</p>
          <p className="mt-2 font-display text-2xl font-semibold text-primary">
            ${availableForPayout.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="mt-2 font-display text-2xl font-semibold">${pendingTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid to date</p>
          <p className="mt-2 font-display text-2xl font-semibold">${paidTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 font-medium">Requested</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Method</th>
              <th className="px-6 py-3 font-medium">Destination</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Paid at</th>
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
                  <td className="px-6 py-4 text-muted-foreground">{p.destination ?? "—"}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {p.paid_at ? format(new Date(p.paid_at), "MMM d, yyyy") : "—"}
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
