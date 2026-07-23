import { createFileRoute } from "@tanstack/react-router";

import { useNavigate } from "@tanstack/react-router";

import { CheckCircle2, FileSpreadsheet, FileText, Home, Mail, Printer, XCircle } from "lucide-react";

import html2canvas from "html2canvas-pro";

import * as XLSX from "xlsx";

import { ThermalReceipt } from "@/components/ThermalReceipt";

import { useOrderStore } from "@/services/order-store";

import { buildReceiptZPL } from "@/components/Receipt zpl";

// ...
import { sendOrderEmail } from "@/services/send-order-email";

import { ZebraBluetoothService } from "@/components/zebra-bluetooth";
import { useRef, useState } from "react";
import { pedidoAPI } from "@/services/pedido-api";
import { requireAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";

export const Route = createFileRoute("/pedido-finalizado")({
  beforeLoad: requireAuth,
  component: PedidoFinalizadoPage,
});

function PedidoFinalizadoPage() {
  const navigate = useNavigate();

  // STORE
  // useRef em vez de criar direto no corpo do componente: assim a MESMA
  // instância (e a conexão Bluetooth que ela guarda) sobrevive entre
  // re-renderizações da tela, em vez de recriar do zero toda hora.
  const zebraRef = useRef<ZebraBluetoothService | null>(null);
  if (!zebraRef.current) {
    zebraRef.current = new ZebraBluetoothService();
  }
  const zebra = zebraRef.current;

  const customer = useOrderStore((state) => state.customer);

  const items = useOrderStore((state) => state.items);

  const payment = useOrderStore((state) => state.payment);

  const obs = useOrderStore((state) => state.obs);

  const responsavel = useOrderStore((state) => state.responsavel);

  const pedido = useOrderStore((state) => state.pedido);

  const dataFinalizacao = useOrderStore((state) => state.dataFinalizacao);
  

  // Assinatura capturada no checkout (só existe quando o pagamento foi
  // "A Receber"). Precisa ser lida do store e passada pro ThermalReceipt
  // pra aparecer no canhoto — sem isso ela fica perdida.
  const assinatura = useOrderStore((state) => state.assinatura);

  const clear = useOrderStore((state) => state.clear);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);

  const [emailSent, setEmailSent] = useState(false);

const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // TOTAL

 const total = items.reduce(
  (acc, item) => acc + item.quantity * Number(item.price.replace(",", ".")),
  0,
);

  // PRINT (Zebra ZQ521 via Browser Print / ZPL)

async function printReceipt() {
  if (!customer || items.length === 0) {
    setToast({ type: "error", message: "Não há itens no pedido para imprimir." });
    return;
  }

  try {
    await zebra.connect();

    const zpl = buildReceiptZPL({
      customer,
      items,
      payment,
      obs,
      responsavel,
      pedido: pedido ?? undefined,
      data: dataFinalizacao ?? undefined,
    });

    const sgdContinuous = '! U1 setvar "ezpl.media_type" "continuous"\n';

    await zebra.print(sgdContinuous + zpl);

    zebra.disconnect();

    setPreviewOpen(false);
    setToast({ type: "success", message: "Cupom enviado para impressão." });
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível imprimir via Bluetooth. Verifique a conexão com a impressora." });
  }
}

  // WHATS / PNG

  async function shareReceipt() {
    const element = document.getElementById("thermal-receipt");

    if (!element) {
      alert("Canhoto não encontrado");

      return;
    }

    // ESPERA RENDER

    await new Promise((resolve) => setTimeout(resolve, 300));

    // CAPTURA

    const canvas = await html2canvas(element, {
      scale: 2,

      backgroundColor: "#ffffff",

      useCORS: true,

      logging: true,
    });

    // PNG

    const image = canvas.toDataURL("image/png");

    // DOWNLOAD

    const link = document.createElement("a");

    link.href = image;

    link.download = `canhoto-${Date.now()}.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }
  // XLS

 function exportXLS() {
    if (!customer || items.length === 0) {
      alert("Pedido vazio");
      return;
    }

    const pedidoLabel = pedido ?? String(Date.now());

    const now = dataFinalizacao
      ? new Date(dataFinalizacao).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");

    const rows = items.map((item) => ({
      Pedido: pedidoLabel,

      CodCliente: customer.Codigo,

      CodProduto: item.product.CodProduto,

      Descricao: item.product.Descricao,

      Qtde: item.quantity,

      Qtde_Entregue: item.quantity,

      Qtde_Pendente: 0,

      Valor_Un: Number(item.price.replace(",", ".")),

      Valor_Total: item.quantity * Number(item.price.replace(",", ".")),

      Desc_Comissao: 0,

      Data: now,

      Data_Entrega: now,

      Responsavel: responsavel,

      Reposto: item.reposto,

      Pagamento: payment,

      OBS: obs || "",
    }));

    // PLANILHA

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    // LARGURA COLUNAS

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 40 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 40 },
    ];

    // NOME

    const fileName = `${pedidoLabel}-${customer.Codigo}.xls`;

    // DOWNLOAD

    XLSX.writeFile(workbook, fileName);
  }

async function handleSendEmail() {
  // Trava extra contra clique duplo/repetido, mesmo que o disabled falhe
  if (emailSent || sendingEmail) return;

  if (!customer || items.length === 0) {
    alert("Pedido vazio");
    return;
  }

  const pedidoLabel = pedido ?? String(Date.now());
  const dataAtual = dataFinalizacao ?? new Date().toISOString();

  const emailItems = items.map((item) => ({
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
    data: dataAtual,
    data_entrega: dataAtual,
    responsavel,
    reposto: item.reposto,
    pagamento: payment,
    obs: obs || "",
  }));

  try {
    setSendingEmail(true);

    await sendOrderEmail({
      data: {
        pedido: pedidoLabel,
        nomecliente: customer.name,
        pagamento: payment,
        data: dataAtual,
        total,
        items: emailItems,
      },
    });

    await pedidoAPI.markEmailSent(pedidoLabel);

    setEmailSent(true);
    setToast({ type: "success", message: "O pedido foi enviado por e-mail com sucesso." });
  } catch (err) {
    console.error(err);
    setToast({ type: "error", message: "Não foi possível enviar o e-mail. Tente novamente." });
  } finally {
    setSendingEmail(false);
  }
}

  return (
    <AuthGuard>
    <div className="min-h-screen bg-muted/30 p-4 flex items-start md:items-center justify-center">
      <div className="mx-auto max-w-2xl w-full">
        <div className="rounded-3xl border bg-background p-8 shadow-sm">
          {/* SUCCESS */}

       <div className="flex flex-col items-center text-center">
  <CheckCircle2 className="h-20 w-20 text-green-600" />

  <div className="mt-4 text-3xl font-bold">Pedido finalizado!</div>

  <div className="mt-2 text-lg font-semibold text-orange-600">{pedido}</div>

  <div className="mt-1 text-muted-foreground font-bold">
    {customer?.Codigo} - {customer?.name}
  </div>
</div>

          {/* BUTTONS */}

       <div className="mt-10 grid grid-cols-2 gap-5">
  {/* CLIENTES */}



    <button
  onClick={handleSendEmail}
  disabled={sendingEmail || emailSent}
  className="flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted disabled:opacity-50 disabled:hover:scale-100"
>
  <Mail className="h-7 w-7" />
  {sendingEmail ? "Enviando..." : emailSent ? "E-mail enviado ✓" : "Enviar XLS por E-mail"}
</button>


  {/* IMPRIMIR */}
  <button
    onClick={() => setPreviewOpen(true)}
    className="flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted"
  >
    <Printer className="h-7 w-7" />
    Imprimir
  </button>

  {/* XLS - BAIXAR */}
  <button
    onClick={() => {
      clear();
      navigate({ to: "/clientes" });
    }}
    className="flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted"
  >
    <Home className="h-7 w-7" />
    Voltar ao Início
  </button>

  <button
    onClick={() => {
      clear();
      navigate({ to: "/historico" });
    }}
    className="flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted"
  >
    <FileText className="h-7 w-7" />
    Histórico de Pedidos
  </button>

</div>
        </div>
      </div>

      {/* Preview em HTML mantido só para o botão de compartilhar (PNG via html2canvas) */}
      <div className="hidden print:block">
        <ThermalReceipt
          customer={customer}
          items={items}
          payment={payment}
          obs={obs}
          responsavel={responsavel}
          pedido={pedido ?? undefined}
          data={dataFinalizacao ?? undefined}
          assinatura={assinatura}
        />
      </div>

      {previewOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-3xl bg-white p-4">

    <ThermalReceipt
  customer={customer}
  items={items}
  payment={payment}
  obs={obs}
  responsavel={responsavel}
  pedido={pedido ?? undefined}
  data={dataFinalizacao ?? undefined}
  assinatura={assinatura}
/>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setPreviewOpen(false)}
          className="flex-1 rounded-2xl border p-3"
        >
          Cancelar
        </button>

        <button
          onClick={printReceipt}
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
    </AuthGuard>
  );
}
