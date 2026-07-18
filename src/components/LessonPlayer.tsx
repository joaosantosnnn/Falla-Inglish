import React, { useState, useEffect } from 'react';
import { Lesson, Question, QuestionType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Trophy, CheckCircle, XCircle, ArrowRight, Sparkles, 
  HelpCircle, Volume2, Mic, RotateCcw, MessageSquare, Lightbulb 
} from 'lucide-react';

interface LessonPlayerProps {
  lesson: Lesson;
  courseLanguage: string;
  onComplete: (xpEarned: number, coinsEarned: number) => void;
  onCancel: () => void;
  userXp: number;
  userLevel: number;
}

export default function LessonPlayer({ lesson, courseLanguage, onComplete, onCancel, userXp, userLevel }: LessonPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  
  // Sentence Builder variables
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [lives, setLives] = useState(5);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Speech Simulator variables
  const [isListening, setIsListening] = useState(false);
  const [simulatedSpeechResult, setSimulatedSpeechResult] = useState<string | null>(null);

  // Gemini AI Help State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Chest opening game states
  const [showChestGame, setShowChestGame] = useState(false);
  const [chestState, setChestState] = useState<'closed' | 'opening' | 'opened'>('closed');
  const [randomXp, setRandomXp] = useState(0);
  const [randomCoins, setRandomCoins] = useState(0);

  // Initialize random rewards on success screen entry
  useEffect(() => {
    if (completed && lives > 0) {
      setRandomXp(Math.floor(Math.random() * 100) + 1);
      setRandomCoins(Math.floor(Math.random() * 100) + 1);
    }
  }, [completed, lives]);

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
    // Reset state
    setSelectedOpt(null);
    setHasChecked(false);
    setAiExplanation(null);
    setShowAiPanel(false);
    setSimulatedSpeechResult(null);
    setIsListening(false);
  }, [currentIdx, lesson, question?.id]);

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

  const startVoiceSim = () => {
    if (hasChecked) return;
    setIsListening(true);
    setSimulatedSpeechResult(null);
    setTimeout(() => {
      setIsListening(false);
      setSimulatedSpeechResult(question.correctAnswer as string);
      setSelectedOpt(question.correctAnswer as string);
    }, 2500);
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
      userAnsCorrect = simulatedSpeechResult?.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim();
    } else if (question.type === QuestionType.MATCH_PAIRS) {
      userAnsCorrect = true; // Match pairs demo is auto-correct for easy gameplay
    }

    setIsCorrect(userAnsCorrect);
    setHasChecked(true);

    if (userAnsCorrect) {
      setXpEarned(prev => prev + 5);
    } else {
      setLives(prev => Math.max(0, prev - 1));
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < lesson.questions.length && lives > 0) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCompleted(true);
    }
  };

  // Ask Gemini Tutor for an interactive explanation
  const askGeminiTutor = async () => {
    setAiLoading(true);
    setShowAiPanel(true);
    setAiExplanation(null);
    try {
      const phraseToExplain = question.type === QuestionType.MULTIPLE_CHOICE 
        ? `${question.prompt} (Resposta Correta: ${question.correctAnswer})`
        : `Construir frase: ${question.prompt} (Resposta Correta: ${(question.correctAnswer as string[]).join(' ')})`;

      const { data, error } = await supabase.functions.invoke('gemini-explain', {
        body: {
          phrase: phraseToExplain,
          language: courseLanguage,
          mascot: question.characterHint || "Lico"
        }
      });

      if (error) throw error;
      setAiExplanation(data?.explanation || "Não recebemos uma resposta válida do tutor de IA.");
    } catch (e: any) {
      console.error(e);
      setAiExplanation("Não foi possível conectar com o tutor de IA no Supabase. Verifique sua conexão ou se a chave API está configurada nas Edge Functions!");
    } finally {
      setAiLoading(false);
    }
  };

  const getMascotAvatar = (name?: string) => {
    if (name === "Lico") return "/src/assets/images/lico_mascot_1784292046285.jpg";
    if (name === "Teddy") return "/src/assets/images/teddy_mascot_1784292056581.jpg";
    if (name === "Luna") return "/src/assets/images/luna_mascot_1784292067117.jpg";
    return null;
  };

  const getMascotEmoji = (name?: string) => {
    if (name === "Lico") return "📖";
    if (name === "Teddy") return "🧸";
    if (name === "Luna") return "🦉";
    if (name === "Bia") return "👧";
    if (name === "Guga") return "👦";
    if (name === "Pingo") return "🐧";
    return "💡";
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
          <div className={`absolute w-32 h-32 rounded-full blur-xl transition-all duration-1000 ${
            chestState === 'opened' ? 'bg-falla-yellow/40 scale-125 animate-pulse' : 'bg-falla-blue/20'
          }`} />

          <motion.div
            key={chestState}
            className="text-8xl select-none cursor-pointer filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
            animate={chestState === 'opening' ? {
              rotate: [0, -12, 12, -12, 12, -8, 8, -4, 4, 0],
              scale: [1, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1],
              transition: { duration: 1.5, repeat: Infinity }
            } : chestState === 'opened' ? {
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 0],
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
            {chestState === 'closed' && '📦'}
            {chestState === 'opening' && '📦'}
            {chestState === 'opened' && '🔓'}
          </motion.div>

          {/* Sparkles on opened state */}
          {chestState === 'opened' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span className="text-2xl absolute -top-4 -left-4 animate-bounce">⭐</span>
              <span className="text-2xl absolute -bottom-4 -right-4 animate-bounce">🪙</span>
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
                <span className="text-2xl block mb-1">🪙</span>
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
              onClick={() => onComplete(randomXp, randomCoins)}
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

  if (completed || lives <= 0) {
    const isSuccess = lives > 0;
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
              <img src="/src/assets/images/lico_mascot_1784292046285.jpg" className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
              <img src="/src/assets/images/luna_mascot_1784292067117.jpg" className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
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

  const progressPercent = ((currentIdx) / lesson.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Main Lesson Player */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Top Progress bar & stats */}
        <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-all font-black text-xs uppercase tracking-wider cursor-pointer">
            ✕ Fechar
          </button>
          
          <div className="flex-1 max-w-md h-4 bg-slate-200/70 rounded-full overflow-hidden border-2 border-slate-350 shadow-inner">
            <motion.div 
              className="h-full bg-falla-green rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center gap-4 font-black text-sm shrink-0">
            <span className="flex items-center gap-1.5 text-falla-red hover:scale-110 transition-all cursor-pointer" title="Vidas">
              <span className="text-lg">❤️</span>
              <span>{lives}</span>
            </span>
            <span className="flex items-center gap-1.5 text-falla-yellow hover:scale-110 transition-all cursor-pointer" title="XP Acumulados">
              <span className="text-lg">⭐</span>
              <span>{xpEarned} XP</span>
            </span>
          </div>
        </div>

        {/* Gameplay Stage */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Question Mascot prompt balloon */}
          <div className="flex gap-4 items-start">
            {getMascotAvatar(question.characterHint) ? (
              <img
                src={getMascotAvatar(question.characterHint)!}
                alt={question.characterHint}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl border border-slate-200 object-cover shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shrink-0 shadow-sm">
                {getMascotEmoji(question.characterHint)}
              </div>
            )}

            <div className="relative bg-slate-50 border-2 border-slate-200 rounded-3xl p-4.5 text-xs font-bold text-slate-700 flex-1 leading-relaxed shadow-2xs">
              <div className="absolute -left-[9px] top-6 w-4 h-4 bg-slate-50 border-l-2 border-b-2 border-slate-200 rotate-45" />
              <div className="text-[9px] font-black text-falla-blue block uppercase mb-1 tracking-wider">{question.characterHint || "Guia Tutor"} diz:</div>
              <p className="font-black text-slate-800 text-sm">{question.prompt}</p>
              {question.text && (
                <div className="mt-2 text-falla-blue font-black flex items-center gap-2 bg-white p-2 px-3 rounded-xl border-2 border-slate-200 w-fit cursor-pointer hover:bg-slate-50 transition-all shadow-2xs card-bouncy">
                  <Volume2 size={16} className="text-falla-blue animate-pulse" />
                  <span className="text-xs tracking-wide">{question.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Answer Inputs Workspace */}
          <div className="py-2">
            
            {question.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {question.options?.map((opt) => {
                  const isSel = selectedOpt === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => !hasChecked && setSelectedOpt(opt)}
                      disabled={hasChecked}
                      className={`p-4 rounded-2xl border-2 text-left font-black text-xs transition-all flex justify-between items-center card-bouncy ${
                        isSel 
                          ? 'border-falla-blue bg-falla-blue/10 text-falla-blue ring-4 ring-sky-100' 
                          : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 bg-white'
                      }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSel ? 'border-falla-blue bg-falla-blue' : 'border-slate-350'}`}>
                        {isSel && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
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
                    <button
                      key={word}
                      onClick={() => handleWordClick(word, false)}
                      disabled={hasChecked}
                      className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-xs px-4 py-2.5 rounded-2xl font-black text-xs text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all active:translate-y-0.5 active:border-b-2 card-bouncy"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {question.type === QuestionType.SPEAK_SIM && (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <button
                  type="button"
                  onClick={startVoiceSim}
                  disabled={isListening || hasChecked}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white border-red-200 animate-pulse scale-105' 
                      : simulatedSpeechResult 
                      ? 'bg-emerald-500 text-white border-emerald-200' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-100 active:scale-95'
                  }`}
                >
                  {isListening ? (
                    <div className="flex gap-1">
                      <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  ) : (
                    <Mic size={32} />
                  )}
                </button>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {isListening ? 'Escutando fala nativa...' : simulatedSpeechResult ? 'Fala capturada!' : 'Clique para simular gravação de voz'}
                  </p>
                  {simulatedSpeechResult && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-3 py-1 font-bold text-sm">
                      "{simulatedSpeechResult}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {question.type === QuestionType.MATCH_PAIRS && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase text-center">Associe as palavras equivalentes:</p>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {question.options?.map((opt, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-xs text-slate-700">
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Verification feedback drawer */}
          <div className="border-t-2 border-slate-100 pt-5 mt-4">
            {!hasChecked ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={askGeminiTutor}
                  className="bg-falla-pink text-white font-black text-xs px-4 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-sm border-b-4 border-b-purple-600 active:translate-y-0.5 active:border-b-0 cursor-pointer"
                >
                  <Lightbulb size={16} />
                  Dica da IA
                </button>
                <button
                  onClick={checkAnswer}
                  disabled={question.type === QuestionType.MULTIPLE_CHOICE ? !selectedOpt : question.type === QuestionType.SENTENCE_BUILDER ? selectedWords.length === 0 : false}
                  className={`flex-1 font-black text-xs py-3.5 px-6 rounded-2xl transition-all shadow-md uppercase tracking-wider ${
                    (question.type === QuestionType.MULTIPLE_CHOICE && !selectedOpt) || (question.type === QuestionType.SENTENCE_BUILDER && selectedWords.length === 0)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-b-slate-300'
                      : 'bg-falla-green hover:bg-falla-green/90 text-white border-b-4 border-b-green-700 active:translate-y-0.5 active:border-b-0 cursor-pointer'
                  }`}
                >
                  Verificar Resposta
                </button>
              </div>
            ) : (
              <div className={`p-4.5 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in ${
                isCorrect 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {isCorrect ? (
                    <CheckCircle size={32} className="text-falla-green shrink-0" />
                  ) : (
                    <XCircle size={32} className="text-falla-red shrink-0" />
                  )}
                  <div>
                    <h4 className="font-black text-sm tracking-tight">{isCorrect ? 'Excelente! Resposta Correta!' : 'Ah, quase lá!'}</h4>
                    <p className="text-xs font-bold opacity-95 mt-1 leading-relaxed">
                      {isCorrect ? 'Você está indo muito bem. Seus mascotes comemoram!' : `A resposta correta era: ${Array.isArray(question.correctAnswer) ? (question.correctAnswer as string[]).join(' ') : question.correctAnswer}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                  <button
                    onClick={askGeminiTutor}
                    className="bg-falla-pink border-b-4 border-b-purple-600 text-white font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1 transition-all flex-1 md:flex-initial active:translate-y-0.5 active:border-b-0 cursor-pointer shadow-2xs"
                  >
                    <Lightbulb size={14} />
                    Tutor Explica
                  </button>
                  <button
                    onClick={nextQuestion}
                    className={`font-black text-xs py-2.5 px-5 rounded-2xl border-b-4 shadow-sm flex items-center justify-center gap-1 transition-all flex-1 md:flex-initial active:translate-y-0.5 active:border-b-0 cursor-pointer ${
                      isCorrect 
                        ? 'bg-falla-green text-white border-b-green-700 hover:bg-falla-green/90' 
                        : 'bg-falla-red text-white border-b-red-700 hover:bg-falla-red/90'
                    }`}
                  >
                    Avançar
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

       {/* AI Tutor Sidebar explaining the context */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-xs text-falla-pink flex items-center gap-1 uppercase tracking-wide">
                <Lightbulb size={16} /> Tutor de IA FALLA
              </span>
              <button onClick={() => setShowAiPanel(false)} className="text-slate-400 text-xs font-bold hover:text-slate-600 cursor-pointer">
                Ocultar ✕
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-falla-pink animate-spin" />
                <span className="text-xs text-slate-400 font-bold animate-pulse">Lico está consultando a sabedoria da IA...</span>
              </div>
            ) : (
              <div className="text-xs leading-relaxed space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-150">
                  <div className="font-black text-slate-800 mb-1 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                    <MessageSquare size={12} className="text-falla-blue" />
                    Explicação Personalizada:
                  </div>
                  <div className="text-slate-600 whitespace-pre-line font-bold leading-relaxed">{aiExplanation}</div>
                </div>
                <p className="text-[9px] text-slate-400 text-center font-black uppercase tracking-wider">
                  Alimentado pela API do Gemini 3.5 Flash
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
