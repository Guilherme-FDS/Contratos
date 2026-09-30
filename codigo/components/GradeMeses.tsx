"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { criarComStatus, criarLancamento, excluirLancamentos, gerarVencimentos, mudarStatusVarios } from "@/app/actions";
import { formatarData } from "@/lib/datas";
import { STATUS_CELULA, STATUS_ROTULO } from "@/lib/tipos";
import type { Lancamento, StatusLancamento } from "@/lib/tipos";
import { Botao } from "./ui";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * Vencimentos como grade ano × mês, uma célula colorida por vencimento.
 * Clique seleciona, Shift+clique seleciona o intervalo, clique no ano
 * seleciona o ano todo — e a barra de baixo aplica a etapa a tudo de uma
 * vez (ex.: lançar o título do aluguel do ano inteiro).
 */
export default function GradeMeses({
  contratoId,
  lancamentos: iniciais,
  periodicidade = 1,
  anosAbertos,
  semLegenda,
}: {
  contratoId: string;
  lancamentos: Lancamento[];
  periodicidade?: number;
  /** Anos já expandidos. Padrão: ano atual e seguintes. */
  anosAbertos?: number[];
  semLegenda?: boolean;
}) {
  const router = useRouter();
  const [lista, setLista] = useState(iniciais);
  const [sel, setSel] = useState<Set<string>>(new Set());
  /** Meses vazios selecionados ("AAAA-MM-DD" já com o dia padrão do contrato). */
  const [vazios, setVazios] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [qtd, setQtd] = useState(12);
  const [ocupado, iniciar] = useTransition();
  const ultimo = useRef<string | null>(null);

  useEffect(() => setLista(iniciais), [iniciais]);

  const ordenada = useMemo(() => [...lista].sort((a, b) => a.vencimento.localeCompare(b.vencimento)), [lista]);
  const anoAtual = new Date().getFullYear();
  // Dia de vencimento mais comum do contrato — usado nos meses vazios.
  const diaPadrao = useMemo(() => {
    const cont = new Map<number, number>();
    for (const l of lista) {
      const d = Number(l.vencimento.slice(8, 10));
      cont.set(d, (cont.get(d) ?? 0) + 1);
    }
    return [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10;
  }, [lista]);

  function dataVazia(ano: number, mes: number) {
    const ultimo = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(Math.min(diaPadrao, ultimo)).padStart(2, "0")}`;
  }

  function alternarVazio(data: string) {
    const novo = new Set(vazios);
    if (novo.has(data)) novo.delete(data);
    else novo.add(data);
    setVazios(novo);
  }

  function limpar() {
    setSel(new Set());
    setVazios(new Set());
  }
  const anos = useMemo(() => {
    const m = new Map<number, Lancamento[][]>();
    for (const l of ordenada) {
      const a = Number(l.vencimento.slice(0, 4));
      const mes = Number(l.vencimento.slice(5, 7)) - 1;
      if (!m.has(a)) m.set(a, Array.from({ length: 12 }, () => []));
      m.get(a)![mes].push(l);
    }
    return [...m.entries()].sort((x, y) => y[0] - x[0]);
  }, [ordenada]);

  function alternar(l: Lancamento, intervalo: boolean) {
    const novo = new Set(sel);
    if (intervalo && ultimo.current) {
      const i = ordenada.findIndex((x) => x.id === ultimo.current);
      const j = ordenada.findIndex((x) => x.id === l.id);
      const [a, b] = i < j ? [i, j] : [j, i];
      for (const x of ordenada.slice(a, b + 1)) novo.add(x.id);
    } else if (novo.has(l.id)) novo.delete(l.id);
    else novo.add(l.id);
    ultimo.current = l.id;
    setSel(novo);
  }

  function selecionarAno(meses: Lancamento[][]) {
    const ids = meses.flat().map((l) => l.id);
    const todos = ids.every((id) => sel.has(id));
    const novo = new Set(sel);
    for (const id of ids) (todos ? novo.delete(id) : novo.add(id));
    setSel(novo);
  }

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

  function aplicar(s: StatusLancamento) {
    const ids = [...sel];
    const datas = [...vazios];
    let obs: string | null | undefined;
    if (s === "pendente") {
      const r = window.prompt("Motivo da pendência (opcional):", "");
      if (r === null) return;
      obs = r;
    }
    const temporarios: Lancamento[] = datas.map((d) => ({
      id: `novo-${d}`,
      contrato_id: contratoId,
      vencimento: d,
      status: s,
      observacao: obs ?? null,
    }));
    rodar(
      [
        ...lista.map((l) => (sel.has(l.id) ? { ...l, status: s, observacao: obs === undefined ? l.observacao : obs } : l)),
        ...temporarios,
      ],
      async () => {
        const r1 = ids.length ? await mudarStatusVarios(ids, s, obs) : {};
        if (r1.erro) return r1;
        return datas.length ? criarComStatus(contratoId, datas, s, obs) : {};
      },
      limpar,
    );
  }

  function excluir() {
    if (sel.size === 0) return limpar();
    if (!confirm(`Excluir ${sel.size} vencimento(s)?`)) return;
    const ids = [...sel];
    rodar(lista.filter((l) => !sel.has(l.id)), () => excluirLancamentos(ids), limpar);
  }

  const selecionados = ordenada.filter((l) => sel.has(l.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="rounded-md border border-wegg-200 bg-white px-2 py-1" />
        <Botao disabled={!data || ocupado} onClick={() => rodar(null, () => criarLancamento(contratoId, data), () => setData(""))}>
          + Vencimento
        </Botao>
        <span className="text-wegg-400">ou</span>
        <Botao disabled={!data || ocupado} onClick={() => rodar(null, () => gerarVencimentos(contratoId, data, qtd, periodicidade), () => setData(""))}>
          gerar
        </Botao>
        <input type="number" min={1} max={60} value={qtd} onChange={(e) => setQtd(Number(e.target.value))} className="w-14 rounded-md border border-wegg-200 bg-white px-2 py-1" />
        <span className="text-wegg-500">meses a partir da data</span>
      </div>

      {!semLegenda && <Legenda />}
      {erro && <p className="text-sm text-rose-700">{erro}</p>}
      {anos.length === 0 && <p className="text-sm text-wegg-400">Sem vencimentos.</p>}

      <div className="space-y-1">
        {anos.map(([ano, meses]) => {
          const total = meses.flat();
          const aberto = anosAbertos ? anosAbertos.includes(ano) : ano >= anoAtual;
          const lancados = total.filter((l) => l.status === "lancado" || l.status === "sem_fatura").length;
          return (
            <details key={ano} open={aberto} className="group rounded-lg border border-wegg-100 bg-white">
              <summary className="flex cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm">
                <span className="font-semibold">{ano}</span>
                <span className="text-xs text-wegg-500">{lancados}/{total.length} resolvidos</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); selecionarAno(meses); }}
                  className="ml-auto text-xs text-wegg-600 hover:underline"
                >
                  selecionar ano
                </button>
              </summary>
              <div className="grid grid-cols-6 gap-1.5 px-3 pb-3 sm:grid-cols-12">
                {meses.map((ls, i) => (
                  <div key={i} className="min-w-0">
                    <div className="mb-0.5 text-center text-[10px] uppercase tracking-wide text-wegg-400">{MESES[i]}</div>
                    <div className="flex flex-col gap-1">
                      {ls.length === 0 && (() => {
                        const d = dataVazia(ano, i);
                        const marcado = vazios.has(d);
                        return (
                          <button
                            type="button"
                            title={`${formatarData(d)} · sem registro — clique para marcar (ex.: Não teve)`}
                            onClick={() => alternarVazio(d)}
                            className={`h-8 rounded-md border border-dashed text-xs ${
                              marcado
                                ? "border-wegg-900 bg-wegg-50 text-wegg-900 outline outline-2 outline-offset-1 outline-wegg-900"
                                : "border-wegg-100 text-transparent hover:border-wegg-300 hover:text-wegg-300"
                            }`}
                          >
                            +
                          </button>
                        );
                      })()}
                      {ls.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          title={`${formatarData(l.vencimento)} · ${STATUS_ROTULO[l.status]}${l.observacao ? ` · ${l.observacao}` : ""}`}
                          onClick={(e) => alternar(l, e.shiftKey)}
                          className={`relative h-8 rounded-md text-xs font-semibold ring-1 ring-inset transition ${STATUS_CELULA[l.status]} ${
                            sel.has(l.id) ? "outline outline-2 outline-offset-1 outline-wegg-900" : ""
                          }`}
                        >
                          {l.vencimento.slice(8, 10)}
                          {l.observacao && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-wegg-900" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {sel.size + vazios.size > 0 && (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-wegg-900 px-3 py-2 text-off shadow-lg">
          <span className="text-sm">
            {sel.size + vazios.size} selecionado(s)
            {vazios.size > 0 && <span className="text-off/60"> · {vazios.size} mês(es) vazio(s) serão criados</span>}
            {selecionados.length > 0 && (
              <span className="text-off/60"> · {formatarData(selecionados[0].vencimento)} a {formatarData(selecionados[selecionados.length - 1].vencimento)}</span>
            )}
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <Botao cor="laranja" disabled={ocupado} onClick={() => aplicar("medido")}>Medido</Botao>
            <Botao cor="verde" disabled={ocupado} onClick={() => aplicar("lancado")}>Título lançado</Botao>
            <Botao cor="amarelo" disabled={ocupado} onClick={() => aplicar("pendente")}>Pendência</Botao>
            <Botao disabled={ocupado} onClick={() => aplicar("sem_fatura")}>Não teve</Botao>
            <Botao disabled={ocupado} onClick={() => aplicar("aberto")}>A medir</Botao>
            {sel.size > 0 && <Botao disabled={ocupado} onClick={excluir}>Excluir</Botao>}
            <button type="button" onClick={limpar} className="px-2 text-xs text-off/70 hover:text-off">limpar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Legenda() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-wegg-600">
      {(Object.keys(STATUS_ROTULO) as StatusLancamento[]).map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded-sm ring-1 ring-inset ${STATUS_CELULA[s]}`} />
          {STATUS_ROTULO[s]}
        </span>
      ))}
      <span className="text-wegg-400">· Shift+clique seleciona um intervalo · quadrado tracejado = mês sem registro (clique para marcar)</span>
    </div>
  );
}
