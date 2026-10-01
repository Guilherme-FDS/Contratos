import FormularioLogin from "@/components/FormularioLogin";

export const metadata = { title: "Entrar" };

export default function Login({ searchParams }: { searchParams: { de?: string } }) {
  const destino = searchParams.de?.startsWith("/") && !searchParams.de.startsWith("//") ? searchParams.de : "/";

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-sm flex-col justify-center">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wegg.png" alt="Wegg" className="mx-auto h-8 w-auto" />
        <p className="mt-3 text-sm tracking-wide text-wegg-600">Controle de Contratos</p>
      </div>
      <div className="rounded-2xl border border-wegg-100 bg-white p-6 shadow-sm">
        <FormularioLogin destino={destino} />
      </div>
    </div>
  );
}
