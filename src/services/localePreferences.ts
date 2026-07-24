export interface AppLocaleOption {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const APP_LOCALES: AppLocaleOption[] = [
  { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (United States)', nativeLabel: 'English (United States)', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'ja-JP', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', nativeLabel: '简体中文', flag: '🇨🇳' },
  { code: 'ru-RU', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'ar-SA', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr-TR', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl-NL', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl-PL', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
];

const STORAGE_KEY = 'falla_local_language';

export function normalizeLocale(locale?: string | null): string {
  const raw = (locale || '').trim();
  if (!raw) return 'pt-BR';
  const exact = APP_LOCALES.find(item => item.code.toLowerCase() === raw.toLowerCase());
  if (exact) return exact.code;
  const base = raw.split('-')[0].toLowerCase();
  return APP_LOCALES.find(item => item.code.split('-')[0].toLowerCase() === base)?.code || 'en-US';
}

export function detectDeviceLocale(): string {
  if (typeof navigator === 'undefined') return 'pt-BR';
  return normalizeLocale(navigator.languages?.[0] || navigator.language);
}

export function getLocalLanguage(): string {
  if (typeof window === 'undefined') return 'pt-BR';
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || detectDeviceLocale());
}

export function saveLocalLanguage(locale: string): string {
  const normalized = normalizeLocale(locale);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, normalized);
    window.dispatchEvent(new CustomEvent('falla-local-language-changed', { detail: { locale: normalized } }));
  }
  return normalized;
}

export function getLocaleBase(locale: string): string {
  return normalizeLocale(locale).split('-')[0].toLowerCase();
}
