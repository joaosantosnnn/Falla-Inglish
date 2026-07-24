# Correção do sistema de estrelas

- Estrelas agora aparecem abaixo de cada fase concluída no mapa.
- Fases antigas concluídas recebem 1 estrela inicial para não ficarem sem avaliação.
- Novas conclusões calculam a avaliação pela porcentagem de acertos:
  - 3 estrelas: 90% ou mais
  - 2 estrelas: 75% a 89%
  - 1 estrela: 60% a 74%
  - 0 estrelas: abaixo de 60%
- O mapa mantém sempre a melhor avaliação conquistada.
- As estrelas preenchidas usam a cor principal do tema ativo.
- O histórico é salvo localmente sem exigir nova coluna no Supabase.
