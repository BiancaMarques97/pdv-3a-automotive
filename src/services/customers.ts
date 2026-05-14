/* eslint-disable prettier/prettier */

export const customersAPI = {
  list: async () => {
    const response = await fetch("http://localhost:3333/clientes");

    const data: {
      id: number;
      nome: string;
      telefone: string;
      cidade: string;
      documento?: string;
    }[] = await response.json();

    return data.map((c) => ({
      id: String(c.id),
      name: c.nome,
      phone: c.telefone,
      city: c.cidade,
      document: c.documento,
    }));
  },

  create: async (customer: { name: string; phone: string; city: string; document?: string }) => {
    const response = await fetch("http://localhost:3333/clientes", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nome: customer.name,
        telefone: customer.phone,
        cidade: customer.city,
        documento: customer.document,
      }),
    });

    const data = await response.json();

    return {
      id: String(data.id),
      name: data.nome,
      phone: data.telefone,
      city: data.cidade,
      document: data.documento,
    };
  },
};
