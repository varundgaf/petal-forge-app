import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { listTickets, getTicket, updateTicket, replyTicket } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/_gated/support")({
  component: SupportPage,
});

function SupportPage() {
  const listFn = useServerFn(listTickets);
  const getFn = useServerFn(getTicket);
  const updFn = useServerFn(updateTicket);
  const replyFn = useServerFn(replyTicket);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<{ status: string; priority: string; search: string }>({ status: "", priority: "", search: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin", "tickets", filter],
    queryFn: () => listFn({ data: filter }),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin", "ticket", selected],
    queryFn: () => getFn({ data: { id: selected! } }),
    enabled: !!selected,
  });

  const update = useMutation({
    mutationFn: (patch: any) => updFn({ data: { id: selected!, ...patch } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "ticket", selected] }); qc.invalidateQueries({ queryKey: ["admin", "tickets"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const reply = useMutation({
    mutationFn: () => replyFn({ data: { ticketId: selected!, body: replyBody } }),
    onSuccess: () => { toast.success("Reply sent"); setReplyBody(""); qc.invalidateQueries({ queryKey: ["admin", "ticket", selected] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Support tickets</h1>
          <p className="text-sm text-muted-foreground">{tickets?.length ?? 0} tickets</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search subject" className="w-52" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
          <Select value={filter.status || "all"} onValueChange={(v) => setFilter({ ...filter, status: v === "all" ? "" : v })}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.priority || "all"} onValueChange={(v) => setFilter({ ...filter, priority: v === "all" ? "" : v })}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-border/60 bg-card/40">
          <div className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : tickets?.length ? tickets.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`w-full border-b border-border/40 px-4 py-3 text-left transition-colors ${selected === t.id ? "bg-accent/40" : "hover:bg-accent/20"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{t.subject}</span>
                  <Badge variant="outline" className="capitalize">{t.status}</Badge>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.profiles?.publisher_id ?? t.user_id.slice(0, 8)}</span>
                  <span className="capitalize">{t.priority}</span>
                </div>
              </button>
            )) : (
              <p className="p-4 text-sm text-muted-foreground">No tickets.</p>
            )}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/40 p-5 lg:col-span-2">
          {!selected || !detail?.ticket ? (
            <p className="text-sm text-muted-foreground">Select a ticket to view details.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{detail.ticket.subject}</h2>
                  <p className="text-xs text-muted-foreground">
                    From {detail.ticket.profiles?.email} · Opened {new Date(detail.ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={detail.ticket.status} onValueChange={(v) => update.mutate({ status: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={detail.ticket.priority} onValueChange={(v) => update.mutate({ priority: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {detail.ticket.body && (
                <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm whitespace-pre-wrap">{detail.ticket.body}</div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {detail.messages.map((m: any) => (
                  <div key={m.id} className={`rounded-md border p-3 text-sm ${m.is_admin ? "border-primary/30 bg-primary/5" : "border-border/60 bg-muted/10"}`}>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.is_admin ? "Admin" : "Publisher"}</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Textarea rows={3} placeholder="Reply as admin…" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
                <div className="flex justify-end">
                  <Button variant="hero" onClick={() => reply.mutate()} disabled={reply.isPending || !replyBody.trim()}>
                    <Send className="mr-1.5 h-4 w-4" /> Send reply
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Internal notes</p>
                <Textarea
                  rows={2}
                  defaultValue={detail.ticket.internal_notes ?? ""}
                  onBlur={(e) => {
                    const current = detail.ticket?.internal_notes ?? "";
                    if (e.target.value !== current) update.mutate({ internal_notes: e.target.value });
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
