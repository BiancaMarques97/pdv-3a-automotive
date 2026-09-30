import logo3a from "@/assets/logo-3a.png";
import { Button } from "@/components/layout/button";
import { Input } from "@/components/layout/input";
import { AuthGuard } from "@/components/AuthGuard";
import { Spinner } from "@/components/Spinner";
import { requireAuth } from "@/lib/auth";
import { consignadosAPI, type ClienteConsignado } from "@/services/consignados-api";
import { supabase } from "@/services/supabase";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2, FileText, LogOut, MapPin, Route as RouteIcon,
  Search, Upload, Users, WalletCards, X, XCircle,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/consignado")({
  beforeLoad: requireAuth,
  component: ConsignadosPage,
});

function normalizarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarBusca(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizarValor(valor: unknown): number {
  if (valor == null || valor === "") return 0;
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  let texto = normalizarTexto(valor).replace(/R\$/gi, "").replace(/\s/g, "");
  if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);
  if (!Number.isFinite(numero)) throw new Error(`Valor inválido: ${String(valor)}`);
  return numero;
}

function dataISO(ano: number, mes: number, dia: number): string {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    throw new Error("Data da visita inválida.");
  }
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function converterDataExcel(valor: unknown, date1904: boolean): string | null {
  if (valor == null || normalizarTexto(valor) === "") return null;
  if (typeof valor === "number") {
    const data = XLSX.SSF.parse_date_code(valor, { date1904 });
    if (!data) throw new Error("Data da visita inválida.");
    return dataISO(data.y, data.m, data.d);
  }
  const texto = normalizarTexto(valor);
  const brasileira = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brasileira) return dataISO(Number(brasileira[3]), Number(brasileira[2]), Number(brasileira[1]));
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return dataISO(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  throw new Error(`Data da visita inválida: ${texto}`);
}

function normalizarRota(valor: unknown) {
  const texto = normalizarTexto(valor).toUpperCase();
  const numero = texto.match(/^(?:ROTA\s*|R\s*)?0*(\d+)$/);
  return numero ? `R${Number(numero[1])}` : texto;
}

