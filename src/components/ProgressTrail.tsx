import React from 'react';
import { Course, Lesson, UserProgress } from '../types';
import { motion } from 'motion/react';
import { Check, Lock, Star, Play } from 'lucide-react';
import ModuleBannerDisplay from './ModuleBannerDisplay';

interface ProgressTrailProps {
  selectedCourse: Course;
  userProgress: UserProgress;
  onStartLesson: (lesson: Lesson) => void;
}

export default function ProgressTrail({
  selectedCourse,
  userProgress,
  onStartLesson,
}: ProgressTrailProps) {
  // Flatten all lessons across all modules to determine the global sequence and indices
  const allCourseLessons = selectedCourse.modules.flatMap((m) => m.lessons);

  // The active lesson is the first uncompleted lesson
  const activeLessonIndex = allCourseLessons.findIndex(
    (l) => !userProgress.completedLessons.includes(l.id)
  );

  // Check if a lesson is unlocked
  const isLessonUnlocked = (lessonId: string, globalIndex: number) => {
    if (globalIndex === 0) return true;
    const prevLesson = allCourseLessons[globalIndex - 1];
    return userProgress.completedLessons.includes(prevLesson.id);
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4 relative select-none">
      {/* Decorative vertical connection track (centered behind the zigzag nodes) */}
      <div className="absolute left-1/2 top-10 bottom-20 w-2 bg-slate-200 -translate-x-1/2 rounded-full pointer-events-none" />

      {/* Course modules */}
      {selectedCourse.modules.map((mod, modIdx) => {
        // Find lessons in this module and their global index
        const moduleLessons = mod.lessons;

        return (
          <div key={mod.id} className="mb-12 relative z-10">
            {/* Elegant Module/Unit Banner (Duolingo Style) */}
            <div 
              className="text-white rounded-3xl p-5 shadow-md border-b-4 mb-8 transform hover:scale-[1.01] transition-transform"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))',
                borderBottomColor: 'var(--theme-primary-dark)'
              }}
            >
              <ModuleBannerDisplay moduleId={mod.id} title={mod.title} />
              {mod.mascotUrl && (
                <img
                  src={mod.mascotUrl}
                  alt={`Mascote de ${mod.title}`}
                  className="absolute right-3 top-3 h-16 w-16 rounded-2xl bg-white/85 object-contain p-1 shadow-md"
                  loading="lazy"
                />
              )}
              <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/15">
                Módulo {modIdx + 1}
              </span>
              <h3 className="font-black text-sm text-white mt-2 tracking-tight">
                {mod.title}
              </h3>
              <p className="text-[10px] text-white/90 font-bold mt-1 uppercase tracking-wider">
                {mod.description}
              </p>
            </div>

            {/* Zigzag nodes container */}
            <div className="flex flex-col items-center relative py-2">
              {moduleLessons.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic bg-white/80 border-2 border-slate-200 rounded-2xl px-4 py-2 text-center">
                  Nenhuma lição disponível neste módulo.
                </p>
              ) : (
                moduleLessons.map((les) => {
                  // Find the global index of this lesson
                  const globalIndex = allCourseLessons.findIndex((l) => l.id === les.id);
                  const isCompleted = userProgress.completedLessons.includes(les.id);
                  const isUnlocked = isLessonUnlocked(les.id, globalIndex);
                  const isActive = globalIndex === activeLessonIndex;
                  // Fases antigas concluídas recebem 1 estrela como estado inicial.
                  // Novas tentativas registram de 0 a 3 conforme a porcentagem de acertos.
                  const lessonStars = Math.max(0, Math.min(3, userProgress.lessonStars?.[les.id] ?? (isCompleted ? 1 : 0)));

                  // Zigzag offsets (sine-like cycle: center, right, center, left)
                  const positionMod = globalIndex % 4;
                  let offsetXClass = 'translate-x-0';
                  if (positionMod === 1) {
                    offsetXClass = 'translate-x-8 md:translate-x-14';
                  } else if (positionMod === 3) {
                    offsetXClass = '-translate-x-8 md:-translate-x-14';
                  }

                  return (
                    <div
                      key={les.id}
                      className={`flex flex-col items-center justify-center my-6 relative transition-transform duration-300 ${offsetXClass}`}
                    >
                      {/* Active lesson tooltip/bubble */}
                      {isActive && (
                        <div 
                          className="absolute -top-12 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-md border-b-2 animate-bounce z-20 flex items-center gap-1"
                          style={{
                            backgroundColor: 'var(--theme-primary)',
                            borderBottomColor: 'var(--theme-primary-dark)'
                          }}
                        >
                          <Play size={10} fill="currentColor" /> Começar!
                          {/* Triangle arrow */}
                          <div 
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b" 
                            style={{
                              backgroundColor: 'var(--theme-primary)',
                              borderRightColor: 'var(--theme-primary-dark)',
                              borderBottomColor: 'var(--theme-primary-dark)'
                            }}
                          />
                        </div>
                      )}

                      {/* Animated Node Circle Container */}
                      <div className="relative">
                        {/* Pulse effect for current active lesson */}
                        {isActive && (
                          <div 
                            className="absolute -inset-3 rounded-full animate-ping pointer-events-none" 
                            style={{
                              backgroundColor: 'var(--theme-primary-light)'
                            }}
                          />
                        )}
                        {isActive && (
                          <div 
                            className="absolute -inset-2 rounded-full border-4 border-dashed animate-spin-slow pointer-events-none" 
                            style={{
                              borderColor: 'var(--theme-primary)'
                            }}
                          />
                        )}

                        {/* Actual Node Button */}
                        <button
                          onClick={() => {
                            if (isUnlocked) {
                              onStartLesson(les);
                            }
                          }}
                          disabled={!isUnlocked}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md relative border-b-6 outline-none hover:scale-105 active:scale-95 ${
                            isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                          }`}
                          style={{
                            backgroundColor: isCompleted
                              ? 'var(--theme-primary)'
                              : isActive
                              ? 'var(--theme-primary)'
                              : isUnlocked
                              ? 'var(--theme-accent)'
                              : 'var(--theme-muted)',
                            borderBottomColor: isCompleted
                              ? 'var(--theme-primary-dark)'
                              : isActive
                              ? 'var(--theme-primary-dark)'
                              : isUnlocked
                              ? 'var(--theme-primary-dark)'
                              : '#cbd5e1',
                            boxShadow: isCompleted
                              ? '0 0 0 5px color-mix(in srgb, var(--theme-primary) 18%, transparent), 0 8px 20px color-mix(in srgb, var(--theme-primary) 30%, transparent)'
                              : isActive
                              ? '0 0 0 6px var(--theme-primary-light)'
                              : undefined,
                            color: '#ffffff'
                          }}
                          title={les.title}
                        >
                          {isCompleted ? (
                            <Check size={24} strokeWidth={3.5} />
                          ) : isActive ? (
                            <Star size={24} fill="currentColor" strokeWidth={2.5} className="animate-pulse" />
                          ) : isUnlocked ? (
                            <Play size={22} fill="currentColor" strokeWidth={1} className="ml-1" />
                          ) : (
                            <Lock size={20} strokeWidth={2.5} />
                          )}
                        </button>
                      </div>

                      {/* Lesson Persistent Label */}
                      <div className="mt-3 text-center max-w-[130px]">
                        <p
                          className={`text-[11px] font-black uppercase tracking-tight leading-tight ${
                            isUnlocked ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          {les.title}
                        </p>
                        {isCompleted ? (
                          <div className="mt-1.5 flex items-center justify-center gap-0.5" aria-label={`${lessonStars} de 3 estrelas`}>
                            {[1, 2, 3].map((starNumber) => (
                              <Star
                                key={starNumber}
                                size={13}
                                strokeWidth={2.5}
                                fill={starNumber <= lessonStars ? 'var(--theme-primary)' : 'transparent'}
                                style={{
                                  color: starNumber <= lessonStars ? 'var(--theme-primary)' : 'var(--theme-muted)',
                                  filter: starNumber <= lessonStars
                                    ? 'drop-shadow(0 0 4px color-mix(in srgb, var(--theme-primary) 55%, transparent))'
                                    : 'none'
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {isUnlocked ? 'Jogar' : 'Bloqueada'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
