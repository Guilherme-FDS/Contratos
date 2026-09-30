/** Compartilhado pelos clientes. Não importa nada do Next. */
export function credenciais() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copie .env.local.example para .env.local e preencha.",
    );
  }
  return { url, chave };
}

/**
 * Cookie de sessão fora do alcance do JavaScript da página (httpOnly): o
 * token nunca aparece para script nenhum, nem no navegador. Funciona porque
 * todo acesso ao Supabase passa pelo servidor — não existe cliente de
 * navegador. 12h: expira no fim do dia de trabalho.
 */
export const OPCOES_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 12 * 60 * 60,
};
