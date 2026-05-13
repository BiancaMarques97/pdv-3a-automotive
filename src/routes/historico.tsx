import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Printer, FileSpreadsheet, ReceiptText } from "lucide-react";
import { ordersAPI, fmtBRL, type Order } from "@/lib/store";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { exportOrderXLS } from "@/lib/excel";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico de Pedidos — 3A Automotive" }] }),
  component: HistoricoPage,
});

function HistoricoPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const all = ordersAPI.list();

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return all;
    return all.filter(o =>
      String(o.number).includes(qq) ||
      o.customerName.toLowerCase().includes(qq) ||
      o.responsible.toLowerCase().includes(qq)
    );
  }, [q, all]);

  return (
    <AppShell>
      <div className="h-full overflow-auto p-4 sm:p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold sm:text-3xl">Histórico de Pedidos</h1>
          <p className="text-sm text-muted-foreground">Pesquisa rápida e reimpressão de comprovantes</p>
        </div>

        <div className="relative mb-4 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por número, cliente ou responsável..."
            className="h-12 pl-11"
          />
        </div>

        {/* Mobile / Tablet: cards */}
        <div className="space-y-3 lg:hidden">
          {filtered.map(o => (
            <div key={o.id} className="rounded-xl border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{o.number}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{o.payment}</span>
                  </div>
                  <div className="mt-0.5 truncate text-base font-semibold">{o.customerName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("pt-BR")} · {o.responsible}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase text-muted-foreground">{o.totalQty} itens</div>
                  <div className="text-lg font-extrabold text-primary">{fmtBRL(o.total)}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(o)}>
                  <ReceiptText className="mr-1 h-4 w-4" />Ver
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportOrderXLS(o)}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" />Excel
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed bg-surface p-10 text-center text-sm text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-hidden rounded-lg border bg-surface lg:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Pedido</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Pagamento</th>
                <th className="px-4 py-2 text-left">Responsável</th>
                <th className="px-4 py-2 text-center">Itens</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-center w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono">#{o.number}</td>
                  <td className="px-4 py-3 font-medium">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">{o.payment}</td>
                  <td className="px-4 py-3">{o.responsible}</td>
                  <td className="px-4 py-3 text-center">{o.totalQty}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmtBRL(o.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setOpen(o)}>
                        <ReceiptText className="mr-1 h-4 w-4" />Ver
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exportOrderXLS(o)} title="Exportar">
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">Nenhum pedido encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Comprovante #{open?.number}</DialogTitle></DialogHeader>
          <div className="flex justify-center bg-muted/40 py-4">
            {open && <ThermalReceipt ref={printRef} order={open} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Fechar</Button>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Reimprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
