import React, { useState, useEffect } from 'react';
import { Lesson, Question, QuestionType, Mascot } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import GoldCoinIcon from './GoldCoinIcon';
import { ClosedChest, OpenedChest } from './MagicChest';
import { playSound } from '../services/soundService';
import { speechService } from '../services/speechService';
import { speechRecognitionService } from '../services/speechRecognitionService';
import AudioButton from './AudioButton';
import AnimatedLessonMascot from './AnimatedLessonMascot';
import { generateWeightedReward, loadShopConfig } from '../services/shopConfig';
import { getLocalLessonSettings, loadLessonSettings } from '../services/lessonSettings';

import licoMascot from '../assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from '../assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from '../assets/images/luna_mascot_1784292067117.jpg';
import chicoMascot from '../assets/images/chico_mascot_flat_vector_1784399850056.jpg';
import { 
  Heart, CheckCircle, XCircle, ArrowRight, Sparkles, 
  HelpCircle, Volume2, Mic, RotateCcw, MessageSquare, Lightbulb, Languages, BookOpen 
} from 'lucide-react';

type MatchPairItem = {
  id: string;
  text: string;
  pairIndex: number;
  side: 'left' | 'right';
};

const shuffleItems = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

interface LessonPlayerProps {
  lesson: Lesson;
  courseLanguage: string;
  localLanguage: string;
  onComplete: (xpEarned: number, coinsEarned: number, correctAnswers: number, totalQuestions: number, questionResults: Array<{ questionId: string; correct: boolean }>, durationSeconds: number) => void;
  onCancel: () => void;
  userXp: number;
  userLevel: number;
  userLives: number;
  userPlan: string;
  onLoseLife: () => void;
  mascots?: Mascot[];
  moduleMascotUrl?: string | null;
}

