import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";

interface VerifySearch {
  email?: string;
}

export const Route = createFileRoute("/verify-email")({
  component: VerifyPage,
  validateSearch: (s: Record<string, unknown>): VerifySearch => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify email — AdProfitly" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Confirm your email address to complete your AdProfitly registration and start managing your ad revenue." },
      { property: "og:url", content: "https://adprofitly.com/verify-email" },
      { property: "og:title", content: "Verify your AdProfitly email" },
      { property: "og:description", content: "Confirm your address to finish setting up your account." },
    ],
    links: [{ rel: "canonical", href: "https://adprofitly.com/verify-email" }],
  }),
});

function VerifyPage() {
  const { email } = useSearch({ from: "/verify-email" });
  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        email
          ? `We sent a confirmation link to ${email}. Click it to finish setup.`
          : "We sent you a confirmation link. Click it to finish setup."
      }
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          The link opens your AdProfitly console. If it doesn't arrive within a minute, check spam.
        </p>
      </div>
    </AuthLayout>
  );
}
