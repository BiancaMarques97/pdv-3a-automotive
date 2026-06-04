import { createFileRoute } from "@tanstack/react-router";

import { useNavigate } from "@tanstack/react-router";

import { CheckCircle2, FileSpreadsheet, Home, Printer } from "lucide-react";

import html2canvas from "html2canvas";

import * as XLSX from "xlsx";

import { ThermalReceipt } from "@/components/ThermalReceipt";

import { useOrderStore } from "@/services/order-store";

export const Route = createFileRoute("/pedido-finalizado")({
  component: PedidoFinalizadoPage,
});

function PedidoFinalizadoPage() {
  const navigate = useNavigate();

  // STORE

  const customer = useOrderStore((state) => state.customer);

  const items = useOrderStore((state) => state.items);

  const payment = useOrderStore((state) => state.payment);

  const obs = useOrderStore((state) => state.obs);

  const responsavel = useOrderStore((state) => state.responsavel);

  const clear = useOrderStore((state) => state.clear);

  // TOTAL

  const total = items.reduce((acc, item) => acc + item.quantity * item.product.Valor_Un, 0);

  // PRINT

  function printReceipt() {
    window.print();
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

    const pedido = String(Date.now());

    const now = new Date().toLocaleString("pt-BR");

    const rows = items.map((item) => ({
      Pedido: pedido,

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

    const date = new Date().toLocaleDateString("pt-BR").replaceAll("/", "-");

    const customerName = customer.name.replaceAll(" ", "_").replaceAll("/", "-");

    const fileName = `${customerName}_${date}.xls`;

    // DOWNLOAD

    XLSX.writeFile(workbook, fileName);
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border bg-background p-8 shadow-sm">
          {/* SUCCESS */}

          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-20 w-20 text-green-600" />

            <div className="mt-4 text-3xl font-bold">Pedido finalizado!</div>

            <div className="mt-2 text-muted-foreground">{customer?.name}</div>
          </div>

          {/* BUTTONS */}

          <div className="mt-10 grid grid-cols-2 gap-5">
            {/* IMPRIMIR */}

            <button
              onClick={printReceipt}
              className="flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted"
            >
              <Printer className="h-7 w-7" />
              Imprimir
            </button>

            {/* XLS */}

            <button
              onClick={exportXLS}
              className="flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted"
            >
              <FileSpreadsheet className="h-7 w-7" />
              XLS
            </button>

            {/* CLIENTES */}

            <button
              onClick={() => {
                clear();

                navigate({
                  to: "/clientes",
                });
              }}
              className="col-span-2 flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border bg-background text-base font-medium shadow-sm transition-all hover:scale-[1.02] hover:bg-muted"
            >
              <Home className="h-7 w-7" />
              Clientes
            </button>
          </div>
        </div>
      </div>

      {/* PRINT */}
      <div className="hidden print:block">
        <ThermalReceipt
          customer={customer}
          items={items}
          payment={payment}
          obs={obs}
          responsavel={responsavel}
        />
      </div>
    </div>
  );
}
