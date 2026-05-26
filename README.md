# Painel SellOut

Versao do projeto **Controle SellOut** preparada para publicacao na conta GitHub `lariantunez`.

## Estrutura

- `index.html`: painel web publicado no GitHub Pages.
- `apps-script_6.js`: backend em Google Apps Script usado como API do painel.

## Publicacao no GitHub Pages

1. Criar um repositorio na conta `lariantunez`, por exemplo `painel-acompanhamento-relatorios-sellout`.
2. Enviar estes arquivos para a branch principal.
3. Em `Settings > Pages`, selecionar `Deploy from a branch`.
4. Publicar a branch `main` na pasta `/root`.

URL esperada:

```text
https://lariantunez.github.io/painel-acompanhamento-relatorios-sellout/
```

## Observacao

A URL do Apps Script pode continuar a mesma caso a implantacao atual esteja ativa. Se criar uma nova implantacao do Apps Script, atualize a URL no painel.
