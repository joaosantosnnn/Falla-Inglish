# Áudio implementado no FALLA

## Arquivos criados

- `src/services/speechService.ts`
  - Centraliza a leitura de texto com a Web Speech API nativa.
  - Usa voz em inglês americano (`en-US`).
  - Configura velocidade didática (`0.82`).
  - Interrompe o áudio anterior antes de iniciar outro.
  - Procura uma voz inglesa instalada no aparelho.
  - Trata aparelhos ou navegadores sem suporte.

- `src/components/AudioButton.tsx`
  - Botão reutilizável de áudio.
  - Permite iniciar e interromper a leitura.
  - Possui acessibilidade por teclado, `aria-label` e mensagem de erro.

## Arquivo alterado

- `src/components/LessonPlayer.tsx`
  - Adiciona áudio à frase principal da questão.
  - Adiciona áudio às alternativas de múltipla escolha.
  - Adiciona áudio às palavras do Sentence Builder.
  - Adiciona áudio aos itens de Match Pairs.
  - Adiciona “Ouvir antes de falar” ao Speak Sim.
  - Interrompe o áudio ao mudar de questão, fechar a lição ou desmontar a tela.
  - Exibe mensagem quando o dispositivo não consegue reproduzir voz.

## O que não foi alterado

- Banco de dados e Supabase.
- Estrutura das questões.
- Importador de planilhas.
- Planilhas de conteúdo.
- Dependências do `package.json`.

A implementação utiliza o mecanismo de voz já disponível no navegador/WebView do Android, portanto não há cobrança por API.
