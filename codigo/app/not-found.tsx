import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="py-16 text-center">
      <p className="text-wegg-600">Não encontrado.</p>
      <Link href="/" className="text-sm underline">Voltar ao painel</Link>
    </div>
  );
}
