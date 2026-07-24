export interface DeviceVoicePreferences {
  voiceName: string;
  rate: number;
  pitch: number;
}

const STORAGE_PREFIX = 'falla_device_voice_';

export const SUPPORTED_VOICE_LANGUAGES = [
  { code: 'en-US', label: 'Inglês (Estados Unidos)' },
  { code: 'en-GB', label: 'Inglês (Reino Unido)' },
  { code: 'es-ES', label: 'Espanhol' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
] as const;

const DEFAULTS: DeviceVoicePreferences = {
  voiceName: '',
  rate: 0.94,
  pitch: 1,
};

export function getVoicePreferences(language: string): DeviceVoicePreferences {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${language}`);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<DeviceVoicePreferences>;
    return {
      voiceName: typeof parsed.voiceName === 'string' ? parsed.voiceName : '',
      rate: typeof parsed.rate === 'number' ? parsed.rate : DEFAULTS.rate,
      pitch: typeof parsed.pitch === 'number' ? parsed.pitch : DEFAULTS.pitch,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveVoicePreferences(language: string, preferences: DeviceVoicePreferences): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${language}`, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent('falla-voice-settings-changed', { detail: { language } }));
}

export async function loadDeviceVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  let voices = window.speechSynthesis.getVoices();
  if (voices.length) return voices;
  await new Promise<void>((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done);
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', done);
    window.setTimeout(done, 1200);
  });
  voices = window.speechSynthesis.getVoices();
  return voices;
}
