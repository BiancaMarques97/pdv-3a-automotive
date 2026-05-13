import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsDesktop } from "@/hooks/use-desktop";
import {
  Search,
  Plus,
  Trash2,
  Printer,
  Save,
  FileSpreadsheet,
  MapPin,
  Phone,
  User,
  Package,
  ReceiptText,
  MessageSquarePlus,
  ArrowLeft,
  Minus,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  customersAPI,
  consignedAPI,
  ordersAPI,
  fmtBRL,
  uid,
  type Customer,
  type ConsignedItem,
  type Order,
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

type Step = "customers" | "items" | "finalize" | "done";

function PdvPage() {
  const isDesktop = useIsDesktop();
  const [step, setStep] = useState<Step>("customers");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>(() => customersAPI.list());
  const [selected, setSelected] = useState<Customer | null>(null);
  const [items, setItems] = useState<ConsignedItem[]>([]);
  const [payment, setPayment] = useState("Dinheiro");
  const [notes, setNotes] = useState("");
  const [responsible, setResponsible] = useState("Luiz Carlos");
  const [showAdd, setShowAdd] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNote, setShowNote] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setResults(customersAPI.search(query)), 120);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (selected) setItems(consignedAPI.forCustomer(selected.id));
    else setItems([]);
  }, [selected]);

  const totals = useMemo(() => {
    const totalQty = items.reduce((a, i) => a + i.sold, 0);
    const total = items.reduce((a, i) => a + i.sold * i.unitPrice, 0);
    return { totalQty, total };
  }, [items]);

  const updateItem = (id: string, patch: Partial<ConsignedItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const addItem = (item: ConsignedItem) => setItems((prev) => [...prev, item]);

  const pickCustomer = (c: Customer) => {
    setSelected(c);
    setStep("items");
  };
  const backToCustomers = () => {
    setSelected(null);
    setStep("customers");
  };

  const goFinalize = () => {
    if (totals.totalQty === 0) {
      toast.error("Informe pelo menos uma quantidade vendida");
      return;
    }
    setStep("finalize");
  };

  const saveOrder = (alsoPrint = false): Order | undefined => {
    if (!selected) {
      toast.error("Selecione um cliente");
      return;
    }
    if (totals.totalQty === 0) {
      toast.error("Informe pelo menos uma quantidade vendida");
      return;
    }
    const remaining = items.map((i) => ({ ...i, quantity: Math.max(0, i.quantity - i.sold), sold: 0, note: "" }));
    consignedAPI.saveForCustomer(selected.id, remaining);
    const order = ordersAPI.create({
      customerId: selected.id,
      customerName: selected.name,
      items: items.map((i) => ({ ...i })),
      total: totals.total,
      totalQty: totals.totalQty,
      payment,
      notes,
      responsible,
    });
    setLastOrder(order);
    setItems(remaining);
    setNotes("");
    if (alsoPrint) setPrintOrder(order);
    if (!isDesktop) setStep("done");
    toast.success(`Pedido #${order.number} salvo`);
    return order;
  };

  const handleExport = () => {
    const o = saveOrder(false);
    if (o) exportOrderXLS(o);
  };

  const newOrder = () => {
    setSelected(null);
    setItems([]);
    setLastOrder(null);
    setNotes("");
    setStep("customers");
  };

  const titles: Record<Step, string> = {
    customers: "Clientes",
    items: selected?.name ?? "Itens",
    finalize: "Finalizar Pedido",
    done: "Pedido Finalizado",
  };

  const dialogs = (
    <>
      <AddItemDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={addItem} />
      <NewCustomerDialog
        open={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onCreated={(customer) => {
          setShowNewCustomer(false);
          setResults(customersAPI.list());
          pickCustomer(customer);
          toast.success(`Cliente "${customer.name}" cadastrado`);
        }}
      />
      <NoteDialog
        open={!!showNote}
        item={items.find((i) => i.id === showNote) ?? null}
        onClose={() => setShowNote(null)}
        onSave={(note) => {
          if (showNote) updateItem(showNote, { note });
          setShowNote(null);
        }}
      />
      <PrintDialog open={!!printOrder} order={printOrder} onClose={() => setPrintOrder(null)} printRef={printRef} />
    </>
  );

  if (isDesktop) {
    return (
      <AppShell title="PDV — Pedidos & Consignados">
        <DesktopPdv
          query={query}
          setQuery={setQuery}
          results={results}
          selected={selected}
          onPick={pickCustomer}
          items={items}
          totals={totals}
          payment={payment}
          setPayment={setPayment}
          responsible={responsible}
          setResponsible={setResponsible}
          notes={notes}
          setNotes={setNotes}
          onAdd={() => setShowAdd(true)}
          onUpdate={updateItem}
          onRemove={removeItem}
          onNote={setShowNote}
          onNewCustomer={() => setShowNewCustomer(true)}
          onTrocar={backToCustomers}
          onSave={() => saveOrder(false)}
          onSavePrint={() => saveOrder(true)}
          onExport={handleExport}
        />
        {dialogs}
      </AppShell>
    );
  }

  return (
    <AppShell title={titles[step]}>
      {step === "customers" && (
        <CustomersStep
          query={query}
          setQuery={setQuery}
          results={results}
          onPick={pickCustomer}
          onNew={() => setShowNewCustomer(true)}
        />
      )}

      {step === "items" && selected && (
        <ItemsStep
          customer={selected}
          items={items}
          totals={totals}
          onBack={backToCustomers}
          onAdd={() => setShowAdd(true)}
          onUpdate={updateItem}
          onRemove={removeItem}
          onNote={setShowNote}
          onContinue={goFinalize}
        />
      )}

      {step === "finalize" && selected && (
        <FinalizeStep
          customer={selected}
          totals={totals}
          payment={payment}
          setPayment={setPayment}
          responsible={responsible}
          setResponsible={setResponsible}
          notes={notes}
          setNotes={setNotes}
          onBack={() => setStep("items")}
          onSave={() => saveOrder(false)}
          onSavePrint={() => saveOrder(true)}
          onExport={handleExport}
        />
      )}

      {step === "done" && lastOrder && (
        <DoneStep order={lastOrder} onReprint={() => setPrintOrder(lastOrder)} onNew={newOrder} />
      )}

      {dialogs}
    </AppShell>
  );
}

/* ============== Desktop ERP layout ============== */

function DesktopPdv({
  query,
  setQuery,
  results,
  selected,
  onPick,
  items,
  totals,
  payment,
  setPayment,
  responsible,
  setResponsible,
  notes,
  setNotes,
  onAdd,
  onUpdate,
  onRemove,
  onNote,
  onNewCustomer,
  onTrocar,
  onSave,
  onSavePrint,
  onExport,
}: {
  query: string;
  setQuery: (s: string) => void;
  results: Customer[];
  selected: Customer | null;
  onPick: (c: Customer) => void;
  items: ConsignedItem[];
  totals: { totalQty: number; total: number };
  payment: string;
  setPayment: (s: string) => void;
  responsible: string;
  setResponsible: (s: string) => void;
  notes: string;
  setNotes: (s: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ConsignedItem>) => void;
  onRemove: (id: string) => void;
  onNote: (id: string) => void;
  onNewCustomer: () => void;
  onTrocar: () => void;
  onSave: () => void;
  onSavePrint: () => void;
  onExport: () => void;
}) {
  const today = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    [],
  );
  const lastOrders = useMemo(() => {
    if (!selected) return [];
    return ordersAPI
      .list()
      .filter((o) => o.customerId === selected.id)
      .slice(0, 1);
  }, [selected, items]);

  const hasSelection = !!selected;
  const canSave = hasSelection && totals.totalQty > 0;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Top bar: search + date */}
      <div className="flex items-center gap-4 border-b bg-surface px-6 py-3">
        <div className="relative flex-1 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente por nome, telefone ou cidade..."
            className="h-12 rounded-full pl-12 text-base"
          />
        </div>
        <div className="ml-auto text-sm font-medium capitalize text-muted-foreground" suppressHydrationWarning>
          {today}
        </div>
      </div>

      {/* 3-col grid */}
      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_340px] gap-4 p-4">
        {/* Customers column */}
        <aside className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Clientes
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {results.length}
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={onNewCustomer}>
              <Plus className="mr-1 h-4 w-4" />
              Novo cliente
            </Button>
          </div>
          <div className="flex-1 space-y-2 overflow-auto pr-1 pb-2">
            {results.length === 0 && (
              <div className="rounded-xl border border-dashed bg-surface p-6 text-center text-xs text-muted-foreground">
                Nenhum cliente
              </div>
            )}
            {results.map((c) => {
              const active = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  className={`flex w-full items-center gap-3 rounded-xl border bg-surface px-3 py-3 text-left shadow-sm transition active:scale-[0.99] hover:border-primary/40 hover:shadow ${
                    active ? "border-primary ring-1 ring-primary" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-accent text-primary"}`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.city}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: client + items */}
        <section className="flex min-h-0 flex-col gap-4 overflow-auto">
          {!hasSelection ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border bg-surface text-sm text-muted-foreground">
              Selecione um cliente para iniciar o pedido.
            </div>
          ) : (
            <>
              {/* Selected customer card */}
              <div className="rounded-lg border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cliente Selecionado
                    </div>
                    <div className="mt-0.5 truncate text-2xl font-bold">{selected!.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selected!.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selected!.city}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={onTrocar}>
                    <X className="mr-1 h-4 w-4" />
                    Trocar
                  </Button>
                </div>
                {lastOrders.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold">Últimos pedidos:</span>
                    {lastOrders.map((o) => (
                      <span key={o.id} className="rounded-md bg-muted px-2 py-1 font-mono">
                        #{o.number} · {fmtBRL(o.total)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Items header */}
              <div className="flex items-center justify-between rounded-lg border bg-surface px-5 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  Itens Consignados
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <Button onClick={onAdd}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar item
                </Button>
              </div>

              {/* Items table */}
              <div className="overflow-hidden rounded-lg border bg-surface">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Código</th>
                      <th className="px-4 py-2.5 text-left">Descrição</th>
                      <th className="px-4 py-2.5 text-center w-16">Qtd</th>
                      <th className="px-4 py-2.5 text-center w-24">Vendida</th>
                      <th className="px-4 py-2.5 text-right w-24">Unit.</th>
                      <th className="px-4 py-2.5 text-right w-28">Subtotal</th>
                      <th className="px-4 py-2.5 text-center w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Sem itens consignados.
                        </td>
                      </tr>
                    )}
                    {items.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs">{i.code}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{i.description}</div>
                          {i.note && <div className="text-xs italic text-muted-foreground">obs: {i.note}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">{i.quantity}</td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={i.quantity}
                            value={i.sold}
                            onChange={(e) =>
                              onUpdate(i.id, { sold: Math.max(0, Math.min(i.quantity, Number(e.target.value) || 0)) })
                            }
                            className="mx-auto h-9 w-16 text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">{fmtBRL(i.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{fmtBRL(i.sold * i.unitPrice)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => onNote(i.id)}
                              title="Observação"
                            >
                              <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => onRemove(i.id)}
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Right: order summary */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-surface">
          <div className="flex flex-1 flex-col overflow-auto">
            <div className="bg-sidebar px-5 py-4 text-background">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">Resumo do Pedido</div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm">Itens</span>
                <span className="text-2xl font-bold">{totals.totalQty}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm">Total</span>
                <span className="text-3xl font-extrabold text-primary">{fmtBRL(totals.total)}</span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pagamento
                </Label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
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
                <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Responsável
                </Label>
                <Select value={responsible} onValueChange={setResponsible}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Luiz Carlos">Luiz Carlos</SelectItem>
                    <SelectItem value="Fábio Fonseca">Fábio Fonseca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Observações
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notas do pedido..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t bg-surface p-4">
            <Button className="h-12 w-full text-base font-semibold" onClick={onSave} disabled={!canSave}>
              <Save className="mr-2 h-5 w-5" />
              Salvar Pedido
            </Button>
            <Button
              className="h-12 w-full bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
              onClick={onSavePrint}
              disabled={!canSave}
            >
              <Printer className="mr-2 h-5 w-5" />
              Imprimir Canhoto
            </Button>
            <Button variant="outline" className="h-12 w-full text-base" onClick={onExport} disabled={!canSave}>
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Exportar Excel
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============== Steps ============== */

function CustomersStep({
  query,
  setQuery,
  results,
  onPick,
  onNew,
}: {
  query: string;
  setQuery: (s: string) => void;
  results: Customer[];
  onPick: (c: Customer) => void;
  onNew: () => void;
}) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 sm:p-6">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente por nome, telefone ou cidade..."
          className="h-14 rounded-xl pl-12 text-base"
        />
      </div>

      <div className="mb-3 flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Clientes <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">{results.length}</span>
        </div>
        <Button size="sm" variant="outline" className="h-9" onClick={onNew}>
          <Plus className="mr-1 h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-auto pb-6">
        {results.length === 0 && (
          <div className="rounded-xl border border-dashed bg-surface p-10 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado
          </div>
        )}
        {results.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="flex w-full items-center gap-3 rounded-xl border bg-surface px-4 py-4 text-left shadow-sm transition active:scale-[0.99] hover:border-primary/40 hover:shadow"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold">{c.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {c.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {c.city}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemsStep({
  customer,
  items,
  totals,
  onBack,
  onAdd,
  onUpdate,
  onRemove,
  onNote,
  onContinue,
}: {
  customer: Customer;
  items: ConsignedItem[];
  totals: { totalQty: number; total: number };
  onBack: () => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ConsignedItem>) => void;
  onRemove: (id: string) => void;
  onNote: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={onBack} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold leading-tight">{customer.name}</div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {customer.city}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items header */}
      <div className="border-b bg-muted/40 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" />
            Itens Consignados
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
          </div>
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar item
          </Button>
        </div>
      </div>

      {/* Cards list */}
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed bg-surface p-10 text-center text-sm text-muted-foreground">
              Sem itens consignados. Toque em <strong>Adicionar item</strong> para começar.
            </div>
          )}
          {items.map((i) => (
            <ItemCard
              key={i.id}
              item={i}
              onUpdate={(patch) => onUpdate(i.id, patch)}
              onRemove={() => onRemove(i.id)}
              onNote={() => onNote(i.id)}
            />
          ))}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Itens: {totals.totalQty}</div>
            <div className="text-2xl font-extrabold text-primary">{fmtBRL(totals.total)}</div>
          </div>
          <Button size="lg" className="h-14 flex-1 max-w-xs text-base font-semibold" onClick={onContinue}>
            Continuar <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onUpdate,
  onRemove,
  onNote,
}: {
  item: ConsignedItem;
  onUpdate: (p: Partial<ConsignedItem>) => void;
  onRemove: () => void;
  onNote: () => void;
}) {
  const setSold = (v: number) => onUpdate({ sold: Math.max(0, Math.min(item.quantity, v)) });
  const subtotal = item.sold * item.unitPrice;
  return (
    <div className="rounded-xl border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold">{item.description}</div>
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">{item.code}</div>
          {item.note && <div className="mt-1 text-xs italic text-muted-foreground">obs: {item.note}</div>}
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onNote} title="Observação">
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={onRemove} title="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-muted-foreground">
          Disponível: <span className="font-semibold text-foreground">{item.quantity}</span>
        </div>
        <div className="text-muted-foreground">
          Unit.: <span className="font-semibold text-foreground">{fmtBRL(item.unitPrice)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 p-2">
        <span className="pl-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vendida</span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11"
            onClick={() => setSold(item.sold - 1)}
            aria-label="Diminuir"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Input
            type="number"
            min={0}
            max={item.quantity}
            value={item.sold}
            onChange={(e) => setSold(Number(e.target.value) || 0)}
            className="h-11 w-16 text-center text-lg font-bold"
          />
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11"
            onClick={() => setSold(item.sold + 1)}
            aria-label="Aumentar"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-2 text-right text-sm">
        Subtotal: <span className="text-base font-bold text-primary">{fmtBRL(subtotal)}</span>
      </div>
    </div>
  );
}

function FinalizeStep({
  customer,
  totals,
  payment,
  setPayment,
  responsible,
  setResponsible,
  notes,
  setNotes,
  onBack,
  onSave,
  onSavePrint,
  onExport,
}: {
  customer: Customer;
  totals: { totalQty: number; total: number };
  payment: string;
  setPayment: (s: string) => void;
  responsible: string;
  setResponsible: (s: string) => void;
  notes: string;
  setNotes: (s: string) => void;
  onBack: () => void;
  onSave: () => void;
  onSavePrint: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onBack} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-lg font-bold leading-tight">Finalizar Pedido</div>
            <div className="text-xs text-muted-foreground">{customer.name}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Pagamento</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
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
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Luiz Carlos">Luiz Carlos</SelectItem>
                <SelectItem value="Fábio Fonseca">Fábio Fonseca</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Notas do pedido..."
            />
          </div>

          <Button variant="outline" className="h-12 w-full" onClick={onExport}>
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Itens: {totals.totalQty}</div>
            <div className="text-2xl font-extrabold text-primary">{fmtBRL(totals.total)}</div>
          </div>
          <div className="flex flex-1 max-w-md gap-2">
            <Button variant="outline" className="h-14 flex-1 text-base" onClick={onSave}>
              <Save className="mr-2 h-5 w-5" />
              Salvar
            </Button>
            <Button className="h-14 flex-1 text-base font-semibold" onClick={onSavePrint}>
              <Printer className="mr-2 h-5 w-5" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoneStep({ order, onReprint, onNew }: { order: Order; onReprint: () => void; onNew: () => void }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="rounded-full bg-success/15 p-5">
        <CheckCircle2 className="h-16 w-16 text-success" />
      </div>
      <div>
        <div className="text-2xl font-bold">Pedido #{order.number} salvo!</div>
        <div className="mt-1 text-sm text-muted-foreground">Cliente: {order.customerName}</div>
        <div className="mt-1 text-3xl font-extrabold text-primary">{fmtBRL(order.total)}</div>
      </div>
      <div className="w-full space-y-2">
        <Button variant="outline" className="h-12 w-full" onClick={onReprint}>
          <Printer className="mr-2 h-5 w-5" />
          Imprimir novamente
        </Button>
        <Button className="h-12 w-full" onClick={onNew}>
          Novo pedido
        </Button>
      </div>
    </div>
  );
}

/* ============== Dialogs (kept) ============== */

function AddItemDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (i: ConsignedItem) => void;
}) {
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (open) {
      setCode("");
      setDesc("");
      setNote("");
      setQty(1);
      setPrice(0);
    }
  }, [open]);

  const submit = (keepOpen: boolean) => {
    if (!code || !desc) {
      toast.error("Preencha código e produto");
      return;
    }
    onAdd({ id: uid(), code, description: desc, quantity: qty, sold: 0, unitPrice: price, note: note || undefined });
    if (keepOpen) {
      setCode("");
      setDesc("");
      setNote("");
      setQty(1);
      setPrice(0);
      toast.success("Item adicionado");
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar item consignado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Código</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label>Produto</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nome do produto"
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-11 w-11"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="h-11 text-center text-base font-bold"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-11 w-11"
                  onClick={() => setQty(qty + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Valor unit. (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="h-11"
              />
            </div>
          </div>
          <div>
            <Label>
              Descrição <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Anotação sobre o item..."
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => submit(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar e novo
          </Button>
          <Button onClick={() => submit(false)}>Adicionar e fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCustomerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer, items: ConsignedItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [doc, setDoc] = useState("");
  const [items, setItems] = useState<ConsignedItem[]>([]);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState("");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (open) {
      setName("");
      setPhone("");
      setCity("");
      setDoc("");
      setItems([]);
      setCode("");
      setProduct("");
      setNote("");
      setQty(1);
      setPrice(0);
    }
  }, [open]);

  const addItem = () => {
    if (!code || !product) {
      toast.error("Preencha código e produto");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        code,
        description: product,
        quantity: qty,
        sold: 0,
        unitPrice: price,
        note: note || undefined,
      },
    ]);
    setCode("");
    setProduct("");
    setNote("");
    setQty(1);
    setPrice(0);
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const customer = customersAPI.create({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      document: doc.trim() || undefined,
    });
    let finalItems = items;
    if (code && product) {
      finalItems = [
        ...items,
        {
          id: uid(),
          code,
          description: product,
          quantity: qty,
          sold: 0,
          unitPrice: price,
          note: note || undefined,
        },
      ];
    }
    consignedAPI.saveForCustomer(customer.id, finalItems);
    onCreated(customer, finalItems);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Novo cliente</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                placeholder="Nome do cliente / oficina"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
                placeholder="(31) 9..."
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11"
                placeholder="Ex: Belo Horizonte / MG"
              />
            </div>
            <div>
              <Label>CNPJ / CPF</Label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} className="h-11" />
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Adicionar itens consignados
              <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 sm:col-span-4">
                <Label className="text-xs">Código</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-10" />
              </div>
              <div className="col-span-12 sm:col-span-8">
                <Label className="text-xs">Produto</Label>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="h-10"
                  placeholder="Nome do produto"
                />
              </div>
              <div className="col-span-6">
                <Label className="text-xs">Qtd</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                  className="h-10"
                />
              </div>
              <div className="col-span-6">
                <Label className="text-xs">Valor R$</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="h-10"
                />
              </div>
              <div className="col-span-12">
                <Label className="text-xs">
                  Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Anotação sobre o item..."
                />
              </div>
              <div className="col-span-12 flex justify-end">
                <Button size="sm" variant="secondary" onClick={addItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar item à lista
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <ul className="mt-3 divide-y rounded-md border bg-surface text-sm">
                {items.map((it, idx) => (
                  <li key={it.id} className="flex items-center gap-2 px-3 py-2">
                    <span className="font-mono text-xs text-muted-foreground">{it.code}</span>
                    <span className="flex-1 truncate font-medium">{it.description}</span>
                    <span className="text-xs text-muted-foreground">
                      {it.quantity}x · {fmtBRL(it.unitPrice)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit}>
              <Save className="mr-2 h-4 w-4" />
              Criar cliente
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NoteDialog({
  open,
  item,
  onClose,
  onSave,
}: {
  open: boolean;
  item: ConsignedItem | null;
  onClose: () => void;
  onSave: (n: string) => void;
}) {
  const [note, setNote] = useState("");
  useEffect(() => {
    setNote(item?.note ?? "");
  }, [item]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Observação do item</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">{item?.description}</div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Ex: peça com avaria, devolver até sexta..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(note)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintDialog({
  open,
  order,
  onClose,
  printRef,
}: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  printRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Pré-visualização do Canhoto
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center bg-muted/40 py-4">
          {order && <ThermalReceipt ref={printRef} order={order} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
