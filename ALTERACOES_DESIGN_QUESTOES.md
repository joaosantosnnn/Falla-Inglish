# Reformulação visual das questões

Implementado em `src/components/LessonPlayer.tsx`.

## Alterações

- Removidos do topo os cartões de XP, sequência e nível.
- Mantidos apenas vidas e barra de progresso.
- Novo cartão principal da pergunta inspirado no modelo escolhido.
- Mascote e balão de fala integrados no mesmo cartão.
- Faixa inferior usa as cores do tema ativo do aplicativo.
- Alternativas de múltipla escolha passaram a ser exibidas em uma coluna.
- Criada sequência real de acertos consecutivos.
- A partir de 2 acertos seguidos, aparece uma celebração temporária com o mascote.
- A celebração desaparece automaticamente após 1,8 segundo.
- Um erro zera a sequência de acertos.
- Foram preservados os diferentes temas por meio das variáveis CSS `--theme-*`.

## Validação

O arquivo alterado não apresentou erro próprio no TypeScript. O projeto ainda possui erros anteriores e não relacionados em `FloatingFriendsChat.tsx`, `GrammarCenter.tsx`, `Inventory.tsx` e na resolução local do plugin de reconhecimento de voz.
