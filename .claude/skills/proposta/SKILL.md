---
name: proposta
description: Gera o material de entrega/apresentação "antes × depois" para o cliente — imagens lado a lado do site antigo e do novo (computador e celular), apresentação em PDF no visual do site novo, notas do Google Lighthouse e uma mensagem pronta para enviar. Use quando o site estiver reconstruído/revisado e o usuário quiser mostrar, entregar, vender ou apresentar o site ao cliente.
---

# /proposta — antes × depois para o cliente

Instruções extras do usuário: $ARGUMENTS

O objetivo é o cliente **ver em 10 segundos** a diferença entre o site dele hoje e o novo.
Tudo sai de material real: prints do site antigo (`extraido/screenshots/`), prints do
site novo e medições. **Nenhum número inventado, nenhuma promessa que o site não cumpre.**

## 1. Pré-requisitos (confira, não pergunte)
- `extraido/screenshots/home.jpg` existe → senão, `/extrair` primeiro.
- `cliente.json → status` é `reconstruido` ou `revisado` → senão avise que o site ainda
  não está pronto para mostrar (pode seguir se o usuário insistir, marcando "prévia").
- O último workflow **Qualidade** do branch está verde.

## 2. Escreva `proposta.json` (na raiz do repositório)
Campos (todos opcionais; o script tem padrões):
```json
{
  "assinatura": "Nome do estúdio do usuário",
  "contato": "e-mail ou WhatsApp do estúdio",
  "rotulo": "Novo site",
  "titulo": "Antes e depois do novo site",
  "resumo": "1–2 frases sobre o conceito (do DIRECAO.md, sem fatos novos)",
  "urlNova": "https://link-de-previa.vercel.app",
  "destaques": ["3–5 frases curtas do que muda, cada uma verificável"],
  "proximosPassos": ["o que o cliente precisa mandar/decidir (do PENDENCIAS.md)"],
  "pares": [{ "antigo": "quem-somos", "novo": "/quem-somos/", "titulo": "Quem somos" }],
  "notasPares": { "/": "1 frase do que mudou nesta tela", "celular": "…", "/quem-somos/": "…" },
  "mostrarNotas": true
}
```
- **assinatura/contato**: são do estúdio do usuário. Se não estiverem no `proposta.json`
  de outro cliente nem na conversa, **pergunte uma vez** e depois reutilize.
- **resumo** e **destaques**: tire do `DIRECAO.md` (conceito) e do que o site novo de fato
  tem. Bons destaques são concretos e verificáveis nos prints: "funciona no celular"
  (se o antigo não funcionava — veja `extraido/screenshots/home-celular.jpg`),
  "fotos em tela cheia", "cada ação vira um registro numerado", "todos os endereços
  antigos redirecionados". Nada de "aumenta suas vendas", "melhor posição no Google".
- **proximosPassos**: do `PENDENCIAS.md`, reescrito como pedido ao cliente
  ("Enviar fotos em alta resolução das feiras", "Confirmar o texto do manifesto").
- **urlNova**: link de prévia da Vercel. **Nunca adivinhe** pelo nome do projeto: se o
  nome `<projeto>.vercel.app` já era de outra pessoa, a Vercel usa outro (ex.:
  `site-cemear-eight.vercel.app`) — e o nome "certo" pode ser o site de outra organização
  com a mesma sigla. Pegue o link com o usuário (ou no painel da Vercel) e confira com
  WebFetch que é o site novo. O workflow também confere o `<title>` antes de medir.
  Anote o link em `site.json → url` se ainda não houver domínio.
- **notasPares**: uma frase por comparação (chave = rota nova; `celular` = a do celular),
  descrevendo só o que dá para ver nos dois prints. Olhe os prints antes de escrever.
- **pares**: só se os padrões (home + até 3 páginas) não mostrarem o melhor. `antigo` =
  nome do print em `extraido/screenshots/` sem `.jpg`.

Commit e push do `proposta.json`.

## 3. Rode o workflow **Proposta**
```bash
curl -sS -X POST -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/<dono>/<repo>/actions/workflows/proposta.yml/dispatches \
  -d '{"ref":"<branch>","inputs":{"url_nova":"<link ou vazio>","lighthouse":"true"}}'
```
Acompanhe em `.../actions/workflows/proposta.yml/runs?branch=<branch>&per_page=1`
(as anotações do job trazem a lista de arquivos e os números). Depois:
`git fetch origin prints:refs/remotes/origin/prints` e
`git archive origin/prints proposta/<branch> | tar -x -C <pasta temporária>`.

## 4. Olhe tudo antes de mandar (obrigatório)
- Abra **cada** `antes-depois-*.jpg` e a `capa.jpg` com a ferramenta de leitura.
  Procure: print do site novo em branco ou no meio da animação, rótulo cortado, par que
  não faz sentido (página antiga sem relação com a nova), celular borrado.
- Abra o PDF (páginas como imagem: `pdftoppm -r 50 -jpeg`) e confira cada página:
  fontes do cliente carregadas, nada vazando da página, textos corretos.
- **Lighthouse:** leia `numeros.json`. Mostre as notas só se forem honestas e a favor —
  se o site novo perder em algo, ou se o "depois" foi medido na cópia local (sem
  `urlNova`), avise o usuário e use `"mostrarNotas": false`. Nunca edite números.
- Corrigiu algo (no `proposta.json` ou no site)? Rode de novo.

## 5. Entregue ao usuário
- Envie com SendUserFile: `apresentacao.pdf`, a comparação da home no computador e a do
  celular (as mais fortes), e `capa.jpg`.
- Escreva **uma mensagem curta pronta** para ele mandar ao cliente (WhatsApp/e-mail),
  no tom do usuário: o que é, o link de prévia, o que precisa do cliente (próximos passos).
- Lembre em uma linha: o material é **só para esse cliente**. Mostrar o redesign em
  portfólio ou redes sociais só com autorização dele (o site antigo e as fotos são dele).
- `cliente.json → "proposta_em": "<data>"`, commit e push.

## Regras
- A comparação é sempre **primeira tela contra primeira tela**, mesma largura — nada de
  escolher o pior pedaço do site antigo.
- O site antigo aparece como ele é (inclusive o "×" de algum aviso); não retoque.
- Não trocar fotos, cores ou textos do site só "para a proposta": o que o cliente vê é o
  que vai ao ar.
