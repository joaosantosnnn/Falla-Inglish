import React, { useEffect, useRef, useState } from 'react';
import chicoMascot from './assets/images/chico_mascot_flat_vector_1784399850056.jpg';
import licoMascot from './assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from './assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from './assets/images/luna_mascot_1784292067117.jpg';
import { Course, Lesson, UserProgress, API_BASE_URL, LearningTip, Achievement, AiTutorConfig, QuestionType, Mascot } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { getAuthRedirectUrl, openGoogleOAuth, registerMobileAuthListener } from './lib/mobileAuth';
import { fallbackCourses } from './lib/fallbackCourses';
import { filterEnabledCourses, filterCoursesWithCachedAvailability, saveCourseAvailabilityCache } from './services/languageAvailability';
import LessonPlayer from './components/LessonPlayer';
import Leaderboard from './components/Leaderboard';
import SocialHub from './components/SocialHub';
import FloatingFriendsChat from './components/FloatingFriendsChat';
import MascotCard from './components/MascotCard';
import AdminPanel from './components/AdminPanel';
import PremiumLearningHub from './components/PremiumLearningHub';
import PremiumAnalyticsDashboard from './components/PremiumAnalyticsDashboard';
import MissionCenter from './components/MissionCenter';
import { recordLessonAttempt } from './services/premiumLearningService';
import { recordLessonSession } from './services/analyticsService';
import { registerMissionActivity } from './services/engagementService';
import { hasPremiumFeature } from './services/premiumService';
import ArchitectureCenter from './components/ArchitectureCenter';
import GoldCoinIcon from './components/GoldCoinIcon';
import { playSound, speak } from './services/soundService';
import { 
  BookOpen, Trophy, Sparkles, Award, User, Flame, Settings, 
  ChevronRight, Brain, Globe, MessageSquare, AlertCircle, Plus,
  LogOut, Lock, Mail, KeyRound, ArrowLeft, LogIn, ShoppingBag, Palette, CreditCard, Check,
  Home, Gift, Menu, Edit, Volume2, X, Trash2, Users, Camera, ImagePlus, UserRoundSearch, Move, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProgressTrail from './components/ProgressTrail';
import { MANUAL_LESSONS } from './data/manualLessons';
import { shuffleArray } from './utils/shuffle';
import { PROFILE_BANNERS, ProfileBanner } from './data/banners';
import { GRAMMAR_LESSONS, GrammarLesson } from './data/grammarLessons';
import { loadShopConfig, saveShopConfig, ShopConfig } from './services/shopConfig';
import VoiceSetupModal from './components/VoiceSetupModal';
import LocalLanguageModal from './components/LocalLanguageModal';
import { APP_LOCALES, getLocalLanguage } from './services/localePreferences';
import { initializePushNotifications } from './services/pushNotificationService';


const isImageProfileBanner = (background: string) => /^url\(/i.test(background.trim());

const getProfileBannerImageUrl = (background: string) => {
  const match = background.match(/^url\(["']?(.+?)["']?\)/i);
  return match?.[1] || '';
};

const profileBannerStyle = (banner: ProfileBanner, adjustment?: { x: number; y: number; zoom: number }): React.CSSProperties => {
  if (!adjustment || !isImageProfileBanner(banner.imageUrl)) return { background: banner.imageUrl };
  const imageUrl = getProfileBannerImageUrl(banner.imageUrl);
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundPosition: `${adjustment.x}% ${adjustment.y}%`,
    backgroundSize: `${adjustment.zoom}% auto`,
    backgroundRepeat: 'no-repeat',
  };
};

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
  app_footer: "FALLA App Co. © 2026. Aprendizado de idiomas de forma divertida e interativa.",
  ai_tutor_welcome: "Digite qualquer tema que venha à sua cabeça (ex: \"comprar frutas na feira\", \"jogando futebol no parque\", \"viagem espacial\") e o FALLA criará uma lição interativa, completa e personalizada em segundos!"
};

const defaultAiTutorConfig: AiTutorConfig = {
  id: "main_config",
  prompt_template: "Você é um professor de idiomas amigável para crianças. Gere uma lição sobre {topic} no idioma {language} no formato JSON especificado.",
  default_topic: "Pedir uma pizza"
};

// Helper to inject manual lessons into the English course
// IMPORTANTE: esta função NÃO deve mais sobrescrever os módulos reais vindos do Supabase.
// Ela usa os módulos/lições já existentes no banco (course.modules) e só completa
// o roteiro com módulos "placeholder" (Em breve) para os que ainda não foram criados.
const injectManualLessons = (coursesList: Course[]): Course[] => {
  if (!coursesList) return [];
  return coursesList.map(course => {
    if (course.id === 'en_basic') {
      // Preserva os módulos reais vindos do banco de dados (Supabase)
      const dbModules = (course.modules || []).map(m => {
        // Fallback: só usa as lições manuais hardcoded se o Módulo 1 ainda não tiver
        // nenhuma lição salva de verdade no banco.
        if (m.id === 'en_mod_1' && (!m.lessons || m.lessons.length === 0)) {
          return { ...m, lessons: MANUAL_LESSONS };
        }
        return m;
      });

      const existingIds = new Set(dbModules.map(m => m.id));

      // Roteiro de módulos "Em breve" - só entram na lista se ainda não existirem no banco
      const roadmapPlaceholders = [
        { id: "en_mod_2", title: "Módulo 2 - Comida e Compras", description: "Vocabulário sobre restaurantes, mercados e compras (Em breve)." },
        { id: "en_mod_3", title: "Módulo 3 - Viagens e Lugares", description: "Se vire em aeroportos, hotéis e nas ruas (Em breve)." },
        { id: "en_mod_4", title: "Módulo 4 - Trabalho e Estudos", description: "Expressões de e-mail, reuniões e entrevistas (Em breve)." },
        { id: "en_mod_5", title: "Módulo 5 - Saúde e Emergências", description: "Como pedir ajuda e ir ao médico (Em breve)." },
        { id: "en_mod_6", title: "Módulo 6 - Lazer e Social", description: "Hobbies, planos com amigos e esportes (Em breve)." },
        { id: "en_mod_7", title: "Módulo 7 - Tecnologia e Comunicação", description: "Celular, redes sociais e wifi (Em breve)." },
        { id: "en_mod_8", title: "Módulo 8 - Diversos", description: "Temas divertidos e imaginativos de encerramento (Em breve)." }
      ]
        .filter(p => !existingIds.has(p.id))
        .map(p => ({ ...p, lessons: [] as Lesson[] }));

      return {
        ...course,
        modules: [...dbModules, ...roadmapPlaceholders]
      };
    }
    return course;
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'mascots' | 'admin' | 'architecture' | 'ai-tutor' | 'profile' | 'shop' | 'plans' | 'leaderboard' | 'friends' | 'more' | 'grammar' | 'premium-tools' | 'analytics' | 'missions'>('home');
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState<GrammarLesson | null>(null);

  // Dynamic Profile Banners State (Default pre-configured + Custom admin-created)
  const [banners, setBanners] = useState<ProfileBanner[]>(() => {
    const savedCustom = localStorage.getItem('falla_custom_banners');
    let customList: ProfileBanner[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch (e) {
        console.warn("Erro ao carregar banners customizados:", e);
      }
    }
    return [...PROFILE_BANNERS, ...customList];
  });

  // Dynamic Mascots State (Default pre-configured + Custom admin-created)
  const [mascots, setMascots] = useState<Mascot[]>(() => {
    const savedCustom = localStorage.getItem('falla_custom_mascots');
    let customList: Mascot[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch (e) {
        console.warn("Erro ao carregar mascotes customizados:", e);
      }
    }

    const defaultMascots: Mascot[] = [
      { id: 'chico', name: 'Chico, o Yorkshire', trait: 'Companheiro fiel, corajoso e super brincalhão. Tem pelos sedosos dourados e cinzas, ama correr atrás da sua bolinha rosa favorita e tem o maior coração do mundo!', role: 'Guia de Boas-Vindas', quote: 'Au au! Sempre que você acertar uma pergunta, imagine que está jogando minha bolinha rosa favorita para mim! Continue assim, estou torcendo por você!', avatarUrl: chicoMascot, styleColor: 'from-emerald-400 to-green-500', emoji: '🐶' },
      { id: 'lico', name: 'Lico (O Livro Tagarela)', trait: 'Sábio, curioso e super brincalhão.', role: 'Guia Principal & Tutor de Gramática.', quote: 'Cada página lida é um novo mundo descoberto! Sabia que falar mais de um idioma exercita o cérebro igual ginástica?', avatarUrl: licoMascot, styleColor: 'from-blue-400 to-indigo-500', emoji: '📖' },
      { id: 'teddy', name: 'Teddy (O Ursinho Acolhedor)', trait: 'Calmo, carinhoso e extremamente paciente.', role: 'Guardião de Erros e Motivação.', quote: 'Errar faz parte de aprender, amiguinho! Eu te dou um abraço quentinho de pelúcia e tentamos de novo juntas, ok?', avatarUrl: teddyMascot, styleColor: 'from-amber-400 to-orange-500', emoji: '🧸' },
      { id: 'luna', name: 'Luna (A Coruja do Streak)', trait: 'Determinada, focada e amante de café.', role: 'Protetora de Ofensivas (Streaks) & Conforto.', quote: 'Não deixe a chama apagar! Apenas 5 minutinhos de foco hoje garantem o seu futuro brilhando amanhã!', avatarUrl: lunaMascot, styleColor: 'from-purple-400 to-pink-500', emoji: '🦉' }
    ];

    return [...defaultMascots, ...customList];
  });

  const [isMascotSelectorOpen, setIsMascotSelectorOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAddCustomMascot = (newMascot: Mascot) => {
    setMascots(prev => {
      const filtered = prev.filter(m => m.id !== newMascot.id);
      const updated = [...filtered, newMascot];
      return updated;
    });

    const savedCustom = localStorage.getItem('falla_custom_mascots');
    let customList: Mascot[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch (e) {}
    }
    customList = customList.filter(m => m.id !== newMascot.id);
    customList.push(newMascot);
    localStorage.setItem('falla_custom_mascots', JSON.stringify(customList));
  };

  const handleDeleteCustomMascot = (mascotId: string) => {
    setMascots(prev => prev.filter(m => m.id !== mascotId));

    const savedCustom = localStorage.getItem('falla_custom_mascots');
    if (savedCustom) {
      try {
        let customList: Mascot[] = JSON.parse(savedCustom);
        customList = customList.filter(m => m.id !== mascotId);
        localStorage.setItem('falla_custom_mascots', JSON.stringify(customList));
      } catch (e) {}
    }
  };

  const handleAddCustomBanner = (newBanner: ProfileBanner) => {
    setBanners(prev => {
      const updated = [...prev, newBanner];
      return updated;
    });
    
    // Save to localStorage
    const savedCustom = localStorage.getItem('falla_custom_banners');
    let customList: ProfileBanner[] = [];
    if (savedCustom) {
      try {
        customList = JSON.parse(savedCustom);
      } catch (e) {}
    }
    customList.push(newBanner);
    localStorage.setItem('falla_custom_banners', JSON.stringify(customList));
  };

  const handleDeleteCustomBanner = (bannerId: string) => {
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    
    // Remove from localStorage
    const savedCustom = localStorage.getItem('falla_custom_banners');
    if (savedCustom) {
      try {
        let customList: ProfileBanner[] = JSON.parse(savedCustom);
        customList = customList.filter(b => b.id !== bannerId);
        localStorage.setItem('falla_custom_banners', JSON.stringify(customList));
      } catch (e) {}
    }
  };

  const getMascotImage = (mascotId: string | undefined) => {
    const id = mascotId || 'chico';
    if (id === 'chico') return chicoMascot;
    if (id === 'lico') return licoMascot;
    if (id === 'teddy') return teddyMascot;
    if (id === 'luna') return lunaMascot;
    
    // Find in mascots state
    const found = mascots.find(m => m.id === id);
    if (found) {
      return found.avatarUrl || found.imageUrl || null;
    }
    return chicoMascot;
  };

  const resizeAvatarImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const size = 512;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;

          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Não foi possível preparar a imagem.'));
            return;
          }

          const sourceSize = Math.min(image.width, image.height);
          const sourceX = (image.width - sourceSize) / 2;
          const sourceY = (image.height - sourceSize) / 2;

          context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            size,
            size
          );

          canvas.toBlob(
            blob => {
              if (blob) resolve(blob);
              else reject(new Error('Não foi possível converter a imagem.'));
            },
            'image/webp',
            0.82
          );
        };

        image.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
        image.src = String(reader.result);
      };

      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
    });

  const handleAvatarFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarMessage('Escolha uma imagem JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage('A foto deve ter no máximo 5 MB.');
      return;
    }

    setAvatarUploading(true);
    setAvatarMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('Faça login novamente para enviar uma foto.');
      }

      const resizedBlob = await resizeAvatarImage(file);
      const storagePath = `${session.user.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(storagePath, resizedBlob, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(storagePath);

      const versionedUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: versionedUrl,
          avatar_type: 'photo',
          avatar_value: versionedUrl,
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      setAvatarUrl(versionedUrl);
      setIsAvatarMenuOpen(false);
      setAvatarMessage('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      setAvatarMessage(
        `Não foi possível enviar a foto: ${error?.message || error}`
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    setAvatarUploading(true);
    setAvatarMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('Sessão não encontrada.');
      }

      const storagePath = `${session.user.id}/avatar.webp`;

      await supabase.storage
        .from('profile-photos')
        .remove([storagePath]);

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          avatar_type: 'mascot',
          avatar_value: userProgress.avatarMascot || 'chico',
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setAvatarUrl(null);
      setIsAvatarMenuOpen(false);
      setAvatarMessage('Foto removida. Seu mascote voltou a ser exibido.');
    } catch (error: any) {
      setAvatarMessage(
        `Não foi possível remover a foto: ${error?.message || error}`
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const openMascotSelectorFromAvatarMenu = () => {
    setIsAvatarMenuOpen(false);
    setIsMascotSelectorOpen(true);
  };

  const renderAvatarContent = (mascotId: string | undefined) => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Foto de perfil"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }

    const id = mascotId || 'chico';
    const mascotObj = mascots.find(m => m.id === id);
    const imgSource = getMascotImage(id);

    if (imgSource) {
      return (
        <img 
          src={imgSource} 
          alt={mascotObj?.name || "Avatar"} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }

    const styleColor = mascotObj?.styleColor || 'from-blue-400 to-indigo-500';
    const emoji = mascotObj?.emoji || '🐾';
    return (
      <div className={`w-full h-full bg-gradient-to-br ${styleColor} flex items-center justify-center text-3xl`}>
        {emoji}
      </div>
    );
  };
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
  const [activeProfileFrame, setActiveProfileFrame] = useState<string>(() => localStorage.getItem('falla_profile_frame') || 'none');
  const premiumThemeIds = new Set(['cyberpunk', 'ocean', 'sepia', 'royal']);
  const premiumMascotIds = new Set(['teddy', 'luna']);
  const profileFrames = [
    { id: 'none', name: 'Sem moldura', premium: false, style: {} as React.CSSProperties },
    { id: 'sky', name: 'Céu', premium: false, style: { boxShadow: '0 0 0 5px #38bdf8, 0 8px 22px rgba(56,189,248,.28)' } as React.CSSProperties },
    { id: 'royal', name: 'Real', premium: true, style: { boxShadow: '0 0 0 5px #f59e0b, 0 0 0 9px #7c3aed, 0 10px 28px rgba(124,58,237,.38)' } as React.CSSProperties },
    { id: 'aurora', name: 'Aurora', premium: true, style: { boxShadow: '0 0 0 5px #22d3ee, 0 0 0 9px #d946ef, 0 10px 30px rgba(217,70,239,.35)' } as React.CSSProperties },
    { id: 'neon', name: 'Neon', premium: true, style: { boxShadow: '0 0 0 5px #00f0ff, 0 0 22px #ff00ff, 0 0 38px rgba(0,240,255,.65)' } as React.CSSProperties },
  ];
  const selectedProfileFrame = profileFrames.find(frame => frame.id === activeProfileFrame) || profileFrames[0];

  const [showVoiceSetup, setShowVoiceSetup] = useState(false);
  const [showLocalLanguageSetup, setShowLocalLanguageSetup] = useState(false);
  const [localLanguage, setLocalLanguage] = useState<string>(() => getLocalLanguage());
  const [voiceSetupFirstAccess, setVoiceSetupFirstAccess] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; name: string; price: string } | null>(null);

  // Configurações econômicas da loja e dos baús.
  const [shopConfig, setShopConfig] = useState<ShopConfig>(() => loadShopConfig());

  const handleUpdateShopConfig = (nextConfig: ShopConfig) => {
    const savedConfig = saveShopConfig(nextConfig);
    setShopConfig(savedConfig);
  };

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [userName, setUserName] = useState<string>('Estudante');
  const [userEmail, setUserEmail] = useState<string>('');
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
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const authProfileLoadRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !profileLoaded) return;
    const completed = localStorage.getItem('falla_voice_onboarding_completed') === 'true';
    if (!completed) {
      setVoiceSetupFirstAccess(true);
      setShowVoiceSetup(true);
    }
  }, [isLoggedIn, profileLoaded]);
  
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
        if (!parsed.bannerAdjustments) parsed.bannerAdjustments = {};
        if (!parsed.lessonStars) parsed.lessonStars = {};
        if (!parsed.lessonBestPercentage) parsed.lessonBestPercentage = {};
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
      lessonStars: {},
      lessonBestPercentage: {},
      currentCourseId: "en_basic",
      state: "SP",
      country: "Brasil 🇧🇷",
      coins: 50,
      avatarMascot: "chico",
      plan: "free",
      hasUsedFreeNameChange: false,
      nameChangeCards: 0,
      unlockedBanners: ["banner_classic", "banner_pastel"],
      activeBanner: "banner_classic",
      bannerAdjustments: {}
    };
  });

  const [isBannerAdjusterOpen, setIsBannerAdjusterOpen] = useState(false);
  const [bannerAdjustmentDraft, setBannerAdjustmentDraft] = useState({ x: 50, y: 50, zoom: 100 });
  const profileBannerAdjusterRef = useRef<HTMLDivElement>(null);
  const profileBannerDragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

  const openBannerAdjuster = () => {
    const bannerId = userProgress.activeBanner || 'banner_classic';
    const saved = userProgress.bannerAdjustments?.[bannerId] || { x: 50, y: 50, zoom: 100 };
    setBannerAdjustmentDraft(saved);
    setIsBannerAdjusterOpen(true);
  };

  const startProfileBannerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    profileBannerDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: bannerAdjustmentDraft.x,
      originY: bannerAdjustmentDraft.y,
    };
  };

  const moveProfileBanner = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = profileBannerDragRef.current;
    const editor = profileBannerAdjusterRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !editor) return;
    const rect = editor.getBoundingClientRect();
    const nextX = Math.max(0, Math.min(100, drag.originX + ((event.clientX - drag.startX) / rect.width) * 100));
    const nextY = Math.max(0, Math.min(100, drag.originY + ((event.clientY - drag.startY) / rect.height) * 100));
    setBannerAdjustmentDraft(current => ({ ...current, x: nextX, y: nextY }));
  };

  const endProfileBannerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (profileBannerDragRef.current?.pointerId === event.pointerId) profileBannerDragRef.current = null;
  };

  const saveProfileBannerAdjustment = () => {
    const bannerId = userProgress.activeBanner || 'banner_classic';
    setUserProgress(prev => ({
      ...prev,
      bannerAdjustments: { ...(prev.bannerAdjustments || {}), [bannerId]: bannerAdjustmentDraft },
    }));
    setIsBannerAdjusterOpen(false);
  };

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
      const progressUpdate: Record<string, unknown> = {
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
        plan_expires_at: progress.planExpiresAt,
        has_used_free_name_change: progress.hasUsedFreeNameChange || false,
        name_change_cards: progress.nameChangeCards || 0,
        active_banner: progress.activeBanner || 'banner_classic'
      };

      // Nome vazio ou padrão nunca deve apagar o nome verdadeiro do perfil.
      const safeName = name?.trim();
      if (safeName && safeName.toLowerCase() !== 'estudante') {
        progressUpdate.name = safeName;
      }

      // O autosave não remove foto. A remoção só acontece pela ação explícita
      // handleRemoveProfilePhoto, que atualiza esses campos diretamente.
      if (avatarUrl) {
        progressUpdate.avatar_type = 'photo';
        progressUpdate.avatar_value = avatarUrl;
        progressUpdate.avatar_url = avatarUrl;
      }

      await supabase
        .from('profiles')
        .update(progressUpdate)
        .eq('id', session.user.id);
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
    // Só sincroniza depois que o perfil real do Supabase terminou de carregar.
    // Isso impede que os valores iniciais locais ("Estudante" e avatar vazio)
    // sobrescrevam o nome e a foto já salvos no banco durante o login.
    if (isLoggedIn && profileLoaded) {
      const timer = setTimeout(() => {
        syncProgressToSupabase(userProgress, userName);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userProgress, userName, isLoggedIn, profileLoaded]);

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
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    muted: string;
    success: string;
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
      border: '#E2E8F0',
      primary: '#78C800',
      primaryLight: '#E8F5E9',
      primaryDark: '#388E3C',
      accent: '#1CB0F6',
      muted: '#94A3B8',
      success: '#78C800'
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
      border: '#334155',
      primary: '#38BDF8',
      primaryLight: '#0F2B48',
      primaryDark: '#0284C7',
      accent: '#D8B4FE',
      muted: '#475569',
      success: '#22C55E'
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
      border: '#FDE68A',
      primary: '#F97316',
      primaryLight: '#FEF3C7',
      primaryDark: '#C2410C',
      accent: '#EC4899',
      muted: '#D97706',
      success: '#10B981'
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
      border: '#E9D5FF',
      primary: '#B197FC',
      primaryLight: '#FAF5FF',
      primaryDark: '#581C87',
      accent: '#BAE6FD',
      muted: '#D8B4FE',
      success: '#A7F3D0'
    },
    cyberpunk: {
      name: 'Neon Cyberpunk ⚡',
      green: '#00FF66',
      blue: '#00F0FF',
      yellow: '#FF007F',
      orange: '#FF9900',
      red: '#FF003C',
      pink: '#FF00FF',
      bg: '#030712',
      cardBg: '#111827',
      text: '#F9FAFB',
      border: '#1F2937',
      primary: '#FF00FF',
      primaryLight: '#1E002B',
      primaryDark: '#9D009D',
      accent: '#00F0FF',
      muted: '#4B5563',
      success: '#00FF66'
    },
    forest: {
      name: 'Floresta Profunda 🌳',
      green: '#2D6A4F',
      blue: '#52B788',
      yellow: '#D8F3DC',
      orange: '#F3C052',
      red: '#D90429',
      pink: '#B5E2FA',
      bg: '#F1F8F5',
      cardBg: '#FFFFFF',
      text: '#1B4332',
      border: '#D8F3DC',
      primary: '#2D6A4F',
      primaryLight: '#E8F5E9',
      primaryDark: '#1B4332',
      accent: '#52B788',
      muted: '#74C69D',
      success: '#40916C'
    },
    ocean: {
      name: 'Oceano Profundo 🌊',
      green: '#34D399',
      blue: '#0284C7',
      yellow: '#FBBF24',
      orange: '#F97316',
      red: '#EF4444',
      pink: '#EC4899',
      bg: '#F0F9FF',
      cardBg: '#FFFFFF',
      text: '#0369A1',
      border: '#BAE6FD',
      primary: '#0284C7',
      primaryLight: '#E0F2FE',
      primaryDark: '#0369A1',
      accent: '#38BDF8',
      muted: '#7DD3FC',
      success: '#0D9488'
    },
    sepia: {
      name: 'Café Vintage ☕',
      green: '#5F8575',
      blue: '#A88B74',
      yellow: '#E6C594',
      orange: '#C47B49',
      red: '#A94A42',
      pink: '#CAB09A',
      bg: '#F5EBE0',
      cardBg: '#FFFFFF',
      text: '#4E3629',
      border: '#E3D5CA',
      primary: '#6F4E37',
      primaryLight: '#EDDFD3',
      primaryDark: '#3E2723',
      accent: '#D5BDAF',
      muted: '#B7A392',
      success: '#5F8575'
    },
    royal: {
      name: 'Ouro & Rubi Real 👑',
      green: '#10B981',
      blue: '#D946EF',
      yellow: '#F59E0B',
      orange: '#F97316',
      red: '#BE123C',
      pink: '#FB7185',
      bg: '#FFF1F2',
      cardBg: '#FFFFFF',
      text: '#881337',
      border: '#FECDD3',
      primary: '#BE123C',
      primaryLight: '#FFE4E6',
      primaryDark: '#4C0519',
      accent: '#F59E0B',
      muted: '#FDA4AF',
      success: '#10B981'
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
    root.style.setProperty('--theme-primary', selectedTheme.primary);
    root.style.setProperty('--theme-primary-light', selectedTheme.primaryLight);
    root.style.setProperty('--theme-primary-dark', selectedTheme.primaryDark);
    root.style.setProperty('--theme-accent', selectedTheme.accent);
    root.style.setProperty('--theme-muted', selectedTheme.muted);
    root.style.setProperty('--theme-success', selectedTheme.success);
    
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
      console.warn("Erro ao carregar configuração do tutor:", e);
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

  const fetchMascotsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('mascots').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setMascots(prev => {
          const defaults = prev.filter(m => ['chico', 'lico', 'teddy', 'luna'].includes(m.id));
          const dbMascots: Mascot[] = data.map((m: any) => ({
            id: m.id,
            name: m.name,
            trait: m.trait || m.description || '',
            role: m.role || '',
            quote: m.quote || '',
            avatarUrl: m.image_url || undefined,
            idleAnimationUrl: m.idle_animation_url || undefined,
            speakingAnimationUrl: m.speaking_animation_url || undefined,
            correctAnimationUrl: m.correct_animation_url || undefined,
            wrongAnimationUrl: m.wrong_animation_url || undefined,
            lessonSize: m.lesson_size || 150,
            styleColor: m.style_color || 'from-blue-400 to-indigo-500',
            emoji: m.emoji || '🐾'
          }));
          const combined = [...defaults];
          dbMascots.forEach(dbm => {
            const index = combined.findIndex(item => item.id === dbm.id);
            if (index >= 0) {
              combined[index] = dbm;
            } else {
              combined.push(dbm);
            }
          });
          return combined;
        });
      }
    } catch (e) {
      console.warn("Erro ao buscar mascotes do Supabase:", e);
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
        saveCourseAvailabilityCache(mappedCourses);
        const enabledCourses = filterEnabledCourses(mappedCourses);
        setCourses(enabledCourses);
      } else {
        setCourses(filterCoursesWithCachedAvailability(fallbackCourses));
      }
      setLoading(false);
    } catch (e: any) {
      console.warn("Erro ao carregar cursos do Supabase (usando fallback offline):", e);
      setCourses(filterCoursesWithCachedAvailability(fallbackCourses));
      setLoading(false);
    }
  };


  /**
   * Carrega o perfil do usuário autenticado sem sobrescrever dados existentes.
   *
   * Regras:
   * - Perfil existente pelo UID sempre tem prioridade.
   * - Nome/foto do Google só são usados na criação inicial.
   * - Se existir um perfil antigo com o mesmo e-mail e outro UID,
   *   o app interrompe o login em vez de criar um perfil duplicado.
   * - A sincronização de progresso só é liberada depois da hidratação completa.
   */
  const loadAuthenticatedUserProfile = async (session: any) => {
    const user = session?.user;
    if (!user) return;

    // Evita duas cargas simultâneas disparadas pelo mesmo evento de autenticação.
    if (authProfileLoadRef.current === user.id) return;
    authProfileLoadRef.current = user.id;

    setProfileLoaded(false);
    setIsLoggedIn(true);
    setUserEmail(user.email || '');
    setAuthError(null);

    try {
      const normalizedEmail = (user.email || '').trim().toLowerCase();

      const { data: profileById, error: profileByIdError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileByIdError) throw profileByIdError;

      let profile = profileById;

      // Proteção contra contas duplicadas: não cria outro perfil silenciosamente.
      if (!profile && normalizedEmail) {
        const { data: profileByEmail, error: profileByEmailError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', normalizedEmail)
          .maybeSingle();

        if (profileByEmailError) throw profileByEmailError;

        if (profileByEmail && profileByEmail.id !== user.id) {
          throw new Error(
            'Já existe um perfil do FALLA vinculado a este e-mail por outro método de acesso. ' +
            'Entre pela forma usada anteriormente para preservar seus dados. A conta precisa ser vinculada antes de usar este novo login.'
          );
        }
      }

      if (!profile) {
        const metadataName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          normalizedEmail.split('@')[0] ||
          'Estudante';

        const metadataAvatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        const newProfile = {
          id: user.id,
          email: normalizedEmail || null,
          name: metadataName,
          state: 'SP',
          country: 'Brasil 🇧🇷',
          xp: 0,
          streak: 0,
          level: 1,
          lives: 5,
          coins: 50,
          completed_lessons: [],
          current_course_id: 'en_basic',
          avatar_mascot: 'chico',
          avatar_url: metadataAvatar,
          avatar_type: metadataAvatar ? 'photo' : 'mascot',
          avatar_value: metadataAvatar || 'chico',
          role: 'user',
          plan: 'free',
          has_used_free_name_change: false,
          name_change_cards: 0,
          active_banner: 'banner_classic',
        };

        const { data: createdProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .single();

        if (createProfileError) throw createProfileError;
        profile = createdProfile;
      }

      // Nunca substitui um perfil existente com dados do Google.
      // Apenas garante que o e-mail fique preenchido quando estiver vazio.
      if (!profile.email && normalizedEmail) {
        const { data: updatedProfile, error: emailUpdateError } = await supabase
          .from('profiles')
          .update({ email: normalizedEmail })
          .eq('id', user.id)
          .select('*')
          .single();

        if (emailUpdateError) throw emailUpdateError;
        profile = updatedProfile;
      }

      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id);

      if (inventoryError) {
        console.warn('Não foi possível carregar o inventário:', inventoryError);
      }

      const dbBanners = inventory
        ? inventory
            .filter((item: any) => item.item_type === 'banner')
            .map((item: any) => item.item_id)
        : [];

      const uniqueBanners = Array.from(
        new Set(['banner_classic', 'banner_pastel', ...dbBanners])
      );

      setUserRole(profile.role || 'user');
      setUserName(
        profile.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          normalizedEmail.split('@')[0] ||
          'Estudante'
      );

      const savedPhoto =
        profile.avatar_type === 'photo'
          ? profile.avatar_url || profile.avatar_value || null
          : profile.avatar_url || null;

      setAvatarUrl(savedPhoto);

      setUserProgress({
        xp: profile.xp ?? 0,
        streak: profile.streak ?? 0,
        level: profile.level ?? 1,
        lives: profile.lives ?? 5,
        completedLessons: profile.completed_lessons ?? [],
        lessonStars: (() => {
          try {
            const local = JSON.parse(localStorage.getItem('falla_user_progress') || '{}');
            return local.lessonStars || {};
          } catch { return {}; }
        })(),
        lessonBestPercentage: (() => {
          try {
            const local = JSON.parse(localStorage.getItem('falla_user_progress') || '{}');
            return local.lessonBestPercentage || {};
          } catch { return {}; }
        })(),
        currentCourseId: profile.current_course_id ?? 'en_basic',
        state: profile.state ?? 'SP',
        country: profile.country ?? 'Brasil 🇧🇷',
        coins: profile.coins ?? 50,
        avatarMascot: profile.avatar_mascot ?? 'chico',
        plan: profile.plan ?? 'free',
        planExpiresAt: profile.plan_expires_at,
        hasUsedFreeNameChange: profile.has_used_free_name_change ?? false,
        nameChangeCards: profile.name_change_cards ?? 0,
        activeBanner: profile.active_banner ?? 'banner_classic',
        unlockedBanners: uniqueBanners,
      });

      // Só agora o autosave pode voltar a funcionar.
      setProfileLoaded(true);
    } catch (error: any) {
      console.error('Erro ao preparar o perfil autenticado:', error);
      setProfileLoaded(false);
      setAuthError(
        error?.message ||
          'Não foi possível carregar seu perfil. Seus dados não foram alterados.'
      );

      // Evita que uma sessão conflitante crie/sobrescreva dados no perfil errado.
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserRole('user');
      setUserEmail('');
      setUserName('');
      setAvatarUrl(null);
    } finally {
      authProfileLoadRef.current = null;
      setGoogleLoginLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const errorMsg = "Erro ao conectar com o banco de dados: verifique as variáveis de ambiente do Supabase";
      console.info(errorMsg);
      setSupabaseError(errorMsg);
      setCourses(filterCoursesWithCachedAvailability(fallbackCourses));
      setLoading(false);
      return;
    }

    fetchCourses();
    fetchLearningTips();
    fetchAchievements();
    fetchAiTutorConfig();
    fetchInterfaceTexts();
    fetchMascotsFromSupabase();

    // Registra o retorno do Google, confirmação de e-mail e recuperação por deep link.
    let removeMobileAuthListener: (() => void) | undefined;
    void registerMobileAuthListener((message) => {
      setAuthError(message);
      setGoogleLoginLoading(false);
    }).then((removeListener) => {
      removeMobileAuthListener = removeListener;
    });

    // Carrega a sessão atual imediatamente e centraliza toda a hidratação do perfil.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void loadAuthenticatedUserProfile(session);
      }
    });

    // Escuta entradas, saídas e retornos do OAuth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadAuthenticatedUserProfile(session);
        } else {
          setProfileLoaded(false);
          setIsLoggedIn(false);
          setUserRole('user');
          setUserEmail('');
          setUserName('');
          setAvatarUrl(null);
          setGoogleLoginLoading(false);
        }
      }
    );

    // Subscribe to public.push_notifications insertions in real-time
    const pushChannel = supabase
      .channel('realtime_push')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'push_notifications' },
        (payload) => {
          console.log('Nova notificação push recebida em tempo real:', payload.new);
          const { title, body } = payload.new;
          if (title && body) {
            if ("Notification" in window) {
              const showNotification = () => {
                try {
                  new Notification(title, {
                    body: body,
                    icon: '/favicon.ico',
                    tag: 'falla-push-admin'
                  });
                } catch (e) {
                  console.warn("Erro ao instanciar Notification do admin:", e);
                  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then((reg) => {
                      reg.showNotification(title, {
                        body: body,
                        icon: '/favicon.ico',
                        tag: 'falla-push-admin'
                      });
                    });
                  }
                }
              };

              if (Notification.permission === "granted") {
                showNotification();
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then((permission) => {
                  if (permission === "granted") {
                    showNotification();
                  }
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      removeMobileAuthListener?.();
      subscription.unsubscribe();
      supabase.removeChannel(pushChannel);
    };
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setGoogleLoginLoading(true);

    try {
      await openGoogleOAuth();
      setAuthSuccess('Abrindo o login seguro do Google...');
    } catch (error: any) {
      console.error('Erro ao entrar com Google:', error);
      setAuthError(
        error?.message ||
          'Não foi possível abrir o login com Google. Verifique a configuração no Supabase.'
      );
      setGoogleLoginLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!formEmail || !formPassword) {
      setAuthError("Por favor, preencha todos os campos!");
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
      setAuthError(err.message || "Ocorreu um erro ao fazer login.");
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            name: formName
          }
        }
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

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
        setAuthSuccess("Cadastro efetuado! Por favor, verifique sua caixa de e-mail para confirmar a conta.");
      }

      setFormEmail('');
      setFormPassword('');
      setFormName('');
    } catch (err: any) {
      setAuthError(err.message || "Ocorreu um erro ao criar conta.");
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

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formEmail, {
        redirectTo: getAuthRedirectUrl()
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthSuccess("Se o e-mail estiver cadastrado, um link de recuperação de senha foi enviado para " + formEmail + "!");
      setFormEmail('');
    } catch (err: any) {
      setAuthError(err.message || "Ocorreu um erro ao solicitar recuperação.");
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setProfileLoaded(false);
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

  const handleCompleteLesson = (xpEarned: number, coinsEarned: number, correctAnswers: number, totalQuestions: number, questionResults: Array<{ questionId: string; correct: boolean }>, durationSeconds: number) => {
    if (activeLesson) {
      recordLessonAttempt({ courseId: selectedCourseId, lessonId: activeLesson.id, questionResults });
      recordLessonSession({ courseId: selectedCourseId, lessonId: activeLesson.id, durationSeconds, xpEarned, correctAnswers, totalQuestions });
      registerMissionActivity({ lessons: 1, correct_answers: correctAnswers, xp: xpEarned, study_minutes: Math.max(1, Math.round(durationSeconds / 60)) });
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
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const earnedStars = percentage >= 90 ? 3 : percentage >= 75 ? 2 : percentage >= 60 ? 1 : 0;

      setUserProgress(prev => {
        const nextLives = prev.plan === 'premium' ? 999999 : Math.min(5, prev.lives);
        return {
          ...prev,
          xp: newXp,
          completedLessons: newCompleted,
          level: newLevel,
          streak: newStreak,
          coins: newCoins,
          lives: nextLives,
          lessonStars: {
            ...(prev.lessonStars || {}),
            [activeLesson.id]: Math.max(prev.lessonStars?.[activeLesson.id] || 0, earnedStars)
          },
          lessonBestPercentage: {
            ...(prev.lessonBestPercentage || {}),
            [activeLesson.id]: Math.max(prev.lessonBestPercentage?.[activeLesson.id] || 0, percentage)
          }
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
      console.warn("Erro ao gerar lição personalizada:", e);
      setAiError("Não foi possível criar a lição agora. Verifique a conexão e tente novamente.");
    } finally {
      setGeneratingAiLesson(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0 && !courses.some(course => course.id === selectedCourseId)) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const activeModule = activeLesson ? selectedCourse?.modules.find(module => module.lessons.some(lesson => lesson.id === activeLesson.id)) : undefined;

  // Registra o aparelho no serviço nativo de push após autenticação.
  // O token é salvo no Supabase e atualizado quando idioma/plano mudarem.
  useEffect(() => {
    if (!isLoggedIn || !profileLoaded) return;

    void initializePushNotifications({
      language: selectedCourse?.language || 'en',
      plan: userProgress.plan || 'free',
    }, (notification) => {
      console.info('Push recebido com o FALLA aberto:', notification);
    }, (action) => {
      const deepLink = String(action.notification.data?.deepLink || '');
      if (deepLink) console.info('Push aberto:', deepLink);
    }).catch((error) => console.warn('Push indisponível:', error));
  }, [isLoggedIn, profileLoaded, selectedCourse?.language, userProgress.plan]);

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

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    ou
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  disabled={googleLoginLoading}
                  onClick={() => void handleGoogleLogin()}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 font-black text-xs py-3.5 px-4 rounded-2xl border-2 border-slate-200 shadow-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z" />
                    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.39l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z" />
                    <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.48H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.52l3.35-2.59Z" />
                    <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.48l3.35 2.59C7.18 7.7 9.39 5.94 12 5.94Z" />
                  </svg>

                  {googleLoginLoading
                    ? 'Abrindo o Google...'
                    : 'Continuar com Google'}
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
          {interfaceTexts.app_footer || "FALLA App Co. © 2026. Aprendizado de idiomas de forma divertida e interativa."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      
      {/* Immersive Lesson Overlay */}
      {activeLesson && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto py-6 md:py-10 px-3 md:px-4 transition-all"
          style={{ backgroundColor: 'var(--theme-bg)' }}
        >
          <LessonPlayer 
            lesson={activeLesson} 
            courseLanguage={selectedCourse?.language || "en"}
            localLanguage={localLanguage}
            onComplete={handleCompleteLesson}
            onCancel={() => setActiveLesson(null)}
            userXp={userProgress.xp}
            userLevel={userProgress.level}
            userLives={userProgress.lives}
            userPlan={userProgress.plan || 'free'}
            mascots={mascots}
            moduleMascotUrl={activeModule?.mascotUrl || null}
            onLoseLife={() => {
              setUserProgress(prev => {
                const normalizedPlan = String(prev.plan || 'free').trim().toLowerCase();
                if (normalizedPlan === 'premium' || normalizedPlan === 'pro') return prev;
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
              const activeBannerObj = banners.find(b => b.id === activeBannerId) || banners[0];
              const animClass = activeBannerObj.isAnimated 
                ? activeBannerObj.animationType === 'gradient' ? 'banner-animated-gradient' :
                  activeBannerObj.animationType === 'hue' ? 'banner-animated-hue' :
                  activeBannerObj.animationType === 'shimmer' ? 'banner-animated-shimmer' :
                  activeBannerObj.animationType === 'stripes' ? 'banner-animated-stripes' :
                  ''
                : '';
              return (
                <section className="home-profile-card">
                  <div
                    aria-hidden="true"
                    style={profileBannerStyle(activeBannerObj, userProgress.bannerAdjustments?.[activeBannerId])}
                    className={`home-profile-banner ${animClass}`}
                  />
                  <div className="home-profile-shade" aria-hidden="true" />

                  <div className="home-profile-content">
                    <div className="home-profile-identity">
                      <button
                        id="profile-avatar-button"
                        onClick={() => setIsAvatarMenuOpen(true)}
                        title="Alterar foto ou mascote"
                        className={`home-profile-avatar group ${activeProfileFrame !== 'none' ? 'premium-frame-animated' : ''}`}
                        style={selectedProfileFrame.style}
                      >
                        {renderAvatarContent(userProgress.avatarMascot)}
                        <span className="home-profile-avatar-action">Mudar</span>
                      </button>

                      <div className="home-profile-copy">
                        <h1>Olá, {userName}! 👋</h1>
                        <p>
                          Nível {userProgress.level} • Estudante do {selectedCourse?.name || 'Falla'}
                        </p>
                      </div>
                    </div>

                    <div className="home-profile-stats" aria-label="Resumo do perfil">
                      <article className="home-stat-card home-stat-card--level">
                        <span className="home-stat-icon" aria-hidden="true">🏆</span>
                        <div className="home-stat-copy">
                          <span className="home-stat-label">Nível</span>
                          <strong>Lvl {userProgress.level}</strong>
                          <small>{userProgress.xp || 0} XP conquistados</small>
                        </div>
                      </article>

                      <article className="home-stat-card home-stat-card--streak">
                        <span className="home-stat-icon" aria-hidden="true">🔥</span>
                        <div className="home-stat-copy">
                          <span className="home-stat-label">Ofensiva</span>
                          <strong>{userProgress.streak} {userProgress.streak === 1 ? 'Dia' : 'Dias'}</strong>
                          <small>{userProgress.streak > 0 ? 'Continue assim!' : 'Comece hoje!'}</small>
                        </div>
                      </article>

                      <article className="home-stat-card home-stat-card--plan">
                        <span className="home-stat-icon" aria-hidden="true">👑</span>
                        <div className="home-stat-copy">
                          <span className="home-stat-label">Plano</span>
                          <strong>{userProgress.plan === 'pro' || userProgress.plan === 'premium' ? 'Pro' : 'Free'}</strong>
                          <small>{userProgress.plan === 'pro' || userProgress.plan === 'premium' ? 'Benefícios ativos' : 'Plano atual'}</small>
                        </div>
                      </article>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Trilha de Progresso (Estilo Duolingo) */}
            {selectedCourse ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 md:p-6 shadow-2xs">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center gap-3 min-w-0 w-full">
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
                  <h4 className="text-base font-black text-slate-800 group-hover:text-falla-blue transition-colors">Tutor Personalizado</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                    Crie uma lição inteiramente nova e jogável sobre qualquer tema em segundos!
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-falla-blue group-hover:translate-x-1 transition-transform">
                    Criar Lição Personalizada <ChevronRight size={14} />
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
                    Tenha vidas infinitas, zero anúncios, tutor personalizado totalmente liberado e lições ilimitadas!
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
          <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 animate-fade-in overflow-x-hidden">
            {/* Upper Navigation Bar with back button - hidden on Profile screen */}
            {activeTab !== 'profile' && (
              <div className="w-full min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border-2 border-slate-200 p-3 sm:p-4 rounded-3xl shadow-2xs overflow-hidden">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 hover:scale-[1.02] active:scale-[0.98]"
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
                      {activeTab === 'friends' && '👥'}
                      {activeTab === 'more' && '✨'}
                      {activeTab === 'grammar' && '📝'}
                      {activeTab === 'premium-tools' && '👑'}
                      {activeTab === 'analytics' && '📊'}
                    </span>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {activeTab === 'learn' && 'Estudo Diário'}
                      {activeTab === 'ai-tutor' && 'Tutor Personalizado'}
                      {activeTab === 'mascots' && 'Nossos Mascotes'}
                      {activeTab === 'admin' && 'Painel Administrativo'}
                      {activeTab === 'architecture' && 'Arquitetura & Stack'}
                      {activeTab === 'profile' && 'Perfil do Estudante'}
                      {activeTab === 'shop' && 'Loja de Recompensas'}
                      {activeTab === 'plans' && 'Planos de Assinatura'}
                      {activeTab === 'leaderboard' && 'Ranking & Conquistas'}
                      {activeTab === 'friends' && 'Amigos & Seguidores'}
                      {activeTab === 'more' && 'Mais Recursos'}
                      {activeTab === 'grammar' && 'Aulas de Gramática'}
                      {activeTab === 'premium-tools' && 'Treinos Premium'}
                      {activeTab === 'analytics' && 'Meu Desempenho'}
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
                      setCourses(filterCoursesWithCachedAvailability(fallbackCourses));
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
                                  <span
                                    className="w-3.5 h-3.5 rounded-full ring-4"
                                    style={{
                                      backgroundColor: 'var(--theme-primary)',
                                      boxShadow: '0 0 0 4px color-mix(in srgb, var(--theme-primary) 16%, transparent)'
                                    }}
                                  ></span>
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
                                            ? 'bg-slate-50 border-slate-200' 
                                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-black text-xs text-slate-800">{les.title}</h4>
                                            {isCompleted && (
                                              <span
                                                className="text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"
                                                style={{
                                                  backgroundColor: 'var(--theme-primary)',
                                                  boxShadow: '0 3px 10px color-mix(in srgb, var(--theme-primary) 28%, transparent)'
                                                }}
                                              >
                                                <Check size={10} strokeWidth={3} /> Concluída
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-400 mt-1 font-bold">{les.description}</p>
                                        </div>
                                        
                                        <button
                                          onClick={() => handleStartLesson(les)}
                                          className={`font-black text-xs px-4.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 shadow-sm ${
                                            isCompleted 
                                              ? 'text-white border-b-4 active:translate-y-1 active:border-b-0 cursor-pointer' 
                                              : 'bg-falla-blue hover:bg-falla-blue/90 text-white border-b-4 border-b-sky-600 active:translate-y-1 active:border-b-0 cursor-pointer'
                                          }`}
                                          style={isCompleted ? {
                                            backgroundColor: 'var(--theme-primary)',
                                            borderBottomColor: 'var(--theme-primary-dark)'
                                          } : undefined}
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
                {activeTab === 'premium-tools' && (
                  <PremiumLearningHub
                    courses={courses}
                    currentCourseId={selectedCourseId}
                    userPlan={userProgress.plan}
                    onStartLesson={handleStartLesson}
                    onOpenPlans={() => setActiveTab('plans')}
                  />
                )}

                {activeTab === 'analytics' && (
                  <PremiumAnalyticsDashboard
                    courses={courses}
                    currentCourseId={selectedCourseId}
                    progress={userProgress}
                    userName={userName}
                    onStartLesson={handleStartLesson}
                    onOpenPlans={() => setActiveTab('plans')}
                  />
                )}

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
                        banners={banners}
                        onAddCustomBanner={handleAddCustomBanner}
                        onDeleteCustomBanner={handleDeleteCustomBanner}
                        mascots={mascots}
                        onAddCustomMascot={handleAddCustomMascot}
                        onDeleteCustomMascot={handleDeleteCustomMascot}
                        shopConfig={shopConfig}
                        onUpdateShopConfig={handleUpdateShopConfig}
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

                {/* 5. TUTOR VIEW */}
                {activeTab === 'ai-tutor' && (
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in">
                    {userRole === 'admin' ? (
                      <>
                        <div>
                          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Brain className="text-falla-blue animate-pulse" />
                            Criador de Lições Personalizadas
                          </h2>
                          <p className="text-xs text-slate-500 font-bold mt-1">
                            {interfaceTexts.ai_tutor_welcome || "Digite qualquer tema que venha à sua cabeça (ex: \"comprar frutas na feira\", \"jogando futebol no parque\", \"viagem espacial\") e o FALLA criará uma lição interativa, completa e personalizada em segundos!"}
                          </p>
                        </div>

                        {aiError && (
                          <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl p-4 text-xs font-bold flex gap-2">
                            <AlertCircle className="shrink-0 mt-0.5 text-red-500" />
                            <div>
                              <strong>Aviso:</strong> {aiError}
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
                            Ao gerar, o app cria exercícios contextualizados ao tema escolhido, com alternativas, explicações e dicas personalizadas.
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
                          O Criador de lições personalizadas é um recurso exclusivo de demonstração restrito a administradores.
                        </p>
                      </div>
                    )}
                  </div>
                )}



                {/* AMIGOS & SEGUIDORES VIEW */}
                {activeTab === 'friends' && (
                  <div className="w-full min-w-0 max-w-4xl mx-auto animate-fade-in overflow-x-hidden">
                    <SocialHub
                      currentUserName={userName}
                      currentAvatarUrl={avatarUrl}
                      currentMascot={userProgress.avatarMascot || 'chico'}
                    />
                  </div>
                )}

                {/* RANKING VIEW */}
                {activeTab === 'leaderboard' && (
                  <div className="space-y-6 animate-fade-in">
                    <div
                      id="progresso-social-section"
                      className="bg-white border-2 border-slate-200 rounded-3xl p-5 md:p-6 shadow-2xs space-y-6 transition-all duration-500"
                    >
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🏆</span> Progresso & Social
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          Acompanhe seu desempenho no ranking e consulte suas conquistas.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h5 className="font-black text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📊</span> Ranking de Estudantes
                          </h5>

                          <Leaderboard
                            userXp={userProgress.xp}
                            userStreak={userProgress.streak}
                            userState={userProgress.state}
                            userCountry={userProgress.country}
                          />
                        </div>

                        <div className="space-y-4">
                          <h5 className="font-black text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy size={14} className="text-falla-yellow" />
                            Conquistas Ativas
                          </h5>

                          <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                            {achievements.map((ach) => {
                              const isUnlocked =
                                userProgress.xp >= ach.xp_required;

                              return (
                                <div
                                  key={ach.id}
                                  className={`p-3 rounded-2xl border-2 transition-all flex items-start gap-2.5 ${
                                    isUnlocked
                                      ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-75'
                                  }`}
                                >
                                  <span
                                    className="text-2xl mt-0.5"
                                    role="img"
                                    aria-label="achievement emoji"
                                  >
                                    {ach.emoji}
                                  </span>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <h4 className="font-extrabold text-xs truncate">
                                        {ach.title}
                                      </h4>

                                      {isUnlocked ? (
                                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight">
                                          Liberada
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight">
                                          {ach.xp_required} XP
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-[10px] text-slate-400 mt-1 font-bold leading-normal">
                                      {ach.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. PERFIL VIEW */}
                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
                      {/* Active Profile Banner */}
                      {(() => {
                        const activeBannerId = userProgress.activeBanner || 'banner_classic';
                        const activeBannerObj = banners.find(b => b.id === activeBannerId) || banners[0];
                        const animClass = activeBannerObj.isAnimated 
                          ? activeBannerObj.animationType === 'gradient' ? 'banner-animated-gradient' :
                            activeBannerObj.animationType === 'hue' ? 'banner-animated-hue' :
                            activeBannerObj.animationType === 'shimmer' ? 'banner-animated-shimmer' :
                            activeBannerObj.animationType === 'stripes' ? 'banner-animated-stripes' :
                            ''
                          : '';
                        return (
                          <div 
                            style={profileBannerStyle(activeBannerObj, userProgress.bannerAdjustments?.[activeBannerId])}
                            className={`h-32 sm:h-40 w-full relative transition-all duration-300 ${animClass}`}
                          >
                            {isImageProfileBanner(activeBannerObj.imageUrl) && (
                              <button
                                type="button"
                                onClick={openBannerAdjuster}
                                className="absolute right-3 top-3 min-h-11 rounded-xl bg-slate-950/75 px-4 text-xs font-black text-white backdrop-blur-sm flex items-center gap-2 hover:bg-slate-950"
                              >
                                <Move size={15} /> Ajustar capa
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      
                      {/* User Avatar, Details & Stats */}
                      <div className="p-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-14 md:-mt-16 z-10 text-center md:text-left">
                        {/* Selected Mascot Portrait */}
                        <div className="relative shrink-0 group">
                          <button 
                            id="profile-mascot-portrait-button"
                            onClick={() => setIsAvatarMenuOpen(true)}
                            title="Alterar foto ou mascote"
                            className={`w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-sky-50 shadow-md flex items-center justify-center cursor-pointer hover:scale-105 hover:border-sky-300 transition-all relative ${activeProfileFrame !== 'none' ? 'premium-frame-animated' : ''}`}
                            style={selectedProfileFrame.style}
                          >
                            {renderAvatarContent(userProgress.avatarMascot)}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-black uppercase tracking-wider">Mudar</span>
                            </div>
                          </button>
                          <span className="absolute bottom-1 right-1 bg-falla-blue text-white w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-black shadow-sm pointer-events-none">
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
                              Plano {userProgress.plan === 'pro' || userProgress.plan === 'premium' ? '👑 Pro' : 'Free'}
                            </span>
                            {(userProgress.plan === 'pro' || userProgress.plan === 'premium') && (
                              <span className="bg-falla-green/10 text-falla-green text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-falla-green/20">
                                ⏳ {(() => {
                                  const expiry = userProgress.planExpiresAt;
                                  if (!expiry) return 'Ilimitado';
                                  const diffTime = new Date(expiry).getTime() - Date.now();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  return diffDays > 0 ? `${diffDays} Dias Restantes` : 'Expirado';
                                })()}
                              </span>
                            )}
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
                              const bannerObj = banners.find(b => b.id === bannerId);
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
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <span>🎨</span> Capa de Perfil
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold">
                          Personalize seu perfil com um banner elegante! Banners bloqueados podem ser comprados usando suas moedas de recompensa.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {banners.map((banner) => {
                          const isUnlocked = (userProgress.unlockedBanners || []).includes(banner.id) || banner.unlockedByDefault;
                          const isActive = userProgress.activeBanner === banner.id;
                          const canAfford = (userProgress.coins || 0) >= banner.price;
                          const animClass = banner.isAnimated 
                            ? banner.animationType === 'gradient' ? 'banner-animated-gradient' :
                              banner.animationType === 'hue' ? 'banner-animated-hue' :
                              banner.animationType === 'shimmer' ? 'banner-animated-shimmer' :
                              banner.animationType === 'stripes' ? 'banner-animated-stripes' :
                              ''
                            : '';

                          return (
                            <div 
                              key={banner.id}
                              className={`bg-slate-50 border-2 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 ${
                                isActive ? 'border-falla-blue bg-white shadow-md ring-2 ring-opacity-25 ring-offset-2' : 'border-slate-200'
                              } ${!isUnlocked ? 'opacity-85' : ''}`}
                            >
                              <div className="space-y-2">
                                {/* Banner Preview */}
                                <div 
                                  style={{ background: banner.imageUrl }} 
                                  className={`aspect-[3/1] min-h-20 w-full rounded-xl shadow-xs border border-slate-100 flex items-center justify-center relative overflow-hidden ${animClass}`}
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
                              
                              <div className="pt-1">
                                {isActive ? (
                                  <div className="min-h-11 w-full rounded-xl bg-falla-blue text-white text-xs font-black uppercase flex items-center justify-center gap-2">
                                    <Check size={14} /> Ativo
                                  </div>
                                ) : isUnlocked ? (
                                  <button type="button" onClick={() => setUserProgress(prev => ({ ...prev, activeBanner: banner.id }))} className="min-h-11 w-full rounded-xl bg-slate-200 text-slate-700 text-xs font-black uppercase hover:bg-slate-300 active:scale-[0.98]">
                                    Equipar
                                  </button>
                                ) : (
                                  <button type="button" disabled={!canAfford} onClick={() => {
                                    if (!canAfford) return;
                                    const confirmPurchase = window.confirm(`Deseja comprar o banner "${banner.name}" por ${banner.price} moedas?`);
                                    if (!confirmPurchase) return;
                                    setUserProgress(prev => ({
                                      ...prev,
                                      coins: Math.max(0, (prev.coins || 0) - banner.price),
                                      unlockedBanners: [...(prev.unlockedBanners || []), banner.id],
                                    }));
                                    purchaseItemInDatabase(banner.id, 'banner');
                                    alert(`Banner "${banner.name}" comprado! Agora clique em Equipar.`);
                                  }} className={`min-h-11 w-full rounded-xl text-xs font-black uppercase active:scale-[0.98] ${canAfford ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                    Comprar Banner
                                  </button>
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
                        {Object.entries(themesList).map(([id, t]) => {
                          const isPremiumTheme = premiumThemeIds.has(id);
                          const isLocked = isPremiumTheme && !hasPremiumFeature(userProgress.plan, 'premium_themes');
                          return (
                            <button
                              key={id}
                              onClick={() => {
                                if (isLocked) {
                                  alert('Este tema é exclusivo do FALLA Premium.');
                                  return;
                                }
                                setTheme(id);
                                localStorage.setItem('falla_theme', id);
                              }}
                              className={`relative flex items-center justify-between p-3 rounded-2xl text-xs font-black transition-all cursor-pointer border-2 ${
                                theme === id
                                  ? 'bg-falla-blue/5 border-falla-blue text-falla-blue ring-2 ring-falla-blue/25'
                                  : isLocked
                                  ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-80'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="pr-2">{t.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {isPremiumTheme && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">👑</span>}
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: t.green }} />
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: t.blue }} />
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: t.yellow }} />
                                {isLocked && <Lock size={12} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Molduras de perfil */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 animate-fade-in">
                      <div>
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2"><span>✨</span> Moldura do Perfil</h4>
                        <p className="text-[11px] text-slate-400 font-bold">Destaque seu mascote com molduras e efeitos especiais.</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {profileFrames.map(frame => {
                          const locked = frame.premium && !hasPremiumFeature(userProgress.plan, 'premium_mascots');
                          return (
                            <button
                              key={frame.id}
                              onClick={() => {
                                if (locked) {
                                  alert('Esta moldura é exclusiva do FALLA Premium.');
                                  return;
                                }
                                setActiveProfileFrame(frame.id);
                                localStorage.setItem('falla_profile_frame', frame.id);
                              }}
                              className={`rounded-2xl border-2 p-3 text-center transition-all ${activeProfileFrame === frame.id ? 'border-falla-blue bg-falla-blue/5' : 'border-slate-200 bg-slate-50'} ${locked ? 'opacity-65' : 'hover:-translate-y-0.5'}`}
                            >
                              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-slate-200" style={frame.style} />
                              <span className="block text-[10px] font-black text-slate-700">{frame.name}</span>
                              {frame.premium && <span className="text-[9px] font-black text-amber-600">👑 PREMIUM</span>}
                            </button>
                          );
                        })}
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
                            {
                              id: 'xp_boost',
                              name: 'Poção de Super XP',
                              desc: `Consuma para receber instantaneamente +${shopConfig.xpBoostAmount} XP extras na sua conta!`,
                              cost: shopConfig.xpBoostCost,
                              icon: '🧪',
                              benefit: `+${shopConfig.xpBoostAmount} XP`,
                            },
                            {
                              id: 'extra_life',
                              name: 'Kit de Vida Extra',
                              desc: `Recarrega ${shopConfig.extraLifeAmount} vida(s) para que você continue estudando sem parar!`,
                              cost: shopConfig.extraLifeCost,
                              icon: '❤️',
                              benefit: `+${shopConfig.extraLifeAmount} Vida(s)`,
                            },
                            {
                              id: 'streak_shield',
                              name: 'Escudo Protetor',
                              desc: 'Protege e mantém sua ofensiva diária ativa por mais 1 dia!',
                              cost: shopConfig.streakShieldCost,
                              icon: '🛡️',
                              benefit: 'Proteção',
                            },
                            {
                              id: 'name_card',
                              name: 'Cartão de Alteração de Nome',
                              desc: 'Permite alterar seu nome de usuário no seu Perfil!',
                              cost: shopConfig.nameCardCost,
                              icon: '🏷️',
                              benefit: 'Item Especial',
                            },
                          ].map((item) => {
                            const isLifeItem = item.id === 'extra_life';
                            const isLifeFull =
                              isLifeItem &&
                              (userProgress.plan === 'premium' || userProgress.lives >= 5);
                            const canAfford = (userProgress.coins || 0) >= item.cost;
                            const canPurchase = canAfford && !isLifeFull;

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
                                    if (isLifeFull) {
                                      alert(
                                        userProgress.plan === 'premium'
                                          ? 'Seu plano já possui vidas infinitas. Não é necessário comprar vidas.'
                                          : 'Suas vidas já estão completas: 5/5. Nenhuma moeda foi descontada.',
                                      );
                                      return;
                                    }

                                    if (!canAfford) {
                                      alert('Moedas insuficientes! Complete mais lições para ganhar moedas!');
                                      return;
                                    }

                                    setUserProgress(prev => {
                                      // Proteção adicional contra cliques rápidos ou estado desatualizado.
                                      if (
                                        item.id === 'extra_life' &&
                                        (prev.plan === 'premium' || prev.lives >= 5)
                                      ) {
                                        return prev;
                                      }

                                      if ((prev.coins || 0) < item.cost) {
                                        return prev;
                                      }

                                      let newXp = prev.xp;
                                      let newLives = prev.lives;
                                      const newCoins = (prev.coins || 0) - item.cost;
                                      let newLevel = prev.level;
                                      let nameChangeCards = prev.nameChangeCards || 0;

                                      if (item.id === 'xp_boost') {
                                        newXp += shopConfig.xpBoostAmount;

                                        if (newXp >= 100) {
                                          const gainedLevels = Math.floor(newXp / 100);
                                          newXp %= 100;
                                          newLevel += gainedLevels;
                                        }
                                      } else if (item.id === 'extra_life') {
                                        newLives = Math.min(
                                          5,
                                          prev.lives + shopConfig.extraLifeAmount,
                                        );
                                      } else if (item.id === 'name_card') {
                                        nameChangeCards += 1;
                                      }

                                      return {
                                        ...prev,
                                        xp: newXp,
                                        lives: newLives,
                                        coins: newCoins,
                                        level: newLevel,
                                        nameChangeCards,
                                      };
                                    });

                                    alert(`Sucesso! Você comprou: ${item.name}!`);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shrink-0 border-b-4 uppercase flex items-center gap-1 ${
                                    canPurchase
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 border-b-amber-600 active:translate-y-0.5'
                                      : 'bg-slate-200 text-slate-400 border-b-slate-300 cursor-not-allowed'
                                  }`}
                                  disabled={!canPurchase}
                                  title={
                                    isLifeFull
                                      ? userProgress.plan === 'premium'
                                        ? 'Seu plano já possui vidas infinitas'
                                        : 'Vidas completas: 5/5'
                                      : !canAfford
                                      ? 'Moedas insuficientes'
                                      : `Comprar ${item.name}`
                                  }
                                >
                                  {isLifeFull ? (
                                    <span className="flex items-center gap-1">
                                      <Check size={14} />
                                      <span>{userProgress.plan === 'premium' ? '∞' : '5/5'}</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <GoldCoinIcon className="w-4.5 h-4.5" />
                                      <span>{item.cost}</span>
                                    </span>
                                  )}
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
                            {
                              id: 'pack_small',
                              name: `Saco de ${shopConfig.coinPackSmallCoins} Moedas`,
                              price: shopConfig.coinPackSmallPrice,
                              coins: shopConfig.coinPackSmallCoins,
                              icon: '💰',
                              popular: false,
                            },
                            {
                              id: 'pack_large',
                              name: `Baú de ${shopConfig.coinPackLargeCoins} Moedas`,
                              price: shopConfig.coinPackLargePrice,
                              coins: shopConfig.coinPackLargeCoins,
                              icon: '📦',
                              popular: true,
                            },
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
                              Remova todos os obstáculos e aprenda inglês e espanhol muito mais rápido com lições personalizadas ilimitadas!
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
                                <li className="flex items-center gap-2">❌ Apenas 3 consultas ao Tutor Personalizado</li>
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
                                <li className="flex items-center gap-2">🧠 Lições personalizadas 100% ILIMITADAS</li>
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

                {activeTab === 'missions' && (
                  <MissionCenter
                    isPremium={userProgress.plan === 'premium' || userProgress.plan === 'pro'}
                    onReward={(coins, xp, message) => {
                      setUserProgress(prev => {
                        let nextXp = prev.xp + xp;
                        let nextLevel = prev.level;
                        if (nextXp >= 100) { nextLevel += Math.floor(nextXp / 100); nextXp %= 100; }
                        return { ...prev, coins: (prev.coins || 0) + coins, xp: nextXp, level: nextLevel };
                      });
                      alert(message);
                    }}
                  />
                )}

                {/* 10. MAIS ATIVIDADES VIEW */}
                {activeTab === 'more' && (
                  <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xs">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <span>✨</span> Mais Atividades & Recursos
                      </h2>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                        Explore os recursos de gamificação e aprendizado interativo do FALLA!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div
                        onClick={() => setActiveTab('missions')}
                        className="bg-gradient-to-br from-violet-50 to-amber-50 border-2 border-violet-200 hover:border-violet-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-2xl flex items-center justify-center text-2xl">🏆</div><span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full">NOVO</span></div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-violet-600">Missões & Recompensas</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-bold leading-normal">Metas diárias e semanais, recompensa de login e prêmios resgatáveis.</p>
                      </div>
                      {/* Idioma local do usuário */}
                      <div
                        onClick={() => setShowLocalLanguageSetup(true)}
                        className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-2xs">
                            <Globe size={24} />
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full">GLOBAL</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-emerald-600 transition-colors">Idioma local</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                          {APP_LOCALES.find(item => item.code === localLanguage)?.flag} {APP_LOCALES.find(item => item.code === localLanguage)?.nativeLabel || localLanguage}. Usado na interface, explicações e significados.
                        </p>
                      </div>

                      {/* Configuração de voz do usuário */}
                      <div
                        onClick={() => {
                          setVoiceSetupFirstAccess(false);
                          setShowVoiceSetup(true);
                        }}
                        className="bg-white border-2 border-slate-200 hover:border-sky-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-sky-100 group-hover:bg-sky-500 text-sky-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-2xs">
                            <Volume2 size={24} />
                          </div>
                          <span className="text-[10px] bg-sky-50 text-sky-700 font-black px-2 py-0.5 rounded-full">GRÁTIS</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-sky-600 transition-colors">Voz das lições</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                          Teste e escolha entre as vozes disponíveis no seu celular para perguntas e pronúncias.
                        </p>
                      </div>

                      {/* Central de treinos Premium */}
                      <div
                        onClick={() => setActiveTab('premium-tools')}
                        className="bg-gradient-to-br from-sky-50 to-purple-50 border-2 border-falla-blue/20 hover:border-falla-blue rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-falla-blue text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xs">👑</div>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded-full">PREMIUM</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-falla-blue transition-colors">Treinos Premium</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-bold leading-normal">Revisão dos erros, revisão espaçada, coach de estudos e simulados personalizados.</p>
                      </div>

                      {/* Analytics Premium */}
                      <div
                        onClick={() => setActiveTab('analytics')}
                        className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-sky-200 hover:border-sky-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xs">📊</div>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded-full">PREMIUM</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-sky-600 transition-colors">Meu Desempenho</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-bold leading-normal">Evolução, precisão, tempo estudado, palavras difíceis, medalhas e certificados.</p>
                      </div>

                      {/* Personalização Premium */}
                      <div
                        onClick={() => setActiveTab('profile')}
                        className="bg-gradient-to-br from-fuchsia-50 to-cyan-50 border-2 border-fuchsia-200 hover:border-fuchsia-500 rounded-3xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xs">🎨</div>
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full">PREMIUM</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 group-hover:text-fuchsia-600 transition-colors">Personalização Premium</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-bold leading-normal">Temas exclusivos, mascotes especiais, molduras animadas e efeitos de perfil.</p>
                      </div>

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

                      {/* B. Tutor Personalizado */}
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
                          <h4 className="text-base font-black text-slate-800 group-hover:text-falla-blue transition-colors">Tutor Personalizado</h4>
                          <p className="text-[11px] text-slate-400 mt-1.5 font-bold leading-normal">
                            Crie uma lição inteiramente nova e jogável sobre qualquer tema em segundos!
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
                            Gerencie cursos, regras do aplicativo, dicas de estudos, textos dinâmicos de interface e configurações avançadas do sistema.
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
                                          playSound('click');
                                          const ok = speak(english);
                                          if (!ok) alert("Seu navegador não suporta síntese de fala offline.");
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
      {!activeLesson && (
        <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[10px] text-slate-400 font-semibold tracking-wide mt-auto mb-16">
          {interfaceTexts.app_footer || "FALLA App Co. © 2026. Aprendizado de idiomas de forma divertida e interativa."}
        </footer>
      )}

      {/* Fixed bottom navigation (Duolingo style) */}
      {!activeLesson && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200 shadow-xl py-2 px-1 sm:px-4 grid grid-cols-6 items-center select-none pb-safe">
          {[
            { id: 'home', label: 'Início', icon: Home, color: 'text-falla-green' },
            { id: 'shop', label: 'Loja', icon: Gift, color: 'text-amber-500' },
            { id: 'friends', label: 'Amigos', icon: Users, color: 'text-emerald-500' },
            { id: 'leaderboard', label: 'Ranking', icon: Trophy, color: 'text-falla-orange' },
            { id: 'profile', label: 'Perfil', icon: User, color: 'text-falla-blue' },
            { id: 'more', label: 'Mais', icon: Menu, color: 'text-falla-pink' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center py-1 px-0.5 sm:px-2 rounded-2xl min-w-0 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-100/80 scale-105' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <Icon 
                  size={20} 
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
      )}

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


      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarFileSelected}
      />

      {isAvatarMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div
            className="border-2 rounded-3xl p-6 shadow-xl max-w-sm w-full space-y-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-black flex items-center gap-2">
                <Camera size={18} />
                Alterar perfil
              </h4>
              <button
                type="button"
                onClick={() => setIsAvatarMenuOpen(false)}
                className="opacity-60 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-md"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg)',
                }}
              >
                {renderAvatarContent(userProgress.avatarMascot)}
              </div>
            </div>

            <button
              type="button"
              disabled={avatarUploading}
              onClick={() => avatarFileInputRef.current?.click()}
              className="w-full rounded-2xl border-b-4 border-b-sky-700 bg-falla-blue text-white px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ImagePlus size={16} />
              {avatarUploading ? 'Enviando...' : 'Importar foto do aparelho'}
            </button>

            <button
              type="button"
              disabled={avatarUploading}
              onClick={openMascotSelectorFromAvatarMenu}
              className="w-full rounded-2xl border-2 px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg)',
              }}
            >
              <span className="text-base">🐾</span>
              Escolher mascote
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => void handleRemoveProfilePhoto()}
                className="w-full rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={15} />
                Remover foto atual
              </button>
            )}

            {avatarMessage && (
              <p className="rounded-2xl border-2 p-3 text-[10px] font-bold text-center"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-bg)',
                }}
              >
                {avatarMessage}
              </p>
            )}
          </div>
        </div>
      )}

      <LocalLanguageModal
        open={showLocalLanguageSetup}
        currentLocale={localLanguage}
        onClose={() => setShowLocalLanguageSetup(false)}
        onChange={setLocalLanguage}
      />

      <AnimatePresence>
        {isBannerAdjusterOpen && (() => {
          const bannerId = userProgress.activeBanner || 'banner_classic';
          const banner = banners.find(item => item.id === bannerId) || banners[0];
          if (!banner || !isImageProfileBanner(banner.imageUrl)) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-slate-950/70 p-4 flex items-center justify-center"
              onClick={() => setIsBannerAdjusterOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                onClick={event => event.stopPropagation()}
                className="w-full max-w-2xl rounded-3xl bg-white p-4 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Ajustar capa do perfil</h3>
                    <p className="text-sm font-bold text-slate-500">Arraste a imagem com o mouse ou dedo e use o zoom para enquadrar.</p>
                  </div>
                  <button type="button" onClick={() => setIsBannerAdjusterOpen(false)} className="min-h-11 min-w-11 rounded-xl bg-slate-100 flex items-center justify-center" aria-label="Fechar"><X size={18}/></button>
                </div>

                <div
                  ref={profileBannerAdjusterRef}
                  onPointerDown={startProfileBannerDrag}
                  onPointerMove={moveProfileBanner}
                  onPointerUp={endProfileBannerDrag}
                  onPointerCancel={endProfileBannerDrag}
                  style={{ ...profileBannerStyle(banner, bannerAdjustmentDraft), touchAction: 'none' }}
                  className="aspect-[3/1] w-full cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100"
                  role="img" aria-label="Prévia ajustável da capa"
                />

                <label className="block space-y-2">
                  <span className="flex justify-between text-xs font-black uppercase text-slate-600"><span>Zoom</span><span>{Math.round(bannerAdjustmentDraft.zoom)}%</span></span>
                  <input type="range" min="100" max="240" step="1" value={bannerAdjustmentDraft.zoom} onChange={event => setBannerAdjustmentDraft(current => ({ ...current, zoom: Number(event.target.value) }))} className="w-full" />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button type="button" onClick={() => setBannerAdjustmentDraft({ x: 50, y: 50, zoom: 100 })} className="min-h-12 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase flex items-center justify-center gap-2"><RotateCcw size={15}/> Centralizar</button>
                  <button type="button" onClick={() => setIsBannerAdjusterOpen(false)} className="min-h-12 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black uppercase">Cancelar</button>
                  <button type="button" onClick={saveProfileBannerAdjustment} className="min-h-12 rounded-xl bg-falla-blue text-white text-xs font-black uppercase">Salvar ajuste</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <VoiceSetupModal
        open={showVoiceSetup}
        firstAccess={voiceSetupFirstAccess}
        language="en-US"
        onClose={() => {
          setShowVoiceSetup(false);
          setVoiceSetupFirstAccess(false);
        }}
      />

      {/* Mascot Selection Modal */}
      {isMascotSelectorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col space-y-4 relative animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>🐾</span> Escolha seu Mascote de Perfil
              </h4>
              <button 
                onClick={() => setIsMascotSelectorOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xs uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold leading-normal shrink-0">
              Escolha o mascote que guiará você pela sua jornada no Falla! Cada mascote traz sua própria personalidade e frases motivacionais exclusivas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 py-1 flex-1">
              {mascots.map((m) => {
                const isSelected = userProgress.avatarMascot === m.id;
                const isPremiumMascot = premiumMascotIds.has(m.id);
                const isLockedMascot = isPremiumMascot && !hasPremiumFeature(userProgress.plan, 'premium_mascots');
                return (
                  <button
                    key={m.id}
                    onClick={async () => {
                      if (isLockedMascot) {
                        alert('Este mascote é exclusivo do FALLA Premium.');
                        return;
                      }
                      setUserProgress(prev => ({
                        ...prev,
                        avatarMascot: m.id
                      }));
                      setAvatarUrl(null);
                      setIsMascotSelectorOpen(false);

                      const {
                        data: { session },
                      } = await supabase.auth.getSession();

                      if (session?.user) {
                        await supabase
                          .from('profiles')
                          .update({
                            avatar_mascot: m.id,
                            avatar_url: null,
                            avatar_type: 'mascot',
                            avatar_value: m.id,
                          })
                          .eq('id', session.user.id);
                      }
                    }}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left relative cursor-pointer ${
                      isSelected
                        ? 'border-falla-blue bg-sky-50/50 shadow-xs'
                        : isLockedMascot
                        ? 'border-slate-200 bg-slate-100 opacity-70'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/30'
                    }`}
                  >
                    {/* Portrait */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-xs flex items-center justify-center bg-slate-50">
                      {renderAvatarContent(m.id)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-800 tracking-tight block truncate">
                          {m.name}
                        </span>
                        {isPremiumMascot && (
                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">👑 Premium</span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase text-falla-blue bg-blue-100 px-1.5 py-0.5 rounded-md shrink-0">
                            Ativo
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {m.role || "Mascote"}
                      </span>
                      <p className="text-[10px] font-bold text-slate-500 leading-snug line-clamp-2">
                        {m.trait || m.description || "Inspirando você a cada nova conquista de idioma!"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!activeLesson && (
        <FloatingFriendsChat
          currentUserName={userName}
          currentAvatarUrl={avatarUrl}
          currentMascot={userProgress.avatarMascot || 'chico'}
        />
      )}

      {/* Chico Floating Widget with interactive open/close and absolute removal options */}
      {!isChicoRemoved && (
        <motion.div 
          drag
          dragMomentum={false}
          className="fixed left-4 sm:left-6 z-[60] flex flex-col items-start gap-2.5 select-none pointer-events-auto cursor-grab active:cursor-grabbing"
          style={{
            touchAction: 'none',
            bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <AnimatePresence>
            {showChicoBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 15 }}
                className="rounded-2xl border-2 p-3.5 shadow-xl w-[min(18rem,calc(100vw-2rem))] relative pointer-events-auto cursor-default"
                style={{
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                  boxShadow:
                    '0 18px 45px color-mix(in srgb, var(--theme-primary) 18%, rgba(15,23,42,.18))',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Speech tail alinhado ao avatar no lado esquerdo */}
                <div
                  className="absolute bottom-[-9px] left-7 w-4 h-4 border-r-2 border-b-2 rotate-45"
                  style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
                
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
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>🐾</span>
                    <span style={{ color: 'var(--theme-primary)' }}>Chico diz:</span>
                  </p>
                  <p className="text-[11px] font-bold leading-normal opacity-75">
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
            <div
              className="w-16 h-16 rounded-full border-4 shadow-2xl flex items-center justify-center ring-4 animate-pulse-slow overflow-hidden"
              style={{
                borderColor: 'var(--theme-card-bg)',
                backgroundColor: 'var(--theme-primary-light)',
                '--tw-ring-color': 'color-mix(in srgb, var(--theme-primary) 45%, transparent)',
              } as React.CSSProperties}
            >
              <img 
                src={chicoMascot} 
                alt="Chico" 
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Click info badge */}
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-xs whitespace-nowrap"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Arraste-me!
            </span>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
