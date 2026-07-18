import React, { useEffect, useState } from 'react';
import chicoMascot from './assets/images/chico_mascot.jpg';
import { Course, Lesson, UserProgress, API_BASE_URL, LearningTip, Achievement, AiTutorConfig } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { fallbackCourses } from './lib/fallbackCourses';
import LessonPlayer from './components/LessonPlayer';
import Leaderboard from './components/Leaderboard';
import MascotCard from './components/MascotCard';
import AdminPanel from './components/AdminPanel';
import ArchitectureCenter from './components/ArchitectureCenter';
import { 
  BookOpen, Trophy, Sparkles, Award, User, Flame, Settings, 
  ChevronRight, Brain, Globe, MessageSquare, AlertCircle, Plus,
  LogOut, Lock, Mail, KeyRound, ArrowLeft, LogIn
} from 'lucide-react';

const fallbackLearningTips: LearningTip[] = [
  { id: "tip_1", tip: "Sabia que o cérebro das crianças absorve novos fonemas até 2x mais rápido que o dos adultos? Nossos mascotes foram pensados para tornar esse processo super divertido!", mascot_id: "lico" },
  { id: "tip_2", tip: "Estudar 5 minutos por dia é muito melhor do que estudar 1 hora uma vez por semana. A constância ativa a memória de longo prazo!", mascot_id: "luna" },
  { id: "tip_3", tip: "Tente repetir as palavras em voz alta enquanto joga. A pronúncia ativa áreas motoras do cérebro, acelerando a fixação!", mascot_id: "pingo" },
  { id: "tip_4", tip: "Não tenha medo de errar! O erro é o melhor atalho para o aprendizado e nos mostra onde precisamos focar mais.", mascot_id: "teddy" }
];

const fallbackAchievements: Achievement[] = [
  { id: "ach_1", title: "Primeiros Passos", description: "Alcance 150 XP acumulados para provar seu empenho inicial.", emoji: "🌱", xp_required: 150 },
  { id: "ach_2", title: "Guerreiro de Idiomas", description: "Acumule 500 XP e domine o vocabulário básico.", emoji: "⚔️", xp_required: 500 },
  { id: "ach_3", title: "Estudante de Elite", description: "Alcance o nível avançado acumulando 1000 XP.", emoji: "👑", xp_required: 1000 }
];

const defaultInterfaceTexts: Record<string, string> = {
  app_badge: "Protótipo High-Fidelity",
  app_footer: "FALLA App Co. © 2026. Feito com tecnologia React Native e IA para democratizar o aprendizado de idiomas de forma divertida.",
  ai_tutor_welcome: "Digite qualquer tema que venha à sua cabeça (ex: \"comprar frutas na feira\", \"jogando futebol no parque\", \"viagem espacial\") e nossa IA gerará uma lição interativa e jogável completa e personalizada em segundos!"
};

