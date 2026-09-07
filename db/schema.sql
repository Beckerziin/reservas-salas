-- =====================================================================
-- Esquema do banco - Sistema de Reservas de Salas de Estudo
-- Alvo: Supabase / PostgreSQL
--
-- Como aplicar (uma opcao):
--   Painel Supabase > SQL Editor > cole este arquivo > Run
-- Ou via Supabase CLI (bonus "banco como codigo"):
--   supabase db push   (com as migrations versionadas em supabase/migrations)
-- =====================================================================

-- gen_random_uuid() disponivel via pgcrypto (Supabase ja habilita por padrao).
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabela: usuarios  (RF01, RF02)
-- ---------------------------------------------------------------------
create table if not exists usuarios (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  email      text not null unique,
  senha_hash text not null,                    -- RNF03: nunca senha em texto puro
  papel      text not null default 'user' check (papel in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tabela: salas  (RF03, RF08)
-- ---------------------------------------------------------------------
create table if not exists salas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  capacidade integer not null check (capacidade > 0),
  status     text not null default 'disponivel'
             check (status in ('disponivel', 'indisponivel', 'manutencao')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tabela: reservas  (RF04-RF07 / RN01-RN05)
-- ---------------------------------------------------------------------
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

-- Indice para consultar reservas ativas por sala (checagem de conflito - RN02)
-- e reservas por usuario (RF06).
create index if not exists idx_reservas_sala_status on reservas (sala_id, status);
create index if not exists idx_reservas_usuario     on reservas (usuario_id);

-- ---------------------------------------------------------------------
-- BONUS (defesa extra no banco para RN02): impedir, no proprio Postgres,
-- duas reservas ATIVAS sobrepostas na mesma sala. Requer btree_gist.
-- A aplicacao ja valida isso no service; este constraint e opcional.
-- ---------------------------------------------------------------------
-- create extension if not exists btree_gist;
-- alter table reservas add constraint reservas_sem_sobreposicao
--   exclude using gist (
--     sala_id with =,
--     tstzrange(inicio, fim) with &&
--   ) where (status = 'ativa');
