import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Globe, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/sites")({
  component: SitesPage,
  head: () => ({ meta: [{ title: "Sites — AdProfitly" }] }),
});

async function fetchSites() {
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

function SitesPage() {
  const qc = useQueryClient();
  const { data: sites, isLoading } = useQuery({ queryKey: ["sites"], queryFn: fetchSites });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ domain: "", category: "", monthly_visitors: 0 });

  const createSite = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("sites").insert({
        user_id: userData.user.id,
        domain: form.domain,
        category: form.category || null,
        monthly_visitors: form.monthly_visitors || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Site added — pending review.");
      qc.invalidateQueries({ queryKey: ["sites"] });
      setOpen(false);
      setForm({ domain: "", category: "", monthly_visitors: 0 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Site removed.");
      qc.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Sites</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Your sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add and manage the domains that run AdProfitly ad units.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="mr-2 h-4 w-4" />
              Add site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new site</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSite.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  required
                  placeholder="example.com"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Technology, Lifestyle…"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitors">Monthly visitors</Label>
                <Input
                  id="visitors"
                  type="number"
                  min={0}
                  value={form.monthly_visitors}
                  onChange={(e) =>
                    setForm({ ...form, monthly_visitors: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={createSite.isPending}
              >
                {createSite.isPending ? "Adding…" : "Add site"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 font-medium">Domain</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Visitors / mo</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : sites?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Globe className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No sites yet.</p>
                </td>
              </tr>
            ) : (
              sites?.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-4 font-medium">{s.domain}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.category ?? "—"}</td>
                  <td className="px-6 py-4 font-mono">
                    {(s.monthly_visitors ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSite.mutate(s.id)}
                      disabled={deleteSite.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
