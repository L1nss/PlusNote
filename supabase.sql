-- PlusNote — banco de dados Supabase
-- Execute este arquivo inteiro em Supabase > SQL Editor > New query.
-- O modelo usa RLS para que cada usuário veja somente os próprios dados.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'nota' check (mode in ('nota', 'conceito')),
  period text not null default 'trimestre' check (period in ('trimestre', 'bimestre', 'semestre')),
  required_points numeric(10,2) not null default 60 check (required_points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 20),
  min_value numeric(10,2),
  max_value numeric(10,2),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  period_index integer not null check (period_index between 0 and 11),
  value text not null,
  updated_at timestamptz not null default now(),
  unique (subject_id, period_index)
);

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists concepts_user_id_idx on public.concepts(user_id);
create index if not exists grades_subject_id_idx on public.grades(subject_id);

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.concepts enable row level security;
alter table public.subjects enable row level security;
alter table public.grades enable row level security;

-- Recria as policies de forma idempotente.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "settings_all_own" on public.settings;
drop policy if exists "concepts_all_own" on public.concepts;
drop policy if exists "subjects_all_own" on public.subjects;
drop policy if exists "grades_all_own" on public.grades;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "settings_all_own" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "concepts_all_own" on public.concepts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subjects_all_own" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A nota pertence a uma matéria; a matéria precisa pertencer ao usuário autenticado.
create policy "grades_all_own" on public.grades
  for all
  using (
    exists (
      select 1 from public.subjects s
      where s.id = grades.subject_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.subjects s
      where s.id = grades.subject_id and s.user_id = auth.uid()
    )
  );

-- Cria o perfil automaticamente quando uma conta é cadastrada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do update set name = excluded.name, updated_at = now();

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Atualiza updated_at em settings, profiles e grades.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists grades_updated_at on public.grades;
create trigger grades_updated_at before update on public.grades
for each row execute procedure public.set_updated_at();
