# Correção — Vidas infinitas no plano Pro/Premium

## Regra aplicada

Usuários com plano `pro` ou `premium` agora:

- não perdem vidas ao errar;
- não têm a lição encerrada por falta de vidas;
- continuam avançando normalmente depois de respostas erradas;
- visualizam o símbolo `∞` no contador de vidas;
- não têm o total global de vidas reduzido.

Usuários do plano gratuito continuam sujeitos ao sistema normal de vidas.

## Arquivos ajustados

- `src/components/LessonPlayer.tsx`
- `src/App.tsx`

A cópia interna do projeto em `Falla/src` também recebeu a mesma correção para evitar divergência entre as duas árvores presentes no arquivo enviado.

## Validação

Foi executado `npm run lint`. A correção não introduziu erros específicos no fluxo de vidas. A validação completa continua bloqueada por erros TypeScript já existentes em outros componentes e por uma dependência antiga ausente na cópia interna do projeto.
