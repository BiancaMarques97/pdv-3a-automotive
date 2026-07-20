import { supabase } from "@/services/supabase";

export const customersAPI = {
  list: async () => {
    const { data, error } = await supabase.from("clientes").select("*");

    if (error) {
      throw error;
    }

    return data.map((c) => ({
      CodCliente: c.codigo,

      Codigo: c.codigo,

      name: c.nome_fantasia,

      phone: c.fone,

      city: c.cidade,

      email: c.email,

      document: c.cnpj,

      endereco: c.endereco,

      numero: c.numero,

      complemento: c.complemento,

      bairro: c.bairro,

      uf: c.uf,

      cep: c.cep,
    }));
  },

  importCustomers: async (customers: any[]) => {
    const { error } = await supabase.from("clientes").upsert(customers, {
      onConflict: "codigo",
    });

    if (error) {
      throw error;
    }
  },
};
