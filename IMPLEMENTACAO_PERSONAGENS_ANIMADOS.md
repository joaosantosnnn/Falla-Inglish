# Personagens animados nas lições

Implementado sem serviço pago e sem dependência obrigatória de Rive.

## Recursos
- personagem maior e sem corte;
- estado parado com movimento suave;
- estado falando sincronizado com o áudio;
- estado ouvindo sincronizado com o microfone;
- reação ao acerto e ao erro;
- suporte a GIF e WebP animado por estado;
- ajuste de tamanho pelo painel de Mascotes;
- fallback automático para a imagem estática existente.

## Colunas opcionais no Supabase
Execute no SQL Editor:

```sql
ALTER TABLE mascots ADD COLUMN IF NOT EXISTS idle_animation_url TEXT;
ALTER TABLE mascots ADD COLUMN IF NOT EXISTS speaking_animation_url TEXT;
ALTER TABLE mascots ADD COLUMN IF NOT EXISTS correct_animation_url TEXT;
ALTER TABLE mascots ADD COLUMN IF NOT EXISTS wrong_animation_url TEXT;
ALTER TABLE mascots ADD COLUMN IF NOT EXISTS lesson_size INTEGER DEFAULT 150;
```

Use GIF ou WebP animado com fundo transparente. Para boca realmente sincronizada por fonemas, será necessário fornecer um arquivo Rive preparado por um animador; a estrutura atual já separa os estados e pode ser evoluída depois.
