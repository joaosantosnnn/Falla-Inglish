# Controle de disponibilidade dos idiomas

## Implementado

- Nova aba **Idiomas Disponíveis** no painel administrativo.
- Botão liga/desliga para cada curso/idioma.
- Cursos desativados continuam armazenados no Supabase, mas deixam de aparecer para os alunos.
- O aplicativo troca automaticamente para o primeiro idioma disponível quando o idioma atual é desativado.
- Cache local da disponibilidade para respeitar a configuração durante falhas temporárias de conexão.
- Proteção para impedir que todos os idiomas sejam desativados ao mesmo tempo.
- Novos cursos são criados como ativos por padrão.

## Banco de dados

Não é necessário executar SQL. A configuração é salva no campo `data` JSON da tabela `courses`, usando a propriedade `active`.

- `active: true` ou ausente: curso disponível.
- `active: false`: curso oculto para os usuários.

## Uso

Acesse:

`Painel Administrativo > Idiomas Disponíveis`

Deixe inglês ativo e desligue os idiomas que ainda estão em produção.
