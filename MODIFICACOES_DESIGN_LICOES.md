# Melhorias de design das lições

Implementadas em `src/components/LessonPlayer.tsx` e `src/types.ts`.

- Pergunta maior, com mais espaço e melhor hierarquia visual.
- Mascote ampliado e com animação suave.
- Progresso com número da questão e barra mais visível.
- Indicadores de vidas, XP, sequência e nível.
- Alternativas com letras, animação de toque e estados selecionado/correto/incorreto.
- Feedback imediato com ganho de XP e resposta correta.
- Tradução opcional expansível quando `translation` ou `hintText` estiver preenchido.
- Destaque automático de palavras relevantes.
- Explicação pós-resposta com significado, áudio e pronúncia opcional.
- Suporte a contexto, microdiálogo e imagem contextual pelos novos campos:
  - `context?: string`
  - `dialogue?: string[]`
  - `contextImage?: string`
  - `pronunciation?: string`
- Mantidos os tipos existentes de questão.
- Nenhuma barra inferior de navegação foi adicionada.

## Observação de validação

O TypeScript não apontou erro em `LessonPlayer.tsx` nem em `types.ts`. O projeto completo já continha erros independentes em `GrammarCenter.tsx`, `Inventory.tsx` e `FloatingFriendsChat.tsx`, que não fazem parte desta alteração.
