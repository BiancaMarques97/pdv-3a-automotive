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

      name: c.razao_social,

      phone: c.fone,

      city: c.cidade,

      document: c.cnpj,
    }));
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
