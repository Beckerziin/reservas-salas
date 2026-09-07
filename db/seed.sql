-- =====================================================================
-- Dados minimos de exemplo (RF03 precisa de salas cadastradas).
-- Rode APOS o schema.sql. Seguro para rodar mais de uma vez (idempotente
-- pelo nome da sala).
-- =====================================================================

insert into salas (nome, capacidade, status)
values
  ('Sala de Estudo 1', 4,  'disponivel'),
  ('Sala de Estudo 2', 6,  'disponivel'),
  ('Sala de Reuniao',  10, 'disponivel')
on conflict do nothing;

-- Observacao sobre usuarios:
-- Nao inserimos usuarios aqui porque a senha precisa ser gravada com HASH
-- (RNF03). Crie usuarios pela API (POST /api/usuarios), que faz o hash.
