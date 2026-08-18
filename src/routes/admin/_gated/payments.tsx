import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search, Plus, Trash2 } from "lucide-react";
import {
  listPayments,
  updatePayment,
  createPayment,
  deletePayment,
  listPublisherOptions,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/_gated/payments")({
  component: PaymentsPage,
});

const METHODS = ["paypal", "wire", "crypto_btc", "crypto_usdt", "payoneer"] as const;
const STATUSES = ["pending", "approved", "processing", "paid", "rejected", "failed"] as const;

function PaymentsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPayments);
  const updFn = useServerFn(updatePayment);
  const createFn = useServerFn(createPayment);
  const delFn = useServerFn(deletePayment);
  const pubsFn = useServerFn(listPublisherOptions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [tx, setTx] = useState("");
  const [notes, setNotes] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    amount: "",
    method: "wire" as (typeof METHODS)[number],
    status: "pending" as (typeof STATUSES)[number],
    destination: "",
    reference_id: "",
    tx_hash: "",
    notes: "",
    requested_at: new Date().toISOString().slice(0, 10),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", search, status],
    queryFn: () => listFn({ data: { search, status: status === "all" ? undefined : status } }),
  });

  const { data: publishers } = useQuery({
    queryKey: ["admin", "publisher-options"],
    queryFn: () => pubsFn(),
  });

  const rows: any[] = (data as any[]) ?? [];
  const sum = (f: (p: any) => boolean) =>
    rows.filter(f).reduce((s, p) => s + Number(p.amount), 0);
  const paidTotal = sum((p) => p.status === "paid");
  const pendingTotal = sum((p) => ["pending", "approved", "processing"].includes(p.status));

  const change = useMutation({
    mutationFn: (v: any) => updFn({ data: v }),
    onSuccess: () => {
      toast.success("Payment updated");
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const add = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          user_id: form.user_id,
          amount: Number(form.amount),
          method: form.method,
          status: form.status,
          destination: form.destination,
          reference_id: form.reference_id,
          tx_hash: form.tx_hash,
          notes: form.notes,
          requested_at: form.requested_at,
        },
      }),
    onSuccess: () => {
      toast.success("Payment added");
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
      setAddOpen(false);
      setForm({ ...form, amount: "", destination: "", reference_id: "", tx_hash: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (paymentId: string) => delFn({ data: { paymentId } }),
    onSuccess: () => {
      toast.success("Payment deleted");
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(p: any) {
    setEditing(p);
    setTx(p.tx_hash ?? "");
    setNotes(p.notes ?? "");
  }

  function saveEdit(newStatus?: string) {
    if (!editing) return;
    change.mutate(
      { paymentId: editing.id, tx_hash: tx, notes, status: newStatus },
      { onSuccess: () => setEditing(null) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">{rows.length} payouts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Reference / destination"
              className="w-64 pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="hero" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending / processing</p>
          <p className="mt-1 font-display text-2xl font-semibold">${pendingTotal.toFixed(2)}</p>
        </Card>
        <Card className="border-border/60 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifetime paid</p>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">${paidTotal.toFixed(2)}</p>
        </Card>
        <Card className="border-border/60 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Records</p>
          <p className="mt-1 font-display text-2xl font-semibold">{rows.length}</p>
        </Card>
      </div>


      <Card className="overflow-hidden border-border/60 bg-card/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Publisher</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((p: any) => (

                  <tr key={p.id} className="border-b border-border/40 hover:bg-accent/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.reference_id ?? p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.profiles?.name ?? p.profiles?.email}
                    </td>
                    <td className="px-4 py-3 font-medium">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{p.method}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">
                      {p.destination ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-xs capitalize">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(p.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            change.mutate({ paymentId: p.id, status: "approved" })
                          }
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            change.mutate({ paymentId: p.id, status: "rejected" })
                          }
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment {editing?.reference_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs">Transaction ID / hash</Label>
              <Input value={tx} onChange={(e) => setTx(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Internal notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => saveEdit()} disabled={change.isPending}>
              Save
            </Button>
            <Button variant="hero" onClick={() => saveEdit("paid")} disabled={change.isPending}>
              Mark as paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
