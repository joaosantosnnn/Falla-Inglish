import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleAuth } from 'npm:google-auth-library@9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestBody = {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  targetType?: 'all' | 'premium' | 'language';
  targetLanguage?: string;
};

function base64Url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function createApnsJwt(): Promise<string> {
  const teamId = Deno.env.get('APNS_TEAM_ID')!;
  const keyId = Deno.env.get('APNS_KEY_ID')!;
  const privateKeyPem = Deno.env.get('APNS_PRIVATE_KEY')!.replace(/\\n/g, '\n');
  const header = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const payload = base64Url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const signingInput = `${header}.${payload}`;
  const keyData = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', keyBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${base64Url(signature)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = req.headers.get('Authorization') || '';

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: 'Não autenticado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Apenas administradores podem enviar push.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const payload = await req.json() as RequestBody;
    if (!payload.title?.trim() || !payload.body?.trim()) throw new Error('Título e mensagem são obrigatórios.');

    let query = admin.from('push_tokens').select('id, token, platform').eq('enabled', true);
    if (payload.targetType === 'premium') query = query.eq('plan', 'premium');
    if (payload.targetType === 'language' && payload.targetLanguage) query = query.eq('language', payload.targetLanguage);
    const { data: tokens, error: tokenError } = await query;
    if (tokenError) throw tokenError;

    const { data: campaign, error: campaignError } = await admin.from('push_notifications').insert({
      title: payload.title.trim(), body: payload.body.trim(), image_url: payload.imageUrl || null,
      target_type: payload.targetType || 'all', target_language: payload.targetLanguage || null,
      deep_link: payload.deepLink || null, status: 'sending', total_targets: tokens?.length || 0, created_by: user.id,
    }).select('id').single();
    if (campaignError) throw campaignError;

    let sent = 0;
    let failed = 0;
    const invalidIds: string[] = [];

    const androidTokens = (tokens || []).filter((item) => item.platform === 'android');
    if (androidTokens.length) {
      const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
      if (!serviceAccountJson) throw new Error('Secret FIREBASE_SERVICE_ACCOUNT_JSON não configurado.');
      const credentials = JSON.parse(serviceAccountJson);
      const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] });
      const accessToken = await auth.getAccessToken();
      for (const item of androidTokens) {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${credentials.project_id}/messages:send`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: {
            token: item.token,
            notification: { title: payload.title, body: payload.body, ...(payload.imageUrl ? { image: payload.imageUrl } : {}) },
            data: { deepLink: payload.deepLink || '', campaignId: campaign.id },
            android: { priority: 'high', notification: { channel_id: 'falla_general', sound: 'default' } },
          } }),
        });
        if (response.ok) sent++; else { failed++; const text = await response.text(); if (text.includes('UNREGISTERED')) invalidIds.push(item.id); }
      }
    }

    const iosTokens = (tokens || []).filter((item) => item.platform === 'ios');
    if (iosTokens.length) {
      const topic = Deno.env.get('APNS_BUNDLE_ID');
      if (!topic || !Deno.env.get('APNS_PRIVATE_KEY')) throw new Error('Secrets da Apple APNs não configurados.');
      const jwt = await createApnsJwt();
      const apnsHost = Deno.env.get('APNS_ENVIRONMENT') === 'sandbox' ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
      for (const item of iosTokens) {
        const response = await fetch(`${apnsHost}/3/device/${item.token}`, {
          method: 'POST',
          headers: { authorization: `bearer ${jwt}`, 'apns-topic': topic, 'apns-push-type': 'alert', 'apns-priority': '10', 'content-type': 'application/json' },
          body: JSON.stringify({ aps: { alert: { title: payload.title, body: payload.body }, sound: 'default', badge: 1 }, deepLink: payload.deepLink || '', campaignId: campaign.id }),
        });
        if (response.ok) sent++; else { failed++; if (response.status === 410) invalidIds.push(item.id); }
      }
    }

    if (invalidIds.length) await admin.from('push_tokens').update({ enabled: false }).in('id', invalidIds);
    const status = failed === 0 ? 'sent' : sent > 0 ? 'partial' : 'failed';
    await admin.from('push_notifications').update({ status, sent_count: sent, failed_count: failed }).eq('id', campaign.id);

    return new Response(JSON.stringify({ campaignId: campaign.id, total: tokens?.length || 0, sent, failed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
