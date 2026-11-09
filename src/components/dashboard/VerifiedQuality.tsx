import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPaymentSnapshot, paymentOperation } from "@/lib/payments.functions";
import { money } from "@/lib/payment-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export function VerifiedQuality() {
  const fetch = useServerFn(getPaymentSnapshot);
  const operate = useServerFn(paymentOperation);
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["finance-quality"],
    queryFn: () => fetch({ data: {} }),
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const appeal = useMutation({
    mutationFn: () =>
      operate({ data: { operation: "appeal", payload: { adjustment_id: selected, reason } } }),
    onSuccess: () => {
      toast.success("Appeal submitted");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["finance-quality"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (error)
    return <p className="text-destructive">Verified quality history could not be loaded.</p>;
  if (!data) return null;
  const latest = new Map<string, (typeof data.quality)[number]>();
  for (const r of data.quality) if (!latest.has(r.batch_id)) latest.set(r.batch_id, r);
  const reports = [...latest.values()];
  const total = reports.reduce((s, r) => s + Number(r.impressions), 0);
  const valid = reports.reduce((s, r) => s + Number(r.validated_impressions), 0);
  const invalid = reports.reduce((s, r) => s + Number(r.invalid_impressions), 0);
  return (
    <section className="space-y-4 border-y border-border py-6">
      <h2 className="font-display text-xl font-semibold">
        Verified traffic &amp; earnings adjustments
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Reviewed impressions", total.toLocaleString()],
          ["Validated impressions", valid.toLocaleString()],
          ["Invalid impressions", invalid.toLocaleString()],
          ["Verified invalid traffic", `${total ? ((invalid / total) * 100).toFixed(2) : "0.00"}%`],
          ["Revenue excluded", money(data.balances.adjustments)],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Unreviewed traffic is not counted as validated. Risk signals do not automatically determine
        revenue deductions.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-3">Verification history</th>
              <th>Quality status</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {!data.quality.length && (
              <tr>
                <td colSpan={3} className="py-4 text-muted-foreground">
                  No completed traffic validation reports.
                </td>
              </tr>
            )}
            {data.quality.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-3">
                  {new Date(r.created_at).toLocaleDateString()} · {r.batch_id.slice(0, 8)}
                </td>
                <td>
                  <Badge variant="outline">{r.status}</Badge>
                </td>
                <td className="max-w-64 p-2 text-xs text-muted-foreground">{r.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="font-semibold">Adjustment &amp; appeal history</h3>
      {!data.adjustments.length && (
        <p className="text-sm text-muted-foreground">No verified revenue adjustments.</p>
      )}
      {data.adjustments.map((a) => {
        const existing = data.appeals.find((x) => x.adjustment_id === a.id);
        return (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
          >
            <div>
              <p className="text-sm">
                {a.reversed_at ? "Reversed" : `−${money(a.amount)}`} · {a.reason}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.evidence_key} · {a.evidence}
              </p>
              {existing && (
                <p className="mt-1 text-xs capitalize text-primary">
                  Appeal {existing.status} · {existing.resolution ?? "Review pending"}
                </p>
              )}
            </div>
            {!existing && !a.reversed_at && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(a.id);
                  setReason("");
                }}
              >
                Appeal adjustment
              </Button>
            )}
          </div>
        );
      })}
      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal revenue adjustment</DialogTitle>
          </DialogHeader>
          <Textarea
            aria-label="Appeal reason"
            placeholder="Reason and supporting evidence"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button disabled={!reason.trim() || appeal.isPending} onClick={() => appeal.mutate()}>
            Submit appeal
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
