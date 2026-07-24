import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Brain, CalendarClock, Crown, LockKeyhole, Play, SlidersHorizontal, Target } from 'lucide-react';
import { Course, Lesson } from '../types';
import { hasPremiumFeature, PremiumFeatureKey } from '../services/premiumService';
import {
  buildCustomQuiz,
  buildReviewLesson,
  getCoachSummary,
  getDueQuestionIds,
  getWrongQuestionIds,
} from '../services/premiumLearningService';

interface Props {
  courses: Course[];
  currentCourseId: string;
  userPlan?: string;
  onStartLesson: (lesson: Lesson) => void;
  onOpenPlans: () => void;
}

export default function PremiumLearningHub({ courses, currentCourseId, userPlan, onStartLesson, onOpenPlans }: Props) {
  const [version, setVersion] = useState(0);
  const [moduleId, setModuleId] = useState<string>('all');
  const [amount, setAmount] = useState(10);
  const course = courses.find((item) => item.id === currentCourseId) || courses[0];
  const premium = userPlan === 'premium' || userPlan === 'pro' || userPlan === 'family';

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('falla:premium-learning-updated', refresh);
    return () => window.removeEventListener('falla:premium-learning-updated', refresh);
  }, []);

  const data = useMemo(() => ({
    wrongIds: getWrongQuestionIds(course?.id),
    dueIds: getDueQuestionIds(course?.id),
    coach: getCoachSummary(courses, course?.id || ''),
  }), [courses, course?.id, version]);

  const startReview = (kind: 'wrong' | 'due') => {
    const feature: PremiumFeatureKey = kind === 'wrong' ? 'smart_review' : 'spaced_review';
    if (!hasPremiumFeature(userPlan, feature)) return onOpenPlans();
    const lesson = buildReviewLesson(
      courses,
      kind === 'wrong' ? data.wrongIds : data.dueIds,
      kind === 'wrong' ? 'Revisão dos erros' : 'Revisão espaçada',
    );
    if (!lesson) return alert(kind === 'wrong' ? 'Você ainda não possui questões erradas para revisar.' : 'Nenhuma revisão está pendente agora.');
    onStartLesson(lesson);
  };

  const startQuiz = () => {
    if (!course) return alert('Nenhum curso está disponível para criar o simulado.');
    if (!hasPremiumFeature(userPlan, 'custom_quizzes')) return onOpenPlans();
    const lesson = buildCustomQuiz(courses, course.id, moduleId, amount);
    if (!lesson) return alert('Não encontramos questões para este simulado.');
    onStartLesson(lesson);
  };

  if (!course) return <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 text-xs font-bold text-slate-500">Nenhum curso disponível.</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="rounded-3xl border-2 border-falla-blue/20 bg-gradient-to-br from-falla-blue/10 to-falla-pink/10 p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-falla-blue"><Crown size={18} /><span className="text-[10px] font-black uppercase tracking-[0.18em]">Central Premium</span></div>
            <h2 className="mt-2 text-xl md:text-2xl font-black text-slate-800">Seu treino personalizado</h2>
            <p className="mt-1 text-xs font-bold text-slate-500 max-w-xl">Revise erros, pratique no momento certo e crie simulados usando as questões já cadastradas no FALLA.</p>
          </div>
          {!premium && <button onClick={onOpenPlans} className="rounded-xl bg-falla-pink px-4 py-2 text-[10px] font-black uppercase text-white">Desbloquear</button>}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <Brain className="text-falla-pink" size={24} />
          <h3 className="mt-3 text-sm font-black text-slate-800">Revisão inteligente</h3>
          <p className="mt-1 text-[11px] font-bold text-slate-500">Treine somente o que errou.</p>
          <div className="mt-4 text-3xl font-black text-slate-800">{data.wrongIds.length}</div>
          <span className="text-[9px] font-black uppercase text-slate-400">pontos de dificuldade</span>
          <button onClick={() => startReview('wrong')} className="mt-4 w-full rounded-xl bg-falla-pink py-3 text-[10px] font-black uppercase text-white flex items-center justify-center gap-2">
            {hasPremiumFeature(userPlan, 'smart_review') ? <Play size={14} /> : <LockKeyhole size={14} />} Revisar erros
          </button>
        </article>

        <article className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <CalendarClock className="text-falla-blue" size={24} />
          <h3 className="mt-3 text-sm font-black text-slate-800">Revisão espaçada</h3>
          <p className="mt-1 text-[11px] font-bold text-slate-500">Reaparece em 1, 3, 7, 14 e até 30 dias.</p>
          <div className="mt-4 text-3xl font-black text-slate-800">{data.dueIds.length}</div>
          <span className="text-[9px] font-black uppercase text-slate-400">revisões disponíveis</span>
          <button onClick={() => startReview('due')} className="mt-4 w-full rounded-xl bg-falla-blue py-3 text-[10px] font-black uppercase text-white flex items-center justify-center gap-2">
            {hasPremiumFeature(userPlan, 'spaced_review') ? <Play size={14} /> : <LockKeyhole size={14} />} Revisar agora
          </button>
        </article>

        <article className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <Target className="text-falla-green" size={24} />
          <h3 className="mt-3 text-sm font-black text-slate-800">Coach de estudos</h3>
          <p className="mt-1 text-[11px] font-bold text-slate-500">Orientação baseada no seu desempenho.</p>
          <div className="mt-4 flex gap-4"><div><b className="text-xl text-slate-800">{data.coach.accuracy}%</b><small className="block text-[8px] uppercase font-black text-slate-400">acerto</small></div><div><b className="text-xl text-slate-800">{data.coach.total}</b><small className="block text-[8px] uppercase font-black text-slate-400">respostas</small></div></div>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[10px] font-bold leading-relaxed text-slate-600">{data.coach.recommendation}</p>
          {data.coach.hardestLessonTitle && <p className="mt-2 text-[9px] font-black text-amber-600">Maior atenção: {data.coach.hardestLessonTitle}</p>}
        </article>
      </div>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3"><SlidersHorizontal className="text-falla-blue" size={22} /><div><h3 className="text-sm font-black text-slate-800">Simulado personalizado</h3><p className="text-[10px] font-bold text-slate-500">Escolha o módulo e a quantidade.</p></div></div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
          <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-xs font-bold outline-none">
            <option value="all">Todos os módulos</option>
            {course?.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
          </select>
          <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-xs font-bold outline-none">
            {[5, 10, 20, 30, 50].map((value) => <option key={value} value={value}>{value} questões</option>)}
          </select>
          <button onClick={startQuiz} className="rounded-xl bg-falla-green px-5 py-3 text-[10px] font-black uppercase text-white flex items-center justify-center gap-2">
            {hasPremiumFeature(userPlan, 'custom_quizzes') ? <BookOpenCheck size={15} /> : <LockKeyhole size={15} />} Criar simulado
          </button>
        </div>
      </section>
    </div>
  );
}
