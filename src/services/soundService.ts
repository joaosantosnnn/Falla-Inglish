import clickSfx from '../assets/sounds/click.mp3';
import correctSfx from '../assets/sounds/correct.mp3';
import wrongSfx from '../assets/sounds/wrong.mp3';

type SoundKey = 'click' | 'correct' | 'wrong';

const sources: Record<SoundKey, string> = {
  click: clickSfx,
  correct: correctSfx,
  wrong: wrongSfx,
};

// Cache: cada som é carregado só uma vez, depois é reaproveitado
const cache: Partial<Record<SoundKey, HTMLAudioElement>> = {};

function getAudio(key: SoundKey): HTMLAudioElement {
  if (!cache[key]) {
    const audio = new Audio(sources[key]);
    audio.preload = 'auto';
    cache[key] = audio;
  }
  return cache[key]!;
}

let soundEnabled = true;

/** Liga/desliga os efeitos sonoros (ex: botão de configurações do app) */
export function setSoundEnabled(value: boolean) {
  soundEnabled = value;
}

export function isSoundEnabled() {
  return soundEnabled;
}

/** Toca um efeito sonoro (click | correct | wrong) */
export function playSound(key: SoundKey, volume = 0.6) {
  if (!soundEnabled) return;
  try {
    const audio = getAudio(key);
    audio.currentTime = 0; // permite tocar de novo rapidamente, mesmo clicando repetido
    audio.volume = volume;
    audio.play().catch(() => {
      // navegador bloqueou autoplay antes da 1ª interação do usuário; ignora
    });
  } catch {
    // nunca deixa um erro de áudio travar a tela do usuário
  }
}

/** Fala um texto em inglês usando a Web Speech API (grátis, nativa do navegador/Android) */
export function speak(text: string, lang = 'en-US', rate = 0.9) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel(); // corta qualquer fala em andamento antes de começar outra
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return true;
}
