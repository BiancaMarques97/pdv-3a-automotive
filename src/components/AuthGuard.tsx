import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/services/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (!session) {
        navigate({ to: "/login" });
        return;
      }

      setChecked(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Enquanto não confirmou a sessão (inclusive durante SSR, onde o useEffect
  // nunca roda), não renderiza nada — evita vazar o conteúdo protegido no
  // HTML inicial antes da checagem acontecer.
  if (!checked) return null;

  return <>{children}</>;
}