// src/lib/receipt-zpl.ts
//
// Gera o ZPL do canhoto de venda a partir dos mesmos dados usados no
// componente <ThermalReceipt />, para impressão direta na Zebra ZQ521
// via Browser Print (http://localhost:9100/write).

import type { OrderItem } from "@/services/order-store";
import { LOGO_ZPL_DATA, LOGO_ZPL_WIDTH, LOGO_ZPL_HEIGHT } from "./logo-zpl";

type ReceiptData = {
  customer: any;
  items: OrderItem[];
  payment: string;
  obs: string;
  responsavel: string;
  pedido?: string | number;
  data?: string;
};

// ---- CONFIGURAÇÃO DE LAYOUT --------------------------------------------
// Ajuste LABEL_WIDTH conforme a bobina/rolo usado na sua ZQ521.
// 203dpi => 8 dots/mm.  72mm de papel útil ~= 576 dots.
const LABEL_WIDTH = 660; // dots
const MARGIN = 12; // margem esquerda/direita em dots
const CONTENT_WIDTH = LABEL_WIDTH - MARGIN * 2;

const FONT_SMALL = 24; // ~ texto normal
const FONT_BOLD = 28; // ~ texto em destaque
const LINE_HEIGHT_SMALL = 30;
const LINE_HEIGHT_BOLD = 34;

// Usada pra decidir quantas linhas um texto longo (ex: descrição de
// produto) vai ocupar — mantida conservadora, senão risco de cortar texto.
const WRAP_CHAR_WIDTH = 13;

function fmtBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function estimateLines(text: string, charWidth: number, maxWidth: number) {
  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

// Remove acentos (ç, ã, é, ó, etc). A fonte padrão da impressora nem
// sempre tem esses glifos, mesmo com ^CI28 ligado — sem acento garante
// que sempre vai sair legível, em qualquer Zebra/firmware.
function stripAccents(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Escapa caracteres que têm significado especial em ZPL (^ e ~)
function zplSafe(text: string) {
  return stripAccents(String(text ?? ""))
    .replace(/\^/g, "")
    .replace(/~/g, "")
    .replace(/\n/g, " ");
}

export function buildReceiptZPL({
  customer,
  items,
  payment,
  obs,
  responsavel,
  pedido,
  data,
}: ReceiptData): string {
  const total = items.reduce(
    (acc, item) => acc + item.quantity * Number(item.price.replace(",", ".")),
    0,
  );
  const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
  const pedidoNumber = pedido ?? Date.now();
  const pedidoLabel = `#${pedidoNumber}`;
  const dt = data ? new Date(data) : new Date();
  const dateStr = dt.toLocaleDateString("pt-BR");
  const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  let y = 20;
  const lines: string[] = [];

  // Cabeçalho ZPL: início do label, unidade em dots, UTF-8
  // (precisa vir ANTES de qualquer ^FO, inclusive o da logo)
  lines.push("^XA");
  lines.push("^CI28"); // UTF-8 (mantido como fallback; texto já vem sem acento)
  lines.push("^MNN"); // mídia CONTÍNUA (sem gap/black mark) — evita cortar antes da hora
  lines.push("^MTD"); // impressão térmica DIRETA (papel químico, sem ribbon)
  lines.push("^PON"); // orientação normal
  lines.push(`^PW${LABEL_WIDTH}`);
  lines.push("^LH0,0"); // home position

  // ---- LOGO ---------------------------------------------------------
  // Bitmap embutido no próprio ZPL (^GFA) — não precisa de nenhuma
  // configuração prévia na impressora. Centralizada horizontalmente.
  y += 10;
  const logoX = Math.round((LABEL_WIDTH - LOGO_ZPL_WIDTH) / 2);
  lines.push(`^FO${logoX},${y}${LOGO_ZPL_DATA}^FS`);
  y += LOGO_ZPL_HEIGHT + 10;

  const centerText = (text: string, font: number, bold = false) => {
    lines.push(`^FO0,${y}^A0N,${font},${font}^FB${LABEL_WIDTH},1,0,C,0^FD${zplSafe(text)}^FS`);
    y += bold ? LINE_HEIGHT_BOLD : LINE_HEIGHT_SMALL;
  };

  const dashedLine = () => {
    lines.push(`^FO${MARGIN},${y}^A0N,${FONT_SMALL},${FONT_SMALL}^FD${"-".repeat(48)}^FS`);
    y += LINE_HEIGHT_SMALL;
  };

  const row = (left: string, right: string, bold = false) => {
    const font = bold ? FONT_BOLD : FONT_SMALL;

    // Alinhamento pixel-perfeito via ^FB com justificação à direita
    // (em vez de espaços calculados). Dois campos na mesma posição Y —
    // se voltar o bug do "escorregão" de linha (valor saindo alinhado
    // com a linha seguinte), é sinal de que ainda precisa do método
    // de campo único com espaços.
    lines.push(`^FO${MARGIN},${y}^A0N,${font},${font}^FD${zplSafe(left)}^FS`);
    lines.push(
      `^FO0,${y}^A0N,${font},${font}^FB${LABEL_WIDTH - MARGIN},1,0,R,0^FD${zplSafe(right)}^FS`,
    );
    y += bold ? LINE_HEIGHT_BOLD : LINE_HEIGHT_SMALL;
  };

  const label = (text: string, bold = true) => {
    const font = bold ? FONT_BOLD : FONT_SMALL;
    lines.push(`^FO${MARGIN},${y}^A0N,${font},${font}^FD${zplSafe(text)}^FS`);
    y += bold ? LINE_HEIGHT_BOLD : LINE_HEIGHT_SMALL;
  };

  // Texto que pode quebrar em várias linhas (ex: descrição do produto)
  const wrapped = (text: string) => {
    const numLines = estimateLines(text, WRAP_CHAR_WIDTH, CONTENT_WIDTH);
    lines.push(
      `^FO${MARGIN},${y}^A0N,${FONT_SMALL},${FONT_SMALL}^FB${CONTENT_WIDTH},${numLines},0,L,0^FD${zplSafe(
        text,
      )}^FS`,
    );
    y += LINE_HEIGHT_SMALL * numLines;
  };

  // ---- CABEÇALHO ----------------------------------------------------
  centerText("Auto Peças e Acessórios", FONT_SMALL);
  centerText("CNPJ 17.242.529/0001-14", FONT_SMALL);
  centerText("Tel: (35)99862-5845 / (35)98413-0344", FONT_SMALL);
  dashedLine();

  // ---- PEDIDO ---------------------------------------------------------
  row("PEDIDO", pedidoLabel, true);
  row(dateStr, timeStr);
  dashedLine();

  // ---- CLIENTE ----------------------------------------------------------
  label("CLIENTE");
  wrapped(`${customer?.name ?? ""} - ${customer?.Codigo ?? ""}`);
  dashedLine();

  // ---- ITENS ------------------------------------------------------------
  label("ITENS VENDIDOS");
  y += 10;
  items.forEach((item) => {
    const unitPrice = Number(item.price.replace(",", "."));
    wrapped(`${item.product.Codigo} — ${item.product.Descricao}`);
    row(`${item.quantity} x ${fmtBRL(unitPrice)}`, fmtBRL(item.quantity * unitPrice));
    if (item.reposto) {
      label(String(item.reposto), false);
    }
    y += 10; // pequeno espaço entre itens
    dashedLine();
  });
  dashedLine();

  // ---- TOTAL --------------------------------------------------------
  row("Qtd. itens", String(totalQty));
  row("TOTAL", `R$ ${total.toFixed(2)}`, true);
  row("Pagamento", payment || "—");

  // ---- OBS ------------------------------------------------------------
  if (obs) {
    dashedLine();
    wrapped(`Obs: ${obs}`);
  }
  dashedLine();

  // ---- RESPONSÁVEL --------------------------------------------------
  row("Responsável", responsavel, true);
  dashedLine();

  // ---- RODAPÉ -------------------------------------------------------
  centerText("Obrigado pela preferência!", FONT_SMALL);
  centerText("** VIA DO CLIENTE **", FONT_SMALL);

  y += 20;
  lines.push(`^LL${y}`); // comprimento do label = altura usada
  lines.push("^XZ");

  return lines.join("\n");
}
