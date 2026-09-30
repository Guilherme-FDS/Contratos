"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { SITUACAO_ROTULO, TIPO_AJUDA, TIPO_ROTULO } from "@/lib/tipos";
import type { Contrato, Situacao, TipoContrato } from "@/lib/tipos";

type Acao = (estado: { erro?: string }, form: FormData) => Promise<{ erro?: string }>;

const campo = "mt-1 block w-full rounded-md border border-wegg-200 px-3 py-1.5 text-sm";

export default function FormularioContrato({
  acao,
  contrato,
  tipoPadrao = "normal",
}: {
  acao: Acao;
  contrato?: Contrato;
  tipoPadrao?: TipoContrato;
}) {
  const [estado, enviar] = useFormState(acao, {});
  const novo = !contrato;
  const [tipo, setTipo] = useState<TipoContrato>(contrato?.tipo ?? tipoPadrao);

  return (
    <form action={enviar} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">
        Nº do contrato
        <input name="codigo" defaultValue={contrato?.codigo ?? ""} placeholder="CT/982" className={campo} />
      </label>
      <label className="text-sm font-medium">
        Fornecedor *
        <input name="fornecedor" required defaultValue={contrato?.fornecedor ?? ""} placeholder="Correios" className={campo} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">Tipo</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {(Object.keys(TIPO_ROTULO) as TipoContrato[]).map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                tipo === t ? "border-wegg-900 bg-wegg-50 ring-1 ring-wegg-900" : "border-wegg-200 bg-white"
              }`}
            >
              <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="sr-only" />
              <span className="font-medium">{TIPO_ROTULO[t]}</span>
              <span className="block text-xs text-wegg-500">{TIPO_AJUDA[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="text-sm font-medium">
        Situação
        <select name="situacao" defaultValue={contrato?.situacao ?? "ativo"} className={campo}>
          {(Object.keys(SITUACAO_ROTULO) as Situacao[]).map((s) => (
            <option key={s} value={s}>{SITUACAO_ROTULO[s]}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Periodicidade (meses)
        <input name="periodicidade_meses" type="number" min={1} max={60} defaultValue={contrato?.periodicidade_meses ?? 1} className={campo} />
        <span className="text-xs font-normal text-wegg-500">1 = mensal, 12 = anual.</span>
      </label>
      {novo && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-medium">
            1º vencimento{tipo === "normal" && " *"}
            <input name="primeiro_vencimento" type="date" required={tipo === "normal"} className={campo} />
          </label>
          {tipo === "normal" ? (
            <label className="text-sm font-medium">
              Quantidade de meses *
              <input name="quantidade" type="number" min={1} max={60} required placeholder="ex.: 12" className={campo} />
            </label>
          ) : (
            <p className="self-end pb-1.5 text-xs text-wegg-500">Gera 12 meses e continua renovando sozinho.</p>
          )}
        </div>
      )}
      <label className="text-sm font-medium sm:col-span-2">
        Observação
        <textarea name="observacao" rows={2} defaultValue={contrato?.observacao ?? ""} className={campo} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Enviar rotulo={novo ? "Criar contrato" : "Salvar"} />
        {estado.erro && <span className="text-sm text-rose-700">{estado.erro}</span>}
      </div>
    </form>
  );
}

function Enviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-lg bg-wegg-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60">
      {pending ? "Salvando…" : rotulo}
    </button>
  );
}
