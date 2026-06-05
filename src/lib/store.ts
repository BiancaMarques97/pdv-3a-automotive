/* eslint-disable prettier/prettier */
// Local persistence layer (no backend yet)
export interface Customer {
  CodCliente?: number;

  id?: string;

  name: string;
  phone: string;
  city: string;
  document?: string;
}

export interface ConsignedItem {
  CodProduto: string;
  Codigo: string;
  Descricao: string;
  Valor_Un: number;

  quantity: number;
  sold: number;

  code: string;
  description: string;
  unitPrice: number;

  note?: string;
}

export type Order = {
  Pedido: number;
  CodCliente: number;
  Cliente: string;
  items: ConsignedItem[];
  total: number;
  totalQty: number;
  payment: string;
  notes: string;
  responsible: string;
  status?: string;
  reposto?: string;
  createdAt: string;
};

const K_CONSIGNED = "3a:consigned"; // map customerId -> ConsignedItem[]

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export const consignedAPI = {
  forCustomer: (cid: number): ConsignedItem[] => {
    const map = read<Record<string, ConsignedItem[]>>(K_CONSIGNED, {});
    return map[cid] ?? [];
  },
  // saveForCustomer: (customerId: number, items: ConsignedItem[]) => {
  //   const map = read<Record<string, ConsignedItem[]>>(K_CONSIGNED, {});
  //   map[customerId] = items;
  //   write(K_CONSIGNED, map);
  // },

  saveForCustomer: async (customerId: number, items: ConsignedItem[]) => {
    for (const item of items) {
      await fetch("http://localhost:3333/consignados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          CodCliente: customerId,
          CodProduto: item.CodProduto,
          Qtde: item.quantity,
        }),
      });
    }
  },
};

export const ordersAPI = {
  list: async () => {
    const response = await fetch("http://localhost:3333/pedidos");

    return await response.json();
  },

  create: async (order: Omit<Order, "Pedido" | "createdAt">) => {
    const response = await fetch("http://localhost:3333/pedidos", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(order),
    });

    return await response.json();
  },
};

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
