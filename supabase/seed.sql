-- Seed da Supabase CLI (rodado em: supabase db reset local; no remoto, rode
-- manualmente se desejar dados de exemplo). Idempotente por nome de sala.
insert into salas (nome, capacidade, status)
values
  ('Sala de Estudo 1', 4,  'disponivel'),
  ('Sala de Estudo 2', 6,  'disponivel'),
  ('Sala de Reuniao',  10, 'disponivel')
on conflict do nothing;
