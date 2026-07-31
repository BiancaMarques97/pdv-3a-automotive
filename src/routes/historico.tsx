import logo3a from "@/assets/logo-3a.png";
import { sendOrderEmail } from "@/services/send-order-email";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ZebraBluetoothService } from "@/components/zebra-bluetooth";
import { buildReceiptZPL } from "@/components/Receipt zpl";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Spinner } from "@/components/Spinner";

import {
  Calendar,
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
  Trash2,
  Pencil,
  LogOut
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { pedidoAPI } from "@/services/pedido-api";

import { ThermalReceipt } from "@/components/ThermalReceipt";

import { exportOrderXLS, exportOrdersByPeriodXLS } from "@/lib/export-order-xls";
import { requireAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/services/supabase";
import { OrderCard } from "@/components/OrderCard";

export const Route = createFileRoute("/historico")({
   beforeLoad: requireAuth,
  component: HistoricoPage,
});

function HistoricoPage() {
  const navigate = useNavigate();

    async function handleLogout() {
    await supabase.auth.signOut();
  
    navigate({
      to: "/login",
    });
  }

  const zebraRef = useRef<ZebraBluetoothService | null>(null);
  if (!zebraRef.current) {
    zebraRef.current = new ZebraBluetoothService();
  }
  const zebra = zebraRef.current;
  const receiptRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
const [deleting, setDeleting] = useState(false);
const [periodModalOpen, setPeriodModalOpen] = useState(false);
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [editingOrder, setEditingOrder] = useState<any>(null);
const [editObs, setEditObs] = useState("");
const [savingEdit, setSavingEdit] = useState(false);
const [loadingOrders, setLoadingOrders] = useState(true);

 useEffect(() => {
  async function load() {
    try {
      const data = await pedidoAPI.list();

      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  }

  load();
}, []);

const [sendingId, setSendingId] = useState<string | null>(null);

function openEditObs(order: any) {
  setEditingOrder(order);
  setEditObs(order.items?.[0]?.obs || "");
}

async function saveEditObs() {
  if (!editingOrder) return;

  try {
    setSavingEdit(true);

    await pedidoAPI.updateObs(editingOrder.pedido, editObs);

    // Atualiza tanto a lista quanto o pedido aberto no modal de visualização,
    // pra refletir na hora sem precisar fechar e abrir de novo
    const updateItemsObs = (order: any) => ({
      ...order,
      items: order.items.map((item: any) => ({ ...item, obs: editObs })),
    });

    setOrders((prev) =>
      prev.map((item: any) =>
        item.pedido === editingOrder.pedido ? { ...item, obs: editObs } : item,
      ),
    );

    setSelectedOrder((prev: any) =>
      prev && prev.pedido === editingOrder.pedido ? updateItemsObs(prev) : prev,
    );

    setToast({ type: "success", message: "Observação atualizada com sucesso." });
    setEditingOrder(null);
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível salvar a alteração. Tente novamente." });
  } finally {
    setSavingEdit(false);
  }
}

async function reprintReceipt() {
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

    const sgdContinuous = '! U1 setvar "ezpl.media_type" "continuous"\n';

    await zebra.print(sgdContinuous + zpl);

    setToast({ type: "success", message: "Cupom enviado para impressão." });
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível imprimir via Bluetooth. Verifique a conexão com a impressora." });
  }
}

async function downloadReceiptPDF() {
  if (!receiptRef.current || !selectedOrder) return;

  try {
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      width: receiptRef.current.scrollWidth,
      windowWidth: receiptRef.current.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdfWidthMm = 80;
    const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidthMm, pdfHeightMm],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
   pdf.save(`${selectedOrder.pedido}-${selectedOrder.items[0]?.codcliente ?? ""}.pdf`);
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível gerar o PDF. Tente novamente." });
  }
}

function handleExportByPeriod() {
  if (!startDate || !endDate) {
    setToast({ type: "error", message: "Selecione a data inicial e a data final." });
    return;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);

  const ordersInRange = groupedOrders.filter((order: any) => {
    const orderDate = new Date(order.data);
    return orderDate >= start && orderDate <= end;
  });

  if (ordersInRange.length === 0) {
    setToast({ type: "error", message: "Nenhum pedido encontrado nesse período." });
    return;
  }

  const startLabel = startDate.split("-").reverse().join("-");
  const endLabel = endDate.split("-").reverse().join("-");

  exportOrdersByPeriodXLS(ordersInRange, startLabel, endLabel);

  setPeriodModalOpen(false);
  setToast({
    type: "success",
    message: `${ordersInRange.length} pedido(s) exportado(s) com sucesso.`,
  });
}

// useCallback: mantém a mesma referência de função entre renders, pra não
// quebrar a memoização do OrderCard (sem isso, o React acha que a prop
// "mudou" a cada render do HistoricoPage e o memo() do card não faz efeito)
const handleSendEmail = useCallback(async (order: any) => {
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

    await pedidoAPI.markEmailSent(order.pedido);

    setOrders((prev) =>
      prev.map((item: any) =>
        item.pedido === order.pedido ? { ...item, email_enviado: true } : item
      ),
    );

    setToast({ type: "success", message: "O pedido foi enviado por e-mail com sucesso." });
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível enviar o e-mail. Tente novamente." });
  } finally {
    setSendingId(null);
  }
}, []);

const handleView = useCallback((order: any) => setSelectedOrder(order), []);
const handleDelete = useCallback((order: any) => setOrderToDelete(order), []);
const handleExportXLS = useCallback((order: any) => exportOrderXLS(order), []);

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
            emailEnviado: item.email_enviado ?? false,
          };
        }

        acc[item.pedido].total += Number(item.valor_total);

        acc[item.pedido].items.push(item);

        return acc;
      }, {}),
    ).sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()),
  [orders],
);

  // useMemo: só recalcula o filtro quando "orders" ou "search" mudam de
  // verdade — antes rodava em TODO re-render (abrir toast, modal, menu...)
  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return groupedOrders;

    return groupedOrders.filter((order: any) => {
      const codigoCliente = String(order.items?.[0]?.codcliente || "").toLowerCase();

      return (
        String(order.pedido).toLowerCase().includes(term) ||
        String(order.pagamento).toLowerCase().includes(term) ||
        String(order.nomecliente).toLowerCase().includes(term) ||
        codigoCliente.includes(term)
      );
    });
  }, [groupedOrders, search]);

  async function confirmDelete() {
  if (!orderToDelete) return;

  try {
    setDeleting(true);

    await pedidoAPI.deleteByPedido(orderToDelete.pedido);

    setOrders((prev) => prev.filter((item: any) => item.pedido !== orderToDelete.pedido));

    setToast({ type: "success", message: "O pedido foi excluído permanentemente!" });
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível excluir o pedido. Tente novamente!" });
  } finally {
    setDeleting(false);
    setOrderToDelete(null);
  }
}
  return (
    <AuthGuard>
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

              <div className="flex flex-1 flex-col gap-3">
                <button
                  onClick={() => {
                    navigate({ to: "/clientes" });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-zinc-600 transition hover:bg-zinc-100 cursor-pointer"
                >
                  <Users size={20} />
                  Clientes
                </button>

                <button
                  onClick={() => {
                    navigate({ to: "/historico" });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl bg-[#F28C38] px-5 py-4 text-left font-medium text-white shadow-sm transition cursor-pointer"
                >
                  <FileText size={20} />
                  Histórico
                </button>

                  <button
  onClick={handleLogout}
  className="mt-auto flex items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
>
  <LogOut size={20} />
  Sair
</button>
              </div>
            </div>
          </>
        )}

     <div className="p-5 flex flex-col-reverse gap-3 md:flex-row">
  <div className="relative flex-1">
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Buscar por pedido, cliente ou código"
      className="h-12 w-full rounded-2xl border bg-background px-4 shadow-sm"
    />
  </div>

  <button
    onClick={() => setPeriodModalOpen(true)}
    className="flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] bg-orange-500/80 px-5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 cursor-pointer"
  >
    <Calendar className="h-5 w-5" />
    Baixar XLS por Período
  </button>
</div>

       {loadingOrders ? (
  <Spinner label="Carregando pedidos..." />
) : (
  <>
    {filteredOrders.length === 0 && (
      <div className="m-10 mt-5 rounded-3xl border bg-background p-10 text-center text-muted-foreground shadow-md">
        Nenhum pedido encontrado
      </div>
    )}

    <div className="m-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredOrders.map((order: any) => (
        <OrderCard
          key={order.pedido}
          order={order}
          sendingEmail={sendingId === order.pedido}
          onView={handleView}
          onDelete={handleDelete}
          onExportXLS={handleExportXLS}
          onSendEmail={handleSendEmail}
        />
      ))}
    </div>
  </>
)}

        <div className="m-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order: any) => (
            <OrderCard
              key={order.pedido}
              order={order}
              sendingEmail={sendingId === order.pedido}
              onView={handleView}
              onDelete={handleDelete}
              onExportXLS={handleExportXLS}
              onSendEmail={handleSendEmail}
            />
          ))}
        </div>
      </div>

  {selectedOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] overflow-auto rounded-3xl bg-white p-4">

        <button
        onClick={() => setSelectedOrder(null)}
        className="sticky top-0 right-0 float-right z-10 -mr-1 -mt-1 mb-3 rounded-full bg-zinc-200/70 p-2 text-zinc-500 hover:bg-zinc-200 cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

 <div className="mb-3 flex justify-end gap-2 clear-both">
  <button
    onClick={() => openEditObs(selectedOrder)}
    className="flex items-center gap-2 rounded-full bg-orange-500/90 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-500 cursor-pointer"
  >
    <Pencil className="h-4 w-4" />
    Editar Obs.
  </button>

  <button
    onClick={downloadReceiptPDF}
    className="flex items-center gap-2 rounded-full bg-orange-500/90 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-orange-500 cursor-pointer"
  >
    <FileDownIcon className="h-4 w-4" />
    Baixar PDF
  </button>
