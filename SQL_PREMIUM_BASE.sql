-- FALLA Premium - Entrega 1: planos, benefícios e assinaturas

CREATE TABLE IF NOT EXISTS public.premium_features (
  feature_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.premium_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime')),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  feature_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.premium_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  provider TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user
ON public.subscriptions(user_id)
WHERE status IN ('active', 'trialing');

ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "premium features public read" ON public.premium_features;
CREATE POLICY "premium features public read" ON public.premium_features FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "premium plans public read" ON public.premium_plans;
CREATE POLICY "premium plans public read" ON public.premium_plans FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "users read own subscription" ON public.subscriptions;
CREATE POLICY "users read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Escritas administrativas devem ser feitas por usuário admin ou service role.
-- O painel atual usa a mesma regra administrativa já existente no projeto.

INSERT INTO public.premium_features (feature_key, name, description, enabled, sort_order) VALUES
('smart_review', 'Revisão inteligente', 'Treinos com questões erradas e conteúdos de maior dificuldade.', TRUE, 1),
('advanced_stats', 'Estatísticas avançadas', 'Evolução, taxa de acerto, tempo estudado e pontos de atenção.', TRUE, 2),
('advanced_pronunciation', 'Pronúncia avançada', 'Mais tentativas, comparação e orientação detalhada.', TRUE, 3),
('premium_themes', 'Temas exclusivos', 'Temas e personalizações visuais Premium.', TRUE, 4),
('premium_mascots', 'Mascotes exclusivos', 'Personagens, roupas e animações especiais.', TRUE, 5),
('offline_mode', 'Modo offline', 'Download de conteúdos para estudar sem conexão.', TRUE, 6),
('weekly_challenges', 'Desafios semanais', 'Metas, medalhas e recompensas semanais.', TRUE, 7),
('study_center', 'Centro de estudos', 'Gramática, expressões, verbos e vocabulário.', TRUE, 8),
('custom_quizzes', 'Simulados personalizados', 'Simulados por módulo, dificuldade e quantidade.', TRUE, 9),
('spaced_review', 'Revisão espaçada', 'Revisões programadas para melhorar a memorização.', TRUE, 10),
('conversation_mode', 'Modo conversação', 'Diálogos completos e prática contextualizada.', TRUE, 11),
('certificates', 'Certificados', 'Certificados por módulo, nível ou curso.', TRUE, 12),
('study_plan', 'Plano de estudos', 'Rotina personalizada com metas e recomendações.', TRUE, 13)
ON CONFLICT (feature_key) DO NOTHING;

INSERT INTO public.premium_plans (id, name, billing_cycle, price_cents, active, feature_keys) VALUES
('premium_monthly', 'Premium Mensal', 'monthly', 1490, TRUE, (SELECT jsonb_agg(feature_key ORDER BY sort_order) FROM public.premium_features WHERE enabled = TRUE)),
('premium_annual', 'Premium Anual', 'annual', 11990, TRUE, (SELECT jsonb_agg(feature_key ORDER BY sort_order) FROM public.premium_features WHERE enabled = TRUE))
ON CONFLICT (id) DO NOTHING;
