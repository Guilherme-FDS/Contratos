"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { mudarSituacao } from "@/app/actions";
import { formatarData, normalizar } from "@/lib/datas";
import { SITUACAO_ROTULO, TIPO_ROTULO } from "@/lib/tipos";
import type { ContratoResumo, Situacao, TipoContrato } from "@/lib/tipos";
import { SeletorSituacao, SeloStatus, SeloTipo } from "./ui";

export default function TabelaContratos({ contratos: iniciais }: { contratos: ContratoResumo[] }) {
  const router = useRouter();
  const [contratos, setContratos] = useState(iniciais);
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [situacao, setSituacao] = useState<Situacao | "">("ativo");
  const [tipo, setTipo] = useState<TipoContrato | "">("");
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  useEffect(() => setContratos(iniciais), [iniciais]);

  const filtrados = useMemo(() => {
    const n = normalizar(nome);
    const d = data.trim();
    return contratos.filter(
      (c) =>
        (!situacao || c.situacao === situacao) &&
        (!tipo || c.tipo === tipo) &&
        (!n || normalizar(`${c.codigo ?? ""} ${c.fornecedor}`).includes(n)) &&
        (!d || formatarData(c.proximo_vencimento).includes(d)),
    );
  }, [contratos, nome, data, situacao, tipo]);

  function alterar(c: ContratoResumo, s: Situacao) {
    const anterior = contratos;
    setContratos(contratos.map((x) => (x.id === c.id ? { ...x, situacao: s } : x)));
    setErro(null);
    iniciar(async () => {
      const r = await mudarSituacao(c.id, s);
      if (r.erro) {
        setContratos(anterior);
        setErro(r.erro);
      } else router.refresh();
    });
  }

  const campo = "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <h1 className="mr-auto text-lg font-semibold">Contratos</h1>
        <Link href="/contratos/novo" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
          + Novo contrato
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome ou nº (ex.: correio, CT/982)" className={campo} />
        <input value={data} onChange={(e) => setData(e.target.value)} placeholder="Vencimento (ex.: 25/10)" inputMode="numeric" className={campo} />
        <select value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao | "")} className={campo}>
          <option value="">Todas as situações</option>
          {(Object.keys(SITUACAO_ROTULO) as Situacao[]).map((s) => (
            <option key={s} value={s}>{SITUACAO_ROTULO[s]}</option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoContrato | "")} className={campo}>
          <option value="">Todos os tipos</option>
          {(Object.keys(TIPO_ROTULO) as TipoContrato[]).map((t) => (
            <option key={t} value={t}>{TIPO_ROTULO[t]}</option>
          ))}
        </select>
      </div>

      {erro && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}
      <p className="text-xs text-slate-500">{filtrados.length} de {contratos.length}</p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Nº</th>
              <th className="px-3 py-2">Fornecedor</th>
              <th className="px-3 py-2">Próx. vencimento</th>
              <th className="px-3 py-2">Etapa</th>
              <th className="px-3 py-2">Último lançado</th>
              <th className="px-3 py-2">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">{c.codigo ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link href={`/contratos/${c.id}`} className="font-medium hover:underline">{c.fornecedor}</Link>{" "}
                  <SeloTipo tipo={c.tipo} />
                  {c.qtd_pendentes > 0 && (
                    <span className="ml-1 rounded bg-yellow-200 px-1.5 text-[11px] font-semibold">{c.qtd_pendentes} pend.</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{formatarData(c.proximo_vencimento)}</td>
                <td className="px-3 py-2">{c.proximo_status ? <SeloStatus status={c.proximo_status} /> : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatarData(c.ultimo_lancado)}</td>
                <td className="px-3 py-2">
                  <SeletorSituacao valor={c.situacao} onChange={(s) => alterar(c, s)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
