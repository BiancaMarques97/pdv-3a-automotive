import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/layout/button";
import { Input } from "@/components/layout/input";

import { ChevronRight, Search, Upload } from "lucide-react";

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
  document?: string;
};

function ClientesPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [menuOpen, setMenuOpen] = useState(false);

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

        <div className="flex justify-end">
          <Button className="h-12 rounded-xl">
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
              className="flex w-full items-center justify-between rounded-2xl border bg-background p-4 text-left transition hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                  👤
                </div>

                <div>
                  <div className="text-base font-semibold">
                    {customer.name} - {customer.CodCliente}
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">{customer.city}</div>

                  <div className="mt-1 text-sm text-muted-foreground">{customer.phone}</div>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
