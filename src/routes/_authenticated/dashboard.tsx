import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});
