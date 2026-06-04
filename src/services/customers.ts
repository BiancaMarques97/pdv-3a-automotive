export const customersAPI = {
  list: async () => {
    const response = await fetch("http://localhost:3333/clientes");

    const data: {
      Codigo: string;
      Razao_Social: string;
      Cidade: string;
      Fone: string;
      CNPJ?: string;
    }[] = await response.json();

    return data.map((c) => ({
      CodCliente: c.Codigo,

      Codigo: c.Codigo,

      name: c.Razao_Social,

      phone: c.Fone,

      city: c.Cidade,

      document: c.CNPJ,
    }));
  },

  create: async (customer: { name: string; phone: string; city: string; document?: string }) => {
    const response = await fetch("http://localhost:3333/clientes", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        Codigo: `CL${Date.now()}`,

        Razao_Social: customer.name,

        Cidade: customer.city,

        Fone: customer.phone,

        CNPJ: customer.document ?? "",
      }),
    });

    const data = await response.json();

    return {
      CodCliente: Number(data.Codigo.replace(/\D/g, "")),

      name: data.Razao_Social,

      phone: data.Fone,

      city: data.Cidade,

      document: data.CNPJ,
    };
  },
};
