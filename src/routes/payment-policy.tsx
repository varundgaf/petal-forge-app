import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PolicyContent } from '@/components/dashboard/PaymentPolicy';
import { paymentHead, type PaymentPolicy } from '@/lib/payment-types';

const policyOptions = { queryKey: ['public-payment-policy'], queryFn: async () => {
  const { data, error } = await supabase.from('publisher_payment_policy').select('*').single();
  if (error) throw new Error(error.message);
  return data as unknown as PaymentPolicy;
} };
export const Route = createFileRoute('/payment-policy')({ component: PolicyPage, head: () => paymentHead('Publisher Payment & Traffic Quality Policy', 'Weekly publisher payments, earnings verification, traffic adjustments, appeals and payment transparency at AdProfitly.') });
function PolicyPage() {
  const { data, error } = useQuery(policyOptions);
  return <PublicLayout><article className="mx-auto max-w-4xl px-5 py-16"><h1 className="font-display text-3xl font-semibold">Publisher Payment &amp; Traffic Quality Policy</h1>{error && <p className="mt-6 text-destructive">Unable to load the current policy. Please try again.</p>}{data && <><p className="mb-10 mt-3 text-sm text-muted-foreground">Version {data.version} · Effective {new Date(data.effective_at).toLocaleDateString()}</p><PolicyContent policy={data}/><section className="mt-10 space-y-4 border-t border-border pt-6 text-sm text-muted-foreground"><h2 className="text-lg font-semibold text-foreground">Adjustments, appeals &amp; reconciliation</h2><p>Only documented revenue attributable to verified invalid traffic is excluded. Traffic risk percentages alone do not determine deductions. Every adjustment retains its evidence reference and history, and publishers may submit an appeal from Traffic Quality.</p><p>Balances below the minimum carry forward. Failed payments remain reserved until reconciliation confirms the funds were returned. Account verification, open investigations and payment holds may delay eligibility even after verification ends.</p><p>Payments are recorded as processing until finance confirms the actual transfer with a transaction reference. Historical reports and legacy payments remain visible; they are not automatically converted into newly verified payable balances.</p></section></>}</article></PublicLayout>;
}