-- 0002 — tipos de contrato (30/09/2026)
--
--   normal    = "Contrato": prazo definido. Você informa quantos meses na
--               criação; ao lançar o último, o contrato NÃO gera mais nada.
--   periodico = "Periódico": renova sozinho até segunda ordem. Ao lançar o
--               último vencimento cadastrado, o próximo é criado.
--   waldemar  = contas do Sr. Waldemar: renovam como o periódico.

-- 1. Remove os contratos importados da antiga aba "Contratos Periódicos"
--    (Google, Facebook, Zap/OLX, Bertt): plataforma mais limpa. Os
--    vencimentos saem junto (on delete cascade). Periódicos criados daqui
--    para frente pela plataforma não são afetados — esta migration roda uma
--    vez só.
delete from public.contratos where tipo = 'periodico';

-- 2. Só periódico e Waldemar renovam sozinhos.
create or replace function public.tg_proximo_vencimento()
returns trigger language plpgsql set search_path = public as $$
declare
  c public.contratos;
begin
  if new.status <> 'lancado' or (tg_op = 'UPDATE' and old.status = 'lancado') then
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
