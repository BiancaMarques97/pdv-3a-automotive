import { memo } from "react";
import { CalendarDays, Eye, FileDownIcon, Mail, Trash2 } from "lucide-react";

type OrderCardProps = {
  order: any;
  sendingEmail: boolean;
  onView: (order: any) => void;
  onDelete: (order: any) => void;
  onExportXLS: (order: any) => void;
  onSendEmail: (order: any) => void;
};

function OrderCardComponent({
  order,
  sendingEmail,
  onView,
  onDelete,
  onExportXLS,
  onSendEmail,
}: OrderCardProps) {
  return (
    <div className="rounded-3xl border bg-background p-5 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-bold">
          {order.nomecliente} - {order.items?.[0]?.codcliente}
        </div>

        <button
          onClick={() => onDelete(order)}
          className="shrink-0 rounded-full p-2 bg-red-50 text-red-600 cursor-pointer"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
          {order.pedido}
        </span>

        {order.emailEnviado ? (
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Email enviado
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Email não enviado
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        {new Date(order.data).toLocaleString("pt-BR")}
      </div>

      <div className="mt-5">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="text-2xl font-bold">R$ {order.total.toFixed(2)}</div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">{order.pagamento}</div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => onView(order)}
          className="flex flex-1 items-center justify-center gap-2 border-[1.5px] rounded-2xl bg-orange-500/80 text-sm font-semibold text-white p-3 cursor-pointer hover:bg-orange-500 shadow-sm"
        >
          <Eye className="h-5 w-5" />
          Visualizar
        </button>

        <button
          onClick={() => onExportXLS(order)}
          className="flex flex-1 items-center justify-center gap-2 border-[1.5px] rounded-2xl bg-orange-500/80 text-sm font-semibold text-white p-3 cursor-pointer hover:bg-orange-500 shadow-sm"
        >
          <FileDownIcon className="h-5 w-5" /> Baixar XLS
        </button>

        <button
          onClick={() => onSendEmail(order)}
          disabled={sendingEmail}
          className="flex flex-1 items-center justify-center gap-2 border-[1.5px] rounded-2xl bg-orange-500/80 text-sm font-semibold text-white p-3 cursor-pointer hover:bg-orange-500 shadow-sm"
        >
          <Mail className="h-5 w-5" /> Enviar XLS por Email
        </button>
      </div>
    </div>
  );
}

// React.memo evita re-renderizar um card se as props dele não mudaram,
// mesmo que o componente pai (HistoricoPage) re-renderize por outro motivo
// (abrir um modal, mostrar um toast, etc.)
export const OrderCard = memo(OrderCardComponent);