import React, { useState, useEffect } from 'react';
import { Course, Question, QuestionType, LearningTip, Achievement, AiTutorConfig } from '../types';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, Trash2, Save, BookOpen, Layers, Check, AlertCircle, 
  Trophy, Sparkles, Smile, MessageSquare, Terminal, HelpCircle, Eye, Settings
} from 'lucide-react';

interface AdminPanelProps {
  courses: Course[];
  onRefreshCourses: () => void;
  learningTips: LearningTip[];
  onRefreshTips: () => void;
  achievements: Achievement[];
  onRefreshAchievements: () => void;
  aiTutorConfig: AiTutorConfig;
  onRefreshAiTutorConfig: () => void;
  interfaceTexts: Record<string, string>;
  onRefreshInterfaceTexts: () => void;
}

export default function AdminPanel({ 
  courses, 
  onRefreshCourses,
  learningTips,
  onRefreshTips,
  achievements,
  onRefreshAchievements,
  aiTutorConfig,
  onRefreshAiTutorConfig,
  interfaceTexts,
  onRefreshInterfaceTexts
}: AdminPanelProps) {
  
  // Inner Admin Tabs
  const [adminTab, setAdminTab] = useState<'courses' | 'mascots' | 'leaderboard' | 'tips' | 'achievements' | 'ai-tutor' | 'interface' | 'sql-blueprint'>('courses');

  const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id || "");
  const [activeModId, setActiveModId] = useState<string>("");
  
  // New Course State
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseLang, setNewCourseLang] = useState<'en' | 'es' | 'pt'>('en');
  const [newCourseFlag, setNewCourseFlag] = useState("🇺🇸");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  // New Lesson State
  const [newLessonId, setNewLessonId] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");
  
  // Temp Questions being made for the new Lesson
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qPrompt, setQPrompt] = useState("");
  const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState<string>("");
  const [qMascot, setQMascot] = useState("Lico");
  const [qHint, setQHint] = useState("");

  const [message, setMessage] = useState<string | null>(null);

  // New Leaderboard Entry State
  const [leadId, setLeadId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadXp, setLeadXp] = useState(100);
  const [leadStreak, setLeadStreak] = useState(5);
  const [leadState, setLeadState] = useState("SP");
  const [leadCountry, setLeadCountry] = useState("🇧🇷 Brasil");
  const [leadAvatar, setLeadAvatar] = useState("🦊");

  // New Mascot State
  const [mascotId, setMascotId] = useState("");
  const [mascotName, setMascotName] = useState("");
  const [mascotImageUrl, setMascotImageUrl] = useState("");
  const [mascotRole, setMascotRole] = useState("");
  const [mascotDescription, setMascotDescription] = useState("");
  const [mascotTrait, setMascotTrait] = useState("");
  const [mascotQuote, setMascotQuote] = useState("");
  const [mascotStyleColor, setMascotStyleColor] = useState("from-blue-400 to-indigo-500");
  const [mascotEmoji, setMascotEmoji] = useState("🐾");

  // Learning Tip State
  const [tipId, setTipId] = useState("");
  const [tipText, setTipText] = useState("");
  const [tipMascotId, setTipMascotId] = useState("lico");

  // Achievement State
  const [achId, setAchId] = useState("");
  const [achTitle, setAchTitle] = useState("");
  const [achDesc, setAchDesc] = useState("");
  const [achEmoji, setAchEmoji] = useState("🏆");
  const [achXp, setAchXp] = useState(150);

  // AI Config State
  const [aiPrompt, setAiPrompt] = useState(aiTutorConfig?.prompt_template || "");
  const [aiDefaultTopic, setAiDefaultTopic] = useState(aiTutorConfig?.default_topic || "");

  // Interface Text State
  const [intKey, setIntKey] = useState("");
  const [intValue, setIntValue] = useState("");

  // Populate AI config on load/refresh
  useEffect(() => {
    if (aiTutorConfig) {
      setAiPrompt(aiTutorConfig.prompt_template);
      setAiDefaultTopic(aiTutorConfig.default_topic);
    }
  }, [aiTutorConfig]);

  const handleCreateLeaderboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !leadName) {
      alert("Preencha o ID e o Nome do competidor.");
      return;
    }

    try {
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          id: leadId,
          name: leadName,
          xp: Number(leadXp),
          streak: Number(leadStreak),
          state: leadState,
          country: leadCountry,
          avatar: leadAvatar
        });

      if (error) throw error;

      setMessage(`Estudante "${leadName}" cadastrado com sucesso no Leaderboard!`);
      setLeadId("");
      setLeadName("");
      setLeadXp(100);
      setLeadStreak(5);
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar estudante no ranking do Supabase: " + (e.message || e));
    }
  };

  const handleDeleteLeaderboard = async (id: string) => {
    if (!confirm(`Excluir competidor "${id}"?`)) return;
    try {
      const { error } = await supabase.from('leaderboard').delete().eq('id', id);
      if (error) throw error;
      setMessage("Competidor excluído com sucesso!");
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const handleCreateMascot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mascotId || !mascotName) {
      alert("Preencha o ID e o Nome do mascote.");
      return;
    }

    try {
      const { error } = await supabase
        .from('mascots')
        .upsert({
          id: mascotId,
          name: mascotName,
          image_url: mascotImageUrl || null,
          role: mascotRole,
          description: mascotDescription || mascotTrait,
          trait: mascotTrait || mascotDescription,
          quote: mascotQuote,
          style_color: mascotStyleColor,
          emoji: mascotEmoji
        });

      if (error) throw error;

      setMessage(`Mascote "${mascotName}" cadastrado com sucesso no Supabase!`);
      setMascotId("");
      setMascotName("");
      setMascotImageUrl("");
      setMascotRole("");
      setMascotDescription("");
      setMascotTrait("");
      setMascotQuote("");
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar mascote no Supabase: " + (e.message || e));
    }
  };

  const handleDeleteMascot = async (id: string) => {
    if (!confirm(`Excluir mascote "${id}" do banco?`)) return;
    try {
      const { error } = await supabase.from('mascots').delete().eq('id', id);
      if (error) throw error;
      setMessage("Mascote excluído com sucesso!");
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      alert("Erro ao excluir mascote: " + e.message);
    }
  };

  const selectedCourse = courses.find(c => c.id === activeCourseId);
  const modules = selectedCourse?.modules || [];

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId || !newCourseName) {
      alert("Preencha o ID e Nome do curso.");
      return;
    }

    const coursePayload = {
      id: newCourseId,
      name: newCourseName,
      language: newCourseLang,
      flag: newCourseFlag,
      description: newCourseDesc,
      modules: [
        {
          id: `${newCourseId}_mod_1`,
          title: "Módulo Principal",
          description: "Primeiros passos no aprendizado.",
          lessons: []
        }
      ]
    };

    try {
      const { error } = await supabase
        .from('courses')
        .upsert({ id: newCourseId, data: coursePayload });

      if (error) throw error;

      setMessage("Curso cadastrado com sucesso! Veja as alterações no menu superior.");
      onRefreshCourses();
      setActiveCourseId(newCourseId);
      setNewCourseId("");
      setNewCourseName("");
      setNewCourseDesc("");
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar curso no Supabase: " + (e.message || e));
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(`Deseja excluir permanentemente o curso "${courseId}"?`)) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      setMessage("Curso excluído com sucesso!");
      onRefreshCourses();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      alert("Erro ao excluir curso: " + e.message);
    }
  };

  const addQuestionToTempList = () => {
    if (!qPrompt || !qCorrect) {
      alert("Por favor, preencha o enunciado e a resposta correta.");
      return;
    }

    const correctAns = qType === QuestionType.SENTENCE_BUILDER 
      ? qCorrect.split(',').map(s => s.trim()) 
      : qCorrect.trim();

    const filteredOptions = qOptions.filter(o => o.trim() !== "");

    const newQ: Question = {
      id: `q_${Date.now()}`,
      type: qType,
      prompt: qPrompt,
      options: filteredOptions.length > 0 ? filteredOptions : undefined,
      correctAnswer: correctAns,
      characterHint: qMascot,
      hintText: qHint
    };

    setQuestions([...questions, newQ]);
    setQPrompt("");
    setQCorrect("");
    setQOptions(["", "", "", ""]);
    setQHint("");
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId || !activeModId) {
      alert("Selecione um Curso e um Módulo.");
      return;
    }
    if (!newLessonId || !newLessonTitle) {
      alert("Preencha o ID e o Título da lição.");
      return;
    }
    if (questions.length === 0) {
      alert("Adicione pelo menos 1 questão à lição.");
      return;
    }

    try {
      const { data: row, error: fetchError } = await supabase
        .from('courses')
        .select('data')
        .eq('id', activeCourseId)
        .single();

      if (fetchError || !row) {
        throw new Error(fetchError?.message || "Curso não encontrado no Supabase.");
      }

      const courseData = row.data as Course;
      if (!courseData) throw new Error("Estrutura do curso está vazia.");

      const mod = courseData.modules?.find(m => m.id === activeModId);
      if (!mod) {
        throw new Error("Módulo não encontrado no curso.");
      }

      const newLesson = {
        id: newLessonId,
        title: newLessonTitle,
        description: newLessonDesc,
        xpReward: 20,
        questions
      };

      if (!mod.lessons) {
        mod.lessons = [];
      }

      const lessonIdx = mod.lessons.findIndex(l => l.id === newLessonId);
      if (lessonIdx !== -1) {
        mod.lessons[lessonIdx] = newLesson;
      } else {
        mod.lessons.push(newLesson);
      }

      const { error: updateError } = await supabase
        .from('courses')
        .update({ data: courseData })
        .eq('id', activeCourseId);

      if (updateError) throw updateError;

      setMessage("Nova lição criada com sucesso! Carregada instantaneamente no aplicativo.");
      onRefreshCourses();
      setNewLessonId("");
      setNewLessonTitle("");
      setNewLessonDesc("");
      setQuestions([]);
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar lição no Supabase: " + (e.message || e));
    }
  };

  const updateOption = (index: number, val: string) => {
    const updated = [...qOptions];
    updated[index] = val;
    setQOptions(updated);
  };

  // Learning Tip Handlers
  const handleSaveTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipId || !tipText) {
      alert("Preencha o ID e o Texto da dica.");
      return;
    }
    try {
      const { error } = await supabase
        .from('learning_tips')
        .upsert({ id: tipId, tip: tipText, mascot_id: tipMascotId });
      if (error) throw error;
      setMessage(`Dica "${tipId}" salva com sucesso!`);
      setTipId("");
      setTipText("");
      onRefreshTips();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar dica: " + err.message);
    }
  };

  const handleDeleteTip = async (id: string) => {
    if (!confirm("Excluir esta dica de aprendizado?")) return;
    try {
      const { error } = await supabase.from('learning_tips').delete().eq('id', id);
      if (error) throw error;
      setMessage("Dica de aprendizado excluída com sucesso!");
      onRefreshTips();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // Achievement Handlers
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achId || !achTitle) {
      alert("Preencha o ID e o Título da conquista.");
      return;
    }
    try {
      const { error } = await supabase
        .from('achievements')
        .upsert({ 
          id: achId, 
          title: achTitle, 
          description: achDesc, 
          emoji: achEmoji, 
          xp_required: Number(achXp) 
        });
      if (error) throw error;
      setMessage(`Conquista "${achTitle}" salva com sucesso!`);
      setAchId("");
      setAchTitle("");
      setAchDesc("");
      onRefreshAchievements();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar conquista: " + err.message);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("Excluir esta conquista?")) return;
    try {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) throw error;
      setMessage("Conquista excluída com sucesso!");
      onRefreshAchievements();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir conquista: " + err.message);
    }
  };

  // AI Config Handler
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ai_tutor_config')
        .upsert({ 
          id: 'main_config', 
          prompt_template: aiPrompt, 
          default_topic: aiDefaultTopic 
        });
      if (error) throw error;
      setMessage("Configuração do Tutor de IA salva com sucesso!");
      onRefreshAiTutorConfig();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar prompt da IA: " + err.message);
    }
  };

  // Interface Text Handlers
  const handleSaveInterfaceText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intKey || !intValue) {
      alert("Preencha a Chave e o Valor do texto de interface.");
      return;
    }
    try {
      const { error } = await supabase
        .from('interface_texts')
        .upsert({ key: intKey, value: intValue });
      if (error) throw error;
      setMessage(`Texto de interface "${intKey}" atualizado!`);
      setIntKey("");
      setIntValue("");
      onRefreshInterfaceTexts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar texto: " + err.message);
    }
  };

  const handleDeleteInterfaceText = async (key: string) => {
    if (!confirm(`Excluir chave de texto "${key}"?`)) return;
    try {
      const { error } = await supabase.from('interface_texts').delete().eq('key', key);
      if (error) throw error;
      setMessage("Texto excluído com sucesso!");
      onRefreshInterfaceTexts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            ⚙️ Painel Multi-Controle Central FALLA
          </h2>
          <p className="text-[10px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wide">
            Administração Completa de Conteúdos, IA e Configurações em Tempo Real
          </p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-200 uppercase self-start">
          Admin Ativo
        </span>
      </div>

      {/* Admin Tab Selectors */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'courses', label: 'Cursos & Lições', icon: BookOpen },
          { id: 'mascots', label: 'Mascotes', icon: Smile },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'tips', label: 'Dicas de Estudo', icon: HelpCircle },
          { id: 'achievements', label: 'Conquistas', icon: Sparkles },
          { id: 'ai-tutor', label: 'Config Tutor IA', icon: Terminal },
          { id: 'interface', label: 'Textos de Interface', icon: MessageSquare },
          { id: 'sql-blueprint', label: 'Blueprint SQL', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 rounded-2xl p-4 text-xs font-black flex items-center gap-2">
          <Check size={16} className="text-falla-green" /> {message}
        </div>
      )}

      {/* ----------------- SUB-TAB: COURSES ----------------- */}
      {adminTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          
          {/* New Course Form */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center justify-between border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-falla-blue" />
                Criar Novo Curso de Idiomas
              </span>
            </h3>
            
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único do Curso</label>
                  <input
                    type="text"
                    placeholder="Ex: fr_basic"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Nome do Curso</label>
                  <input
                    type="text"
                    placeholder="Ex: Francês Descomplicado"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Idioma de Destino</label>
                  <select
                    value={newCourseLang}
                    onChange={(e: any) => {
                      setNewCourseLang(e.target.value);
                      setNewCourseFlag(e.target.value === 'en' ? '🇺🇸' : e.target.value === 'es' ? '🇪🇸' : '🇧🇷');
                    }}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="en">Inglês (en)</option>
                    <option value="es">Espanhol (es)</option>
                    <option value="pt">Português (pt)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Bandeira Emoji</label>
                  <input
                    type="text"
                    value={newCourseFlag}
                    onChange={(e) => setNewCourseFlag(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-center text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição</label>
                <textarea
                  placeholder="Descrição amigável sobre o curso..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-sky-600 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
              >
                <Plus size={14} /> Salvar Curso no Banco
              </button>
            </form>

            {/* Courses list with Delete */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Cursos no Banco</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {courses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold">
                    <span>{c.flag} <strong>{c.name}</strong> ({c.id})</span>
                    <button 
                      onClick={() => handleDeleteCourse(c.id)}
                      className="text-falla-red hover:text-red-700 cursor-pointer"
                      title="Excluir curso"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Lesson Form */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Layers size={14} className="text-falla-green" />
              Adicionar Nova Lição Interativa
            </h3>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Selecione o Curso</label>
                  <select
                    value={activeCourseId}
                    onChange={(e) => {
                      setActiveCourseId(e.target.value);
                      const sel = courses.find(c => c.id === e.target.value);
                      if (sel && sel.modules[0]) {
                        setActiveModId(sel.modules[0].id);
                      }
                    }}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="">Selecione...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Módulo Interno</label>
                  <select
                    value={activeModId}
                    onChange={(e) => setActiveModId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="">Selecione...</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t-2 border-slate-200 pt-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único da Lição</label>
                  <input
                    type="text"
                    placeholder="Ex: en_les_viagem"
                    value={newLessonId}
                    onChange={(e) => setNewLessonId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Título da Lição</label>
                  <input
                    type="text"
                    placeholder="Ex: No Aeroporto"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Questions creator widget */}
              <div className="border-2 border-slate-200 bg-white p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[10px] text-slate-700 uppercase tracking-wide">Add Questão ({questions.length} salvas)</span>
                  <span className="text-[9px] bg-falla-blue/10 text-falla-blue font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Questão Atual</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Estilo Exercício</label>
                    <select
                      value={qType}
                      onChange={(e: any) => setQType(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1 font-black text-slate-700"
                    >
                      <option value={QuestionType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
                      <option value={QuestionType.SENTENCE_BUILDER}>Quebra-Cabeça</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mascote Dica</label>
                    <select
                      value={qMascot}
                      onChange={(e) => setQMascot(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1 font-black text-slate-700"
                    >
                      <option value="Lico">Lico (Livro)</option>
                      <option value="Teddy">Teddy (Urso)</option>
                      <option value="Bia">Bia (Menina)</option>
                      <option value="Luna">Luna (Coruja)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Pergunta</label>
                  <input
                    type="text"
                    placeholder="Como se diz 'Cachorro'?"
                    value={qPrompt}
                    onChange={(e) => setQPrompt(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 font-bold text-slate-700"
                  />
                </div>

                {qType === QuestionType.MULTIPLE_CHOICE ? (
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-500">Opções do Aluno</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {qOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Opção ${idx + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          className="bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 text-center font-bold text-slate-700"
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Resposta Correta Exata</label>
                      <input
                        type="text"
                        placeholder="Ex: Dog"
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        className="w-full bg-falla-blue/10 border border-falla-blue/30 rounded-xl p-1.5 font-black text-falla-blue"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Palavras Avulsas (vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: I, am, a, dog, cat"
                        value={qOptions.join(', ')}
                        onChange={(e) => setQOptions(e.target.value.split(',').map(s => s.trim()))}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Resposta Correta Ordenada</label>
                      <input
                        type="text"
                        placeholder="Ex: I, am, a, dog"
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        className="w-full bg-falla-blue/10 border border-falla-blue/30 rounded-xl p-1.5 font-black text-falla-blue"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mensagem do Mascote</label>
                  <input
                    type="text"
                    placeholder="Dica para a criança..."
                    value={qHint}
                    onChange={(e) => setQHint(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 font-bold text-slate-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={addQuestionToTempList}
                  className="w-full bg-falla-pink hover:bg-falla-pink/90 text-white font-black py-1.5 rounded-xl text-[9px] cursor-pointer uppercase tracking-wider"
                >
                  + Validar e Adicionar Questão
                </button>
              </div>

              {questions.length > 0 && (
                <div className="space-y-1 bg-white border-2 border-slate-200 rounded-xl p-2.5 max-h-24 overflow-y-auto">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] font-bold text-slate-600 bg-slate-50 p-1 rounded border border-slate-150">
                      <span>{idx + 1}. {q.prompt} ({q.type})</span>
                      <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== idx))} className="text-falla-red hover:text-red-700">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={questions.length === 0}
                className={`w-full font-black py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 uppercase text-xs ${
                  questions.length === 0 
                    ? 'bg-slate-250 text-slate-400 cursor-not-allowed' 
                    : 'bg-falla-green hover:bg-falla-green/90 text-white border-b-4 border-b-green-700 active:translate-y-0.5'
                }`}
              >
                <Save size={14} /> Salvar Lição Completa
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ----------------- SUB-TAB: MASCOTS ----------------- */}
      {adminTab === 'mascots' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <span>🦁</span> Criar ou Atualizar Mascote
            </h3>
            <form onSubmit={handleCreateMascot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único</label>
                  <input
                    type="text"
                    placeholder="Ex: lico"
                    value={mascotId}
                    onChange={(e) => setMascotId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Lico (O Livro Tagarela)"
                    value={mascotName}
                    onChange={(e) => setMascotName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Papel / Função</label>
                  <input
                    type="text"
                    placeholder="Ex: Guia Principal"
                    value={mascotRole}
                    onChange={(e) => setMascotRole(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Emoji</label>
                  <input
                    type="text"
                    placeholder="Ex: 📖"
                    value={mascotEmoji}
                    onChange={(e) => setMascotEmoji(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Cores do Estilo (Tailwind)</label>
                  <input
                    type="text"
                    placeholder="Ex: from-blue-400 to-indigo-500"
                    value={mascotStyleColor}
                    onChange={(e) => setMascotStyleColor(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">URL da Imagem</label>
                  <input
                    type="text"
                    placeholder="Ex: lico_mascot_123.jpg"
                    value={mascotImageUrl}
                    onChange={(e) => setMascotImageUrl(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Traço Marcante</label>
                  <input
                    type="text"
                    placeholder="Ex: Sábio, curioso..."
                    value={mascotTrait}
                    onChange={(e) => setMascotTrait(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Detalhes do mascote..."
                    value={mascotDescription}
                    onChange={(e) => setMascotDescription(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Frase Marcante</label>
                <textarea
                  placeholder="Cada página lida é um novo mundo descoberto!..."
                  value={mascotQuote}
                  onChange={(e) => setMascotQuote(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-12"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 uppercase"
              >
                <Plus size={14} /> Salvar Mascote no Banco
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Mascotes Cadastrados (Clique para carregar/editar)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {[
                { id: "lico", name: "Lico", emoji: "📖" },
                { id: "teddy", name: "Teddy", emoji: "🧸" },
                { id: "luna", name: "Luna", emoji: "🦉" },
                { id: "pip", name: "Pip", emoji: "✏️" },
                { id: "estrela", name: "Estrela", emoji: "⭐" },
                { id: "tictac", name: "Tictac", emoji: "⏰" },
                { id: "guga", name: "Guga", emoji: "👦" },
                { id: "bia", name: "Bia", emoji: "👧" },
                { id: "pingo", name: "Pingo", emoji: "🐧" },
                { id: "kiko", name: "Kiko", emoji: "🐒" }
              ].map(m => (
                <div 
                  key={m.id} 
                  className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] font-black hover:bg-sky-50/50 cursor-pointer transition-all"
                  onClick={() => {
                    setMascotId(m.id);
                    setMascotName(m.name);
                    setMascotEmoji(m.emoji);
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{m.emoji}</span>
                    <span>{m.name} ({m.id})</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMascot(m.id);
                    }}
                    className="text-falla-red hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: LEADERBOARD ----------------- */}
      {adminTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Trophy size={14} className="text-falla-yellow inline-block mr-1" /> Criar/Atualizar Competidor no Ranking
            </h3>
            <form onSubmit={handleCreateLeaderboard} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único do Estudante</label>
                  <input
                    type="text"
                    placeholder="Ex: student_99"
                    value={leadId}
                    onChange={(e) => setTipId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    placeholder="Ex: Davi"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">XP Total</label>
                  <input
                    type="number"
                    value={leadXp}
                    onChange={(e) => setLeadXp(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Streak (Dias)</label>
                  <input
                    type="number"
                    value={leadStreak}
                    onChange={(e) => setLeadStreak(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: SP"
                    value={leadState}
                    onChange={(e) => setLeadState(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">País</label>
                  <input
                    type="text"
                    placeholder="Ex: 🇧🇷 Brasil"
                    value={leadCountry}
                    onChange={(e) => setLeadCountry(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Avatar Emoji</label>
                  <input
                    type="text"
                    placeholder="Ex: 🦊"
                    value={leadAvatar}
                    onChange={(e) => setLeadAvatar(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-green-700 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Trophy size={14} /> Salvar Competidor
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Competidores Cadastrados no Banco
            </h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">A classificação é carregada dinamicamente pelo app no widget da liga!</p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {[
                { id: "lead_1", name: "Davi", xp: 1240, avatar: "🦊" },
                { id: "lead_2", name: "Alice", xp: 1100, avatar: "🐼" },
                { id: "lead_3", name: "Gabriel", xp: 950, avatar: "🐸" },
                { id: "lead_4", name: "Lucas", xp: 870, avatar: "🐯" }
              ].map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span>{entry.avatar}</span>
                    <span><strong>{entry.name}</strong> - {entry.xp} XP</span>
                  </span>
                  <button 
                    onClick={() => handleDeleteLeaderboard(entry.id)}
                    className="text-falla-red hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: TIPS ----------------- */}
      {adminTab === 'tips' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <HelpCircle size={14} className="text-falla-blue inline-block mr-1" /> Criar ou Atualizar Dica de Aprendizado
            </h3>
            
            <form onSubmit={handleSaveTip} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único da Dica</label>
                  <input
                    type="text"
                    placeholder="Ex: tip_neuro"
                    value={tipId}
                    onChange={(e) => setTipId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Mascote Conselheiro</label>
                  <select
                    value={tipMascotId}
                    onChange={(e) => setTipMascotId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="lico">Lico (O Livro)</option>
                    <option value="teddy">Teddy (O Urso)</option>
                    <option value="luna">Luna (A Coruja)</option>
                    <option value="pingo">Pingo (O Pinguim)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Texto da Dica didática</label>
                <textarea
                  placeholder="Sabia que o cérebro das crianças absorve fonemas mais rápido?..."
                  value={tipText}
                  onChange={(e) => setTipText(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Salvar Dica no Banco
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Dicas Cadastradas ({learningTips.length})
            </h4>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {learningTips.map(t => (
                <div key={t.id} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold space-y-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-black text-falla-blue uppercase tracking-wide">Dica: {t.id} (Mascote: {t.mascot_id})</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setTipId(t.id);
                          setTipText(t.tip);
                          setTipMascotId(t.mascot_id || 'lico');
                        }}
                        className="text-falla-blue hover:text-sky-800 font-bold"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteTip(t.id)}
                        className="text-falla-red hover:text-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: ACHIEVEMENTS ----------------- */}
      {adminTab === 'achievements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Sparkles size={14} className="text-falla-yellow inline-block mr-1" /> Criar/Atualizar Conquista (Achievement)
            </h3>
            
            <form onSubmit={handleSaveAchievement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único da Conquista</label>
                  <input
                    type="text"
                    placeholder="Ex: ach_pioneiro"
                    value={achId}
                    onChange={(e) => setAchId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Emoji</label>
                  <input
                    type="text"
                    placeholder="Ex: 🌱"
                    value={achEmoji}
                    onChange={(e) => setAchEmoji(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Título</label>
                  <input
                    type="text"
                    placeholder="Ex: Primeiro Passo"
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">XP Necessário para Liberar</label>
                  <input
                    type="number"
                    value={achXp}
                    onChange={(e) => setAchXp(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição</label>
                <textarea
                  placeholder="Ex: Alcance 150 XP para provar seu empenho inicial..."
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Salvar Conquista no Banco
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Conquistas Cadastradas ({achievements.length})
            </h4>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {achievements.map(ach => (
                <div key={ach.id} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold flex items-start gap-2.5">
                  <span className="text-xl p-1.5 bg-slate-50 rounded-lg">{ach.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800">{ach.title} ({ach.id})</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => {
                            setAchId(ach.id);
                            setAchTitle(ach.title);
                            setAchDesc(ach.description);
                            setAchEmoji(ach.emoji);
                            setAchXp(ach.xp_required);
                          }}
                          className="text-falla-blue hover:text-sky-800"
                        >
                          Editar
                        </button>
                        <button onClick={() => handleDeleteAchievement(ach.id)} className="text-falla-red hover:text-red-700">
                          Excluir
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 mt-0.5 font-medium">{ach.description}</p>
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block">Requisito: {ach.xp_required} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: AI TUTOR CONFIG ----------------- */}
      {adminTab === 'ai-tutor' && (
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4 animate-fade-in max-w-3xl mx-auto">
          <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
            <Terminal size={14} className="text-falla-blue inline-block mr-1" /> Ajustar Mecanismo e Prompt do Tutor de IA
          </h3>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Configure as diretrizes gerais que guiam a criação de lições pela inteligência artificial. O prompt será encaminhado dinamicamente para o modelo do Gemini, assegurando comportamento estrito sem alterar um único arquivo de código.
          </p>

          <form onSubmit={handleSaveAiConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">Tema Padrão Inicial</label>
              <input
                type="text"
                placeholder="Ex: Pedindo uma pizza"
                value={aiDefaultTopic}
                onChange={(e) => setAiDefaultTopic(e.target.value)}
                className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">Prompt de Instrução Estrito (System Instruction)</label>
              <textarea
                placeholder="Insira as diretrizes para a IA..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-white border-2 border-slate-250 rounded-xl p-2.5 font-bold h-36 font-mono text-[9px] leading-relaxed text-slate-700"
              />
              <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase tracking-wide">
                Dica: Use as tags {"{topic}"} e {"{language}"} para que a IA saiba onde injetar as escolhas dinâmicas do aluno!
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2.5 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1.5"
            >
              <Save size={14} /> Salvar Instruções da IA no Banco
            </button>
          </form>
        </div>
      )}

      {/* ----------------- SUB-TAB: INTERFACE TEXTS ----------------- */}
      {adminTab === 'interface' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <MessageSquare size={14} className="text-falla-blue inline-block mr-1" /> Cadastrar / Editar Textos de Interface
            </h3>
            
            <form onSubmit={handleSaveInterfaceText} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Chave da Interface (Chave Única)</label>
                <input
                  type="text"
                  placeholder="Ex: app_badge ou app_footer"
                  value={intKey}
                  onChange={(e) => setIntKey(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Valor / Conteúdo textual</label>
                <textarea
                  placeholder="Digite o texto que deve substituir a versão estática do app..."
                  value={intValue}
                  onChange={(e) => setIntValue(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Atualizar Texto da Interface
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Chaves Personalizadas no Banco
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {Object.entries(interfaceTexts).map(([key, value]) => (
                <div key={key} className="p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                    <span className="font-black text-falla-green">Chave: <strong>{key}</strong></span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setIntKey(key);
                          setIntValue(value);
                        }}
                        className="text-falla-blue hover:text-sky-800 font-bold"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteInterfaceText(key)}
                        className="text-falla-red hover:text-red-700"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 font-bold italic">"{value}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: BLUEPRINT SQL ----------------- */}
      {adminTab === 'sql-blueprint' && (
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4 animate-fade-in max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Terminal size={14} className="text-indigo-600" />
              Script DDL e RLS para o Supabase SQL Editor
            </h3>
            <span className="text-[8px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-black uppercase">PostgreSQL</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Execute os comandos abaixo diretamente no menu <strong>SQL Editor</strong> do seu painel do Supabase para inicializar as tabelas adicionais e configurar as políticas de segurança de leitura pública e escrita controlada:
          </p>

          <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-[9px] leading-relaxed select-all">
            {`-- 1. Table: courses (Verify / Create)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- 2. Table: mascots (Verify / Create)
CREATE TABLE IF NOT EXISTS mascots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  role TEXT,
  description TEXT,
  trait TEXT,
  quote TEXT,
  style_color TEXT,
  emoji TEXT
);

-- 3. Table: leaderboard (Verify / Create)
CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  state TEXT,
  country TEXT,
  avatar TEXT
);

-- 4. Table: learning_tips (New!)
CREATE TABLE IF NOT EXISTS learning_tips (
  id TEXT PRIMARY KEY,
  tip TEXT NOT NULL,
  mascot_id TEXT
);

-- 5. Table: achievements (New!)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  xp_required INTEGER NOT NULL DEFAULT 0
);

-- 6. Table: ai_tutor_config (New!)
CREATE TABLE IF NOT EXISTS ai_tutor_config (
  id TEXT PRIMARY KEY DEFAULT 'main_config',
  prompt_template TEXT NOT NULL,
  default_topic TEXT NOT NULL
);

-- 7. Table: interface_texts (New!)
CREATE TABLE IF NOT EXISTS interface_texts (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE interface_texts ENABLE ROW LEVEL SECURITY;

-- Enable Anonymous Public Read policies
CREATE POLICY "Public Read on courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public Read on mascots" ON mascots FOR SELECT USING (true);
CREATE POLICY "Public Read on leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public Read on learning_tips" ON learning_tips FOR SELECT USING (true);
CREATE POLICY "Public Read on achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public Read on ai_tutor_config" ON ai_tutor_config FOR SELECT USING (true);
CREATE POLICY "Public Read on interface_texts" ON interface_texts FOR SELECT USING (true);

-- Enable Write Policies for all (Allows Admin panel to write securely)
CREATE POLICY "Write access on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on mascots" ON mascots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on leaderboard" ON leaderboard FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on learning_tips" ON learning_tips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on ai_tutor_config" ON ai_tutor_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on interface_texts" ON interface_texts FOR ALL USING (true) WITH CHECK (true);`}
          </div>
          <p className="text-[9px] text-slate-400 font-bold italic leading-relaxed">
            Dica: No ambiente de produção, substitua "USING (true) WITH CHECK (true)" por "USING (auth.uid() IS NOT NULL)" ou restrinja o acesso de escrita por IP / Role de Administrador para maior segurança cibernética corporativa.
          </p>
        </div>
      )}

    </div>
  );
}
