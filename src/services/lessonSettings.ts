import { supabase } from '../lib/supabaseClient';

export interface LessonSettings {
  correctStreakGoal: number;
}

export const DEFAULT_LESSON_SETTINGS: LessonSettings = {
  correctStreakGoal: 5,
};

const STORAGE_KEY = 'falla_lesson_settings';
const SETTINGS_ID = 'main';

const normalizeGoal = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LESSON_SETTINGS.correctStreakGoal;
  return Math.min(50, Math.max(2, Math.round(parsed)));
};

export const getLocalLessonSettings = (): LessonSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_LESSON_SETTINGS;
    const parsed = JSON.parse(stored);
    return { correctStreakGoal: normalizeGoal(parsed?.correctStreakGoal) };
  } catch {
    return DEFAULT_LESSON_SETTINGS;
  }
};

const saveLocal = (settings: LessonSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('falla:lesson-settings-changed', { detail: settings }));
};

export const loadLessonSettings = async (): Promise<LessonSettings> => {
  const local = getLocalLessonSettings();

  try {
    const { data, error } = await supabase
      .from('lesson_settings')
      .select('correct_streak_goal')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (error || !data) return local;

    const settings = {
      correctStreakGoal: normalizeGoal(data.correct_streak_goal),
    };
    saveLocal(settings);
    return settings;
  } catch {
    return local;
  }
};

export const saveLessonSettings = async (settings: LessonSettings): Promise<LessonSettings> => {
  const normalized = {
    correctStreakGoal: normalizeGoal(settings.correctStreakGoal),
  };

  const { error } = await supabase
    .from('lesson_settings')
    .upsert({
      id: SETTINGS_ID,
      correct_streak_goal: normalized.correctStreakGoal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
  saveLocal(normalized);
  return normalized;
};
