import { createFileRoute } from '@tanstack/react-router';
import { PaymentDashboard } from '@/components/dashboard/PaymentDashboard';
import { paymentHead } from '@/lib/payment-types';
export const Route = createFileRoute('/_authenticated/dashboard/payments')({ component: () => <PaymentDashboard />, head: () => paymentHead('Publisher Payments', 'Verified publisher balances, weekly payouts, payment history and earnings verification at AdProfitly.') });
