import { create } from "zustand";

type HistoricoStore = {
  orders: any[];

  addOrder: (order: any) => void;

  loadOrders: () => void;
};

export const useHistorico = create<HistoricoStore>((set, get) => ({
  orders: [],

  addOrder: (order) => {
    const updated = [order, ...get().orders];

    localStorage.setItem("historico", JSON.stringify(updated));

    set({
      orders: updated,
    });
  },

  loadOrders: () => {
    const raw = localStorage.getItem("historico");

    if (!raw) {
      return;
    }

    set({
      orders: JSON.parse(raw),
    });
  },
}));
