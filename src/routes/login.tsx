import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — AdProfitly" },
      { name: "description", content: "Sign in to your AdProfitly console." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const status = useAuth((s) => s.status);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [need2FA, setNeed2FA] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/" });
  }, [status, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, need2FA ? code : undefined);
      toast.success("Welcome back.");
      navigate({ to: "/" });
    } catch (err) {
      const msg = (err as Error).message.toLowerCase();
      if (msg.includes("2fa") || msg.includes("two-factor") || msg.includes("code")) {
        setNeed2FA(true);
        toast.info("Enter your 2FA code to continue.");
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AdProfitly console."
      footer={
        <>
          New to AdProfitly?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {need2FA && (
          <div className="space-y-2">
            <Label>Two-factor code</Label>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        )}

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={loading || (need2FA && code.length < 6)}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
