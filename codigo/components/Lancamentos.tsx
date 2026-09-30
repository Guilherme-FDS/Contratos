"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { criarLancamento, excluirLancamento, gerarVencimentos, mudarStatus } from "@/app/actions";
import { formatarData } from "@/lib/datas";
import { STATUS_COR, STATUS_ROTULO } from "@/lib/tipos";
import type { Lancamento, StatusLancamento } from "@/lib/tipos";
import { Botao } from "./ui";

/**
 * Lista de vencimentos de um contrato com troca de etapa inline.
 * `compacto` (aba Waldemar) mostra só os próximos e os últimos.
 */
export default function Lancamentos({
  contratoId,
  lancamentos: iniciais,
  periodicidade = 1,
  compacto = false,
}: {
  contratoId: string;
  lancamentos: Lancamento[];
  periodicidade?: number;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [lista, setLista] = useState(iniciais);
  const [data, setData] = useState("");
  const [qtd, setQtd] = useState(12);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarTudo, setMostrarTudo] = useState(!compacto);
  const [pendente, iniciar] = useTransition();

  useEffect(() => setLista(iniciais), [iniciais]);

  function rodar(novo: Lancamento[] | null, acao: () => Promise<{ erro?: string }>, depois?: () => void) {
    const anterior = lista;
    if (novo) setLista(novo);
    setErro(null);
    iniciar(async () => {
      const r = await acao();
      if (r.erro) {
        setLista(anterior);
        setErro(r.erro);
      } else {
        depois?.();
        router.refresh();
      }
    });
  }

  function trocar(l: Lancamento, s: StatusLancamento) {
    let obs: string | null | undefined;
    if (s === "pendente") {
      const r = window.prompt("Motivo da pendência (opcional):", l.observacao ?? "");
      if (r === null) return;
      obs = r;
    }
    rodar(
      lista.map((x) => (x.id === l.id ? { ...x, status: s, observacao: obs === undefined ? x.observacao : obs } : x)),
      () => mudarStatus(l.id, s, obs),
    );
  }

  // Ordem: mais recente em cima. No modo compacto, 3 em aberto + 3 lançados.
  const ordenada = [...lista].sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const visiveis = mostrarTudo
    ? ordenada
    : [
        ...ordenada.filter((l) => l.status !== "lancado").slice(-3),
        ...ordenada.filter((l) => l.status === "lancado").slice(0, 3),
      ].sort((a, b) => b.vencimento.localeCompare(a.vencimento));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 text-sm">
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" />
        <Botao disabled={!data || pendente} onClick={() => rodar(null, () => criarLancamento(contratoId, data), () => setData(""))}>
          + Vencimento
        </Botao>
        <span className="text-slate-400">ou gerar</span>
        <input type="number" min={1} max={60} value={qtd} onChange={(e) => setQtd(Number(e.target.value))} className="w-16 rounded-md border border-slate-300 px-2 py-1" />
        <Botao disabled={!data || pendente} onClick={() => rodar(null, () => gerarVencimentos(contratoId, data, qtd, periodicidade), () => setData(""))}>
          a partir da data
        </Botao>
      </div>
      {erro && <p className="text-sm text-rose-700">{erro}</p>}

      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {visiveis.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-400">Sem vencimentos.</li>}
        {visiveis.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
            <span className="w-24 font-medium">{formatarData(l.vencimento)}</span>
            <select
              aria-label="Etapa"
              value={l.status}
              onChange={(e) => trocar(l, e.target.value as StatusLancamento)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COR[l.status]}`}
            >
              {(Object.keys(STATUS_ROTULO) as StatusLancamento[]).map((s) => (
                <option key={s} value={s}>{STATUS_ROTULO[s]}</option>
              ))}
            </select>
            {l.observacao && <span className="text-xs text-slate-600">📝 {l.observacao}</span>}
            <button
              type="button"
              onClick={() => confirm(`Excluir o vencimento ${formatarData(l.vencimento)}?`) && rodar(lista.filter((x) => x.id !== l.id), () => excluirLancamento(l.id))}
              className="ml-auto text-xs text-slate-400 hover:text-rose-600"
            >
              excluir
            </button>
          </li>
        ))}
      </ul>
      {compacto && lista.length > visiveis.length && (
        <button type="button" onClick={() => setMostrarTudo(true)} className="text-xs text-slate-500 hover:underline">
          Ver todos ({lista.length})
        </button>
      )}
    </div>
  );
}
