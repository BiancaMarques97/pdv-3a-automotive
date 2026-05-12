import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ordersAPI, customersAPI, fmtBRL } from "@/lib/store";
import { useMemo } from "react";
import { ShoppingCart, Users, DollarSign, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — 3A Automotive" }] }),
  component: Dashboard,
});

function Dashboard() {
  const orders = ordersAPI.list();
  const customers = customersAPI.list();
  const today = new Date().toDateString();

  const stats = useMemo(() => {
    const todays = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const totalToday = todays.reduce((a, o) => a + o.total, 0);
    const total = orders.reduce((a, o) => a + o.total, 0);
    return { todays: todays.length, totalToday, total, count: orders.length };
  }, [orders, today]);

  const cards = [
    { label: "Pedidos Hoje", value: stats.todays, icon: ShoppingCart, color: "text-primary" },
    { label: "Faturado Hoje", value: fmtBRL(stats.totalToday), icon: DollarSign, color: "text-success" },
    { label: "Total Pedidos", value: stats.count, icon: TrendingUp, color: "text-secondary" },
    { label: "Clientes", value: customers.length, icon: Users, color: "text-warning" },
  ];

  return (
    <AppShell>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da operação</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="rounded-lg border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">{c.label}</div>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="mt-2 text-3xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border bg-surface">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-lg font-semibold">Pedidos recentes</h2>
            <Link to="/historico" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Pedido</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Responsável</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(o => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3 font-mono">#{o.number}</td>
                  <td className="px-4 py-3 font-medium">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">{o.responsible}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmtBRL(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum pedido ainda</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
