import React, { useEffect, useMemo, useState } from 'react';
import { Award, BarChart3, BookOpenCheck, CalendarDays, Clock3, Crown, Download, LockKeyhole, Play, Star, Target, Trophy } from 'lucide-react';
import { Course, Lesson, UserProgress } from '../types';
import { buildReviewLesson } from '../services/premiumLearningService';
import { getAnalyticsSummary, getUnlockedMedals } from '../services/analyticsService';
import { hasPremiumFeature } from '../services/premiumService';

interface Props {
  courses: Course[];
  currentCourseId: string;
  progress: UserProgress;
  userName: string;
  onStartLesson: (lesson: Lesson) => void;
  onOpenPlans: () => void;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${rest ? ` ${rest}min` : ''}`;
}

export default function PremiumAnalyticsDashboard({ courses, currentCourseId, progress, userName, onStartLesson, onOpenPlans }: Props) {
  const [version, setVersion] = useState(0);
  const [period, setPeriod] = useState<7 | 30>(7);
  const allowed = hasPremiumFeature(progress.plan, 'advanced_stats');
  const certificateAllowed = hasPremiumFeature(progress.plan, 'certificates');
  const course = courses.find(item => item.id === currentCourseId) || courses[0];

  useEffect(() => {
    const refresh = () => setVersion(value => value + 1);
    window.addEventListener('falla:analytics-updated', refresh);
    window.addEventListener('falla:premium-learning-updated', refresh);
    return () => {
      window.removeEventListener('falla:analytics-updated', refresh);
      window.removeEventListener('falla:premium-learning-updated', refresh);
    };
  }, []);

  const data = useMemo(() => getAnalyticsSummary(courses, course?.id || currentCourseId, progress), [courses, course?.id, currentCourseId, progress, version]);
  const medals = useMemo(() => getUnlockedMedals(progress, data.answers, data.accuracy, data.totalMinutes), [progress, data]);
  const activity = period === 7 ? data.last7 : data.last30;
  const maxAnswers = Math.max(1, ...activity.map(item => item.answers));

  const trainDifficult = () => {
    if (!allowed) return onOpenPlans();
    const lesson = buildReviewLesson(courses, data.difficultQuestions.map(item => item.id), 'Treino das palavras difíceis', 20);
    if (!lesson) return alert('Ainda não há questões difíceis registradas para treinar.');
    onStartLesson(lesson);
  };

  const printCertificate = (moduleId: string) => {
    if (!certificateAllowed) return onOpenPlans();
    const module = course?.modules.find(item => item.id === moduleId);
    if (!module) return;
    const complete = module.lessons.length > 0 && module.lessons.every(lesson => progress.completedLessons.includes(lesson.id));
    if (!complete) return alert('Conclua todas as fases deste módulo para emitir o certificado.');
    const popup = window.open('', '_blank', 'width=1000,height=750');
    if (!popup) return alert('Permita pop-ups para gerar o certificado.');
    const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Certificado FALLA</title><style>body{font-family:Arial,sans-serif;background:#eef6ff;padding:32px}.certificate{background:white;border:14px double #2563eb;max-width:900px;margin:auto;padding:70px;text-align:center}.brand{font-size:28px;font-weight:900;color:#2563eb}.title{font-size:48px;margin:26px 0 10px}.name{font-size:32px;font-weight:900;border-bottom:2px solid #94a3b8;display:inline-block;padding:0 40px 8px}.module{font-size:26px;color:#7c3aed;font-weight:800}.date{margin-top:45px;color:#475569}.print{margin:28px auto;display:block;padding:12px 20px}@media print{.print{display:none}body{background:white;padding:0}}</style></head><body><button class="print" onclick="window.print()">Salvar como PDF / Imprimir</button><div class="certificate"><div class="brand">FALLA</div><div class="title">Certificado de Conclusão</div><p>Certificamos que</p><div class="name">${userName || 'Estudante FALLA'}</div><p>concluiu com sucesso o módulo</p><div class="module">${module.title}</div><p>do curso ${course?.name || ''}, demonstrando dedicação e evolução no aprendizado.</p><div class="date">Emitido em ${date}</div></div></body></html>`);
    popup.document.close();
  };

  if (!course) return null;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <section className="rounded-3xl border-2 border-falla-blue/20 bg-gradient-to-br from-sky-50 via-white to-purple-50 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-falla-blue"><Crown size={18}/><span className="text-[10px] font-black uppercase tracking-[.18em]">Analytics Premium</span></div><h2 className="mt-2 text-2xl font-black text-slate-800">Meu desempenho</h2><p className="mt-1 text-xs font-bold text-slate-500">Acompanhe sua evolução, descubra dificuldades e transforme dados em próximos passos.</p></div>
          {!allowed && <button onClick={onOpenPlans} className="rounded-xl bg-falla-pink px-4 py-2 text-[10px] font-black uppercase text-white flex items-center gap-2"><LockKeyhole size={14}/> Desbloquear</button>}
        </div>
      </section>

      <div className={`space-y-5 ${!allowed ? 'relative max-h-[760px] overflow-hidden' : ''}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Target, label: 'Precisão geral', value: `${data.accuracy}%` },
            { icon: BookOpenCheck, label: 'Fases concluídas', value: data.lessonsCompleted },
            { icon: Clock3, label: 'Tempo estudado', value: formatMinutes(data.totalMinutes) },
            { icon: Star, label: 'Estrelas', value: data.stars },
            { icon: Trophy, label: 'Nível atual', value: progress.level },
            { icon: Crown, label: 'XP atual', value: progress.xp },
            { icon: BarChart3, label: 'Respostas', value: data.answers },
            { icon: CalendarDays, label: 'Sequência', value: `${progress.streak} dias` },
          ].map(({ icon: Icon, label, value }) => <article key={label} className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm"><Icon size={20} className="text-falla-blue"/><div className="mt-3 text-xl font-black text-slate-800">{value}</div><div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div></article>)}
        </div>

        <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-black text-slate-800">Evolução de respostas</h3><p className="text-[10px] font-bold text-slate-500">Acertos e erros por dia.</p></div><div className="flex rounded-xl bg-slate-100 p-1">{([7,30] as const).map(value => <button key={value} onClick={() => setPeriod(value)} className={`rounded-lg px-3 py-1.5 text-[9px] font-black ${period === value ? 'bg-white text-falla-blue shadow-sm' : 'text-slate-400'}`}>{value} DIAS</button>)}</div></div>
          <div className="mt-5 flex h-44 items-end gap-1 overflow-hidden border-b border-slate-200 pb-1">{activity.map(item => <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${item.date}: ${item.correct} acertos, ${item.errors} erros`}><div className="w-full max-w-7 rounded-t bg-falla-green" style={{height:`${Math.max(item.correct ? 8 : 0, (item.correct/maxAnswers)*120)}px`}}/><div className="w-full max-w-7 rounded-t bg-falla-pink" style={{height:`${Math.max(item.errors ? 5 : 0, (item.errors/maxAnswers)*120)}px`}}/><span className="text-[7px] font-bold text-slate-400">{item.date.slice(8)}</span></div>)}</div>
          <div className="mt-3 flex gap-4 text-[9px] font-black uppercase text-slate-500"><span>🟩 Acertos</span><span>🟥 Erros</span></div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-black text-slate-800">Desempenho por módulo</h3><div className="mt-4 space-y-4">{data.moduleStats.map(item => <div key={item.id}><div className="flex justify-between gap-3 text-[10px] font-black"><span className="truncate text-slate-600">{item.title}</span><span className="text-slate-800">{item.accuracy}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-falla-blue" style={{width:`${item.accuracy}%`}}/></div><div className="mt-1 text-[8px] font-bold text-slate-400">{item.completed}/{item.totalLessons} fases concluídas</div></div>)}</div></section>
          <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-black text-slate-800">Palavras e questões difíceis</h3><p className="text-[9px] font-bold text-slate-400">Ordenadas pela quantidade de erros.</p></div><button onClick={trainDifficult} className="rounded-xl bg-falla-pink px-3 py-2 text-[9px] font-black uppercase text-white flex items-center gap-1"><Play size={12}/> Treinar</button></div><div className="mt-4 space-y-2">{data.difficultQuestions.length ? data.difficultQuestions.slice(0,7).map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><div className="truncate text-[10px] font-black text-slate-700">{item.label}</div><div className="text-[8px] font-bold text-slate-400">{item.moduleTitle}</div></div><span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-[8px] font-black text-rose-600">{item.errors} erro(s)</span></div>) : <p className="rounded-xl bg-emerald-50 p-4 text-[10px] font-bold text-emerald-700">Nenhuma dificuldade registrada ainda. Continue estudando para gerar sua análise.</p>}</div></section>
        </div>

        <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Award className="text-amber-500"/><h3 className="text-sm font-black text-slate-800">Medalhas</h3></div><div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">{medals.map(item => <div key={item.id} className={`rounded-2xl border-2 p-4 ${item.unlocked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-55'}`}><div className="text-2xl">{item.unlocked ? item.emoji : '🔒'}</div><div className="mt-2 text-[10px] font-black text-slate-700">{item.title}</div><div className="mt-1 text-[8px] font-bold text-slate-400">{item.description}</div></div>)}</div></section>

        <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Download className="text-falla-blue"/><div><h3 className="text-sm font-black text-slate-800">Certificados por módulo</h3><p className="text-[9px] font-bold text-slate-400">Conclua todas as fases para emitir e salvar como PDF.</p></div></div><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">{course.modules.map(module => { const complete = module.lessons.length > 0 && module.lessons.every(lesson => progress.completedLessons.includes(lesson.id)); return <button key={module.id} onClick={() => printCertificate(module.id)} className={`flex items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left ${complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}><div><div className="text-[10px] font-black text-slate-700">{module.title}</div><div className="text-[8px] font-bold text-slate-400">{complete ? 'Disponível para emissão' : 'Conclusão pendente'}</div></div>{complete ? <Download size={16} className="text-emerald-600"/> : <LockKeyhole size={16} className="text-slate-400"/>}</button>})}</div></section>

        {!allowed && <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-white/5 via-white/65 to-white p-8"><div className="max-w-sm rounded-3xl border-2 border-falla-blue/20 bg-white p-6 text-center shadow-xl"><LockKeyhole className="mx-auto text-falla-blue"/><h3 className="mt-3 text-lg font-black text-slate-800">Estatísticas avançadas Premium</h3><p className="mt-2 text-xs font-bold text-slate-500">Desbloqueie evolução, módulos, dificuldades, medalhas e certificados.</p><button onClick={onOpenPlans} className="mt-4 rounded-xl bg-falla-blue px-5 py-3 text-[10px] font-black uppercase text-white">Ver planos</button></div></div>}
      </div>
    </div>
  );
}
