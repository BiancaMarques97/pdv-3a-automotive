import { forwardRef } from "react";
import type { Order } from "@/lib/store";
import { fmtBRL } from "@/lib/store";
import logoMono from "@/assets/logo-3a-mono.png";

export const ThermalReceipt = forwardRef<HTMLDivElement, { order: Order }>(
  function ThermalReceipt({ order }, ref) {
    const dt = new Date(order.createdAt);
    return (
      <div ref={ref} className="thermal print-area">
        <div className="center">
          <img src={logoMono} alt="3A Automotive" className="thermal-logo" />
          <h2>3A AUTOMOTIVE</h2>
          <div>Auto Peças e Acessórios</div>
          <div>CNPJ 00.000.000/0001-00</div>
          <div>Tel: (31) 0000-0000</div>
        </div>
        <div className="dashed" />
        <div className="row"><span>PEDIDO</span><strong>#{order.number}</strong></div>
        <div className="row"><span>{dt.toLocaleDateString("pt-BR")}</span><span>{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></div>
        <div className="dashed" />
        <div><strong>CLIENTE</strong></div>
        <div>{order.customerName}</div>
        <div className="dashed" />
        <div><strong>ITENS VENDIDOS</strong></div>
        {order.items.filter(i => i.sold > 0).map(i => (
          <div key={i.id} style={{ marginTop: 4 }}>
            <div>{i.code} — {i.description}</div>
            <div className="row">
              <span>{i.sold} x {fmtBRL(i.unitPrice)}</span>
              <span>{fmtBRL(i.sold * i.unitPrice)}</span>
            </div>
            {i.note ? <div style={{ fontStyle: "italic" }}>obs: {i.note}</div> : null}
          </div>
        ))}
        <div className="dashed" />
        <div className="row"><span>Qtd. itens</span><span>{order.totalQty}</span></div>
        <div className="row"><strong>TOTAL</strong><strong>{fmtBRL(order.total)}</strong></div>
        <div className="row"><span>Pagamento</span><span>{order.payment || "—"}</span></div>
        {order.notes ? <><div className="dashed" /><div>Obs: {order.notes}</div></> : null}
        <div className="dashed" />
        <div className="row"><span>Responsável</span><strong>{order.responsible}</strong></div>
        <div className="dashed" />
        <div className="center">
          <div>Obrigado pela preferência!</div>
          <div>** VIA DO CLIENTE **</div>
        </div>
      </div>
    );
  }
);
