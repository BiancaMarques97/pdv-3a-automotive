import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { customersAPI } from "@/services/customers";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — 3A Automotive" }] }),
  component: ClientesPage,
});

type Customer = { id: string; name: string; phone: string; city: string; document?: string };

function ClientesPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    customersAPI
      .list()
      .then((d) => setList(d))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(qq) ||
        c.phone?.toLowerCase().includes(qq) ||
        c.city?.toLowerCase().includes(qq) ||
        c.document?.toLowerCase().includes(qq),
    );
  }, [q, list]);

  return (
    <AppShell>
      <div className="h-full overflow-auto p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Clientes</h1>
            <p className="text-sm text-muted-foreground">{list.length} cadastrados</p>
          </div>
        </div>

        <div className="relative mb-4 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, telefone, cidade ou documento..."
            className="h-12 pl-11"
          />
        </div>

        <div className="overflow-hidden rounded-lg border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Documento</th>
                <th className="px-4 py-2 text-left">Telefone</th>
                <th className="px-4 py-2 text-left">Cidade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.document ?? "—"}</td>
                  <td className="px-4 py-3">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{c.city || "—"}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-muted-foreground">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
