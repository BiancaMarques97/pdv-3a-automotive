import logo3a from "@/assets/logo-3a.png";
import { sendOrderEmail } from "@/services/send-order-email";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ZebraBluetoothService } from "@/components/zebra-bluetooth";
import { buildReceiptZPL } from "@/components/Receipt zpl";

import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileDownIcon,
  FileSpreadsheet,
  FileText,
  Mail,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { pedidoAPI } from "@/services/pedido-api";

import { ThermalReceipt } from "@/components/ThermalReceipt";

import { exportOrderXLS } from "@/lib/export-order-xls";

export const Route = createFileRoute("/historico")({
  component: HistoricoPage,
});

function HistoricoPage() {
  const navigate = useNavigate();

  // useRef em vez de criar direto no corpo do componente: assim a MESMA
  // instância (e a conexão Bluetooth que ela guarda) sobrevive entre
  // re-renderizações da tela, em vez de recriar do zero toda hora.
  const zebraRef = useRef<ZebraBluetoothService | null>(null);
  if (!zebraRef.current) {
    zebraRef.current = new ZebraBluetoothService();
  }
  const zebra = zebraRef.current;

  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await pedidoAPI.list();

        setOrders(data || []);
      } catch (error) {
        console.error(error);
      }
    }

    load();
  }, []);

const [sendingId, setSendingId] = useState<string | null>(null);

async function reprintReceipt() {
    console.log("Entrou no printReceipt");
  if (!selectedOrder) return;

  try {
    
    await zebra.connect();

    const zpl = buildReceiptZPL({
      customer: {
        Codigo: selectedOrder.items[0]?.codcliente,
        name: selectedOrder.nomecliente,
      },

      items: selectedOrder.items.map((item: any) => ({
        quantity: item.qtde,
        price: String(item.valor_un),
        reposto: item.reposto,
        product: {
          CodProduto: item.codproduto,
          Codigo: item.codproduto,
          Descricao: item.descricao,
          Valor_Un: Number(item.valor_un),
        },
      })),

      payment: selectedOrder.pagamento,
      obs: selectedOrder.items[0]?.obs || "",
      responsavel: selectedOrder.items[0]?.responsavel || "",
      pedido: selectedOrder.pedido,
      data: selectedOrder.data,
    });

    const sgdContinuous =
      '! U1 setvar "ezpl.media_type" "continuous"\n';

    await zebra.print(sgdContinuous + zpl);

  } catch (err) {
    console.error(err);
    alert("Erro ao imprimir.");
  }
}

