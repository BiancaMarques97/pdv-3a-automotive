import { createFileRoute } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";

import { useOrderStore } from "@/services/order-store";
import { pedidoAPI } from "@/services/pedido-api";
import { SignaturePad } from "@/components/SignaturePad";

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

  const setPedido = useOrderStore((state) => state.setPedido);

  const assinatura = useOrderStore((state) => state.assinatura);

  const setAssinatura = useOrderStore((state) => state.setAssinatura);

  // "A Receber" exige assinatura do cliente confirmando o recebimento
  // das peças, já que o pagamento fica pendente.
  const requiresSignature = payment === "A Receber";

  // Botão só fica desabilitado quando a forma de pagamento exige
  // assinatura E ainda não tem uma capturada. Trocando pra qualquer
  // outra forma de pagamento, isso deixa de valer automaticamente
  // (já que requiresSignature vira false).
  const canFinalize = !requiresSignature || !!assinatura;

  // TOTAL

  const total = items.reduce(
    (acc, item) => acc + item.quantity * Number(item.price.replace(",", ".")),
    0,
  );

  // FINALIZAR

  async function finalizeOrder() {
    console.log(items);
    if (!customer) return;
    if (!canFinalize) return;

    const pedido = await pedidoAPI.gerarNumeroPedido();
    const dataFinalizacao = new Date().toISOString();

    const rows = items.map((item) => ({
      pedido: pedido,

      codcliente: customer.Codigo,

      nomecliente: customer.name,

      codproduto: item.product.CodProduto,

      descricao: item.product.Descricao,

      qtde: item.quantity,

      qtde_entregue: item.quantity,

      qtde_pendente: 0,

      valor_un: Number(item.price.replace(",", ".")),

      valor_total: item.quantity * Number(item.price.replace(",", ".")),

      desc_comissao: 0,

      data: dataFinalizacao,

      data_entrega: dataFinalizacao,

      responsavel: responsavel,

      reposto: item.reposto,

      pagamento: payment,

      obs: obs,

      // Só grava a assinatura de verdade quando o pagamento é "A
      // Receber" (nos outros casos fica null, já que não foi exigida).
      assinatura: requiresSignature ? assinatura : null,
    }));

    try {
      console.log("ROWS", rows);

      await pedidoAPI.createMany(rows);

      console.log("SALVOU NO SUPABASE");

      // Guarda o número oficial (ex: "PDV-0004") e a data de finalização
      // no store, pra tela de pedido-finalizado usar exatamente o mesmo
      // valor no cupom (ZPL) e no XLS, em vez de gerar um número novo.
      setPedido(pedido, dataFinalizacao);

      navigate({
        to: "/pedido-finalizado",
      });
    } catch (error) {
      console.error("ERRO SUPABASE", error);
    }
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
                  <option value="A Receber">A Receber</option>

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

              {/* ASSINATURA (só aparece quando "A Receber" está selecionado) */}

              {requiresSignature && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Assinatura do cliente <span className="text-red-500">*</span>
                  </label>

                  <SignaturePad onChange={setAssinatura} />

                  {!assinatura && (
                    <div className="mt-2 text-xs text-red-500">
                      Obrigatório assinar pra finalizar um pedido "A Receber".
                    </div>
                  )}
                </div>
              )}

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
            disabled={!canFinalize}
            className="mt-6 h-14 w-full rounded-2xl bg-orange-500/80 text-lg font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
