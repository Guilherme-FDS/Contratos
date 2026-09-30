import Link from "next/link";
import Lancamentos from "@/components/Lancamentos";
import { SeloSituacao } from "@/components/ui";
import { formatarData } from "@/lib/datas";
import { clienteServidor } from "@/lib/supabase-servidor";
import type { ContratoResumo, Lancamento } from "@/lib/tipos";

export const metadata = { title: "Waldemar" };

/**
 * Contas pessoais do Sr. Waldemar. Os vencimentos também aparecem no
 * Painel (tipo "waldemar"); aqui é a visão detalhada, conta por conta.
 */
export default async function Waldemar({ searchParams }: { searchParams: { todas?: string } }) {
  const supabase = clienteServidor();
  let consulta = supabase.from("vw_contratos").select("*").eq("tipo", "waldemar").order("fornecedor");
  if (!searchParams.todas) consulta = consulta.eq("situacao", "ativo");
  const { data: contas } = await consulta;
  const ids = (contas ?? []).map((c) => c.id);
  const { data: lancs } = ids.length
    ? await supabase.from("lancamentos").select("*").in("contrato_id", ids).order("vencimento", { ascending: false })
    : { data: [] };

  const porConta = new Map<string, Lancamento[]>();
  for (const l of (lancs ?? []) as Lancamento[]) {
    porConta.set(l.contrato_id, [...(porConta.get(l.contrato_id) ?? []), l]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-lg font-semibold">Contas do Waldemar</h1>
        <Link href={searchParams.todas ? "/waldemar" : "/waldemar?todas=1"} className="text-sm text-slate-500 hover:underline">
          {searchParams.todas ? "Só ativas" : "Mostrar encerradas"}
        </Link>
        <Link href="/contratos/novo?tipo=waldemar" className="rounded-md bg-purple-700 px-3 py-1.5 text-sm font-medium text-white">
          + Nova conta
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {((contas ?? []) as ContratoResumo[]).map((c) => (
          <section key={c.id} className="space-y-2 rounded-xl border border-purple-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
              <Link href={`/contratos/${c.id}`} className="font-semibold hover:underline">{c.fornecedor}</Link>
              <SeloSituacao situacao={c.situacao} />
            </div>
            <p className="text-xs text-slate-500">
              Próximo: {formatarData(c.proximo_vencimento)} · último lançado: {formatarData(c.ultimo_lancado)}
              {c.qtd_pendentes > 0 && <span className="ml-2 font-semibold text-yellow-700">{c.qtd_pendentes} pendência(s)</span>}
            </p>
            {c.observacao && <p className="text-xs text-slate-600">📝 {c.observacao}</p>}
            <Lancamentos contratoId={c.id} lancamentos={porConta.get(c.id) ?? []} periodicidade={c.periodicidade_meses} compacto />
          </section>
        ))}
      </div>
    </div>
  );
}
