-- ============================================================================
-- Falla · Bolsa (Inventário) — Reference schema for Supabase
-- ============================================================================
-- IMPORTANT CONTEXT: as of this change, the Falla app does not use Supabase
-- Auth or persist user progress (coins, xp, purchases) in Supabase — it all
-- lives in the browser's localStorage (see `falla_user_progress` key in
-- src/App.tsx). Supabase today is only used for read-only content tables
-- (courses, learning_tips, achievements, ai_tutor_config, interface_texts).
--
-- This script is provided so the requested data model exists and is ready to
-- go, but wiring it up for real (so items follow a user across devices) will
-- require adding real Supabase Auth first, so `auth.uid()` can be used to
-- securely scope rows with Row Level Security. Until then, the Bolsa feature
-- works fully client-side (see src/components/Inventory.tsx), consistent with
-- how the rest of the app's progress is currently stored.
-- ============================================================================

-- 1. Catalog of items sold in the Loja (mirrors the array currently hardcoded
--    in the "LOJA VIEW" section of src/App.tsx)
create table if not exists shop_items (
  id text primary key,                 -- e.g. 'xp_boost', 'extra_life'
  name text not null,
  description text not null,
  icon text not null,                  -- emoji icon
  item_type text not null check (item_type in ('consumable', 'cosmetic')),
  benefit_label text not null,         -- short label, e.g. '+50 XP'
  cost integer not null check (cost >= 0),
  created_at timestamptz not null default now()
);

insert into shop_items (id, name, description, icon, item_type, benefit_label, cost) values
  ('xp_boost', 'Poção de Super XP', 'Consuma para receber instantaneamente +50 XP extras na sua conta!', '🧪', 'consumable', '+50 XP', 20),
  ('extra_life', 'Kit de Vida Extra', 'Recarrega 1 vida para que você continue estudando sem parar!', '❤️', 'consumable', '+1 Vida', 10),
  ('streak_shield', 'Escudo Protetor', 'Protege e mantém sua ofensiva diária ativa por mais 1 dia!', '🛡️', 'consumable', 'Proteção', 30),
  ('name_card', 'Cartão de Alteração de Nome', 'Permite alterar seu nome de usuário no seu Perfil!', '🏷️', 'consumable', 'Item Especial', 15)
on conflict (id) do nothing;

-- 2. Per-user inventory (the "Bolsa")
create table if not exists user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references shop_items(id),
  item_type text not null check (item_type in ('consumable', 'cosmetic')),
  quantity integer not null default 1 check (quantity >= 0),
  acquired_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table user_inventory enable row level security;

create policy "Users can view their own inventory"
  on user_inventory for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own inventory"
  on user_inventory for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own inventory"
  on user_inventory for update
  using (auth.uid() = user_id);

-- Example upsert used when a purchase happens (increments quantity if the
-- item is already owned):
--
-- insert into user_inventory (user_id, item_id, item_type, quantity)
-- values (auth.uid(), 'xp_boost', 'consumable', 1)
-- on conflict (user_id, item_id)
-- do update set quantity = user_inventory.quantity + 1, acquired_at = now();
