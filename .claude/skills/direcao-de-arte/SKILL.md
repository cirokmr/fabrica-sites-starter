---
name: direcao-de-arte
description: Propõe a direção de arte de um cliente (conceito, paleta, fontes, seções assinatura e mapa do site) a partir do material extraído, para aprovação antes da reconstrução. Use depois do /extrair e antes do /reconstruir, ou quando o usuário pedir conceito, identidade visual ou "cara" do site.
---

# /direcao-de-arte — o que torna cada site único

Instruções extras do usuário: $ARGUMENTS

O nível de referência é o site do Tombô: um **conceito** que organiza tudo (lá, "o acervo":
cada projeto ganha número de tombo, seções alternam "tinta" e "papel" como um catálogo),
uma paleta tirada da marca, um trio de fontes com papéis claros e movimento a serviço da
leitura. Aqui você cria o equivalente **para este cliente** — nunca copie o do Tombô
nem de outro cliente.

## 1. Estude o material (não pule)
- `extraido/RELATORIO.md`, `identidade.json` (cores, fontes, logo, contatos), todas as
  páginas em `extraido/paginas/`, e **olhe** os prints (`extraido/screenshots/`) e uma
  folha de miniaturas das fotos de `extraido/imagens-web/` (monte com sharp/PIL e abra).
- Anote: do que o cliente vive, para quem fala, o vocabulário próprio dele, o que há de
  melhor nas fotos (cores dominantes, temas), o que é fraco ou inexistente.

## 2. Escreva `DIRECAO.md` com estas seções
1. **Conceito** — uma ideia em uma frase, tirada do universo do cliente (ex.: para uma
   ONG de agroecologia, "caderno de campo"; para uma marcenaria, "livro de medidas").
   Diga como ele aparece no site: nomes de seção, numeração, rótulos, ritmo das seções.
2. **Palavra do hero e frase-conceito** — a palavra gigante (normalmente o nome curto) e
   a pergunta/frase em itálico. Frases de efeito são permitidas; fatos novos não.
3. **Paleta** — `--escuro`, `--claro`, `--destaque`, `--apoio` com hex, de onde veio cada
   cor (logo, fotos, site antigo) e as razões de contraste calculadas
   (claro/escuro e escuro/destaque ≥ 4.5:1 — calcule de verdade).
4. **Tipografia** — display (títulos; caixa-alta por padrão, ou caixa baixa com
   `--display-caixa: none` e outra família em `--font-display`), serif itálica (acentos), mono
   (metadados). Só fontes do `@fontsource` (Google Fonts self-hosted). Diga o pacote npm
   de cada uma e se o display tem eixo de largura (`wdth`) — senão `--display-largura: 100%`.
   Display em fonte **variável** (quase todas do `@fontsource-variable`): na seção `faixa`
   use `"estilo": "apagado"` — o contorno vazado desenha linhas cruzando as letras.
   Evite o trio do Tombô (Archivo expandida + Instrument Serif + IBM Plex Mono) a menos
   que o usuário peça.
5. **Home, seção a seção** — quais seções do molde (`hero`, `manifesto`, `faixa`,
   `colecao`, `colagem`, `destaques`, `texto`, `marcos` = linha do tempo com anos), em que
   ordem, com que conteúdo/fotos, e qual tema (escuro/claro/destaque) cada uma usa — o
   `tema` de cada seção é configurável no `site.json`. Se precisar de uma seção nova,
   descreva-a (ela será criada genérica e depois volta para o molde).
6. **Mapa do site** — páginas novas × páginas antigas, e o que vira redirect.
7. **Fotos** — quais usar onde (nomes de arquivo em `extraido/imagens-web/`), quais
   precisam de corte, rotação ou ficam de fora, e o **tratamento** (`site.json → fotos`):
   `natural`, `misto` (cor nas fotos pequenas + duotone só nas grandes — o melhor ponto
   de partida quando as fotos são pequenas), `duotone` (tudo em duas tintas) ou `pb`.
   Pergunte ao usuário antes de tirar a cor de TODAS as fotos: a cor costuma ser parte
   do conteúdo (alimento, festa, paisagem).
8. **O que falta do cliente** — textos, fotos melhores, logo em vetor etc.

## 3. Mostre antes de construir
- Monte **uma prancha** (HTML estático simples, ou imagem gerada com sharp/PIL) com:
  paleta em amostras, as três fontes em uso (se não puder carregá-las, descreva), 4–6
  fotos escolhidas e a frase do hero. Envie ao usuário junto com o resumo do DIRECAO.md.
- Ofereça **no máximo duas alternativas** quando houver uma dúvida real (ex.: fundo
  escuro × claro dominante). Não ofereça cardápio.

## 4. Aprovação
- **Pare e espere a aprovação do usuário.** Aplique os ajustes que ele pedir no DIRECAO.md.
- Aprovado: `cliente.json → "status": "direcao-aprovada"`, commit e push
  (`git add DIRECAO.md cliente.json && git commit -m "Direção de arte" && git push`).
- Próximo passo: `/reconstruir`.
