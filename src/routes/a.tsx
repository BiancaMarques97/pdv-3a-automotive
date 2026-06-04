import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/a")({
  component: IndexPage,
});

function IndexPage() {
  return <Navigate to="/clientes" />;
}
