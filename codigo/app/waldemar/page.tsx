import Link from "next/link";
import Obs from "@/components/Obs";
import GradeMeses, { Legenda } from "@/components/GradeMeses";
import { SeloStatus } from "@/components/ui";
import { formatarData } from "@/lib/datas";
import { clienteServidor } from "@/lib/supabase-servidor";
import { STATUS_CELULA, STATUS_ROTULO } from "@/lib/tipos";
import type { ContratoResumo, Lancamento } from "@/lib/tipos";

export const metadata = { title: "Waldemar" };

const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** 12 meses: 5 para trás, o atual e 6 para frente. */
function janela(hoje = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
    return { chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, rotulo: MES[d.getMonth()], atual: i === 5 };
  });
}

/**
 * Contas pessoais do Sr. Waldemar em lista: uma linha por conta com a
 * faixa dos últimos/próximos meses. Clicar abre a grade completa da conta.
 * Os vencimentos também aparecem no Painel.
 */
export default async function Waldemar({ searchParams }: { searchParams: { todas?: string } }) {
  const supabase = clienteServidor();
  let consulta = supabase.from("vw_contratos").select("*").eq("tipo", "waldemar").order("proximo_vencimento", { nullsFirst: false });
  if (!searchParams.todas) consulta = consulta.eq("situacao", "ativo");
  const { data: contas } = await consulta;
  const ids = (contas ?? []).map((c) => c.id);
  const { data: lancs } = ids.length
    ? await supabase.from("lancamentos").select("*").in("contrato_id", ids)
    : { data: [] };

  const porConta = new Map<string, Lancamento[]>();
  for (const l of (lancs ?? []) as Lancamento[]) {
    porConta.set(l.contrato_id, [...(porConta.get(l.contrato_id) ?? []), l]);
  }
  const meses = janela();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold tracking-tight">Contas do Waldemar</h1>
        <Link href={searchParams.todas ? "/waldemar" : "/waldemar?todas=1"} className="text-sm text-wegg-500 hover:underline">
          {searchParams.todas ? "Só ativas" : "Mostrar encerradas"}
        </Link>
        <Link href="/contratos/novo?tipo=waldemar" className="rounded-lg bg-wegg-900 px-3 py-1.5 text-sm font-medium text-off">
          + Nova conta
        </Link>
      </div>
      <Legenda />

      <div className="overflow-hidden rounded-xl border border-wegg-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_7rem_8rem_minmax(0,2fr)] gap-3 border-b border-wegg-100 bg-wegg-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-wegg-500 md:grid">
          <span>Conta</span>
          <span>Próximo</span>
          <span>Etapa</span>
          <span className="grid grid-cols-12 gap-1 text-center">
            {meses.map((m) => (
              <span key={m.chave} className={m.atual ? "text-wegg-900" : ""}>{m.rotulo}</span>
            ))}
          </span>
        </div>

        {((contas ?? []) as ContratoResumo[]).map((c) => {
          const ls = porConta.get(c.id) ?? [];
          const porMes = new Map<string, Lancamento[]>();
          for (const l of ls) porMes.set(l.vencimento.slice(0, 7), [...(porMes.get(l.vencimento.slice(0, 7)) ?? []), l]);
          return (
            <details key={c.id} className="group border-b border-wegg-50 last:border-0">
              <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 hover:bg-wegg-50/60 md:grid-cols-[minmax(0,1.4fr)_7rem_8rem_minmax(0,2fr)]">
                <span className="min-w-0 truncate text-sm font-medium">
                  <span className="mr-1 inline-block text-wegg-300 transition group-open:rotate-90">›</span>
                  {c.fornecedor}
                  {c.qtd_pendentes > 0 && <span className="ml-2 rounded bg-yellow-200 px-1.5 text-[11px] font-semibold">{c.qtd_pendentes} pend.</span>}
                  {c.situacao !== "ativo" && <span className="ml-2 text-xs text-wegg-400">({c.situacao})</span>}
                </span>
                <span className="text-right text-sm text-wegg-700 md:text-left">{formatarData(c.proximo_vencimento)}</span>
                <span className="hidden md:block">{c.proximo_status ? <SeloStatus status={c.proximo_status} /> : "—"}</span>
                <span className="col-span-2 grid grid-cols-12 gap-1 md:col-span-1">
                  {meses.map((m) => {
                    const doMes = porMes.get(m.chave) ?? [];
                    // Pior etapa do mês decide a cor: pendência > aberto > medido > lançado.
                    const s = (["pendente", "aberto", "medido", "lancado", "sem_fatura"] as const).find((x) => doMes.some((l) => l.status === x));
                    return (
                      <span
                        key={m.chave}
                        title={s ? `${m.rotulo}: ${STATUS_ROTULO[s]}` : `${m.rotulo}: sem vencimento`}
                        className={`h-4 rounded-sm ring-1 ring-inset ${s ? STATUS_CELULA[s] : "ring-wegg-50"} ${m.atual ? "outline outline-1 outline-offset-1 outline-wegg-300" : ""}`}
                      />
                    );
                  })}
                </span>
              </summary>
              <div className="space-y-2 border-t border-wegg-50 bg-off-50/60 px-4 py-3">
                {c.observacao && <Obs texto={c.observacao} />}
                <GradeMeses contratoId={c.id} lancamentos={ls} periodicidade={c.periodicidade_meses} semLegenda />
                <Link href={`/contratos/${c.id}`} className="text-xs text-wegg-500 hover:underline">Editar conta →</Link>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
