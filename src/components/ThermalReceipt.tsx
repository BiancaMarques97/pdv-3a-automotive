import logoMono from "@/assets/logo-3a-mono.png";

import { forwardRef } from "react";

import type { Customer, OrderItem } from "@/services/order-store";

type ThermalReceiptProps = {
  customer: Customer | null;

  items: OrderItem[];

  payment: string;

  obs: string;

  responsavel: string;
};

function fmtBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  function ThermalReceipt({ customer, items, payment, obs, responsavel }, ref) {
    const pedido = Date.now();

    const total = items.reduce(
      (acc, item) => acc + item.quantity * Number(item.price.replace(",", ".")),
      0,
    );

    const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);

    const dt = new Date();

    return (
      <div id="thermal-receipt" className="thermal print-area w-[100mm] bg-white p-3 text-black">
        {/* HEADER */}

        <div className="text-center">
          <img src={logoMono} alt="3A Automotive" className="mx-auto mb-2 w-24" />

          <div className="text-[11px]">Auto Peças e Acessórios</div>

          <div className="text-[11px]">CNPJ 17.242.529/0001-14</div>

          <div className="text-[11px]">Tel: (35)99862-5845</div>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        {/* PEDIDO */}

        <div className="flex justify-between text-[12px]">
          <span>PEDIDO</span>

          <strong>#{pedido}</strong>
        </div>

        <div className="flex justify-between text-[12px]">
          <span>{dt.toLocaleDateString("pt-BR")}</span>

          <span>
            {dt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",

              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        {/* CLIENTE */}

        <div className="text-[12px] font-bold">CLIENTE</div>

        <div className="text-[12px]">
          {customer?.name} - {customer?.Codigo}
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        {/* ITENS */}

        <div className="text-[12px] font-bold">ITENS VENDIDOS</div>

        {items.map((item) => (
          <div key={item.product.CodProduto} className="mt-2 text-[12px]">
            <div>
              {item.product.Codigo} — {item.product.Descricao}
            </div>

            <div className="flex justify-between">
              <span>
                {item.quantity} x {fmtBRL(Number(item.price.replace(",", ".")))}
              </span>

              <span>{fmtBRL(item.quantity * Number(item.price.replace(",", ".")))}</span>
            </div>

            <div className="italic">{item.reposto}</div>
          </div>
        ))}

        <div className="my-2 border-t border-dashed border-black" />

        {/* TOTAL */}

        <div className="flex justify-between text-[12px]">
          <span>Qtd. itens</span>

          <span>{totalQty}</span>
        </div>

        <div className="flex justify-between text-[12px]">
          <strong>TOTAL</strong>

          <strong>R$ {total.toFixed(2)}</strong>
        </div>

        <div className="flex justify-between text-[12px]">
          <span>Pagamento</span>

          <span>{payment || "—"}</span>
        </div>

        {/* OBS */}

        {obs ? (
          <>
            <div className="my-2 border-t border-dashed border-black" />

            <div className="text-[12px]">Obs: {obs}</div>
          </>
        ) : null}

        <div className="my-2 border-t border-dashed border-black" />

        {/* RESPONSÁVEL */}

        <div className="flex justify-between text-[12px]">
          <span>Responsável</span>

          <strong>{responsavel}</strong>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        {/* FOOTER */}

        <div className="text-center text-[12px]">
          <div>Obrigado pela preferência!</div>

          <div>** VIA DO CLIENTE **</div>
        </div>
      </div>
    );
  },
);
