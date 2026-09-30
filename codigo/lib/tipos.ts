export type StatusLancamento = "aberto" | "medido" | "lancado" | "pendente";
export type Situacao = "ativo" | "concluido" | "rescindido" | "inativo";
export type TipoContrato = "normal" | "periodico" | "waldemar";

export interface Contrato {
  id: string;
  codigo: string | null;
  fornecedor: string;
  tipo: TipoContrato;
  situacao: Situacao;
  periodicidade_meses: number;
  observacao: string | null;
}

/** Linha de `vw_contratos`. */
export interface ContratoResumo extends Contrato {
  proximo_vencimento: string | null;
  proximo_status: StatusLancamento | null;
  ultimo_lancado: string | null;
  qtd_pendentes: number;
}

export interface Lancamento {
  id: string;
  contrato_id: string;
  vencimento: string;
  status: StatusLancamento;
  observacao: string | null;
}

/** Linha de `vw_mural`. */
export interface ItemMural extends Lancamento {
  codigo: string | null;
  fornecedor: string;
  tipo: TipoContrato;
  dias: number;
  mural: "medir" | "titulo" | "pendente";
}

export const STATUS_ROTULO: Record<StatusLancamento, string> = {
  aberto: "A medir",
  medido: "Medição feita",
  lancado: "Título lançado",
  pendente: "Pendência",
};

/** Cor sólida da célula na grade de meses (mesmas cores da planilha). */
export const STATUS_CELULA: Record<StatusLancamento, string> = {
  aberto: "bg-white text-wegg-900 ring-wegg-200",
  medido: "bg-orange-400 text-white ring-orange-500",
  lancado: "bg-green-600 text-white ring-green-700",
  pendente: "bg-yellow-300 text-yellow-950 ring-yellow-500",
};

/** Laranja = medido, verde = lançado, amarelo = pendência. */
export const STATUS_COR: Record<StatusLancamento, string> = {
  aberto: "bg-wegg-50 text-wegg-700 ring-wegg-200",
  medido: "bg-orange-100 text-orange-800 ring-orange-400",
  lancado: "bg-green-100 text-green-800 ring-green-500",
  pendente: "bg-yellow-100 text-yellow-900 ring-yellow-400",
};

export const SITUACAO_ROTULO: Record<Situacao, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  rescindido: "Rescindido",
  inativo: "Inativo",
};

export const TIPO_ROTULO: Record<TipoContrato, string> = {
  normal: "Contrato",
  periodico: "Periódico",
  waldemar: "Waldemar",
};

export const TIPO_AJUDA: Record<TipoContrato, string> = {
  normal: "Prazo definido: informe quantos meses. Termina no último.",
  periodico: "Renova sozinho todo mês até você concluir ou inativar.",
  waldemar: "Conta do Sr. Waldemar. Renova sozinha como o periódico.",
};
