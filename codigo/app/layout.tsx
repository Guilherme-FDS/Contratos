import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import { clienteServidor } from "@/lib/supabase-servidor";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Contratos", template: "%s · Contratos" },
  description: "Controle de medições e títulos a pagar de contratos",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  try {
    const { data } = await clienteServidor().auth.getUser();
    email = data.user?.email ?? null;
  } catch {
    // Sem env var: deixa a tela de login explicar em vez de quebrar tudo.
  }

  return (
    <html lang="pt-BR">
      <body className="min-h-[100dvh] bg-slate-50 text-slate-900 antialiased">
        {email && <Nav email={email} />}
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
