import * as XLSX from "xlsx";

export function exportOrderXLS(order: any) {
  const rows = order.items.map((item: any) => ({
    Pedido: order.pedido,

    CodCliente: item.codcliente,

    NomeCliente: order.nomecliente,

    CodProduto: item.codproduto,

    Descricao: item.descricao,

    Qtde: item.qtde,

    Qtde_Entregue: item.qtde_entregue,

    Qtde_Pendente: item.qtde_pendente,

    Valor_Un: item.valor_un,

    Valor_Total: item.valor_total,

    Desc_Comissao: item.desc_comissao,

    Data: new Date(item.data).toLocaleString("pt-BR"),

    Data_Entrega: new Date(item.data_entrega).toLocaleString("pt-BR"),

    Responsavel: item.responsavel,

    Reposto: item.reposto,

    Pagamento: item.pagamento,

    OBS: item.obs,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 30 },
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

  const customerName = order.nomecliente.replaceAll(" ", "_").replaceAll("/", "-");

  const fileName = `${customerName}_${order.pedido}.xls`;

  XLSX.writeFile(workbook, fileName);
}
