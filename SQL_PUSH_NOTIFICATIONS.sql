-- FALLA - estrutura de notificações push reais
create extension if not exists pgcrypto;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  language text not null default 'en',
  plan text not null default 'free',
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);
create index if not exists push_tokens_target_idx on public.push_tokens(enabled, language, plan, platform);

create table if not exists public.push_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  target_type text not null default 'all' check (target_type in ('all','premium','language')),
  target_language text,
  deep_link text,
  status text not null default 'sent' check (status in ('draft','sending','sent','partial','failed')),
  total_targets integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
alter table public.push_notifications enable row level security;

drop policy if exists "Usuário gerencia seus tokens push" on public.push_tokens;
create policy "Usuário gerencia seus tokens push"
on public.push_tokens for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Administradores visualizam campanhas push" on public.push_notifications;
create policy "Administradores visualizam campanhas push"
on public.push_notifications for select
to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Administradores excluem campanhas push" on public.push_notifications;
create policy "Administradores excluem campanhas push"
on public.push_notifications for delete
to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
