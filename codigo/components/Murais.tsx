"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { mudarSituacao, mudarStatusVarios } from "@/app/actions";
import { formatarData, normalizar, textoPrazo } from "@/lib/datas";
import type { ItemMural, Situacao, StatusLancamento } from "@/lib/tipos";
import { Botao, SeletorSituacao, SeloTipo } from "./ui";

type Chave = ItemMural["mural"];

const MURAIS: { chave: Chave; titulo: string; ajuda: string; cor: string }[] = [
  { chave: "medir", titulo: "Fazer medição", ajuda: "Vence em até 10 dias ou já venceu", cor: "bg-wegg-900" },
  { chave: "titulo", titulo: "Lançar título", ajuda: "Medição feita, falta o título", cor: "bg-orange-500" },
  { chave: "pendente", titulo: "Pendências", ajuda: "Ficam aqui até regularizar", cor: "bg-yellow-400" },
];

/** Um cartão por contrato em cada mural, com todas as datas dele juntas. */
interface Grupo {
  chave: string;
  mural: Chave;
  contrato_id: string;
  codigo: string | null;
  fornecedor: string;
  tipo: ItemMural["tipo"];
  itens: ItemMural[];
}

function agrupar(itens: ItemMural[]): Grupo[] {
  const m = new Map<string, Grupo>();
  for (const i of itens) {
    const chave = `${i.mural}|${i.contrato_id}`;
    if (!m.has(chave)) {
      m.set(chave, { chave, mural: i.mural, contrato_id: i.contrato_id, codigo: i.codigo, fornecedor: i.fornecedor, tipo: i.tipo, itens: [] });
    }
    m.get(chave)!.itens.push(i);
  }
  return [...m.values()].sort((a, b) => a.itens[0].vencimento.localeCompare(b.itens[0].vencimento));
}

/** Para onde o item vai depois de mudar de status — espelha `vw_mural`. */
function destino(item: ItemMural, status: StatusLancamento, obs?: string | null): ItemMural | null {
  const observacao = obs === undefined ? item.observacao : obs;
  if (status === "lancado") return null;
  if (status === "aberto") return item.dias <= 10 ? { ...item, status, observacao, mural: "medir" } : null;
  return { ...item, status, observacao, mural: status === "medido" ? "titulo" : "pendente" };
}

