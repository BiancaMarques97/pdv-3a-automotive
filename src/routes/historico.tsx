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
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Pedidos</h1>
            <p className="text-muted-foreground">Pesquisa rápida e reimpressão de comprovantes</p>
          </div>
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

        <div className="overflow-hidden rounded-lg border bg-surface">
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
