---
tags: [escopo]
---

# Escopo

Substituir a planilha `CONTRATOS.xlsx` (Tesouraria) por uma plataforma web
com login, que avisa com 10 dias de antecedência o que precisa ser medido
e lançado.

## Fluxo de cada vencimento

```
aberto ──(fiz a medição)──▶ medido ──(lancei o título)──▶ lancado
   │ cinza                    laranja                      verde
   └───────────── qualquer etapa ─────▶ pendente (amarelo)
                                         fica até regularizar
```

- Medição e título são etapas separadas porque cada uma precisa de
  autorização.
- Ao lançar o título do vencimento 25/09, o contrato sai do painel. O
  próximo (25/10) volta a aparecer em **15/10** (10 dias antes). Se o
  próximo vencimento ainda não existir, o banco cria automaticamente
  (vencimento + periodicidade do contrato).
- Pendência ignora a regra dos 10 dias: fica no terceiro mural até eu
  mudar a etapa.

## Situação do contrato

`ativo` · `concluído` · `rescindido` · `inativo`. Só **ativo** aparece nos
murais. Os contratos que estavam com a linha oculta na planilha foram
importados como **inativo**.

## Telas

| Tela | O que faz |
|---|---|
| Painel | 3 murais: Fazer medição · Lançar título · Pendências. Filtro rápido. |
| Contratos | Todos os contratos, filtro por nome/nº e por data de vencimento, troca de situação, novo contrato. |
| Contrato (detalhe) | Editar dados, ver/alterar todos os vencimentos, criar vencimentos avulsos ou em série. |
| Waldemar | Contas do Sr. Waldemar em cartões, com próximos e últimos vencimentos. Também entram no Painel. |

## Pendências do projeto

- [ ] Responder a revisão da planilha, item a item → [[Normalizacao]]
- [x] Criar projeto no Supabase, rodar migration + seed, criar usuário
- [x] Deploy na Vercel (Root Directory = `codigo`)
- [ ] Rodar `0002_periodicos.sql` e `0003_importados_periodicos.sql` no Supabase
- [x] Contratos importados = Periódico; os pontuais o usuário troca na mão
- [ ] Trocar as senhas que estavam escritas na aba "Despesas Waldemar"
      (não foram importadas, mas ficaram expostas na planilha)
