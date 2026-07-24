import { getVoicePreferences } from './voicePreferences';
export type SpeechStatus = 'idle' | 'speaking' | 'error';

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface LanguageVoiceSettings {
  lang: string;
  rate: number;
  pitch: number;
  preferredVoiceNames: string[];
}

const LANGUAGE_SETTINGS: Record<string, LanguageVoiceSettings> = {
  'en-US': {
    lang: 'en-US',
    rate: 0.94,
    pitch: 1.02,
    preferredVoiceNames: [
      'Microsoft Aria Online',
      'Microsoft Jenny Online',
      'Microsoft Guy Online',
      'Google US English',
      'Samantha',
    ],
  },
  'pt-BR': {
    lang: 'pt-BR',
    rate: 1.0,
    pitch: 1,
    preferredVoiceNames: [
      'Microsoft Francisca Online',
      'Microsoft Antonio Online',
      'Microsoft Maria Online',
      'Google português do Brasil',
      'Google Português do Brasil',
      'Luciana',
    ],
  },
};

const DEFAULT_VOLUME = 1;

function detectLanguage(text: string): 'pt-BR' | 'en-US' {
  const normalizedText = text
    .toLowerCase()
    .replace(/[“”"'!?.,:;()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizedText) return 'en-US';

  const hasPortugueseCharacters = /[áàâãéêíóôõúüç]/i.test(normalizedText);

  const portugueseWords = new Set([
    'a', 'agora', 'alternativa', 'as', 'até', 'boa', 'bom', 'como',
    'complete', 'com', 'correta', 'correto', 'da', 'das', 'de', 'diga',
    'do', 'dos', 'é', 'em', 'escolha', 'esta', 'este', 'frase', 'indique',
    'lição', 'marque', 'não', 'o', 'obrigado', 'opção', 'os', 'ou',
    'palavra', 'para', 'pergunta', 'por', 'português', 'qual', 'que',
    'responda', 'resposta', 'selecione', 'tradução', 'traduza', 'uma',
    'você',
  ]);

  const englishWords = new Set([
    'a', 'answer', 'are', 'choose', 'complete', 'correct', 'english',
    'hello', 'how', 'is', 'option', 'please', 'question', 'select',
    'sentence', 'the', 'to', 'translate', 'what', 'which', 'word', 'you',
    'your',
  ]);

  const words = normalizedText.split(' ').filter(Boolean);

  let portugueseScore = hasPortugueseCharacters ? 3 : 0;
  let englishScore = 0;

  for (const word of words) {
    if (portugueseWords.has(word)) portugueseScore += 1;
    if (englishWords.has(word)) englishScore += 1;
  }

  return portugueseScore > englishScore ? 'pt-BR' : 'en-US';
}

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    );
  }

  stop(): void {
    if (!this.isSupported()) return;

    window.speechSynthesis.cancel();
    this.currentUtterance = null;
  }

  private async getVoices(): Promise<SpeechSynthesisVoice[]> {
    let voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      return voices;
    }

    await new Promise<void>((resolve) => {
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeoutId);
        window.speechSynthesis.removeEventListener('voiceschanged', finish);
        resolve();
      };

      const timeoutId = window.setTimeout(finish, 1200);
      window.speechSynthesis.addEventListener('voiceschanged', finish);
    });

    voices = window.speechSynthesis.getVoices();
    return voices;
  }

  private selectVoice(
    voices: SpeechSynthesisVoice[],
    language: string,
    preferredVoiceNames: string[],
  ): SpeechSynthesisVoice | undefined {
    const normalizedLanguage = language.toLowerCase();
    const languagePrefix = normalizedLanguage.split('-')[0];

    return (
      voices.find((voice) =>
        preferredVoiceNames.some((preferredName) =>
          voice.name.toLowerCase().includes(preferredName.toLowerCase()),
        ),
      ) ||
      voices.find(
        (voice) =>
          voice.lang.toLowerCase() === normalizedLanguage &&
          /natural|online|google|microsoft/i.test(voice.name),
      ) ||
      voices.find(
        (voice) => voice.lang.toLowerCase() === normalizedLanguage,
      ) ||
      voices.find((voice) =>
        voice.lang.toLowerCase().startsWith(languagePrefix),
      )
    );
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText) return;

    if (!this.isSupported()) {
      throw new Error(
        'A reprodução de voz não é compatível com este dispositivo.',
      );
    }

    this.stop();

    const detectedLanguage = options.lang ?? detectLanguage(cleanText);
    const languageSettings =
      LANGUAGE_SETTINGS[detectedLanguage] ?? LANGUAGE_SETTINGS['en-US'];

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const savedPreferences = getVoicePreferences(detectedLanguage);

    utterance.lang = detectedLanguage;
    utterance.rate = options.rate ?? savedPreferences.rate ?? languageSettings.rate;
    utterance.pitch = options.pitch ?? savedPreferences.pitch ?? languageSettings.pitch;
    utterance.volume = options.volume ?? DEFAULT_VOLUME;

    const voices = await this.getVoices();
    const selectedVoice =
      (savedPreferences.voiceName
        ? voices.find((voice) => voice.name === savedPreferences.voiceName)
        : undefined) ||
      this.selectVoice(
        voices,
        detectedLanguage,
        languageSettings.preferredVoiceNames,
      );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    this.currentUtterance = utterance;

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }
        resolve();
      };

      utterance.onerror = (event) => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }

        if (
          event.error === 'canceled' ||
          event.error === 'interrupted'
        ) {
          resolve();
          return;
        }

        reject(
          new Error(
            `Não foi possível reproduzir o áudio (${event.error}).`,
          ),
        );
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const speechService = new SpeechService();
