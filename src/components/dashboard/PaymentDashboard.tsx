import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Wallet, Settings2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { getPaymentSnapshot, paymentOperation } from "@/lib/payments.functions";
import { money, paymentStatus, type FinancialRow, type PaymentSnapshot } from "@/lib/payment-types";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PayoutMembership } from "@/components/dashboard/PayoutMembership";

function download(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
function csv(rows: FinancialRow[]) {
  const fields = [
    "id",
    "earnings_period_start",
    "earnings_period_end",
    "amount",
    "method",
    "requested_at",
    "paid_at",
    "status",
    "lifecycle_status",
    "tx_hash",
    "hold_reason",
  ];
  const cell = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [fields.join(","), ...rows.map((r) => fields.map((k) => cell(r[k])).join(","))].join("\n");
}
const date = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : "—");
const methods = ["paypal", "wire", "crypto_btc", "crypto_usdt", "payoneer"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Action = {
  operation: string;
  title: string;
  payload: Record<string, unknown>;
  fields?: string[];
  confirm?: boolean;
};
export function PaymentDashboard({ admin = false }: { admin?: boolean }) {
  const user = useAuth((s) => s.user?.id);
  const profile = useAuth((s) => s.profile);
  const fetch = useServerFn(getPaymentSnapshot);
  const operate = useServerFn(paymentOperation);
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["finance", admin, user],
    queryFn: () => fetch({ data: { admin } }),
    refetchInterval: 60000,
  });
  const [filter, setFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [period, setPeriod] = useState("");
  const [publisher, setPublisher] = useState("all");
  const [action, setAction] = useState<Action | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  function open(a: Action) {
    setAction({ ...a, payload: { ...a.payload, key: a.payload.key ?? crypto.randomUUID() } });
    setValues({
      reason: "",
      ...Object.fromEntries(
        Object.entries(a.payload)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    });
    setConfirmed(false);
  }
  const mutate = useMutation({
    mutationFn: () => {
      if (!action) throw new Error("Select an action");
      return operate({
        data: {
          operation: action.operation,
          payload: {
            ...action.payload,
            ...values,
            confirmed,
            key: action.payload.key ?? crypto.randomUUID(),
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Payment records updated");
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["payment-policy"] });
      setAction(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (isLoading) return <p className="text-muted-foreground">Loading payments…</p>;
  if (error || !data)
    return (
      <div className="space-y-3">
        <p className="text-destructive">{error?.message ?? "Payments unavailable"}</p>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["finance"] })}>
          Try again
        </Button>
      </div>
    );
  const belongs = (r: FinancialRow) => publisher === "all" || r.user_id === publisher;
  const rows = data.payments.filter(
    (r) =>
      belongs(r) &&
      (filter === "all" || paymentStatus(r) === filter) &&
      (!from || String(r.requested_at).slice(0, 10) >= from) &&
      (!to || String(r.requested_at).slice(0, 10) <= to) &&
      (!period ||
        `${r.earnings_period_start ?? ""} ${r.earnings_period_end ?? ""}`.includes(period)),
  );
  const batches = data.batches.filter(belongs);
  const pending = data.payments.filter((p) =>
    ["pending", "approved", "processing"].includes(p.status),
  ).length;
  const failed = data.payments.filter((p) => p.status === "failed" && !p.reconciled_at).length;
  const review = new Set(
    data.batches.filter((b) => b.investigation_open || b.reconciliation_open).map((b) => b.user_id),
  ).size;
  const cards = [
    ["Estimated Earnings", data.balances.estimated],
    ["Under Verification", data.balances.verification],
    ["Finalized Balance", data.balances.finalized],
    ["Available for Payment", data.balances.available],
    ["Total Paid", data.balances.paid],
  ];
  const pubName = (id: string) =>
    data.publishers.find((p) => p.id === id)?.publisher_id ?? id.slice(0, 8);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase text-primary">Payments</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {admin ? "Payment Management" : "Payouts"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Weekly · Minimum {money(data.policy.minimum)} · {data.policy.verification_days}-day
            verification
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download("adprofitly-payments.csv", csv(rows))}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {admin ? (
            <Button
              variant="outline"
              onClick={() =>
                open({
                  operation: "configure_policy",
                  title: "Weekly payment policy",
                  payload: data.policy as unknown as Record<string, unknown>,
                  fields: ["minimum", "verification_days", "weekday", "hour_utc"],
                })
              }
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Policy settings
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                open({
                  operation: "save_account",
                  title: "Payment account",
                  payload: {
                    method: data.balances.account?.method ?? profile?.payment_method ?? "paypal",
                    destination: data.balances.account?.destination ?? profile?.payment_email ?? "",
                  },
                  fields: ["method", "destination"],
                })
              }
            >
              <Wallet className="mr-2 h-4 w-4" />
              Payment account
            </Button>
          )}
          <Button
            variant="hero"
            disabled={!admin && !data.balances.eligible}
            onClick={() =>
              open({
                operation: admin ? "admin_request_payout" : "request_payout",
                title: "Request weekly payout",
                payload: { amount: admin ? "" : data.balances.available, key: crypto.randomUUID() },
                fields: admin ? ["user_id", "amount"] : ["amount"],
              })
            }
          >
            Request payment
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label} className="border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">
              {admin ? label.replace("Balance", "Liabilities") : label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-primary">{money(value)}</p>
          </Card>
        ))}
        <Card className="border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Next Payout</p>
          <p className="mt-2 font-display text-2xl font-semibold">{date(data.next_payout)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {days[data.policy.weekday]} · {String(data.policy.hour_utc).padStart(2, "0")}:00 UTC ·{" "}
            {admin
              ? "Verified payouts only"
              : data.balances.eligible
                ? "Eligible"
                : "Not yet eligible"}
          </p>
        </Card>
      </div>
      {!admin && <PayoutMembership />}
      {admin ? (
        <div className="flex flex-wrap gap-6 border-y border-border py-4 text-sm">
          <span>
            Pending payments: <strong>{pending}</strong>
          </span>
          <span>
            Failed transactions: <strong>{failed}</strong>
          </span>
          <span>
            Publishers under review: <strong>{review}</strong>
          </span>
          <span>
            Invalid adjustments: <strong>{money(data.balances.adjustments)}</strong>
          </span>
        </div>
      ) : (
        <div className="border-l-2 border-primary bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {data.balances.eligible
            ? "Your verified balance is eligible for a weekly payout."
            : "Below-threshold balances carry forward. Verified account details and completed quality review are required."}
          <p className="mt-1">
            Legacy payments stay in history; historical estimates are not newly verified funds.
          </p>
        </div>
      )}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Payment history</h2>
        <div className="flex flex-wrap gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {[
                "payment eligible",
                "pending",
                "approved",
                "processing",
                "paid",
                "on hold",
                "failed",
                "failed reconciled",
                "rejected",
              ].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
          <Input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
          <Input
            aria-label="Earnings period"
            placeholder="Earnings period (YYYY-MM)"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-56"
          />
          {admin && (
            <Select value={publisher} onValueChange={setPublisher}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All publishers</SelectItem>
                {data.publishers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.publisher_id ?? p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "Transaction / Period",
                  ...(admin ? ["Publisher"] : []),
                  "Amount",
                  "Method",
                  "Date",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={admin ? 8 : 7} className="p-8 text-center text-muted-foreground">
                    No payments in this range.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{r.reference_id ?? r.id.slice(0, 8)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.earnings_period_start
                        ? `${date(r.earnings_period_start)} – ${date(r.earnings_period_end)}`
                        : "Legacy payment"}
                    </p>
                    <p className="mt-1 max-w-56 text-xs text-muted-foreground">{r.hold_reason}</p>
                  </td>
                  {admin && <td className="px-4 py-3 text-xs">{pubName(r.user_id)}</td>}
                  <td className="px-4 py-3 font-mono">{money(r.amount)}</td>
                  <td className="px-4 py-3 uppercase">{r.method.replaceAll("_", " ")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {date(r.paid_at ?? r.requested_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        r.status === "failed"
                          ? "destructive"
                          : r.status === "paid"
                            ? "default"
                            : "outline"
                      }
                      className="whitespace-nowrap capitalize"
                    >
                      {paymentStatus(r)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      >
                        Details
                      </Button>
                      {r.status === "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            download(
                              `receipt-${r.reference_id ?? r.id}.txt`,
                              `AdProfitly Payment Receipt\nTransaction: ${r.reference_id ?? r.id}\nAmount: ${money(r.amount)} USD\nMethod: ${r.method}\nPayment date: ${date(r.paid_at)}\nReference: ${r.tx_hash ?? "Legacy record — confirmation evidence unavailable"}\nStatus: Paid\n`,
                              "text/plain",
                            )
                          }
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Receipt
                        </Button>
                      )}
                      {admin && r.status !== "paid" && (
                        <Select
                          value=""
                          onValueChange={(v) =>
                            open({
                              operation: v,
                              title: v.replaceAll("_", " "),
                              payload: { payment_id: r.id },
                              fields: v === "payment_paid" ? ["reference"] : [],
                              confirm: v === "payment_paid",
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Manage" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "payment_approve",
                              "payment_hold",
                              "payment_unhold",
                              "payment_release",
                              "payment_paid",
                              "payment_failed",
                              "payment_reconcile",
                              "payment_reject",
                            ].map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.replace("payment_", "").replaceAll("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expanded && (
          <Card className="space-y-3 p-5">
            <h3 className="font-semibold">Transaction events</h3>
            {data.events.filter((e) => e.payment_id === expanded).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Legacy record: no verified event history is available.
              </p>
            ) : (
              data.events
                .filter((e) => e.payment_id === expanded)
                .map((e) => (
                  <div key={e.id} className="flex gap-3 text-sm">
                    <Clock className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="capitalize">
                        {e.kind.replaceAll("_", " ")} · {date(e.created_at)}
                      </p>
                      <p className="text-muted-foreground">{e.reason}</p>
                    </div>
                  </div>
                ))
            )}
          </Card>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Earnings &amp; verification</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "Batch / Period",
                  "Gross estimate",
                  "Invalid adjustment",
                  "Finalized / Net",
                  "Verification ends",
                  "Status",
                  ...(admin ? ["Actions"] : []),
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!batches.length && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No earnings batches under the current policy.
                  </td>
                </tr>
              )}
              {batches.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">
                      {b.id.slice(0, 8)} · {admin && pubName(b.user_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date(b.period_start)} – {date(b.period_end)} · {b.source}
                    </p>
                  </td>
                  <td className="px-4 py-3">{money(b.gross)}</td>
                  <td className="px-4 py-3 text-destructive">−{money(b.adjustment)}</td>
                  <td className="px-4 py-3">{money(b.net)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{date(b.verification_ends_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="whitespace-nowrap capitalize">
                      {b.status === "finalized" &&
                      Number(data.balances.finalized) < Number(data.policy.minimum)
                        ? "Carried forward"
                        : b.status.replaceAll("_", " ")}
                    </Badge>
                    {b.approved && b.status !== "finalized" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Approved · hold still applies
                      </p>
                    )}
                  </td>
                  {admin && (
                    <td className="px-4 py-3">
                      <Select
                        value=""
                        onValueChange={(v) =>
                          open({
                            operation: v,
                            title: v.replaceAll("_", " "),
                            payload: { batch_id: b.id },
                            fields:
                              v === "adjustment"
                                ? ["amount", "evidence", "evidence_key"]
                                : v === "quality_review"
                                  ? [
                                      "impressions",
                                      "validated_impressions",
                                      "invalid_impressions",
                                      "status",
                                      "evidence",
                                    ]
                                  : [],
                          })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Review batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {["quality_review", "batch_approve", "batch_hold", "batch_reconcile", "adjustment"].map(
                            (v) => (
                              <SelectItem key={v} value={v}>
                                {v.replaceAll("_", " ")}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {admin && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Account verification &amp; appeals</h2>
          <Select
            value=""
            onValueChange={(v) =>
              open({
                operation: "account_review",
                title: "Review payment account",
                payload: { user_id: v },
                fields: ["verified", "on_hold"],
              })
            }
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select publisher account" />
            </SelectTrigger>
            <SelectContent>
              {data.publishers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.publisher_id ?? p.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.appeals
            .filter((a) => a.status === "pending")
            .map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm">
                    {pubName(a.user_id)} · {a.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">Adjustment {a.adjustment_id}</p>
                </div>
                <div className="flex gap-2">
                  {["approved", "rejected"].map((outcome) => (
                    <Button
                      key={outcome}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        open({
                          operation: "appeal_resolve",
                          title: `${outcome} appeal`,
                          payload: { appeal_id: a.id, outcome },
                        })
                      }
                    >
                      {outcome === "approved" ? "Approve" : "Reject"}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
        </section>
      )}
      {!admin && data.notifications.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Payment notifications</h2>
          {data.notifications.slice(0, 5).map((n) => (
            <div key={n.id} className="border-b border-border pb-3">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">
                {n.body} · {date(n.created_at)}
              </p>
            </div>
          ))}
        </section>
      )}
      <Dialog open={Boolean(action)} onOpenChange={(v) => !v && setAction(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{action?.title}</DialogTitle>
          </DialogHeader>
          {action?.fields?.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`finance-${field}`} className="capitalize">
                {field.replaceAll("_", " ")}
              </Label>
              {["method", "user_id", "status", "weekday", "verified", "on_hold"].includes(field) ? (
                <Select
                  value={values[field] ?? ""}
                  onValueChange={(v) => setValues((s) => ({ ...s, [field]: v }))}
                >
                  <SelectTrigger id={`finance-${field}`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field === "method"
                      ? methods.map((v) => [v, v])
                      : field === "user_id"
                        ? data.publishers.map((p) => [p.id, p.publisher_id ?? p.email])
                        : field === "status"
                          ? [
                              "Clean",
                              "Monitoring",
                              "Under Review",
                              "Adjustment Applied",
                              "Restricted",
                            ].map((v) => [v, v])
                          : field === "weekday"
                            ? days.map((v, i) => [String(i), v])
                            : [
                                ["true", "Yes"],
                                ["false", "No"],
                              ]
                    ).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`finance-${field}`}
                  value={values[field] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [field]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {action?.operation !== "save_account" && (
            <div className="space-y-2">
              <Label htmlFor="finance-reason">Reason / supporting details</Label>
              <Textarea
                id="finance-reason"
                value={values.reason ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, reason: e.target.value }))}
              />
            </div>
          )}
          {action?.confirm && (
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                aria-label="Confirm actual payment"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
              />
              <span>I verified the actual transfer using the transaction reference above.</span>
            </label>
          )}
          <Button
            variant="hero"
            onClick={() => mutate.mutate()}
            disabled={mutate.isPending || (action?.confirm && !confirmed)}
          >
            {mutate.isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
