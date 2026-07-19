import React, { useEffect, useState } from 'react';
import chicoMascot from './assets/images/chico_mascot_flat_vector_1784399850056.jpg';
import licoMascot from './assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from './assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from './assets/images/luna_mascot_1784292067117.jpg';
import { Course, Lesson, UserProgress, API_BASE_URL, LearningTip, Achievement, AiTutorConfig, QuestionType } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { fallbackCourses } from './lib/fallbackCourses';
import LessonPlayer from './components/LessonPlayer';
import Leaderboard from './components/Leaderboard';
import MascotCard from './components/MascotCard';
import AdminPanel from './components/AdminPanel';
import ArchitectureCenter from './components/ArchitectureCenter';
import GoldCoinIcon from './components/GoldCoinIcon';
import { 
  BookOpen, Trophy, Sparkles, Award, User, Flame, Settings, 
  ChevronRight, Brain, Globe, MessageSquare, AlertCircle, Plus,
  LogOut, Lock, Mail, KeyRound, ArrowLeft, LogIn, ShoppingBag, Palette, CreditCard, Check,
  Home, Gift, Menu, Edit, Volume2, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProgressTrail from './components/ProgressTrail';
import { MANUAL_LESSONS } from './data/manualLessons';
import { shuffleArray } from './utils/shuffle';
import { PROFILE_BANNERS } from './data/banners';
import { GRAMMAR_LESSONS, GrammarLesson } from './data/grammarLessons';

const fallbackLearningTips: LearningTip[] = [
  { id: "tip_1", tip: "Sabia que o cérebro das crianças absorve novos fonemas até 2x mais rápido que o dos adultos? Nossos mascotes foram pensados para tornar esse processo super divertido!", mascot_id: "lico" },
  { id: "tip_2", tip: "Estudar 5 minutos por dia é muito melhor do que estudar 1 hora uma vez por semana. A constância ativa a memória de longo prazo!", mascot_id: "luna" },
  { id: "tip_3", tip: "Tente repetir as palavras em voz alta enquanto joga. A pronúncia ativa áreas motoras do cérebro, acelerando a fixação!", mascot_id: "pingo" },
  { id: "tip_4", tip: "Não tenha medo de errar! O erro é o melhor atalho para o aprendizado e nos mostra onde precisamos focar mais.", mascot_id: "teddy" },
  { id: "tip_chico_1", tip: "O Chico Yorkshire diz: 'Au au! Sempre que você acertar uma pergunta, imagine que está jogando minha bolinha rosa favorita para mim! Continue assim, estou torcendo por você!'", mascot_id: "chico" },
  { id: "tip_chico_2", tip: "O Chico Yorkshire nos ensina que a persistência é tudo! Eu sou pequenininho, mas enfrento qualquer desafio com muita coragem. Seja corajoso com novos idiomas também!", mascot_id: "chico" }
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

// Helper to inject manual lessons into the English course
const injectManualLessons = (coursesList: Course[]): Course[] => {
  if (!coursesList) return [];
  return coursesList.map(course => {
    if (course.id === 'en_basic') {
      return {
        ...course,
        modules: [
          {
            id: "en_mod_1",
            title: "Módulo 1 - Cotidiano / Básico",
            description: "Aprenda o básico do inglês com conversações e saudações comuns.",
            lessons: MANUAL_LESSONS
          },
          {
            id: "en_mod_2",
            title: "Módulo 2 - Comida e Compras",
            description: "Vocabulário sobre restaurantes, mercados e compras (Em breve).",
            lessons: []
          },
          {
            id: "en_mod_3",
            title: "Módulo 3 - Viagens e Lugares",
            description: "Se vire em aeroportos, hotéis e nas ruas (Em breve).",
            lessons: []
          },
          {
            id: "en_mod_4",
            title: "Módulo 4 - Trabalho e Estudos",
            description: "Expressões de e-mail, reuniões e entrevistas (Em breve).",
            lessons: []
          },
          {
            id: "en_mod_5",
            title: "Módulo 5 - Saúde e Emergências",
            description: "Como pedir ajuda e ir ao médico (Em breve).",
            lessons: []
          },
          {
            id: "en_mod_6",
            title: "Módulo 6 - Lazer e Social",
            description: "Hobbies, planos com amigos e esportes (Em breve).",
            lessons: []
          },
          {
            id: "en_mod_7",
            title: "Módulo 7 - Tecnologia e Comunicação",
            description: "Celular, redes sociais e wifi (Em breve).",
            lessons: []
          },
          {
            id: "en_mod_8",
            title: "Módulo 8 - Diversos",
            description: "Temas divertidos e imaginativos de encerramento (Em breve).",
            lessons: []
          }
        ]
      };
    }
    return course;
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'mascots' | 'admin' | 'architecture' | 'ai-tutor' | 'profile' | 'shop' | 'plans' | 'leaderboard' | 'more' | 'grammar'>('home');
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState<GrammarLesson | null>(null);
  const [courses, setCoursesState] = useState<Course[]>([]);
  const setCourses = (newCourses: Course[] | ((prev: Course[]) => Course[])) => {
    if (typeof newCourses === 'function') {
      setCoursesState(prev => injectManualLessons(newCourses(prev)));
    } else {
      setCoursesState(injectManualLessons(newCourses));
    }
  };
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('falla_theme') || 'classic';
  });
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; name: string; price: string } | null>(null);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [userName, setUserName] = useState<string>('Estudante');
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

  // Floating Chico states
  const [showChicoBubble, setShowChicoBubble] = useState<boolean>(true);
  const [isChicoRemoved, setIsChicoRemoved] = useState<boolean>(false);

  // User stats state
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('falla_user_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.coins === undefined) parsed.coins = 50;
        if (!parsed.avatarMascot) parsed.avatarMascot = "chico";
        if (!parsed.plan) parsed.plan = "free";
        if (parsed.hasUsedFreeNameChange === undefined) parsed.hasUsedFreeNameChange = false;
        if (parsed.nameChangeCards === undefined) parsed.nameChangeCards = 0;
        if (!parsed.unlockedBanners) parsed.unlockedBanners = ["banner_classic", "banner_pastel"];
        if (!parsed.activeBanner) parsed.activeBanner = "banner_classic";
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
      state: "SP",
      country: "Brasil 🇧🇷",
      coins: 50,
      avatarMascot: "chico",
      plan: "free",
      hasUsedFreeNameChange: false,
      nameChangeCards: 0,
      unlockedBanners: ["banner_classic", "banner_pastel"],
      activeBanner: "banner_classic"
    };
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('falla_user_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  // Helper to sync progress to Supabase profiles
  const syncProgressToSupabase = async (progress: UserProgress, name: string) => {
    if (!isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    try {
      await supabase.from('profiles').update({
        name: name,
        state: progress.state,
        country: progress.country,
        xp: progress.xp,
        streak: progress.streak,
        level: progress.level,
        lives: progress.lives,
        coins: progress.coins,
        completed_lessons: progress.completedLessons,
        current_course_id: progress.currentCourseId,
        avatar_mascot: progress.avatarMascot || 'chico',
        plan: progress.plan || 'free',
        has_used_free_name_change: progress.hasUsedFreeNameChange || false,
        name_change_cards: progress.nameChangeCards || 0,
        active_banner: progress.activeBanner || 'banner_classic'
      }).eq('id', session.user.id);
    } catch (err) {
      console.warn("Erro ao sincronizar progresso com Supabase:", err);
    }
  };

  // Helper to record purchase in user_inventory
  const purchaseItemInDatabase = async (itemId: string, itemType: string) => {
    if (!isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    try {
      await supabase.from('user_inventory').insert({
        user_id: session.user.id,
        item_id: itemId,
        item_type: itemType
      });
    } catch (err) {
      console.warn("Erro ao registrar compra no inventário do Supabase:", err);
    }
  };

  // Debounced progress syncing
  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        syncProgressToSupabase(userProgress, userName);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userProgress, userName, isLoggedIn]);

  // Countdown state for life regeneration
  const [lifeCountdownStr, setLifeCountdownStr] = useState<string>("");

  // Ensure lastLifeRegenTime is set when lives are below 5
  useEffect(() => {
    if (userProgress.plan !== 'premium' && userProgress.lives < 5 && !userProgress.lastLifeRegenTime) {
      setUserProgress(prev => ({ ...prev, lastLifeRegenTime: Date.now() }));
    }
  }, [userProgress.lives, userProgress.plan, userProgress.lastLifeRegenTime]);

  // Vidas regeneration check and countdown calculation
  useEffect(() => {
    const interval = setInterval(() => {
      if (userProgress.plan === 'premium') {
        if (userProgress.lives !== 999999) {
          setUserProgress(prev => ({ ...prev, lives: 999999, lastLifeRegenTime: undefined }));
        }
        setLifeCountdownStr("");
        return;
      }

      if (userProgress.lives >= 5) {
        if (userProgress.lastLifeRegenTime) {
          setUserProgress(prev => ({ ...prev, lastLifeRegenTime: undefined }));
        }
        setLifeCountdownStr("");
        return;
      }

      const lastRegen = userProgress.lastLifeRegenTime;
      if (!lastRegen) return;

      const now = Date.now();
      const elapsed = now - lastRegen;
      const msPerLife = 20 * 60 * 1000; // 20 minutes in ms

      if (elapsed >= msPerLife) {
        const livesToRestore = Math.floor(elapsed / msPerLife);
        const newLives = Math.min(5, userProgress.lives + livesToRestore);
        const remainderTime = elapsed % msPerLife;
        const nextRegen = newLives === 5 ? undefined : (now - remainderTime);

        setUserProgress(prev => ({
          ...prev,
          lives: newLives,
          lastLifeRegenTime: nextRegen
        }));
      } else {
        const remainingMs = msPerLife - elapsed;
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setLifeCountdownStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userProgress.lives, userProgress.plan, userProgress.lastLifeRegenTime]);

  // Theme palettes definition
  const themesList: Record<string, {
    name: string;
    green: string;
    blue: string;
    yellow: string;
    orange: string;
    red: string;
    pink: string;
    bg: string;
    cardBg: string;
    text: string;
    border: string;
  }> = {
    classic: {
      name: 'Clássico Verde/Azul',
      green: '#78C800',
      blue: '#1CB0F6',
      yellow: '#FFC800',
      orange: '#FF9600',
      red: '#FF4B4B',
      pink: '#CE82FF',
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      text: '#1E293B',
      border: '#E2E8F0'
    },
    dark: {
      name: 'Modo Espaço Escuro 🌌',
      green: '#22C55E',
      blue: '#38BDF8',
      yellow: '#EAB308',
      orange: '#F97316',
      red: '#EF4444',
      pink: '#D8B4FE',
      bg: '#0F172A',
      cardBg: '#1E293B',
      text: '#F1F5F9',
      border: '#334155'
    },
    warm: {
      name: 'Pôr do Sol Quente 🌅',
      green: '#10B981',
      blue: '#EC4899',
      yellow: '#F59E0B',
      orange: '#F97316',
      red: '#EF4444',
      pink: '#8B5CF6',
      bg: '#FFFBEB',
      cardBg: '#FFFFFF',
      text: '#78350F',
      border: '#FDE68A'
    },
    pastel: {
      name: 'Doce de Leite Pastel 🌸',
      green: '#A7F3D0',
      blue: '#BAE6FD',
      yellow: '#FEF08A',
      orange: '#FED7AA',
      red: '#FECACA',
      pink: '#F3E8FF',
      bg: '#FAF5FF',
      cardBg: '#FFFFFF',
      text: '#581C87',
      border: '#E9D5FF'
    }
  };

  useEffect(() => {
    const selectedTheme = themesList[theme] || themesList.classic;
    const root = document.documentElement;
    
    root.style.setProperty('--color-falla-green', selectedTheme.green);
    root.style.setProperty('--color-falla-blue', selectedTheme.blue);
    root.style.setProperty('--color-falla-yellow', selectedTheme.yellow);
    root.style.setProperty('--color-falla-orange', selectedTheme.orange);
    root.style.setProperty('--color-falla-red', selectedTheme.red);
    root.style.setProperty('--color-falla-pink', selectedTheme.pink);
    
    root.style.setProperty('--falla-green', selectedTheme.green);
    root.style.setProperty('--falla-blue', selectedTheme.blue);
    root.style.setProperty('--falla-yellow', selectedTheme.yellow);
    root.style.setProperty('--falla-orange', selectedTheme.orange);
    root.style.setProperty('--falla-red', selectedTheme.red);
    root.style.setProperty('--falla-pink', selectedTheme.pink);
    
    root.style.setProperty('--theme-bg', selectedTheme.bg);
    root.style.setProperty('--theme-card-bg', selectedTheme.cardBg);
    root.style.setProperty('--theme-text', selectedTheme.text);
    root.style.setProperty('--theme-border', selectedTheme.border);
    
    localStorage.setItem('falla_theme', theme);
  }, [theme]);

  // AI custom lesson generator states
  const [customTopic, setCustomTopic] = useState("");
  const [customLang, setCustomLang] = useState<'en' | 'es' | 'pt'>('en');
  const [generatingAiLesson, setGeneratingAiLesson] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Name Change States & Logic
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [tempNewName, setTempNewName] = useState("");
  const [nameChangeError, setNameChangeError] = useState<string | null>(null);

  const handleOpenEditNameModal = () => {
    const freeAvailable = !userProgress.hasUsedFreeNameChange;
    const cardsAvailable = (userProgress.nameChangeCards || 0) > 0;

    if (!freeAvailable && !cardsAvailable) {
      alert("Você já usou sua troca gratuita. Compre um Cartão de Alteração de Nome na loja para trocar novamente.");
      setActiveTab('shop');
      return;
    }

    setTempNewName(userName);
    setNameChangeError(null);
    setIsEditNameModalOpen(true);
  };

  const handleConfirmNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    setNameChangeError(null);

    const trimmed = tempNewName.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setNameChangeError("O nome de usuário deve ter entre 3 e 20 caracteres!");
      return;
    }

    const freeAvailable = !userProgress.hasUsedFreeNameChange;
    const cardsAvailable = (userProgress.nameChangeCards || 0) > 0;

    if (freeAvailable) {
      localStorage.setItem('falla_user_name', trimmed);
      setUserName(trimmed);
      setUserProgress(prev => ({
        ...prev,
        hasUsedFreeNameChange: true
      }));
      setIsEditNameModalOpen(false);
      alert("Sucesso! Nome alterado gratuitamente!");
    } else if (cardsAvailable) {
      localStorage.setItem('falla_user_name', trimmed);
      setUserName(trimmed);
      setUserProgress(prev => ({
        ...prev,
        nameChangeCards: Math.max(0, (prev.nameChangeCards || 0) - 1)
      }));
      setIsEditNameModalOpen(false);
      alert("Sucesso! Nome alterado usando 1 Cartão de Alteração de Nome!");
    } else {
      setIsEditNameModalOpen(false);
      alert("Você já usou sua troca gratuita. Compre um Cartão de Alteração de Nome na loja para trocar novamente.");
      setActiveTab('shop');
    }
  };

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
      console.warn("Erro ao carregar cursos do Supabase (usando fallback offline):", e);
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
      return;
    }

    fetchCourses();
    fetchLearningTips();
    fetchAchievements();
    fetchAiTutorConfig();
    fetchInterfaceTexts();

    // Listen to Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setCurrentUserId(session.user.id);
        
        // Fetch profile
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUserRole(profile.role);
            setUserName(profile.name || session.user.email?.split('@')[0] || 'Estudante');
            
            // Sync inventory to unlockedBanners
            const { data: inventory } = await supabase
              .from('user_inventory')
              .select('*')
              .eq('user_id', session.user.id);
              
            const dbBanners = inventory 
              ? inventory.filter((i: any) => i.item_type === 'banner').map((i: any) => i.item_id)
              : [];
              
            const uniqueBanners = Array.from(new Set(["banner_classic", "banner_pastel", ...dbBanners]));

            setUserProgress({
              xp: profile.xp ?? 0,
              streak: profile.streak ?? 0,
              level: profile.level ?? 1,
              lives: profile.lives ?? 5,
              completedLessons: profile.completed_lessons ?? [],
              currentCourseId: profile.current_course_id ?? 'en_basic',
              state: profile.state ?? 'SP',
              country: profile.country ?? 'Brasil 🇧🇷',
              coins: profile.coins ?? 50,
              avatarMascot: profile.avatar_mascot ?? 'chico',
              plan: profile.plan ?? 'free',
              hasUsedFreeNameChange: profile.has_used_free_name_change ?? false,
              nameChangeCards: profile.name_change_cards ?? 0,
              activeBanner: profile.active_banner ?? 'banner_classic',
              unlockedBanners: uniqueBanners
            });
          }
        } catch (err) {
          console.error("Erro ao carregar perfil do Supabase:", err);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole('user');
        setUserEmail('');
        setUserName('');
        setCurrentUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getFriendlyAuthErrorMessage = (err: any): string => {
    const isNetworkError =
      err instanceof TypeError ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('fetch'));

    if (isNetworkError) {
      return "Não foi possível conectar. Verifique sua internet e tente novamente.";
    }

    return err?.message || "Ocorreu um erro inesperado. Tente novamente.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail || !formPassword) {
      setAuthError("Por favor, preencha todos os campos!");
      return;
    }

    if (!isSupabaseConfigured) {
      console.error('[Auth] Tentativa de login com Supabase não configurado.', {
        isSupabaseConfigured,
      });
      setAuthError("Não foi possível conectar ao servidor. Tente novamente em instantes ou contate o suporte.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formEmail,
        password: formPassword
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthSuccess("Conectado com sucesso! Carregando seu perfil...");
      setFormEmail('');
      setFormPassword('');
    } catch (err: any) {
      console.error('[Auth] Falha ao fazer login:', {
        message: err?.message,
        isSupabaseConfigured,
      });
      setAuthError(getFriendlyAuthErrorMessage(err));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail || !formPassword || !formName) {
      setAuthError("Por favor, preencha todos os campos!");
      return;
    }

    if (!isSupabaseConfigured) {
      console.error('[Auth] Tentativa de cadastro com Supabase não configurado.', {
        isSupabaseConfigured,
      });
      setAuthError("Não foi possível conectar ao servidor. Tente novamente em instantes ou contate o suporte.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: {
            name: formName
          }
        }
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      // Com a confirmação de e-mail desativada no Supabase, o signUp já retorna
      // uma sessão ativa imediatamente — este é o caminho principal esperado.
      if (data.session) {
        setAuthSuccess("Conta criada com sucesso! Carregando...");
        const user = data.user;
        if (user) {
          await supabase.from('profiles').update({
            state: formState,
            country: formCountry
          }).eq('id', user.id);
        }
      } else {
        // Fallback de segurança, caso a confirmação de e-mail seja reativada no futuro.
        setAuthSuccess("Cadastro efetuado! Por favor, verifique sua caixa de e-mail para confirmar a conta.");
      }

      setFormEmail('');
      setFormPassword('');
      setFormName('');
    } catch (err: any) {
      console.error('[Auth] Falha ao criar conta:', {
        message: err?.message,
        isSupabaseConfigured,
      });
      setAuthError(getFriendlyAuthErrorMessage(err));
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail) {
      setAuthError("Por favor, digite seu e-mail!");
      return;
    }

    if (!isSupabaseConfigured) {
      console.error('[Auth] Tentativa de recuperação de senha com Supabase não configurado.', {
        isSupabaseConfigured,
      });
      setAuthError("Não foi possível conectar ao servidor. Tente novamente em instantes ou contate o suporte.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthSuccess("Se o e-mail estiver cadastrado, um link de recuperação de senha foi enviado para " + formEmail + "!");
      setFormEmail('');
    } catch (err: any) {
      console.error('[Auth] Falha ao solicitar recuperação de senha:', {
        message: err?.message,
        isSupabaseConfigured,
      });
      setAuthError(getFriendlyAuthErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsLoggedIn(false);
    setUserRole('user');
    setActiveTab('home');
  };

  const handleStartLesson = (lesson: Lesson) => {
    if (userProgress.plan !== 'premium' && userProgress.lives <= 0) {
      alert("Você está sem vidas! 🥺\n\nNo plano Gratuito, você tem um limite de 5 vidas. Suas vidas se regeneram em +1 a cada 20 minutos, ou você pode obter um Kit de Vida Extra na Loja usando suas Moedas de Sorte!");
      setActiveTab('shop');
      return;
    }

    // Deep clone the lesson and shuffle questions and options
    const shuffledLesson: Lesson = {
      ...lesson,
      questions: shuffleArray(
        lesson.questions.map((q) => {
          if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
            return {
              ...q,
              options: shuffleArray(q.options),
            };
          }
          return { ...q };
        })
      ),
    };

    setActiveLesson(shuffledLesson);
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

      setUserProgress(prev => {
        const nextLives = prev.plan === 'premium' ? 999999 : Math.min(5, prev.lives);
        return {
          ...prev,
          xp: newXp,
          completedLessons: newCompleted,
          level: newLevel,
          streak: newStreak,
          coins: newCoins,
          lives: nextLives
        };
      });
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

    if (userProgress.plan !== 'premium' && userProgress.lives <= 0) {
      alert("Você está sem vidas! 🥺\n\nNo plano Gratuito, você tem um limite de 5 vidas. Suas vidas se regeneram em +1 a cada 20 minutos, ou você pode obter um Kit de Vida Extra na Loja usando suas Moedas de Sorte!");
      setActiveTab('shop');
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
      console.warn("Erro na geração de lição de IA:", e);
      setAiError("Ocorreu uma falha na requisição da IA no Supabase. Verifique se a Edge Function está implantada.");
    } finally {
      setGeneratingAiLesson(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 font-sans text-slate-800 flex flex-col items-center justify-center p-4 md:p-8 antialiased">
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
                "Oi! Eu sou o <strong>Chico</strong>, seu companheiro Yorkshire super leal! Pronto para brincar com minha bolinha rosa e aprender um novo idioma hoje?"
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

  const renderNavigationMenu = () => {
    return (
      <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-2xs space-y-5">
        <div>
          <span className="text-xs font-black text-slate-800 flex items-center gap-2">
            <span>🗺️</span> Menu de Navegação Rápida
          </span>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            Navegue pelas principais seções do Falla a partir do seu perfil de estudante!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {/* 1. Sua Conta Group */}
          <div className="bg-slate-50/50 border-2 border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>👤</span> Sua Conta
              </span>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                Gerencie o seu progresso, mochila, avatar e dados de perfil.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'profile', label: 'Perfil', icon: User, color: 'text-sky-500', activeClass: 'bg-sky-500 text-white border-b-4 border-sky-700', inactiveClass: 'bg-sky-50 text-sky-700 border-2 border-sky-200 hover:bg-sky-100/50', active: activeTab === 'profile', action: () => setActiveTab('profile') },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.active ? item.activeClass : item.inactiveClass
                  }`}
                >
                  <item.icon size={11} className={item.active ? 'text-white' : item.color} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Aprendizado Group */}
          <div className="bg-slate-50/50 border-2 border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>📚</span> Aprendizado
              </span>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                Acesse trilhas de estudo, aulas de gramática e conheça os mascotes!
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'home', label: 'Início', icon: Home, color: 'text-falla-green', activeClass: 'bg-falla-green text-white border-b-4 border-green-700', inactiveClass: 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100/50', active: activeTab === 'home', action: () => setActiveTab('home') },
                { id: 'learn', label: 'Estudo', icon: BookOpen, color: 'text-teal-500', activeClass: 'bg-teal-600 text-white border-b-4 border-teal-800', inactiveClass: 'bg-teal-50 text-teal-700 border-2 border-teal-200 hover:bg-teal-100/50', active: activeTab === 'learn', action: () => setActiveTab('learn') },
                { id: 'grammar', label: 'Gramática', icon: BookOpen, color: 'text-violet-500', activeClass: 'bg-violet-600 text-white border-b-4 border-violet-800', inactiveClass: 'bg-violet-50 text-violet-700 border-2 border-violet-200 hover:bg-violet-100/50', active: activeTab === 'grammar', action: () => setActiveTab('grammar') },
                { id: 'mascots', label: 'Mascotes', icon: Award, color: 'text-falla-pink', activeClass: 'bg-falla-pink text-white border-b-4 border-pink-700', inactiveClass: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800', active: activeTab === 'mascots', action: () => setActiveTab('mascots') },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.active ? item.activeClass : item.inactiveClass
                  }`}
                >
                  <item.icon size={11} className={item.active ? 'text-white' : item.color} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Progresso & Social Group */}
          <div className="bg-slate-50/50 border-2 border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏆</span> Progresso & Social
              </span>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                Acompanhe o seu desempenho comparado a outros alunos e veja as suas conquistas alcançadas!
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { 
                  id: 'leaderboard', 
                  label: 'Ranking', 
                  icon: Trophy, 
                  color: 'text-falla-yellow', 
                  activeClass: 'bg-amber-500 text-white border-b-4 border-amber-700', 
                  inactiveClass: 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100/50', 
                  active: false, 
                  action: () => {
                    const el = document.getElementById('progresso-social-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-4', 'ring-amber-400/50', 'transition-all', 'duration-500');
                      setTimeout(() => {
                        el.classList.remove('ring-4', 'ring-amber-400/50');
                      }, 1500);
                    }
                  } 
                },
                { 
                  id: 'achievements', 
                  label: 'Conquistas', 
                  icon: Award, 
                  color: 'text-violet-500', 
                  activeClass: 'bg-violet-600 text-white border-b-4 border-violet-800', 
                  inactiveClass: 'bg-violet-50 text-violet-700 border-2 border-violet-200 hover:bg-violet-100/50', 
                  active: false, 
                  action: () => {
                    const el = document.getElementById('progresso-social-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-4', 'ring-amber-400/50', 'transition-all', 'duration-500');
                      setTimeout(() => {
                        el.classList.remove('ring-4', 'ring-amber-400/50');
                      }, 1500);
                    }
                  } 
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.active ? item.activeClass : item.inactiveClass
                  }`}
                >
                  <item.icon size={11} className={item.active ? 'text-white' : item.color} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Loja & Economia Group */}
          <div className="bg-slate-50/50 border-2 border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛍️</span> Loja & Economia
              </span>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                Adquira capas de perfil, novos mascotes ou assine nossos planos.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'shop', label: 'Loja', icon: ShoppingBag, color: 'text-amber-500', activeClass: 'bg-amber-500 text-white border-b-4 border-amber-700', inactiveClass: 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100/50', active: activeTab === 'shop', action: () => setActiveTab('shop') },
                { id: 'plans', label: 'Planos', icon: CreditCard, color: 'text-falla-pink', activeClass: 'bg-falla-pink text-white border-b-4 border-pink-700', inactiveClass: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800', active: activeTab === 'plans', action: () => setActiveTab('plans') },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.active ? item.activeClass : item.inactiveClass
                  }`}
                >
                  {item.id === 'shop' ? (
                    <GoldCoinIcon className="w-3.5 h-3.5" />
                  ) : (
                    <item.icon size={11} className={item.active ? 'text-white' : item.color} />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Mais Recursos Group */}
          <div className="bg-slate-50/50 border-2 border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>✨</span> Mais Recursos
              </span>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                Explore recursos extras de demonstração e ferramentas de desenvolvedor.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'more', label: 'Mais', icon: Menu, color: 'text-slate-500', activeClass: 'bg-slate-700 text-white border-b-4 border-slate-900', inactiveClass: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800', active: activeTab === 'more', action: () => setActiveTab('more'), show: true },
                { id: 'ai-tutor', label: 'Tutor IA', icon: Brain, color: 'text-falla-blue', activeClass: 'bg-falla-blue text-white border-b-4 border-sky-700', inactiveClass: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800', active: activeTab === 'ai-tutor', action: () => setActiveTab('ai-tutor'), show: userRole === 'admin' },
                { id: 'admin', label: 'Admin', icon: Settings, color: 'text-falla-orange', activeClass: 'bg-falla-orange text-white border-b-4 border-orange-700', inactiveClass: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800', active: activeTab === 'admin', action: () => setActiveTab('admin'), show: userRole === 'admin' },
                { id: 'architecture', label: 'Stack', icon: Trophy, color: 'text-falla-yellow', activeClass: 'bg-amber-600 text-white border-b-4 border-amber-800', inactiveClass: 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800', active: activeTab === 'architecture', action: () => setActiveTab('architecture'), show: userRole === 'admin' },
              ].filter(item => item.show).map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    item.active ? item.activeClass : item.inactiveClass
                  }`}
                >
                  <item.icon size={11} className={item.active ? 'text-white' : item.color} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      
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
            userLives={userProgress.lives}
            userPlan={userProgress.plan || 'free'}
            onLoseLife={() => {
              setUserProgress(prev => {
                if (prev.plan === 'premium') return prev;
                const nextLives = Math.max(0, prev.lives - 1);
                const nextRegen = prev.lives === 5 ? Date.now() : prev.lastLifeRegenTime;
                return {
                  ...prev,
                  lives: nextLives,
                  lastLifeRegenTime: nextRegen
                };
              });
            }}
          />
        </div>
      )}

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-24 flex flex-col gap-6 animate-fade-in">

        {activeTab === 'home' ? (
          /* Portal/Hub Page (Página Inicial) */
          <div className="space-y-6">

            {/* Elegant Header Banner Card (Nome do usuário, Banner do perfil, Nível e Dias de Ofensiva) */}
            {(() => {
              const activeBannerId = userProgress.activeBanner || 'banner_classic';
              const activeBannerObj = PROFILE_BANNERS.find(b => b.id === activeBannerId) || PROFILE_BANNERS[0];
              return (
                <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xs relative">
                  {/* Banner background style */}
                  <div 
                    style={{ background: activeBannerObj.imageUrl }} 
                    className="h-28 sm:h-32 w-full relative transition-all duration-300"
                  />
                  {/* Stats and name Overlay */}
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative -mt-10 sm:-mt-12 z-10">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white bg-sky-50 shadow-md flex items-center justify-center shrink-0">
                        <img 
                          src={
                            userProgress.avatarMascot === 'lico' ? licoMascot :
                            userProgress.avatarMascot === 'teddy' ? teddyMascot :
                            userProgress.avatarMascot === 'luna' ? lunaMascot :
                            chicoMascot
                          } 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1.5 drop-shadow-sm break-words">
                          Olá, {userName}! 👋
                        </h1>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider truncate">
                          Nível {userProgress.level} • Estudante do {selectedCourse?.name || 'Falla'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Level and Streak Badges */}
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
                      <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-3xs">
                        <span className="text-xl">🏆</span>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Nível</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">Lvl {userProgress.level}</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-3xs">
                        <span className="text-xl">🔥</span>
                        <div>
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider leading-none">Ofensiva</p>
                          <p className="text-sm font-black text-amber-800 mt-0.5">{userProgress.streak} {userProgress.streak === 1 ? 'Dia' : 'Dias'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Trilha de Progresso (Estilo Duolingo) */}
            {selectedCourse ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 md:p-6 shadow-2xs">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-slate-50 p-2 rounded-2xl border-2 border-slate-200 shadow-3xs">
                      {selectedCourse.flag}
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-slate-800 leading-tight">
                        Trilha de {selectedCourse.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                        Seu Progresso Diário (Estudo Principal)
                      </p>
                    </div>
                  </div>
                  {/* Dynamic Flag selector inside the trail container to easily switch studying language */}
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourseId(c.id)}
                        className={`p-1.5 rounded-xl text-sm transition-all cursor-pointer ${
                          selectedCourseId === c.id
                            ? 'bg-white shadow-xs scale-105'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        title={c.name}
                      >
                        {c.flag}
                      </button>
                    ))}
                  </div>
                </div>

                <ProgressTrail
                  selectedCourse={selectedCourse}
                  userProgress={userProgress}
                  onStartLesson={handleStartLesson}
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center">
                <p className="text-slate-500 text-xs font-bold">Nenhum curso disponível para visualização.</p>
              </div>
            )}

            {/* Path Selector - 5 beautiful big pages cards (COMMENTED OUT FOR VISUAL VALIDATION) */}
            {/*
            <div className="space-y-4">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>🎯</span> Escolha a sua Atividade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
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
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-orange transition-colors font-sans">Painel Admin</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Gerencie cursos, dicas, regras de negócios e integrações por este centro de controle.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-orange group-hover:translate-x-1 transition-transform">
                    Acessar Painel <ChevronRight size={14} />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('architecture')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-yellow rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-yellow-100 group-hover:bg-falla-yellow text-slate-950 group-hover:text-slate-950 rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
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

                <div 
                  onClick={() => setActiveTab('profile')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-blue rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-sky-100 group-hover:bg-falla-blue text-falla-blue group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      👤
                    </div>
                    <span className="text-[10px] bg-sky-50 text-falla-blue font-black px-2 py-0.5 rounded-full">ESTATÍSTICAS</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-blue transition-colors">Seu Perfil</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Veja suas conquistas de XP, configure sua conta, altere seu avatar de mascote favorito e acompanhe sua evolução!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-blue group-hover:translate-x-1 transition-transform">
                    Ver Meu Perfil <ChevronRight size={14} />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('shop')}
                  className="bg-white border-2 border-slate-200 hover:border-amber-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-500 rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-2xs">
                      <GoldCoinIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-black px-2 py-0.5 rounded-full">LOJA DE COINS</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-amber-500 transition-colors font-sans">Loja de Itens</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Troque suas Moedas por incríveis Poções de XP extras para subir de nível muito mais rápido!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-amber-500 group-hover:translate-x-1 transition-transform">
                    Visitar Loja <ChevronRight size={14} />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('plans')}
                  className="bg-white border-2 border-slate-200 hover:border-falla-pink rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-purple-100 group-hover:bg-falla-pink text-falla-pink group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                      ⭐
                    </div>
                    <span className="text-[10px] bg-purple-50 text-falla-pink font-black px-2 py-0.5 rounded-full">BENEFÍCIOS EXCLUSIVOS</span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-pink transition-colors">Assinatura Premium</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Tenha vidas infinitas, zero anúncios, tutor de IA totalmente liberado para falar e lições ilimitadas!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-pink group-hover:translate-x-1 transition-transform">
                    Ver Planos <ChevronRight size={14} />
                  </div>
                </div>

              </div>
            </div>
            */}
          </div>
        ) : (
          /* Sub-Pages Container (Cada tela individual e espaçosa com botão de voltar) */
          <div className="space-y-6 animate-fade-in">
            {/* Upper Navigation Bar with back button - hidden on Profile screen */}
            {activeTab !== 'profile' && (
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
                    <span className="text-xl flex items-center">
                      {activeTab === 'learn' && '📖'}
                      {activeTab === 'ai-tutor' && '🧠'}
                      {activeTab === 'mascots' && '🦉'}
                      {activeTab === 'admin' && '⚙️'}
                      {activeTab === 'architecture' && '🏛️'}
                      {activeTab === 'profile' && '👤'}
                      {activeTab === 'shop' && <GoldCoinIcon className="w-5 h-5" />}
                      {activeTab === 'plans' && '⭐'}
                      {activeTab === 'leaderboard' && '🏆'}
                      {activeTab === 'more' && '✨'}
                      {activeTab === 'grammar' && '📝'}
                    </span>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {activeTab === 'learn' && 'Estudo Diário'}
                      {activeTab === 'ai-tutor' && 'Tutor de IA'}
                      {activeTab === 'mascots' && 'Nossos Mascotes'}
                      {activeTab === 'admin' && 'Painel Administrativo'}
                      {activeTab === 'architecture' && 'Arquitetura & Stack'}
                      {activeTab === 'profile' && 'Perfil do Estudante'}
                      {activeTab === 'shop' && 'Loja de Recompensas'}
                      {activeTab === 'plans' && 'Planos de Assinatura'}
                      {activeTab === 'leaderboard' && 'Ranking Regional'}
                      {activeTab === 'more' && 'Mais Recursos'}
                      {activeTab === 'grammar' && 'Aulas de Gramática'}
                    </h2>
                  </div>
                </div>
              </div>
            )}

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
                {/* 1. ESTUDO DIÁRIO VIEW */}
                {activeTab === 'learn' && (
                  <div className="max-w-4xl mx-auto space-y-5 w-full animate-fade-in">
                    
                    {/* Course Selector, Modules & Lessons */}
                    <div className="space-y-5">
                      {/* Interactive Flags Header */}
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Idioma de Estudo Ativo:</span>
                        <div className="flex flex-wrap gap-2">
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
                                          onClick={() => handleStartLesson(les)}
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
                    {userRole === 'admin' ? (
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
                    ) : (
                      <div className="p-8 text-center max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center text-red-500 mx-auto text-2xl shadow-sm">
                          🔒
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Acesso Restrito</h3>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          Apenas usuários com a função de <strong className="text-slate-700">Administrador</strong> real (configurada no banco de dados) podem visualizar o Painel de Controle e alterar as configurações globais do aplicativo Falla.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ARQUITETURA & STACK VIEW */}
                {activeTab === 'architecture' && (
                  <div className="animate-fade-in">
                    {userRole === 'admin' ? (
                      <ArchitectureCenter />
                    ) : (
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
                        <div className="p-8 text-center max-w-md mx-auto space-y-4">
                          <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center text-red-500 mx-auto text-2xl shadow-sm">
                            🔒
                          </div>
                          <h3 className="text-lg font-black text-slate-800">Acesso Restrito</h3>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">
                            A documentação da Arquitetura do Falla é restrita a administradores e desenvolvedores autorizados.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. TUTOR DE IA VIEW */}
                {activeTab === 'ai-tutor' && (
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in">
                    {userRole === 'admin' ? (
                      <>
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
                      </>
                    ) : (
                      <div className="p-8 text-center max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center text-red-500 mx-auto text-2xl shadow-sm">
                          🔒
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Acesso Restrito</h3>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          O Tutor Inteligente de IA com geração em tempo real é um recurso exclusivo de demonstração restrito a administradores.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. PERFIL VIEW */}
                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
                      {/* Active Profile Banner */}
                      {(() => {
                        const activeBannerId = userProgress.activeBanner || 'banner_classic';
                        const activeBannerObj = PROFILE_BANNERS.find(b => b.id === activeBannerId) || PROFILE_BANNERS[0];
                        return (
                          <div 
                            style={{ background: activeBannerObj.imageUrl }} 
                            className="h-32 sm:h-40 w-full relative transition-all duration-300"
                          />
                        );
                      })()}
                      
                      {/* User Avatar, Details & Stats */}
                      <div className="p-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-14 md:-mt-16 z-10 text-center md:text-left">
                        {/* Selected Mascot Portrait */}
                        <div className="relative shrink-0">
                          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-sky-50 shadow-md flex items-center justify-center">
                            <img 
                              src={
                                userProgress.avatarMascot === 'lico' ? licoMascot :
                                userProgress.avatarMascot === 'teddy' ? teddyMascot :
                                userProgress.avatarMascot === 'luna' ? lunaMascot :
                                chicoMascot
                              } 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="absolute bottom-1 right-1 bg-falla-blue text-white w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-black shadow-sm">
                            ★
                          </span>
                        </div>

                        <div className="space-y-2 flex-1 w-full">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2 md:pt-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xl font-black text-slate-800">{userName}</h3>
                              <button 
                                onClick={handleOpenEditNameModal}
                                title="Alterar Nome de Usuário"
                                className="text-slate-400 hover:text-falla-blue p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                            <span className="bg-falla-blue/10 text-falla-blue text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-falla-blue/20">
                              Plano {userProgress.plan === 'premium' ? '👑 Premium' : 'Free'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-bold">
                            Estudante ativo em <strong className="text-slate-600">{userProgress.state || 'SP'}</strong>, {userProgress.country || 'Brasil 🇧🇷'}
                          </p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                            <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 text-center">
                              <span className="block text-xl">🔥</span>
                              <span className="block text-xs font-black text-slate-800">{userProgress.streak} Dias</span>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Ofensiva</span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 text-center">
                              <span className="block text-xl">💎</span>
                              <span className="block text-xs font-black text-slate-800">{userProgress.xp}/100 XP</span>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Experiência</span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                              <GoldCoinIcon className="w-6 h-6 mb-1" />
                              <span className="block text-xs font-black text-slate-800">{userProgress.coins || 0}</span>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Moedas</span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 text-center">
                              <span className="block text-xl">🏆</span>
                              <span className="block text-xs font-black text-slate-800">Lvl {userProgress.level}</span>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Nível</span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                              <span className="block text-xl">❤️</span>
                              <span className="block text-xs font-black text-slate-800">
                                {userProgress.plan === 'premium' ? 'Ilimitadas 👑' : `${userProgress.lives}/5`}
                              </span>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase">
                                Vidas {userProgress.plan !== 'premium' && userProgress.lives < 5 && lifeCountdownStr ? `(${lifeCountdownStr})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 🎒 Mochila (Inventário) */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🎒</span> Sua Mochila de Recompensas
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          Veja os itens e vantagens virtuais que você já adquiriu na Loja de Recompensas!
                        </p>
                      </div>

                      {isLoggedIn ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {/* Banner Items */}
                          {userProgress.unlockedBanners && userProgress.unlockedBanners.filter(b => b !== 'banner_classic' && b !== 'banner_pastel').length > 0 ? (
                            userProgress.unlockedBanners.filter(b => b !== 'banner_classic' && b !== 'banner_pastel').map(bannerId => {
                              const bannerObj = PROFILE_BANNERS.find(b => b.id === bannerId);
                              if (!bannerObj) return null;
                              return (
                                <div key={bannerId} className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 relative">
                                  <span className="text-2xl">🎨</span>
                                  <span className="block text-xs font-black text-slate-800">{bannerObj.name}</span>
                                  <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">Capa</span>
                                </div>
                              );
                            })
                          ) : null}

                          {/* Name Cards */}
                          {userProgress.nameChangeCards && userProgress.nameChangeCards > 0 ? (
                            <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-3 flex flex-col items-center text-center space-y-2">
                              <span className="text-2xl">🏷️</span>
                              <span className="block text-xs font-black text-slate-800">Alteração de Nome</span>
                              <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                                {userProgress.nameChangeCards} Unidades
                              </span>
                            </div>
                          ) : null}

                          {/* If no items */}
                          {!userProgress.nameChangeCards && (!userProgress.unlockedBanners || userProgress.unlockedBanners.filter(b => b !== 'banner_classic' && b !== 'banner_pastel').length === 0) && (
                            <div className="col-span-full py-6 text-center space-y-2">
                              <span className="text-4xl">📭</span>
                              <p className="text-xs text-slate-400 font-bold">Sua mochila está vazia. Visite a Loja para comprar itens!</p>
                              <button onClick={() => setActiveTab('shop')} className="bg-falla-blue text-white px-4 py-2 rounded-xl text-xs font-black uppercase border-b-4 border-b-sky-700 hover:bg-sky-400 transition-all cursor-pointer">
                                Ir para a Loja
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 text-center space-y-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                          <span className="text-4xl">🔒</span>
                          <p className="text-xs text-slate-400 font-bold">Faça login com o Supabase Auth para ter uma mochila persistente e durável!</p>
                        </div>
                      )}
                    </div>

                    {/* 🏆 Progresso & Social (Leaderboards and Achievements) */}
                    <div id="progresso-social-section" className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 transition-all duration-500">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🏆</span> Progresso & Social
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          Acompanhe o seu desempenho comparado a outros alunos e veja as suas conquistas alcançadas!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Leaderboard Column */}
                        <div className="space-y-4">
                          <h5 className="font-black text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📊</span> Ranking de Estudantes
                          </h5>
                          <Leaderboard 
                            userId={currentUserId}
                            userXp={userProgress.xp} 
                            userStreak={userProgress.streak}
                            userState={userProgress.state}
                            userCountry={userProgress.country}
                          />
                        </div>

                        {/* Achievements Column */}
                        <div className="space-y-4">
                          <h5 className="font-black text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy size={14} className="text-falla-yellow" /> Conquistas Ativas
                          </h5>
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
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

                    {/* Navigation Menu inside Profile Tab, positioned below User Profile, Bolsa, and Progresso & Social */}
                    <div className="pt-4">
                      {renderNavigationMenu()}
                    </div>

                    {/* Choose Mascot Avatar Grid */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🎭</span> Escolha o seu Mascote de Avatar
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          O mascote selecionado será exibido como seu avatar oficial de estudos no cabeçalho e páginas da Falla!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { id: 'chico', name: 'Chico, o Yorkshire', desc: 'Companheiro fiel, corajoso e super brincalhão. Tem pelos sedosos dourados e cinzas, ama correr atrás da sua bolinha rosa favorita e tem o maior coração do mundo!', img: chicoMascot, color: 'border-falla-green' },
                          { id: 'lico', name: 'Lico, o Leãozinho', desc: 'Corajoso e entusiasmado, ruge de felicidade com suas conquistas.', img: licoMascot, color: 'border-falla-orange' },
                          { id: 'teddy', name: 'Teddy, o Ursinho', desc: 'Calmo, fofinho e acolhedor, auxilia na hora das dúvidas difíceis.', img: teddyMascot, color: 'border-falla-blue' },
                          { id: 'luna', name: 'Luna, a Coruja', desc: 'Altamente inteligente e sábia, ama ler livros e desvendar mistérios.', img: lunaMascot, color: 'border-falla-pink' },
                        ].map((m) => {
                          const isSelected = userProgress.avatarMascot === m.id;
                          return (
                            <div 
                              key={m.id}
                              onClick={() => {
                                setUserProgress(prev => ({ ...prev, avatarMascot: m.id }));
                              }}
                              className={`bg-slate-50 border-2 rounded-2xl p-4 text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between ${
                                isSelected ? `${m.color} bg-white shadow-md ring-2 ring-opacity-25 ring-offset-2` : 'border-slate-200'
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 mx-auto bg-white flex items-center justify-center">
                                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-xs font-black text-slate-800">{m.name}</h5>
                                  <p className="text-[10px] font-bold text-slate-400 leading-normal">{m.desc}</p>
                                </div>
                              </div>
                              <div className="pt-3">
                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 bg-falla-green text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                    <Check size={10} /> Selecionado
                                  </span>
                                ) : (
                                  <span className="inline-block bg-slate-200 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase hover:bg-slate-300">
                                    Usar Avatar
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Choose Profile Banner Grid */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🎨</span> Capa de Perfil
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          Personalize seu perfil com um banner elegante! Banners bloqueados podem ser comprados usando suas moedas de recompensa.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PROFILE_BANNERS.map((banner) => {
                          const isUnlocked = (userProgress.unlockedBanners || []).includes(banner.id) || banner.unlockedByDefault;
                          const isActive = userProgress.activeBanner === banner.id;
                          const canAfford = (userProgress.coins || 0) >= banner.price;

                          return (
                            <div 
                              key={banner.id}
                              onClick={() => {
                                if (isUnlocked) {
                                  setUserProgress(prev => ({ ...prev, activeBanner: banner.id }));
                                } else {
                                  if (!canAfford) {
                                    alert(`Você não tem moedas suficientes para comprar o banner "${banner.name}". Complete mais lições para ganhar moedas!`);
                                    return;
                                  }
                                  const confirmPurchase = window.confirm(`Deseja comprar o banner "${banner.name}" por ${banner.price} moedas?`);
                                  if (confirmPurchase) {
                                    setUserProgress(prev => ({
                                      ...prev,
                                      coins: Math.max(0, (prev.coins || 0) - banner.price),
                                      unlockedBanners: [...(prev.unlockedBanners || []), banner.id],
                                      activeBanner: banner.id
                                    }));
                                    purchaseItemInDatabase(banner.id, 'banner');
                                    alert(`Sucesso! Você comprou e equipou o banner "${banner.name}"!`);
                                  }
                                }
                              }}
                              className={`bg-slate-50 border-2 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between space-y-3 ${
                                isActive ? 'border-falla-blue bg-white shadow-md ring-2 ring-opacity-25 ring-offset-2' : 'border-slate-200'
                              } ${!isUnlocked ? 'opacity-85' : ''}`}
                            >
                              <div className="space-y-2">
                                {/* Banner Preview */}
                                <div 
                                  style={{ background: banner.imageUrl }} 
                                  className="h-16 w-full rounded-xl shadow-xs border border-slate-100 flex items-center justify-center relative overflow-hidden"
                                >
                                  {!isUnlocked && (
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                      <span className="bg-slate-900/80 text-white p-1.5 rounded-full">
                                        <Lock size={14} />
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-black text-slate-800">{banner.name}</h5>
                                  {!isUnlocked && (
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                      <GoldCoinIcon className="w-3.5 h-3.5" /> {banner.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="pt-1 text-center">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 bg-falla-blue text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                    <Check size={10} /> Ativo
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="inline-block bg-slate-200 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase hover:bg-slate-300">
                                    Equipar
                                  </span>
                                ) : (
                                  <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                                    canAfford ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}>
                                    Comprar Banner
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 🎨 Tema de Cores do Aplicativo */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 animate-fade-in">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🎨</span> Tema do Aplicativo
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          Personalize as cores principais da interface do seu Falla!
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(themesList).map(([id, t]) => (
                          <button
                            key={id}
                            onClick={() => {
                              setTheme(id);
                              localStorage.setItem('falla_theme', id);
                            }}
                            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black transition-all cursor-pointer border-2 ${
                              theme === id 
                                ? 'bg-falla-blue/5 border-falla-blue text-falla-blue ring-2 ring-falla-blue/25' 
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{t.name}</span>
                            <div className="flex gap-1 shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: t.green }} />
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: t.blue }} />
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: t.yellow }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 7. LOJA VIEW */}
                {activeTab === 'shop' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Loja Coin balance banner */}
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-3xl p-6 shadow-md border-b-4 border-amber-600 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                      <div className="space-y-1">
                        <span className="bg-slate-900/10 text-slate-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-900/15">
                          Troque suas Moedas por Vantagens! 🪙
                        </span>
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                          <span>🏪</span> Loja de Recompensas Falla
                        </h3>
                        <p className="text-xs font-bold text-amber-950 leading-relaxed max-w-lg">
                          Use suas Moedas de Sorte acumuladas completando lições para adquirir poções mágicas e poderes especiais!
                        </p>
                      </div>

                      <div className="bg-slate-900/10 px-5 py-3 rounded-2xl border border-slate-900/10 flex items-center gap-2.5 text-center">
                        <GoldCoinIcon className="w-10 h-10 animate-bounce shrink-0" />
                        <div>
                          <span className="block text-xl font-black">{userProgress.coins || 0}</span>
                          <span className="text-[9px] font-extrabold uppercase tracking-wide">Suas Moedas</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Buy Store Items Section */}
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🧪</span> Poções & Vantagens Especiais
                        </h4>
                        
                        <div className="space-y-3">
                          {[
                            { id: 'xp_boost', name: 'Poção de Super XP', desc: 'Consuma para receber instantaneamente +50 XP extras na sua conta!', cost: 20, icon: '🧪', benefit: '+50 XP' },
                            { id: 'extra_life', name: 'Kit de Vida Extra', desc: 'Recarrega 1 vida para que você continue estudando sem parar!', cost: 10, icon: '❤️', benefit: '+1 Vida' },
                            { id: 'streak_shield', name: 'Escudo Protetor', desc: 'Protege e mantém sua ofensiva diária ativa por mais 1 dia!', cost: 30, icon: '🛡️', benefit: 'Proteção' },
                            { id: 'name_card', name: 'Cartão de Alteração de Nome', desc: 'Permite alterar seu nome de usuário no seu Perfil!', cost: 15, icon: '🏷️', benefit: 'Item Especial' },
                          ].map((item) => {
                            const canAfford = (userProgress.coins || 0) >= item.cost;
                            return (
                              <div key={item.id} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center border-2 border-slate-150 shadow-2xs shrink-0">{item.icon}</span>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h5 className="text-xs font-black text-slate-800">{item.name}</h5>
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">{item.benefit}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 leading-normal mt-0.5">{item.desc}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (!canAfford) {
                                      alert('Moedas insuficientes! Complete mais lições para ganhar moedas!');
                                      return;
                                    }
                                    
                                    setUserProgress(prev => {
                                      let newXp = prev.xp;
                                      let newLives = prev.lives;
                                      let newCoins = (prev.coins || 0) - item.cost;
                                      let newLevel = prev.level;
                                      let nameChangeCards = prev.nameChangeCards || 0;
                                      
                                      if (item.id === 'xp_boost') {
                                        newXp += 50;
                                        if (newXp >= 100) {
                                          newXp = newXp - 100;
                                          newLevel += 1;
                                        }
                                      } else if (item.id === 'extra_life') {
                                        newLives = Math.min(prev.lives + 1, 5);
                                      } else if (item.id === 'name_card') {
                                        nameChangeCards += 1;
                                      }
                                      
                                      return {
                                        ...prev,
                                        xp: newXp,
                                        lives: newLives,
                                        coins: newCoins,
                                        level: newLevel,
                                        nameChangeCards: nameChangeCards
                                      };
                                    });
                                    alert(`Sucesso! Você comprou: ${item.name}!`);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shrink-0 border-b-4 uppercase flex items-center gap-1 ${
                                    canAfford 
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 border-b-amber-600 active:translate-y-0.5' 
                                      : 'bg-slate-200 text-slate-400 border-b-slate-300 cursor-not-allowed'
                                  }`}
                                >
                                  <span className="flex items-center gap-1">
                                    <GoldCoinIcon className="w-4.5 h-4.5" />
                                    <span>{item.cost}</span>
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Coin Packages Section */}
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>💳</span> Recarregar Moedas (Compra Simulada)
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold leading-normal">
                          Acabaram as suas moedas? Adquira pacotes de moedas simulados de forma divertida para testar a integração de pagamentos!
                        </p>

                        <div className="space-y-3">
                          {[
                            { id: 'pack_100', name: 'Saco de 100 Moedas', price: 'R$ 9,90', coins: 100, icon: '💰', popular: false },
                            { id: 'pack_500', name: 'Baú de 500 Moedas', price: 'R$ 29,90', coins: 500, icon: '📦', popular: true },
                          ].map((pack) => (
                            <div key={pack.id} className={`border-2 rounded-2xl p-4 flex items-center justify-between gap-4 relative ${pack.popular ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 bg-slate-50'}`}>
                              {pack.popular && (
                                <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-900 text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                                  Mais Vendido ★
                                </span>
                              )}
                              <div className="flex items-center gap-3">
                                <span className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center border-2 border-slate-150 shadow-2xs shrink-0">{pack.icon}</span>
                                <div>
                                  <h5 className="text-xs font-black text-slate-800">{pack.name}</h5>
                                  <p className="text-[10px] font-bold text-slate-400 leading-normal mt-0.5">Adiciona +{pack.coins} moedas de sorte à sua conta</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setUserProgress(prev => ({
                                    ...prev,
                                    coins: (prev.coins || 0) + pack.coins
                                  }));
                                  alert(`Compra Simulada de ${pack.name} efetuada com sucesso! Adicionado +${pack.coins} moedas!`);
                                }}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black border-b-4 border-b-slate-950 active:translate-y-0.5 transition-all cursor-pointer uppercase"
                              >
                                {pack.price}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. PLANOS DE ASSINATURA VIEW */}
                {activeTab === 'plans' && (
                  <div className="space-y-6 animate-fade-in">
                    {!checkoutPlan ? (
                      <>
                        {/* Plans Hero Banner */}
                        <div className="bg-gradient-to-r from-falla-pink to-purple-600 text-white rounded-3xl p-6 md:p-8 shadow-md border-b-4 border-purple-700 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                          <div className="space-y-2">
                            <span className="bg-white/25 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                              Eleve Seus Estudos ao Máximo! ⭐
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                              Seja Membro Falla Premium 👑
                            </h2>
                            <p className="text-xs md:text-sm font-bold text-purple-100 leading-relaxed max-w-xl">
                              Remova todos os obstáculos e aprenda inglês e espanhol muito mais rápido com lições geradas ilimitadamente pela Inteligência Artificial do Gemini!
                            </p>
                          </div>
                          
                          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0 text-center max-w-xs self-stretch md:self-center">
                            <span className="block text-3xl font-black">👑</span>
                            <span className="block text-xs font-black uppercase tracking-wide text-falla-yellow mt-1">Super Benefícios</span>
                            <span className="text-[10px] text-purple-200 font-bold leading-normal">Infinitos corações, sem anúncios e muito mais!</span>
                          </div>
                        </div>

                        {/* Plan Comparison Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                          {/* Plano Free Card */}
                          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between relative">
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                  Básico
                                </span>
                                <h4 className="text-base font-black text-slate-800">Falla Gratuito</h4>
                                <p className="text-xl font-black text-slate-700">R$ 0 <span className="text-xs text-slate-400 font-bold">/ sempre</span></p>
                              </div>
                              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                Plano padrão com recursos básicos essenciais para começar sua jornada linguística de forma descontraída.
                              </p>
                              <div className="h-px bg-slate-100" />
                              <ul className="space-y-2 text-[11px] font-bold text-slate-600">
                                <li className="flex items-center gap-2">❌ Limite de 5 vidas diárias</li>
                                <li className="flex items-center gap-2">❌ Anúncios ocasionais entre lições</li>
                                <li className="flex items-center gap-2">❌ Apenas 3 consultas ao Tutor de IA</li>
                                <li className="flex items-center gap-2">✔️ Acesso completo aos caminhos básicos</li>
                              </ul>
                            </div>
                            
                            <div className="pt-6">
                              {userProgress.plan !== 'premium' ? (
                                <button className="w-full bg-slate-100 text-slate-500 font-black text-xs py-3 rounded-xl border border-slate-200 cursor-not-allowed uppercase" disabled>
                                  Plano Atual Ativo
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setUserProgress(prev => ({ ...prev, plan: 'free' }));
                                    alert('Você alterou seu plano para o Gratuito.');
                                  }}
                                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-3 rounded-xl border border-slate-200 cursor-pointer uppercase transition-all"
                                >
                                  Mudar para Gratuito
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Plano Premium Card */}
                          <div className="bg-white border-4 border-falla-pink rounded-3xl p-6 shadow-md space-y-4 flex flex-col justify-between relative">
                            <span className="absolute -top-3.5 right-6 bg-falla-pink text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                              Mais Recomendado ★
                            </span>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <span className="bg-purple-100 text-falla-pink text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                  Completo & Ilimitado
                                </span>
                                <h4 className="text-base font-black text-slate-800">Falla Premium</h4>
                                <p className="text-xl font-black text-falla-pink">R$ 14,90 <span className="text-xs text-slate-400 font-bold">/ mensal</span></p>
                              </div>
                              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                Desbloqueie todo o poder de aprendizado da Falla. Ideal para estudantes dedicados que buscam fluência rápida.
                              </p>
                              <div className="h-px bg-slate-100" />
                              <ul className="space-y-2 text-[11px] font-bold text-slate-600">
                                <li className="flex items-center gap-2">💚 Vidas infinitas para treinar sem parar</li>
                                <li className="flex items-center gap-2">🚫 Zero anúncios para total foco</li>
                                <li className="flex items-center gap-2">🧠 Tutor de IA (Gemini) 100% ILIMITADO</li>
                                <li className="flex items-center gap-2">👑 Distintivo Dourado de Membro Fundador</li>
                              </ul>
                            </div>
                            
                            <div className="pt-6">
                              {userProgress.plan === 'premium' ? (
                                <button className="w-full bg-falla-green text-white font-black text-xs py-3 rounded-xl border-b-4 border-b-emerald-600 cursor-not-allowed uppercase flex items-center justify-center gap-1.5" disabled>
                                  <Check size={14} /> Assinatura Ativa
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setCheckoutPlan({ id: 'premium_monthly', name: 'Assinatura Falla Premium Mensal', price: 'R$ 14,90 / mês' })}
                                  className="w-full bg-falla-pink hover:bg-falla-pink/90 text-white font-black text-xs py-3 rounded-xl border-b-4 border-b-purple-600 hover:scale-[1.01] active:translate-y-0.5 transition-all cursor-pointer uppercase flex items-center justify-center gap-1"
                                >
                                  Assinar Falla Premium
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Interactive Simulation Billing screen */
                      <div className="max-w-md mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between border-b pb-4">
                          <div>
                            <h4 className="text-sm font-black text-slate-800">Checkout Seguro Simulado</h4>
                            <p className="text-[10px] text-slate-400 font-bold">Teste nosso fluxo de pagamento de forma segura!</p>
                          </div>
                          <button 
                            onClick={() => setCheckoutPlan(null)}
                            className="text-slate-400 hover:text-slate-600 font-extrabold text-xs uppercase cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>

                        {/* Order Summary banner */}
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black text-slate-700">{checkoutPlan.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Cobrança Mensal Recorrente</p>
                          </div>
                          <p className="text-sm font-black text-falla-pink">{checkoutPlan.price}</p>
                        </div>

                        {/* Simulated Credit card fields */}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          setUserProgress(prev => ({ ...prev, plan: 'premium' }));
                          setCheckoutPlan(null);
                          alert('Parabéns! Sua Assinatura Falla Premium foi ativada com sucesso! Você agora tem corações infinitos, zero anúncios e tutor inteligente liberado!');
                        }} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nome no Cartão</label>
                            <input 
                              type="text" 
                              required
                              placeholder="Ex: JOÃO DA SILVA" 
                              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 uppercase outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Número do Cartão de Crédito</label>
                            <input 
                              type="text" 
                              required
                              maxLength={19}
                              placeholder="4000 1234 5678 9010" 
                              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Validade</label>
                              <input 
                                type="text" 
                                required
                                maxLength={5}
                                placeholder="MM/AA" 
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">CVC / Código</label>
                              <input 
                                type="text" 
                                required
                                maxLength={4}
                                placeholder="123" 
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none text-center"
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-150 p-3 rounded-2xl text-[10px] text-blue-800 leading-normal font-bold">
                            🔒 <strong>Ambiente de Sandbox Seguro:</strong> Nenhuma cobrança real será feita no seu cartão de crédito. Este é um checkout simulado de alta fidelidade.
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black text-xs py-3.5 rounded-xl border-b-4 border-b-emerald-600 hover:scale-[1.01] active:translate-y-0.5 transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5"
                          >
                            Confirmar Pagamento Simulado
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 10. MAIS ATIVIDADES VIEW */}
                {activeTab === 'more' && (
                  <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <span>✨</span> Mais Atividades & Recursos
                      </h2>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                        Explore os incríveis recursos de gamificação e aprendizado inteligente do FALLA!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* A. Gramática */}
                      <div 
                        onClick={() => setActiveTab('grammar')}
                        className="bg-white border-2 border-slate-200 hover:border-violet-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-violet-100 group-hover:bg-violet-500 text-violet-500 group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                            📝
                          </div>
                          <span className="text-[10px] bg-violet-50 text-violet-600 font-black px-2 py-0.5 rounded-full">NOVAS AULAS</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-violet-500 transition-colors">Aulas de Gramática</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                          Aprenda as regras fundamentais para estruturar frases em inglês, com lições explicativas, exemplos e práticas exclusivas!
                        </p>
                      </div>

                      {/* B. Tutor de IA */}
                      {userRole === 'admin' && (
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
                        </div>
                      )}

                      {/* B. Nossos Mascotes */}
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
                      </div>

                      {/* C. Painel Admin */}
                      {userRole === 'admin' && (
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
                        </div>
                      )}

                      {/* D. Arquitetura & Stack */}
                      {userRole === 'admin' && (
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
                          <h4 className="text-base font-black text-slate-800 group-hover:text-falla-yellow transition-colors">Arquitetura & Stack</h4>
                          <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                            Veja o plano detalhado de engenharia, arquitetura de banco, segurança de dados LGPD e o fluxo de publicação oficial.
                          </p>
                        </div>
                      )}

                      {/* E. Sair da Conta */}
                      <div 
                        onClick={handleLogout}
                        className="bg-white border-2 border-slate-200 hover:border-red-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-red-50 group-hover:bg-red-500 text-red-500 group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold border border-red-100">
                            🚪
                          </div>
                          <span className="text-[10px] bg-red-100 text-red-700 font-black px-2 py-0.5 rounded-full">SESSÃO</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-red-500 transition-colors">Sair da Conta</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                          Desconectar da conta com segurança e de forma limpa, permitindo alternar perfis de usuários.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. GRAMÁTICA VIEW */}
                {activeTab === 'grammar' && (
                  <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
                    {!selectedGrammarTopic ? (
                      <>
                        {/* Main Grammar Landing */}
                        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-2">
                          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <span>📝</span> Aulas de Gramática Estrutural
                          </h2>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Domine os fundamentos essenciais para construir frases e se comunicar com confiança!
                          </p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Cada aula traz explicações rápidas e didáticas, seguidas de exercícios interativos de fixação. Ao praticar e concluir as aulas, você ganhará recompensas de XP e Moedas de Sorte!
                          </p>
                        </div>

                        {/* Grid of Topics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {GRAMMAR_LESSONS.map((lesson) => {
                            const isCompleted = userProgress.completedLessons.includes(lesson.id);
                            return (
                              <div 
                                key={lesson.id}
                                onClick={() => setSelectedGrammarTopic(lesson)}
                                className="bg-white border-2 border-slate-200 hover:border-violet-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-violet-100 group-hover:bg-violet-500 text-violet-500 group-hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-2xs font-bold">
                                      📄
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[9px] bg-violet-50 text-violet-600 font-black px-2 py-0.5 rounded-full">
                                        ⚡ {lesson.xpReward} XP
                                      </span>
                                      {isCompleted && (
                                        <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
                                          ✓ Concluída
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <h4 className="text-sm font-black text-slate-800 group-hover:text-violet-500 transition-colors font-sans">
                                    {lesson.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-1 font-bold">
                                    {lesson.topic}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                                    {lesson.description}
                                  </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-black text-violet-500 group-hover:translate-x-1 transition-transform">
                                  <span>Ver Aula & Exemplos</span>
                                  <ChevronRight size={14} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      /* Individual Grammar Lesson Detail View */
                      <div className="space-y-6 animate-fade-in">
                        {/* Detail Header */}
                        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <button 
                              onClick={() => setSelectedGrammarTopic(null)}
                              className="text-xs font-black text-violet-500 hover:text-violet-600 flex items-center gap-1 transition-all"
                            >
                              <ArrowLeft size={12} /> Voltar para a lista de tópicos
                            </button>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 mt-1">
                              <span className="text-xl">📝</span> {selectedGrammarTopic.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                              Tópico: {selectedGrammarTopic.topic}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
                            <span className="text-[10px] bg-violet-100 text-violet-800 font-black px-2.5 py-1 rounded-full">
                              ⚡ Concede {selectedGrammarTopic.xpReward} XP
                            </span>
                            {userProgress.completedLessons.includes(selectedGrammarTopic.id) && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full border border-emerald-200">
                                ✓ Já Concluída
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detail Core Grid (Explanation + Examples) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Explanation Card */}
                          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b pb-2">
                              <span>💡</span> Explicação Prática
                            </h4>
                            <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4">
                              <p className="text-xs text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                                {selectedGrammarTopic.explanation}
                              </p>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                              <p className="font-bold text-slate-500">Dica dos Mascotes:</p>
                              <p>Leia os exemplos em voz alta para acostumar sua fala e audição. A repetição cria conexões neurais fortíssimas para fluência!</p>
                            </div>
                          </div>

                          {/* Examples Card */}
                          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
                            <div className="space-y-4">
                              <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b pb-2">
                                <span>🌟</span> Exemplos para Memorizar
                              </h4>
                              <div className="space-y-3">
                                {selectedGrammarTopic.examples.map((example, i) => {
                                  // Parse: "English Sentence. (Portuguese Translation.)"
                                  const parts = example.split('(');
                                  const english = parts[0]?.trim() || example;
                                  const portuguese = parts[1] ? parts[1].replace(')', '').trim() : '';

                                  return (
                                    <div 
                                      key={i}
                                      className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-center justify-between group/ex hover:bg-slate-100/50 transition-all"
                                    >
                                      <div className="space-y-1 flex-1">
                                        <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                          <span>🇬🇧</span> {english}
                                        </p>
                                        {portuguese && (
                                          <p className="text-[11px] font-bold text-slate-400">
                                            🇧🇷 {portuguese}
                                          </p>
                                        )}
                                      </div>
                                      <button 
                                        title="Ouvir Pronúncia"
                                        onClick={() => {
                                          // Simple web speech synthesis for immersive audio
                                          if ('speechSynthesis' in window) {
                                            const utterance = new SpeechSynthesisUtterance(english);
                                            utterance.lang = 'en-US';
                                            window.speechSynthesis.speak(utterance);
                                          } else {
                                            alert("Seu navegador não suporta síntese de fala offline.");
                                          }
                                        }}
                                        className="text-slate-400 hover:text-violet-500 p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-pointer shadow-none hover:shadow-xs"
                                      >
                                        <Volume2 size={16} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Start Practice Action */}
                            <div className="pt-4 border-t border-slate-100">
                              <button
                                onClick={() => handleStartLesson(selectedGrammarTopic)}
                                className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black text-xs py-3.5 rounded-2xl border-b-4 border-b-green-700 hover:scale-[1.01] active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5 shadow-md"
                              >
                                <span>🚀</span> Iniciar Exercícios de Fixação
                              </button>
                            </div>

                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>

      {/* Footer credits */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[10px] text-slate-400 font-semibold tracking-wide mt-auto mb-16">
        {interfaceTexts.app_footer || "FALLA App Co. © 2026. Feito com tecnologia React Native e IA para democratizar o aprendizado de idiomas de forma divertida."}
      </footer>

      {/* Fixed bottom navigation (Duolingo style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200 shadow-xl py-2 px-4 flex justify-around items-center select-none pb-safe">
        {[
          { id: 'home', label: 'Início', icon: Home, color: 'text-falla-green' },
          { id: 'shop', label: 'Loja', icon: Gift, color: 'text-amber-500' },
          { id: 'profile', label: 'Perfil', icon: User, color: 'text-falla-blue' },
          { id: 'more', label: 'Mais', icon: Menu, color: 'text-falla-pink' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-slate-100/80 scale-105' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <Icon 
                size={22} 
                className={`transition-colors duration-200 ${
                  isActive ? `${item.color} stroke-[3.5]` : 'text-slate-400 stroke-[2]'
                }`} 
              />
              <span 
                className={`text-[9px] font-black uppercase tracking-wider mt-1 transition-colors duration-200 ${
                  isActive ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Edit Username Modal */}
      {isEditNameModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl max-w-sm w-full space-y-4 relative animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>🏷️</span> Alterar Nome
              </h4>
              <button 
                onClick={() => setIsEditNameModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-1 text-xs">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Método Disponível:</span>
                {!userProgress.hasUsedFreeNameChange ? (
                  <span className="text-falla-green font-black">Gratuito (1 Restante)</span>
                ) : (
                  <span className="text-amber-600 font-black">Cartão de Nome ({userProgress.nameChangeCards || 0} Disponíveis)</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-normal">
                {!userProgress.hasUsedFreeNameChange 
                  ? "Você tem direito a uma troca de nome gratuita na sua conta!" 
                  : "Sua troca gratuita já foi utilizada. Cada nova alteração consome 1 Cartão de Alteração de Nome."}
              </p>
            </div>

            <form onSubmit={handleConfirmNameChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Novo Nome de Usuário</label>
                <input 
                  type="text" 
                  required
                  value={tempNewName}
                  onChange={(e) => setTempNewName(e.target.value)}
                  placeholder="Seu novo nome" 
                  maxLength={20}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none transition-all"
                />
                <p className="text-[9px] font-bold text-slate-400 mt-1">Entre 3 e 20 caracteres.</p>
              </div>

              {nameChangeError && (
                <p className="text-[11px] font-black text-falla-red leading-normal bg-red-50 p-2.5 rounded-xl border border-red-150">
                  ⚠️ {nameChangeError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black text-xs py-3 rounded-xl border-b-4 border-b-sky-700 hover:scale-[1.01] active:translate-y-0.5 transition-all cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                Confirmar Alteração
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chico Floating Widget with interactive open/close and absolute removal options */}
      {!isChicoRemoved && (
        <motion.div 
          drag
          dragMomentum={false}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 select-none pointer-events-auto cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <AnimatePresence>
            {showChicoBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 15 }}
                className="bg-white border-2 border-amber-300 rounded-2xl p-3.5 shadow-xl max-w-xs relative pointer-events-auto cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Speech tail */}
                <div className="absolute bottom-[-10px] right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-amber-300 rotate-45" />
                
                {/* Close speech bubble button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChicoBubble(false);
                  }}
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-lg transition-colors"
                  title="Fechar Mensagem"
                >
                  <X size={14} />
                </button>
                
                {/* Content */}
                <div className="pr-4">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>🐾</span> Chico diz:
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 leading-normal">
                    "Au au! Olá, {userName}! 👋 Bem-vindo à sua jornada de idiomas • Pratique diariamente para manter seu ritmo! Além disso, estou de olho: quem mantiver a ofensiva hoje ganha um petisco e adesivos virtuais do Chico! Escolha uma lição abaixo!"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chico Avatar Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative pointer-events-auto cursor-pointer"
            onClick={() => setShowChicoBubble(!showChicoBubble)}
          >
            {/* Absolute close button to REMOVE chico entirely */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsChicoRemoved(true);
              }}
              className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full border border-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
              title="Remover Chico da Tela"
            >
              <X size={10} strokeWidth={3} />
            </button>

            {/* Glowing Ring with avatar */}
            <div className="w-16 h-16 rounded-full border-4 border-white bg-amber-50 shadow-2xl flex items-center justify-center ring-4 ring-amber-400/50 animate-pulse-slow overflow-hidden">
              <img 
                src={chicoMascot} 
                alt="Chico" 
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Click info badge */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
              Arraste-me!
            </span>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
