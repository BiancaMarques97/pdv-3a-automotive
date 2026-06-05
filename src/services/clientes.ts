import customers from "./../../../back/clientes.json";
import { supabase } from "./supabase";

async function importCustomers() {
  const rows = customers.map((c) => ({
    codigo: c.Codigo,

    razao_social: c.Razao_Social,

    nome_fantasia: c.Nome_Fantasia,

    cidade: c.Cidade,

    uf: c.UF,

    fone: c.Fone,

    email: c.Email,

    status: c.Status,
  }));

  const { error } = await supabase.from("clientes").insert(rows);

  console.log(error);
}

importCustomers();
