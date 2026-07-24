import React, { useEffect, useState } from 'react';
import { Check, Globe2, Loader2, Power, RefreshCw } from 'lucide-react';
import { Course } from '../types';
import { supabase } from '../lib/supabaseClient';
import { saveCourseAvailabilityCache } from '../services/languageAvailability';

interface LanguageAvailabilityAdminProps {
  onRefreshCourses: () => void;
}

export default function LanguageAvailabilityAdmin({ onRefreshCourses }: LanguageAvailabilityAdminProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, data')
        .order('id', { ascending: true });
      if (error) throw error;

      const loaded = (data || [])
        .map((row: any) => row?.data as Course)
        .filter((course: Course | undefined): course is Course => Boolean(course?.id));

      setCourses(loaded);
      saveCourseAvailabilityCache(loaded);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível carregar os idiomas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const toggleCourse = async (course: Course) => {
    const nextActive = course.active === false;
    const enabledCountBeforeChange = courses.filter(item => item.active !== false).length;
    if (!nextActive && enabledCountBeforeChange <= 1) {
      setErrorMessage('Mantenha pelo menos um idioma ativo para que os usuários possam estudar.');
      return;
    }
    setSavingId(course.id);
    setMessage(null);
    setErrorMessage(null);

    try {
      const updatedCourse: Course = { ...course, active: nextActive };
      const { error } = await supabase
        .from('courses')
        .update({ data: updatedCourse })
        .eq('id', course.id);
      if (error) throw error;

      const updatedCourses = courses.map(item => item.id === course.id ? updatedCourse : item);
      setCourses(updatedCourses);
      saveCourseAvailabilityCache(updatedCourses);
      onRefreshCourses();
      setMessage(`${course.name} foi ${nextActive ? 'liberado' : 'ocultado'} para os usuários.`);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível alterar a disponibilidade.');
    } finally {
      setSavingId(null);
    }
  };

  const enabledCount = courses.filter(course => course.active !== false).length;

  return (
    <section className="space-y-5 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border-2 border-indigo-200 rounded-3xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Globe2 size={20} className="text-indigo-600" /> Disponibilidade dos idiomas
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Desative idiomas que ainda estão em produção. Cursos desativados continuam salvos no Supabase e visíveis no painel, mas não aparecem para os alunos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadCourses()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-indigo-200 text-indigo-700 text-xs font-black hover:bg-indigo-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 rounded-2xl p-4 text-xs font-black flex items-center gap-2">
          <Check size={16} /> {message}
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 rounded-2xl p-4 text-xs font-black">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3">
        <span className="text-xs font-black text-slate-600">Idiomas liberados aos usuários</span>
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">{enabledCount} de {courses.length}</span>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 flex items-center justify-center gap-3 text-slate-500 text-xs font-black">
          <Loader2 size={18} className="animate-spin" /> Carregando idiomas...
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-xs font-bold text-slate-500">
          Nenhum curso foi encontrado no Supabase.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => {
            const active = course.active !== false;
            const saving = savingId === course.id;
            return (
              <article key={course.id} className={`rounded-3xl border-2 p-5 transition-all ${active ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-4xl bg-white border-2 border-slate-200 rounded-2xl p-2">{course.flag || '🌐'}</span>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-800 truncate">{course.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{course.id} • {course.language}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleCourse(course)}
                    disabled={saving}
                    aria-pressed={active}
                    className={`relative w-16 h-9 rounded-full border-2 transition-all disabled:opacity-60 ${active ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'}`}
                    title={active ? 'Desativar para usuários' : 'Ativar para usuários'}
                  >
                    <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all flex items-center justify-center ${active ? 'left-8' : 'left-1'}`}>
                      {saving ? <Loader2 size={12} className="animate-spin text-slate-500" /> : <Power size={12} className={active ? 'text-emerald-600' : 'text-slate-500'} />}
                    </span>
                  </button>
                </div>

                <div className={`mt-4 rounded-2xl px-3 py-2 text-[11px] font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {active ? 'Disponível no aplicativo' : 'Oculto para os usuários — conteúdo preservado'}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-[11px] font-bold text-amber-800 leading-relaxed">
        Mantenha ao menos um idioma ativo. Para o lançamento atual, deixe somente o curso de inglês liberado e desative espanhol, português e os demais cursos em produção.
      </div>
    </section>
  );
}
