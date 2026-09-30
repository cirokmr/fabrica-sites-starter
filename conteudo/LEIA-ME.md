# conteudo/ — tudo que muda de um cliente para outro

| Arquivo / pasta | Vira no site |
|---|---|
| `site.json` | nome, contatos, menu, textos da home (seções), rodapé, SEO |
| `paginas/<slug>.md` | página institucional em `/<slug>/` (ex.: `sobre.md` → `/sobre/`) |
| `projetos/<slug>.md` | item da coleção em `/projetos/<slug>/` + cartão na home |
| `noticias/<slug>.md` | notícia em `/noticias/<slug>/` (ordenadas por `data`) |

Arquivos que começam com `_` são ignorados (use para rascunhos).
O topo de cada `.md` (entre `---`) tem os campos; o resto é o texto em Markdown.
Blocos de HTML (linhas começando com `<`) passam direto — veja os blocos especiais
disponíveis em `docs/BLOCOS.md`.

## Opções do `site.json`

Os tipos completos estão em `src/lib/site.ts`. Tudo abaixo é **opcional**: sem o campo,
o site fica como sempre foi.

### Seções da home (`home.secoes`)

Tipos: `hero`, `manifesto`, `faixa`, `colecao`, `colagem`, `destaques`, `texto`, `marcos`.

| Seção | Campo | O que faz |
|---|---|---|
| todas menos `hero` | `"tema": "escuro" \| "claro" \| "destaque"` | fundo da seção. Padrões: manifesto claro, faixa escuro, coleção escuro, colagem destaque, destaques claro, texto escuro, marcos escuro |
| `hero` | `pergunta` com `« »` | as aspas angulares saem na cor de destaque: `"«O que fica» quando a festa acaba?"` |
| `hero` | `{de}` e `{ate}` em `topo` e `base` | viram o 1º e o último ano das notícias (`"Notícias de {de} a {ate}"`). Vale também em `intro.esquerda` / `intro.direita` |
| `hero` | `nomeH1` | nome completo no `<h1>` só para leitores de tela e buscadores; a palavra gigante continua `palavra` |
| `manifesto` | `icones: { "src", "alt" }` | faixa de ícones/ilustração da marca abaixo do texto (imagem **clara** sobre transparente; no fundo claro ela é invertida) |
| `faixa` | `mostrarRotulo: true` | mostra o `rotulo` acima das faixas (sem isso, ele só é lido por leitores de tela) |
| `faixa` | `tamanho: "medio"` | letras menores, para palavras longas (nomes de parceiros). Listas com mais de 4 palavras mostram todas |
| `faixa` | `estilo: "apagado"` | 2ª faixa em cor apagada em vez de contorno (use com fontes variáveis) |
| `destaques` | `soComCapa: true` | só notícias com foto de capa |
| `destaques` | `umaPorCategoria: true` | no máximo uma notícia por categoria (a 1ª de cada uma), para variar os temas |

**Seção `marcos`** (linha do tempo: o ano gigante se preenche com a rolagem):

```json
{
  "tipo": "marcos",
  "rotulo": "(04) Trajetória",
  "titulo": { "display": "Marcos da", "serif": "nossa história" },
  "itens": [
    { "ano": "1983", "titulo": "Fundação", "texto": "Uma ou duas frases.", "imagem": { "src": "/img/…webp", "alt": "…", "legenda": "…" } }
  ],
  "link": { "rotulo": "Nossa história", "href": "/sobre/" }
}
```
`texto`, `imagem` (e a `legenda` dela), `rotulo`, `link` e `tema` são opcionais.

### Páginas, rodapé e ícones

| Campo | O que faz |
|---|---|
| `projetos.rotuloNumero` | rótulo do número no topo da página do projeto (padrão: `prefixoNumero`), ex.: `"Nº de registro"` |
| `projetos.contarImagens: true` | mostra na ficha lateral do projeto quantas imagens ele tem |
| `noticias.formatoData: "longo"` | datas por extenso: "8 de maio de 2026" (padrão `"curto"`: "08 mai 2026") |
| `noticias.capaInteira: true` | a capa da notícia aparece inteira, sem corte (cartazes, convites com texto) |
| `rodape.colunas` | `{ "contato": "Fale com a gente", "registro": "Acervo", "itens": "obras" }` — títulos das colunas do rodapé (padrão: Contato, Registro) e o nome dos itens contados (padrão: o título da coleção) |
| `rodape.logo` | `{ "src", "alt", "largura", "altura" }` — logotipo no rodapé (versão para fundo escuro) |
| `naoEncontrada.link2` | `{ "rotulo": "Ver notícias", "href": "/noticias/" }` — segundo botão na página 404 |
| `icones` | `{ "icon": [{ "src": "/img/icone-32.png", "tamanho": "32x32" }, …], "apple": "/img/apple-touch-icon.png" }` — ícones da aba em PNG (sem isso, `/img/favicon.svg`) |

A meta description das páginas, projetos e notícias é cortada sozinha em ~155
caracteres, no fim de uma palavra.

## `redirects.json`

`{ "redirects": { "/antigo/": "/novo/" } }`. Curinga no fim, depois de uma barra, no
formato do Netlify/Cloudflare: `"/news/*": "/noticias/:splat"` (mantém o resto do
endereço) ou `"/categoria/*": "/noticias/"` (tudo para uma página). O
`scripts/gerar-redirects.mjs` escreve a versão da Vercel (`/news/:splat*`) no
`vercel.json` e preserva as outras chaves dele (ex.: `"git"`); o `npm run checar` conta
as URLs antigas cobertas pelo curinga.