export default function LessonPlayer({ 
  lesson, 
  courseLanguage, 
  localLanguage,
  onComplete, 
  onCancel, 
  userXp, 
  userLevel,
  userLives,
  userPlan,
  onLoseLife,
  mascots = [],
  moduleMascotUrl = null
}: LessonPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  
  // Sentence Builder variables
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [matchLeftItems, setMatchLeftItems] = useState<MatchPairItem[]>([]);
  const [matchRightItems, setMatchRightItems] = useState<MatchPairItem[]>([]);
  const [selectedMatchItem, setSelectedMatchItem] = useState<MatchPairItem | null>(null);
  const [matchedPairIndexes, setMatchedPairIndexes] = useState<number[]>([]);
  const [wrongMatchIds, setWrongMatchIds] = useState<string[]>([]);

  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const normalizedPlan = String(userPlan || 'free').trim().toLowerCase();
  const isPremium = normalizedPlan === 'premium' || normalizedPlan === 'pro';
  const [lives, setLives] = useState(isPremium ? Number.POSITIVE_INFINITY : userLives);

  // Garante vidas ilimitadas mesmo quando o plano é carregado/alterado após abrir a lição.
  useEffect(() => {
    if (isPremium) {
      setLives(Number.POSITIVE_INFINITY);
    }
  }, [isPremium]);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionResults, setQuestionResults] = useState<Array<{ questionId: string; correct: boolean }>>([]);
  const [lessonStartedAt] = useState(() => Date.now());
  const [correctStreak, setCorrectStreak] = useState(0);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [correctStreakGoal, setCorrectStreakGoal] = useState(() => getLocalLessonSettings().correctStreakGoal);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  // Speech Simulator variables
  const [isListening, setIsListening] = useState(false);
  const [simulatedSpeechResult, setSimulatedSpeechResult] = useState<string>('');
  const [speechConfirmed, setSpeechConfirmed] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [mascotAudioSpeaking, setMascotAudioSpeaking] = useState(false);

  useEffect(() => {
    let active = true;
    loadLessonSettings().then(settings => {
      if (active) setCorrectStreakGoal(settings.correctStreakGoal);
    });

    const handleSettingsChange = (event: Event) => {
      const detail = (event as CustomEvent<{ correctStreakGoal?: number }>).detail;
      if (detail?.correctStreakGoal) setCorrectStreakGoal(detail.correctStreakGoal);
    };

    window.addEventListener('falla:lesson-settings-changed', handleSettingsChange);
    return () => {
      active = false;
      window.removeEventListener('falla:lesson-settings-changed', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    const start = () => setMascotAudioSpeaking(true);
    const end = () => setMascotAudioSpeaking(false);
    window.addEventListener('falla:speech-start', start);
    window.addEventListener('falla:speech-end', end);
    return () => {
      window.removeEventListener('falla:speech-start', start);
      window.removeEventListener('falla:speech-end', end);
    };
  }, []);

  // Ajuda e explicação local da questão
  const [showHint, setShowHint] = useState(false);
  const [showExplanationPage, setShowExplanationPage] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Chest opening game states
  const [showChestGame, setShowChestGame] = useState(false);
  const [chestState, setChestState] = useState<'closed' | 'opening' | 'opened'>('closed');
  const [randomXp, setRandomXp] = useState(0);
  const [randomCoins, setRandomCoins] = useState(0);

  // Inicializa recompensas balanceadas ao concluir a lição.
  // Com a configuração padrão, moedas e XP ficam entre 1 e 10,
  // sendo 3, 4, 5 e 6 os resultados mais frequentes.
  useEffect(() => {
    if (completed && (isPremium || lives > 0)) {
      const rewardConfig = loadShopConfig();

      setRandomXp(
        generateWeightedReward(
          rewardConfig.chestMaxXp,
          rewardConfig.chestCommonMin,
          rewardConfig.chestCommonMax,
        ),
      );

      setRandomCoins(
        generateWeightedReward(
          rewardConfig.chestMaxCoins,
          rewardConfig.chestCommonMin,
          rewardConfig.chestCommonMax,
        ),
      );
    }
  }, [completed, isPremium, lives]);

  // Chest opening animation timer
  useEffect(() => {
    let timer: any;
    if (chestState === 'opening') {
      timer = setTimeout(() => {
        setChestState('opened');
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [chestState]);

  const question: Question = lesson.questions[currentIdx];

  // Initialize word lists for Sentence Builder
  useEffect(() => {
    if (question && question.type === QuestionType.SENTENCE_BUILDER) {
      setSelectedWords([]);
      if (question.options) {
        setAvailableWords([...question.options]);
      } else {
        // Fallback options
        setAvailableWords(["hello", "please", "friend", "thank you"]);
      }
    }

    if (question && question.type === QuestionType.MATCH_PAIRS) {
      const rawPairs = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const parsedPairs = rawPairs
        .map((pair, pairIndex) => {
          const separatorIndex = pair.indexOf(':');
          if (separatorIndex < 0) return null;
          const left = pair.slice(0, separatorIndex).trim();
          const right = pair.slice(separatorIndex + 1).trim();
          if (!left || !right) return null;
          return { left, right, pairIndex };
        })
        .filter((pair): pair is { left: string; right: string; pairIndex: number } => Boolean(pair));

      setMatchLeftItems(shuffleItems(parsedPairs.map(pair => ({
        id: `left-${pair.pairIndex}`,
        text: pair.left,
        pairIndex: pair.pairIndex,
        side: 'left' as const,
      }))));
      setMatchRightItems(shuffleItems(parsedPairs.map(pair => ({
        id: `right-${pair.pairIndex}`,
        text: pair.right,
        pairIndex: pair.pairIndex,
        side: 'right' as const,
      }))));
      setSelectedMatchItem(null);
      setMatchedPairIndexes([]);
      setWrongMatchIds([]);
    }
    // Reset state
    setSelectedOpt(null);
    setHasChecked(false);
    setShowHint(false);
    setShowExplanationPage(false);
    setShowTranslation(false);
    setSimulatedSpeechResult('');
    setSpeechConfirmed(false);
    setSpeechError(null);
    setIsListening(false);
    speechRecognitionService.stop();
    // Interrompe qualquer áudio da questão anterior antes de mostrar a nova
    speechService.stop();
  }, [currentIdx, lesson, question?.id]);

  // Interrompe o áudio ao fechar a lição ou desmontar a tela
  useEffect(() => {
    return () => {
      speechService.stop();
      speechRecognitionService.stop();
    };
  }, []);

  if (!question) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm font-bold text-slate-500">Esta lição está sem questões. Por favor, adicione pelo painel Admin!</p>
        <button onClick={onCancel} className="mt-4 bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">Voltar</button>
      </div>
    );
  }

  const handleWordClick = (word: string, isFromWorkspace: boolean) => {
    if (hasChecked) return;
    if (isFromWorkspace) {
      // Remove from workspace, return to available
      setSelectedWords(selectedWords.filter(w => w !== word));
      setAvailableWords([...availableWords, word]);
    } else {
      // Add to workspace, remove from available
      setSelectedWords([...selectedWords, word]);
      setAvailableWords(availableWords.filter(w => w !== word));
    }
  };

  const handleMatchItemClick = (item: MatchPairItem) => {
    if (hasChecked || matchedPairIndexes.includes(item.pairIndex)) return;

    if (!selectedMatchItem) {
      setSelectedMatchItem(item);
      return;
    }

    if (selectedMatchItem.id === item.id) {
      setSelectedMatchItem(null);
      return;
    }

    if (selectedMatchItem.side === item.side) {
      setSelectedMatchItem(item);
      return;
    }

    if (selectedMatchItem.pairIndex === item.pairIndex) {
      setMatchedPairIndexes(prev => [...prev, item.pairIndex]);
      setSelectedMatchItem(null);
      playSound('correct');
      return;
    }

    const wrongIds = [selectedMatchItem.id, item.id];
    setWrongMatchIds(wrongIds);
    setSelectedMatchItem(null);
    playSound('wrong');
    window.setTimeout(() => setWrongMatchIds([]), 650);
  };

  const recognitionLanguage = (() => {
    const value = String(courseLanguage || '').toLowerCase();
    if (value.includes('portugu')) return 'pt-BR';
    if (value.includes('span') || value.includes('españ')) return 'es-ES';
    if (value.includes('fran')) return 'fr-FR';
    if (value.includes('german') || value.includes('alem')) return 'de-DE';
    if (value.includes('ital')) return 'it-IT';
    if (value.includes('japan') || value.includes('japon')) return 'ja-JP';
    return 'en-US';
  })();

  const startVoiceSim = async () => {
    if (hasChecked || isListening) return;
    setSpeechError(null);
    setSpeechConfirmed(false);
    setSelectedOpt(null);
    setIsListening(true);

    await speechRecognitionService.start(
      recognitionLanguage,
      (text) => {
        setSimulatedSpeechResult(text);
        setSpeechConfirmed(false);
      },
      (message) => setSpeechError(message),
      () => setIsListening(false),
    );
  };

  const stopVoiceCapture = async () => {
    await speechRecognitionService.stop();
    setIsListening(false);
  };

  const confirmSpeech = () => {
    const text = simulatedSpeechResult.trim();
    if (!text) return;
    setSelectedOpt(text);
    setSpeechConfirmed(true);
    setSpeechError(null);
  };

  const clearSpeech = async () => {
    await speechRecognitionService.stop();
    setIsListening(false);
    setSimulatedSpeechResult('');
    setSelectedOpt(null);
    setSpeechConfirmed(false);
    setSpeechError(null);
  };

  const checkAnswer = () => {
    if (hasChecked) return;

    let userAnsCorrect = false;

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      userAnsCorrect = selectedOpt === question.correctAnswer;
    } else if (question.type === QuestionType.SENTENCE_BUILDER) {
      const correctArr = question.correctAnswer as string[];
      // Compare arrays
      userAnsCorrect = selectedWords.length === correctArr.length &&
                       selectedWords.every((w, i) => w === correctArr[i]);
    } else if (question.type === QuestionType.SPEAK_SIM) {
      userAnsCorrect = speechConfirmed && selectedOpt?.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim();
    } else if (question.type === QuestionType.MATCH_PAIRS) {
      userAnsCorrect = matchLeftItems.length > 0 && matchedPairIndexes.length === matchLeftItems.length
    }

    setIsCorrect(userAnsCorrect);
    setHasChecked(true);
    setQuestionResults(prev => {
      const withoutCurrent = prev.filter(item => item.questionId !== question.id);
      return [...withoutCurrent, { questionId: question.id, correct: userAnsCorrect }];
    });
    playSound(userAnsCorrect ? 'correct' : 'wrong');

    if (userAnsCorrect) {
      setXpEarned(prev => prev + 5);
      setCorrectAnswers(prev => prev + 1);
      setCorrectStreak(prev => {
        const next = prev + 1;
        const reachedGoal = next >= correctStreakGoal && next % correctStreakGoal === 0;
        if (reachedGoal) {
          setStreakMilestone(next);
          setShowStreakCelebration(true);
          window.setTimeout(() => setShowStreakCelebration(false), 1800);
        }
        return next;
      });
    } else {
      setCorrectStreak(0);
      if (!isPremium) {
        setLives(prev => Math.max(0, prev - 1));
        onLoseLife();
      }
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < lesson.questions.length && (isPremium || lives > 0)) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCompleted(true);
    }
  };

  const openExplanationPage = () => {
    setShowHint(false);
    setShowExplanationPage(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const continueAfterExplanation = () => {
    setShowExplanationPage(false);
    nextQuestion();
  };

  const getMascotRecord = (name?: string) => {
    if (!name) return mascots.find(m => m.id === 'lico');
    const normalized = name.toLowerCase();
    return mascots.find(m => m.id.toLowerCase() === normalized || m.name.toLowerCase() === normalized || m.name.toLowerCase().startsWith(normalized));
  };

  const getMascotAvatar = (name?: string) => {
    if (name === "Lico") return licoMascot;
    if (name === "Teddy") return teddyMascot;
    if (name === "Luna") return lunaMascot;
    if (name === "Chico" || name === "Chico, o Yorkshire" || name === "Chico Yorkshire") return chicoMascot;
    return null;
  };

  const getMascotEmoji = (name?: string) => {
    if (name === "Lico") return "📖";
    if (name === "Teddy") return "🧸";
    if (name === "Luna") return "🦉";
    if (name === "Chico" || name === "Chico, o Yorkshire" || name === "Chico Yorkshire") return "🐶";
    if (name === "Bia") return "👧";
    if (name === "Guga") return "👦";
    if (name === "Pingo") return "🐧";
    return "💡";
  };

  const correctAnswerText = Array.isArray(question.correctAnswer)
    ? question.correctAnswer.join(' ')
    : question.correctAnswer;

  const localeBase = (localLanguage || 'pt-BR').split('-')[0].toLowerCase();
  const localizedTranslations = question.localizedTranslations || {};
  const localizedTranslation = localizedTranslations[localLanguage]
    || localizedTranslations[localeBase]
    || Object.entries(localizedTranslations).find(([key]) => key.split('-')[0].toLowerCase() === localeBase)?.[1];
  // O campo legado `translation` das planilhas atuais é em português.
  // Nunca exibimos a própria resposta como significado e não mostramos português para usuários de outro idioma.
  const legacyTranslation = localeBase === 'pt' ? question.translation : undefined;
  const translationCandidate = (localizedTranslation || legacyTranslation || '').trim();
  const questionTranslation = translationCandidate
    && translationCandidate.localeCompare(correctAnswerText.trim(), undefined, { sensitivity: 'accent' }) !== 0
      ? translationCandidate
      : undefined;

  const lessonLabels: Record<string, Record<string, string>> = {
    pt: { correct: 'Excelente! Resposta correta!', almost: 'Ah, quase lá!', earned: 'Muito bem! Você ganhou +5 XP nesta questão.', answerWas: 'A resposta correta era:', correctPhrase: 'Frase correta:', meaning: 'Significado:', pronunciation: 'Pronúncia:', unavailable: 'Tradução ainda não disponível neste idioma.', verify: 'Verificar resposta', next: 'Avançar', tutor: 'Tutor explica' },
    en: { correct: 'Excellent! Correct answer!', almost: 'Almost there!', earned: 'Great job! You earned +5 XP on this question.', answerWas: 'The correct answer was:', correctPhrase: 'Correct phrase:', meaning: 'Meaning:', pronunciation: 'Pronunciation:', unavailable: 'Translation is not available in this language yet.', verify: 'Check answer', next: 'Continue', tutor: 'Tutor explains' },
    es: { correct: '¡Excelente! ¡Respuesta correcta!', almost: '¡Casi!', earned: '¡Muy bien! Ganaste +5 XP en esta pregunta.', answerWas: 'La respuesta correcta era:', correctPhrase: 'Frase correcta:', meaning: 'Significado:', pronunciation: 'Pronunciación:', unavailable: 'La traducción aún no está disponible en este idioma.', verify: 'Comprobar respuesta', next: 'Continuar', tutor: 'Explicación' },
    fr: { correct: 'Excellent ! Bonne réponse !', almost: 'Presque !', earned: 'Bravo ! Vous avez gagné +5 XP.', answerWas: 'La bonne réponse était :', correctPhrase: 'Phrase correcte :', meaning: 'Signification :', pronunciation: 'Prononciation :', unavailable: "La traduction n’est pas encore disponible dans cette langue.", verify: 'Vérifier', next: 'Continuer', tutor: 'Explication' },
    de: { correct: 'Ausgezeichnet! Richtige Antwort!', almost: 'Fast geschafft!', earned: 'Sehr gut! Du hast +5 XP verdient.', answerWas: 'Die richtige Antwort war:', correctPhrase: 'Richtiger Satz:', meaning: 'Bedeutung:', pronunciation: 'Aussprache:', unavailable: 'Für diese Sprache ist noch keine Übersetzung verfügbar.', verify: 'Antwort prüfen', next: 'Weiter', tutor: 'Erklärung' },
    it: { correct: 'Eccellente! Risposta corretta!', almost: 'Quasi!', earned: 'Molto bene! Hai guadagnato +5 XP.', answerWas: 'La risposta corretta era:', correctPhrase: 'Frase corretta:', meaning: 'Significato:', pronunciation: 'Pronuncia:', unavailable: 'La traduzione non è ancora disponibile in questa lingua.', verify: 'Verifica risposta', next: 'Continua', tutor: 'Spiegazione' },
  };
  const t = lessonLabels[localeBase] || lessonLabels.en;
  const displayContext = question.context || question.dialogue?.join('\n');
  const staticHint = question.hintText?.trim()
    || (question.pronunciation ? `Observe a pronúncia: ${question.pronunciation}` : undefined)
    || (questionTranslation ? `Pense no significado da frase: ${questionTranslation}` : undefined)
    || (question.type === QuestionType.MULTIPLE_CHOICE
      ? 'Ouça com atenção e procure nas alternativas as palavras que combinam com o sentido da frase.'
      : question.type === QuestionType.SENTENCE_BUILDER
      ? 'Comece pelo sujeito, depois escolha o verbo e complete a frase na ordem natural.'
      : question.type === QuestionType.MATCH_PAIRS
      ? 'Leia uma palavra de cada coluna e procure o par com o mesmo significado.'
      : 'Fale devagar, separando as palavras, e confira o texto reconhecido antes de confirmar.');


  const renderHighlightedText = (text: string) => {
    const keywords = new Set(
      correctAnswerText
        .toLowerCase()
        .replace(/[^a-zà-ÿ0-9' ]/gi, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 4),
    );

    return text.split(/(\s+)/).map((part, index) => {
      const normalized = part.toLowerCase().replace(/[^a-zà-ÿ0-9']/gi, '');
      if (keywords.has(normalized)) {
        return <mark key={`${part}-${index}`} className="bg-sky-100 text-sky-800 rounded-md px-1 py-0.5">{part}</mark>;
      }
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
  };

  if (showChestGame) {
    const isLeveledUp = (userXp + randomXp) >= 100;
    const levelUpsGained = Math.floor((userXp + randomXp) / 100);
    const calculatedNewLevel = userLevel + levelUpsGained;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-gradient-to-b from-indigo-950 to-slate-900 rounded-3xl border-2 border-indigo-400 p-8 shadow-2xl text-center space-y-6 text-white relative overflow-hidden"
      >
        {/* Background stars / sparks decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]"></div>

        <h2 className="text-2xl font-black text-falla-yellow tracking-tight drop-shadow-sm uppercase">
          {chestState === 'closed' && '🎁 Baú do Tesouro!'}
          {chestState === 'opening' && '✨ Abrindo Baú...'}
          {chestState === 'opened' && '🎉 Baú Aberto!'}
        </h2>
        <p className="text-slate-300 text-xs font-bold leading-normal">
          {chestState === 'closed' && 'Você jogou muito bem hoje! Abra o baú misterioso para ganhar XP e moedas de sorte!'}
          {chestState === 'opening' && 'Prepare-se! O seu prêmio de sorte está chegando...'}
          {chestState === 'opened' && 'Incrível! Veja as moedas e a experiência de sorte que você conquistou!'}
        </p>

        {/* Chest Visual Container */}
        <div className="h-44 flex items-center justify-center relative">
          {/* Outer glow effect */}
          <div className={`absolute w-36 h-36 rounded-full blur-xl transition-all duration-1000 ${
            chestState === 'opened' ? 'bg-falla-yellow/40 scale-125 animate-pulse' : 'bg-falla-blue/20'
          }`} />

          <motion.div
            key={chestState}
            className="select-none cursor-pointer"
            animate={chestState === 'opening' ? {
              rotate: [0, -10, 10, -10, 10, -8, 8, -4, 4, 0],
              scale: [1, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1],
              transition: { duration: 1.5, repeat: Infinity }
            } : chestState === 'opened' ? {
              scale: [1, 1.25, 1],
              rotate: [0, 5, -5, 0],
              transition: { duration: 0.6 }
            } : {
              scale: [1, 1.05, 1],
              transition: { duration: 2, repeat: Infinity }
            }}
            onClick={() => {
              if (chestState === 'closed') {
                setChestState('opening');
              }
            }}
          >
            {chestState === 'closed' && <ClosedChest className="w-40 h-40" />}
            {chestState === 'opening' && <ClosedChest className="w-40 h-40" />}
            {chestState === 'opened' && <OpenedChest className="w-40 h-40" />}
          </motion.div>

          {/* Sparkles on opened state */}
          {chestState === 'opened' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span className="text-2xl absolute -top-4 -left-4 animate-bounce">⭐</span>
              <span className="absolute -bottom-4 -right-4 animate-bounce"><GoldCoinIcon className="w-7 h-7" /></span>
              <span className="text-xl absolute top-8 right-0 animate-pulse">✨</span>
              <span className="text-xl absolute bottom-8 left-0 animate-pulse">✨</span>
            </div>
          )}
        </div>

        {/* Rewards / Interactive Reveal */}
        {chestState === 'opened' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3.5">
              {/* XP Box */}
              <div className="bg-white/10 border-2 border-indigo-450 p-4 rounded-2xl text-center shadow-md relative overflow-hidden group">
                <span className="text-2xl block mb-1">💎</span>
                <span className="text-[10px] text-slate-300 font-extrabold uppercase block tracking-wider">XP Sorteado</span>
                <span className="text-2xl font-black text-falla-yellow">+{randomXp} XP</span>
              </div>

              {/* Coins Box */}
              <div className="bg-white/10 border-2 border-indigo-450 p-4 rounded-2xl text-center shadow-md relative overflow-hidden group">
                <GoldCoinIcon className="w-7 h-7 mx-auto block mb-1" />
                <span className="text-[10px] text-slate-300 font-extrabold uppercase block tracking-wider">Moedas Sorte</span>
                <span className="text-2xl font-black text-amber-400">+{randomCoins} Moedas</span>
              </div>
            </div>

            {/* Level up banner! */}
            {isLeveledUp && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-amber-500 to-falla-pink p-3.5 rounded-2xl border-2 border-white shadow-lg text-white font-black text-xs space-y-1"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>🎉</span>
                  <span className="uppercase tracking-wider font-extrabold">VOCÊ SUBIU DE NÍVEL!</span>
                  <span>🎉</span>
                </div>
                <div className="text-base text-falla-yellow font-black drop-shadow-sm">
                  Nível {userLevel} ➔ Nível {calculatedNewLevel}
                </div>
                <p className="text-[10px] text-white/90 font-bold leading-normal">
                  Sua experiência acumulada atingiu 100 XP! O nível avançou e sua experiência foi zerada para o próximo nível.
                </p>
              </motion.div>
            )}

            <button
              onClick={() => onComplete(randomXp, randomCoins, correctAnswers, lesson.questions.length, questionResults, Math.max(1, Math.round((Date.now() - lessonStartedAt) / 1000)))}
              className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black py-4 px-6 rounded-2xl shadow-lg border-b-4 border-b-green-700 active:translate-y-0.5 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Coletar e Concluir 🚀
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Action buttons */}
            {chestState === 'closed' ? (
              <button
                onClick={() => setChestState('opening')}
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-4 px-6 rounded-2xl shadow-md border-b-4 border-b-sky-600 active:translate-y-0.5 transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🎁</span> Abrir Baú da Sorte!
              </button>
            ) : (
              <div className="text-sm font-black text-falla-yellow animate-pulse py-2">
                Chacoalhando o Baú... 📦✨
              </div>
            )}

            {/* Skip animation button */}
            <button
              onClick={() => {
                setChestState('opened');
              }}
              className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-[11px] uppercase tracking-wider hover:text-white transition-all cursor-pointer"
            >
              ⚡ Pular Animação
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  if (completed || (!isPremium && lives <= 0)) {
    const isSuccess = isPremium || lives > 0;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6"
      >
        {isSuccess ? (
          <>
            <span className="text-6xl inline-block animate-bounce">🏆</span>
            <h2 className="text-2xl font-black text-slate-800">Parabéns! Lição Concluída!</h2>
            <p className="text-slate-500 text-sm">
              Você dominou esta lição com sucesso! Seus mascotes estão orgulhosos de você.
            </p>
            
            <div className="bg-indigo-50 border-2 border-indigo-100 p-4.5 rounded-2xl text-indigo-900 text-xs font-bold leading-relaxed text-center shadow-2xs">
              🎁 <strong>Bônus de Sucesso:</strong> Você ganhou o direito de abrir um Baú do Tesouro misterioso! Venha descobrir quanta Experiência e Moedas você ganhou hoje por sorte!
            </div>
            
            <div className="flex gap-2 justify-center">
              <img src={licoMascot} className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
              <img src={lunaMascot} className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
            </div>

            <button
              onClick={() => setShowChestGame(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
            >
              Ir para o Baú 🎁
            </button>
          </>
        ) : (
          <>
            <span className="text-6xl inline-block animate-pulse">🧸</span>
            <h2 className="text-2xl font-black text-slate-800">Sem vidas restantes...</h2>
            <p className="text-slate-500 text-sm">
              Não se preocupe! O Teddy está aqui para te dar forças e te apoiar. Que tal tentar mais uma vez juntos?
            </p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-xs leading-relaxed text-left">
              <strong>🧸 Mensagem do Teddy:</strong> "Tudo bem errar, amiguinho! O erro é a escada para o acerto. Respire fundo, descanse um pouquinho e vamos recomeçar. Eu acredito em você!"
            </div>
            <button
              onClick={onCancel}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={16} /> Voltar e Estudar de Novo
            </button>
          </>
        )}
      </motion.div>
    );
  }

  if (showExplanationPage && hasChecked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto min-h-[70vh] flex items-center px-3 py-5"
      >
        <div
          className="w-full overflow-hidden rounded-[2rem] border shadow-xl"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <button
              type="button"
              onClick={() => setShowExplanationPage(false)}
              className="text-xs font-black text-slate-500 hover:text-slate-700"
            >
              ← Voltar
            </button>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Entenda a resposta
            </span>
            <span className="text-[11px] font-black text-slate-400">
              {currentIdx + 1}/{lesson.questions.length}
            </span>
          </div>

          <div className="p-5 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="shrink-0">
                <AnimatedLessonMascot
                  moduleMascotUrl={moduleMascotUrl}
                  mascot={getMascotRecord(question.characterHint)}
                  fallbackUrl={getMascotAvatar(question.characterHint)}
                  fallbackEmoji={getMascotEmoji(question.characterHint)}
                  alt={question.characterHint || 'Mascote'}
                  state={isCorrect ? 'correct' : 'wrong'}
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isCorrect ? <CheckCircle size={15} /> : <BookOpen size={15} />}
                  {isCorrect ? 'Resposta correta' : 'Vamos revisar'}
                </div>
                <h2 className="mt-3 text-xl md:text-2xl font-black text-slate-800">
                  {isCorrect ? 'Muito bem! Veja por que está certo.' : 'Esta é a resposta correta.'}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Leia, escute e siga para a próxima questão quando estiver pronto.
                </p>
              </div>
            </div>

            <div
              className="rounded-3xl border-2 p-5 space-y-4"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-card-bg) 92%, var(--theme-primary-light))',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--theme-accent)' }}>
                    Frase correta
                  </p>
                  <p className="mt-1 text-lg md:text-xl font-black text-slate-800 leading-snug">
                    {correctAnswerText}
                  </p>
                </div>
                <AudioButton text={correctAnswerText} compact />
              </div>

              {questionTranslation && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Significado</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{questionTranslation}</p>
                </div>
              )}

              {question.pronunciation && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pronúncia</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{question.pronunciation}</p>
                </div>
              )}

              {(question.hintText || displayContext) && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Como lembrar</p>
                  <p className="mt-1 text-sm font-bold text-slate-600 leading-relaxed">
                    {question.hintText || displayContext}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={continueAfterExplanation}
              className="w-full rounded-2xl border-b-4 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition-all active:translate-y-0.5 active:border-b-0"
              style={{
                backgroundColor: 'var(--theme-primary)',
                borderBottomColor: 'var(--theme-primary-dark)',
              }}
            >
              {currentIdx + 1 < lesson.questions.length ? 'Próxima questão' : 'Concluir lição'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const progressPercent = ((currentIdx + (hasChecked ? 1 : 0)) / lesson.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <AnimatePresence>
        {showStreakCelebration && streakMilestone !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ type: 'spring', stiffness: 210, damping: 16 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-6"
          >
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border-2 p-6 text-center shadow-2xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-card-bg) 94%, var(--theme-primary-light))',
                borderColor: 'var(--theme-primary)',
              }}
            >
              <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at center, var(--theme-accent), transparent 68%)' }} />
              <div className="relative flex flex-col items-center">
                <AnimatedLessonMascot
                  moduleMascotUrl={moduleMascotUrl}
                  mascot={getMascotRecord(question.characterHint)}
                  fallbackUrl={getMascotAvatar(question.characterHint)}
                  fallbackEmoji={getMascotEmoji(question.characterHint)}
                  alt={question.characterHint || 'Mascote'}
                  state="correct"
                />
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.12 }}
                >
                  <div className="text-5xl font-black leading-none" style={{ color: 'var(--theme-primary)' }}>{streakMilestone}</div>
                  <div className="mt-1 text-xl font-black text-slate-800">acertos em sequência!</div>
                  <div className="mt-1 text-sm font-bold text-slate-500">Muito bem, continue assim!</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm"
            onClick={() => setShowHint(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-sm rounded-[1.75rem] border-2 p-5 shadow-2xl"
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-primary) 14%, transparent)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  <Lightbulb size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Dica da questão</h3>
                  <p className="text-[11px] font-bold text-slate-400">Use a pista e tente responder sozinho.</p>
                </div>
              </div>

              <div
                className="mt-4 rounded-2xl border p-4 text-sm font-bold leading-relaxed text-slate-700"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'color-mix(in srgb, var(--theme-card-bg) 94%, var(--theme-primary-light))',
                }}
              >
                {staticHint}
              </div>

              <button
                type="button"
                onClick={() => setShowHint(false)}
                className="mt-4 w-full rounded-2xl border-b-4 px-4 py-3 text-xs font-black uppercase tracking-wider text-white active:translate-y-0.5 active:border-b-0"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  borderBottomColor: 'var(--theme-primary-dark)',
                }}
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Lesson Player */}
      <div 
        className="lg:col-span-2 rounded-3xl border shadow-xs overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-border)'
        }}
      >
        
        {/* Top Progress bar & stats */}
        <div
          className="p-4 md:p-5 border-b-2 space-y-3"
          style={{
            borderBottomColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg)'
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-all font-black text-xs uppercase tracking-wider cursor-pointer">
              ✕ Fechar
            </button>
            <span className="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-wider">
              Questão {currentIdx + 1} de {lesson.questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="shrink-0 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-black"
              style={{
                color: 'var(--theme-danger, #ef4444)',
                backgroundColor: 'color-mix(in srgb, var(--theme-danger, #ef4444) 10%, var(--theme-card-bg))',
                border: '1px solid color-mix(in srgb, var(--theme-danger, #ef4444) 24%, transparent)',
              }}
              title="Vidas"
            >
              <Heart size={16} fill="currentColor" /> {isPremium ? '∞' : lives}
            </div>
            <div className="h-3.5 md:h-4 flex-1 bg-slate-200/70 rounded-full overflow-hidden border border-slate-300 shadow-inner">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{ backgroundColor: 'var(--theme-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Gameplay Stage */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Cartão principal da pergunta, inspirado no modelo escolhido */}
          <div className="space-y-4">
            <div
              className="overflow-hidden rounded-[1.75rem] border-2 shadow-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--theme-primary) 65%, var(--theme-border))',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <div className="relative grid grid-cols-[112px_1fr] md:grid-cols-[170px_1fr] items-center gap-3 md:gap-6 min-h-[210px] p-4 md:p-7">
                <div className="flex items-end justify-center self-stretch overflow-hidden">
                  <AnimatedLessonMascot
                  moduleMascotUrl={moduleMascotUrl}
                    mascot={getMascotRecord(question.characterHint)}
                    fallbackUrl={getMascotAvatar(question.characterHint)}
                    fallbackEmoji={getMascotEmoji(question.characterHint)}
                    alt={question.characterHint || 'Mascote'}
                    state={mascotAudioSpeaking ? 'speaking' : isListening ? 'listening' : hasChecked ? (isCorrect ? 'correct' : 'wrong') : 'idle'}
                  />
                </div>

                <div
                  className="relative rounded-[1.5rem] border-2 p-4 md:p-6 min-w-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-card-bg) 90%, var(--theme-primary-light))',
                    borderColor: 'color-mix(in srgb, var(--theme-primary) 22%, var(--theme-border))',
                  }}
                >
                  <div
                    className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 border-l-2 border-b-2"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-card-bg) 90%, var(--theme-primary-light))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 22%, var(--theme-border))',
                    }}
                  />
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase mb-2 tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                    <Volume2 size={15} /> {question.type === QuestionType.SPEAK_SIM ? 'Pronuncie a frase' : (question.characterHint || 'Guia')}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-slate-800 text-xl md:text-3xl flex-1 leading-tight break-words">
                      {renderHighlightedText(question.text || question.prompt)}
                    </p>
                    <AudioButton text={question.text || question.prompt} compact />
                  </div>
                </div>
              </div>

              <div
                className="px-5 py-4 text-center text-white text-base md:text-lg font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))' }}
              >
                {question.prompt}
              </div>
            </div>

            {(displayContext || question.contextImage) && (
              <div className="rounded-2xl border p-4 flex gap-3 items-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg)' }}>
                {question.contextImage && (
                  <img src={question.contextImage} alt="Contexto da questão" className="w-20 h-20 rounded-2xl object-cover border" style={{ borderColor: 'var(--theme-border)' }} />
                )}
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--theme-primary)' }}>Contexto da conversa</div>
                  <p className="whitespace-pre-line text-sm font-bold text-slate-700 leading-relaxed">{displayContext}</p>
                </div>
              </div>
            )}

            {questionTranslation && (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card-bg)' }}>
                <button
                  type="button"
                  onClick={() => setShowTranslation(value => !value)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-black text-slate-600 hover:opacity-80 transition-opacity"
                >
                  <span className="flex items-center gap-2"><Languages size={16} style={{ color: 'var(--theme-primary)' }} /> {showTranslation ? 'Ocultar tradução' : 'Toque para ver a tradução'}</span>
                  <span>{showTranslation ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {showTranslation && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 text-sm font-bold text-slate-700">{questionTranslation}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Answer Inputs Workspace */}
          <div className="py-2">
            
            {question.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="grid grid-cols-1 gap-3">
                {question.options?.map((opt, optionIndex) => {
                  const isSel = selectedOpt === opt;
                  const isRightOption = hasChecked && opt === correctAnswerText;
                  const isWrongSelection = hasChecked && isSel && opt !== correctAnswerText;
                  const stateClasses = isRightOption
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                    : isWrongSelection
                    ? 'border-red-400 bg-red-50 text-red-800 ring-4 ring-red-100'
                    : isSel
                    ? 'ring-4 ring-sky-100'
                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 bg-white';

                  return (
                    <motion.div key={opt} className="relative" whileTap={!hasChecked ? { scale: 0.985 } : undefined}>
                      <button
                        onClick={() => { if (!hasChecked) { playSound('click'); setSelectedOpt(opt); } }}
                        disabled={hasChecked}
                        className={`w-full min-h-[62px] p-4 pl-14 pr-14 rounded-2xl border-2 text-left font-black text-sm transition-all flex justify-between items-center shadow-sm ${stateClasses}`}
                        style={{
                          borderColor: isSel && !hasChecked ? 'var(--theme-primary)' : undefined,
                          backgroundColor: isSel && !hasChecked ? 'var(--theme-primary-light)' : undefined,
                          color: isSel && !hasChecked ? 'var(--theme-primary-dark)' : undefined
                        }}
                      >
                        <span className="absolute left-4 w-7 h-7 rounded-full border-2 border-current/20 flex items-center justify-center text-xs opacity-80">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span>{opt}</span>
                        <span className="absolute right-11">
                          {isRightOption ? <CheckCircle size={22} className="text-emerald-500" /> : isWrongSelection ? <XCircle size={22} className="text-red-500" /> : (
                            <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: isSel ? 'var(--theme-primary)' : '#cbd5e1', backgroundColor: isSel ? 'var(--theme-primary)' : 'transparent' }}>
                              {isSel && <span className="w-2 h-2 bg-white rounded-full" />}
                            </span>
                          )}
                        </span>
                      </button>
                      <span className="absolute top-1/2 -translate-y-1/2 right-2 z-10">
                        <AudioButton text={opt} compact />
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {question.type === QuestionType.SENTENCE_BUILDER && (
              <div className="space-y-6">
                {/* Sentence assembly workspace box */}
                <div className="min-h-[80px] bg-slate-50 border-2 border-dashed border-slate-250 rounded-3xl p-4 flex flex-wrap gap-2 items-center">
                  {selectedWords.length === 0 && (
                    <span className="text-slate-400 text-xs font-bold pl-2">Clique nas palavras abaixo para montar a frase...</span>
                  )}
                  {selectedWords.map((word) => (
                    <button
                      key={word}
                      onClick={() => handleWordClick(word, true)}
                      disabled={hasChecked}
                      className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm px-4 py-2 rounded-2xl font-black text-xs text-slate-700 hover:bg-slate-50 transition-all animate-fade-in card-bouncy"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {/* Available words pool */}
                <div className="flex flex-wrap gap-2 justify-center py-2 border-t border-slate-100 pt-4">
                  {availableWords.map((word) => (
                    <div key={word} className="relative">
                      <button
                        onClick={() => handleWordClick(word, false)}
                        disabled={hasChecked}
                        className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-xs pl-4 pr-8 py-2.5 rounded-2xl font-black text-xs text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all active:translate-y-0.5 active:border-b-2 card-bouncy"
                      >
                        {word}
                      </button>
                      {/* Ouvir a pronúncia da palavra, sem selecioná-la */}
                      <span className="absolute top-1/2 -translate-y-1/2 right-1 z-10">
                        <AudioButton text={word} compact className="scale-75" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.type === QuestionType.SPEAK_SIM && (
              <div className="flex flex-col items-center justify-center py-5 space-y-4">
                <button
                  type="button"
                  onClick={isListening ? stopVoiceCapture : startVoiceSim}
                  disabled={hasChecked}
                  aria-label={isListening ? 'Parar gravação' : 'Começar gravação'}
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 transition-all text-white active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: isListening ? '#ef4444' : 'var(--theme-primary)',
                    borderColor: isListening ? '#fecaca' : 'var(--theme-primary-dark)'
                  }}
                >
                  {isListening ? (
                    <div className="flex gap-1">
                      <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  ) : <Mic size={32} />}
                </button>

                <div className="text-center">
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider">
                    {isListening ? 'Ouvindo... toque para parar' : simulatedSpeechResult ? 'Confira o que foi entendido' : 'Toque no microfone e fale a frase'}
                  </p>
                </div>

                <div className="w-full max-w-xl space-y-3">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500" htmlFor={`speech-answer-${question.id}`}>
                    O que você falou
                  </label>
                  <textarea
                    id={`speech-answer-${question.id}`}
                    value={simulatedSpeechResult}
                    onChange={(event) => {
                      setSimulatedSpeechResult(event.target.value);
                      setSelectedOpt(null);
                      setSpeechConfirmed(false);
                    }}
                    disabled={hasChecked || isListening}
                    placeholder="A fala reconhecida aparecerá aqui. Você também pode corrigir o texto antes de confirmar."
                    rows={3}
                    className={`w-full resize-none rounded-2xl border-2 px-4 py-3 text-sm font-bold outline-none transition-all ${
                      speechConfirmed
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-700 focus:border-sky-400'
                    }`}
                  />

                  {speechError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                      {speechError}
                    </div>
                  )}

                  {speechConfirmed && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 flex items-center gap-2">
                      <CheckCircle size={16} /> Resposta confirmada. Agora toque em “Verificar resposta”.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={clearSpeech}
                      disabled={hasChecked || (!simulatedSpeechResult && !speechError)}
                      className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <RotateCcw size={16} /> Apagar
                    </button>
                    <button
                      type="button"
                      onClick={startVoiceSim}
                      disabled={hasChecked || isListening}
                      className="rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-xs font-black text-sky-700 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Mic size={16} /> Falar novamente
                    </button>
                    <button
                      type="button"
                      onClick={confirmSpeech}
                      disabled={hasChecked || isListening || !simulatedSpeechResult.trim()}
                      className="rounded-2xl border-b-4 px-4 py-3 text-xs font-black text-white flex items-center justify-center gap-2 disabled:opacity-40"
                      style={{ backgroundColor: 'var(--theme-success, #10b981)', borderBottomColor: '#059669' }}
                    >
                      <CheckCircle size={16} /> Confirmar resposta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {question.type === QuestionType.MATCH_PAIRS && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase">Associe as palavras equivalentes:</p>
                  <p className="text-[11px] font-bold text-slate-500">Escolha uma palavra de cada coluna.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {[matchLeftItems, matchRightItems].map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(item => {
                        const isMatched = matchedPairIndexes.includes(item.pairIndex);
                        const isSelected = selectedMatchItem?.id === item.id;
                        const isWrong = wrongMatchIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleMatchItemClick(item)}
                            disabled={hasChecked || isMatched}
                            className={`w-full min-h-14 p-3 border-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                              isMatched
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-700 opacity-75'
                                : isWrong
                                ? 'bg-red-50 border-red-400 text-red-700 animate-pulse'
                                : isSelected
                                ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-md -translate-y-0.5'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50/40'
                            }`}
                          >
                            {isMatched && <CheckCircle size={15} className="shrink-0" />}
                            <span>{item.text}</span>
                            <span onClick={event => event.stopPropagation()}>
                              <AudioButton text={item.text} compact className="scale-75 shrink-0" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs font-black text-slate-500">
                  {matchedPairIndexes.length} de {matchLeftItems.length} pares encontrados
                </p>
              </div>
            )}

          </div>

          {/* Verification feedback drawer */}
          <div 
            className="border-t-2 border-slate-100 mt-4 sticky bottom-0 z-20 p-3 md:p-5"
            style={{
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {!hasChecked ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="text-white font-black text-xs px-4 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-sm border-b-4 active:translate-y-0.5 active:border-b-0 cursor-pointer shrink-0"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    borderBottomColor: 'var(--theme-primary-dark)'
                  }}
                >
                  <Lightbulb size={16} />
                  Dica
                </button>
                <button
                  onClick={checkAnswer}
                  disabled={question.type === QuestionType.MULTIPLE_CHOICE ? !selectedOpt : question.type === QuestionType.SENTENCE_BUILDER ? selectedWords.length === 0 : question.type === QuestionType.MATCH_PAIRS ? matchLeftItems.length === 0 || matchedPairIndexes.length !== matchLeftItems.length : question.type === QuestionType.SPEAK_SIM ? !speechConfirmed : false}
                  className={`flex-1 min-w-0 font-black text-xs py-3.5 px-6 rounded-2xl transition-all shadow-md uppercase tracking-wider ${
                    (question.type === QuestionType.MULTIPLE_CHOICE && !selectedOpt) || (question.type === QuestionType.SENTENCE_BUILDER && selectedWords.length === 0) || (question.type === QuestionType.MATCH_PAIRS && (matchLeftItems.length === 0 || matchedPairIndexes.length !== matchLeftItems.length)) || (question.type === QuestionType.SPEAK_SIM && !speechConfirmed)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-b-slate-300'
                      : 'text-white border-b-4 active:translate-y-0.5 active:border-b-0 cursor-pointer'
                  }`}
                  style={{
                    backgroundColor: ((question.type === QuestionType.MULTIPLE_CHOICE && !selectedOpt) || (question.type === QuestionType.SENTENCE_BUILDER && selectedWords.length === 0) || (question.type === QuestionType.MATCH_PAIRS && (matchLeftItems.length === 0 || matchedPairIndexes.length !== matchLeftItems.length)) || (question.type === QuestionType.SPEAK_SIM && !speechConfirmed))
                      ? undefined
                      : 'var(--theme-primary)',
                    borderBottomColor: ((question.type === QuestionType.MULTIPLE_CHOICE && !selectedOpt) || (question.type === QuestionType.SENTENCE_BUILDER && selectedWords.length === 0) || (question.type === QuestionType.MATCH_PAIRS && (matchLeftItems.length === 0 || matchedPairIndexes.length !== matchLeftItems.length)) || (question.type === QuestionType.SPEAK_SIM && !speechConfirmed))
                      ? undefined
                      : 'var(--theme-primary-dark)'
                  }}
                >
                  {t.verify}
                </button>
              </div>
            ) : (
              <div
                className={`rounded-2xl border-2 px-4 py-3 flex items-center gap-3 animate-fade-in ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle size={26} className="shrink-0 text-emerald-500" />
                ) : (
                  <XCircle size={26} className="shrink-0 text-red-500" />
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black leading-tight">
                    {isCorrect ? 'Muito bem! Resposta correta.' : 'Quase! Vamos entender a resposta.'}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-bold opacity-75">
                    A explicação aparecerá antes da próxima questão.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openExplanationPage}
                  className="shrink-0 rounded-xl border-b-4 px-4 py-2.5 text-xs font-black text-white transition-all active:translate-y-0.5 active:border-b-0"
                  style={{
                    backgroundColor: isCorrect ? 'var(--theme-success, #22c55e)' : 'var(--theme-primary)',
                    borderBottomColor: isCorrect ? '#16a34a' : 'var(--theme-primary-dark)',
                  }}
                >
                  {t.next} <ArrowRight size={14} className="inline ml-1" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>


    </div>
  );
}
