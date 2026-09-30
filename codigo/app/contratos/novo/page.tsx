import Link from "next/link";
import { criarContrato } from "@/app/actions";
import FormularioContrato from "@/components/FormularioContrato";
import type { TipoContrato } from "@/lib/tipos";

export const metadata = { title: "Novo contrato" };

export default function NovoContrato({ searchParams }: { searchParams: { tipo?: string } }) {
  const tipo: TipoContrato = searchParams.tipo === "waldemar" || searchParams.tipo === "periodico" ? searchParams.tipo : "normal";
  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/contratos" className="text-sm text-slate-500 hover:underline">← Contratos</Link>
      <h1 className="text-lg font-semibold">{tipo === "waldemar" ? "Nova conta do Waldemar" : "Novo contrato"}</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <FormularioContrato acao={criarContrato} tipoPadrao={tipo} />
      </div>
    </div>
  );
}
