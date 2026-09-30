-- 0003 — contratos importados da planilha passam a "Periódico" (30/09/2026)
--
-- Quase todos renovam todo mês (Copel, Tim, aluguel...). Os pontuais são
-- poucos e o usuário troca para "Contrato" na mão, pela tela do contrato.
-- Só mexe no que veio do import (criado antes desta data), nunca em
-- contrato cadastrado depois pela plataforma.
update public.contratos
set tipo = 'periodico'
where tipo = 'normal'
  and created_at < '2026-10-01';
