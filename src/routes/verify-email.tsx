import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api, apiError } from "@/lib/api";

interface VerifySearch {
  email?: string;
  token?: string;
}

export const Route = createFileRoute("/verify-email")({
  component: VerifyPage,
  validateSearch: (s: Record<string, unknown>): VerifySearch => ({
    email: typeof s.email === "string" ? s.email : undefined,
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify email — AdProfitly" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function VerifyPage() {
  const { email, token } = useSearch({ from: "/verify-email" });
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [autoStatus, setAutoStatus] = useState<"idle" | "verifying" | "done" | "failed">("idle");

  // Auto-verify if a token is in the URL (email link click)
  useEffect(() => {
    if (!token) return;
    setAutoStatus("verifying");
    api
      .post("/auth/verify-email", { token })
      .then(() => {
        setAutoStatus("done");
        toast.success("Email verified. You can now sign in.");
        setTimeout(() => navigate({ to: "/login" }), 1200);
      })
      .catch((err) => {
        setAutoStatus("failed");
        toast.error(apiError(err));
      });
  }, [token, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email, code });
      toast.success("Email verified. You can now sign in.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return;
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("Verification email sent.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email
          ? `We sent a 6-digit code to ${email}. Enter it below.`
          : "Enter the 6-digit code we sent to your inbox."
      }
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {autoStatus === "verifying" && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Verifying your email…</p>
        </div>
      )}

      {autoStatus !== "verifying" && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={loading || code.length < 6}
          >
            {loading ? "Verifying…" : "Verify email"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Didn't get it?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={resending || !email}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
