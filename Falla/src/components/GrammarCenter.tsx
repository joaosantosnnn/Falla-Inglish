import React, { useState } from 'react';
import { GrammarLesson } from '../data/grammarLessons';
import { Lesson } from '../types';
import { BookOpen, ChevronRight, ArrowLeft, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';

interface GrammarCenterProps {
  topics: GrammarLesson[];
  completedLessons: string[];
  onPractice: (lesson: Lesson) => void;
}

export default function GrammarCenter({ topics, completedLessons, onPractice }: GrammarCenterProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || null;

  const handlePractice = (topic: GrammarLesson) => {
    const lessonFromTopic: Lesson = {
      id: topic.id,
      title: topic.topic,
      description: topic.explanation.slice(0, 90) + (topic.explanation.length > 90 ? '...' : ''),
      xpReward: topic.xpReward,
      questions: topic.exercises,
    };
    onPractice(lessonFromTopic);
  };

  // ==========================================================================
  // VIEW: Detalhe de um tópico (explicação + exemplos + botão praticar)
  // ==========================================================================
  if (selectedTopic) {
    const isCompleted = completedLessons.includes(selectedTopic.id);
    return (
      <div className="animate-fade-in space-y-5 max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedTopicId(null)}
          className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Voltar para Gramática
        </button>

        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-sky-100 text-falla-blue rounded-2xl flex items-center justify-center shadow-2xs">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedTopic.topic}</h2>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-falla-green/10 text-falla-green font-black px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                  <CheckCircle2 size={11} /> Praticado
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {selectedTopic.explanation}
          </p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-falla-yellow" />
            Exemplos
          </h3>
          <div className="space-y-2.5">
            {selectedTopic.examples.map((ex, idx) => {
              const [english, portuguese] = ex.split(' — ');
              return (
                <div key={idx} className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5">
                  <p className="text-sm font-black text-slate-800">{english}</p>
                  {portuguese && (
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{portuguese}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => handlePractice(selectedTopic)}
          className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black text-sm py-4 rounded-2xl shadow-sm border-b-4 border-b-green-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Praticar Agora
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: Grade de tópicos
  // ==========================================================================
  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <BookOpen size={20} className="text-falla-blue" />
          Aulas de Gramática
        </h2>
        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
          Entenda as regras por trás das frases, com exemplos e exercícios de fixação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((topic) => {
          const isCompleted = completedLessons.includes(topic.id);
          return (
            <div
              key={topic.id}
              onClick={() => setSelectedTopicId(topic.id)}
              className={`bg-white border-2 rounded-3xl p-5 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 card-bouncy ${
                isCompleted ? 'border-falla-green/50' : 'border-slate-200 hover:border-falla-blue'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-sky-100 text-falla-blue rounded-2xl flex items-center justify-center shadow-2xs">
                  <GraduationCap size={20} />
                </div>
                {isCompleted && (
                  <span className="text-[9px] bg-falla-green text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                    ✔ Praticado
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-slate-800">{topic.topic}</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal line-clamp-2">
                {topic.explanation}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-black text-falla-blue mt-3">
                Ver aula
                <ChevronRight size={12} />
              </div>
            </div>
          );
        })}
      </div>

      {topics.length === 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center">
          <p className="text-slate-500 text-xs font-bold">Novas aulas de gramática chegando em breve!</p>
        </div>
      )}
    </div>
  );
}
