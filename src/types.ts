export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  SENTENCE_BUILDER = 'sentence-builder',
  MATCH_PAIRS = 'match-pairs',
  SPEAK_SIM = 'speak-sim'
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;          // e.g., "Translate this sentence" or "What is the capital?"
  text?: string;           // the sentence to translate, e.g., "The cat is on the table"
  translation?: string;    // legacy/default translation
  localizedTranslations?: Record<string, string>; // translations by locale, e.g. {'pt-BR': 'Olá'}
  options?: string[];      // options for multiple choice or words for sentence builder
  correctAnswer: string | string[]; // string for multiple choice/speak-sim, or string[] of ordered words for sentence-builder
  characterHint?: string;  // Name of character giving hint
  hintText?: string;       // The hint content
  context?: string;        // Optional real-life context or micro-dialogue
  dialogue?: string[];     // Optional dialogue lines shown before answering
  contextImage?: string;   // Optional image URL associated with the context
  pronunciation?: string;  // Optional simplified pronunciation guide
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  questions: Question[];
  order?: number; // posição sequencial da fase dentro do módulo
}

export interface Module {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  mascotUrl?: string;
  lessons: Lesson[];
}

export type ModuleBannerMode = 'random' | 'carousel';

export interface ModuleBanner {
  id: string;
  moduleId: string;
  imageUrl: string;
  storagePath?: string;
  displayOrder: number;
}

export interface Course {
  id: string;
  name: string;      // e.g., "Inglês para Iniciantes"
  language: 'en' | 'es' | 'pt';
  flag: string;      // emoji flag
  description: string;
  active?: boolean; // false oculta o curso dos usuários sem apagar o conteúdo
  modules: Module[];
}

export interface Mascot {
  id: string;
  name: string;
  trait: string;
  role: string;
  quote: string;
  avatarUrl?: string;
  idleAnimationUrl?: string;
  speakingAnimationUrl?: string;
  correctAnimationUrl?: string;
  wrongAnimationUrl?: string;
  lessonSize?: number;
  styleColor: string; // Tailwind bg color class
  emoji: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  streak: number;
  state: string;     // BR State, e.g., "SP", "RJ", "MG"
  country: string;   // Country name or emoji flag
  avatar: string;    // Mascot emoji or placeholder
  isUser?: boolean;
}

export interface UserProgress {
  xp: number;
  streak: number;
  level: number;
  lives: number;
  completedLessons: string[]; // Lesson IDs
  lessonStars?: Record<string, number>; // Melhor avaliação por fase (0 a 3)
  lessonBestPercentage?: Record<string, number>; // Melhor percentual por fase
  currentCourseId: string;
  state: string;
  country: string;
  coins: number;
  avatarMascot?: string;
  plan?: string;
  planExpiresAt?: string;
  lastLifeRegenTime?: number;
  hasUsedFreeNameChange?: boolean;
  nameChangeCards?: number;
  unlockedBanners?: string[];
  activeBanner?: string;
  bannerAdjustments?: Record<string, { x: number; y: number; zoom: number }>;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  frequency: 'daily' | 'weekly' | 'once';
  type: 'ad' | 'reminder';
  created_at?: string;
}

export const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';

export interface LearningTip {
  id: string;
  tip: string;
  mascot_id: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp_required: number;
}

export interface AiTutorConfig {
  id: string;
  prompt_template: string;
  default_topic: string;
}

export interface InterfaceText {
  key: string;
  value: string;
}


