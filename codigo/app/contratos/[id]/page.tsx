import Link from "next/link";
import { notFound } from "next/navigation";
import { editarContrato } from "@/app/actions";
import FormularioContrato from "@/components/FormularioContrato";
import Lancamentos from "@/components/Lancamentos";
import { SeloSituacao, SeloTipo } from "@/components/ui";
import { clienteServidor } from "@/lib/supabase-servidor";
import type { Contrato, Lancamento } from "@/lib/tipos";

export default async function DetalheContrato({ params }: { params: { id: string } }) {
  const supabase = clienteServidor();
  const [{ data: contrato }, { data: lancamentos }] = await Promise.all([
    supabase.from("contratos").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("lancamentos").select("*").eq("contrato_id", params.id).order("vencimento", { ascending: false }),
  ]);
  if (!contrato) notFound();
  const c = contrato as Contrato;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contratos" className="text-sm text-slate-500 hover:underline">← Contratos</Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold">
          <span className="font-mono text-slate-500">{c.codigo ?? "—"}</span> {c.fornecedor}
          <SeloTipo tipo={c.tipo} /> <SeloSituacao situacao={c.situacao} />
        </h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Dados</h2>
          <FormularioContrato acao={editarContrato.bind(null, c.id)} contrato={c} />
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold">Vencimentos</h2>
          <Lancamentos contratoId={c.id} lancamentos={(lancamentos ?? []) as Lancamento[]} periodicidade={c.periodicidade_meses} />
        </section>
      </div>
    </div>
  );
}
