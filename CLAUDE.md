# Fábrica de Sites — regras do projeto

Este repositório é o **molde** (ou uma cópia dele para um cliente). O trabalho é sempre
o mesmo: pegar um site antigo e reconstruí-lo com **direção de arte própria**, no nível
de acabamento do site do Tombô (tipografia editorial, movimento, transições), rápido e
fácil de manter. Siga estas regras em toda sessão.

## Stack fixa (não trocar sem pedido explícito)
- **Next.js 16** com `output: 'export'` (site 100% estático, sai em `out/`)
- **GSAP 3** (ScrollTrigger, ScrollSmoother, SplitText) — o "motor" em `src/lib/`
- CSS puro com tokens (sem Tailwind). Fontes self-hosted via `@fontsource`.
- React 19, TypeScript. Node 22 (`.node-version`).

## Onde fica cada coisa
| O quê | Onde |
|---|---|
| Nome, contatos, menu, textos da home e do rodapé | `conteudo/site.json` |
| Páginas institucionais (`/sobre/`, `/historia/`…) | `conteudo/paginas/<slug>.md` |
| Coleção numerada (projetos/serviços/obras) | `conteudo/projetos/<slug>.md` |
| Notícias / diário | `conteudo/noticias/<slug>.md` |
| **Cores, fontes, proporções do cliente** | `src/styles/tema.css` (+ imports de fonte em `src/app/layout.tsx`) |
| Motor de movimento (não mexer por cliente) | `src/lib/gsap.ts`, `motion.ts`, `useScene.ts`, `intro.ts` |
| Seções da home | `src/components/secoes/` (ligadas por `site.json → home.secoes`) |
| Base visual comum | `src/app/globals.css`, `src/styles/{components,home,pages}.css` |
| Imagens do site | `public/img/…` (WebP, copiadas de `extraido/imagens-web/`) |
| Direção de arte aprovada | `DIRECAO.md` (criado pela skill `/direcao-de-arte`) |
| URLs antigas → novas | `redirects.json` |
| Material do site antigo (só leitura) | `extraido/` |
| Ficha/status do cliente | `cliente.json` |

Formato dos `.md`, opções do `site.json` e blocos especiais da prosa (tabela, estante,
vídeo, âncoras…): `conteudo/LEIA-ME.md` e `docs/BLOCOS.md`.

## Regras de conteúdo (as mais importantes)
1. **Nunca invente conteúdo.** Todo fato (texto, telefone, endereço, serviço, preço,
   data, nome de pessoa, depoimento) precisa existir em `extraido/`. Se faltar, anote em
   `PENDENCIAS.md` e siga — não preencha com texto genérico.
2. **Pode melhorar a forma, não o sentido:** títulos de seção, chamadas curtas, frases de
   efeito da direção de arte (ex.: a pergunta do hero) podem ser escritas, desde que não
   afirmem fatos novos. Corrigir ortografia e quebrar parágrafos é permitido.
3. **Depoimentos só reais.** Sem depoimento no site antigo, não existe seção de depoimentos.
4. **Português do Brasil**, tom do próprio cliente.
5. **Direitos autorais:** não reproduza poemas, letras ou textos de terceiros que estavam
   no site antigo; anote em `PENDENCIAS.md`.
6. Nada do molde pode sobrar ("Exemplo", `exemplo.com.br`, `/img/exemplo/`). O
   `npm run checar` acusa como erro num repositório de cliente.

## Regras de design e código
- **Cada cliente tem direção de arte própria** (conceito, paleta, fontes, seções
  assinatura) definida em `DIRECAO.md` e aprovada pelo usuário ANTES de montar o site.
  Nunca reutilize a identidade de outro cliente (nem a do Tombô).
- Cores e fontes do cliente só em `tema.css`. Nos componentes, use as variáveis
  (`var(--destaque)`…) e as classes de tema (`tema-escuro`, `tema-claro`, `tema-destaque`).
