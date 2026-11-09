import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { getPaymentSnapshot, paymentOperation } from "@/lib/payments.functions";
import { money, type PaymentPolicy as Policy } from "@/lib/payment-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function PolicyContent({ policy }: { policy: Policy }) {
  const items = [
    [
      "Weekly payments",
      `AdProfitly follows a weekly payout schedule. The minimum payment threshold is ${money(policy.minimum)} USD.`,
    ],
    [
      "Traffic quality",
      "All publisher traffic undergoes quality checks. Verified invalid traffic revenue is excluded before earnings are finalized.",
    ],
    [
      `${policy.verification_days}-day verification`,
      `All earnings batches undergo a ${policy.verification_days}-day verification period to verify traffic quality and advertiser compliance.`,
    ],
    [
      "Payment release",
      "Payments are released only after successful verification, account eligibility checks and payment reconciliation. Additional investigations may delay payment.",
    ],
    [
      "Payment transparency",
      "Publishers can view estimated earnings, adjustments, verification holds, finalized balances and payment history in their dashboard.",
    ],
    [
      "Policy compliance",
      "All publishers must comply with AdProfitly’s Publisher Terms, advertiser requirements and applicable advertising policies.",
    ],
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map(([title, text], index) => (
        <section key={title}>
          <h2 className="text-sm font-semibold uppercase text-primary">
            {index + 1}. {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </section>
      ))}
    </div>
  );
}

export function PaymentPolicyAnnouncement() {
  const role = useAuth((s) => s.role);
  const userId = useAuth((s) => s.user?.id);
  const queryClient = useQueryClient();
  const fetch = useServerFn(getPaymentSnapshot);
  const operate = useServerFn(paymentOperation);
  const [agreed, setAgreed] = useState(false);
  const { data } = useQuery({
    queryKey: ["payment-policy", userId],
    queryFn: () => fetch({ data: {} }),
    enabled: role === "publisher" && Boolean(userId),
  });
  const accept = useMutation({
    mutationFn: () =>
      operate({
        data: {
          operation: "accept_policy",
          payload: { version: data?.policy.version, accepted: agreed },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-policy"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (!data || role !== "publisher" || data.accepted) return null;
  return (
    <Dialog open>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="[&>button:last-child]:hidden max-h-[96dvh] w-[96vw] max-w-4xl overflow-y-auto p-5 sm:p-8"
      >
        <DialogHeader>
          <ShieldCheck className="mb-2 h-8 w-8 text-primary" />
          <DialogTitle className="text-xl leading-snug sm:text-2xl">
            IMPORTANT: UPDATED PAYMENT &amp; TRAFFIC QUALITY POLICY
          </DialogTitle>
          <p className="pt-2 text-xs text-muted-foreground">
            Version {data.policy.version} · Effective{" "}
            {new Date(data.policy.effective_at).toLocaleDateString()}
          </p>
        </DialogHeader>
        <PolicyContent policy={data.policy} />
        <Link to="/payment-policy" target="_blank" className="text-sm text-primary underline">
          Complete payment &amp; traffic quality policy
        </Link>
        <label className="flex items-start gap-3 border-t border-border pt-5 text-sm">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            aria-label="Agree to payment policy"
          />
          <span>I have read and agree to the Publisher Payment &amp; Traffic Quality Policy.</span>
        </label>
        <Button
          variant="hero"
          disabled={!agreed || accept.isPending}
          onClick={() => accept.mutate()}
        >
          {accept.isPending ? "Saving…" : "Accept & Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
