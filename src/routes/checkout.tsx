import { createFileRoute } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";

import { useOrderStore } from "@/services/order-store";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();

  // STORE

  const customer = useOrderStore((state) => state.customer);

  const items = useOrderStore((state) => state.items);

  const payment = useOrderStore((state) => state.payment);

  const setPayment = useOrderStore((state) => state.setPayment);

  const obs = useOrderStore((state) => state.obs);

  const setObs = useOrderStore((state) => state.setObs);

  const responsavel = useOrderStore((state) => state.responsavel);

  const setResponsavel = useOrderStore((state) => state.setResponsavel);

  // TOTAL

  const total = items.reduce(
    (acc, item) => acc + item.quantity * Number(item.price.replace(",", ".")),
    0,
  );

  // FINALIZAR

  async function finalizeOrder() {
    console.log(items);
    if (!customer) return;

    const pedido = Date.now();

    const rows = items.map((item) => ({
      Pedido: pedido,

      CodCliente: customer.Codigo,

      NomeCliente: customer.name,

      CodProduto: item.product.CodProduto,

      Descricao: item.product.Descricao,

      Qtde: item.quantity,

      Qtde_Entregue: item.quantity,

      Qtde_Pendente: 0,

      Valor_Un: Number(item.price.replace(",", ".")),

      Valor_Total: item.quantity * Number(item.price.replace(",", ".")),

      Desc_Comissao: 0,

      Data: new Date().toISOString(),

      Data_Entrega: new Date().toISOString(),

      Responsavel: responsavel,

      Reposto: item.reposto,

      Pagamento: payment,

      OBS: obs,
    }));

    await fetch("http://localhost:3333/Pedido_VendaTemp", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(rows),
    });

    navigate({
      to: "/pedido-finalizado",
    });
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border bg-background p-6">
          {/* HEADER */}

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate({
                  to: "/novo-pedido/$id",

                  params: {
                    id: customer?.CodCliente || "",
                  },
                })
              }
              className="rounded-md border p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="text-2xl font-bold">Finalização</div>

              <div className="text-sm text-muted-foreground">{customer?.name}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* ESQUERDA */}

            <div className="space-y-4">
              {/* PAGAMENTO */}

              <div>
                <label className="mb-2 block text-sm font-medium">Forma de pagamento</label>

                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="h-14 w-full rounded-2xl border px-4"
                >
                  <option value="Dinheiro">Dinheiro</option>

                  <option value="Deposito Bancario">Deposito Bancário</option>

                  <option value="Boleto">Boleto</option>

                  <option value="Cheque">Cheque</option>

                  <option value="Consignado">Consignado</option>

                  <option value="PagSeguroF">PagSeguroF</option>

                  <option value="PagSeguroL">PagSeguroL</option>

                  <option value="PagSeguro3A">PagSeguro3A</option>

                  <option value="Infinit Pay">Infinit Pay</option>

                  <option value="PIX 3A">PIX 3A</option>

                  <option value="Cartao Debito">Cartao Debito</option>

                  <option value="Cartao Credito">Cartao Credito</option>

                  <option value="PIX L">PIX L</option>

                  <option value="PIX F">PIX F</option>
                </select>
              </div>

              {/* RESPONSAVEL */}

              <div>
                <label className="mb-2 block text-sm font-medium">Responsável</label>

                <select
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="h-14 w-full rounded-2xl border px-4"
                >
                  <option value="Luiz Carlos">Luiz Carlos</option>

                  <option value="Fábio Afonso">Fábio Afonso</option>
                </select>
              </div>

              {/* OBS */}

              <div>
                <label className="mb-2 block text-sm font-medium">Observações</label>

                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="min-h-32 w-full rounded-2xl border p-4"
                  placeholder="Observações"
                />
              </div>
            </div>

            {/* DIREITA */}

            <div className="rounded-3xl border bg-muted/30 p-6">
              <div className="text-lg font-bold">Resumo do pedido</div>

              <div className="mt-6 space-y-3">
                {items.map((item) => (
                  <div key={item.product.CodProduto} className="flex justify-between text-sm">
                    <span>
                      {item.quantity} x {item.product.Descricao} - {item.product.Codigo}
                    </span>
                    <span>
                      R$ {(item.quantity * Number(item.price.replace(",", "."))).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total</span>

                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={finalizeOrder}
            className="mt-6 h-14 w-full rounded-2xl bg-orange-500/80 text-lg font-semibold text-white shadow-lg"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
