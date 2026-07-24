-- FALLA: sistema de seguidores e amizades
-- Execute este arquivo no Supabase:
-- SQL Editor > New query > cole o conteúdo > Run

create extension if not exists pgcrypto;

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint follows_not_self check (follower_id <> following_id),
  constraint follows_unique_pair unique (follower_id, following_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- Impede dois registros equivalentes, mesmo com os usuários invertidos.
create unique index if not exists friendships_unique_pair
on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

create index if not exists follows_follower_idx
  on public.follows(follower_id);

create index if not exists follows_following_idx
  on public.follows(following_id);

create index if not exists friendships_requester_idx
  on public.friendships(requester_id);

create index if not exists friendships_addressee_idx
  on public.friendships(addressee_id);

alter table public.follows enable row level security;
alter table public.friendships enable row level security;

-- Remove políticas anteriores com os mesmos nomes, caso o script seja repetido.
drop policy if exists "follows_read_authenticated" on public.follows;
drop policy if exists "follows_insert_own" on public.follows;
drop policy if exists "follows_delete_own" on public.follows;

drop policy if exists "friendships_read_participants" on public.friendships;
drop policy if exists "friendships_insert_requester" on public.friendships;
drop policy if exists "friendships_accept_addressee" on public.friendships;
drop policy if exists "friendships_delete_participants" on public.friendships;

-- Seguidores
create policy "follows_read_authenticated"
on public.follows
for select
to authenticated
using (true);

create policy "follows_insert_own"
on public.follows
for insert
to authenticated
with check (
  auth.uid() = follower_id
  and follower_id <> following_id
);

create policy "follows_delete_own"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

-- Amizades
create policy "friendships_read_participants"
on public.friendships
for select
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
);

create policy "friendships_insert_requester"
on public.friendships
for insert
to authenticated
with check (
  auth.uid() = requester_id
  and requester_id <> addressee_id
  and status = 'pending'
);

-- Somente quem recebeu pode aceitar.
create policy "friendships_accept_addressee"
on public.friendships
for update
to authenticated
using (
  auth.uid() = addressee_id
  and status = 'pending'
)
with check (
  auth.uid() = addressee_id
  and status = 'accepted'
);

-- Qualquer participante pode cancelar pedido, recusar ou desfazer amizade.
create policy "friendships_delete_participants"
on public.friendships
for delete
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
);

-- Garante leitura pública limitada dos perfis necessários para o ranking.
-- Se já existir uma política equivalente, este bloco pode ser ignorado.
drop policy if exists "profiles_public_social_read" on public.profiles;

create policy "profiles_public_social_read"
on public.profiles
for select
to authenticated
using (true);
