-- Configuração global das metas de acertos consecutivos.
CREATE TABLE IF NOT EXISTS public.lesson_settings (
  id TEXT PRIMARY KEY,
  correct_streak_goal INTEGER NOT NULL DEFAULT 5 CHECK (correct_streak_goal BETWEEN 2 AND 50),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.lesson_settings (id, correct_streak_goal)
VALUES ('main', 5)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.lesson_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_settings_read" ON public.lesson_settings;
CREATE POLICY "lesson_settings_read"
ON public.lesson_settings FOR SELECT
TO authenticated
USING (true);

-- Ajuste esta política conforme sua regra de administrador.
DROP POLICY IF EXISTS "lesson_settings_admin_write" ON public.lesson_settings;
CREATE POLICY "lesson_settings_admin_write"
ON public.lesson_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
