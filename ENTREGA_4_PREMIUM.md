# FALLA Premium — Entrega 4

## Implementado

- Nova tela **Meu Desempenho** em Mais Recursos.
- Cards de precisão, fases, tempo estudado, estrelas, nível, XP, respostas e sequência.
- Histórico de atividade dos últimos 7 e 30 dias.
- Comparativo de acertos e erros por dia.
- Desempenho e conclusão por módulo.
- Lista automática de palavras e questões difíceis.
- Botão para iniciar treino das dificuldades.
- Medalhas desbloqueadas por metas reais.
- Certificados de conclusão por módulo.
- Opção de imprimir ou salvar o certificado como PDF pelo navegador/sistema.
- Bloqueio por `advanced_stats` e `certificates` usando as permissões Premium da Entrega 1.
- Registro do tempo real gasto em cada lição.
- Persistência local do histórico analítico no dispositivo.

## Armazenamento local

- `falla-premium-learning-history-v1`: respostas por questão.
- `falla-analytics-sessions-v1`: sessões, duração, XP e resultados.

Nesta entrega os dados ficam no aparelho. A sincronização entre dispositivos poderá ser adicionada posteriormente usando o Supabase.

## Atualização

Na pasta principal do projeto:

```powershell
npm install
npm run build
npx cap sync android
npx cap open android
```

## Observação de validação

O build não pôde ser concluído neste ambiente porque o `node_modules` enviado foi instalado no Windows, enquanto o ambiente de validação usa Linux. O TypeScript também já apresentava erros antigos em arquivos não relacionados a esta entrega.
