import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { listSettings, saveSetting } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/_gated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const listFn = useServerFn(listSettings);
  const saveFn = useServerFn(saveSetting);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "settings"], queryFn: () => listFn() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const next: any = {};
      data.forEach((r: any) => { next[r.key] = JSON.stringify(r.value, null, 2); });
      setDrafts(next);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (key: string) => {
      let parsed: any;
      try { parsed = JSON.parse(drafts[key]); } catch { throw new Error("Invalid JSON"); }
      return saveFn({ data: { key, value: parsed } });
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Platform settings</h1>
        <p className="text-sm text-muted-foreground">Defaults, branding, SMTP, security and maintenance mode.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((r: any) => (
          <Card key={r.key} className="border-border/60 bg-card/40 p-5">
            <h2 className="mb-2 text-sm font-semibold capitalize">{r.key}</h2>
            <Textarea
              rows={10}
              className="font-mono text-xs"
              value={drafts[r.key] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [r.key]: e.target.value }))}
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="hero" onClick={() => save.mutate(r.key)} disabled={save.isPending}>
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
