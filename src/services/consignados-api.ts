import { supabase } from "@/services/supabase";

export type ClienteConsignado = {
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

export const consignadosAPI = {
  async list(): Promise<ClienteConsignado[]> {
    const { data, error } = await supabase
      .from("clientes_consignados")
      .select("*")
      .order("rota", { ascending: true })
      .order("cliente", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async importClientes(clientes: ClienteConsignado[]) {
    const { data, error } = await supabase
      .from("clientes_consignados")
      .upsert(clientes, {
        onConflict: "cliente",
      })
      .select();

    if (error) throw error;

    return data;
  },
};
