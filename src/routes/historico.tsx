import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CalendarDays, Eye, FileSpreadsheet } from "lucide-react";

import { useHistorico } from "@/services/historico";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/historico")({
  component: HistoricoPage,
});

function HistoricoPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const orders = useHistorico((state) => state.orders);

  const loadOrders = useHistorico((state) => state.loadOrders);

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => setMenuOpen(true)} className="rounded-md border p-2">
            ☰
          </button>

          <div>
            <div className="font-bold">3A AUTOMOTIVE</div>

            <div className="text-xs text-muted-foreground">HISTÓRICO</div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl">
        {menuOpen && (
          <>
            {/* BACKDROP */}

            <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/40" />

            {/* SIDEBAR */}

            <div className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-background p-4 shadow-xl">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="font-bold">3A AUTOMOTIVE</div>

                  <div className="text-xs text-muted-foreground">ERP</div>
                </div>

                <button onClick={() => setMenuOpen(false)} className="rounded-md border px-2 py-1">
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate({
                      to: "/clientes",
                    });

                    setMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-3 text-left hover:bg-muted"
                >
                  PDV
                </button>

                <button
                  onClick={() => {
                    navigate({
                      to: "/historico",
                    });

                    setMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-3 text-left hover:bg-muted"
                >
                  Histórico
                </button>
              </div>
            </div>
          </>
        )}

        {/* EMPTY */}

        {orders.length === 0 && (
          <div className="rounded-3xl border bg-background p-10 text-center text-muted-foreground m-10">
            Nenhum pedido encontrado
          </div>
        )}

        {/* GRID */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl border bg-background p-5 shadow-sm">
              {/* CLIENTE */}

              <div className="text-lg font-bold">{order.customer.name}</div>

              {/* DATA */}

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />

                {new Date(order.createdAt).toLocaleString("pt-BR")}
              </div>

              {/* TOTAL */}

              <div className="mt-5">
                <div className="text-sm text-muted-foreground">Total</div>

                <div className="text-2xl font-bold">R$ {order.total.toFixed(2)}</div>
              </div>

              {/* PAGAMENTO */}

              <div className="mt-4 text-sm text-muted-foreground">{order.payment}</div>

              {/* ACTIONS */}

              <div className="mt-6 flex gap-3">
                {/* VISUALIZAR */}

                <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border p-3 transition-all hover:bg-muted">
                  <Eye className="h-5 w-5" />
                  Visualizar
                </button>

                {/* XLS */}

                <button className="flex items-center justify-center rounded-2xl border p-3 transition-all hover:bg-muted">
                  <FileSpreadsheet className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
