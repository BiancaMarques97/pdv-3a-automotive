import * as XLSX from "xlsx";
import type { Order } from "@/lib/store";

export function exportOrderXLS(order: Order) {
  const rows = order.items
    .filter(i => i.sold > 0)
    .map(i => ({
      Código: i.code,
      Descrição: i.description,
      "Qtd Vendida": i.sold,
      "Valor Unit.": i.unitPrice,
      Subtotal: i.sold * i.unitPrice,
      Observação: i.note ?? "",
    }));
  const header = [
    [`3A Automotive — Pedido #${order.number}`],
    [`Cliente: ${order.customerName}`],
    [`Data: ${new Date(order.createdAt).toLocaleString("pt-BR")}`],
    [`Responsável: ${order.responsible}`],
    [`Pagamento: ${order.payment || "-"}`],
    [],
  ];
  const ws = XLSX.utils.aoa_to_sheet(header);
  XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
  XLSX.utils.sheet_add_aoa(ws, [[], ["", "", "Total Itens", order.totalQty, "Total", order.total]], { origin: -1 });
  ws["!cols"] = [{ wch: 16 }, { wch: 42 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedido");
  XLSX.writeFile(wb, `pedido-${order.number}-${order.customerName.replace(/\s+/g, "_")}.xls`, { bookType: "xls" });
}
