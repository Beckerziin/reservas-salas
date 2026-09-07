-- Migration inicial - esquema do Sistema de Reservas de Salas de Estudo.
-- Aplicada ao projeto remoto com:  npx supabase db push
-- Equivalente versionado de db/schema.sql (bonus "banco como codigo").

create extension if not exists "pgcrypto";

-- usuarios (RF01, RF02)
create table if not exists usuarios (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  email      text not null unique,
  senha_hash text not null,
  papel      text not null default 'user' check (papel in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- salas (RF03, RF08)
create table if not exists salas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  capacidade integer not null check (capacidade > 0),
  status     text not null default 'disponivel'
             check (status in ('disponivel', 'indisponivel', 'manutencao')),
  created_at timestamptz not null default now()
);

-- reservas (RF04-RF07 / RN01-RN05)
create table if not exists reservas (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  sala_id    uuid not null references salas(id)    on delete cascade,
  inicio     timestamptz not null,
  fim        timestamptz not null,
  status     text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  created_at timestamptz not null default now(),
  constraint reservas_intervalo_valido check (fim > inicio)
);

create index if not exists idx_reservas_sala_status on reservas (sala_id, status);
create index if not exists idx_reservas_usuario     on reservas (usuario_id);

-- BONUS (defesa extra da RN02 no banco). Requer btree_gist.
-- create extension if not exists btree_gist;
-- alter table reservas add constraint reservas_sem_sobreposicao
--   exclude using gist (
--     sala_id with =,
--     tstzrange(inicio, fim) with &&
--   ) where (status = 'ativa');
