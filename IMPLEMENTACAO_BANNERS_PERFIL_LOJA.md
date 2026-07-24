# Implementação — Banners de Perfil na Loja

## O que foi mantido

- Banners dos módulos continuam separados e no mesmo local.
- Gradientes e banners animados de perfil já existentes continuam funcionando.
- Compra com moedas, desbloqueio, equipar e banner ativo continuam funcionando.

## O que foi adicionado

- Importação de imagem real na aba **Banners de Perfil** do painel administrativo.
- Formatos aceitos: PNG, JPG/JPEG, WEBP e GIF.
- Limite de 8 MB.
- Recomendação visual de 1920 x 600.
- Upload automático para o bucket `module-media`, pasta `profile-banners/`.
- Preview imediato após o upload.
- Publicação do banner na loja com nome, preço e definição de desbloqueio padrão.
- Mensagens de validação para formato, tamanho e falha de upload.

## Fluxo

1. Painel Admin > Banners de Perfil.
2. Informe o nome.
3. Importe a imagem ou use um gradiente.
4. Defina o preço em Falla Moedas.
5. Marque como desbloqueado por padrão somente quando for gratuito.
6. Clique em **Salvar e Ativar Novo Banner**.
7. O banner aparece na loja do perfil para comprar/equipar.

## Observação de implantação

Execute a migração de mídia já incluída no projeto para garantir a existência do bucket público `module-media` e suas políticas de acesso.
