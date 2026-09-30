---
tags: [manual, tecnico]
---

# Manual Técnico

## Estrutura

```
Contratos/
├── codigo/                     ← projeto Next.js (Root Directory na Vercel)
│   ├── app/                    ← rotas: / · /contratos · /contratos/[id] · /contratos/novo · /waldemar · /login
│   │   └── actions.ts          ← todas as escritas (Server Actions)
│   ├── components/             ← Murais, GradeMeses, TabelaContratos, FormularioContrato, ui
│   ├── lib/                    ← clientes Supabase, tipos, datas
│   ├── middleware.ts           ← sessão + redireciona para /login + CSP
│   ├── supabase/migrations/    ← schema, em ordem
│   └── scripts/importar.py     ← planilha → seed.sql
└── documentação/               ← este vault
```

## Stack

- Next.js 14 (App Router, Server Components + Server Actions), React 18, TypeScript
- Tailwind CSS — paleta `wegg-*` (Deep Blue #003051) e `off` (#E8E4D8);
  fonte Jost via `next/font` (servida pelo próprio site)
- PWA: `app/manifest.ts`, `public/sw.js` (só guarda ícones/JS/CSS — nunca
  páginas ou dados), ícones em `public/`
- Supabase: Postgres + Auth + RLS
- Vercel, região `gru1` (São Paulo) — `codigo/vercel.json`

## Velocidade

- Supabase em **São Paulo (sa-east-1)** + Vercel `gru1`: servidor e banco
  na mesma cidade, cada consulta leva poucos ms.
- Painel e lista carregam tudo numa consulta só (views `vw_mural` e
  `vw_contratos`); filtros rodam no navegador, sem ir ao servidor.
- Botões são otimistas: o card muda na hora e o servidor confirma em
  segundo plano; se der erro, volta e mostra a mensagem.

## Banco (`0001_schema.sql`)

**contratos**: `codigo`, `fornecedor`, `tipo` (normal|periodico|waldemar),
`situacao` (ativo|concluido|rescindido|inativo), `periodicidade_meses`,
`observacao`.

**lancamentos**: um por vencimento. `status` (aberto|medido|lancado|pendente),
`observacao`, `medido_em`, `lancado_em` (carimbados por gatilho).
Único por (`contrato_id`, `vencimento`).

**Tipos** (`contratos.tipo`)
- `normal` = Contrato com prazo: os N meses são gerados na criação e ele
  termina no último.
- `periodico` = renova sozinho até ser concluído/inativado.
- `waldemar` = contas do Sr. Waldemar, renovam como o periódico.

**Gatilhos**
- `tg_carimbo` — `updated_at`, `medido_em`, `lancado_em`.
- `tg_proximo_vencimento` — ao virar `lancado` o último vencimento de um
  contrato ativo **periódico ou Waldemar**, cria o próximo (+ periodicidade).
  Contrato com prazo não renova (migration 0002).

**Views** (`security_invoker`, respeitam RLS)
- `vw_mural` — contratos ativos; `aberto` com vencimento ≤ hoje+10 →
  mural `medir`; `medido` → `titulo`; `pendente` → `pendente`.
  "Hoje" é `public.hoje()`, no fuso America/Sao_Paulo.
- `vw_contratos` — contrato + próximo vencimento não lançado, etapa,
  último lançado, qtd. de pendências.

**RLS**: qualquer usuário autenticado lê/escreve; `anon` não tem acesso.

## Segurança

- Login por Server Action (`app/auth/acoes.ts`): e-mail e senha vão por
  HTTPS só para o próprio site; o navegador nunca chama o Supabase.
- Não existe cliente Supabase no navegador. A sessão fica em cookie
  **httpOnly** (JavaScript da página não lê), `secure`, `sameSite=lax`,
  12h (`lib/supabase-credenciais.ts`).
- Erro de login é genérico ("E-mail ou senha incorretos"), não revela se o
  e-mail existe.
- Nenhum dado do usuário (e-mail/nome) é renderizado.
- CSP com nonce, `frame-ancestors 'none'`, `nosniff` (`middleware.ts`).
- RLS: só `authenticated`; `anon` sem acesso.

> O que você digita no formulário sempre aparece no DevTools do **seu**
> navegador (é o próprio pedido sendo enviado) — isso não é vazamento.
> Na rede o conteúdo vai criptografado (HTTPS).

## Migrations aplicadas

| Arquivo | O que faz |
|---|---|
| `0001_schema.sql` | Tabelas, gatilhos, views, RLS |
| `0002_periodicos.sql` | Remove periódicos importados; só periódico/Waldemar renovam |

## Implantação (primeira vez)

1. **Supabase** → New project, região *South America (São Paulo)*.
2. SQL Editor → colar `codigo/supabase/migrations/0001_schema.sql` → Run.
3. Gerar o seed no computador:
   `pip install openpyxl` e
   `python3 codigo/scripts/importar.py CONTRATOS.xlsx`
   → colar `codigo/scripts/saida/seed.sql` no SQL Editor → Run.
4. Authentication → Users → *Add user* (e-mail + senha).
   Authentication → Sign In / Providers → desligar *Allow new users to sign up*.
5. **Vercel** → Add New Project → importar `Guilherme-FDS/Contratos`.
   Settings → General → **Root Directory = `codigo`**.
   Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API).
6. Deploy. Todo push em `main` publica sozinho.

## Desenvolvimento local

```
cd codigo
cp .env.local.example .env.local   # preencher
npm install
npm run dev      # http://localhost:3000
npm run check    # typescript
npm run lint
npm test
```

## Mudanças no banco

Nunca editar migration já aplicada: criar `0002_*.sql`, `0003_*.sql`… e
rodar no SQL Editor.
