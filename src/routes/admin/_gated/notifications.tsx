import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { listAdminNotifications, createNotification, deleteNotification } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/_gated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const listFn = useServerFn(listAdminNotifications);
  const createFn = useServerFn(createNotification);
  const delFn = useServerFn(deleteNotification);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState<any>({ title: "", body: "", kind: "info", audience: "all", userId: "", scheduled_for: "" });

  const send = useMutation({
    mutationFn: () => createFn({ data: { ...form, scheduled_for: form.scheduled_for || null } }),
    onSuccess: (r) => {
      toast.success(`Sent to ${r.count} users`);
      setForm({ title: "", body: "", kind: "info", audience: "all", userId: "", scheduled_for: "" });
      qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "notifications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Broadcast platform announcements or send targeted messages.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/40 p-5 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">Compose</h2>
          <div className="space-y-3">
            <div><Label className="mb-1 block text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">Body</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div>
              <Label className="mb-1 block text-xs">Type</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All publishers</SelectItem>
                  <SelectItem value="user">Specific user</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience === "user" && (
              <div><Label className="mb-1 block text-xs">User ID</Label><Input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} /></div>
            )}
            <div><Label className="mb-1 block text-xs">Schedule for (optional)</Label><Input type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} /></div>
            <Button className="w-full" variant="hero" onClick={() => send.mutate()} disabled={send.isPending || !form.title || !form.body}>
              <Send className="mr-1.5 h-4 w-4" /> Send
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden border-border/60 bg-card/40 lg:col-span-2">
          <div className="border-b border-border/60 px-5 py-3"><h2 className="text-sm font-semibold">Recent notifications</h2></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : data?.length ? data.map((n: any) => (
                  <tr key={n.id} className="border-b border-border/40">
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{n.profiles?.publisher_id ?? n.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-2">{n.title}</td>
                    <td className="px-4 py-2"><Badge variant="outline" className="capitalize">{n.kind}</Badge></td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(n.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No notifications yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
