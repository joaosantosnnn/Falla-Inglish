# FALLA — remoção de referências de IA

Alterações realizadas:

- título da aplicação alterado para `FALLA`;
- referências visíveis a Google AI Studio, Gemini, inteligência artificial e Tutor de IA removidas;
- área administrativa renomeada para `Config Tutor`;
- textos de configuração reescritos como orientações do tutor;
- dependência `@google/genai` removida do `package.json` e do lockfile;
- servidor substituído por uma versão limpa, sem endpoints do Gemini;
- arquivos web compilados antigos do Android removidos para evitar que textos antigos permaneçam no APK.

## Validação

A compilação foi iniciada, mas o ambiente Linux não conseguiu instalar o pacote opcional nativo do Rollup antes do limite de execução. O projeto deve ser validado no computador com:

```bash
npm install
npm run lint
npm run build
npx cap sync android
npx cap open android
```

Use Node.js 22 ou superior, exigido pelo Capacitor 8.
