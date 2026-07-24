import React, { useEffect, useMemo, useState } from 'react';
import { Check, Play, RefreshCw, Volume2, X } from 'lucide-react';
import {
  DeviceVoicePreferences,
  getVoicePreferences,
  loadDeviceVoices,
  saveVoicePreferences,
} from '../services/voicePreferences';

interface VoiceSetupModalProps {
  open: boolean;
  onClose: () => void;
  language?: string;
  firstAccess?: boolean;
}

const SAMPLE_TEXT: Record<string, string> = {
  'en-US': 'Hello! Welcome to FALLA. Let us learn English together.',
  'en-GB': 'Hello! Welcome to FALLA. Let us learn English together.',
  'pt-BR': 'Olá! Bem-vindo ao FALLA. Vamos aprender juntos.',
  'es-ES': '¡Hola! Bienvenido a FALLA. Vamos a aprender juntos.',
};

function normalizeLanguage(language: string): string {
  return language || 'en-US';
}

export default function VoiceSetupModal({
  open,
  onClose,
  language = 'en-US',
  firstAccess = false,
}: VoiceSetupModalProps) {
  const normalizedLanguage = normalizeLanguage(language);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [rate, setRate] = useState(0.94);
  const [pitch, setPitch] = useState(1);
  const [playingVoiceName, setPlayingVoiceName] = useState<string | null>(null);

  const refreshVoices = async () => {
    setLoading(true);
    try {
      const availableVoices = await loadDeviceVoices();
      setVoices(availableVoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const preferences = getVoicePreferences(normalizedLanguage);
    setSelectedVoiceName(preferences.voiceName);
    setRate(preferences.rate);
    setPitch(preferences.pitch);
    void refreshVoices();

    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [open, normalizedLanguage]);

  const matchingVoices = useMemo(() => {
    const exact = voices.filter(
      (voice) => voice.lang.toLowerCase() === normalizedLanguage.toLowerCase(),
    );
    if (exact.length > 0) return exact;

    const prefix = normalizedLanguage.split('-')[0].toLowerCase();
    return voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  }, [voices, normalizedLanguage]);

  useEffect(() => {
    if (!selectedVoiceName && matchingVoices.length > 0) {
      setSelectedVoiceName(matchingVoices[0].name);
    }
  }, [matchingVoices, selectedVoiceName]);

  if (!open) return null;

  const playSample = (voice: SpeechSynthesisVoice) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      SAMPLE_TEXT[normalizedLanguage] || SAMPLE_TEXT['en-US'],
    );
    utterance.voice = voice;
    utterance.lang = voice.lang || normalizedLanguage;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => setPlayingVoiceName(voice.name);
    utterance.onend = () => setPlayingVoiceName(null);
    utterance.onerror = () => setPlayingVoiceName(null);
    window.speechSynthesis.speak(utterance);
  };

  const saveSelection = () => {
    const preferences: DeviceVoicePreferences = {
      voiceName: selectedVoiceName,
      rate,
      pitch,
    };
    saveVoicePreferences(normalizedLanguage, preferences);
    window.localStorage.setItem('falla_voice_onboarding_completed', 'true');
    onClose();
  };

  const skipForNow = () => {
    window.localStorage.setItem('falla_voice_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[2rem] bg-white border-2 border-slate-200 shadow-2xl flex flex-col">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-falla-blue">
              <Volume2 size={24} />
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                Escolha a voz das lições
              </h2>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-500 leading-relaxed">
              Teste as vozes gratuitas disponíveis neste aparelho e escolha a que você prefere para ouvir perguntas e pronúncias.
            </p>
          </div>
          {!firstAccess && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                Vozes encontradas
              </p>
              <p className="text-sm font-bold text-slate-600 mt-1">
                {loading ? 'Procurando vozes no aparelho...' : `${matchingVoices.length} opção(ões) compatível(is)`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshVoices()}
              disabled={loading}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white border-2 border-blue-200 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {matchingVoices.length === 0 && !loading ? (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 text-center">
              <p className="font-black text-amber-800">Nenhuma voz em inglês foi encontrada.</p>
              <p className="text-xs font-bold text-amber-700 mt-2 leading-relaxed">
                O FALLA continuará usando a voz padrão do aparelho. Depois de instalar ou ativar novas vozes nas configurações do celular, volte aqui e toque em Atualizar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchingVoices.map((voice) => {
                const selected = selectedVoiceName === voice.name;
                const isPlaying = playingVoiceName === voice.name;
                return (
                  <button
                    type="button"
                    key={`${voice.name}-${voice.lang}-${voice.voiceURI}`}
                    onClick={() => setSelectedVoiceName(voice.name)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                      selected
                        ? 'border-falla-blue bg-sky-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${selected ? 'bg-falla-blue text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {selected ? <Check size={20} /> : <Volume2 size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-800 truncate">{voice.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="text-[10px] font-black uppercase rounded-full bg-slate-100 text-slate-600 px-2 py-1">
                            {voice.lang}
                          </span>
                          <span className={`text-[10px] font-black uppercase rounded-full px-2 py-1 ${voice.localService ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {voice.localService ? 'No aparelho' : 'Disponível no sistema'}
                          </span>
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          playSample(voice);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            playSample(voice);
                          }
                        }}
                        className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-falla-blue px-3 py-2 text-xs font-black text-white hover:brightness-95"
                      >
                        <Play size={14} fill="currentColor" />
                        {isPlaying ? 'Ouvindo' : 'Testar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <label className="space-y-2">
              <span className="flex justify-between text-xs font-black text-slate-600">
                <span>Velocidade</span><span>{rate.toFixed(2)}x</span>
              </span>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
                className="w-full"
              />
            </label>
            <label className="space-y-2">
              <span className="flex justify-between text-xs font-black text-slate-600">
                <span>Tom</span><span>{pitch.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={pitch}
                onChange={(event) => setPitch(Number(event.target.value))}
                className="w-full"
              />
            </label>
          </div>
        </div>

        <div className="p-5 sm:p-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          {firstAccess && (
            <button
              type="button"
              onClick={skipForNow}
              className="px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50"
            >
              Usar voz padrão
            </button>
          )}
          <button
            type="button"
            onClick={saveSelection}
            disabled={matchingVoices.length > 0 && !selectedVoiceName}
            className="px-6 py-3 rounded-xl bg-falla-green text-white font-black text-sm border-b-4 border-emerald-700 hover:brightness-95 active:translate-y-0.5 disabled:opacity-50"
          >
            Salvar minha voz
          </button>
        </div>
      </div>
    </div>
  );
}
