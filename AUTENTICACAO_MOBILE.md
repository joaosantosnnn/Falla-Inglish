# Autenticação móvel do FALLA

Deep link configurado:

`com.falla.app://auth/callback`

## Supabase

Em Authentication > URL Configuration > Redirect URLs, mantenha:

- `com.falla.app://auth/callback`
- `com.falla.app://auth/callback/**`

## Depois de extrair o patch/projeto

Execute na raiz do projeto:

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

O fluxo móvel agora usa PKCE, abre o Google no navegador seguro e retorna ao aplicativo pelo deep link.