const defaultAiTutorConfig: AiTutorConfig = {
  id: "main_config",
  prompt_template: "Você é um professor de idiomas amigável para crianças. Gere uma lição sobre {topic} no idioma {language} no formato JSON especificado.",
  default_topic: "Pedir uma pizza"
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'mascots' | 'admin' | 'architecture' | 'ai-tutor'>('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('falla_is_logged_in') === 'true';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('falla_user_name') || 'João';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('falla_user_email') || 'joao@falla.com';
  });
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover'>('login');
  
  // Auth Form Fields
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formState, setFormState] = useState('SP');
  const [formCountry, setFormCountry] = useState('Brasil 🇧🇷');
  
  // Auth Messages
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Selected course and active lesson states
  const [selectedCourseId, setSelectedCourseId] = useState<string>("en_basic");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // User stats state
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('falla_user_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.coins === undefined) parsed.coins = 50;
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return {
      xp: 0,
      streak: 0,
      level: 1,
      lives: 5,
      completedLessons: [],
      currentCourseId: "en_basic",
      state: localStorage.getItem('falla_user_state') || "SP",
      country: localStorage.getItem('falla_user_country') || "Brasil 🇧🇷",
      coins: 50
    };
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('falla_user_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  // AI custom lesson generator states
  const [customTopic, setCustomTopic] = useState("");
  const [customLang, setCustomLang] = useState<'en' | 'es' | 'pt'>('en');
  const [generatingAiLesson, setGeneratingAiLesson] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Dynamic Content States from Supabase
  const [learningTips, setLearningTips] = useState<LearningTip[]>(fallbackLearningTips);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>(fallbackAchievements);
  const [aiTutorConfig, setAiTutorConfig] = useState<AiTutorConfig>(defaultAiTutorConfig);
  const [interfaceTexts, setInterfaceTexts] = useState<Record<string, string>>(defaultInterfaceTexts);


  const fetchLearningTips = async () => {
    try {
      const { data, error } = await supabase.from('learning_tips').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setLearningTips(data);
      }
    } catch (e) {
      console.warn("Erro ao carregar dicas do Supabase:", e);
    }
  };

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase.from('achievements').select('*').order('xp_required', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setAchievements(data);
      }
    } catch (e) {
      console.warn("Erro ao carregar conquistas do Supabase:", e);
    }
  };

  const fetchAiTutorConfig = async () => {
    try {
      const { data, error } = await supabase.from('ai_tutor_config').select('*').eq('id', 'main_config').single();
      if (error) throw error;
      if (data) {
        setAiTutorConfig(data);
      }
    } catch (e) {
      console.warn("Erro ao carregar prompt da IA do Supabase:", e);
    }
  };

  const fetchInterfaceTexts = async () => {
    try {
      const { data, error } = await supabase.from('interface_texts').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const textMap: Record<string, string> = { ...defaultInterfaceTexts };
        data.forEach((row: any) => {
          textMap[row.key] = row.value;
        });
        setInterfaceTexts(textMap);
      }
    } catch (e) {
      console.warn("Erro ao carregar textos da interface do Supabase:", e);
    }
  };

  const fetchCourses = async () => {
    try {
      // Race fetch from Supabase against a 4-second timeout to prevent getting stuck
      const fetchPromise = supabase.from('courses').select('data');
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout de conexão")), 4000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const mappedCourses = data.map((row: any) => row.data as Course);
        setCourses(mappedCourses);
      } else {
        setCourses(fallbackCourses);
      }
      setLoading(false);
    } catch (e: any) {
      console.error("Erro ao carregar cursos do Supabase (usando fallback offline):", e);
      setCourses(fallbackCourses);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const errorMsg = "Erro ao conectar com o banco de dados: verifique as variáveis de ambiente do Supabase";
      console.info(errorMsg);
      setSupabaseError(errorMsg);
      setCourses(fallbackCourses);
      setLoading(false);
    } else {
      fetchCourses();
      fetchLearningTips();
      fetchAchievements();
      fetchAiTutorConfig();
      fetchInterfaceTexts();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail || !formPassword) {
      setAuthError("Por favor, preencha todos os campos!");
      return;
    }
    
    if (formPassword.length < 4) {
      setAuthError("A senha precisa ter no mínimo 4 caracteres!");
      return;
    }

    setAuthSuccess("Conectando com sucesso... Bem-vindo de volta!");
    
    setTimeout(() => {
      const detectedName = formEmail.split('@')[0];
      const capitalized = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);
      
      localStorage.setItem('falla_is_logged_in', 'true');
      localStorage.setItem('falla_user_name', capitalized);
      localStorage.setItem('falla_user_email', formEmail);
      
      setIsLoggedIn(true);
      setUserName(capitalized);
      setUserEmail(formEmail);
      setAuthSuccess(null);
      setFormEmail('');
      setFormPassword('');
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail || !formPassword || !formName) {
      setAuthError("Por favor, preencha todos os campos!");
      return;
    }
    
    if (formPassword.length < 4) {
      setAuthError("A senha precisa ter no mínimo 4 caracteres!");
      return;
    }

    setAuthSuccess("Conta criada com sucesso! Preparando seu painel...");
    
    setTimeout(() => {
      localStorage.setItem('falla_is_logged_in', 'true');
      localStorage.setItem('falla_user_name', formName);
      localStorage.setItem('falla_user_email', formEmail);
      localStorage.setItem('falla_user_state', formState);
      localStorage.setItem('falla_user_country', formCountry);
      
      setIsLoggedIn(true);
      setUserName(formName);
      setUserEmail(formEmail);
      setUserProgress(prev => ({
        ...prev,
        state: formState,
        country: formCountry
      }));
      setAuthSuccess(null);
      setFormEmail('');
      setFormPassword('');
      setFormName('');
    }, 1200);
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail) {
      setAuthError("Por favor, digite seu e-mail!");
      return;
    }

    setAuthSuccess("Um link de recuperação de senha foi enviado para " + formEmail + " com sucesso!");
    setFormEmail('');
  };

  const handleLogout = () => {
    localStorage.removeItem('falla_is_logged_in');
    localStorage.removeItem('falla_user_name');
    localStorage.removeItem('falla_user_email');
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  const handleCompleteLesson = (xpEarned: number, coinsEarned: number) => {
    if (activeLesson) {
      const isFirstTime = !userProgress.completedLessons.includes(activeLesson.id);
      const newCompleted = isFirstTime 
        ? [...userProgress.completedLessons, activeLesson.id]
        : userProgress.completedLessons;

      // Random XP and Coins are passed back from the Chest Game in LessonPlayer.
      let newXp = userProgress.xp + xpEarned;
      let newLevel = userProgress.level;
      if (newXp >= 100) {
        const levelsGained = Math.floor(newXp / 100);
        newLevel += levelsGained;
        newXp = newXp % 100; // Zerada (resets to remainder)
      }

      // Streak logic (only 1 time per day)
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const lastStreakDate = localStorage.getItem('falla_last_streak_date');
      let newStreak = userProgress.streak;
      if (lastStreakDate !== todayStr) {
        newStreak += 1;
        localStorage.setItem('falla_last_streak_date', todayStr);
      }

      const newCoins = (userProgress.coins || 0) + coinsEarned;

      setUserProgress(prev => ({
        ...prev,
        xp: newXp,
        completedLessons: newCompleted,
        level: newLevel,
        streak: newStreak,
        coins: newCoins,
        lives: 5 // Restore lives on complete
      }));
    }
    setActiveLesson(null);
  };

  // Generate Custom AI Lesson!
  const handleGenerateAiLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) {
      alert("Por favor, digite um tema!");
      return;
    }

    setGeneratingAiLesson(true);
    setAiError(null);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-generate-lesson', {
        body: {
          topic: customTopic,
          language: customLang,
          prompt_template: aiTutorConfig?.prompt_template
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.lesson) {
        setActiveLesson(data.lesson);
      } else {
        setAiError("Não conseguimos processar o retorno da lição. Verifique os limites da chave API.");
      }
    } catch (e: any) {
      console.error(e);
      setAiError("Ocorreu uma falha na requisição da IA no Supabase. Verifique se a Edge Function está implantada.");
    } finally {
      setGeneratingAiLesson(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col items-center justify-center p-4 md:p-8 antialiased">
        <div className="max-w-4xl w-full bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2">
          
          {/* Mascot Info Left Panel */}
          <div className="bg-gradient-to-br from-falla-blue/10 to-falla-blue/5 p-8 flex flex-col items-center justify-center text-center border-r-2 border-slate-100 relative">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-falla-green rounded-lg flex items-center justify-center text-white font-black text-lg italic shadow-sm">
                F
              </div>
              <span className="font-black text-falla-green tracking-tighter text-lg">FALLA</span>
            </div>
            
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white mb-6 mt-6 hover:scale-105 transition-transform duration-300">
              <img 
                src={chicoMascot} 
                alt="Chico Mascot" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm max-w-xs">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-slate-200 rotate-45"></div>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                "Oi! Eu sou o <strong>Chico</strong>! Pronto para brincar e aprender um novo idioma hoje de um jeito super divertido?"
              </p>
            </div>
            <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              FALLA Mascot Squad 2026
            </div>
          </div>

          {/* Form Right Panel */}
          <div className="p-8 flex flex-col justify-center">
            {/* Header/Tabs */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {authMode === 'login' && 'Bem-vindo de Volta!'}
                {authMode === 'register' && 'Criar Conta Grátis'}
                {authMode === 'recover' && 'Recuperar Senha'}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {authMode === 'login' && 'Entre para continuar sua ofensiva diária.'}
                {authMode === 'register' && 'Cadastre-se para começar sua jornada.'}
                {authMode === 'recover' && 'Insira seu email para recuperar o acesso.'}
              </p>
            </div>

            {/* Success and Error Alerts */}
            {authSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-xs font-bold mb-4 flex items-center gap-2 animate-pulse">
                <Sparkles className="text-falla-green shrink-0" size={16} />
                <span>{authSuccess}</span>
              </div>
            )}
            {authError && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-3.5 text-xs font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500 shrink-0" size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* Form Fields */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Mail size={12} /> E-mail do Estudante ou Responsável
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: joao@falla.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue/50 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Lock size={12} /> Senha de Acesso
                    </label>
                    <button 
                      type="button"
                      onClick={() => { setAuthMode('recover'); setAuthError(null); setAuthSuccess(null); }}
                      className="text-[10px] text-falla-blue font-black hover:underline uppercase"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Digite sua senha"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue/50 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black text-xs py-3.5 px-4 rounded-2xl shadow-md border-b-4 border-b-green-700 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <LogIn size={14} />
                  Entrar na Aventura
                </button>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <User size={12} /> Nome do Estudante
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Joãozinho Santos"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue/50 rounded-2xl p-2.5 text-xs font-bold text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail size={12} /> E-mail do Responsável
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: pai-ou-mae@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue/50 rounded-2xl p-2.5 text-xs font-bold text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Lock size={12} /> Senha para Praticar
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Crie uma senha de 4+ dígitos"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue/50 rounded-2xl p-2.5 text-xs font-bold text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Estado</label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="SP">São Paulo (SP)</option>
                      <option value="RJ">Rio de Janeiro (RJ)</option>
                      <option value="MG">Minas Gerais (MG)</option>
                      <option value="RS">Rio Grande do Sul (RS)</option>
                      <option value="BA">Bahia (BA)</option>
                      <option value="PE">Pernambuco (PE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">País</label>
                    <input
                      type="text"
                      placeholder="Ex: Brasil 🇧🇷"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-md border-b-4 border-b-sky-600 active:translate-y-0.5 transition-all uppercase tracking-wider mt-1 cursor-pointer"
                >
                  Criar Minha Conta Grátis!
                </button>
              </form>
            )}

            {authMode === 'recover' && (
              <form onSubmit={handleRecover} className="space-y-4">
                <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-2xl p-3.5 text-[11px] font-bold leading-relaxed mb-1">
                  💡 <strong>Nota para Pais ou Responsáveis:</strong> Enviaremos as instruções de recuperação para o e-mail cadastrado de forma totalmente segura.
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Mail size={12} /> Digite seu E-mail Cadastrado
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: seu-email@falla.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue/50 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-falla-pink hover:bg-falla-pink/90 text-white font-black text-xs py-3.5 px-4 rounded-2xl shadow-md border-b-4 border-b-purple-600 active:translate-y-0.5 transition-all uppercase tracking-wider cursor-pointer"
                >
                  Enviar Link de Recuperação
                </button>
                
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                  className="w-full text-[10px] text-slate-500 font-extrabold hover:underline uppercase flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
                >
                  <ArrowLeft size={12} /> Voltar para o Login
                </button>
              </form>
            )}

            {/* Switch Mode Footer */}
            {authMode !== 'recover' && (
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                {authMode === 'login' ? (
                  <p className="text-xs text-slate-500 font-bold">
                    Novo no FALLA?{' '}
                    <button
                      onClick={() => { setAuthMode('register'); setAuthError(null); setAuthSuccess(null); }}
                      className="text-falla-blue font-black hover:underline cursor-pointer"
                    >
                      Crie uma conta gratuita!
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-bold">
                    Já possui uma conta?{' '}
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                      className="text-falla-green font-black hover:underline cursor-pointer"
                    >
                      Faça o login!
                    </button>
                  </p>
                )}
              </div>
            )}

          </div>

        </div>
        <div className="mt-8 text-center text-[10px] text-slate-400 font-semibold max-w-sm">
          {interfaceTexts.app_footer || "FALLA App Co. © 2026. Feito com tecnologia React Native e IA para democratizar o aprendizado de idiomas de forma divertida."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      
      {/* Immersive Lesson Overlay */}
      {activeLesson && (
        <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto py-10 px-4">
          <LessonPlayer 
            lesson={activeLesson} 
            courseLanguage={selectedCourse?.language || "en"}
            onComplete={handleCompleteLesson}
            onCancel={() => setActiveLesson(null)}
            userXp={userProgress.xp}
            userLevel={userProgress.level}
          />
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-falla-green rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-sm">
              F
            </div>
            <h1 className="text-2xl font-black text-falla-green tracking-tighter">FALLA</h1>
            <span className="hidden md:inline-block text-[10px] font-bold bg-falla-green/10 text-falla-green px-2.5 py-0.5 rounded-full border border-falla-green/20 ml-2">
              {interfaceTexts.app_badge || "Protótipo High-Fidelity"}
            </span>
          </div>

          {/* User Status Ribbon */}
          <div className="flex items-center gap-3 sm:gap-6 font-extrabold text-sm shrink-0">
            {/* Active Language Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border-2 border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Globe size={14} className="text-falla-blue animate-spin-slow" />
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.flag} {c.name.split(' ')[0]}</option>
                ))}
              </select>
            </div>

            <span className="flex items-center gap-1.5 text-falla-orange hover:scale-105 transition-all cursor-pointer font-black" title="Ofensiva diária">
              <span className="text-xl">🔥</span>
              <span className="tracking-tight uppercase text-xs font-black">{userProgress.streak} DIAS</span>
            </span>
            
            <span className="flex items-center gap-1.5 text-falla-blue hover:scale-105 transition-all cursor-pointer font-black" title="XP acumulados">
              <span className="text-xl">💎</span>
              <span className="tracking-tight uppercase text-xs font-black">{userProgress.xp}/100 XP</span>
            </span>

            <span className="flex items-center gap-1.5 text-amber-500 hover:scale-105 transition-all cursor-pointer font-black" title="Moedas de Sorte">
              <span className="text-xl">🪙</span>
              <span className="tracking-tight uppercase text-xs font-black">{userProgress.coins || 0} MOEDAS</span>
            </span>

            <span className="hidden xs:flex items-center gap-1 bg-falla-pink text-white px-2.5 py-0.5 rounded-full text-[10px] shadow-sm font-black uppercase" title="Nível atual">
              Lvl {userProgress.level}
            </span>

            {/* Logout button */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-red-500 hover:scale-105 transition-all font-black text-xs uppercase cursor-pointer"
              title="Sair da conta"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">

        {activeTab === 'home' ? (
          /* Portal/Hub Page (Página Inicial) */
          <div className="space-y-8 animate-fade-in">
            {/* Hero Welcome Banner */}
            <div className="bg-gradient-to-r from-falla-blue to-indigo-600 text-white rounded-3xl p-6 md:p-8 shadow-md border-b-4 border-indigo-700 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
              <div className="space-y-2">
                <span className="bg-sky-500/30 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-sky-400/20">
                  Aventura Linguística Ativa 🚀
                </span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                  Olá, {userName}! 👋 
                </h2>
                <p className="text-xs md:text-sm font-bold text-sky-100 leading-relaxed max-w-xl">
                  Pronto para a sua jornada de hoje? Ganhe XP, mantenha sua ofensiva diária e explore mundos divertidos com os mascotes!
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
                    🏆 Nível: <span className="text-falla-yellow">{userProgress.level}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
                    🔥 Ofensiva: <span className="text-falla-orange">{userProgress.streak} Dias</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
                    💎 Experiência: <span className="text-sky-300">{userProgress.xp}/100 XP</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
                    🪙 Moedas: <span className="text-amber-300">{userProgress.coins || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Chico Welcome Bubble in Hub */}
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 max-w-xs backdrop-blur-xs shrink-0 self-stretch md:self-center">
                <img 
                  src={chicoMascot} 
                  alt="Chico" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-[10px] font-bold text-white leading-normal">
                  "Estou de olho! Quem estuda hoje ganha adesivo virtual extra! Escolha uma opção abaixo para começar!"
                </div>
              </div>
            </div>

            {/* Quick Tips Carousel */}
            {learningTips.length > 0 && (
              <div 
                onClick={() => setActiveTipIndex((prev) => (prev + 1) % learningTips.length)}
                className="bg-amber-50 border-2 border-amber-200 hover:border-amber-300 rounded-2xl p-4.5 shadow-2xs text-xs flex items-center justify-between gap-4 cursor-pointer hover:scale-[1.01] transition-all"
                title="Clique para ver outra dica"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-black text-amber-900 text-xs flex items-center gap-2">
                      Dica de Aprendizado <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-black font-mono">{(activeTipIndex + 1)}/{learningTips.length}</span>
                    </p>
                    <p className="text-slate-600 font-bold leading-relaxed mt-0.5">
                      {learningTips[activeTipIndex]?.tip}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-200 text-amber-800 font-black uppercase px-2 py-1 rounded-lg shrink-0">Avançar →</span>
              </div>
            )}

            {/* Path Selector - 5 beautiful big pages cards */}
            <div className="space-y-4">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>🎯</span> Escolha a sua Atividade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Estudo Diário */}
                <div 
                  onClick={() => setActiveTab('learn')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-green rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-100 group-hover:bg-falla-green text-falla-green group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      📖
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-full">ATIVIDADE PRINCIPAL</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-green transition-colors">Estudo Diário</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Mergulhe nas lições interativas de inglês e espanhol, responda exercícios jogáveis e dispute no ranking regional!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-green group-hover:translate-x-1 transition-transform">
                    Estudar Agora <ChevronRight size={14} />
                  </div>
                </div>

                {/* 2. Tutor de IA */}
                <div 
                  onClick={() => setActiveTab('ai-tutor')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-blue rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-sky-100 group-hover:bg-falla-blue text-falla-blue group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      🧠
                    </div>
                    <span className="text-[10px] bg-sky-50 text-falla-blue font-black px-2 py-0.5 rounded-full">GERADOR INTELIGENTE</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-blue transition-colors">Tutor de IA</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Peça para a inteligência artificial do Gemini criar uma lição inteiramente nova e jogável sobre qualquer tema em segundos!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-blue group-hover:translate-x-1 transition-transform">
                    Criar Lição com IA <ChevronRight size={14} />
                  </div>
                </div>

                {/* 3. Nossos Mascotes */}
                <div 
                  onClick={() => setActiveTab('mascots')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-pink rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-purple-100 group-hover:bg-falla-pink text-falla-pink group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      🦉
                    </div>
                    <span className="text-[10px] bg-purple-50 text-falla-pink font-black px-2 py-0.5 rounded-full">CONHEÇA O SQUAD</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-pink transition-colors">Nossos Mascotes</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Conheça os simpáticos e sábios guias virtuais da Falla que auxiliam as crianças no aprendizado e explicam suas lições!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-pink group-hover:translate-x-1 transition-transform">
                    Explorar Mascotes <ChevronRight size={14} />
                  </div>
                </div>

                {/* 4. Painel Admin */}
                <div 
                  onClick={() => setActiveTab('admin')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-orange rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-100 group-hover:bg-falla-orange text-falla-orange group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      ⚙️
                    </div>
                    <span className="text-[10px] bg-amber-50 text-falla-orange font-black px-2 py-0.5 rounded-full">CONFIGURAÇÕES</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-orange transition-colors">Painel Admin</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Gerencie cursos, regras do aplicativo, dicas de estudos, textos dinâmicos de interface e configurações da API de IA.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-orange group-hover:translate-x-1 transition-transform">
                    Acessar Painel <ChevronRight size={14} />
                  </div>
                </div>

                {/* 5. Arquitetura & Stack */}
                <div 
                  onClick={() => setActiveTab('architecture')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-yellow rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-yellow-100 group-hover:bg-falla-yellow text-slate-900 group-hover:text-slate-900 rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      🏛️
                    </div>
                    <span className="text-[10px] bg-yellow-50 text-amber-700 font-black px-2 py-0.5 rounded-full">TECNICO & INFRA</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-yellow transition-colors font-sans">Arquitetura & Stack</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Veja o plano detalhado de engenharia, arquitetura de banco, segurança de dados LGPD e o fluxo de publicação oficial.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                    Ver Especificações <ChevronRight size={14} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* Sub-Pages Container (Cada tela individual e espaçosa com botão de voltar) */
          <div className="space-y-6 animate-fade-in">
            {/* Upper Navigation Bar with back button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-slate-200 p-4 rounded-3xl shadow-2xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowLeft size={14} />
                  Voltar ao Painel
                </button>
                <span className="h-6 w-0.5 bg-slate-200 hidden sm:inline"></span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {activeTab === 'learn' && '📖'}
                    {activeTab === 'ai-tutor' && '🧠'}
                    {activeTab === 'mascots' && '🦉'}
                    {activeTab === 'admin' && '⚙️'}
                    {activeTab === 'architecture' && '🏛️'}
                  </span>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {activeTab === 'learn' && 'Estudo Diário'}
                    {activeTab === 'ai-tutor' && 'Tutor de IA'}
                    {activeTab === 'mascots' && 'Nossos Mascotes'}
                    {activeTab === 'admin' && 'Painel Administrativo'}
                    {activeTab === 'architecture' && 'Arquitetura & Stack'}
                  </h2>
                </div>
              </div>

              {/* Mini Quick-jump list of buttons for easy context navigation */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'learn', label: 'Estudo', icon: BookOpen, color: 'text-falla-green' },
                  { id: 'ai-tutor', label: 'Tutor IA', icon: Brain, color: 'text-falla-blue' },
                  { id: 'mascots', label: 'Mascotes', icon: Award, color: 'text-falla-pink' },
                  { id: 'admin', label: 'Admin', icon: Settings, color: 'text-falla-orange' },
                  { id: 'architecture', label: 'Stack', icon: Trophy, color: 'text-falla-yellow' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer hover:scale-102 ${
                      activeTab === item.id 
                        ? 'bg-slate-800 text-white shadow-xs' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <item.icon size={11} className={item.color} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Page Contents */}
            {supabaseError ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 md:p-8 text-center max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto animate-bounce">
                  ⚠️
                </div>
                <h2 className="text-sm font-black text-red-800 uppercase tracking-wide">Falha de Configuração do Supabase</h2>
                <p className="text-xs text-red-700 font-bold leading-relaxed">
                  {supabaseError}
                </p>
                <div className="text-[11px] text-slate-500 font-bold leading-relaxed bg-white border border-slate-200 p-4 rounded-2xl max-w-lg mx-auto text-left space-y-2">
                  <p>O aplicativo não conseguiu estabelecer conexão por falta de credenciais válidas.</p>
                  <p>Verifique se as seguintes variáveis estão configuradas no seu arquivo <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-rose-600 font-bold">.env</code> ou nas configurações da plataforma:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[10px] text-slate-600">
                    <li><code className="bg-slate-150 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code></li>
                    <li><code className="bg-slate-150 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code></li>
                  </ul>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSupabaseError(null);
                      setCourses(fallbackCourses);
                      setLoading(false);
                    }}
                    className="bg-falla-green hover:bg-falla-green/90 text-white font-black text-xs px-5 py-3 rounded-2xl border-b-4 border-b-green-700 active:translate-y-0.5 transition-all shadow-md uppercase tracking-wider cursor-pointer"
                  >
                    Continuar com Dados de Demonstração (Modo Offline)
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-sm font-bold text-slate-500 animate-pulse">
                Carregando dados didáticos do FALLA...
              </div>
            ) : (
              <>
                {/* 1. ESTUDO DIÁRIO VIEW (Includes lessons + leaderboard and achievements) */}
                {activeTab === 'learn' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    
                    {/* Left Column: Course Selector, Modules & Lessons */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* Interactive Flags Header */}
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Idioma de Estudo Ativo:</span>
                        <div className="flex gap-2">
                          {courses.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCourseId(c.id)}
                              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-2 ${
                                selectedCourseId === c.id 
                                  ? 'bg-falla-green/10 border-falla-green text-falla-green font-black shadow-xs scale-102' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <span>{c.flag}</span>
                              <span>{c.name.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedCourse ? (
                        <>
                          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
                            <div className="flex items-center gap-4">
                              <span className="text-5xl bg-slate-50 p-3 rounded-2xl border-2 border-slate-200 shadow-3xs">{selectedCourse.flag}</span>
                              <div>
                                <h1 className="text-xl font-black text-slate-800 tracking-tight">{selectedCourse.name}</h1>
                                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{selectedCourse.description}</p>
                              </div>
                            </div>
                          </div>

                          {selectedCourse.modules.map((mod) => (
                            <div key={mod.id} className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
                              <div className="border-b border-slate-100 pb-3">
                                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 rounded-full bg-falla-green ring-4 ring-green-100"></span>
                                  {mod.title}
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{mod.description}</p>
                              </div>

                              <div className="space-y-3.5">
                                {mod.lessons.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic">Nenhuma lição disponível. Adicione lições pelo painel administrativo!</p>
                                ) : (
                                  mod.lessons.map((les) => {
                                    const isCompleted = userProgress.completedLessons.includes(les.id);
                                    return (
                                      <div 
                                        key={les.id} 
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all card-bouncy ${
                                          isCompleted 
                                            ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800' 
                                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-black text-xs text-slate-800">{les.title}</h4>
                                            {isCompleted && (
                                              <span className="bg-falla-green text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                                ✔ Completa
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-400 mt-1 font-bold">{les.description}</p>
                                        </div>
                                        
                                        <button
                                          onClick={() => setActiveLesson(les)}
                                          className={`font-black text-xs px-4.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 shadow-sm ${
                                            isCompleted 
                                              ? 'bg-falla-green hover:bg-falla-green/90 text-white border-b-4 border-b-green-700 active:translate-y-1 active:border-b-0 cursor-pointer' 
                                              : 'bg-falla-blue hover:bg-falla-blue/90 text-white border-b-4 border-b-sky-600 active:translate-y-1 active:border-b-0 cursor-pointer'
                                          }`}
                                        >
                                          Estudar
                                          <ChevronRight size={14} />
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center">
                          <p className="text-slate-500 text-xs font-bold">Crie o seu primeiro curso ou selecione outro idioma no topo.</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Leaderboards and Achievements */}
                    <div className="space-y-6">
                      <Leaderboard 
                        userXp={userProgress.xp} 
                        userStreak={userProgress.streak}
                        userState={userProgress.state}
                        userCountry={userProgress.country}
                      />

                      {/* Achievements Module */}
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                        <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                          <Trophy size={16} className="text-falla-yellow animate-bounce" />
                          Conquistas Ativas
                        </h3>
                        <div className="space-y-3">
                          {achievements.map((ach) => {
                            const isUnlocked = userProgress.xp >= ach.xp_required;
                            return (
                              <div 
                                key={ach.id} 
                                className={`p-3 rounded-2xl border-2 transition-all flex items-start gap-2.5 ${
                                  isUnlocked 
                                    ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 opacity-75'
                                }`}
                              >
                                <span className="text-2xl mt-0.5" role="img" aria-label="achievement emoji">{ach.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="font-extrabold text-xs truncate">{ach.title}</h4>
                                    {isUnlocked ? (
                                      <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight">Liberada</span>
                                    ) : (
                                      <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight">{ach.xp_required} XP</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold leading-normal">{ach.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. NOSSOS MASCOTES VIEW */}
                {activeTab === 'mascots' && (
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs animate-fade-in">
                    <MascotCard />
                  </div>
                )}

                {/* 3. PAINEL ADMIN VIEW */}
                {activeTab === 'admin' && (
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs animate-fade-in">
                    <AdminPanel 
                      courses={courses} 
                      onRefreshCourses={fetchCourses} 
                      learningTips={learningTips}
                      onRefreshTips={fetchLearningTips}
                      achievements={achievements}
                      onRefreshAchievements={fetchAchievements}
                      aiTutorConfig={aiTutorConfig}
                      onRefreshAiTutorConfig={fetchAiTutorConfig}
                      interfaceTexts={interfaceTexts}
                      onRefreshInterfaceTexts={fetchInterfaceTexts}
                    />
                  </div>
                )}

                {/* 4. ARQUITETURA & STACK VIEW */}
                {activeTab === 'architecture' && (
                  <div className="animate-fade-in">
                    <ArchitectureCenter />
                  </div>
                )}

                {/* 5. TUTOR DE IA VIEW */}
                {activeTab === 'ai-tutor' && (
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Brain className="text-falla-blue animate-pulse" />
                        Mecanismo de Lições Inteligentes por IA (Gemini)
                      </h2>
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        {interfaceTexts.ai_tutor_welcome || "Digite qualquer tema que venha à sua cabeça (ex: \"comprar frutas na feira\", \"jogando futebol no parque\", \"viagem espacial\") e nossa IA gerará uma lição interativa e jogável completa e personalizada em segundos!"}
                      </p>
                    </div>

                    {aiError && (
                      <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl p-4 text-xs font-bold flex gap-2">
                        <AlertCircle className="shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <strong>Alerta de IA:</strong> {aiError}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleGenerateAiLesson} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-2xl border-2 border-slate-150">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-600 mb-1">Qual assunto você deseja praticar hoje?</label>
                        <input
                          type="text"
                          placeholder="Ex: Pedindo uma pizza, Viagem internacional, Cores..."
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-falla-blue/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-600 mb-1">Idioma de Estudo</label>
                        <select
                          value={customLang}
                          onChange={(e: any) => setCustomLang(e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="en">Inglês 🇺🇸</option>
                          <option value="es">Espanhol 🇪🇸</option>
                          <option value="pt">Português 🇧🇷</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={generatingAiLesson}
                        className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer"
                      >
                        {generatingAiLesson ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-white animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Brain size={14} />
                            Gerar Lição Exclusiva
                          </>
                        )}
                      </button>
                    </form>

                    <div className="border-2 border-slate-150 p-4.5 rounded-2xl text-xs space-y-2 text-slate-600 leading-relaxed font-bold">
                      <p className="font-black text-slate-800 flex items-center gap-1">
                        <Sparkles size={14} className="text-falla-yellow animate-pulse" />
                        Como isso funciona nos bastidores:
                      </p>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Quando você clica em gerar, o app envia o tema desejado para a nossa API no Express. O backend consulta o modelo <strong>Gemini 3.5 Flash</strong> exigindo um retorno em formato JSON estruturado estrito. A IA elabora exercícios de gramática contextualizados ao tema, cria distratores plausíveis de erro e gera até mesmo dicas dinâmicas assinadas por um dos mascotes!
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>

      {/* Footer credits */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[10px] text-slate-400 font-semibold tracking-wide mt-auto">
        {interfaceTexts.app_footer || "FALLA App Co. © 2026. Feito com tecnologia React Native e IA para democratizar o aprendizado de idiomas de forma divertida."}
      </footer>

    </div>
  );
}
