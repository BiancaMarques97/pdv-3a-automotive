import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/logo-3a.png";
import { ShoppingCart, History, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { to: "/", label: "PDV", icon: ShoppingCart },
  { to: "/historico", label: "Histórico", icon: History },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <img src={logo} alt="3A Automotive" className="h-11 w-11 rounded-full bg-white object-contain p-0.5" />
        <div>
          <div className="text-sm font-bold leading-tight">3A AUTOMOTIVE</div>
          <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Controle de Pedidos</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-[11px] text-sidebar-foreground/60">
        v1.0 · Balcão
      </div>
    </div>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const current = nav.find(n => n.to === loc.pathname);
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <SidebarContent pathname={loc.pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile/Tablet topbar */}
        <header className="flex items-center gap-3 border-b bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="rounded-md p-2 hover:bg-sidebar-accent" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SidebarContent pathname={loc.pathname} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <img src={logo} alt="3A" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight">3A AUTOMOTIVE</div>
            <div className="truncate text-[11px] uppercase tracking-wider text-sidebar-foreground/60">{title ?? current?.label ?? "Controle de Pedidos"}</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
