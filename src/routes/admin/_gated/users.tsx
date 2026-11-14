import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_gated/users")({
  component: () => <Outlet />,
});
