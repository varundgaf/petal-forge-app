import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Shield, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type PaymentMethod } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — AdProfitly" }] }),
});

const METHODS: PaymentMethod[] = ["paypal", "wire", "crypto_btc", "crypto_usdt", "payoneer"];

type FormShape = {
  name: string;
  company: string;
  website: string;
  country: string;
  timezone: string;
  telegram: string;
  discord: string;
  payment_method: PaymentMethod | "";
  payment_email: string;
  avatar_url: string;
};

const EMPTY: FormShape = {
  name: "",
  company: "",
  website: "",
  country: "",
  timezone: "",
  telegram: "",
  discord: "",
  payment_method: "",
  payment_email: "",
  avatar_url: "",
};

function SettingsPage() {
  const profile = useAuth((s) => s.profile);
  const refresh = useAuth((s) => s.refresh);
  const [form, setForm] = useState<FormShape>(EMPTY);
  const [savingProfile, setSavingProfile] = useState(false);

  const [enrollment, setEnrollment] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [otp, setOtp] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      company: profile.company ?? "",
      website: profile.website ?? "",
      country: profile.country ?? "",
      timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
      telegram: profile.telegram ?? "",
      discord: profile.discord ?? "",
      payment_method: profile.payment_method ?? "",
      payment_email: profile.payment_email ?? "",
      avatar_url: profile.avatar_url ?? "",
    });
  }, [profile]);

  function update<K extends keyof FormShape>(key: K, value: FormShape[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) {
      toast.error("Profile still loading. Please try again in a moment.");
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name || null,
          company: form.company || null,
          website: form.website || null,
          country: form.country || null,
          timezone: form.timezone || null,
          telegram: form.telegram || null,
          discord: form.discord || null,
          payment_method: form.payment_method || null,
          payment_email: form.payment_email || null,
          avatar_url: form.avatar_url || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
      await refresh();
      toast.success("Profile saved.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  function resetForm() {
    if (!profile) return setForm(EMPTY);
    setForm({
      name: profile.name ?? "",
      company: profile.company ?? "",
      website: profile.website ?? "",
      country: profile.country ?? "",
      timezone: profile.timezone ?? "",
      telegram: profile.telegram ?? "",
      discord: profile.discord ?? "",
      payment_method: profile.payment_method ?? "",
      payment_email: profile.payment_email ?? "",
      avatar_url: profile.avatar_url ?? "",
    });
  }

  async function startEnroll() {
    setMfaBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setMfaBusy(false);
    }
  }

  async function verifyEnroll() {
    if (!enrollment || !profile?.id) return;
    setMfaBusy(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      });
      if (chErr) throw chErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.id,
        code: otp,
      });
      if (error) throw error;
      await supabase.from("profiles").update({ two_factor_enabled: true }).eq("id", profile.id);
      await refresh();
      setEnrollment(null);
      setOtp("");
      toast.success("Two-factor authentication enabled.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setMfaBusy(false);
    }
  }

  async function disableMfa() {
    if (!profile?.id) return;
    setMfaBusy(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!totp) throw new Error("No 2FA factor found");
      const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id });
      if (error) throw error;
      await supabase.from("profiles").update({ two_factor_enabled: false }).eq("id", profile.id);
      await refresh();
      toast.success("Two-factor disabled.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setMfaBusy(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Settings</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Account & security
          </h1>
        </div>
        {profile.publisher_id && (
          <Badge variant="secondary" className="font-mono">
            {profile.publisher_id}
          </Badge>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Publisher profile</h2>
        </div>
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://example.com"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={form.timezone} onChange={(e) => update("timezone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram username</Label>
            <Input
              id="telegram"
              placeholder="@handle"
              value={form.telegram}
              onChange={(e) => update("telegram", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discord">Skype / Discord</Label>
            <Input
              id="discord"
              placeholder="optional"
              value={form.discord}
              onChange={(e) => update("discord", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={form.payment_method || undefined}
              onValueChange={(v) => update("payment_method", v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pemail">Payment email / address</Label>
            <Input
              id="pemail"
              placeholder="payouts@example.com or wallet"
              value={form.payment_email}
              onChange={(e) => update("payment_email", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="avatar">Profile photo URL</Label>
            <Input
              id="avatar"
              placeholder="https://…"
              value={form.avatar_url}
              onChange={(e) => update("avatar_url", e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="hero" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={savingProfile}>
              Cancel
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Two-factor authentication</h2>
          </div>
          {profile.two_factor_enabled ? (
            <Badge className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          )}
        </div>

        {profile.two_factor_enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You'll be asked for a code from your authenticator app whenever you sign in.
            </p>
            <Button variant="outline" onClick={disableMfa} disabled={mfaBusy}>
              {mfaBusy ? "…" : "Disable 2FA"}
            </Button>
          </div>
        ) : enrollment ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with Google Authenticator, 1Password, or Authy — then enter the
              6-digit code to confirm.
            </p>
            <div className="flex items-start gap-6">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={enrollment.qr} size={160} />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="text-xs">Or enter secret manually</Label>
                  <code className="mt-1 block break-all rounded bg-muted p-2 font-mono text-xs">
                    {enrollment.secret}
                  </code>
                </div>
                <div>
                  <Label>Verification code</Label>
                  <div className="mt-2">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="hero" onClick={verifyEnroll} disabled={mfaBusy || otp.length < 6}>
                    {mfaBusy ? "Verifying…" : "Enable 2FA"}
                  </Button>
                  <Button variant="ghost" onClick={() => setEnrollment(null)} disabled={mfaBusy}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add a second layer to your account using an authenticator app.
            </p>
            <Button variant="hero" onClick={startEnroll} disabled={mfaBusy}>
              {mfaBusy ? "…" : "Set up 2FA"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
