# Idioma local e traduções

## O que foi corrigido

- O campo **Significado** não repete mais a própria resposta correta.
- A tradução legada da planilha é tratada como português e só aparece para usuários com idioma local em português.
- Quando não existe tradução para o idioma escolhido, o app informa que a tradução ainda não está disponível, em vez de mostrar um texto incorreto.
- O usuário pode escolher o **Idioma local** em **Mais > Idioma local**.
- O idioma do aparelho é detectado automaticamente no primeiro uso e a preferência fica salva no dispositivo.

## Estrutura para questões globais

Cada questão agora aceita traduções por localidade:

```ts
localizedTranslations: {
  "pt-BR": "Foi bom ver você novamente",
  "es-ES": "Fue bueno verte de nuevo",
  "fr-FR": "C'était agréable de vous revoir"
}
```

O campo antigo `translation` continua funcionando como tradução em português para manter compatibilidade com as planilhas já importadas.

## Observação importante

Selecionar o idioma local não cria traduções automaticamente. Para conteúdo mundial, as traduções devem ser importadas na questão usando `localizedTranslations` ou adicionadas posteriormente ao banco. Isso evita traduções erradas e não depende de serviços pagos.
