import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, type UserRole } from "@/lib/auth-store";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Create account — AdProfitly" },
      {
        name: "description",
        content: "Create your AdProfitly account. Free 14-day trial. No credit card.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    role: "publisher" as UserRole,
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      if (res.requiresVerification) {
        toast.success("Check your email to verify your account.");
        navigate({ to: "/verify-email", search: { email: form.email } });
      } else {
        toast.success("Account created. Please sign in.");
        navigate({ to: "/login" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="14-day free trial. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>I am a…</Label>
          <RadioGroup
            value={form.role}
            onValueChange={(v) => setForm({ ...form, role: v as UserRole })}
            className="grid grid-cols-2 gap-2"
          >
            {(["publisher", "advertiser"] as const).map((r) => (
              <label
                key={r}
                htmlFor={r}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm capitalize transition-colors ${
                  form.role === r
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-input bg-background hover:bg-accent/50"
                }`}
              >
                <RadioGroupItem value={r} id={r} className="sr-only" />
                {r}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
