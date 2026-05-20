/* eslint-disable prettier/prettier */
import { customersLocalAPI } from "@/lib/store";

const API_URL = "http://localhost:3333/clientes";

type ApiCustomer = {
  id: number | string;
  nome: string;
  telefone: string;
  cidade: string;
  documento?: string;
};

const mapFromApi = (c: ApiCustomer) => ({
  id: String(c.id),
  name: c.nome,
  phone: c.telefone,
  city: c.cidade,
  document: c.documento,
});

export const customersAPI = {
  list: async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("API offline");
      const data: ApiCustomer[] = await response.json();
      return data.map(mapFromApi);
    } catch {
      // Fallback para os clientes mockados locais
      return customersLocalAPI.list();
    }
  },

  create: async (customer: { name: string; phone: string; city: string; document?: string }) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: customer.name,
          telefone: customer.phone,
          cidade: customer.city,
          documento: customer.document,
        }),
      });
      if (!response.ok) throw new Error("API offline");
      const data: ApiCustomer = await response.json();
      return mapFromApi(data);
    } catch {
      return customersLocalAPI.create(customer);
    }
  },
};