function formatarValor(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ConsignadosPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState<ClienteConsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<ClienteConsignado[] | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let active = true;
    consignadosAPI.list()
      .then((data) => { if (active) setClientes(data); })
      .catch((error) => {
        console.error(error);
        if (active) setToast({ type: "error", message: "Não foi possível carregar os clientes consignados." });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setToast({ type: "error", message: "Não foi possível sair. Tente novamente." });
      return;
    }
    navigate({ to: "/login" });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("A planilha está vazia.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!rows.length) throw new Error("A planilha está vazia.");
      const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
      const importados: ClienteConsignado[] = [];
      const codigos = new Set<string>();
      for (const [index, original] of rows.entries()) {
        const row: Record<string, unknown> = {};
        for (const [chave, valor] of Object.entries(original)) {
          row[normalizarBusca(chave.trim()).replace(/[\s_]+/g, "")] = valor;
        }
        const cliente = normalizarTexto(row.cliente);
        const nome = normalizarTexto(row.nome);
        // Ignora linhas de totais/rodapés sem código de cliente.
        if (!cliente) continue;
        if (!nome) throw new Error(`Cliente ${cliente}: nome não informado (linha ${index + 2}).`);
        if (codigos.has(cliente)) throw new Error(`O cliente ${cliente} aparece mais de uma vez na planilha.`);
        codigos.add(cliente);
        const qtde = normalizarValor(row.qtde);
        if (!Number.isInteger(qtde) || qtde < 0) throw new Error(`Quantidade inválida para ${cliente}.`);
        try {
          importados.push({
            cliente, nome, qtde,
            valor: normalizarValor(row.valor),
            pedidos: normalizarTexto(row.pedidos),
            data_visita: converterDataExcel(row.datavisita, date1904),
            cidade: normalizarTexto(row.cidade),
            rota: normalizarRota(row.rota),
          });
        } catch (error) {
          throw new Error(`${cliente}: ${error instanceof Error ? error.message : "Dados inválidos."}`);
        }
      }
      if (!importados.length) throw new Error("Nenhum cliente válido encontrado. Verifique as colunas Cliente e Nome.");
      setPendingImport(importados);
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: error instanceof Error ? error.message : "Não foi possível ler a planilha." });
    } finally {
      input.value = "";
    }
  }

  async function confirmImport() {
    if (!pendingImport || importing) return;
    const quantidade = pendingImport.length;
    setImporting(true);
    try {
      await consignadosAPI.importClientes(pendingImport);
      setPendingImport(null);
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Não foi possível importar. Confira a tabela e as permissões no Supabase." });
      setImporting(false);
      return;
    }
    try {
      setClientes(await consignadosAPI.list());
      setToast({ type: "success", message: `${quantidade} cliente(s) consignado(s) importado(s) com sucesso.` });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Os dados foram importados, mas a lista não pôde ser atualizada. Recarregue a página." });
    } finally {
      setImporting(false);
    }
  }

  const termo = normalizarBusca(query.trim());
  const filtered = clientes.filter((cliente) => normalizarBusca([
    cliente.cliente, cliente.nome, cliente.cidade, cliente.rota, cliente.pedidos,
  ].join(" ")).includes(termo)).sort((a, b) => {
    const rota = (a.rota || "").localeCompare(b.rota || "", "pt-BR", { numeric: true });
    return rota || a.cliente.localeCompare(b.cliente, "pt-BR", { numeric: true });
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-muted/30">
        <div className="sticky top-0 z-20 border-b bg-background">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="cursor-pointer rounded-md border p-2">☰</button>
            <div><div className="font-bold">3A AUTOMOTIVE</div><div className="text-sm text-muted-foreground">CONSIGNADOS</div></div>
          </div>
        </div>

        {menuOpen && <>
          <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/40" />
          <div className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-white p-4 shadow-xl">
            <div className="mb-8 flex items-start justify-between">
              <div className="flex w-full flex-col items-center"><img src={logo3a} alt="3A Automotive" className="mb-4 h-28 w-28 object-contain" /></div>
              <button onClick={() => setMenuOpen(false)} aria-label="Fechar menu" className="cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-zinc-100"><X size={18} /></button>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <button onClick={() => { navigate({ to: "/clientes" }); setMenuOpen(false); }} className="flex cursor-pointer items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-zinc-600 transition hover:bg-zinc-100"><Users size={20} />Clientes</button>
              <button onClick={() => { navigate({ to: "/historico" }); setMenuOpen(false); }} className="flex cursor-pointer items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-zinc-600 transition hover:bg-zinc-100"><FileText size={20} />Histórico</button>
              <button onClick={() => setMenuOpen(false)} aria-current="page" className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#F28C38] px-5 py-4 text-left font-medium text-white shadow-sm"><WalletCards size={20} />Consignados</button>
              <button onClick={handleLogout} className="mt-auto flex cursor-pointer items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-red-600 transition hover:bg-red-50"><LogOut size={20} />Sair</button>
            </div>
          </div>
        </>}

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <div className="flex flex-col-reverse gap-4 md:flex-col">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, código, cidade, rota ou pedido..." aria-label="Buscar consignados" className="h-14 rounded-xl pl-12 text-base" />
            </div>
            <Button disabled={importing} className="h-12 w-full cursor-pointer rounded-2xl bg-[#F28C38] hover:bg-orange-400" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Importar Clientes Consignados</Button>
          </div>
          {loading ? <Spinner label="Carregando consignados..." /> : <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {filtered.length === 0 && <div className="col-span-full rounded-2xl border bg-background p-8 text-center text-muted-foreground shadow-sm">Nenhum cliente consignado encontrado.</div>}
            {filtered.map((cliente) => <div key={cliente.cliente} className="w-full rounded-2xl border bg-background p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xl">👤</div>
                <div className="min-w-0 flex-1">
                  <div className="break-words text-md font-semibold">{cliente.nome} - {cliente.cliente}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 text-red-700" /><div className="font-normal text-black">{cliente.cidade || "Não informado"}</div></div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><RouteIcon className="h-4 w-4 shrink-0" /><strong className=" text-blue-700">{normalizarRota(cliente.rota) || "Sem rota"}</strong></div>
                  </div>
                  <div className="mt-3"><div className="text-sm text-muted-foreground">Pedidos</div><div className="mt-1 break-words text-md font-semibold">{cliente.pedidos || "Nenhum pedido informado"}</div></div>
                  <div className="mt-3"><div className="text-sm text-muted-foreground">Valor devedor</div><div className="text-lg font-bold text-orange-500">{formatarValor(cliente.valor)}</div></div>
                </div>
              </div>
            </div>)}
          </div>}
        </div>

        {pendingImport && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="import-title" className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
            <Upload className="mx-auto h-16 w-16 text-[#F28C38]" />
            <div id="import-title" className="mt-5 text-2xl font-bold">Confirmar importação</div>
            <div className="mt-2 text-lg text-muted-foreground">Deseja importar {pendingImport.length} cliente(s) consignado(s)?</div>
            <p className="mt-2 text-sm text-muted-foreground">Clientes com o mesmo código serão atualizados.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setPendingImport(null)} disabled={importing} className="flex-1 cursor-pointer rounded-2xl border p-4 text-lg font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmImport} disabled={importing} className="flex-1 cursor-pointer rounded-2xl bg-[#F28C38] p-4 text-lg font-semibold text-white shadow-sm hover:bg-orange-400 disabled:opacity-50">{importing ? "Importando..." : "Importar"}</button>
            </div>
          </div>
        </div>}
        {toast && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="toast-title" className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
            {toast.type === "success" ? <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" /> : <XCircle className="mx-auto h-20 w-20 text-red-500" />}
            <div id="toast-title" className="mt-5 text-2xl font-bold">{toast.type === "success" ? "Sucesso!" : "Erro"}</div>
            <div className="mt-2 text-base text-muted-foreground">{toast.message}</div>
            <button onClick={() => setToast(null)} className="mt-6 w-full cursor-pointer rounded-2xl bg-[#F28C38] p-4 text-lg font-semibold text-white shadow-sm">OK</button>
          </div>
        </div>}
      </div>
    </AuthGuard>
  );
}
