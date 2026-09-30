"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", rotulo: "Painel" },
  { href: "/contratos", rotulo: "Contratos" },
  { href: "/waldemar", rotulo: "Waldemar" },
];

export default function Nav({ email }: { email: string }) {
  const caminho = usePathname();
  const ativa = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
        <span className="mr-3 font-semibold tracking-tight">Contratos</span>
        <nav className="flex gap-1 overflow-x-auto">
          {ABAS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              prefetch
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                ativa(a.href) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {a.rotulo}
            </Link>
          ))}
        </nav>
        <form action="/auth/sair" method="post" className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">{email}</span>
          <button className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">Sair</button>
        </form>
      </div>
    </header>
  );
}
