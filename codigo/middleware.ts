import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão a cada requisição e manda quem não está logado para
 * /login. A proteção dos dados é a RLS; isto só evita um painel vazio.
 */
export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cabecalhos = new Headers(request.headers);
  cabecalhos.set("x-nonce", nonce);

  let resposta = NextResponse.next({ request: { headers: cabecalhos } });
  aplicarHeadersSeguranca(resposta, nonce);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(paraGravar) {
        for (const { name, value } of paraGravar) request.cookies.set(name, value);
        const atualizados = new Headers(request.headers);
        atualizados.set("x-nonce", nonce);
        resposta = NextResponse.next({ request: { headers: atualizados } });
        aplicarHeadersSeguranca(resposta, nonce);
        for (const { name, value, options } of paraGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() revalida o token no servidor; getSession() confiaria no cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const livre = caminho.startsWith("/login") || caminho.startsWith("/auth/");

  if (!user && !livre) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    destino.searchParams.set("de", caminho);
    return redirecionar(destino, nonce);
  }
  if (user && caminho.startsWith("/login")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return redirecionar(destino, nonce);
  }
  return resposta;
}

function redirecionar(destino: URL, nonce: string) {
  const r = NextResponse.redirect(destino);
  aplicarHeadersSeguranca(r, nonce);
  return r;
}

function aplicarHeadersSeguranca(resposta: NextResponse, nonce: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self' ${supabaseUrl};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  resposta.headers.set("Content-Security-Policy", csp);
  resposta.headers.set("X-Frame-Options", "DENY");
  resposta.headers.set("X-Content-Type-Options", "nosniff");
  resposta.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
