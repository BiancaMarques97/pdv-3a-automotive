import { supabase } from "@/services/supabase";

export type Clientea_receber = {
  id?: number;
  cliente: string;
  nome: string;
  qtde?: number | null;
  valor: number;
  pedidos?: string | null;
  data_visita?: string | null;
  cidade?: string | null;
  rota?: string | null;
};

export const a_recebersAPI = {
  async list(): Promise<Clientea_receber[]> {
    const { data, error } = await supabase
      .from("clientes_a_receber")
      .select("*")
      .order("rota", { ascending: true })
      .order("cliente", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async importClientes(clientes: Clientea_receber[]) {
    if (!clientes.length) {
      throw new Error("Nenhum cliente válido para importar.");
    }

    const { error } = await supabase.rpc("sincronizar_a_receber", { p_clientes: clientes });

    if (error) throw error;
  },
};
