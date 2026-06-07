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

// create: async (customer: { name: string; phone: string; city: string; document?: string }) => {
//   const response = await fetch("http://localhost:3333/clientes", {
//     method: "POST",

//     headers: {
//       "Content-Type": "application/json",
//     },

//     body: JSON.stringify({
//       Codigo: `CL${Date.now()}`,

//       Razao_Social: customer.name,

//       Cidade: customer.city,

//       Fone: customer.phone,

//       CNPJ: customer.document ?? "",
//     }),
//   });

//   const data = await response.json();

//   return {
//     CodCliente: Number(data.Codigo.replace(/\D/g, "")),

//     name: data.Razao_Social,

//     phone: data.Fone,

//     city: data.Cidade,

//     document: data.CNPJ,
//   };
// },
