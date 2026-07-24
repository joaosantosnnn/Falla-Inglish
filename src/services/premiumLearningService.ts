import { Course, Lesson, Question } from '../types';

export interface QuestionAttemptRecord {
  questionId: string;
  lessonId: string;
  courseId: string;
  correct: boolean;
  answeredAt: string;
  nextReviewAt: string;
  intervalDays: number;
  repetitions: number;
}

export interface LessonAttemptInput {
  courseId: string;
  lessonId: string;
  questionResults: Array<{ questionId: string; correct: boolean }>;
}

const STORAGE_KEY = 'falla-premium-learning-history-v1';

function readHistory(): QuestionAttemptRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(records: QuestionAttemptRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-2500)));
  window.dispatchEvent(new CustomEvent('falla:premium-learning-updated'));
}

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function recordLessonAttempt(input: LessonAttemptInput): void {
  const history = readHistory();
  const now = new Date();

  input.questionResults.forEach((result) => {
    const previous = [...history].reverse().find((item) => item.questionId === result.questionId);
    const repetitions = result.correct ? (previous?.repetitions || 0) + 1 : 0;
    const intervalDays = result.correct
      ? repetitions <= 1 ? 1 : repetitions === 2 ? 3 : repetitions === 3 ? 7 : Math.min(30, (previous?.intervalDays || 7) * 2)
      : 1;

    history.push({
      questionId: result.questionId,
      lessonId: input.lessonId,
      courseId: input.courseId,
      correct: result.correct,
      answeredAt: now.toISOString(),
      nextReviewAt: addDays(now, intervalDays),
      intervalDays,
      repetitions,
    });
  });

  writeHistory(history);
}

export function getLearningHistory(): QuestionAttemptRecord[] {
  return readHistory();
}

export function getLatestQuestionRecords(courseId?: string): QuestionAttemptRecord[] {
  const latest = new Map<string, QuestionAttemptRecord>();
  readHistory()
    .filter((item) => !courseId || item.courseId === courseId)
    .forEach((item) => latest.set(item.questionId, item));
  return Array.from(latest.values());
}

export function getWrongQuestionIds(courseId?: string): string[] {
  return getLatestQuestionRecords(courseId).filter((item) => !item.correct).map((item) => item.questionId);
}

export function getDueQuestionIds(courseId?: string): string[] {
  const now = Date.now();
  return getLatestQuestionRecords(courseId)
    .filter((item) => !item.correct || new Date(item.nextReviewAt).getTime() <= now)
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
    .map((item) => item.questionId);
}

export function findQuestions(courses: Course[], ids: string[]): Question[] {
  const wanted = new Set(ids);
  const result: Question[] = [];
  courses.forEach((course) => course.modules.forEach((module) => module.lessons.forEach((lesson) => {
    lesson.questions.forEach((question) => {
      if (wanted.has(question.id)) result.push(question);
    });
  })));
  return result;
}

export function buildReviewLesson(courses: Course[], ids: string[], title: string, limit = 20): Lesson | null {
  const questions = findQuestions(courses, ids).slice(0, limit);
  if (!questions.length) return null;
  return {
    id: `premium-review-${Date.now()}`,
    title,
    description: 'Treino Premium criado com base no seu histórico de aprendizagem.',
    xpReward: Math.max(10, questions.length * 5),
    questions,
  };
}

export function buildCustomQuiz(
  courses: Course[],
  courseId: string,
  moduleId: string | 'all',
  amount: number,
): Lesson | null {
  const course = courses.find((item) => item.id === courseId) || courses[0];
  if (!course) return null;
  const modules = moduleId === 'all' ? course.modules : course.modules.filter((item) => item.id === moduleId);
  const pool = modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.questions));
  if (!pool.length) return null;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(amount, pool.length));
  return {
    id: `premium-quiz-${Date.now()}`,
    title: 'Simulado personalizado',
    description: `${shuffled.length} questões selecionadas para o seu treino.`,
    xpReward: Math.max(10, shuffled.length * 5),
    questions: shuffled,
  };
}

export function getCoachSummary(courses: Course[], courseId: string) {
  const history = readHistory().filter((item) => item.courseId === courseId);
  const latest = getLatestQuestionRecords(courseId);
  const total = history.length;
  const correct = history.filter((item) => item.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const wrongIds = latest.filter((item) => !item.correct).map((item) => item.questionId);
  const dueIds = getDueQuestionIds(courseId);

  const lessonErrors = new Map<string, number>();
  latest.filter((item) => !item.correct).forEach((item) => lessonErrors.set(item.lessonId, (lessonErrors.get(item.lessonId) || 0) + 1));
  const hardestLessonId = Array.from(lessonErrors.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  let hardestLessonTitle = '';
  courses.forEach((course) => course.modules.forEach((module) => module.lessons.forEach((lesson) => {
    if (lesson.id === hardestLessonId) hardestLessonTitle = lesson.title;
  })));

  return {
    total,
    accuracy,
    wrongCount: wrongIds.length,
    dueCount: dueIds.length,
    hardestLessonTitle,
    recommendation: !total
      ? 'Complete algumas fases para receber recomendações personalizadas.'
      : dueIds.length > 0
        ? `Você tem ${dueIds.length} questão(ões) prontas para revisão. Comece por elas hoje.`
        : wrongIds.length > 0
          ? `Revise seus ${wrongIds.length} ponto(s) de dificuldade para fortalecer a memória.`
          : 'Ótimo desempenho! Faça um simulado misto para manter o conteúdo ativo.',
  };
}
