import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Building, Send } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — AdProfitly" },
      {
        name: "description",
        content: "Talk to AdProfitly sales, support, or partnerships. We reply within one business day.",
      },
      { property: "og:title", content: "Contact AdProfitly" },
      {
        property: "og:description",
        content: "Reach sales, support, or partnerships. One business day response.",
      },
    ],
  }),
});

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Message sent — we'll be in touch within one business day.");
    setForm({ name: "", email: "", company: "", message: "" });
    setLoading(false);
  }

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero py-20">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Contact</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Let's <span className="text-gradient-money">talk revenue.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Sales, support, partnerships — one business day response.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-border bg-card p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email"><Mail className="mr-1 inline h-3.5 w-3.5" />Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company"><Building className="mr-1 inline h-3.5 w-3.5" />Company</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message"><MessageSquare className="mr-1 inline h-3.5 w-3.5" />Message</Label>
              <Textarea id="message" rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button type="submit" variant="hero" size="lg" disabled={loading}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
