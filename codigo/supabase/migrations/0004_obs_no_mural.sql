-- 0004 — observação do contrato (site, login, avisos) aparece no cartão do
-- painel. Coluna nova no fim da view (create or replace aceita).
create or replace view public.vw_mural with (security_invoker = true) as
select
  l.id, l.contrato_id, l.vencimento, l.status, l.observacao,
  c.codigo, c.fornecedor, c.tipo,
  (l.vencimento - public.hoje()) as dias,
  case l.status
    when 'aberto' then 'medir'
    when 'medido' then 'titulo'
    when 'pendente' then 'pendente'
  end as mural,
  c.observacao as obs_contrato
from public.lancamentos l
join public.contratos c on c.id = l.contrato_id
where c.situacao = 'ativo'
  and (
    (l.status = 'aberto' and l.vencimento <= public.hoje() + 10)
    or l.status in ('medido', 'pendente')
  );