async function handleSendEmail(order: any) {
  try {
    setSendingId(order.pedido);

    await sendOrderEmail({
      data: {
        pedido: order.pedido,
        nomecliente: order.nomecliente,
        pagamento: order.pagamento,
        data: order.data,
        total: order.total,
        items: order.items,
      },
    });

    setToast({ type: "success", message: "O pedido foi enviado por e-mail com sucesso." });
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível enviar o e-mail. Tente novamente." });
  } finally {
    setSendingId(null);
  }
}
  const groupedOrders = useMemo(
    () =>
      Object.values(
        orders.reduce((acc: any, item: any) => {
          if (!acc[item.pedido]) {
            acc[item.pedido] = {
              pedido: item.pedido,
              nomecliente: item.nomecliente,
              pagamento: item.pagamento,
              data: item.data,
              total: 0,
              items: [],
            };
          }

          acc[item.pedido].total += Number(item.valor_total);

          acc[item.pedido].items.push(item);

          return acc;
        }, {}),
      ),
    [orders],
  );

  const filteredOrders = groupedOrders.filter((order: any) => {
    const term = search.toLowerCase().trim();

    if (!term) return true;

    const codigoCliente = String(
      order.items?.[0]?.codcliente || "",
    ).toLowerCase();

    return (
      String(order.pedido).toLowerCase().includes(term) ||
      String(order.pagamento).toLowerCase().includes(term) ||
      String(order.nomecliente).toLowerCase().includes(term) ||
      codigoCliente.includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-md border p-2"
          >
            ☰
          </button>

          <div>
            <div className="font-bold">3A AUTOMOTIVE</div>

            <div className="text-xs text-muted-foreground">
              HISTÓRICO
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />

            <div className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-white p-4 shadow-xl">
              <div className="mb-8 flex items-start justify-between">
                <div className="flex w-full flex-col items-center">
                  <img
                    src={logo3a}
                    alt="3A Automotive"
                    className="mb-4 h-28 w-28 object-contain"
                  />
                </div>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate({ to: "/clientes" });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-zinc-600 transition hover:bg-zinc-100"
                >
                  <Users size={20} />
                  Clientes
                </button>

                <button
                  onClick={() => {
                    navigate({ to: "/historico" });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl bg-[#F28C38] px-5 py-4 text-left font-medium text-white shadow-sm transition"
                >
                  <FileText size={20} />
                  Histórico
                </button>
              </div>
            </div>
          </>
        )}

        <div className="p-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por pedido, cliente ou código"
            className="h-12 w-full rounded-2xl border bg-background px-4 shadow-sm"
          />
        </div>

        {filteredOrders.length === 0 && (
          <div className="m-10 mt-5 rounded-3xl border bg-background p-10 text-center text-muted-foreground shadow-md">
            Nenhum pedido encontrado
          </div>
        )}

        <div className="m-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ">
          {filteredOrders.map((order: any) => (
            <div
              key={order.pedido}
              className="rounded-3xl border bg-background p-5 shadow-md"
            >
              <div className="text-lg font-bold">
                {order.nomecliente} - {order.items?.[0]?.codcliente}
              </div>

               <div className="mt-3">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                  #{order.pedido}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {new Date(order.data).toLocaleString("pt-BR")}
              </div>

              <div className="mt-5">
                <div className="text-sm text-muted-foreground">
                  Total
                </div>

                <div className="text-2xl font-bold">
                  R$ {order.total.toFixed(2)}
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                {order.pagamento}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex flex-1 items-center justify-center gap-2  border-[1.5px] rounded-2xl bg-orange-500/80 text-sm font-semibold text-white p-3 cursor-pointer hover:bg-orange-500 shadow-sm"
                >
                  <Eye className="h-5 w-5" />
                  Visualizar
                </button>

                <button
                  onClick={() => exportOrderXLS(order)}
                  className="flex flex-1 items-center justify-center gap-2  border-[1.5px] rounded-2xl bg-orange-500/80 text-sm font-semibold text-white p-3 cursor-pointer hover:bg-orange-500 shadow-sm"
                >
                  <FileDownIcon className="h-5 w-5" /> Baixar XML
                </button>

                



<button
                    onClick={() => handleSendEmail(order)}
  disabled={sendingId === order.pedido}
                  className="flex flex-1 items-center justify-center gap-2  border-[1.5px] rounded-2xl bg-orange-500/80 text-sm font-semibold text-white p-3 cursor-pointer hover:bg-orange-500 shadow-sm"
                >
                  <Mail className="h-5 w-5" /> Enviar XML por Email
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    {selectedOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] overflow-auto rounded-3xl bg-white p-4">
      <ThermalReceipt
        customer={{
          Codigo: selectedOrder.items[0]?.codcliente,
          name: selectedOrder.nomecliente,
        }}
        items={selectedOrder.items.map((item: any) => ({
          quantity: item.qtde,
          price: String(item.valor_un),
          reposto: item.reposto,
          product: {
            CodProduto: item.codproduto,
            Codigo: item.codproduto,
            Descricao: item.descricao,
          },
        }))}
        payment={selectedOrder.pagamento}
        obs={selectedOrder.items[0]?.obs || ""}
        responsavel={selectedOrder.items[0]?.responsavel || ""}
        pedido={selectedOrder.pedido}
        data={selectedOrder.data}
        assinatura={selectedOrder.items[0]?.assinatura}
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setSelectedOrder(null)}
          className="flex-1 rounded-2xl border p-3 cursor-pointer"
        >
          Cancelar
        </button>

        <button
          onClick={reprintReceipt}
          className="flex-1 rounded-2xl bg-orange-500/80 p-3 font-semibold text-white cursor-pointer hover:bg-orange-500 shadow-sm"
        >
          Imprimir
        </button>
      </div>
    </div>
  </div>
)}

           {toast && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
      {toast.type === "success" ? (
        <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" />
      ) : (
        <XCircle className="mx-auto h-20 w-20 text-red-500" />
      )}

      <div className="mt-5 text-2xl font-bold">
        {toast.type === "success" ? "Enviado!" : "Erro"}
      </div>

      <div className="mt-2 text-lg text-muted-foreground">
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
    </div>
  );
}
