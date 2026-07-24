export type SpeechStatus = 'idle' | 'speaking' | 'error';

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

const DEFAULT_OPTIONS: Required<SpeakOptions> = {
  lang: 'en-US',
  rate: 0.82,
  pitch: 1,
  volume: 1,
};

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window;
  }

  stop(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    this.currentUtterance = null;
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText) return;

    if (!this.isSupported()) {
      throw new Error('A reprodução de voz não é compatível com este dispositivo.');
    }

    this.stop();

    const settings = { ...DEFAULT_OPTIONS, ...options };
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = settings.lang;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    const voices = window.speechSynthesis.getVoices();
    const normalizedLang = settings.lang.toLowerCase();
    const languagePrefix = normalizedLang.split('-')[0];
    const preferredVoice =
      voices.find(voice => voice.lang.toLowerCase() === normalizedLang) ||
      voices.find(voice => voice.lang.toLowerCase().startsWith(languagePrefix));

    if (preferredVoice) utterance.voice = preferredVoice;
    this.currentUtterance = utterance;

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        if (this.currentUtterance === utterance) this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = event => {
        if (this.currentUtterance === utterance) this.currentUtterance = null;
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve();
          return;
        }
        reject(new Error(`Não foi possível reproduzir o áudio (${event.error}).`));
      };
      window.speechSynthesis.speak(utterance);
    });
  }
}

export const speechService = new SpeechService();
