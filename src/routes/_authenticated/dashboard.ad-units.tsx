import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Copy, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/ad-units")({
  component: AdUnitsPage,
  head: () => ({ meta: [{ title: "Ad units — AdProfitly" }] }),
});

const FORMATS = ["banner", "native", "popunder", "social_bar", "interstitial", "video"] as const;

async function fetchData() {
  const [units, sites] = await Promise.all([
    supabase
      .from("ad_units")
      .select("*, sites(domain)")
      .order("created_at", { ascending: false }),
    supabase.from("sites").select("id, domain").order("domain"),
  ]);
  if (units.error) throw units.error;
  if (sites.error) throw sites.error;
  return { units: units.data, sites: sites.data };
}

function AdUnitsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ad-units"], queryFn: fetchData });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    site_id: "",
    name: "",
    format: "banner" as (typeof FORMATS)[number],
    size: "728x90",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("ad_units").insert({
        user_id: userData.user.id,
        site_id: form.site_id,
        name: form.name,
        format: form.format,
        size: form.size || null,
        adsterra_zone_id: `zone_${Math.random().toString(36).slice(2, 10)}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ad unit created.");
      qc.invalidateQueries({ queryKey: ["ad-units"] });
      setOpen(false);
      setForm({ site_id: "", name: "", format: "banner", size: "728x90" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Ad units</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Ad units</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placements attached to your sites. Copy the zone ID into your site code.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={!data?.sites.length}>
              <Plus className="mr-2 h-4 w-4" />
              New ad unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New ad unit</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Site</Label>
                <Select
                  value={form.site_id}
                  onValueChange={(v) => setForm({ ...form, site_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  placeholder="Header Banner"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={form.format}
                  onValueChange={(v) => setForm({ ...form, format: v as (typeof FORMATS)[number] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  placeholder="728x90"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={create.isPending || !form.site_id}
              >
                {create.isPending ? "Creating…" : "Create ad unit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Site</th>
              <th className="px-6 py-3 font-medium">Format</th>
              <th className="px-6 py-3 font-medium">Size</th>
              <th className="px-6 py-3 font-medium">Zone ID</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : data?.units.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No ad units yet.</p>
                </td>
              </tr>
            ) : (
              data?.units.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {(u.sites as { domain: string } | null)?.domain ?? "—"}
                  </td>
                  <td className="px-6 py-4 capitalize">{u.format.replace("_", " ")}</td>
                  <td className="px-6 py-4 font-mono text-xs">{u.size ?? "—"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        if (u.adsterra_zone_id) {
                          navigator.clipboard.writeText(u.adsterra_zone_id);
                          toast.success("Zone ID copied.");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 font-mono text-xs hover:bg-accent"
                    >
                      {u.adsterra_zone_id ?? "—"}
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.is_active ? "default" : "secondary"}>
                      {u.is_active ? "Active" : "Paused"}
                    </Badge>
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
