-- FALLA - PERFIS, FOTOS, SEGUIDORES E AMIZADES
-- Execute no Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_type text default 'mascot',
  add column if not exists avatar_value text default 'chico';

update public.profiles
set
  avatar_type = case when avatar_url is not null then 'photo' else 'mascot' end,
  avatar_value = coalesce(avatar_url, avatar_mascot, 'chico')
where avatar_value is null
   or avatar_type is null;

alter table public.profiles
  drop constraint if exists profiles_avatar_type_check;

alter table public.profiles
  add constraint profiles_avatar_type_check
  check (avatar_type in ('photo', 'mascot'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "profile_photos_insert_own" on storage.objects;
drop policy if exists "profile_photos_update_own" on storage.objects;
drop policy if exists "profile_photos_delete_own" on storage.objects;

create policy "profile_photos_public_read"
on storage.objects
for select
using (bucket_id = 'profile-photos');

create policy "profile_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_photos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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

create unique index if not exists friendships_unique_pair
on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

alter table public.follows enable row level security;
alter table public.friendships enable row level security;

drop policy if exists "profiles_social_read" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_social_read"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "follows_read_authenticated" on public.follows;
drop policy if exists "follows_insert_own" on public.follows;
drop policy if exists "follows_delete_own" on public.follows;

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

drop policy if exists "friendships_read_participants" on public.friendships;
drop policy if exists "friendships_insert_requester" on public.friendships;
drop policy if exists "friendships_accept_addressee" on public.friendships;
drop policy if exists "friendships_delete_participants" on public.friendships;

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

create policy "friendships_delete_participants"
on public.friendships
for delete
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
);


-- =========================================================
-- CHAT PRIVADO ENTRE AMIGOS
-- =========================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_not_self check (sender_id <> receiver_id),
  constraint messages_content_length check (
    char_length(btrim(content)) between 1 and 1500
  )
);

create index if not exists messages_sender_receiver_created_idx
  on public.messages(sender_id, receiver_id, created_at);

create index if not exists messages_receiver_unread_idx
  on public.messages(receiver_id, read_at)
  where read_at is null;

alter table public.messages enable row level security;

drop policy if exists "messages_read_participants" on public.messages;
drop policy if exists "messages_insert_friends_only" on public.messages;
drop policy if exists "messages_mark_received_as_read" on public.messages;
drop policy if exists "messages_delete_sender" on public.messages;

-- O usuário só pode ler mensagens enviadas ou recebidas por ele.
create policy "messages_read_participants"
on public.messages
for select
to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = receiver_id
);

-- O banco confirma que existe amizade aceita antes de permitir o envio.
create policy "messages_insert_friends_only"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> receiver_id
  and exists (
    select 1
    from public.friendships friendship
    where friendship.status = 'accepted'
      and (
        (
          friendship.requester_id = sender_id
          and friendship.addressee_id = receiver_id
        )
        or
        (
          friendship.requester_id = receiver_id
          and friendship.addressee_id = sender_id
        )
      )
  )
);

-- Apenas o destinatário pode marcar a mensagem como lida.
create policy "messages_mark_received_as_read"
on public.messages
for update
to authenticated
using (
  auth.uid() = receiver_id
)
with check (
  auth.uid() = receiver_id
  and sender_id <> receiver_id
);

-- O remetente pode apagar as próprias mensagens futuramente.
create policy "messages_delete_sender"
on public.messages
for delete
to authenticated
using (
  auth.uid() = sender_id
);

-- Adiciona a tabela ao Realtime, sem falhar caso já esteja publicada.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
