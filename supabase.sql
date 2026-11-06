-- Rode no Supabase: SQL Editor > New query > Run

create table if not exists public.readings (
  id          bigint generated always as identity primary key,
  station_id  text        not null,
  level_cm    numeric(7,1) not null,
  distance_cm numeric(7,1),
  created_at  timestamptz not null default now()
);
create index if not exists readings_station_time_idx
  on public.readings (station_id, created_at desc);

create table if not exists public.subscribers (
  id         bigint generated always as identity primary key,
  email      text unique not null,
  created_at timestamptz not null default now()
);

-- RLS ligado e SEM policies: ninguém acessa pela chave pública (anon).
-- A API na Vercel usa a service_role key, que ignora RLS.
alter table public.readings    enable row level security;
alter table public.subscribers enable row level security;
