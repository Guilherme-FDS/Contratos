-- Plataforma de Contratos — schema inicial.
-- Rodar no Supabase: SQL Editor → colar → Run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- contratos
-- tipo:      normal | periodico | waldemar (aba própria, mas entra no mural)
-- situacao:  ativo | concluido | rescindido | inativo
--            só "ativo" aparece nos murais.
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  fornecedor text not null,
  tipo text not null default 'normal'
    check (tipo in ('normal', 'periodico', 'waldemar')),
  situacao text not null default 'ativo'
    check (situacao in ('ativo', 'concluido', 'rescindido', 'inativo')),
  periodicidade_meses int not null default 1 check (periodicidade_meses between 1 and 60),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contratos_situacao_idx on public.contratos (situacao);

-- -------------------------------------------------------------- lancamentos
-- Um por vencimento. Fluxo: aberto → medido (laranja) → lancado (verde).
-- pendente (amarelo) sai do fluxo e vai para o mural de pendências até
-- ser regularizado manualmente.
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos (id) on delete cascade,
  vencimento date not null,
  status text not null default 'aberto'
    check (status in ('aberto', 'medido', 'lancado', 'pendente')),
  observacao text,
  medido_em timestamptz,
  lancado_em timestamptz,
  updated_at timestamptz not null default now(),
  unique (contrato_id, vencimento)
);
create index lancamentos_status_venc_idx on public.lancamentos (status, vencimento);
create index lancamentos_contrato_idx on public.lancamentos (contrato_id, vencimento);

-- ------------------------------------------------------------------ gatilhos
create or replace function public.tg_carimbo()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_table_name = 'lancamentos' then
    if new.status = 'medido' and (tg_op = 'INSERT' or old.status <> 'medido') then
      new.medido_em := now();
    end if;
    if new.status = 'lancado' and (tg_op = 'INSERT' or old.status <> 'lancado') then
      new.lancado_em := now();
    end if;
  end if;
  return new;
end $$;

create trigger contratos_carimbo before update on public.contratos
  for each row execute function public.tg_carimbo();
create trigger lancamentos_carimbo before insert or update on public.lancamentos
  for each row execute function public.tg_carimbo();

-- Ao lançar o título do último vencimento cadastrado de um contrato ativo,
-- cria o próximo (vencimento + periodicidade). Assim o contrato nunca some
-- do radar: 10 dias antes do próximo vencimento ele volta ao mural.
create or replace function public.tg_proximo_vencimento()
returns trigger language plpgsql set search_path = public as $$
declare
  c public.contratos;
begin
  if new.status <> 'lancado' or (tg_op = 'UPDATE' and old.status = 'lancado') then
    return new;
  end if;
  select * into c from public.contratos where id = new.contrato_id;
  if c.situacao <> 'ativo' then
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

create trigger lancamentos_proximo after insert or update of status on public.lancamentos
  for each row execute function public.tg_proximo_vencimento();

-- -------------------------------------------------------------------- views
-- security_invoker: a view respeita a RLS de quem consulta.
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
  where l.contrato_id = c.id and l.status <> 'lancado'
  order by l.vencimento limit 1
) p on true;

-- Murais: só contratos ativos.
--  medir    = aberto  e vence em até 10 dias (ou já venceu)
--  titulo   = medido  (aguardando lançar o título a pagar)
--  pendente = pendente, qualquer data, até regularizar
-- Data de hoje no fuso de Maringá, não em UTC (o Supabase roda em UTC; às
-- 21h daqui já seria "amanhã").
create or replace function public.hoje()
returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create or replace view public.vw_mural with (security_invoker = true) as
select
  l.id, l.contrato_id, l.vencimento, l.status, l.observacao,
  c.codigo, c.fornecedor, c.tipo,
  (l.vencimento - public.hoje()) as dias,
  case l.status
    when 'aberto' then 'medir'
    when 'medido' then 'titulo'
    when 'pendente' then 'pendente'
  end as mural
from public.lancamentos l
join public.contratos c on c.id = l.contrato_id
where c.situacao = 'ativo'
  and (
    (l.status = 'aberto' and l.vencimento <= public.hoje() + 10)
    or l.status in ('medido', 'pendente')
  );

-- ---------------------------------------------------------------------- RLS
-- Uso individual: qualquer usuário autenticado lê e escreve. Usuários são
-- criados manualmente em Authentication → Users (cadastro público desligado).
alter table public.contratos enable row level security;
alter table public.lancamentos enable row level security;

create policy contratos_autenticado on public.contratos
  for all to authenticated using (true) with check (true);
create policy lancamentos_autenticado on public.lancamentos
  for all to authenticated using (true) with check (true);

revoke all on public.contratos, public.lancamentos from anon;
revoke all on public.vw_contratos, public.vw_mural from anon;
