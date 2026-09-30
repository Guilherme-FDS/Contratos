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
| Links, senhas, CPF, nº de conta | **descartados** |

Resultado do import: 210 contratos (114 ativos), 5.914 vencimentos.
Painel no dia do import: 28 a medir, 2 aguardando título, 33 pendências. Restam 13 itens para revisar.

## Itens para revisar

Gerados em `codigo/scripts/saida/revisar.md` (fora do git). Tipos:

- **Duplicado** — mesmo nº de CT em duas linhas ativas
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
