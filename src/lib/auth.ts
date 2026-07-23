import { redirect } from "@tanstack/react-router";
import { supabase } from "@/services/supabase";

export async function isAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return !!session;
}

export async function requireAuth() {
  if (typeof window === "undefined") return;

  const logged = await isAuthenticated();

  if (!logged) {
    throw redirect({ to: "/login" });
  }
}
