import { Course, UserProgress } from '../types';
import { getLearningHistory, QuestionAttemptRecord } from './premiumLearningService';

export interface LessonSessionRecord {
  id: string;
  courseId: string;
  lessonId: string;
  completedAt: string;
  durationSeconds: number;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
}

export interface DailyActivity {
  date: string;
  answers: number;
  correct: number;
  errors: number;
  minutes: number;
  xp: number;
}

const SESSIONS_KEY = 'falla-analytics-sessions-v1';

function readSessions(): LessonSessionRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordLessonSession(input: Omit<LessonSessionRecord, 'id' | 'completedAt'>): void {
  const sessions = readSessions();
  sessions.push({ ...input, id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, completedAt: new Date().toISOString() });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(-1500)));
  window.dispatchEvent(new CustomEvent('falla:analytics-updated'));
}

export function getLessonSessions(): LessonSessionRecord[] {
  return readSessions();
}

function localDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyActivity(days = 30, courseId?: string): DailyActivity[] {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (days - 1 - index));
    return localDateKey(date);
  });
  const map = new Map(dates.map(date => [date, { date, answers: 0, correct: 0, errors: 0, minutes: 0, xp: 0 }]));

  getLearningHistory().filter(item => !courseId || item.courseId === courseId).forEach(item => {
    const day = map.get(localDateKey(item.answeredAt));
    if (!day) return;
    day.answers += 1;
    item.correct ? day.correct += 1 : day.errors += 1;
  });

  readSessions().filter(item => !courseId || item.courseId === courseId).forEach(item => {
    const day = map.get(localDateKey(item.completedAt));
    if (!day) return;
    day.minutes += Math.max(1, Math.round(item.durationSeconds / 60));
    day.xp += item.xpEarned;
  });

  return Array.from(map.values());
}

export function getAnalyticsSummary(courses: Course[], courseId: string, progress: UserProgress) {
  const history = getLearningHistory().filter(item => item.courseId === courseId);
  const sessions = readSessions().filter(item => item.courseId === courseId);
  const correct = history.filter(item => item.correct).length;
  const answers = history.length;
  const totalSeconds = sessions.reduce((sum, item) => sum + item.durationSeconds, 0);
  const stars = Object.values(progress.lessonStars || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const last7 = getDailyActivity(7, courseId);
  const last30 = getDailyActivity(30, courseId);

  const lessonLookup = new Map<string, { title: string; moduleId: string; moduleTitle: string }>();
  const questionLookup = new Map<string, { label: string; lessonId: string; moduleId: string; moduleTitle: string }>();
  courses.forEach(course => course.modules.forEach(module => module.lessons.forEach(lesson => {
    lessonLookup.set(lesson.id, { title: lesson.title, moduleId: module.id, moduleTitle: module.title });
    lesson.questions.forEach(question => questionLookup.set(question.id, {
      label: question.text || question.prompt || String(question.correctAnswer),
      lessonId: lesson.id,
      moduleId: module.id,
      moduleTitle: module.title,
    }));
  })));

  const moduleStats = new Map<string, { id: string; title: string; answers: number; correct: number; completed: number; totalLessons: number }>();
  const selectedCourse = courses.find(item => item.id === courseId);
  selectedCourse?.modules.forEach(module => moduleStats.set(module.id, { id: module.id, title: module.title, answers: 0, correct: 0, completed: 0, totalLessons: module.lessons.length }));
  history.forEach(item => {
    const lesson = lessonLookup.get(item.lessonId);
    if (!lesson) return;
    const row = moduleStats.get(lesson.moduleId);
    if (!row) return;
    row.answers += 1;
    if (item.correct) row.correct += 1;
  });
  selectedCourse?.modules.forEach(module => {
    const row = moduleStats.get(module.id);
    if (row) row.completed = module.lessons.filter(lesson => progress.completedLessons.includes(lesson.id)).length;
  });

  const questionStats = new Map<string, { id: string; label: string; errors: number; attempts: number; lastAttempt: string; moduleTitle: string }>();
  history.forEach(item => {
    const question = questionLookup.get(item.questionId);
    if (!question) return;
    const current = questionStats.get(item.questionId) || { id: item.questionId, label: question.label, errors: 0, attempts: 0, lastAttempt: item.answeredAt, moduleTitle: question.moduleTitle };
    current.attempts += 1;
    if (!item.correct) current.errors += 1;
    if (new Date(item.answeredAt) > new Date(current.lastAttempt)) current.lastAttempt = item.answeredAt;
    questionStats.set(item.questionId, current);
  });

  return {
    answers,
    correct,
    errors: answers - correct,
    accuracy: answers ? Math.round((correct / answers) * 100) : 0,
    totalMinutes: Math.round(totalSeconds / 60),
    lessonsCompleted: progress.completedLessons.length,
    stars,
    sessions: sessions.length,
    last7,
    last30,
    moduleStats: Array.from(moduleStats.values()).map(item => ({ ...item, accuracy: item.answers ? Math.round((item.correct / item.answers) * 100) : 0 })),
    difficultQuestions: Array.from(questionStats.values()).filter(item => item.errors > 0).sort((a, b) => b.errors - a.errors || b.attempts - a.attempts).slice(0, 12),
  };
}

export function getUnlockedMedals(progress: UserProgress, answers: number, accuracy: number, totalMinutes: number) {
  return [
    { id: 'first-lesson', emoji: '🌱', title: 'Primeiros passos', description: 'Concluiu a primeira fase.', unlocked: progress.completedLessons.length >= 1 },
    { id: 'hundred-answers', emoji: '💯', title: '100 respostas', description: 'Respondeu 100 questões.', unlocked: answers >= 100 },
    { id: 'seven-streak', emoji: '🔥', title: 'Semana em chamas', description: 'Alcançou 7 dias de sequência.', unlocked: progress.streak >= 7 },
    { id: 'accuracy-90', emoji: '🎯', title: 'Precisão de elite', description: 'Manteve pelo menos 90% de acerto.', unlocked: answers >= 20 && accuracy >= 90 },
    { id: 'study-300', emoji: '⏱️', title: '5 horas de estudo', description: 'Estudou por 300 minutos.', unlocked: totalMinutes >= 300 },
    { id: 'ten-lessons', emoji: '🏆', title: 'Explorador', description: 'Concluiu 10 fases.', unlocked: progress.completedLessons.length >= 10 },
  ];
}
