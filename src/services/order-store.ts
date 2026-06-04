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

  setCustomer: (customer: Customer) => void;

  setItems: (items: OrderItem[]) => void;

  setPayment: (payment: string) => void;

  setObs: (obs: string) => void;

  setResponsavel: (responsavel: string) => void;

  clear: () => void;
};

export const useOrderStore = create<OrderStore>((set) => ({
  customer: null,

  items: [],

  payment: "PIX 3A",

  obs: "",

  responsavel: "Luiz Carlos",

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

  clear: () =>
    set({
      customer: null,

      items: [],

      payment: "PIX 3A",

      obs: "",

      responsavel: "Luiz Carlos",
    }),
}));
