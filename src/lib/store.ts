// Local persistence layer (no backend yet)
export type Customer = {
  id: string;
  name: string;
  phone: string;
  city: string;
  document?: string;
};

export type ConsignedItem = {
  id: string;
  code: string;
  description: string;
  quantity: number; // disponivel em consignação
  sold: number;
  unitPrice: number;
  note?: string;
};

export type Order = {
  id: string;
  number: number;
  customerId: string;
  customerName: string;
  items: ConsignedItem[];
  total: number;
  totalQty: number;
  payment: string;
  notes: string;
  responsible: string;
  createdAt: string;
};

const K_CUSTOMERS = "3a:customers";
const K_CONSIGNED = "3a:consigned"; // map customerId -> ConsignedItem[]
const K_ORDERS = "3a:orders";
const K_COUNTER = "3a:counter";

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

// Seed
function seed() {
  if (read<Customer[] | null>(K_CUSTOMERS, null as unknown as Customer[] | null)) return;
  const customers: Customer[] = [
    { id: "c1", name: "Auto Mecânica Silva", phone: "(31) 98877-1122", city: "Belo Horizonte / MG", document: "12.345.678/0001-90" },
    { id: "c2", name: "Oficina do Zé", phone: "(31) 99654-3322", city: "Contagem / MG" },
    { id: "c3", name: "Borracharia Central", phone: "(31) 99111-7788", city: "Betim / MG" },
    { id: "c4", name: "Fábio Fonseca", phone: "(31) 98000-1111", city: "Belo Horizonte / MG" },
  ];
  const consigned: Record<string, ConsignedItem[]> = {
    c1: [
      { id: uid(), code: "FLT-OL-9821", description: "Filtro de óleo Tecfil PSL120", quantity: 6, sold: 0, unitPrice: 28.9 },
      { id: uid(), code: "PAS-FRE-441", description: "Pastilha de freio dianteira Cobreq N-441", quantity: 4, sold: 0, unitPrice: 89.5 },
      { id: uid(), code: "VEL-NGK-BPR", description: "Vela de ignição NGK BPR6ES", quantity: 16, sold: 0, unitPrice: 14.2 },
      { id: uid(), code: "OL-MOB-5W30", description: "Óleo Mobil Super 5W30 1L", quantity: 12, sold: 0, unitPrice: 39.9 },
    ],
    c2: [
      { id: uid(), code: "COR-DEN-8PK", description: "Correia Dentada Gates 8PK1230", quantity: 3, sold: 0, unitPrice: 145.0 },
      { id: uid(), code: "AMO-TRA-NK", description: "Amortecedor Traseiro Nakata", quantity: 2, sold: 0, unitPrice: 215.0 },
    ],
    c3: [
      { id: uid(), code: "CAM-AR-MC", description: "Câmara de Ar Aro 14", quantity: 10, sold: 0, unitPrice: 32.0 },
      { id: uid(), code: "VAL-PNE-TR4", description: "Válvula de pneu TR4", quantity: 50, sold: 0, unitPrice: 3.5 },
    ],
    c4: [],
  };
  write(K_CUSTOMERS, customers);
  write(K_CONSIGNED, consigned);
  write(K_ORDERS, []);
  write(K_COUNTER, 1000);
}
seed();

export const customersAPI = {
  list: () => read<Customer[]>(K_CUSTOMERS, []),
  search: (q: string) => {
    const qq = q.trim().toLowerCase();
    const all = read<Customer[]>(K_CUSTOMERS, []);
    if (!qq) return all;
    return all.filter(c =>
      c.name.toLowerCase().includes(qq) ||
      c.phone.toLowerCase().includes(qq) ||
      c.city.toLowerCase().includes(qq)
    );
  },
  get: (id: string) => read<Customer[]>(K_CUSTOMERS, []).find(c => c.id === id),
  create: (c: Omit<Customer, "id">) => {
    const list = read<Customer[]>(K_CUSTOMERS, []);
    const nc = { ...c, id: uid() };
    write(K_CUSTOMERS, [nc, ...list]);
    return nc;
  },
};

export const consignedAPI = {
  forCustomer: (cid: string): ConsignedItem[] => {
    const map = read<Record<string, ConsignedItem[]>>(K_CONSIGNED, {});
    return map[cid] ?? [];
  },
  saveForCustomer: (cid: string, items: ConsignedItem[]) => {
    const map = read<Record<string, ConsignedItem[]>>(K_CONSIGNED, {});
    map[cid] = items;
    write(K_CONSIGNED, map);
  },
};

export const ordersAPI = {
  list: () => read<Order[]>(K_ORDERS, []).sort((a, b) => b.number - a.number),
  get: (id: string) => read<Order[]>(K_ORDERS, []).find(o => o.id === id),
  nextNumber: () => {
    const n = read<number>(K_COUNTER, 1000) + 1;
    write(K_COUNTER, n);
    return n;
  },
  create: (o: Omit<Order, "id" | "number" | "createdAt">) => {
    const order: Order = {
      ...o,
      id: uid(),
      number: ordersAPI.nextNumber(),
      createdAt: new Date().toISOString(),
    };
    const list = read<Order[]>(K_ORDERS, []);
    write(K_ORDERS, [order, ...list]);
    return order;
  },
};

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
