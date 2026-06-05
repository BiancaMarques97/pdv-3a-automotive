export type PedidoVendaTemp = {
  Pedido: string;

  CodCliente: string;

  NomeCliente: string;

  CodProduto: string;

  Descricao: string;

  Qtde: number;

  Valor_Unitario: number;

  Valor_Total: number;

  Data: string;

  Responsavel: string;

  Reposto: "CSG" | "CR" | "SR" | "VA";

  Pagamento: string;

  OBS: string;
};

// export const pedidoVendaTempAPI = {
//   list: async (): Promise<PedidoVendaTemp[]> => {
//     const response = await fetch("http://localhost:3333/Pedido_VendaTemp");

//     return response.json();
//   },

//   createMany: async (items: PedidoVendaTemp[]) => {
//     for (const item of items) {
//       await fetch("http://localhost:3333/Pedido_VendaTemp", {
//         method: "POST",

//         headers: {
//           "Content-Type": "application/json",
//         },

//         body: JSON.stringify(item),
//       });
//     }
//   },
// };
