import FormularioLogin from "@/components/FormularioLogin";

export const metadata = { title: "Entrar" };

export default function Login({ searchParams }: { searchParams: { de?: string } }) {
  const destino = searchParams.de?.startsWith("/") && !searchParams.de.startsWith("//") ? searchParams.de : "/";

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-sm flex-col justify-center">
      <h1 className="mb-6 text-center text-xl font-semibold tracking-tight">Plataforma de Contratos</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormularioLogin destino={destino} />
      </div>
    </div>
  );
}
