# Correção — qualidade e enquadramento das capas de perfil

## Alterações

- Incluídas no painel administrativo instruções visíveis para criação de capas com boa qualidade.
- Recomendação principal alterada para 1920 × 640 px, proporção 3:1.
- Incluídas orientações sobre área segura central, resolução mínima e formatos.
- Removido o ajuste por arraste do painel administrativo.
- O banner é publicado centralizado; o enquadramento individual passa a ser feito apenas no perfil do usuário.
- Corrigido o CSS da tela inicial que utilizava `!important` e ignorava o posicionamento e zoom salvos no perfil.
- O enquadramento salvo no perfil passa a ser reutilizado na capa da tela inicial.

## Validação

A verificação estrutural dos arquivos alterados foi concluída. O build integral não pôde ser executado no ambiente de entrega porque o pacote não inclui `node_modules`; execute `npm install` e `npm run build` na máquina do projeto.
