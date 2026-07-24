# Correção da captura de voz

## O que mudou

- A simulação de microfone foi removida.
- O app agora solicita permissão real do microfone.
- No Android/iOS nativo é utilizado `@capgo/capacitor-speech-recognition`.
- No navegador é utilizado o reconhecimento de voz disponível no próprio navegador.
- A transcrição aparece em um campo editável.
- O aluno pode corrigir manualmente o texto reconhecido.
- A resposta só pode ser validada depois de tocar em **Confirmar resposta**.
- Foram adicionados os botões **Apagar** e **Falar novamente**.
- O botão principal de verificar permanece bloqueado até a confirmação.
- A permissão `RECORD_AUDIO` foi adicionada ao Android.

## Comandos obrigatórios após extrair o projeto

```bash
npm install
npx cap sync android
npm run build
npx cap sync android
npx cap open android
```

Depois, gere e instale um novo APK pelo Android Studio. A versão antiga instalada no celular não receberá o novo plugin nativo apenas copiando os arquivos web.
