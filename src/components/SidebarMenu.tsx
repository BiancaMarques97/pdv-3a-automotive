import logo3a from "@/assets/logo-3a.png";

import {
  useLocation,
  useNavigate,
} from "@tanstack/react-router";

import {
  FileText,
  LogOut,
  Users,
  Wallet,
  X,
} from "lucide-react";

type SidebarMenuProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
};

const menuItems = [
  {
    label: "Clientes",
    to: "/clientes",
    icon: Users,
  },
  {
    label: "Histórico",
    to: "/historico",
    icon: FileText,
  },
  {
    label: "A Receber",
    to: "/a-receber",
    icon: Wallet,
  },
] as const;

export function SidebarMenu({
  open,
  onClose,
  onLogout,
}: SidebarMenuProps) {
  const navigate = useNavigate();

  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
      />

      {/* SIDEBAR */}
      <aside
        aria-label="Menu principal"
        className="fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-full flex-col overflow-y-auto border-r bg-white p-4 shadow-xl"
      >
        <div className="mb-8 flex items-start justify-between">
          <div className="flex w-full flex-col items-center">
            <img
              src={logo3a}
              alt="3A Automotive"
              className="mb-4 h-28 w-28 object-contain"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.to ||
              pathname.startsWith(`${item.to}/`);

            return (
              <button
                key={item.to}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  navigate({ to: item.to });
                  onClose();
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-5 py-4 text-left font-medium transition ${
                  active
                    ? "bg-[#F28C38] text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onLogout}
            className="mt-auto flex cursor-pointer items-center gap-3 rounded-xl px-5 py-4 text-left font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={20} />
            Sair
          </button>
        </nav>
      </aside>
    </>
  );
}