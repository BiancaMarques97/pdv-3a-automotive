import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ArrowLeft, Trash2, Upload, CheckCircle2, XCircle  } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/layout/button";

import { Input } from "@/components/layout/input";

import { customersAPI } from "@/services/customers";

import { useOrderStore } from "@/services/order-store";
import { supabase } from "@/services/supabase";
import { requireAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { useRef } from "react";
import { productsAPI } from "@/services/products";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/novo-pedido/$id")({
  beforeLoad: requireAuth,
  component: PedidoPage,
});

type Customer = {
  CodCliente: string;

  Codigo: string;

  name: string;

  phone: string;

  city: string;
};

type Product = {
  CodProduto: string;

  Codigo: string;

  Descricao: string;

  Valor_Un: number;
};

type OrderItem = {
  product: Product;

  quantity: number;

  reposto: "CSG" | "CR" | "SR" | "VA";

  // STRING
  // PRA ACEITAR
  // VIRGULA/PONTO

  price: string;
};

function PedidoPage() {
  const navigate = useNavigate();

  const { id } = Route.useParams();

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [query, setQuery] = useState("");

  const [products, setProducts] = useState<Product[]>([]);

  const items = useOrderStore((state) => state.items);

  // STORE

  const setOrderCustomer = useOrderStore((state) => state.setCustomer);

  const setItemsStore = useOrderStore((state) => state.setItems);

  const storeCustomer = useOrderStore((state) => state.customer);

  const clear = useOrderStore((state) => state.clear);

  const fileInputRef = useRef<HTMLInputElement>(null);
const [pendingImport, setPendingImport] = useState<any[] | null>(null);
const [importing, setImporting] = useState(false);
const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const customers = await customersAPI.list();

    const found = customers.find((c) => String(c.CodCliente) === id);

    if (found) {
      if (storeCustomer && storeCustomer.CodCliente !== found.CodCliente) {
        clear();
      }

      setCustomer(found);
    }

    const { data, error } = await supabase.from("produtos").select("*");

    if (error) {
      throw error;
    }
    setProducts(
      data.map((p) => ({
        CodProduto: p.codproduto,

        Codigo: p.codproduto,

        Descricao: p.descricao,

        Valor_Un: Number(p.valor),
      })),
    );
  }

  const filtered = products.filter((p) =>
    [p.Codigo, p.Descricao].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  function addProduct(product: Product) {
  const exists = items.find((i) => i.product.CodProduto === product.CodProduto);

  if (exists) {
    setItemsStore(
      items.map((i) =>
        i.product.CodProduto === product.CodProduto
          ? {
              ...i,
              quantity: i.quantity + 1,
            }
          : i,
      ),
    );

    return;
  }

  // Novo item entra no INÍCIO da lista, não no final
  setItemsStore([
    {
      product,
      reposto: "CR",
      quantity: 1,
      price: product.Valor_Un.toString(),
    },
    ...items,
  ]);
}

  function changeQty(codProduto: string, amount: number) {
    setItemsStore(
      items
        .map((item) => {
          if (item.product.CodProduto !== codProduto) {
            return item;
          }

          return {
            ...item,

            quantity: item.quantity + amount,
          };
        })
        .filter((i) => i.quantity > 0),
    );
  }

  async function handleImportProducts(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];

  if (!file) return;

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet);

  const newProducts = rows.map((row: any) => ({
    codproduto: row.codproduto,
    similar_produto: row.similar_produto,
    descricao: row.descricao,
    valor: Number(row.valor),
    qtde: row.qtde ? Number(row.qtde) : 0,
  }));

  setPendingImport(newProducts);

  event.target.value = "";
}

async function confirmImportProducts() {
  if (!pendingImport) return;

  try {
    setImporting(true);

    await productsAPI.importProducts(pendingImport);

    // Recarrega a lista de produtos pra já aparecer na busca
    const { data, error } = await supabase.from("produtos").select("*");

    if (!error && data) {
      setProducts(
        data.map((p) => ({
          CodProduto: p.codproduto,
          Codigo: p.codproduto,
          Descricao: p.descricao,
          Valor_Un: Number(p.valor),
        })),
      );
    }

    setToast({
      type: "success",
      message:
        pendingImport.length === 1
          ? "1 produto importado com sucesso."
          : `${pendingImport.length} produtos importados com sucesso.`,
    });
  } catch (error) {
    console.error(error);
    setToast({ type: "error", message: "Não foi possível importar os produtos. Tente novamente." });
  } finally {
    setImporting(false);
    setPendingImport(null);
  }
}

  const total = useMemo(() => {
    return items.reduce(
      (acc, item) => acc + item.quantity * Number(item.price.replace(",", ".")),

      0,
    );
  }, [items]);

  if (!customer) {
    return <div className="p-10">Carregando...</div>;
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-muted/30 pb-32">
      {/* HEADER */}

      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() =>
              navigate({
                to: "/cliente/$id",

                params: {
                  id,
                },
              })
            }
            className="rounded-md border p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="font-bold">Novo Pedido</div>

            <div className="text-xs text-muted-foreground">
              {customer.name} - {customer.Codigo}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
        {/* SEARCH */}

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto..."
          className="h-14 rounded-2xl"
        />

        <input
  ref={fileInputRef}
  type="file"
  accept=".xlsx,.xls,.csv"
  className="hidden"
  onChange={handleImportProducts}
