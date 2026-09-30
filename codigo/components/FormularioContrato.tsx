"use client";

import { useFormState, useFormStatus } from "react-dom";
import { SITUACAO_ROTULO, TIPO_ROTULO } from "@/lib/tipos";
import type { Contrato, Situacao, TipoContrato } from "@/lib/tipos";

type Acao = (estado: { erro?: string }, form: FormData) => Promise<{ erro?: string }>;

const campo = "mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm";

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
      <label className="text-sm font-medium">
        Tipo
        <select name="tipo" defaultValue={contrato?.tipo ?? tipoPadrao} className={campo}>
          {(Object.keys(TIPO_ROTULO) as TipoContrato[]).map((t) => (
            <option key={t} value={t}>{TIPO_ROTULO[t]}</option>
          ))}
        </select>
      </label>
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
        <span className="text-xs font-normal text-slate-500">1 = mensal, 12 = anual. Usada ao gerar o próximo vencimento.</span>
      </label>
      {novo && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-medium">
            1º vencimento
            <input name="primeiro_vencimento" type="date" className={campo} />
          </label>
          <label className="text-sm font-medium">
            Quantidade
            <input name="quantidade" type="number" min={1} max={60} defaultValue={12} className={campo} />
          </label>
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
    <button disabled={pending} className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60">
      {pending ? "Salvando…" : rotulo}
    </button>
  );
}
