-- 0005 — etapa "Não teve" (sem_fatura): mês em que o fornecedor não
-- faturou (ex.: Correios). Conta como resolvido: sai dos murais e, sendo o
-- último vencimento de um periódico, gera o próximo igual ao "lançado".

alter table public.lancamentos drop constraint if exists lancamentos_status_check;
alter table public.lancamentos add constraint lancamentos_status_check
  check (status in ('aberto', 'medido', 'lancado', 'pendente', 'sem_fatura'));

create or replace function public.tg_proximo_vencimento()
returns trigger language plpgsql set search_path = public as $$
declare
  c public.contratos;
begin
  if new.status not in ('lancado', 'sem_fatura')
     or (tg_op = 'UPDATE' and old.status in ('lancado', 'sem_fatura')) then
    return new;
  end if;
  select * into c from public.contratos where id = new.contrato_id;
  if c.situacao <> 'ativo' or c.tipo not in ('periodico', 'waldemar') then
    return new;
  end if;
  if exists (
    select 1 from public.lancamentos
    where contrato_id = new.contrato_id and vencimento > new.vencimento
  ) then
    return new;
  end if;
  insert into public.lancamentos (contrato_id, vencimento)
  values (new.contrato_id, (new.vencimento + make_interval(months => c.periodicidade_meses))::date)
  on conflict do nothing;
  return new;
end $$;

-- Próximo vencimento = primeiro que ainda exige ação.
create or replace view public.vw_contratos with (security_invoker = true) as
select
  c.*,
  p.vencimento as proximo_vencimento,
  p.status as proximo_status,
  (select max(l.vencimento) from public.lancamentos l
    where l.contrato_id = c.id and l.status = 'lancado') as ultimo_lancado,
  (select count(*) from public.lancamentos l
    where l.contrato_id = c.id and l.status = 'pendente') as qtd_pendentes
from public.contratos c
left join lateral (
  select l.vencimento, l.status from public.lancamentos l
  where l.contrato_id = c.id and l.status not in ('lancado', 'sem_fatura')
  order by l.vencimento limit 1
) p on true;
