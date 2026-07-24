-- FALLA: mídia simplificada por módulo
-- Execute no SQL Editor do Supabase antes de publicar a nova versão.

create extension if not exists pgcrypto;

create table if not exists public.module_banners (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  image_url text not null,
  storage_path text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists module_banners_module_order_idx
  on public.module_banners (module_id, display_order);

alter table public.module_banners enable row level security;

drop policy if exists "module_banners_public_read" on public.module_banners;
create policy "module_banners_public_read"
  on public.module_banners for select using (true);

drop policy if exists "module_banners_authenticated_write" on public.module_banners;
create policy "module_banners_authenticated_write"
  on public.module_banners for all to authenticated
  using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'module-media',
  'module-media',
  true,
  8388608,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "module_media_public_read" on storage.objects;
create policy "module_media_public_read"
  on storage.objects for select using (bucket_id = 'module-media');

drop policy if exists "module_media_authenticated_insert" on storage.objects;
create policy "module_media_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'module-media');

drop policy if exists "module_media_authenticated_update" on storage.objects;
create policy "module_media_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'module-media') with check (bucket_id = 'module-media');

drop policy if exists "module_media_authenticated_delete" on storage.objects;
create policy "module_media_authenticated_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'module-media');

-- Migração segura dos campos antigos já embutidos no JSON dos cursos.
-- Copia o primeiro mascote legado encontrado para mascotUrl, sem apagar os campos antigos.
update public.courses
set data = jsonb_set(
  data::jsonb,
  '{modules}',
  (
    select jsonb_agg(
      case
        when coalesce(module->>'mascotUrl', '') <> '' then module
        when coalesce(module->>'mascot_url', '') <> '' then jsonb_set(module, '{mascotUrl}', to_jsonb(module->>'mascot_url'), true)
        when coalesce(module->>'mascotImageUrl', '') <> '' then jsonb_set(module, '{mascotUrl}', to_jsonb(module->>'mascotImageUrl'), true)
        else module
      end
    )
    from jsonb_array_elements(coalesce(data::jsonb->'modules', '[]'::jsonb)) module
  ),
  true
)
where jsonb_typeof(data::jsonb->'modules') = 'array';
