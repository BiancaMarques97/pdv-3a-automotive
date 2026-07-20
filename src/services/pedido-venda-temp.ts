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
