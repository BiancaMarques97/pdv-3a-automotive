import logo3a from "@/assets/logo-3a.png";
import { Button } from "@/components/layout/button";
import { Input } from "@/components/layout/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, FileText, MapPin, Phone, Search, Upload, Users, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

import { customersAPI } from "@/services/customers";

export const Route = createFileRoute("/clientes")({
  component: ClientesPage,
});

type Customer = {
  CodCliente: string;
  Codigo: string;
  name: string;
  phone: string;
  city: string;
  uf: string;
  document?: string;
};

function ClientesPage() {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [menuOpen, setMenuOpen] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [pendingImport, setPendingImport] = useState<any[] | null>(null);

const [importing, setImporting] = useState(false);

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];

  if (!file) return;

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet);

  const customers = rows.map((row: any) => ({
    codigo: row.Codigo,
    razao_social: row.Razao_Social,
    nome_fantasia: row.Nome_Fantasia,
    cnpj: row.CNPJ,
    insc_estadual: row.Insc_Estadual,
    categoria: row.Categoria,
    endereco: row.Endereco,
    numero: row.Numero ? String(row.Numero).replace(/\.0$/, "") : null,
    complemento: row.Complemento,
    bairro: row.Bairro,
    cidade: row.Cidade,
    uf: row.UF,
    cep: row.CEP,
    contato: row.Contato,
    departamento: row.Departamento,
    fone: row.Fone,
    email: row.Email,
    banco1: row.Banco1,
    agencia1: row.Agencia1,
    conta1: row.Conta1,
    benef_1: row.Benef_1,
    banco2: row.Banco2,
    agencia2: row.Agencia2,
    conta2: row.Conta2,
    benef_2: row.Benef_2,
    banco3: row.Banco3,
    agencia3: row.Agencia3,
    conta3: row.Conta3,
    benef_3: row.Benef_3,
    obs: row.Obs,
    status: row.Status,
    cont: row.Cont,
    classe: row.Classe,
    consignado: row.Consignado,
  }));

  // Em vez de window.confirm, guarda os dados e abre o modal
  setPendingImport(customers);

  // Limpa o input pra permitir selecionar o mesmo arquivo de novo depois
  event.target.value = "";
}

async function confirmImport() {
  if (!pendingImport) return;

  try {
    setImporting(true);

    await customersAPI.importCustomers(pendingImport);

    await loadCustomers();

    setToast({
      type: "success",
      message:
        pendingImport.length === 1
          ? "1 cliente importado com sucesso."
          : `${pendingImport.length} clientes importados com sucesso.`,
    });
  } catch (error) {
    console.error(error);

    setToast({ type: "error", message: "Não foi possível importar os clientes. Tente novamente." });
  } finally {
    setImporting(false);
    setPendingImport(null);
  }
}

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const data = await customersAPI.list();

    setCustomers(data);
  }

  const filtered = customers.filter((c) =>
    [c.name, c.Codigo, c.phone, c.city].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* HEADER */}

      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => setMenuOpen(true)} className="rounded-md border p-2">
            ☰
          </button>

          <div>
            <div className="font-bold">3A AUTOMOTIVE</div>

            <div className="text-xs text-muted-foreground">CLIENTES</div>
          </div>
        </div>
      </div>

      {/* MENU */}

      {menuOpen && (
        <>
          {/* BACKDROP */}

          <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/40" />

          {/* SIDEBAR */}

          <div className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-white p-4 shadow-xl">
            {" "}
            <div className="mb-8 flex items-start justify-between">
              {" "}
              <div className="flex w-full flex-col items-center">
                {" "}
                <img
                  src={logo3a}
                  alt="3A Automotive"
                  className="mb-4 h-28 w-28 object-contain"
                />{" "}
              </div>{" "}
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
              >
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <div className="flex flex-col gap-3">
              {" "}
              <button
                onClick={() => {
                  navigate({ to: "/clientes" });
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl bg-[#F28C38] px-5 py-4 text-left font-medium text-white shadow-sm transition"
              >
                {" "}
                <Users size={20} /> Clientes{" "}
              </button>{" "}
              <button
                onClick={() => {
                  navigate({ to: "/historico" });
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                {" "}
                <FileText size={20} /> Histórico{" "}
              </button>{" "}
            </div>{" "}
          </div>
        </>
      )}

      {/* CONTENT */}

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        {/* SEARCH */}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente por nome, telefone ou cidade..."
            className="h-14 rounded-xl pl-12 text-base"
          />
        </div>

        {/* ACTIONS */}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImport}
        />

        <div className="flex justify-end">
          <Button className="h-12 rounded-xl" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Clientes
          </Button>
        </div>

        {/* LIST */}

        <div className="space-y-3">
          {filtered.map((customer) => (
            <button
              key={customer.CodCliente}
              onClick={() =>
                navigate({
                  to: "/cliente/$id",
                  params: {
                    id: String(customer.CodCliente),
                  },
                })
              }
              className="flex w-full items-center justify-between rounded-2xl border bg-background p-4 text-left transition hover:bg-muted/50 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-200 text-orange-500">
                  👤
                </div>

                <div>
                  <div className="text-base font-semibold">
                    {customer.name} - {customer.CodCliente}
                  </div>

                  <div className="mt-1 flex gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {customer.city} - {customer.uf}
                  </div>

                  <div className="mt-1 flex gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        </div>

      {toast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
            {toast.type === "success" ? (
              <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-20 w-20 text-red-500" />
            )}

            <div className="mt-5 text-2xl font-bold">
              {toast.type === "success" ? "Sucesso!" : "Erro"}
            </div>

            <div className="mt-2 text-base text-muted-foreground">
              {toast.message}
            </div>

            <button
              onClick={() => setToast(null)}
              className="mt-6 w-full rounded-2xl p-4 text-lg font-semibold text-white shadow-sm bg-orange-500/80"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {pendingImport && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
      <Upload className="mx-auto h-10 w-10 text-orange-500" />

      <div className="mt-5 text-2xl font-bold">Confirmar importação</div>

      <div className="mt-2 text-lg text-muted-foreground">
        {pendingImport.length === 1
          ? "Deseja importar 1 cliente?"
          : `Deseja importar ${pendingImport.length} clientes?`}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setPendingImport(null)}
          disabled={importing}
          className="flex-1 rounded-2xl border p-4 text-lg font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={confirmImport}
          disabled={importing}
          className="flex-1 rounded-2xl bg-orange-500/80 p-4 text-lg font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
        >
          {importing ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
    