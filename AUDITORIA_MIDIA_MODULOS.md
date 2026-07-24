# Auditoria da refatoração de mascotes e banners

## Resultado

A entrega Falla(9) continha uma implementação parcial. Esta revisão corrige a descoberta do recurso no painel e documenta as limitações encontradas.

## Implementado e verificado por inspeção

- Serviço de upload para Supabase Storage no bucket `module-media`.
- Otimização/redimensionamento para WEBP de PNG/JPEG e preservação de GIF/SVG.
- Mascote único salvo em `modules/<id>/mascot.<ext>`.
- Upload múltiplo de banners em `modules/<id>/banners/`.
- Tabela `module_banners`, ordenação, exclusão e Storage path.
- Preview, drag and drop, barra de progresso, lazy loading e skeleton do banner.
- Alternância local entre aleatório e carrossel.
- Uso do mascote do módulo no player de lições.
- Uso de banners e mascote no caminho de progresso.
- Aba própria no Admin: `Mascotes e Banners dos Módulos`.
- Botão explícito: `Importar Banner`.

## Corrigido nesta revisão

- O gerenciador estava escondido no topo da aba `Cursos & Lições`.
- O botão dizia apenas `Importar`.
- Foi criada uma aba administrativa própria e visível.
- O mascote foi adicionado ao cartão do módulo na tela de progresso.

## Itens que não estavam completamente implementados na entrega anterior

- A configuração aleatório/carrossel usa `localStorage`; não é uma configuração global compartilhada no banco.
- A migração SQL copia mascotes legados, mas não contém uma migração genérica comprovada para todos os formatos possíveis de banners antigos.
- O sistema antigo de mascotes globais e banners de perfil continua no projeto. Ele não foi removido porque também atende recursos de perfil/loja e removê-lo sem separar esses domínios quebraria funcionalidades existentes.
- Não foi possível confirmar uso do mascote em absolutamente todas as telas do módulo. O uso está confirmado no player de lições e no progresso.
- O progresso do upload é estimado por etapas; a API JS do Supabase usada não fornece progresso de bytes nativo nesse fluxo.

## Testes executados

- Inspeção de imports e pontos de renderização.
- Verificação dos caminhos de Storage e operações de banco.
- Verificação da integração do painel, player e progresso.
- Tentativa de instalar dependências e executar `npm run lint`.

## Bloqueio do teste automatizado neste ambiente

As dependências não estavam incluídas no ZIP e a instalação pelo npm não foi concluída neste ambiente. Assim, TypeScript/build reportaram módulos ausentes. Além disso, o projeto já contém erros de tipagem anteriores e não relacionados à mídia, como `GrammarCenter`, `Inventory`, `SocialHub` e uma opção inválida de Notification.

Para validação local completa:

```bash
npm install
npm run lint
npm run build
```

Execute também `supabase/module_media_refactor.sql` no Supabase antes de testar uploads.

## Correção Falla(11)
- Corrigido crash do painel administrativo causado por uso de `ImagePlus` sem importação em `src/components/AdminPanel.tsx`.
- Removidas dependências locais incompletas para garantir instalação limpa com `npm install`.
