import { supabase } from '../lib/supabaseClient';

export type PremiumFeatureKey =
  | 'smart_review'
  | 'advanced_stats'
  | 'advanced_pronunciation'
  | 'premium_themes'
  | 'premium_mascots'
  | 'offline_mode'
  | 'weekly_challenges'
  | 'study_center'
  | 'custom_quizzes'
  | 'spaced_review'
  | 'conversation_mode'
  | 'certificates'
  | 'study_plan';

export interface PremiumFeature {
  key: PremiumFeatureKey;
  name: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
}

export interface PremiumPlanConfig {
  id: string;
  name: string;
  billingCycle: 'monthly' | 'annual' | 'lifetime';
  priceCents: number;
  active: boolean;
  featureKeys: PremiumFeatureKey[];
}

export const DEFAULT_PREMIUM_FEATURES: PremiumFeature[] = [
  { key: 'smart_review', name: 'Revisão inteligente', description: 'Treinos com questões erradas e conteúdos de maior dificuldade.', enabled: true, sortOrder: 1 },
  { key: 'advanced_stats', name: 'Estatísticas avançadas', description: 'Evolução, taxa de acerto, tempo estudado e pontos de atenção.', enabled: true, sortOrder: 2 },
  { key: 'advanced_pronunciation', name: 'Pronúncia avançada', description: 'Mais tentativas, comparação e orientação detalhada de pronúncia.', enabled: true, sortOrder: 3 },
  { key: 'premium_themes', name: 'Temas exclusivos', description: 'Temas e personalizações visuais reservados ao Premium.', enabled: true, sortOrder: 4 },
  { key: 'premium_mascots', name: 'Mascotes exclusivos', description: 'Personagens, roupas e animações especiais.', enabled: true, sortOrder: 5 },
  { key: 'offline_mode', name: 'Modo offline', description: 'Download de conteúdos para estudar sem conexão.', enabled: true, sortOrder: 6 },
  { key: 'weekly_challenges', name: 'Desafios semanais', description: 'Metas, medalhas e recompensas semanais.', enabled: true, sortOrder: 7 },
  { key: 'study_center', name: 'Centro de estudos', description: 'Gramática, expressões, verbos e vocabulário organizado.', enabled: true, sortOrder: 8 },
  { key: 'custom_quizzes', name: 'Simulados personalizados', description: 'Simulados por módulo, dificuldade e quantidade de questões.', enabled: true, sortOrder: 9 },
  { key: 'spaced_review', name: 'Revisão espaçada', description: 'Revisões programadas para melhorar a memorização.', enabled: true, sortOrder: 10 },
  { key: 'conversation_mode', name: 'Modo conversação', description: 'Diálogos completos e prática contextualizada.', enabled: true, sortOrder: 11 },
  { key: 'certificates', name: 'Certificados', description: 'Certificados de conclusão por módulo, nível ou curso.', enabled: true, sortOrder: 12 },
  { key: 'study_plan', name: 'Plano de estudos', description: 'Rotina personalizada com metas e recomendações.', enabled: true, sortOrder: 13 },
];

export const DEFAULT_PREMIUM_PLANS: PremiumPlanConfig[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Mensal',
    billingCycle: 'monthly',
    priceCents: 1490,
    active: true,
    featureKeys: DEFAULT_PREMIUM_FEATURES.map((item) => item.key),
  },
  {
    id: 'premium_annual',
    name: 'Premium Anual',
    billingCycle: 'annual',
    priceCents: 11990,
    active: true,
    featureKeys: DEFAULT_PREMIUM_FEATURES.map((item) => item.key),
  },
];

const LOCAL_FEATURES_KEY = 'falla-premium-features-v1';
const LOCAL_PLANS_KEY = 'falla-premium-plans-v1';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadPremiumFeatures(): Promise<PremiumFeature[]> {
  try {
    const { data, error } = await supabase
      .from('premium_features')
      .select('feature_key,name,description,enabled,sort_order')
      .order('sort_order');

    if (error || !data?.length) throw error || new Error('Sem configuração remota');

    const features = data.map((row: any) => ({
      key: row.feature_key as PremiumFeatureKey,
      name: row.name,
      description: row.description || '',
      enabled: row.enabled !== false,
      sortOrder: Number(row.sort_order || 0),
    }));
    writeLocal(LOCAL_FEATURES_KEY, features);
    return features;
  } catch {
    return readLocal(LOCAL_FEATURES_KEY, DEFAULT_PREMIUM_FEATURES);
  }
}

export async function savePremiumFeatures(features: PremiumFeature[]): Promise<void> {
  writeLocal(LOCAL_FEATURES_KEY, features);
  const payload = features.map((feature) => ({
    feature_key: feature.key,
    name: feature.name,
    description: feature.description,
    enabled: feature.enabled,
    sort_order: feature.sortOrder,
  }));
  const { error } = await supabase.from('premium_features').upsert(payload, { onConflict: 'feature_key' });
  if (error) throw error;
}

export async function loadPremiumPlans(): Promise<PremiumPlanConfig[]> {
  try {
    const { data, error } = await supabase
      .from('premium_plans')
      .select('id,name,billing_cycle,price_cents,active,feature_keys')
      .order('price_cents');
    if (error || !data?.length) throw error || new Error('Sem planos remotos');
    const plans = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      billingCycle: row.billing_cycle,
      priceCents: Number(row.price_cents || 0),
      active: row.active !== false,
      featureKeys: Array.isArray(row.feature_keys) ? row.feature_keys : [],
    })) as PremiumPlanConfig[];
    writeLocal(LOCAL_PLANS_KEY, plans);
    return plans;
  } catch {
    return readLocal(LOCAL_PLANS_KEY, DEFAULT_PREMIUM_PLANS);
  }
}

export async function savePremiumPlans(plans: PremiumPlanConfig[]): Promise<void> {
  writeLocal(LOCAL_PLANS_KEY, plans);
  const payload = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    billing_cycle: plan.billingCycle,
    price_cents: Math.max(0, Math.round(plan.priceCents)),
    active: plan.active,
    feature_keys: plan.featureKeys,
  }));
  const { error } = await supabase.from('premium_plans').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export function hasPremiumFeature(
  userPlan: string | undefined,
  featureKey: PremiumFeatureKey,
  features: PremiumFeature[] = readLocal(LOCAL_FEATURES_KEY, DEFAULT_PREMIUM_FEATURES),
): boolean {
  const isPremium = userPlan === 'premium' || userPlan === 'pro' || userPlan === 'family';
  return isPremium && features.some((feature) => feature.key === featureKey && feature.enabled);
}
