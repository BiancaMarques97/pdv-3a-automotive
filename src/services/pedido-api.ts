import { supabase } from "./supabase";

export const pedidoAPI = {
  gerarNumeroPedido: async () => {
    const { data, error } = await supabase.rpc("gerar_numero_pedido");

    if (error) {
      throw error;
    }

    return data;
  },

  createMany: async (items: any[]) => {
    const { error } = await supabase.from("pedido_vendatemp").insert(items);

    if (error) {
      throw error;
    }
  },

  list: async () => {
    const { data, error } = await supabase.from("pedido_vendatemp").select("*");

    if (error) {
      throw error;
    }

    return data;
  },

  listRecent: async (limit = 20, offset = 0) => {
    const { data, error } = await supabase.rpc("listar_ultimos_pedidos", {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  deleteByPedido: async (pedido: string) => {
    const { error } = await supabase.from("pedido_vendatemp").delete().eq("pedido", pedido);

    if (error) {
      throw error;
    }
  },

  markEmailSent: async (pedido: string) => {
    const { error } = await supabase
      .from("pedido_vendatemp")
      .update({ email_enviado: true })
      .eq("pedido", pedido);

    if (error) {
      throw error;
    }
  },

  updateObs: async (pedido: string, obs: string) => {
    const { error } = await supabase.from("pedido_vendatemp").update({ obs }).eq("pedido", pedido);

    if (error) {
      throw error;
    }
  },

  updateOrder: async (pedido: string, fields: { obs?: string; pagamento?: string }) => {
    const { error } = await supabase.from("pedido_vendatemp").update(fields).eq("pedido", pedido);

    if (error) {
      throw error;
    }
  },

  updateItemReposto: async (id: number, reposto: string) => {
    const { error } = await supabase.from("pedido_vendatemp").update({ reposto }).eq("id", id);

    if (error) {
      throw error;
    }
  },

  search: async (term: string) => {
    const { data, error } = await supabase.rpc("buscar_pedidos", {
      p_termo: term,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // NOVO: Busca pedidos no banco filtrando por um intervalo de datas
  listByDateRange: async (startDate: string, endDate: string) => {
    // Adiciona a hora para pegar do começo do dia inicial até o final do dia final
    const start = `${startDate} 00:00:00`;
    const end = `${endDate} 23:59:59`;

    const { data, error } = await supabase
      .from("pedido_vendatemp")
      .select("*")
      .gte("data", start)
      .lte("data", end)
      .order("data", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },
};
