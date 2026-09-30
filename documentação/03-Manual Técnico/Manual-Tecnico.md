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
│   ├── components/             ← Murais, TabelaContratos, Lancamentos, FormularioContrato, ui
│   ├── lib/                    ← clientes Supabase, tipos, datas
│   ├── middleware.ts           ← sessão + redireciona para /login + CSP
│   ├── supabase/migrations/    ← schema, em ordem
│   └── scripts/importar.py     ← planilha → seed.sql
└── documentação/               ← este vault
```

## Stack

- Next.js 14 (App Router, Server Components + Server Actions), React 18, TypeScript
- Tailwind CSS
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

**Gatilhos**
- `tg_carimbo` — `updated_at`, `medido_em`, `lancado_em`.
- `tg_proximo_vencimento` — ao virar `lancado` o último vencimento de um
  contrato ativo, cria o próximo (+ periodicidade).

**Views** (`security_invoker`, respeitam RLS)
- `vw_mural` — contratos ativos; `aberto` com vencimento ≤ hoje+10 →
  mural `medir`; `medido` → `titulo`; `pendente` → `pendente`.
  "Hoje" é `public.hoje()`, no fuso America/Sao_Paulo.
- `vw_contratos` — contrato + próximo vencimento não lançado, etapa,
  último lançado, qtd. de pendências.

**RLS**: qualquer usuário autenticado lê/escreve; `anon` não tem acesso.

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
