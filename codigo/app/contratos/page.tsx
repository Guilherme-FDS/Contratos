import TabelaContratos from "@/components/TabelaContratos";
import { clienteServidor } from "@/lib/supabase-servidor";
import type { ContratoResumo } from "@/lib/tipos";

export const metadata = { title: "Contratos" };

export default async function Contratos() {
  const { data, error } = await clienteServidor()
    .from("vw_contratos")
    .select("*")
    .order("fornecedor");

  if (error) return <p className="text-sm text-rose-700">Erro ao carregar: {error.message}</p>;
  return <TabelaContratos contratos={(data ?? []) as ContratoResumo[]} />;
}
