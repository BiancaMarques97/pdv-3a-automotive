import logo from "@/assets/logo-3a.png";
import { Button } from "@/components/layout/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/services/supabase";
import { users } from "@/lib/users";

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
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);
  setError("");

  const email = users[username.toLowerCase()];

  if (!email) {
    setError("Usuário ou senha inválidos.");
    setLoading(false);
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setError("Usuário ou senha inválidos.");
    setLoading(false);
    return;
  }

  navigate({
    to: "/clientes",
  });
}
  

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-6 font-sans">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:flex-row">
        {/* Branding lateral */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-secondary p-10 md:w-2/5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

          <div className="relative z-10">
            
            <div className="flex items-center justify-center gap-4">
              <img
                src={logo}
                alt="3A Automotive"
                className="h-32 w-32 rounded-full bg-white object-contain p-1 shadow-lg"
              />
            
            </div>
            <p className="mt-8 text-md text-center font-medium leading-relaxed text-white/70">
              Controle de pedidos e consignados.
            </p>
          </div>

          <div className="relative z-10 text-[11px] mt-5 text-center leading-relaxed text-white/50">
            Terminal de Vendas v1.0
            <br />
            Acesso restrito a funcionários
          </div>
        </div>

        {/* Formulário */}
        <div className="flex flex-col justify-center p-10 md:w-3/5 md:p-14">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground text-center">Bem-vindo</h2>
            <p className="mt-4 text-sm font-medium text-center text-muted-foreground">
              Faça login com seu usuário e senha para acessar o sistema.
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Usuário 
              </label>
              <input
                type="text"
                autoComplete="username"
                  value={username}
  onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: operador_3a"
                className="h-14 w-full rounded-2xl border-2 border-border bg-muted px-5 text-base font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Senha
                </label>
                
              </div>
              <input
                type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-14 w-full rounded-2xl border-2 border-border bg-muted px-5 text-base font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15"
              />
            </div>
          
          <Button
            className="mt-6 h-14 w-full rounded-2xl text-medium font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