- Reutilize as seções e o motor. Seção nova só se nenhuma servir — e aí genérica
  (dados via props/JSON), para voltar ao molde depois.
- Animação declarativa por atributos: `data-split`, `data-fade`, `data-stagger`,
  `data-reveal="img"`, `data-parallax`, `data-magnetic`, `data-now` (ver `src/lib/motion.ts`).
  Tudo precisa funcionar com "reduzir movimento" (o CSS já mostra estático).
- Imagens: WebP, `alt` descritivo (vazio só se decorativa), ≤ 300 KB (exceto hero ≤ 500 KB).
- Cada página: um único `<h1>`, título e descrição próprios (metadata do Next).
- Contraste: texto `--claro` sobre `--escuro` e `--escuro` sobre `--destaque` ≥ 4.5:1.
- Mobile first: confira os prints de celular sempre.

## SEO e migração (não pode falhar)
- Toda URL em `extraido/urls-antigas.json` precisa de destino: página nova **ou** entrada
  em `redirects.json` (inclusive as `mesma_pagina_que`). Destinos com barra final (`/sobre/`).
- Depois de mudar `redirects.json`: `node scripts/gerar-redirects.mjs` e commit de
  `vercel.json` + `public/_redirects`.
- `site.json → url` = domínio final do cliente (sitemap e robots saem daí).

## Fluxo padrão (skills)
1. `/extrair URL` → captura o site antigo para `extraido/`
2. `/direcao-de-arte` → propõe conceito, paleta, fontes e seções; **usuário aprova**
3. `/reconstruir` → monta o site no molde, seguindo `DIRECAO.md`
4. `/revisar` → build, checagem, prints e agente `revisor-qa`
5. `/proposta` → antes × depois (imagens + PDF) para apresentar ao cliente
Atualize `cliente.json → status` ao fim de cada etapa.

## Trabalhando na nuvem (modo padrão)
- O ambiente é temporário: **ao fim de cada etapa, commit e push**.
- A nuvem pode não ter internet nem npm. Não tente contornar. Use o GitHub Actions:
  - **Extrair site antigo** (`extrair.yml`) — extração com internet; o campo `lista`
    baixa arquivos avulsos (PDFs, capas originais) de uma lista JSON (skill `/extrair`);
  - **Qualidade** (`qualidade.yml`) — roda sozinho a cada push: build + `checar`.
    Se falhar, o erro vira anotação legível pela API (`check-runs/<id>/annotations`);
  - **Proposta** (`proposta.yml`) — antes × depois, PDF e Lighthouse, salvos no branch
    `prints`, pasta `proposta/<branch>/` (skill `/proposta`);
  - **Prints** (`prints.yml`) — compila e fotografa as páginas (desktop, celular, com e
    sem animação) e salva no branch `prints`, pasta `prints/<branch>/`. É assim que você
    VÊ o site: `git fetch origin prints` e abra os JPG com a ferramenta de leitura.
    Campo `rotas` para fotografar páginas específicas (`/noticias/x/,/sobre/`).
  Dispare pela API (`POST .../actions/workflows/<arquivo>/dispatches`) e acompanhe em
  `.../actions/workflows/<arquivo>/runs?branch=<branch>&per_page=1`.
- Sem `node_modules` não há build local: revise o TypeScript com atenção redobrada
  antes do push e confira o resultado do workflow **Qualidade**.
- De `extraido/`, tudo vai para o Git menos `extraido/imagens/` (originais pesadas).
  `DIRECAO.md`, `PLANO.md` e `PENDENCIAS.md` também vão: são a memória do projeto.

## Definição de pronto
- ✅ no workflow **Qualidade** (build + `checar` sem ERROS) e deploy *Ready* na Vercel
- Prints revisados (desktop e celular) sem nada cortado, sobreposto ou ilegível
- `PENDENCIAS.md` com tudo que depende do cliente
