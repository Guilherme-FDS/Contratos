"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", rotulo: "Painel" },
  { href: "/contratos", rotulo: "Contratos" },
  { href: "/waldemar", rotulo: "Waldemar" },
];

/** Sem nome nem e-mail do usuário na tela (nem no HTML enviado). */
export default function Nav() {
  const caminho = usePathname();
  const ativa = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <header className="sticky top-0 z-20 bg-wegg-900 pt-[env(safe-area-inset-top)] text-off shadow">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="mr-1 flex shrink-0 items-center sm:mr-3" aria-label="Painel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-wegg-claro.png" alt="Wegg" className="h-3 w-auto sm:h-5" />
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {ABAS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`rounded-md px-2 py-1.5 text-sm sm:px-3 font-medium tracking-wide ${
                ativa(a.href) ? "bg-off text-wegg-900" : "text-off/80 hover:bg-white/10"
              }`}
            >
              {a.rotulo}
            </Link>
          ))}
        </nav>
        <form action="/auth/sair" method="post" className="ml-auto">
          <button className="rounded-md px-2 py-1 text-sm text-off/80 hover:bg-white/10">Sair</button>
        </form>
      </div>
    </header>
  );
}
