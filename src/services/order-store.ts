import { create } from "zustand";

type Product = {
  CodProduto: string;

  Codigo: string;

  Descricao: string;

  Valor_Un: number;
};

export type OrderItem = {
  product: Product;

  reposto: "CSG" | "CR" | "SR" | "VA";

  quantity: number;

  price: string;
};

export type Customer = {
  CodCliente: string;

  Codigo: string;

  name: string;

  phone: string;

  city: string;

  document?: string;
};

export type OrderStore = {
  customer: Customer | null;

  items: OrderItem[];

  payment: string;

  obs: string;

  responsavel: string;

  // Número oficial do pedido (ex: "PDV-0004"), gerado pelo Supabase no
  // checkout, e a data/hora em que foi finalizado. Guardamos os dois aqui
  // pra tela de pedido-finalizado (cupom/ZPL e XLS) usar exatamente o
  // mesmo valor que foi salvo no banco, em vez de gerar um novo.
  pedido: string | null;

  dataFinalizacao: string | null;

  // Assinatura do cliente (PNG base64), obrigatória só quando o
  // pagamento é "A Receber". Guardada aqui pra sobreviver até a tela
  // de pedido-finalizado e ser exibida depois no canhoto/histórico.
  assinatura: string | null;

  setCustomer: (customer: Customer) => void;

  setItems: (items: OrderItem[]) => void;

  setPayment: (payment: string) => void;

  setObs: (obs: string) => void;

  setResponsavel: (responsavel: string) => void;

  setPedido: (pedido: string, dataFinalizacao: string) => void;

  setAssinatura: (assinatura: string | null) => void;

  clear: () => void;
};

export const useOrderStore = create<OrderStore>((set) => ({
  customer: null,

  items: [],

  payment: "PIX 3A",

  obs: "",

  responsavel: "LUIZ FARIA",

  pedido: null,

  dataFinalizacao: null,

  assinatura: null,

  setCustomer: (customer) =>
    set({
      customer,
    }),

  setItems: (items) =>
    set({
      items,
    }),

  setPayment: (payment) =>
    set({
      payment,
    }),

  setObs: (obs) =>
    set({
      obs,
    }),

  setResponsavel: (responsavel) =>
    set({
      responsavel,
    }),

  setPedido: (pedido, dataFinalizacao) =>
    set({
      pedido,
      dataFinalizacao,
    }),

  setAssinatura: (assinatura) =>
    set({
      assinatura,
    }),

  clear: () =>
    set({
      customer: null,

      items: [],

      payment: "PIX 3A",

      obs: "",

      responsavel: "LUIZ FARIA",

      pedido: null,

      dataFinalizacao: null,

      assinatura: null,
    }),
}));
