import logo from "@/assets/logo-3a.png";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Acesso · 3A Automotive" },
      { name: "description", content: "Acesso ao PDV 3A Automotive." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/clientes" }), 300);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-6 font-sans">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:flex-row">
        {/* Branding lateral */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-secondary p-10 md:w-2/5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-8 inline-block rounded-full bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
              PDV System
            </div>
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="3A Automotive"
                className="h-16 w-16 rounded-full bg-white object-contain p-1 shadow-lg"
              />
              <div>
                <h1 className="text-4xl font-black leading-none text-white">
                  3A<span className="text-primary">.</span>
                </h1>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  Automotive
                </p>
              </div>
            </div>
            <p className="mt-8 text-sm font-medium leading-relaxed text-white/70">
              Controle de pedidos, consignados e balcão em um só lugar.
            </p>
          </div>

          <div className="relative z-10 text-[11px] leading-relaxed text-white/50">
            Terminal de Vendas v1.0
            <br />
            Acesso restrito a funcionários
          </div>
        </div>

        {/* Formulário */}
        <div className="flex flex-col justify-center p-10 md:w-3/5 md:p-14">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Identifique-se para acessar o balcão
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Usuário ou E-mail
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="ex: operador_3a"
                className="h-14 w-full rounded-2xl border-2 border-border bg-muted px-5 text-base font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Senha
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
                >
                  Recuperar senha
                </a>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-14 w-full rounded-2xl border-2 border-border bg-muted px-5 text-base font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-border bg-card transition-all peer-checked:border-primary peer-checked:bg-primary">
                <svg
                  className="h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-foreground/80">
                Lembrar-me neste terminal
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-lg font-bold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Entrar no sistema"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-6 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                Servidor Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                Versão Estável
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
