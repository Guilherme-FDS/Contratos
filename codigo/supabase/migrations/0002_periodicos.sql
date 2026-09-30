-- 0002 — tipos de contrato (30/09/2026)
--
--   normal    = "Contrato": prazo definido. Você informa quantos meses na
--               criação; ao lançar o último, o contrato NÃO gera mais nada.
--   periodico = "Periódico": renova sozinho até segunda ordem. Ao lançar o
--               último vencimento cadastrado, o próximo é criado.
--   waldemar  = contas do Sr. Waldemar: renovam como o periódico.

-- 1. Remove os contratos importados da antiga aba "Contratos Periódicos"
--    (Google, Facebook, Zap/OLX, Bertt): plataforma mais limpa. Os
--    vencimentos saem junto (on delete cascade).
--    Apaga pelos IDs fixos gerados no import (não pelo tipo), para nunca
--    atingir periódicos criados depois na plataforma.
delete from public.contratos where id in (
  '267f0844-f46a-5f7c-9948-699002ceaa25',
  '5bf10733-cdab-561d-8107-cbf226ebbcf4',
  '0f12bea1-2f40-5cd7-8141-ec0a96757c7f',
  '7870a256-e5d6-5069-b59e-20006bb5e38b',
  '5b65469d-4e0f-5115-9369-c8a8d59d91a0',
  'afef55e2-a8c2-5c8e-9007-dc0fa6981679',
  '5ad01b39-e06b-5915-b561-b9fcf15d8d50',
  '4ae28ab7-eddc-56e6-a50a-c90a2578d60d',
  '4cfc82c6-eb09-558a-aac3-9d2f1bab33ae',
  '1db5b061-9091-5584-ae73-d6ced5e31ad3',
  '8e33be74-47d6-5cf2-bf1d-710890d3c10e',
  '23e16349-25bd-529a-a325-2f4e1371436b',
  'ccb39350-5f30-5411-953c-657530ef4d9a',
  'ad627a8c-889b-5e6e-8fd5-1c7eec66df04',
  '87098c6a-6dc7-542d-91ae-48a681379020',
  '527b234f-37d6-5799-9cf7-61df17dd936e',
  '2ed3d94f-8b78-50f8-8319-d3a265943c50',
  '0d080f09-b132-55cb-bf49-b7acfef4ad2c',
  '76c7b219-fa27-5cc4-8cbd-35872f58c580',
  '3ee5d8b9-d8eb-50e2-9fbd-20774fb21730',
  '09114ff5-b89f-5edf-9277-d03f551a097b',
  '5709d6b3-a3c8-578a-beab-5ae082c8d0ff',
  '0d066a49-9d28-5334-a2de-aed056237ed4',
  'e866e6d1-7ecc-57b5-a008-2302af59302d',
  'f5d4a5b0-8739-57b6-8883-f599a64619f3',
  '2e875cdc-80a9-5528-bef4-22225a3ebe23',
  '0d334974-b56f-5109-9316-2316f1519a42',
  'd29c1f6c-0eca-543f-abbd-f4eb9c4d4fc4',
  'f23c603e-abcd-5780-9a23-a9d57d0f0de8',
  '6f4b90d3-8c57-5631-bffd-d6661f240f5c',
  '026526ee-6cee-5743-9cc7-11b4982ecb3e',
  '93663975-2a24-57b3-98ff-d817a7d1e20e',
  '7666add1-085c-5d7f-897a-0ceed054460e',
  'b250514f-3750-5192-bf24-ae50783a8d10',
  '33ffbd40-3b3f-501c-9453-5a2f8a18ae7c',
  '38e3e87f-baad-51d2-b364-b545f6342749',
  '11c7240d-ad46-5ea4-9ad0-d83ffb274763',
  'f1660877-4228-546b-85bf-b6b474fdd876',
  '793da621-d098-56a9-b5ef-b2a3fdd528a7',
  'd12968d3-d46d-54c8-bc30-ec04d82d6290'
);

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
