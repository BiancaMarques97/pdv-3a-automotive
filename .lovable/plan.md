## Objetivo

Voltar a visão **desktop** (≥1024px) do PDV para o layout antigo da primeira imagem, mantendo intactas as visões mobile e tablet (fluxo linear por etapas).

## Mudanças (apenas em `src/routes/index.tsx` → componente `DesktopPdv`)

### 1. Topbar de conteúdo
- Acima das colunas, uma faixa com:
  - Campo de busca de cliente grande (ícone de lupa, placeholder "Buscar cliente por nome, telefone ou cidade…")
  - À direita: data atual em pt-BR ("segunda-feira, 11 de maio")

### 2. Layout em 3 colunas
```text
┌──────────┬──────────────────────────┬──────────────┐
│ CLIENTES │ CLIENTE SELECIONADO      │ RESUMO DO    │
│ (lista)  │ + Itens Consignados      │ PEDIDO       │
│          │ (tabela)                 │ (painel)     │
└──────────┴──────────────────────────┴──────────────┘
```
- Coluna esquerda (~280px): card "CLIENTES" com contador, lista de clientes (nome, telefone, cidade), botão "Novo cliente".
- Coluna central (flex): card do cliente selecionado com nome, telefone, cidade, "Últimos pedidos: #xxx · R$ yy", botão "Trocar"; card "Itens Consignados" com contador + botão "Adicionar item"; tabela de itens (Código / Descrição / Qtd / Vendida / Unit. / Subtotal / Ações).
- Coluna direita (~320px): painel "RESUMO DO PEDIDO" com Itens e Total em destaque (laranja), selects de Pagamento e Responsável, textarea de Observações, e botões empilhados:
  - "Salvar Pedido" (primário laranja)
  - "Imprimir Canhoto" (escuro)
  - "Exportar Excel" (outline)

### 3. Selos visuais
- Reutilizar tokens existentes (`bg-surface`, `text-primary`, `bg-muted`, etc.) — sem cores hardcoded.
- Cards com `rounded-lg border bg-surface`, separadores e tipografia consistentes com a primeira imagem.

### 4. Lógica
- Reaproveitar todos os handlers já existentes (`pickCustomer`, `addItem`, `updateItem`, `removeItem`, `saveOrder`, `handleExport`, `setShowAdd`, `setShowNewCustomer`, `setShowNote`).
- Nenhuma mudança no `store.ts`, `AppShell.tsx`, dialogs ou rota `/historico`.

### 5. Fora de escopo
- `CustomersStep`, `ItemsStep`, `FinalizeStep`, `DoneStep` (mobile/tablet) ficam exatamente como estão.
- `useIsDesktop` continua sendo o switch entre os dois layouts.

## Detalhe técnico
- Substituir o atual `DesktopPdv` (grid `[340px_1fr]` com footer cheio de ações) por um `grid` de 3 colunas com o painel lateral direito sticky em altura total.
- Data formatada via `new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" })` calculada uma única vez em `useMemo` para evitar mismatch de hidratação SSR.
- Quando nenhum cliente está selecionado: coluna central exibe estado vazio ("Selecione um cliente…") e o painel direito mostra Itens 0 / Total R$ 0,00 com botões desabilitados.