</div>
      <div ref={receiptRef}>
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
      </div>

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

{editingOrder && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
      <div className="mb-1 text-xl font-bold">Editar Observações - {editingOrder.pedido}</div>
      <div className="mb-6 text-sm text-muted-foreground">{editingOrder.nomecliente}-{editingOrder.items?.[0]?.codcliente}</div>

      <div className="space-y-4">

        <div>
          <label className="mb-2 block text-md font-medium">Observações</label>
          <textarea
            value={editObs}
            onChange={(e) => setEditObs(e.target.value)}
            className="min-h-32 w-full rounded-2xl border p-4"
            placeholder="Digite as observações do pedido aqui..."
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setEditingOrder(null)}
          disabled={savingEdit}
          className="flex-1 rounded-2xl border p-4 font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={saveEditObs}
          disabled={savingEdit}
          className="flex-1 rounded-2xl bg-orange-500/80 p-4 font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
        >
          {savingEdit ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  </div>
)}

           {toast && (
  <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
      {toast.type === "success" ? (
        <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" />
      ) : (
        <XCircle className="mx-auto h-20 w-20 text-red-500" />
      )}

      <div className="mt-5 text-2xl font-bold">
        {toast.type === "success" ? "Sucesso!" : "Erro"}
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

{orderToDelete && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
      <Trash2 className="mx-auto h-16 w-16 text-red-500" />

      <div className="mt-5 text-2xl font-bold">Excluir pedido?</div>

      <div className="mt-2 text-base text-muted-foreground">
        O pedido <strong>{orderToDelete.pedido}</strong> ({orderToDelete.nomecliente}) será
        excluído permanentemente. Essa ação não pode ser desfeita.
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setOrderToDelete(null)}
          disabled={deleting}
          className="flex-1 rounded-2xl border p-4 text-lg font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={confirmDelete}
          disabled={deleting}
          className="flex-1 rounded-2xl bg-red-500 p-4 text-lg font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </div>
  </div>
)}

{periodModalOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
      <div className="flex flex-col items-center text-center">
        <Calendar className="h-16 w-16 text-orange-500" />
        <div className="mt-5 text-2xl font-bold">Baixar XLS por período</div>
        <div className="mt-2 text-md text-muted-foreground">
          Selecione o intervalo de datas dos pedidos
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-12 w-full rounded-2xl border px-4"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-12 w-full rounded-2xl border px-4"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            setPeriodModalOpen(false);
            setStartDate("");
            setEndDate("");
          }}
          className="flex-1 rounded-2xl border p-4 text-lg font-semibold text-zinc-600 hover:bg-zinc-100"
        >
          Cancelar
        </button>

        <button
          onClick={handleExportByPeriod}
          className="flex-1 rounded-2xl bg-orange-500/80 p-4 text-lg font-semibold text-white shadow-sm hover:bg-orange-500"
        >
          Baixar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  </AuthGuard>
  );
}
