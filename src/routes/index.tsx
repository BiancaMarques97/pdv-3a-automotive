import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Plus, Trash2, Printer, Save, FileSpreadsheet, MapPin, Phone,
  User, Package, ReceiptText, MessageSquarePlus, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  customersAPI, consignedAPI, ordersAPI, fmtBRL, uid,
  type Customer, type ConsignedItem, type Order,
} from "@/lib/store";
import { exportOrderXLS } from "@/lib/excel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDV — 3A Automotive" },
      { name: "description", content: "Controle de pedidos e consignados 3A Automotive." },
    ],
  }),
  component: PdvPage,
});

function PdvPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>(() => customersAPI.list());
  const [selected, setSelected] = useState<Customer | null>(null);
  const [items, setItems] = useState<ConsignedItem[]>([]);
  const [payment, setPayment] = useState("Dinheiro");
  const [notes, setNotes] = useState("");
  const [responsible, setResponsible] = useState("Luiz Carlos");
  const [showAdd, setShowAdd] = useState(false);
  const [showNote, setShowNote] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<Order[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setResults(customersAPI.search(query)), 120);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (selected) {
      setItems(consignedAPI.forCustomer(selected.id));
      setHistory(ordersAPI.list().filter(o => o.customerId === selected.id).slice(0, 5));
    } else {
      setItems([]);
      setHistory([]);
    }
  }, [selected]);

  const totals = useMemo(() => {
    const totalQty = items.reduce((a, i) => a + i.sold, 0);
    const total = items.reduce((a, i) => a + i.sold * i.unitPrice, 0);
    return { totalQty, total };
  }, [items]);

  const updateItem = (id: string, patch: Partial<ConsignedItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const saveOrder = (alsoPrint = false) => {
    if (!selected) { toast.error("Selecione um cliente"); return; }
    if (totals.totalQty === 0) { toast.error("Informe pelo menos uma quantidade vendida"); return; }
    // persist remaining consignment
    const remaining = items.map(i => ({ ...i, quantity: Math.max(0, i.quantity - i.sold), sold: 0, note: "" }));
    consignedAPI.saveForCustomer(selected.id, remaining);
    const order = ordersAPI.create({
      customerId: selected.id,
      customerName: selected.name,
      items: items.map(i => ({ ...i })),
      total: totals.total,
      totalQty: totals.totalQty,
      payment,
      notes,
      responsible,
    });
    toast.success(`Pedido #${order.number} salvo`);
    if (alsoPrint) setPrintOrder(order);
    else {
      // refresh
      setItems(remaining);
      setHistory(ordersAPI.list().filter(o => o.customerId === selected.id).slice(0, 5));
      setNotes("");
    }
    return order;
  };

  const handleExport = () => {
    const o = saveOrder(false);
    if (o) exportOrderXLS(o);
  };

  return (
    <AppShell>
      <div className="grid h-screen grid-cols-1 grid-rows-[auto_1fr] gap-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b bg-surface px-6 py-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar cliente por nome, telefone ou cidade..."
              className="h-12 pl-11 text-base"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
        </header>

        {/* Body grid */}
        <div className="grid grid-cols-12 gap-4 overflow-hidden p-4">
          {/* Customers list */}
          <section className="col-span-12 flex flex-col overflow-hidden rounded-lg border bg-surface lg:col-span-3">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Clientes</div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{results.length}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {results.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</div>
              ) : results.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                    selected?.id === c.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-semibold text-foreground">{c.name}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{c.city}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Center - items */}
          <section className="col-span-12 flex flex-col overflow-hidden rounded-lg border bg-surface lg:col-span-6">
            {!selected ? (
              <EmptyState />
            ) : (
              <>
                <div className="border-b px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">Cliente selecionado</div>
                      <h2 className="mt-0.5 text-2xl font-bold">{selected.name}</h2>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selected.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.city}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                      <X className="mr-1 h-4 w-4" />Trocar
                    </Button>
                  </div>
                  {history.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Últimos pedidos:</span>
                      {history.map(h => (
                        <button
                          key={h.id}
                          onClick={() => setPrintOrder(h)}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs hover:bg-accent"
                        >
                          #{h.number} · {fmtBRL(h.total)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Package className="h-4 w-4 text-primary" />
                    Itens Consignados
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <Button size="sm" onClick={() => setShowAdd(true)}>
                    <Plus className="mr-1 h-4 w-4" />Adicionar item
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  {items.length === 0 ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                      Sem itens consignados. Adicione um item para começar o pedido.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface text-xs uppercase text-muted-foreground">
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-semibold">Código</th>
                          <th className="px-3 py-2 text-left font-semibold">Descrição</th>
                          <th className="px-2 py-2 text-center font-semibold">Qtd</th>
                          <th className="px-2 py-2 text-center font-semibold">Vendida</th>
                          <th className="px-2 py-2 text-right font-semibold">Unit.</th>
                          <th className="px-2 py-2 text-right font-semibold">Subtotal</th>
                          <th className="px-2 py-2 text-center font-semibold w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(i => (
                          <tr key={i.id} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-3 font-mono text-xs">{i.code}</td>
                            <td className="px-3 py-3">
                              <div className="font-medium">{i.description}</div>
                              {i.note && <div className="mt-0.5 text-xs italic text-muted-foreground">obs: {i.note}</div>}
                            </td>
                            <td className="px-2 py-3 text-center font-semibold">{i.quantity}</td>
                            <td className="px-2 py-3 text-center">
                              <Input
                                type="number"
                                min={0}
                                max={i.quantity}
                                value={i.sold}
                                onChange={e => {
                                  const v = Math.max(0, Math.min(i.quantity, Number(e.target.value) || 0));
                                  updateItem(i.id, { sold: v });
                                }}
                                className="mx-auto h-9 w-20 text-center font-semibold"
                              />
                            </td>
                            <td className="px-2 py-3 text-right">{fmtBRL(i.unitPrice)}</td>
                            <td className="px-2 py-3 text-right font-bold text-primary">
                              {fmtBRL(i.sold * i.unitPrice)}
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowNote(i.id)} title="Observação">
                                  <MessageSquarePlus className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(i.id)} title="Remover">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Right summary */}
          <aside className="col-span-12 flex flex-col overflow-hidden rounded-lg border bg-surface lg:col-span-3">
            <div className="border-b bg-secondary px-5 py-4 text-secondary-foreground">
              <div className="text-xs uppercase tracking-wider opacity-70">Resumo do Pedido</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm">Itens</span>
                <span className="text-2xl font-bold">{totals.totalQty}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm">Total</span>
                <span className="text-3xl font-extrabold text-primary">{fmtBRL(totals.total)}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-auto p-5">
              <div>
                <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Pagamento</Label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                    <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                    <SelectItem value="A Prazo">A Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Responsável</Label>
                <Select value={responsible} onValueChange={setResponsible}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Luiz Carlos">Luiz Carlos</SelectItem>
                    <SelectItem value="Fábio Fonseca">Fábio Fonseca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Observações</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas do pedido..." />
              </div>
            </div>

            <div className="space-y-2 border-t bg-muted/30 p-4">
              <Button className="h-12 w-full text-base font-semibold" onClick={() => saveOrder(false)}>
                <Save className="mr-2 h-5 w-5" />Salvar Pedido
              </Button>
              <Button variant="secondary" className="h-12 w-full text-base font-semibold" onClick={() => saveOrder(true)}>
                <Printer className="mr-2 h-5 w-5" />Imprimir Canhoto
              </Button>
              <Button variant="outline" className="h-12 w-full text-base font-semibold" onClick={handleExport}>
                <FileSpreadsheet className="mr-2 h-5 w-5" />Exportar Excel
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <AddItemDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(item) => { setItems(prev => [...prev, item]); setShowAdd(false); }}
      />
      <NoteDialog
        open={!!showNote}
        item={items.find(i => i.id === showNote) ?? null}
        onClose={() => setShowNote(null)}
        onSave={(note) => { if (showNote) updateItem(showNote, { note }); setShowNote(null); }}
      />
      <PrintDialog open={!!printOrder} order={printOrder} onClose={() => setPrintOrder(null)} printRef={printRef} />
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
      <div className="rounded-full bg-accent p-5"><User className="h-10 w-10 text-primary" /></div>
      <div className="text-lg font-semibold text-foreground">Selecione um cliente</div>
      <div className="max-w-xs text-sm">Use a busca acima ou clique em um cliente da lista para visualizar os itens consignados.</div>
    </div>
  );
}

function AddItemDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (i: ConsignedItem) => void }) {
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  useEffect(() => { if (open) { setCode(""); setDesc(""); setQty(1); setPrice(0); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar item consignado</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Código</Label><Input value={code} onChange={e => setCode(e.target.value)} className="h-11" /></div>
          <div><Label>Descrição</Label><Input value={desc} onChange={e => setDesc(e.target.value)} className="h-11" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantidade</Label><Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value) || 1)} className="h-11" /></div>
            <div><Label>Valor unit. (R$)</Label><Input type="number" min={0} step="0.01" value={price} onChange={e => setPrice(Number(e.target.value) || 0)} className="h-11" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!code || !desc) { toast.error("Preencha código e descrição"); return; }
              onAdd({ id: uid(), code, description: desc, quantity: qty, sold: 0, unitPrice: price });
            }}
          >Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoteDialog({ open, item, onClose, onSave }: { open: boolean; item: ConsignedItem | null; onClose: () => void; onSave: (n: string) => void }) {
  const [note, setNote] = useState("");
  useEffect(() => { setNote(item?.note ?? ""); }, [item]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Observação do item</DialogTitle></DialogHeader>
        <div className="text-sm text-muted-foreground">{item?.description}</div>
        <Textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Ex: peça com avaria, devolver até sexta..." />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(note)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintDialog({ open, order, onClose, printRef }: { open: boolean; order: Order | null; onClose: () => void; printRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5" />Pré-visualização do Canhoto</DialogTitle></DialogHeader>
        <div className="flex justify-center bg-muted/40 py-4">
          {order && <ThermalReceipt ref={printRef} order={order} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
