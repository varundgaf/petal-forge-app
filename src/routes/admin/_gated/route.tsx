import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { verifyOrBootstrapAdmin } from "@/lib/admin.functions";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/_gated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    try {
      const res = await verifyOrBootstrapAdmin();
      if (!res.isAdmin) {
        await supabase.auth.signOut();
        throw redirect({ to: "/admin/login" });
      }
    } catch (err: any) {
      if (err?.isRedirect) throw err;
      throw redirect({ to: "/admin/login" });
    }
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
