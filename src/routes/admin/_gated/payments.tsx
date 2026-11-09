import { createFileRoute } from "@tanstack/react-router";
import { PaymentDashboard } from "@/components/dashboard/PaymentDashboard";
import { paymentHead } from "@/lib/payment-types";
export const Route = createFileRoute("/admin/_gated/payments")({
  component: () => <PaymentDashboard admin />,
  head: () =>
    paymentHead(
      "Admin Payment Management",
      "Review publisher verification, evidenced adjustments, appeals and confirmed weekly payouts at AdProfitly.",
    ),
});
