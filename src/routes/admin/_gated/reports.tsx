import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Upload, Trash2, Save } from "lucide-react";
import { listRevenue, upsertRevenue, deleteRevenue, bulkImportRevenue } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/_gated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const listFn = useServerFn(listRevenue);
  const upFn = useServerFn(upsertRevenue);
  const delFn = useServerFn(deleteRevenue);
  const bulkFn = useServerFn(bulkImportRevenue);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => listFn({ data: { limit: 500 } }),
  });

  const [form, setForm] = useState<any>({ user_id: "", date: new Date().toISOString().slice(0, 10), revenue: 0, impressions: 0, clicks: 0, cpm: 0 });
  const [importText, setImportText] = useState("");

  const save = useMutation({
    mutationFn: () => upFn({ data: form }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const importBulk = useMutation({
    mutationFn: async () => {
      const rows = parseImport(importText);
      return bulkFn({ data: { rows } });
    },
    onSuccess: (r) => { toast.success(`Imported ${r.inserted} rows`); qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); setImportText(""); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reports & Revenue</h1>
          <p className="text-sm text-muted-foreground">
            Manually edit revenue, impressions, clicks and CPM. Changes update publisher dashboards instantly.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Upload className="mr-1.5 h-4 w-4" /> Import</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Bulk import revenue</DialogTitle></DialogHeader>
              <p className="text-xs text-muted-foreground">
                Paste CSV or JSON. CSV headers: <code>user_id,date,revenue,impressions,clicks,cpm,site_id,country</code>. JSON accepts an array of the same fields.
              </p>
              <Textarea rows={12} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='user_id,date,revenue,impressions,clicks,cpm&#10;abc-uuid,2026-07-01,120.50,25000,410,4.8' />
              <div className="flex justify-end">
                <Button variant="hero" onClick={() => importBulk.mutate()} disabled={importBulk.isPending || !importText.trim()}>
                  Import
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="hero"><Plus className="mr-1.5 h-4 w-4" /> Add entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Manual revenue entry</DialogTitle></DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <F label="Publisher user ID"><Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} /></F>
                <F label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
                <F label="Revenue"><Input type="number" step="0.01" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} /></F>
                <F label="Impressions"><Input type="number" value={form.impressions} onChange={(e) => setForm({ ...form, impressions: Number(e.target.value) })} /></F>
                <F label="Clicks"><Input type="number" value={form.clicks} onChange={(e) => setForm({ ...form, clicks: Number(e.target.value) })} /></F>
                <F label="CPM"><Input type="number" step="0.01" value={form.cpm} onChange={(e) => setForm({ ...form, cpm: Number(e.target.value) })} /></F>
                <F label="Site ID (optional)"><Input value={form.site_id ?? ""} onChange={(e) => setForm({ ...form, site_id: e.target.value || null })} /></F>
                <F label="Country (optional)"><Input value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value || null })} /></F>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending || !form.user_id}>
                  <Save className="mr-1.5 h-4 w-4" /> Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 bg-card/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Publisher</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium text-right">Impr.</th>
                <th className="px-4 py-3 font-medium text-right">Clicks</th>
                <th className="px-4 py-3 font-medium text-right">CPM</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : data?.length ? data.map((r: any) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-2 text-xs">{r.profiles?.publisher_id ?? r.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-right font-medium">${Number(r.revenue).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{Number(r.impressions).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{Number(r.clicks).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">${Number(r.cpm).toFixed(2)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.country ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete entry?")) del.mutate(r.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No revenue events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-xs">{label}</Label>{children}</div>;
}

function parseImport(text: string): any[] {
  const t = text.trim();
  if (!t) return [];
  if (t.startsWith("[")) {
    return JSON.parse(t);
  }
  const lines = t.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((ln) => {
    const cols = ln.split(",");
    const row: any = {};
    headers.forEach((h, i) => { row[h] = cols[i]?.trim(); });
    return row;
  });
}
