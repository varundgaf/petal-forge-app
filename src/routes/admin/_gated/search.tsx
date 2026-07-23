import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { globalSearch } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/_gated/search")({
  component: SearchPage,
});

function SearchPage() {
  const fn = useServerFn(globalSearch);
  const [q, setQ] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["admin", "search", q],
    queryFn: () => fn({ data: { q } }),
    enabled: q.trim().length > 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Global search</h1>
        <p className="text-sm text-muted-foreground">Search users, sites, payments and tickets.</p>
      </div>

      <div className="relative max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Type at least 2 characters…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}

      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title={`Publishers (${data.users.length})`}>
            {data.users.map((u: any) => (
              <Link
                key={u.id}
                to="/admin/users/$userId"
                params={{ userId: u.id }}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/40"
              >
                <div>
                  <div className="text-sm font-medium">{u.name ?? u.email}</div>
                  <div className="text-xs text-muted-foreground">{u.publisher_id} · {u.email}</div>
                </div>
                <Badge variant="outline" className="capitalize">{u.status}</Badge>
              </Link>
            ))}
          </Section>
          <Section title={`Websites (${data.sites.length})`}>
            {data.sites.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/40">
                <span className="text-sm">{s.domain}</span>
                <Badge variant="outline" className="capitalize">{s.status}</Badge>
              </div>
            ))}
          </Section>
          <Section title={`Payments (${data.payments.length})`}>
            {data.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/40">
                <span className="text-sm">${Number(p.amount).toFixed(2)} · {p.reference_id ?? "—"}</span>
                <Badge variant="outline" className="capitalize">{p.status}</Badge>
              </div>
            ))}
          </Section>
          <Section title={`Tickets (${data.tickets.length})`}>
            {data.tickets.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/40">
                <span className="text-sm truncate">{t.subject}</span>
                <Badge variant="outline" className="capitalize">{t.status}</Badge>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="space-y-1">{children}</div>
    </Card>
  );
}
