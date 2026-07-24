import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabaseClient';

export type PushPlatform = 'android' | 'ios';

export interface PushRegistrationContext {
  language?: string;
  plan?: 'free' | 'premium' | string;
}

let listenersRegistered = false;
let lastContext: PushRegistrationContext = {};

async function persistToken(token: Token): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user || !token.value) return;

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return;

  const { error } = await supabase.from('push_tokens').upsert({
    user_id: session.user.id,
    token: token.value,
    platform: platform as PushPlatform,
    language: lastContext.language || 'en',
    plan: lastContext.plan || 'free',
    enabled: true,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'token' });

  if (error) console.warn('Não foi possível salvar o token push:', error.message);
}

export async function initializePushNotifications(
  context: PushRegistrationContext = {},
  onReceived?: (notification: PushNotificationSchema) => void,
  onAction?: (action: ActionPerformed) => void,
): Promise<'registered' | 'denied' | 'web'> {
  lastContext = context;

  if (!Capacitor.isNativePlatform()) return 'web';

  if (!listenersRegistered) {
    listenersRegistered = true;

    await PushNotifications.addListener('registration', (token) => {
      void persistToken(token);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Falha ao registrar notificações push:', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      onReceived?.(notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      onAction?.(action);
    });
  }

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === 'prompt') {
    permission = await PushNotifications.requestPermissions();
  }

  if (permission.receive !== 'granted') return 'denied';

  await PushNotifications.register();
  return 'registered';
}

export async function disablePushNotificationsForCurrentUser(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase
    .from('push_tokens')
    .update({ enabled: false, last_seen_at: new Date().toISOString() })
    .eq('user_id', session.user.id);
}
