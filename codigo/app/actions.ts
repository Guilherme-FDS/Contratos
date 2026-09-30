"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase-servidor";
import type { Situacao, StatusLancamento, TipoContrato } from "@/lib/tipos";

const STATUS: StatusLancamento[] = ["aberto", "medido", "lancado", "pendente"];
const SITUACOES: Situacao[] = ["ativo", "concluido", "rescindido", "inativo"];
const TIPOS: TipoContrato[] = ["normal", "periodico", "waldemar"];
const DATA = /^\d{4}-\d{2}-\d{2}$/;

type Resultado = { erro?: string };

function revalidarTudo() {
  revalidatePath("/", "layout");
}

/**
 * Muda a etapa de um vencimento. `observacao` só é gravada quando vier
 * definida (pendência costuma levar o motivo).
 */
export async function mudarStatus(
  id: string,
  status: StatusLancamento,
  observacao?: string | null,
): Promise<Resultado> {
  if (!STATUS.includes(status)) return { erro: "Status inválido." };
  const dados: Record<string, unknown> = { status };
  if (observacao !== undefined) dados.observacao = observacao?.trim() || null;

  const { error } = await clienteServidor().from("lancamentos").update(dados).eq("id", id);
  if (error) return { erro: error.message };
  revalidarTudo();
  return {};
}

export async function mudarSituacao(contratoId: string, situacao: Situacao): Promise<Resultado> {
  if (!SITUACOES.includes(situacao)) return { erro: "Situação inválida." };
  const { error } = await clienteServidor().from("contratos").update({ situacao }).eq("id", contratoId);
  if (error) return { erro: error.message };
  revalidarTudo();
  return {};
}

export async function criarLancamento(contratoId: string, vencimento: string): Promise<Resultado> {
  if (!DATA.test(vencimento)) return { erro: "Data inválida." };
  const { error } = await clienteServidor()
    .from("lancamentos")
    .insert({ contrato_id: contratoId, vencimento });
  if (error) return { erro: error.code === "23505" ? "Já existe um vencimento nessa data." : error.message };
  revalidarTudo();
  return {};
}

/** Cria `quantidade` vencimentos mensais a partir de `inicio` (pula os que já existem). */
export async function gerarVencimentos(
  contratoId: string,
  inicio: string,
  quantidade: number,
  periodicidade = 1,
): Promise<Resultado> {
  if (!DATA.test(inicio)) return { erro: "Data inválida." };
  const n = Math.min(Math.max(Math.trunc(quantidade) || 0, 1), 60);
  const [a, m, d] = inicio.split("-").map(Number);
  const linhas = Array.from({ length: n }, (_, i) => {
    const mes = m - 1 + i * periodicidade;
    // Dia 31 em mês curto cai no último dia do mês, como o Excel faria à mão.
    const ultimo = new Date(Date.UTC(a, mes + 1, 0)).getUTCDate();
    const dt = new Date(Date.UTC(a, mes, Math.min(d, ultimo)));
    return { contrato_id: contratoId, vencimento: dt.toISOString().slice(0, 10) };
  });
  const { error } = await clienteServidor()
    .from("lancamentos")
    .upsert(linhas, { onConflict: "contrato_id,vencimento", ignoreDuplicates: true });
  if (error) return { erro: error.message };
  revalidarTudo();
  return {};
}

export async function excluirLancamento(id: string): Promise<Resultado> {
  const { error } = await clienteServidor().from("lancamentos").delete().eq("id", id);
  if (error) return { erro: error.message };
  revalidarTudo();
  return {};
}

function lerContrato(form: FormData) {
  const tipo = String(form.get("tipo") ?? "normal") as TipoContrato;
  const situacao = String(form.get("situacao") ?? "ativo") as Situacao;
  return {
    codigo: String(form.get("codigo") ?? "").trim() || null,
    fornecedor: String(form.get("fornecedor") ?? "").trim(),
    tipo: TIPOS.includes(tipo) ? tipo : "normal",
    situacao: SITUACOES.includes(situacao) ? situacao : "ativo",
    periodicidade_meses: Math.min(Math.max(Number(form.get("periodicidade_meses")) || 1, 1), 60),
    observacao: String(form.get("observacao") ?? "").trim() || null,
  };
}

export async function criarContrato(_: Resultado, form: FormData): Promise<Resultado> {
  const dados = lerContrato(form);
  if (!dados.fornecedor) return { erro: "Informe o fornecedor." };
  const supabase = clienteServidor();
  const { data, error } = await supabase.from("contratos").insert(dados).select("id").single();
  if (error) return { erro: error.message };

  const primeiro = String(form.get("primeiro_vencimento") ?? "");
  const qtd = Number(form.get("quantidade") ?? 12);
  if (DATA.test(primeiro)) {
    const r = await gerarVencimentos(data.id, primeiro, qtd, dados.periodicidade_meses);
    if (r.erro) return r;
  }
  revalidarTudo();
  redirect(`/contratos/${data.id}`);
}

export async function editarContrato(id: string, _: Resultado, form: FormData): Promise<Resultado> {
  const dados = lerContrato(form);
  if (!dados.fornecedor) return { erro: "Informe o fornecedor." };
  const { error } = await clienteServidor().from("contratos").update(dados).eq("id", id);
  if (error) return { erro: error.message };
  revalidarTudo();
  return {};
}
