import { SITUACAO_ROTULO, STATUS_COR, STATUS_ROTULO, TIPO_ROTULO } from "@/lib/tipos";
import type { Situacao, StatusLancamento, TipoContrato } from "@/lib/tipos";

export function SeloStatus({ status }: { status: StatusLancamento }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COR[status]}`}>
      {STATUS_ROTULO[status]}
    </span>
  );
}

export function SeloTipo({ tipo }: { tipo: TipoContrato }) {
  if (tipo !== "waldemar") return null;
  return <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-purple-800">{TIPO_ROTULO[tipo]}</span>;
}

export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  const cor: Record<Situacao, string> = {
    ativo: "text-green-700",
    concluido: "text-wegg-500",
    rescindido: "text-rose-700",
    inativo: "text-wegg-300",
  };
  return <span className={`text-xs font-medium ${cor[situacao]}`}>{SITUACAO_ROTULO[situacao]}</span>;
}

export function SeletorSituacao({
  valor,
  onChange,
  disabled,
}: {
  valor: Situacao;
  onChange: (s: Situacao) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label="Situação do contrato"
      value={valor}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Situacao)}
      className="rounded-md border border-wegg-200 bg-white px-1.5 py-1 text-xs"
    >
      {(Object.keys(SITUACAO_ROTULO) as Situacao[]).map((s) => (
        <option key={s} value={s}>
          {SITUACAO_ROTULO[s]}
        </option>
      ))}
    </select>
  );
}

const BOTAO: Record<string, string> = {
  laranja: "bg-orange-500 text-white hover:bg-orange-600",
  verde: "bg-green-600 text-white hover:bg-green-700",
  amarelo: "bg-yellow-300 text-yellow-950 hover:bg-yellow-400",
  neutro: "bg-white text-wegg-800 ring-1 ring-inset ring-wegg-200 hover:bg-wegg-50",
  marca: "bg-wegg-900 text-off hover:bg-wegg-800",
};

export function Botao({
  cor = "neutro",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { cor?: keyof typeof BOTAO }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${BOTAO[cor]} ${className}`}
    />
  );
}
