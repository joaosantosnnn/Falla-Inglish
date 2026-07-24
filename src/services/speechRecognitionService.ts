import { Capacitor } from '@capacitor/core';

type TranscriptCallback = (text: string) => void;
type ErrorCallback = (message: string) => void;
type EndCallback = () => void;

type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

class SpeechRecognitionService {
  private browserRecognition: BrowserRecognition | null = null;
  private nativePlugin: any = null;
  private nativeListeners: Array<{ remove: () => Promise<void> | void }> = [];
  private stopping = false;

  async start(
    language: string,
    onTranscript: TranscriptCallback,
    onError: ErrorCallback,
    onEnd: EndCallback,
  ): Promise<void> {
    await this.stop();
    this.stopping = false;

    if (Capacitor.isNativePlatform()) {
      try {
        const module = await import('@capgo/capacitor-speech-recognition');
        const SpeechRecognition = module.SpeechRecognition;
        this.nativePlugin = SpeechRecognition;

        const permission = await SpeechRecognition.requestPermissions();
        const granted = permission?.speechRecognition === 'granted' || permission?.microphone === 'granted';
        if (!granted) {
          throw new Error('Permissão do microfone não concedida. Ative o microfone nas configurações do aparelho.');
        }

        const availability = await SpeechRecognition.available();
        if (!availability?.available) {
          throw new Error('O reconhecimento de voz não está disponível neste aparelho.');
        }

        const partialListener = await SpeechRecognition.addListener('partialResults', (event: any) => {
          const text = event?.matches?.[0]?.trim();
          if (text) onTranscript(text);
        });
        const stateListener = await SpeechRecognition.addListener('listeningState', (event: any) => {
          const state = event?.state || event?.status;
          if (!this.stopping && ['stopped', 'ended', 'inactive'].includes(String(state).toLowerCase())) {
            onEnd();
          }
        });
        const errorListener = await SpeechRecognition.addListener('error', (event: any) => {
          if (!this.stopping) onError(this.humanizeError(event?.message || event?.errorCode || event?.code));
          onEnd();
        });
        this.nativeListeners = [partialListener, stateListener, errorListener];

        const result = await SpeechRecognition.start({
          language,
          maxResults: 3,
          partialResults: true,
          popup: false,
          contextualStrings: [],
        });
        const initialText = result?.matches?.[0]?.trim();
        if (initialText) onTranscript(initialText);
        return;
      } catch (error: any) {
        await this.stop();
        onError(this.humanizeError(error?.message || error));
        onEnd();
        return;
      }
    }

    const RecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!RecognitionCtor) {
      onError('Este navegador não oferece reconhecimento de voz. Você ainda pode digitar a frase no campo abaixo.');
      onEnd();
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }

      const recognition: BrowserRecognition = new RecognitionCtor();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0]?.transcript || '';
        }
        if (transcript.trim()) onTranscript(transcript.trim());
      };
      recognition.onerror = (event: any) => {
        if (!this.stopping) onError(this.humanizeError(event?.error));
      };
      recognition.onend = () => onEnd();
      this.browserRecognition = recognition;
      recognition.start();
    } catch (error: any) {
      onError(this.humanizeError(error?.message || error));
      onEnd();
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    if (this.browserRecognition) {
      try { this.browserRecognition.stop(); } catch {}
      this.browserRecognition = null;
    }
    if (this.nativePlugin) {
      try { await this.nativePlugin.stop(); } catch {}
      this.nativePlugin = null;
    }
    for (const listener of this.nativeListeners) {
      try { await listener.remove(); } catch {}
    }
    this.nativeListeners = [];
  }

  private humanizeError(error: unknown): string {
    const value = String(error || '').toLowerCase();
    if (value.includes('not-allowed') || value.includes('permission') || value.includes('denied')) {
      return 'O acesso ao microfone foi bloqueado. Autorize o microfone nas configurações do aparelho e tente novamente.';
    }
    if (value.includes('no-speech')) return 'Não ouvi nenhuma fala. Aproxime-se do microfone e tente novamente.';
    if (value.includes('audio-capture')) return 'Não foi possível acessar o microfone deste aparelho.';
    if (value.includes('network')) return 'O reconhecimento de voz ficou indisponível. Verifique a conexão ou tente novamente.';
    if (value.includes('aborted')) return 'A gravação foi interrompida.';
    return String(error || 'Não foi possível reconhecer a fala. Tente novamente.');
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
