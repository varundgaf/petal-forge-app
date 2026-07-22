import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Pause, Play, Trash2 } from "lucide-react";
import { listSites, setSiteStatus, deleteSite } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/_gated/sites")({
  component: SitesPage,
});

function SitesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSites);
  const statusFn = useServerFn(setSiteStatus);
  const delFn = useServerFn(deleteSite);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "sites", search, status],
    queryFn: () => listFn({ data: { search, status: status === "all" ? undefined : status } }),
  });

  const change = useMutation({
    mutationFn: (v: { siteId: string; status: any }) => statusFn({ data: v }),
    onSuccess: () => {
      toast.success("Site updated");
      qc.invalidateQueries({ queryKey: ["admin", "sites"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (siteId: string) => delFn({ data: { siteId } }),
    onSuccess: () => {
      toast.success("Site deleted");
      qc.invalidateQueries({ queryKey: ["admin", "sites"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Websites</h1>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} sites</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domain"
              className="w-64 pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 bg-card/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Publisher</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Visitors</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : data?.length ? (
                data.map((s: any) => (
                  <tr key={s.id} className="border-b border-border/40 hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{s.domain}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.profiles?.name ?? s.profiles?.email}
                      <div className="text-xs">{s.profiles?.publisher_id}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.category ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(s.monthly_visitors ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-xs capitalize">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => change.mutate({ siteId: s.id, status: "active" })}
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => change.mutate({ siteId: s.id, status: "rejected" })}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            change.mutate({
                              siteId: s.id,
                              status: s.status === "paused" ? "active" : "paused",
                            })
                          }
                          title="Pause / Resume"
                        >
                          {s.status === "paused" ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete ${s.domain}?`)) remove.mutate(s.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No sites found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
