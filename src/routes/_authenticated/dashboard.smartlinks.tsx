import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, subDays } from "date-fns";
import {
  BarChart3,
  Copy,
  Link2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  createSmartLink,
  deleteSmartLink,
  getSmartLinkAnalytics,
  listNetworkPlacements,
  listSmartLinks,
  setSmartLinkStatus,
  syncSmartLinkStats,
} from "@/lib/smartlinks.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/smartlinks")({
  component: SmartLinksPage,
  head: () => ({
    meta: [
      { title: "SmartLinks — AdProfitly" },
      { name: "description", content: "Create and analyze branded AdProfitly SmartLinks." },
      { property: "og:title", content: "SmartLinks — AdProfitly" },
      { property: "og:description", content: "Create and analyze branded AdProfitly SmartLinks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PRESETS = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Custom Range"] as const;
type Preset = (typeof PRESETS)[number];
type AnalyticsRow = Awaited<ReturnType<typeof getSmartLinkAnalytics>>[number];

const iso = (date: Date) => format(date, "yyyy-MM-dd");

function presetRange(preset: Preset, custom: { from: string; to: string }) {
  const today = new Date();
  if (preset === "Today") return { from: iso(today), to: iso(today) };
  if (preset === "Yesterday") return { from: iso(subDays(today, 1)), to: iso(subDays(today, 1)) };
  if (preset === "Last 7 Days") return { from: iso(subDays(today, 6)), to: iso(today) };
  if (preset === "Last 30 Days") return { from: iso(subDays(today, 29)), to: iso(today) };
  if (preset === "This Month") return { from: iso(startOfMonth(today)), to: iso(today) };
  return custom;
}

function SmartLinksPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listSmartLinks);
  const placementsFn = useServerFn(listNetworkPlacements);
  const createFn = useServerFn(createSmartLink);
  const statusFn = useServerFn(setSmartLinkStatus);
  const deleteFn = useServerFn(deleteSmartLink);
  const analyticsFn = useServerFn(getSmartLinkAnalytics);
  const syncFn = useServerFn(syncSmartLinkStats);
  const [createOpen, setCreateOpen] = useState(false);
  const [analyticsId, setAnalyticsId] = useState<string>();
  const [deleteId, setDeleteId] = useState<string>();
  const [preset, setPreset] = useState<Preset>("Last 30 Days");
  const [custom, setCustom] = useState({ from: iso(subDays(new Date(), 29)), to: iso(new Date()) });
  const [form, setForm] = useState({ name: "", trafficSource: "", placementId: "" });
  const range = presetRange(preset, custom);

  const linksQuery = useQuery({ queryKey: ["smartlinks"], queryFn: () => listFn() });
  const placementsQuery = useQuery({
    queryKey: ["smartlink-placements"],
    queryFn: () => placementsFn(),
    enabled: createOpen,
    retry: false,
  });
  const analyticsQuery = useQuery({
    queryKey: ["smartlink-analytics", analyticsId, range.from, range.to],
    queryFn: () => analyticsFn({ data: { smartLinkId: analyticsId, ...range } }),
    enabled: Boolean(analyticsId),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["smartlinks"] });
  const createMutation = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: async (result) => {
      await navigator.clipboard.writeText(result.branded_url);
      toast.success("SmartLink created and copied.");
      setCreateOpen(false);
      setForm({ name: "", trafficSource: "", placementId: "" });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const statusMutation = useMutation({
    mutationFn: (data: { id: string; status: "active" | "paused" }) => statusFn({ data }),
    onSuccess: () => { toast.success("SmartLink updated."); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("SmartLink deleted."); setDeleteId(undefined); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const syncMutation = useMutation({
    mutationFn: () => syncFn({ data: range }),
    onSuccess: (result) => {
      toast.success(result.rows ? "Analytics updated." : "Analytics are up to date.");
      queryClient.invalidateQueries({ queryKey: ["smartlink-analytics"] });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const analytics = useMemo(() => summarize(analyticsQuery.data ?? []), [analyticsQuery.data]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">SmartLinks</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">SmartLinks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create branded links and track their performance.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button variant="hero"><Plus className="mr-2 h-4 w-4" />Create SmartLink</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create SmartLink</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }}>
              <div className="space-y-2"><Label htmlFor="smartlink-name">Name</Label><Input id="smartlink-name" required maxLength={120} placeholder="Social campaign" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="traffic-source">Traffic source</Label><Input id="traffic-source" required maxLength={120} placeholder="Facebook" value={form.trafficSource} onChange={(event) => setForm({ ...form, trafficSource: event.target.value })} /></div>
              <div className="space-y-2">
                <Label>Approved placement</Label>
                <Select value={form.placementId} onValueChange={(placementId) => setForm({ ...form, placementId })}>
                  <SelectTrigger><SelectValue placeholder={placementsQuery.isLoading ? "Loading placements…" : "Choose placement"} /></SelectTrigger>
                  <SelectContent>{placementsQuery.data?.map((placement) => <SelectItem key={placement.id} value={placement.id}>{placement.title}</SelectItem>)}</SelectContent>
                </Select>
                {placementsQuery.isError && <p className="text-sm text-destructive">{(placementsQuery.error as Error).message}</p>}
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={createMutation.isPending || !form.name || !form.trafficSource || !form.placementId}>{createMutation.isPending ? "Generating…" : "Generate & copy link"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-muted/30"><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Link</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">Clicks</th><th className="px-6 py-3 text-right font-medium">Revenue</th><th className="px-6 py-3 text-right font-medium">CPM</th><th className="px-6 py-3 text-right font-medium">Actions</th></tr></thead>
            <tbody>
              {linksQuery.isLoading ? <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Loading…</td></tr> : !linksQuery.data?.length ? <tr><td colSpan={7} className="px-6 py-12 text-center"><Link2 className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-muted-foreground">No SmartLinks yet.</p></td></tr> : linksQuery.data.map((link) => (
                <tr key={link.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-4"><p className="font-medium">{link.name}</p><p className="text-xs text-muted-foreground">{link.traffic_source}</p></td>
                  <td className="px-6 py-4"><Button variant="ghost" size="sm" className="max-w-64 justify-start font-mono text-xs" onClick={() => { navigator.clipboard.writeText(link.branded_url); toast.success("Link copied."); }}><span className="truncate">{link.branded_url}</span><Copy className="ml-2 h-3.5 w-3.5 shrink-0" /></Button></td>
                  <td className="px-6 py-4"><Badge variant={link.status === "active" ? "default" : "secondary"}>{link.status === "active" ? "Active" : "Paused"}</Badge></td>
                  <td className="px-6 py-4 text-right font-mono">{link.clicks.toLocaleString()}</td><td className="px-6 py-4 text-right font-mono text-primary">${link.revenue.toFixed(2)}</td><td className="px-6 py-4 text-right font-mono">${link.cpm.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${link.name}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { navigator.clipboard.writeText(link.branded_url); toast.success("Link copied."); }}><Copy />Copy</DropdownMenuItem><DropdownMenuItem onSelect={() => setAnalyticsId(link.id)}><BarChart3 />Analytics</DropdownMenuItem><DropdownMenuItem onSelect={() => statusMutation.mutate({ id: link.id, status: link.status === "active" ? "paused" : "active" })}>{link.status === "active" ? <><Pause />Pause</> : <><Play />Activate</>}</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteId(link.id)}><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(analyticsId)} onOpenChange={(open) => !open && setAnalyticsId(undefined)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>SmartLink analytics</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">{PRESETS.map((item) => <Button key={item} type="button" size="sm" variant={preset === item ? "default" : "outline"} onClick={() => setPreset(item)}>{item}</Button>)}<Button type="button" size="sm" variant="ghost" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>{syncMutation.isPending ? "Syncing…" : "Sync now"}</Button></div>
            {preset === "Custom Range" && <div className="grid max-w-md gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="smart-from">From</Label><Input id="smart-from" type="date" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} /></div><div className="space-y-1"><Label htmlFor="smart-to">To</Label><Input id="smart-to" type="date" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} /></div></div>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[{ label: "Revenue", value: `$${analytics.revenue.toFixed(2)}` }, { label: "Clicks", value: analytics.clicks.toLocaleString() }, { label: "Impressions", value: analytics.impressions.toLocaleString() }, { label: "CTR", value: `${analytics.ctr.toFixed(2)}%` }, { label: "CPM", value: `$${analytics.cpm.toFixed(2)}` }].map((metric) => <div key={metric.label} className="rounded-xl border border-border bg-card p-4"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{metric.label}</p><p className={cn("mt-2 font-display text-xl font-semibold", metric.label === "Revenue" && "text-primary")}>{analyticsQuery.isLoading ? "…" : metric.value}</p></div>)}</div>
            <div className="rounded-xl border border-border bg-card p-5"><h3 className="mb-4 font-display font-semibold">Daily revenue</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.daily}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} /><XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(date) => format(new Date(date), "MMM d")} /><YAxis stroke="var(--muted-foreground)" fontSize={12} /><Tooltip formatter={(value: number) => `$${Number(value).toFixed(2)}`} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} /><Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
            <div className="grid gap-6 md:grid-cols-3"><DimensionList title="Top countries" rows={analytics.countries} /><DimensionList title="Top devices" rows={analytics.devices} /><DimensionList title="Top referrers" rows={analytics.referrers} /></div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete SmartLink?</AlertDialogTitle><AlertDialogDescription>This removes the branded link and its reporting data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function summarize(rows: AnalyticsRow[]) {
  const dailyMap = new Map<string, number>();
  const countries = new Map<string, number>();
  const devices = new Map<string, number>();
  const referrers = new Map<string, number>();
  let revenue = 0, clicks = 0, impressions = 0;
  for (const row of rows) {
    const rowRevenue = Number(row.revenue);
    revenue += rowRevenue; clicks += Number(row.clicks); impressions += Number(row.impressions);
    dailyMap.set(row.stat_date, (dailyMap.get(row.stat_date) ?? 0) + rowRevenue);
    addDimension(countries, row.country, rowRevenue); addDimension(devices, row.device, rowRevenue); addDimension(referrers, row.referrer, rowRevenue);
  }
  const dimension = (map: Map<string, number>) => Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  return { revenue, clicks, impressions, ctr: impressions ? clicks / impressions * 100 : 0, cpm: impressions ? revenue / impressions * 1000 : 0, daily: Array.from(dailyMap, ([date, value]) => ({ date, revenue: value })).sort((a, b) => a.date.localeCompare(b.date)), countries: dimension(countries), devices: dimension(devices), referrers: dimension(referrers) };
}

function addDimension(map: Map<string, number>, label: string, value: number) { const key = label || "Unknown"; map.set(key, (map.get(key) ?? 0) + value); }

function DimensionList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return <div className="rounded-xl border border-border bg-card p-5"><h3 className="mb-3 font-display font-semibold">{title}</h3><ul className="space-y-2">{rows.length ? rows.map((row) => <li key={row.label} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{row.label}</span><span className="font-mono text-primary">${row.value.toFixed(2)}</span></li>) : <li className="text-sm text-muted-foreground">No data.</li>}</ul></div>;
}