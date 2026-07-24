# Alterações na experiência das questões

## Feedback após responder
- O painel grande de resposta foi removido.
- Agora aparece apenas uma confirmação compacta de acerto ou erro.
- O botão **Avançar** abre uma página intermediária de explicação antes da próxima questão.

## Página intermediária de explicação
- Exibe o mascote e a reação de acerto ou revisão.
- Exibe a frase correta.
- Exibe áudio da frase.
- Exibe significado, pronúncia e contexto quando disponíveis.
- O botão final leva à próxima questão ou conclui a lição.

## Dicas sem IA
- O botão **Dica** não chama mais serviço externo.
- Usa diretamente o campo `hintText` da questão.
- Quando a questão não possui `hintText`, usa uma dica local baseada no tipo da atividade, tradução ou pronúncia.
- A dica aparece em uma janela pequena e fecha ao tocar em **Entendi**.

## Arquivo principal alterado
- `src/components/LessonPlayer.tsx`
