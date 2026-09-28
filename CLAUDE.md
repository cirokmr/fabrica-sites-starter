# Fábrica de Sites — regras do projeto

Este repositório é o **molde** (ou uma cópia dele para um cliente). O trabalho aqui é
sempre o mesmo: pegar um site antigo e reconstruí-lo neste padrão moderno, rápido e
fácil de manter. Siga estas regras em toda sessão.

## Stack fixa (não trocar sem pedido explícito)
- **Astro 5** (site estático) + **Tailwind CSS 4** (via `@tailwindcss/vite`)
- Sem React/Vue/jQuery. JavaScript só quando for indispensável.
- Node 20+. Comandos: `npm run dev`, `npm run build`, `npm run checar`.

## Onde fica cada coisa
| O quê | Onde |
|---|---|
| Todo o texto e dados do cliente | `src/data/site.json` |
| Cores e fontes da marca | bloco `@theme` em `src/styles/global.css` |
| Componentes de seção (reutilizáveis) | `src/components/` |
| Páginas | `src/pages/` (1 arquivo = 1 URL) |
| Imagens otimizadas do site antigo | `extraido/imagens-web/` (WebP, geradas por `npm run imagens`) |
| Imagens usadas no site novo | `public/imagens/` (copiadas de `extraido/imagens-web/`) |
| URLs antigas → novas | `redirects.json` |
| Material do site antigo (só leitura) | `extraido/` |
| Ficha/status do cliente | `cliente.json` |

## Regras de conteúdo (as mais importantes)
1. **Nunca invente conteúdo.** Todo texto, telefone, endereço, serviço, preço e depoimento
   precisa existir em `extraido/`. Se algo necessário não existir, escreva em
   `PENDENCIAS.md` e siga em frente — não preencha com texto genérico.
2. **Pode melhorar a forma, não o sentido:** corrigir ortografia, quebrar parágrafos
   longos, criar títulos de seção e chamadas curtas (CTA) é permitido. Mudar fatos, não.
3. **Depoimentos só reais.** Se o site antigo não tem, a lista fica vazia (a seção some).
4. **Português do Brasil**, tom do próprio cliente.
5. Nenhum texto do molde pode sobrar ("Empresa Exemplo", "exemplo.com.br", "tirada do
   site antigo"). O `npm run checar` acusa isso como erro.

## Regras de código
- **Reutilize os componentes existentes.** Crie um componente novo só se nenhum servir,
  e aí deixe-o genérico (recebendo props), para entrar no molde depois.
- Texto nunca fica "chumbado" no componente: vem de `site.json` via props.
- Cores só pelos tokens (`bg-primaria`, `text-texto`...). Nada de hex solto nos componentes.
- Toda `<img>` tem `alt` (descritivo; `alt=""` só para imagem decorativa), `width/height`
  quando possível e `loading="lazy"` (menos a primeira imagem da página).
- Cada página: um único `<h1>`, `titulo` e `descricao` próprios no `<Layout>`.
- Imagens sempre em WebP (de `extraido/imagens-web/`); nenhuma acima de 300 KB.
- Mobile first: confira sempre em 390px de largura.

## SEO e migração (não pode falhar)
- Toda URL em `extraido/urls-antigas.json` precisa ter destino: uma página nova com o
  mesmo caminho **ou** uma entrada em `redirects.json`. URLs com `mesma_pagina_que`
  (ex.: `/index.html`) também recebem redirect. Isso preserva o Google do cliente.
- Preserve títulos e descrições antigos quando forem bons; melhore quando vazios/ruins.
- `seo.url` em `site.json` = domínio final do cliente (com https e www, se usar).
- Atualize `public/robots.txt` com o domínio certo.

## Fluxo padrão (skills)
1. `/extrair URL` → captura o site antigo para `extraido/`
2. `/reconstruir` → monta o site novo a partir de `extraido/`
3. `/revisar` → controle de qualidade com o agente `revisor-qa`
Atualize o campo `status` de `cliente.json` ao fim de cada etapa.

## Trabalhando na nuvem (modo padrão)
- O ambiente da nuvem é temporário: **ao fim de cada etapa, faça commit e push**.
  Trabalho não enviado ao GitHub se perde.
- A nuvem pode não ter acesso à internet nem ao npm. Não tente contornar o bloqueio:
  - a **extração** do site antigo roda pelo GitHub Actions (workflow *Extrair site
    antigo*, veja a skill `/extrair`);
  - `extrair.mjs` e `otimizar-imagens.mjs` também funcionam sem `npm install`, usando o
    Playwright e o sharp já instalados no ambiente, quando houver internet.
- Sem `node_modules` não dá para rodar `npm run build`/`checar` aqui. Quem compila e
  checa é o **GitHub Actions** (`.github/workflows/qualidade.yml`) e a **Vercel**, a cada
  push. Nesse caso, revise o código com atenção redobrada antes do push e diga ao usuário
  para conferir a aba *Actions* e o link de prévia.
- Depois de mudar `redirects.json`, rode `node scripts/gerar-redirects.mjs` e inclua
  `vercel.json` e `public/_redirects` no commit (a Vercel lê o `vercel.json` do repositório).
- De `extraido/`, tudo vai para o Git menos `extraido/imagens/` (originais pesadas):
  textos, JSONs, prints (`screenshots/*.jpg`) e imagens otimizadas (`imagens-web/`). `PLANO.md` e `PENDENCIAS.md` também vão no commit: são a
  memória do projeto entre sessões.

## Definição de pronto
- Build sem erros (localmente, ou ✅ no GitHub Actions / *Ready* na Vercel)
- `npm run checar` sem ERROS (avisos revisados e justificados em `PENDENCIAS.md`)
- `PENDENCIAS.md` lista tudo que depende do cliente (fotos melhores, textos faltando etc.)
