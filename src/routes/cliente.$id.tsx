import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ArrowLeft, FileText, Mail, MapPin, Phone, Plus } from "lucide-react";

import { useEffect, useState } from "react";

import { Button } from "@/components/layout/button";

import { customersAPI } from "@/services/customers";

export const Route = createFileRoute("/cliente/$id")({
  component: ClientePage,
});

type Customer = {
  CodCliente: string;

  Codigo: string;

  name: string;

  phone: string;

  city: string;

  email: string;

  document?: string;

  endereco: string;

  numero: number;

  complemento: string;

  bairro: string;

  uf: string;

  cep: string;
};

type Order = {
  Pedido: number;

  total: number;

  createdAt: string;
};

function ClientePage() {
  const navigate = useNavigate();

  const { id } = Route.useParams();

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function loadCustomer() {
    const customers = await customersAPI.list();

    const found = customers.find((c) => String(c.CodCliente) === id);

    if (!found) return;

    setCustomer(found);
  }

  if (!customer) {
    return <div className="p-10">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* HEADER */}

      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() =>
              navigate({
                to: "/clientes",
              })
            }
            className="rounded-md border p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="font-bold">Cliente</div>

            <div className="text-xs text-muted-foreground">DADOS CADASTRADOS</div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        {/* CLIENT */}

        <div className="rounded-3xl border bg-background p-6 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-bold">
                {customer.name} - {customer.Codigo}
              </div>

              <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />

                  {customer.document || "Sem documento"}
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />

                  {customer.phone}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />

                  {customer.city}
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />

                  {customer.email}
                </div>
              </div>
              <h1 className="mt-4 text-black font-semibold">Endereço</h1>
              <div className="mt-2 grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground">
                <div className="flex w-full">
                  {customer.endereco} - {Number(customer.numero)}
                </div>

                <div className="flex gap-2">
                  <h2 className="font-semibold ">Complemento: </h2>
                  {customer.complemento || "---"}
                </div>

                <div className="flex gap-2">
                  <h2 className="font-semibold">Bairro: </h2>
                  {customer.bairro}
                </div>

                <div className="flex gap-2">
                  <h2 className="font-semibold">Cidade: </h2>
                  {customer.city}
                </div>

                <div className="flex gap-2">
                  <h2 className="font-semibold">UF: </h2>
                  {customer.uf}
                </div>

                <div className="flex gap-2">
                  <h2 className="font-semibold">CEP: </h2>
                  {customer.cep}
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate({
                to: "/novo-pedido/$id",

                params: {
                  id: String(customer.CodCliente),
                },
              })
            }
            className="mt-6 h-14 w-full rounded-2xl text-base"
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Pedido
          </Button>
        </div>

        {/* HISTORY */}

        {/* <div className="rounded-3xl border bg-background p-6">
          <div className="mb-4 text-lg font-bold">Últimos pedidos</div>

          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.Pedido}
                className="flex w-full items-center justify-between rounded-2xl border p-4 text-left hover:bg-muted/40"
              >
                <div>
                  <div className="font-semibold">Pedido #{order.Pedido}</div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="font-bold">R$ {order.total.toFixed(2)}</div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
