import { createFileRoute } from "@tanstack/react-router";

// Scheduled job endpoint: syncs Adsterra reports for all publishers.
// Caller must send the token stored in the service-role-only cron_tokens table.
export const Route = createFileRoute("/api/public/smartlinks-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-sync-token") || "";
        if (token.length < 32) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("cron_tokens" as never).select("token").eq("name", "smartlinks_sync").maybeSingle();
        const expected = (data as { token?: string } | null)?.token;
        if (!expected || expected !== token) return new Response("Unauthorized", { status: 401 });
        const body = (await request.json().catch(() => ({}))) as { days?: number };
        const days = Math.min(Math.max(Math.floor(Number(body.days) || 30), 1), 365);
        const to = new Date();
        const from = new Date(to.getTime() - days * 86_400_000);
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        const { syncReports } = await import("@/lib/smartlinks/sync.server");
        try {
          const result = await syncReports({ from: iso(from), to: iso(to) }, null);
          return Response.json({ ok: true, ...result });
        } catch {
          return Response.json({ ok: false }, { status: 502 });
        }
      },
    },
  },
});
