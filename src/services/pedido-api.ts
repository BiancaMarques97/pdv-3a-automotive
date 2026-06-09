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
    const { error } = await supabase
      .from("pedido_vendatemp")
      .insert(items);

    if (error) {
      throw error;
    }
  },

  list: async () => {
    const { data, error } = await supabase
      .from("pedido_vendatemp")
      .select("*");

    if (error) {
      throw error;
    }

    return data;
  },
};