/>

   <div className="flex justify-end">
          <Button className="h-12 rounded-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Produtos
          </Button>
        </div>

        {/* PRODUCTS */}

        <div className="space-y-3">
          {query.length > 1 && (
            <div className="space-y-3">
              {filtered.slice(0, 20).map((product) => (
                <button
                  key={product.CodProduto}
                  onClick={() => {
                    addProduct(product);

                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border bg-background p-4 text-left hover:bg-muted/40"
                >
                  <div>
                    <div className="font-semibold">{product.Descricao}</div>

                    <div className="mt-1 text-sm text-muted-foreground">Cod: {product.Codigo}</div>
                  </div>

                  <div className="font-bold">R$ {product.Valor_Un.toFixed(2)}</div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-2xl border bg-background p-6 text-center text-sm text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* CART */}

        {items.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="text-lg font-bold">Itens do pedido</div>

            {items.map((item) => (
              <div
                key={item.product.CodProduto}
                className="rounded-2xl border bg-background p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* ESQUERDA */}

                  <div className="flex-1">
                    <div className="font-semibold">
                      {item.product.Descricao} - {item.product.Codigo}
                    </div>

                    {/* PREÇO */}

                    <div className="mt-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.price}
                        onChange={(e) => {
                          // REMOVE TUDO
                          // QUE NÃO FOR NÚMERO

                          const onlyNumbers = e.target.value.replace(/\D/g, "");

                          // VAZIO

                          if (!onlyNumbers) {
                            setItemsStore(
                              items.map((i) =>
                                i.product.CodProduto === item.product.CodProduto
                                  ? {
                                      ...i,

                                      price: "",
                                    }
                                  : i,
                              ),
                            );

                            return;
                          }

                          // FORMATA
                          // AUTOMATICAMENTE

                          const formatted = (Number(onlyNumbers) / 100)
                            .toFixed(2)
                            .replace(".", ",");

                          setItemsStore(
                            items.map((i) =>
                              i.product.CodProduto === item.product.CodProduto
                                ? {
                                    ...i,

                                    price: formatted,
                                  }
                                : i,
                            ),
                          );
                        }}
                        className="h-10 w-32 rounded-xl border px-3 text-sm"
                      />
                    </div>
                    {/* QUANTIDADE */}

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => changeQty(item.product.CodProduto, -1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      >
                        -
                      </button>

                      <div className="w-8 text-center font-bold">{item.quantity}</div>

                      <button
                        onClick={() => changeQty(item.product.CodProduto, 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* DIREITA */}

                  <div className="flex flex-col items-end gap-4">
                    <button onClick={() => changeQty(item.product.CodProduto, -999)}>
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>

                    <div>
                      <select
                        value={item.reposto}
                        onChange={(e) => {
                          setItemsStore(
                            items.map((i) =>
                              i.product.CodProduto === item.product.CodProduto
                                ? {
                                    ...i,

                                    reposto: e.target.value as any,
                                  }
                                : i,
                            ),
                          );
                        }}
                        className="h-11 rounded-xl border px-3 text-sm"
                      >
                        <option value="CSG">CONSIGNADO</option>

                        <option value="CR">COM REPOSIÇÃO</option>

                        <option value="SR">SEM REPOSIÇÃO</option>

                        <option value="VA">VENDA AVULSA</option>
                      </select>
                    </div>

                    {/* TOTAL ITEM */}

                    <div className="font-bold">
                      R$ {(item.quantity * Number(item.price.replace(",", "."))).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}

      <div className="fixed bottom-0 left-0 right-0 border-t-[1.5px] bg-background p-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Total</div>

            <div className="text-2xl font-bold">R$ {total.toFixed(2)}</div>
          </div>

          <Button
            disabled={items.length === 0}
            className="h-14 rounded-2xl px-8 text-base shadow-lg cursor-pointer"
            onClick={() => {
              setOrderCustomer(customer);

              setItemsStore(items);

              navigate({
                to: "/checkout",
              });
            }}
          >
            Continuar
          </Button>
        </div>
      </div>

      {pendingImport && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
      <Upload className="mx-auto h-10 w-10 text-orange-500" />

      <div className="mt-5 text-2xl font-bold">Confirmar importação</div>

      <div className="mt-2 text-lg text-muted-foreground">
        {pendingImport.length === 1
          ? "Deseja importar 1 produto?"
          : `Deseja importar ${pendingImport.length} produtos?`}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setPendingImport(null)}
          disabled={importing}
          className="flex-1 rounded-2xl border p-4 text-lg font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={confirmImportProducts}
          disabled={importing}
          className="flex-1 rounded-2xl bg-orange-500/80 p-4 text-lg font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
        >
          {importing ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  </div>
)}

{toast && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
      {toast.type === "success" ? (
        <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" />
      ) : (
        <XCircle className="mx-auto h-20 w-20 text-red-500" />
      )}

      <div className="mt-5 text-2xl font-bold">
        {toast.type === "success" ? "Sucesso!" : "Erro"}
      </div>

      <div className="mt-2 text-base text-muted-foreground">{toast.message}</div>

      <button
        onClick={() => setToast(null)}
        className="mt-6 w-full rounded-2xl p-4 text-lg font-semibold text-white shadow-sm bg-orange-500/80"
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
    </AuthGuard>
  );
}
