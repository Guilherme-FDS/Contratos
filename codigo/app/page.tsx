import Murais from "@/components/Murais";
import { clienteServidor } from "@/lib/supabase-servidor";
import type { ItemMural } from "@/lib/tipos";

export default async function Painel() {
  const { data, error } = await clienteServidor()
    .from("vw_mural")
    .select("*")
    .order("vencimento")
    .order("fornecedor");

  if (error) return <p className="text-sm text-rose-700">Erro ao carregar: {error.message}</p>;
  return <Murais itens={(data ?? []) as ItemMural[]} />;
}
