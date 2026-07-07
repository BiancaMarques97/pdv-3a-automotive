import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import * as XLSX from "xlsx";

// Espelha exatamente as colunas/nomes do XLS gerado pelo exportOrderXLS
type OrderItem = {
  codcliente: string;
  nomecliente: string;
  codproduto: string;
  descricao: string;
  qtde: number;
  qtde_entregue?: number;
  qtde_pendente?: number;
  valor_un: number | string;
  valor_total: number | string;
  desc_comissao?: number | string;
  data: string;
  data_entrega?: string;
  responsavel?: string;
  reposto?: string;
  pagamento: string;
  obs?: string;
};

type SendOrderEmailData = {
  pedido: string;
  nomecliente: string;
  pagamento: string;
  data: string;
  total: number;
  items: OrderItem[];
};

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR");
}

function buildOrderXlsBuffer(order: SendOrderEmailData) {
  const rows = order.items.map((item) => ({
    Pedido: order.pedido,
    CodCliente: item.codcliente,
    NomeCliente: item.nomecliente,
    CodProduto: item.codproduto,
    Descricao: item.descricao,
    Qtde: item.qtde,
    Qtde_Entregue: item.qtde_entregue ?? 0,
    Qtde_Pendente: item.qtde_pendente ?? 0,
    Valor_Un: Number(item.valor_un),
    Valor_Total: Number(item.valor_total),
    Desc_Comissao: Number(item.desc_comissao ?? 0),
    Data: formatDate(item.data),
    Data_Entrega: formatDate(item.data_entrega),
    Responsavel: item.responsavel ?? "",
    Reposto: item.reposto ?? "",
    Pagamento: item.pagamento,
    OBS: item.obs ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

  // Gera o arquivo como Buffer (base64 é o formato aceito pelo Resend)
  const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  return buffer;
}

export const sendOrderEmail = createServerFn({ method: "POST" })
  .inputValidator((data: SendOrderEmailData) => data)
  .handler(async ({ data }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fileBase64 = buildOrderXlsBuffer(data);

    const { data: result, error } = await resend.emails.send({
      from: process.env.ORDER_EMAIL_FROM as string,
      to: process.env.ORDER_EMAIL_TO as string,
      subject: `Pedido #${data.pedido} - ${data.nomecliente}`,
      html: `
        <p>Olá, segue em anexo o pedido <strong>#${data.pedido}</strong>.</p>
        <p>Cliente: ${data.nomecliente}</p>
        <p>Total: R$ ${Number(data.total).toFixed(2)}</p>
      `,
      attachments: [
        {
          filename: `pedido-${data.pedido}.xlsx`,
          content: fileBase64,
        },
      ],
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      throw new Error(error.message);
    }

    return { success: true, id: result?.id };
  });
