import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import Nav from "@/components/Nav";
import ServiceWorker from "@/components/ServiceWorker";
import { clienteServidor } from "@/lib/supabase-servidor";
import "./globals.css";

// Baixada no build e servida pelo próprio site (sem chamada ao Google).
const fonte = Jost({ subsets: ["latin"], variable: "--fonte", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Wegg · Contratos", template: "%s · Wegg Contratos" },
  description: "Medições e títulos a pagar de contratos",
  applicationName: "Wegg Contratos",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Contratos", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#003051",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let logado = false;
  try {
    const { data } = await clienteServidor().auth.getUser();
    logado = !!data.user;
  } catch {
    // Sem env var: a tela de login aparece em vez de derrubar o site.
  }

  return (
    <html lang="pt-BR" className={fonte.variable}>
      <body className="min-h-[100dvh] bg-off-50 font-sans text-wegg-900 antialiased">
        <ServiceWorker />
        {logado && <Nav />}
        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
