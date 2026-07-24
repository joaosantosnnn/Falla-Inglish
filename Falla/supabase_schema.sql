-- 1. Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 2. Create profiles table with progress fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role user_role NOT NULL DEFAULT 'user',
  state TEXT DEFAULT 'SP',
  country TEXT DEFAULT 'Brasil 🇧🇷',
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  lives INTEGER DEFAULT 5,
  coins INTEGER DEFAULT 50,
  completed_lessons TEXT[] DEFAULT '{}',
  current_course_id TEXT DEFAULT 'en_basic',
  avatar_mascot TEXT DEFAULT 'chico',
  plan TEXT DEFAULT 'free',
  has_used_free_name_change BOOLEAN DEFAULT false,
  name_change_cards INTEGER DEFAULT 0,
  active_banner TEXT DEFAULT 'banner_classic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies:
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile except role" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Trigger to automatically create a profile on new auth user signUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    role, 
    state, 
    country,
    xp,
    streak,
    level,
    lives,
    coins,
    completed_lessons,
    current_course_id,
    avatar_mascot,
    plan,
    has_used_free_name_change,
    name_change_cards,
    active_banner
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email, 
    'user',
    'SP',
    'Brasil 🇧🇷',
    0,
    0,
    1,
    5,
    50,
    '{}',
    'en_basic',
    'chico',
    'free',
    false,
    0,
    'banner_classic'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Create user_inventory table
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'banner', 'mascot_skin', 'boost', 'extra_life', 'streak_shield', 'name_card'
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_inventory
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Inventory RLS policies: users manage their own inventory
CREATE POLICY "Users can manage their own inventory"
ON public.user_inventory FOR ALL
USING (auth.uid() = user_id);

-- Admins can view/manage all inventory records
CREATE POLICY "Admins can manage all inventory"
ON public.user_inventory FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. RLS policies for AI tutor config and dynamic courses to restrict to admins
ALTER TABLE public.ai_tutor_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view AI tutor config"
ON public.ai_tutor_config FOR SELECT
USING (true);

CREATE POLICY "Admins can manage AI tutor config"
ON public.ai_tutor_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Protect dynamic courses table too
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
ON public.courses FOR SELECT
USING (true);

CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Add plan_expires_at TIMESTAMPTZ column to profiles (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 7. Create push_notifications table
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'once'
  type TEXT NOT NULL, -- 'ad', 'reminder'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on push_notifications
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Allow select to anyone logged in, or public
CREATE POLICY "Anyone can view push notifications"
ON public.push_notifications FOR SELECT
USING (true);

-- Allow admins to do anything on push_notifications
CREATE POLICY "Admins can manage push notifications"
ON public.push_notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

