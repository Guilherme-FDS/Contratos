---
tags: [manual, usuario]
---

# Manual do Usuário

## Cores (as mesmas da planilha)

| Cor | Etapa |
|---|---|
| Cinza | A medir |
| 🟧 Laranja | Medição feita |
| 🟩 Verde | Título lançado — concluído |
| 🟨 Amarelo | Pendência |
| Cinza riscado | Não teve — mês sem fatura (ex.: Correios). Sai do painel como resolvido |

## Painel

Três murais, só contratos **ativos**. Um cartão por contrato: se ele tem
mais de um mês na mesma etapa, as datas aparecem juntas e o botão vale
para todas.

1. **Fazer medição** — vence em até 10 dias (atrasado em vermelho).
   *Medido* → vai para o mural 2. *Lançado* → medição e título já feitos,
   sai do painel.
2. **Lançar título** — *Título lançado* sai do painel; o próximo
   vencimento volta 10 dias antes. *↩* desfaz a medição.
3. **Pendências** — tudo amarelo, sem limite de data, até você clicar em
   *A medir*, *Medido* ou *Lançado*.

Menu **⋯** de cada cartão: marcar pendência (com motivo), *Lançar vários
meses* (abre a grade do contrato) e mudar a situação (Concluído,
Rescindido, Inativo → sai dos murais).

Abaixo do nome aparece a **observação do contrato** (site do portal,
login, senha, avisos); links abrem direto. Edite em Contratos → contrato →
Observação, uma informação por linha. Em amarelo (⚠️) ficam as notas de
pendência do vencimento.

A caixa de filtro filtra os três murais por nº, nome ou data (`25/10`).

## Lançar vários meses (aluguel do ano, etc.)

No contrato, os vencimentos aparecem como grade **ano × mês**, na cor da
etapa. Clique para selecionar, **Shift+clique** para um intervalo, ou
*selecionar ano*. Na barra que aparece embaixo: *Medido*, *Título
lançado*, *Pendência*, *A medir* ou *Excluir*. Anos passados ficam
recolhidos.

## Tipos de contrato

| Tipo | Como funciona |
|---|---|
| Contrato | Prazo definido: você informa 1º vencimento e quantos meses. Termina no último. |
| Periódico | Renova sozinho todo mês até você concluir/inativar. |
| Waldemar | Conta do Sr. Waldemar, renova como o periódico. |

## Contratos

- Filtros: nome ou nº (`correio`, `CT/982`), data do próximo vencimento
  (`25/10`), situação (padrão: Ativo) e tipo.
- Situação muda direto na tabela.
- **+ Novo contrato** escolhe o tipo acima.

## Waldemar

Lista com uma linha por conta: próximo vencimento, etapa e uma faixa com
5 meses para trás + atual + 6 para frente, colorida pela etapa. Clique na
linha para abrir a grade completa e lançar vários meses.

## Instalar no celular (PWA)

- Android/Chrome: menu ⋮ → *Instalar app*.
- iPhone/Safari: compartilhar → *Adicionar à Tela de Início*.
