import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp, type URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabaseClient';

export const MOBILE_AUTH_CALLBACK = 'com.falla.app://auth/callback';

export const getAuthRedirectUrl = (): string => {
  if (Capacitor.isNativePlatform()) {
    return MOBILE_AUTH_CALLBACK;
  }

  return window.location.origin;
};

const getHashParams = (url: string): URLSearchParams => {
  const hashIndex = url.indexOf('#');
  return new URLSearchParams(hashIndex >= 0 ? url.slice(hashIndex + 1) : '');
};

export const completeSupabaseAuthFromUrl = async (url: string): Promise<void> => {
  if (!url.startsWith(MOBILE_AUTH_CALLBACK)) return;

  try {
    const parsedUrl = new URL(url);
    const queryError = parsedUrl.searchParams.get('error_description') || parsedUrl.searchParams.get('error');
    const hashParams = getHashParams(url);
    const hashError = hashParams.get('error_description') || hashParams.get('error');
    const authError = queryError || hashError;

    if (authError) {
      throw new Error(decodeURIComponent(authError.replace(/\+/g, ' ')));
    }

    const code = parsedUrl.searchParams.get('code');

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return;
    }

    // Compatibilidade com retornos no fluxo implícito.
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    }
  } finally {
    try {
      await Browser.close();
    } catch {
      // O navegador pode já estar fechado; isso não impede a autenticação.
    }
  }
};

export const openGoogleOAuth = async (): Promise<void> => {
  const redirectTo = getAuthRedirectUrl();
  const isNative = Capacitor.isNativePlatform();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: isNative,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) throw error;

  if (isNative) {
    if (!data.url) {
      throw new Error('O Supabase não retornou a URL de autenticação do Google.');
    }

    await Browser.open({ url: data.url });
  }
};

export const registerMobileAuthListener = async (
  onError?: (message: string) => void,
): Promise<() => void> => {
  if (!Capacitor.isNativePlatform()) {
    return () => undefined;
  }

  const handleUrl = async ({ url }: URLOpenListenerEvent) => {
    try {
      await completeSupabaseAuthFromUrl(url);
    } catch (error: any) {
      console.error('Erro ao concluir autenticação pelo deep link:', error);
      onError?.(error?.message || 'Não foi possível concluir a autenticação.');
    }
  };

  const listener = await CapacitorApp.addListener('appUrlOpen', handleUrl);

  try {
    const launch = await CapacitorApp.getLaunchUrl();
    if (launch?.url) {
      await handleUrl({ url: launch.url });
    }
  } catch (error) {
    console.warn('Não foi possível verificar a URL de abertura do app:', error);
  }

  return () => {
    void listener.remove();
  };
};
