export type MissionMetric = 'lessons' | 'correct_answers' | 'xp' | 'study_minutes';
export type MissionCadence = 'daily' | 'weekly';

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  metric: MissionMetric;
  target: number;
  cadence: MissionCadence;
  rewardCoins: number;
  rewardXp: number;
  premium?: boolean;
}

export interface MissionProgress {
  values: Record<string, number>;
  claimed: string[];
  periodKeys: Record<MissionCadence, string>;
}

export interface EngagementConfig {
  dailyLoginCoins: number;
  dailyLoginXp: number;
  missions: MissionDefinition[];
}

const CONFIG_KEY = 'falla_engagement_config_v1';
const PROGRESS_KEY = 'falla_engagement_progress_v1';
const LOGIN_KEY = 'falla_daily_login_claim';

export const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  dailyLoginCoins: 5,
  dailyLoginXp: 10,
  missions: [
    { id: 'daily_lesson', title: 'Primeiro passo do dia', description: 'Conclua 1 lição hoje.', emoji: '📘', metric: 'lessons', target: 1, cadence: 'daily', rewardCoins: 5, rewardXp: 10 },
    { id: 'daily_correct', title: 'Mente afiada', description: 'Acerte 15 perguntas hoje.', emoji: '🎯', metric: 'correct_answers', target: 15, cadence: 'daily', rewardCoins: 8, rewardXp: 15 },
    { id: 'daily_minutes', title: 'Foco total', description: 'Estude por 10 minutos hoje.', emoji: '⏱️', metric: 'study_minutes', target: 10, cadence: 'daily', rewardCoins: 8, rewardXp: 20 },
    { id: 'weekly_lessons', title: 'Ritmo de campeão', description: 'Conclua 7 lições nesta semana.', emoji: '🏆', metric: 'lessons', target: 7, cadence: 'weekly', rewardCoins: 30, rewardXp: 60 },
    { id: 'weekly_correct', title: 'Semana brilhante', description: 'Acerte 100 perguntas nesta semana.', emoji: '✨', metric: 'correct_answers', target: 100, cadence: 'weekly', rewardCoins: 45, rewardXp: 90, premium: true },
  ],
};

function dayKey(date = new Date()) { return date.toLocaleDateString('en-CA'); }
function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function loadEngagementConfig(): EngagementConfig {
  try { return { ...DEFAULT_ENGAGEMENT_CONFIG, ...(JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || {}) }; }
  catch { return DEFAULT_ENGAGEMENT_CONFIG; }
}

export function saveEngagementConfig(config: EngagementConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('falla-engagement-updated'));
}

function emptyProgress(): MissionProgress {
  return { values: {}, claimed: [], periodKeys: { daily: dayKey(), weekly: weekKey() } };
}

export function loadMissionProgress(): MissionProgress {
  let progress = emptyProgress();
  try { progress = { ...progress, ...(JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null') || {}) }; } catch {}
  const current = { daily: dayKey(), weekly: weekKey() };
  const config = loadEngagementConfig();
  for (const cadence of ['daily', 'weekly'] as const) {
    if (progress.periodKeys[cadence] !== current[cadence]) {
      const ids = new Set(config.missions.filter(m => m.cadence === cadence).map(m => m.id));
      Object.keys(progress.values).forEach(id => { if (ids.has(id)) delete progress.values[id]; });
      progress.claimed = progress.claimed.filter(id => !ids.has(id));
      progress.periodKeys[cadence] = current[cadence];
    }
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function registerMissionActivity(activity: Partial<Record<MissionMetric, number>>) {
  const config = loadEngagementConfig();
  const progress = loadMissionProgress();
  config.missions.forEach(mission => {
    const amount = activity[mission.metric] || 0;
    if (amount > 0) progress.values[mission.id] = Math.min(mission.target, (progress.values[mission.id] || 0) + amount);
  });
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event('falla-missions-updated'));
  return progress;
}

export function claimMission(missionId: string) {
  const config = loadEngagementConfig();
  const progress = loadMissionProgress();
  const mission = config.missions.find(m => m.id === missionId);
  if (!mission || progress.claimed.includes(missionId) || (progress.values[missionId] || 0) < mission.target) return null;
  progress.claimed.push(missionId);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return { coins: mission.rewardCoins, xp: mission.rewardXp };
}

export function canClaimDailyLogin() { return localStorage.getItem(LOGIN_KEY) !== dayKey(); }
export function claimDailyLogin() {
  if (!canClaimDailyLogin()) return null;
  localStorage.setItem(LOGIN_KEY, dayKey());
  const config = loadEngagementConfig();
  return { coins: config.dailyLoginCoins, xp: config.dailyLoginXp };
}
