---
name: reconstruir
description: Reconstrói o site do cliente no molde Astro + Tailwind a partir do material em extraido/ (conteúdo, identidade visual, páginas e redirects). Use depois do /extrair, quando o usuário pedir para montar, reconstruir ou migrar o site.
---

# /reconstruir — montar o site novo

Instruções extras do usuário (se houver): $ARGUMENTS

Antes de começar, releia o `CLAUDE.md`. A regra nº 1 é **não inventar conteúdo**.
Se `extraido/paginas/` não existir, pare e peça para rodar `/extrair URL` primeiro.
Se existir mas `extraido/imagens/` não (sessão nova na nuvem), rode de novo
`node scripts/extrair.mjs <site_antigo de cliente.json>` para recuperar imagens e prints.

## 1. Planejar (não pule)
Leia `extraido/RELATORIO.md`, `identidade.json`, `urls-antigas.json` e **todas** as
páginas em `extraido/paginas/`. Olhe os screenshots da home (desktop e celular).
Escreva um plano curto em `PLANO.md`:
- mapa do site novo: quais páginas existirão e de qual página antiga vem cada uma;
- quais páginas antigas viram seções da home ou são juntadas;
- tabela `URL antiga → URL nova` (inclua as `mesma_pagina_que`);
- cores e fontes escolhidas.
Regra de URLs: mantenha o mesmo caminho quando fizer sentido; quando mudar
(`/quem-somos.html` → `/sobre`), vira redirect.

## 2. Identidade visual
- Em `src/styles/global.css` (`@theme`), troque os tokens pelas cores da marca
  (`identidade.json → cores_mais_usadas`; ignore brancos/pretos/cinzas para primária).
  Garanta contraste AA do texto branco sobre `primaria` (escureça a cor se preciso).
- Fonte: se o site antigo usa Google Fonts, adicione o `<link>` no `Layout.astro`;
  se usa fonte de sistema antiga (Verdana, Arial), use a stack padrão do molde.
- `theme-color` no `Layout.astro` = cor primária.

## 3. Imagens
- Rode `node scripts/otimizar-imagens.mjs` (converte `extraido/imagens` → `public/imagens/*.webp` e gera
  `mapa-imagens.json`).
- Logo: use o arquivo indicado em `identidade.json`. Crie `public/favicon.svg` simples
  com a inicial na cor primária, se não houver favicon melhor.
- Imagem de compartilhamento: gere `public/imagens/og.jpg` (1200x630) a partir da
  melhor foto, ou aponte `seo.imagem_og` para uma imagem existente.
- `alt` de cada imagem: use o alt antigo; se vazio, descreva o que a imagem mostra.

## 4. Conteúdo → `src/data/site.json`
Preencha **todos** os campos com dados de `extraido/`: empresa, contatos, redes, menu,
SEO, home e páginas. Campos sem dado real: string vazia ou lista vazia (o componente
some sozinho). Anote em `PENDENCIAS.md` o que ficou faltando.

## 5. Páginas
- Ajuste `index.astro`, `sobre.astro`, `contato.astro` e crie as demais páginas do plano
  seguindo o mesmo padrão (Layout + componentes + dados de `site.json`).
- Para páginas novas, acrescente a chave correspondente em `site.json → paginas`.
- Atualize o `menu` em `site.json` com as páginas finais.
- PDFs de `extraido/documentos.json`: se forem importantes, anote em `PENDENCIAS.md`
  para o cliente enviar (o extrator só lista, não baixa).

## 6. Migração
- Preencha `redirects.json` com a tabela do plano e rode `node scripts/gerar-redirects.mjs`.
- Preencha `nova_url` em `extraido/urls-antigas.json`.
- `public/robots.txt` com o domínio final.

## 7. Conferir e salvar
- **Com `node_modules/`:** `npm run build` e depois `npm run checar`. Corrija todos os ERROS.
- **Sem `node_modules/` (nuvem sem npm):** releia cada arquivo `.astro` alterado procurando
  erros de sintaxe, props faltando e chaves de `site.json` inexistentes — o build vai
  rodar no GitHub Actions e na Vercel.
- Atualize `cliente.json → "status": "reconstruido"`.
- `git add -A && git commit -m "Reconstrução do site" && git push`
- Responda com: páginas criadas, redirects, pendências para o cliente, e peça ao usuário
  para conferir a aba *Actions* do GitHub e o link de prévia da Vercel. Próximo: `/revisar`.
