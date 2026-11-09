export type FinancialRow = { id: string; user_id: string; [key: string]: any };
export type PaymentPolicy = {
  version: number;
  minimum: string;
  verification_days: number;
  weekday: number;
  hour_utc: number;
  effective_at: string;
};
export type PaymentSnapshot = {
  policy: PaymentPolicy;
  next_payout: string;
  accepted: boolean;
  balances: {
    estimated: string;
    verification: string;
    finalized: string;
    available: string;
    paid: string;
    adjustments: string;
    eligible?: boolean;
    account?: any;
  };
  batches: FinancialRow[];
  payments: FinancialRow[];
  adjustments: FinancialRow[];
  appeals: FinancialRow[];
  quality: FinancialRow[];
  events: FinancialRow[];
  notifications: FinancialRow[];
  publishers: FinancialRow[];
};
export function money(value: unknown) {
  const text = String(value ?? "0");
  const [whole, fraction = ""] = text.split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
export function paymentStatus(row: FinancialRow) {
  return String(row.lifecycle_status ?? row.status).replaceAll("_", " ");
}
export function paymentHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — AdProfitly` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — AdProfitly` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
