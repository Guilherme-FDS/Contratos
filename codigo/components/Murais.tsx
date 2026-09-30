"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { mudarSituacao, mudarStatus } from "@/app/actions";
import { formatarData, normalizar, textoPrazo } from "@/lib/datas";
import type { ItemMural, Situacao, StatusLancamento } from "@/lib/tipos";
import { Botao, SeletorSituacao, SeloTipo } from "./ui";

const MURAIS: { chave: ItemMural["mural"]; titulo: string; ajuda: string; borda: string }[] = [
  {
    chave: "medir",
    titulo: "Fazer medição",
    ajuda: "Vencimentos nos próximos 10 dias (ou atrasados) ainda sem medição.",
    borda: "border-t-slate-400",
  },
  {
    chave: "titulo",
    titulo: "Lançar título a pagar",
    ajuda: "Medição feita (laranja), falta lançar o título (verde).",
    borda: "border-t-orange-500",
  },
  {
    chave: "pendente",
    titulo: "Pendências",
    ajuda: "Ficam aqui até você regularizar.",
    borda: "border-t-yellow-400",
  },
];

/** Para onde o item vai depois de mudar de status — espelha `vw_mural`. */
function destino(item: ItemMural, status: StatusLancamento): ItemMural | null {
  if (status === "lancado") return null;
  if (status === "aberto") return item.dias <= 10 ? { ...item, status, mural: "medir" } : null;
  return { ...item, status, mural: status === "medido" ? "titulo" : "pendente" };
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
      } else {
        router.refresh();
      }
    });
  }

  function status(item: ItemMural, s: StatusLancamento, observacao?: string | null) {
    const d = destino(item, s);
    const novo = itens.flatMap((i) =>
      i.id !== item.id ? [i] : d ? [{ ...d, observacao: observacao === undefined ? i.observacao : observacao }] : [],
    );
    executar(novo, () => mudarStatus(item.id, s, observacao));
  }

  function situacao(item: ItemMural, s: Situacao) {
    if (s === "ativo") return;
    executar(
      itens.filter((i) => i.contrato_id !== item.contrato_id),
      () => mudarSituacao(item.contrato_id, s),
    );
  }

  const filtrados = useMemo(() => {
    const t = normalizar(busca);
    if (!t) return itens;
    return itens.filter((i) =>
      normalizar(`${i.codigo ?? ""} ${i.fornecedor} ${formatarData(i.vencimento)}`).includes(t),
    );
  }, [itens, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">Painel</h1>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar por contrato, fornecedor ou data…"
          className="ml-auto w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm sm:w-80"
        />
      </div>
      {erro && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {MURAIS.slice(0, 2).map((m) => (
          <Mural key={m.chave} {...m} itens={filtrados.filter((i) => i.mural === m.chave)} onStatus={status} onSituacao={situacao} />
        ))}
      </div>
      <Mural {...MURAIS[2]} itens={filtrados.filter((i) => i.mural === "pendente")} onStatus={status} onSituacao={situacao} />
    </div>
  );
}

function Mural({
  chave,
  titulo,
  ajuda,
  borda,
  itens,
  onStatus,
  onSituacao,
}: (typeof MURAIS)[number] & {
  itens: ItemMural[];
  onStatus: (i: ItemMural, s: StatusLancamento, obs?: string | null) => void;
  onSituacao: (i: ItemMural, s: Situacao) => void;
}) {
  return (
    <section className={`rounded-xl border border-t-4 border-slate-200 bg-white ${borda}`}>
      <header className="flex items-baseline justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          <p className="text-xs text-slate-500">{ajuda}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold">{itens.length}</span>
      </header>
      {itens.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">Nada aqui.</p>
      ) : (
        <ul className={`divide-y divide-slate-100 ${chave === "pendente" ? "grid sm:grid-cols-2 sm:divide-y-0" : ""}`}>
          {itens.map((i) => (
            <Cartao key={i.id} item={i} onStatus={onStatus} onSituacao={onSituacao} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Cartao({
  item,
  onStatus,
  onSituacao,
}: {
  item: ItemMural;
  onStatus: (i: ItemMural, s: StatusLancamento, obs?: string | null) => void;
  onSituacao: (i: ItemMural, s: Situacao) => void;
}) {
  const [motivo, setMotivo] = useState<string | null>(null);
  const atrasado = item.dias < 0;

  return (
    <li className={`space-y-2 px-4 py-3 ${item.mural === "pendente" ? "border-b border-slate-100 bg-yellow-50/60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/contratos/${item.contrato_id}`} className="block truncate text-sm font-medium hover:underline">
            <span className="font-mono text-slate-500">{item.codigo ?? "—"}</span> {item.fornecedor}
          </Link>
          <p className="text-xs text-slate-500">
            {formatarData(item.vencimento)} ·{" "}
            <span className={atrasado ? "font-semibold text-rose-600" : ""}>{textoPrazo(item.dias)}</span>
          </p>
        </div>
        <SeloTipo tipo={item.tipo} />
      </div>

      {item.observacao && <p className="text-xs text-slate-700">📝 {item.observacao}</p>}

      {motivo !== null ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da pendência (opcional)"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <Botao cor="amarelo" onClick={() => { onStatus(item, "pendente", motivo); setMotivo(null); }}>
              Salvar pendência
            </Botao>
            <Botao onClick={() => setMotivo(null)}>Cancelar</Botao>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {item.mural === "medir" && (
            <>
              <Botao cor="laranja" onClick={() => onStatus(item, "medido")}>Medição feita</Botao>
              <Botao cor="amarelo" onClick={() => setMotivo(item.observacao ?? "")}>Pendência</Botao>
            </>
          )}
          {item.mural === "titulo" && (
            <>
              <Botao cor="verde" onClick={() => onStatus(item, "lancado")}>Título lançado</Botao>
              <Botao onClick={() => onStatus(item, "aberto")}>Desfazer medição</Botao>
              <Botao cor="amarelo" onClick={() => setMotivo(item.observacao ?? "")}>Pendência</Botao>
            </>
          )}
          {item.mural === "pendente" && (
            <>
              <span className="text-xs text-slate-500">Regularizar →</span>
              <Botao onClick={() => onStatus(item, "aberto")}>A medir</Botao>
              <Botao cor="laranja" onClick={() => onStatus(item, "medido")}>Medido</Botao>
              <Botao cor="verde" onClick={() => onStatus(item, "lancado")}>Lançado</Botao>
              <Botao onClick={() => setMotivo(item.observacao ?? "")}>Editar nota</Botao>
            </>
          )}
          <span className="ml-auto">
            <SeletorSituacao valor="ativo" onChange={(s) => onSituacao(item, s)} />
          </span>
        </div>
      )}
    </li>
  );
}
