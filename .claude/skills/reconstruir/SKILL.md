---
name: reconstruir
description: Reconstrói o site do cliente no molde Next.js + GSAP a partir de extraido/ e da direção de arte aprovada em DIRECAO.md (tema, conteúdo em Markdown, seções da home, imagens, redirects). Use depois do /direcao-de-arte, quando o usuário pedir para montar, reconstruir ou migrar o site.
---

# /reconstruir — montar o site novo

Instruções extras do usuário: $ARGUMENTS

Releia o `CLAUDE.md`. Regra nº 1: **não inventar conteúdo**.
- Sem `extraido/paginas/` → peça `/extrair URL` primeiro.
- Sem `DIRECAO.md` aprovado (`cliente.json → status: direcao-aprovada`) → rode
  `/direcao-de-arte` primeiro. Não construa sem direção aprovada.

## 1. Plano curto (`PLANO.md`)
Tabela `URL antiga → destino novo` (inclua `mesma_pagina_que`, categorias, arquivos por
mês, anexos) e a lista de arquivos de conteúdo que você vai criar.

## 2. Tema (`src/styles/tema.css` + fontes)
- Cores e variáveis conforme o DIRECAO.md (`--escuro`, `--claro`, `--destaque`…,
  `--display-largura`, `--display-peso`).
- Fontes: adicione os pacotes `@fontsource` no `package.json` (dependencies, versão
  `^5.x`), troque os imports no topo de `src/app/layout.tsx` e as `--font-*` no tema.
  Remova do package.json os pacotes de fonte que deixaram de ser usados.
  **Atenção:** mudou o package.json → o `package-lock.json` fica desatualizado. Se não
  houver npm aqui, apague o `package-lock.json` (o workflow e a Vercel recriam) e anote
  em PENDENCIAS.md para gerar um lock novo depois.
- `site.json → corTema` = `--escuro`. Favicon em `public/img/favicon.svg` com a marca.

## 3. Imagens (`public/img/`)
- Copie de `extraido/imagens-web/` **só** as imagens que o site usa, com nomes claros
  (`public/img/projetos/ervateira-01.webp`). Nada de ícones velhos, botões, banners.
- Foto de lado? Gire com sharp (`.rotate(90)`) ao copiar. Foto grande demais? Reduza
  para ≤ 1920px e ≤ 300 KB (hero ≤ 500 KB).
- `public/img/og.jpg` 1200×630 a partir da melhor foto (com sharp).
- Apague `public/img/exemplo/` e `public/img/og.jpg` do molde se não forem substituídos.

## 4. Conteúdo (`conteudo/`)
- `site.json`: todos os campos com dados reais + textos da direção de arte. `home.secoes`
  na ordem do DIRECAO.md. `nav` só com páginas que existem. `url` = domínio final (ou o
  provisório da Vercel, anotando em PENDENCIAS.md). Sem formulário? `formEndpoint: ""`.
- `paginas/*.md`, `projetos/*.md`, `noticias/*.md`: um arquivo por página, com o texto
  do site antigo convertido para Markdown limpo (sem restos de "Compartilhe", "Curtir",
  datas duplicadas). Front matter conforme `conteudo/LEIA-ME.md`. Use os blocos de
  `docs/BLOCOS.md` (galeria `.grid`, equipe `.people`, ficha `.facts`, capítulo
  `.chapter`) para dar ritmo às páginas longas.
- Apague os arquivos de exemplo do molde (`projeto-exemplo-*`, notícias de exemplo,
  `sobre.md` se não for usado). Se o cliente não tiver projetos ou notícias, tire a seção
  da home e o item do menu (as rotas continuam existindo, vazias).

## 5. Migração
- `redirects.json` com a tabela do PLANO.md (destinos com barra final) →
  `node scripts/gerar-redirects.mjs`.

## 6. Conferir (obrigatório, nesta ordem)
1. Revise o TypeScript/JSX que você mexeu (tipos de `site.json` em `src/lib/site.ts`).
2. `git add -A && git commit -m "Reconstrução do site" && git push`.
3. Acompanhe o workflow **Qualidade** do push. Falhou? Leia as anotações do check-run,
   corrija, push de novo — até ficar verde.
4. Dispare o workflow **Prints** no branch, baixe os prints (`git fetch origin prints`)
   e **olhe** home (abertura + rolagens), celular e uma página de cada tipo. Corrija
   texto cortado, sobreposição, foto ruim, contraste. Repita os prints se mudou algo visual.
5. `cliente.json → "status": "reconstruido"`, commit e push.
6. Responda com: link de prévia da Vercel, 2–3 prints principais, redirects, pendências
   do cliente. Próximo: `/revisar`.
