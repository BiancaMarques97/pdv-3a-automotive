import { Link, useLocation } from "@tanstack/react-router";
import logo from "@/assets/logo-3a.png";
import { LayoutDashboard, ShoppingCart, History } from "lucide-react";

const nav = [
  { to: "/", label: "PDV", icon: ShoppingCart },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/historico", label: "Histórico", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
          <img src={logo} alt="3A Automotive" className="h-11 w-11 rounded-full bg-white object-contain p-0.5" />
          <div>
            <div className="text-sm font-bold leading-tight">3A AUTOMOTIVE</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Controle de Pedidos</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-[11px] text-sidebar-foreground/60">
          v1.0 · Balcão
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
