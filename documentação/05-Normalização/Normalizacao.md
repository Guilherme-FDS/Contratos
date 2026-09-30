---
tags: [normalizacao]
---

# Normalização da planilha

Como a planilha virou banco, e o registro das decisões tomadas item a item.

## Regras automáticas do import

| Na planilha | Na plataforma |
|---|---|
| Aba "Contratos - nova planilha 2023" | contratos `normal` |
| Aba "Contratos Periódicos" | contratos `periodico` |
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

Resultado do import: 250 contratos (137 ativos), 5.938 vencimentos.
Painel no dia do import: 28 a medir, 2 aguardando título, 33 pendências.

## Itens para revisar

Gerados em `codigo/scripts/saida/revisar.md` (fora do git). Tipos:

- **Duplicado** — mesmo nº de CT em duas linhas ativas (10)
- **Sem cor antes do corte** — vencimento antigo sem cor em contrato
  ativo, importado como lançado; confirmar (27)
- **Ativo sem vencimento futuro** — contrato visível sem nenhuma data
  futura; nunca apareceria no painel → concluir, inativar ou criar
  vencimentos (26)

## Decisões

Registrar aqui cada resposta, pelo nº do contrato (sem valores):

| Data | Contrato | Decisão |
|---|---|---|