export default function Murais({ itens: iniciais }: { itens: ItemMural[] }) {
  const router = useRouter();
  const [itens, setItens] = useState(iniciais);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  useEffect(() => setItens(iniciais), [iniciais]);

  /** Atualiza a tela na hora e confirma no servidor; desfaz se falhar. */
  function executar(novo: ItemMural[], acao: () => Promise<{ erro?: string }>) {
    const anterior = itens;
    setItens(novo);
    setErro(null);
    iniciar(async () => {
      const r = await acao();
      if (r.erro) {
        setItens(anterior);
        setErro(r.erro);
      } else router.refresh();
    });
  }

  function status(ids: string[], s: StatusLancamento, obs?: string | null) {
    const alvo = new Set(ids);
    const novo = itens.flatMap((i) => {
      if (!alvo.has(i.id)) return [i];
      const d = destino(i, s, obs);
      return d ? [d] : [];
    });
    executar(novo, () => mudarStatusVarios(ids, s, obs));
  }

  function situacao(contratoId: string, s: Situacao) {
    if (s === "ativo") return;
    executar(itens.filter((i) => i.contrato_id !== contratoId), () => mudarSituacao(contratoId, s));
  }

  const grupos = useMemo(() => {
    const t = normalizar(busca);
    const f = t
      ? itens.filter((i) => normalizar(`${i.codigo ?? ""} ${i.fornecedor} ${formatarData(i.vencimento)}`).includes(t))
      : itens;
    return agrupar(f);
  }, [itens, busca]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Painel</h1>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar por contrato, fornecedor ou data…"
          className="ml-auto w-full rounded-lg border border-wegg-200 bg-white px-3 py-1.5 text-sm sm:w-80"
        />
      </div>
      {erro && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {MURAIS.slice(0, 2).map((m) => (
          <Mural key={m.chave} {...m} grupos={grupos.filter((g) => g.mural === m.chave)} onStatus={status} onSituacao={situacao} />
        ))}
      </div>
      <Mural {...MURAIS[2]} grupos={grupos.filter((g) => g.mural === "pendente")} onStatus={status} onSituacao={situacao} largo />
    </div>
  );
}

type Acoes = {
  onStatus: (ids: string[], s: StatusLancamento, obs?: string | null) => void;
  onSituacao: (contratoId: string, s: Situacao) => void;
};

function Mural({ titulo, ajuda, cor, grupos, largo, ...acoes }: (typeof MURAIS)[number] & Acoes & { grupos: Grupo[]; largo?: boolean }) {
  const total = grupos.reduce((n, g) => n + g.itens.length, 0);
  return (
    <section className="overflow-hidden rounded-xl border border-wegg-100 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-wegg-100 px-4 py-3">
        <span className={`h-2.5 w-2.5 rounded-full ${cor}`} />
        <div className="min-w-0">
          <h2 className="font-semibold leading-tight">{titulo}</h2>
          <p className="text-xs text-wegg-500">{ajuda}</p>
        </div>
        <span className="ml-auto rounded-full bg-wegg-50 px-2.5 py-0.5 text-sm font-semibold">{total}</span>
      </header>
      {grupos.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-wegg-300">Nada aqui.</p>
      ) : (
        <ul className={largo ? "grid divide-wegg-50 sm:grid-cols-2 sm:gap-px sm:bg-wegg-50" : "divide-y divide-wegg-50"}>
          {grupos.map((g) => (
            <Cartao key={g.chave} grupo={g} {...acoes} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Cartao({ grupo, onStatus, onSituacao }: { grupo: Grupo } & Acoes) {
  const [motivo, setMotivo] = useState<string | null>(null);
  const ids = grupo.itens.map((i) => i.id);
  const primeiro = grupo.itens[0];
  const varios = grupo.itens.length > 1;
  const notas = [...new Set(grupo.itens.map((i) => i.observacao).filter(Boolean))];

  return (
    <li className={`px-4 py-2.5 ${grupo.mural === "pendente" ? "bg-yellow-50/70" : "bg-white"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Link href={`/contratos/${grupo.contrato_id}`} className="min-w-0 flex-1 basis-48 hover:underline">
          <span className="block truncate text-sm font-medium">
            {grupo.codigo && <span className="mr-1 font-mono text-xs text-wegg-400">{grupo.codigo}</span>}
            {grupo.fornecedor}
          </span>
          <span className="flex flex-wrap items-center gap-1 text-xs">
            {grupo.itens.map((i) => (
              <span key={i.id} className={`rounded px-1 ${i.dias < 0 ? "bg-rose-50 font-semibold text-rose-700" : "bg-wegg-50 text-wegg-700"}`}>
                {formatarData(i.vencimento).slice(0, 5)}
              </span>
            ))}
            <span className={primeiro.dias < 0 ? "text-rose-600" : "text-wegg-500"}>
              {varios ? `${grupo.itens.length} meses · ` : ""}
              {textoPrazo(primeiro.dias)}
            </span>
            <SeloTipo tipo={grupo.tipo} />
          </span>
        </Link>

        {motivo === null && (
          <div className="flex items-center gap-1.5">
            {grupo.mural === "medir" && (
              <>
                <Botao cor="laranja" onClick={() => onStatus(ids, "medido")}>Medido</Botao>
                <Botao cor="verde" onClick={() => onStatus(ids, "lancado")} title="Medição e título já feitos">Lançado</Botao>
              </>
            )}
            {grupo.mural === "titulo" && (
              <>
                <Botao cor="verde" onClick={() => onStatus(ids, "lancado")}>Título lançado</Botao>
                <Botao onClick={() => onStatus(ids, "aberto")} title="Voltar para a medição">↩</Botao>
              </>
            )}
            {grupo.mural === "pendente" && (
              <>
                <Botao onClick={() => onStatus(ids, "aberto")}>A medir</Botao>
                <Botao cor="laranja" onClick={() => onStatus(ids, "medido")}>Medido</Botao>
                <Botao cor="verde" onClick={() => onStatus(ids, "lancado")}>Lançado</Botao>
              </>
            )}
            <Mais
              pendente={grupo.mural === "pendente"}
              contratoId={grupo.contrato_id}
              onPendencia={() => setMotivo(notas[0] ?? "")}
              onSituacao={(s) => onSituacao(grupo.contrato_id, s)}
            />
          </div>
        )}
      </div>

      {notas.length > 0 && motivo === null && <p className="mt-1 text-xs text-wegg-700">📝 {notas.join(" · ")}</p>}

      {motivo !== null && (
        <div className="mt-2 space-y-2">
          <textarea
            autoFocus
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da pendência (opcional)"
            className="w-full rounded-md border border-wegg-200 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <Botao cor="amarelo" onClick={() => { onStatus(ids, "pendente", motivo); setMotivo(null); }}>
              {grupo.mural === "pendente" ? "Salvar nota" : "Marcar pendência"}
            </Botao>
            <Botao onClick={() => setMotivo(null)}>Cancelar</Botao>
          </div>
        </div>
      )}
    </li>
  );
}

/** Menu "⋯": pendência, vários meses e situação do contrato. */
function Mais({
  pendente,
  contratoId,
  onPendencia,
  onSituacao,
}: {
  pendente: boolean;
  contratoId: string;
  onPendencia: () => void;
  onSituacao: (s: Situacao) => void;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="relative">
      <Botao onClick={() => setAberto(!aberto)} aria-label="Mais opções" aria-expanded={aberto} className="px-2">⋯</Botao>
      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 space-y-1 rounded-lg border border-wegg-100 bg-white p-2 text-sm shadow-lg">
            <button type="button" onClick={() => { setAberto(false); onPendencia(); }} className="block w-full rounded px-2 py-1 text-left hover:bg-yellow-50">
              {pendente ? "📝 Editar nota" : "⚠️ Marcar pendência"}
            </button>
            <Link href={`/contratos/${contratoId}`} className="block rounded px-2 py-1 hover:bg-wegg-50">
              📅 Lançar vários meses
            </Link>
            <label className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs text-wegg-600">
              Situação
              <SeletorSituacao valor="ativo" onChange={(s) => { setAberto(false); onSituacao(s); }} />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
