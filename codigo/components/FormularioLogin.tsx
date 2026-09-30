"use client";

import { useFormState, useFormStatus } from "react-dom";
import { entrar } from "@/app/auth/acoes";

const campo =
  "mt-1 block w-full rounded-lg border border-wegg-200 bg-white px-3 py-2 text-sm focus:border-wegg-900 focus:outline-none focus:ring-1 focus:ring-wegg-900";

export default function FormularioLogin({ destino }: { destino: string }) {
  const [estado, enviar] = useFormState(entrar, {});

  return (
    <form action={enviar} className="space-y-4" autoComplete="on">
      <input type="hidden" name="destino" value={destino} />
      <label className="block text-sm font-medium text-wegg-900">
        E-mail
        <input name="email" type="email" required autoComplete="username" className={campo} />
      </label>
      <label className="block text-sm font-medium text-wegg-900">
        Senha
        <input name="senha" type="password" required autoComplete="current-password" className={campo} />
      </label>
      {estado.erro && <p className="text-sm text-rose-700">{estado.erro}</p>}
      <Enviar />
    </form>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded-lg bg-wegg-900 py-2 text-sm font-medium text-off disabled:opacity-60">
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}
