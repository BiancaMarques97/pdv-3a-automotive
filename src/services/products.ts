export const REPOSTO_OPTIONS = [
  {
    label: "CSG - CONSIGNADO",
    value: "CSG",
  },
  {
    label: "CR - COM REPOSIÇÃO",
    value: "CR",
  },
  {
    label: "SR - SEM REPOSIÇÃO",
    value: "SR",
  },
  {
    label: "VA - VENDA AVULSA",
    value: "VA",
  },
] as const;

export type RepostoType = (typeof REPOSTO_OPTIONS)[number]["value"];

export const PAGAMENTO_OPTIONS = [
  {
    label: "Dinheiro",
    value: "Dinheiro",
  },
  {
    label: "Deposito Bancário",
    value: "Deposito Bancário",
  },
  {
    label: "Boleto",
    value: "Boleto",
  },
] as const;

export type PagamentoType = (typeof PAGAMENTO_OPTIONS)[number]["value"];

export interface PedidoVenda {
  Pedido: number;
  CodCliente: number;
  CodProduto: number;
  Descricao: string;
  Qtde: number;
  QtdeEntreg?: number;
  QtdePenden?: number;
  Valor_Un: number;
  Valor_Total: number;
  Desc_Comis?: number;
  Data: Date;
  Data_Entrega?: Date;
  Responsavel?: string;
  Status?: string;
  Reposto?: RepostoType;
  Faturado?: string;
  Pagamento?: PagamentoType;
  DataFatura?: Date;
  NF?: string;
  OBS?: string;
}
