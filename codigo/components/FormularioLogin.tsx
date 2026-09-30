"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase-navegador";

export default function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await clienteNavegador().auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      setEnviando(false);
      return;
    }
    router.replace(destino);
    router.refresh();
  }

  const campo = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";

  return (
    <form onSubmit={entrar} className="space-y-4">
      <label className="block text-sm font-medium">
        E-mail
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
      </label>
      <label className="block text-sm font-medium">
        Senha
        <input type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
      </label>
      {erro && <p className="text-sm text-rose-700">{erro}</p>}
      <button disabled={enviando} className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-60">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
