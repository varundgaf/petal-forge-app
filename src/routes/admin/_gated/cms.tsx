import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { listCms, saveCms } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/_gated/cms")({
  component: CmsPage,
});

function CmsPage() {
  const listFn = useServerFn(listCms);
  const saveFn = useServerFn(saveCms);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin", "cms"], queryFn: () => listFn() });
  const [drafts, setDrafts] = useState<Record<string, { value: string; published: boolean }>>({});

  useEffect(() => {
    if (data) {
      const next: any = {};
      data.forEach((r: any) => { next[r.key] = { value: JSON.stringify(r.value, null, 2), published: r.published }; });
      setDrafts(next);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (key: string) => {
      let parsed: any;
      try { parsed = JSON.parse(drafts[key].value); } catch { throw new Error("Invalid JSON"); }
      return saveFn({ data: { key, value: parsed, published: drafts[key].published } });
    },
    onSuccess: () => { toast.success("Saved. Changes are live."); qc.invalidateQueries({ queryKey: ["admin", "cms"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">CMS content</h1>
        <p className="text-sm text-muted-foreground">Edit public site content, legal pages, contact and social links. Changes appear instantly.</p>
      </div>

      <Tabs defaultValue={data[0]?.key}>
        <TabsList className="flex-wrap">
          {data.map((r: any) => <TabsTrigger key={r.key} value={r.key} className="capitalize">{r.key}</TabsTrigger>)}
        </TabsList>
        {data.map((r: any) => {
          const d = drafts[r.key];
          if (!d) return null;
          return (
            <TabsContent key={r.key} value={r.key}>
              <Card className="border-border/60 bg-card/40 p-5">
                <p className="mb-2 text-xs text-muted-foreground">
                  Edit the JSON structure below. Fields depend on where this key is rendered on the public site.
                </p>
                <Textarea
                  rows={16}
                  className="font-mono text-xs"
                  value={d.value}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [r.key]: { ...prev[r.key], value: e.target.value } }))}
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={d.published}
                      onCheckedChange={(v) => setDrafts((prev) => ({ ...prev, [r.key]: { ...prev[r.key], published: v } }))}
                    />
                    <Label className="text-xs">Published to public site</Label>
                  </div>
                  <Button variant="hero" onClick={() => save.mutate(r.key)} disabled={save.isPending}>
                    <Save className="mr-1.5 h-4 w-4" /> Save {r.key}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
