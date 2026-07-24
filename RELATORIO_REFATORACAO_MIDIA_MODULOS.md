# Relatório — Refatoração de Mascotes e Banners por Módulo

## Implementado

- Gerenciamento simplificado de mídia dentro da aba **Cursos & Lições**.
- Seleção de curso e módulo.
- Um mascote por módulo, com upload e salvamento automáticos.
- Upload múltiplo de banners.
- Drag and drop para importar arquivos.
- Preview de mascote e banners.
- Exclusão e reordenação de banners por arrastar.
- Compressão/redimensionamento automático para WebP quando aplicável.
- Preservação de GIF, SVG e WebP pequenos para manter animações e qualidade.
- Barra de progresso de upload.
- Lazy loading e skeleton dos banners no aplicativo.
- Cache de um ano nos arquivos enviados ao Storage.
- Estratégia global de banners: aleatório ou carrossel automático.
- Organização automática no bucket `module-media/modules/<module>/...`.
- Mascote do módulo usado prioritariamente em todas as etapas da lição, com movimentos automáticos por estado.
- Banners exibidos automaticamente no cabeçalho de cada módulo na trilha de progresso.
- Compatibilidade preservada com mascotes globais usados em perfis, ranking e recursos sociais.

## Arquivos criados

- `src/components/ModuleMediaManager.tsx`
- `src/components/ModuleBannerDisplay.tsx`
- `src/services/moduleMediaService.ts`
- `supabase/module_media_refactor.sql`
- `RELATORIO_REFATORACAO_MIDIA_MODULOS.md`

## Arquivos alterados

- `src/types.ts`
- `src/App.tsx`
- `src/components/AdminPanel.tsx`
- `src/components/AnimatedLessonMascot.tsx`
- `src/components/LessonPlayer.tsx`
- `src/components/ProgressTrail.tsx`

## Decisões técnicas

A estrutura existente salva cursos e módulos em JSON dentro da tabela `courses`. Para evitar perda de dados e não quebrar importação, fases, questões e progresso, foram adicionados `mascotUrl` e `iconUrl` ao objeto do módulo, mantendo o formato atual.

Os banners foram normalizados na nova tabela `module_banners`, pois são uma coleção ordenável e precisam de exclusão/reordenação independentes.

O sistema antigo de mascotes globais foi mantido apenas onde ainda é necessário para perfil, ranking e social. Nas lições, o mascote do módulo passa a ter prioridade absoluta. Assim, a refatoração não quebra usuários existentes.

## Implantação

1. Abra o SQL Editor do Supabase.
2. Execute `supabase/module_media_refactor.sql`.
3. Publique o frontend normalmente.
4. No painel administrativo, abra **Cursos & Lições**.
5. Na seção **Mídia simplificada dos módulos**, selecione o curso e o módulo.
6. Importe um mascote e os banners. Não é necessário copiar URLs nem clicar em salvar.

## Validação

- Todos os arquivos alterados passaram pela análise sintática do TypeScript.
- O `tsc --noEmit` ainda aponta erros preexistentes em `GrammarCenter`, `Inventory`, `FloatingFriendsChat`, `speechRecognitionService` e na cópia duplicada `Falla/` incluída no pacote original.
- O build no ambiente Linux não pôde ser executado com o `node_modules` recebido, pois ele contém binários nativos de outro sistema operacional. No computador de destino, remova `node_modules`, execute `npm install` e depois `npm run build`.
