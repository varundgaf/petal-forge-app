import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { listPayments, updatePayment } from "@/lib/admin.functions";
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

function PaymentsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPayments);
  const updFn = useServerFn(updatePayment);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [tx, setTx] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", search, status],
    queryFn: () => listFn({ data: { search, status: status === "all" ? undefined : status } }),
  });

  const change = useMutation({
    mutationFn: (v: any) => updFn({ data: v }),
    onSuccess: () => {
      toast.success("Payment updated");
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
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} payouts</p>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              ) : data?.length ? (
                data.map((p: any) => (
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
