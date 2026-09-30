"use server";

import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase-servidor";

/**
 * Login feito no servidor: o navegador só conversa com o próprio site
 * (HTTPS), nunca direto com o Supabase. O token volta como cookie httpOnly
 * — não aparece em resposta, em JavaScript nem no armazenamento da página.
 */
export async function entrar(_: { erro?: string }, form: FormData): Promise<{ erro?: string }> {
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  const destino = String(form.get("destino") ?? "/");

  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const { error } = await clienteServidor().auth.signInWithPassword({ email, password: senha });
  // Mensagem genérica: não confirma se o e-mail existe.
  if (error) return { erro: "E-mail ou senha incorretos." };

  redirect(destino.startsWith("/") && !destino.startsWith("//") ? destino : "/");
}
