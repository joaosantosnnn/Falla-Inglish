# FALLA — Notificações push reais

Esta entrega substitui o antigo aviso em tempo real (que dependia do app aberto) por uma arquitetura nativa:

- Capacitor Push Notifications no Android/iOS;
- tokens dos aparelhos salvos no Supabase;
- painel administrativo com envio para todos, Premium ou por idioma;
- Supabase Edge Function `send-push`;
- Firebase Cloud Messaging HTTP v1 para Android;
- Apple Push Notification service para iOS;
- histórico com quantidade de alvos, enviados e falhas.

## 1. Banco de dados

Execute no SQL Editor do Supabase:

`SQL_PUSH_NOTIFICATIONS.sql`

## 2. Android / Firebase

1. Crie ou abra um projeto no Firebase.
2. Adicione um app Android com o pacote `com.falla.app`.
3. Baixe `google-services.json` e coloque em `android/app/google-services.json`.
4. No Google Cloud/Firebase, crie uma conta de serviço e baixe a chave JSON.
5. Não coloque essa chave dentro do aplicativo. Cadastre-a como secret da Edge Function:

```powershell
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

No Windows, também é possível cadastrar o secret pelo painel do Supabase em Edge Functions > Secrets.

## 3. iOS / Apple

Crie uma chave APNs `.p8` no Apple Developer e configure os secrets:

```powershell
supabase secrets set APNS_TEAM_ID="SEU_TEAM_ID"
supabase secrets set APNS_KEY_ID="SEU_KEY_ID"
supabase secrets set APNS_BUNDLE_ID="com.falla.app"
supabase secrets set APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
supabase secrets set APNS_ENVIRONMENT="production"
```

Durante testes instalados pelo Xcode, use `APNS_ENVIRONMENT=sandbox`.

## 4. Publicar a Edge Function

```powershell
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy send-push
```

A função valida que o usuário autenticado possui `profiles.role = 'admin'` antes de enviar.

## 5. Atualizar o app

```powershell
npm install
npm run build
npx cap sync android
npx cap open android
```

Para iOS:

```powershell
npx cap sync ios
npx cap open ios
```

No Xcode, ative as capabilities `Push Notifications` e `Background Modes > Remote notifications`.

## Funcionamento

Após o login, o app solicita permissão ao usuário. Quando aceita, o token do aparelho é salvo em `push_tokens`. O painel chama a Edge Function, que envia a mensagem aos serviços oficiais de cada plataforma.

Sem `google-services.json`, o Android não registra o token. Sem os secrets do Firebase/APNs, o painel registra uma falha de envio.
