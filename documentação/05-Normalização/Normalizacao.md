---
tags: [normalizacao]
---

# Normalização da planilha

Como a planilha virou banco, e o registro das decisões tomadas item a item.

## Regras automáticas do import

| Na planilha | Na plataforma |
|---|---|
| Aba "Contratos - nova planilha 2023" | contratos `periodico` (renovam sozinhos) |
| Aba "Contratos Periódicos" | **não importada** (removida em 30/09/2026) |
| Aba "Despesas Waldemar" | contratos `waldemar` (sem nº de CT) |
| Abas ocultas 2020, 2021, "Contratos" | **não importadas** (histórico) |
| Linha oculta | situação `inativo` |
| Célula verde / verde-claro | `lancado` |
| Célula laranja | `medido` |
| Célula amarela | `pendente` |
| Célula sem cor, data **antes** do corte (01/09/2026) | `lancado` (a planilha antiga não pintava tudo) |
| Célula sem cor, data a partir do corte | `aberto` |
| Texto nas células (notas) | observação do contrato |
| Links, logins, senhas, nº de conta | observação do contrato (desde 30/09/2026) |

Resultado do import: 210 contratos (114 ativos), 5.914 vencimentos.
Painel no dia do import: 28 a medir, 2 aguardando título, 33 pendências. Restam 13 itens para revisar.

## Itens para revisar

Gerados em `codigo/scripts/saida/revisar.md` (fora do git). Tipos:

- **Duplicado** — mesmo nº de CT em duas linhas ativas → resolvido: é intencional (uma linha por conta)
- **Sem cor antes do corte** — vencimento antigo sem cor em contrato
  ativo, importado como lançado; confirmar (27)
- **Ativo sem vencimento futuro** — contrato visível sem nenhuma data
  futura; nunca apareceria no painel → concluir, inativar ou criar
  vencimentos (26)

## Decisões

Registrar aqui cada resposta, pelo nº do contrato (sem valores):

| Data | Contrato | Decisão |
|---|---|---|
| 2026-09-30 | Todos da aba "Contratos Periódicos" (ativos) | A data é o **dia do vencimento mensal**. Import gera 12 vencimentos mensais a partir de hoje (1º em 01/10/2026); datas antigas ficam como lançadas. |
| 2026-09-30 | Todos da aba "Contratos Periódicos" | **Removidos** da plataforma (migration 0002). A decisão anterior (vencimento mensal) foi revogada. |
| 2026-09-30 | Todos os contratos importados da aba 2023 | Passam a **Periódico** (renovam sozinhos, migration 0003). Os pontuais o usuário troca para "Contrato" na mão. |
| 2026-09-30 | CT/1132, CT/1886, CT/1359, CT/2704, CT/3370 | Nº repetido é **intencional**: um contrato com várias contas (unidades consumidoras, lotes, apartamentos, linhas Tim, Serasa consulta × negativação). Cada conta segue como um item separado, porque cada uma gera uma fatura/nota a lançar. |
| 2026-09-30 | CT/1359 (Tim WEGG) | Renomeados pelo usuário para "maior" e "menor". |
| 2026-09-30 | 23 contas com site/login/senha na planilha | Dados de acesso ao portal organizados **na observação do contrato** (uma linha por item) e exibidos direto no cartão do painel — escolha do usuário (uso individual, prioriza velocidade). |
| 2026-09-30 | CT/3568 Pontonet 206 Airbnb | Carnê anual lançado até 11/09/2026. Criadas 12 parcelas a partir de 11/10/2026; a 1ª com nota: aditivar +12, medir o ano e lançar título com 12 parcelas. |
| 2026-09-30 | CT/3571 Aluguel Plan. Rural | Última parcela 15/09/2026, lançado por ano (corrige índice). Criadas 12 parcelas a partir de 15/10/2026 com a mesma nota. Segue periódico. |
| 2026-09-30 | CT/817 Copel Plenittá Parque do Ingá | **Concluído**: obra entregue ao condomínio. Nada em aberto. |
| 2026-09-30 | CT/546 Dona Angela, CT/3100, CT/3568 (29/10/2025), Waldemar Portal Segovia | Vencimentos antigos sem cor: **considerados pagos** (já importados como lançados). Antigos não importam. |
| 2026-09-30 | — | **Revisão da planilha concluída.** Daqui em diante os ajustes são feitos direto na plataforma (etapas "Não teve", "Lançado" etc.). |
