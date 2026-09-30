# Blocos especiais da prosa

Dentro de qualquer `.md` em `conteudo/`, linhas que começam com `<` são HTML e passam
direto. Estes blocos já têm estilo pronto (em `src/styles/pages.css`):

| Bloco | Para quê | HTML |
|---|---|---|
| Capítulo numerado | dividir textos longos | `<h2 class="chapter"><span>01</span>Título</h2>` |
| Subcapítulo | nível abaixo | `<h3 class="chapter chapter--sub"><span>1.1</span>Título</h3>` |
| Frase em destaque | citação/pull quote | `<p class="pull">Frase marcante.</p>` |
| Abertura | 1º parágrafo maior | `<p class="lead">Texto…</p>` |
| Nota | crédito, fonte, observação | `<p class="note">Fotos: Fulano</p>` |
| Galeria uniforme (3 colunas) | fotos do mesmo tema | `<div class="grid"><figure><img …/></figure>…</div>` (`grid--2`, `grid--square`, `grid--wide`) |
| Foto única larga | destaque | `<figure class="plate plate--wide"><img …/><figcaption>…</figcaption></figure>` |
| Pessoas / equipe | nomes + funções | `<div class="people"><p><strong>Nome</strong>Função</p>…</div>` |
| Ficha técnica | dados curtos | `<dl class="facts"><dt>Ano</dt><dd>2012</dd>…</dl>` |
| Etapas / metas | lista numerada rica | `<ol class="steps"><li><h3><small>Etapa 1</small>Título</h3><ul><li>…</li></ul></li></ol>` |
| Trabalhos alternados | obra + texto, lado a lado | `<div class="works"><article class="work"><figure class="work__media"><img …/></figure><div class="work__text">…</div></article>…</div>` |
| Recorte de imprensa | clipping emoldurado | `<figure class="clip"><img …/></figure>` |
| Links em linha | lista de links | `<p class="links"><a …>…</a> <a …>…</a></p>` |
| Estante (publicações) | capa + data + título + botão de download | `<div class="covers"><article class="cover" id="slug"><a class="cover__media" href="x.pdf"><img …/></a><p class="cover__meta">Agosto de 2025 · Autor</p><h3 class="cover__title">Título</h3><a class="cover__link" href="x.pdf">Baixar PDF</a></article>…</div>` |
| Estante de vídeos | miniatura 16:9 + título + link | `<div class="covers covers--video"><article class="cover">…</article></div>` (mesma estrutura; `cover__nota` para "citado em…") |
| Tabela | dados em linhas e colunas | Markdown: `| Ano | Projetos |` / `|---|---:|` / `| 2024 | 21 |` — ou HTML: `<div class="tabela"><table>…</table></div>` (rola na horizontal no celular; números à direita) |
| Faixa de logotipos | imagem larga e baixa (apoiadores) | `<figure class="logos"><img …/></figure>` (no celular rola na horizontal, legível) |
| Vídeo incorporado | YouTube/Vimeo no texto | `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/ID" title="…" loading="lazy" allowfullscreen></iframe></div>` |
| Âncora | link direto a um trecho | qualquer bloco com `id="nome"` (ex.: `<h2 class="chapter" id="nome">`); o link `/pagina/#nome` rola até ele |

Imagens em blocos HTML: sempre `alt="…"` e `loading="lazy"`.
Todos os blocos animam sozinhos ao entrar na tela.

## Estante (`.covers`)

É o jeito de manter **publicações, vídeos, materiais para baixar** numa página comum
(editável pelo CMS): cada item é um `<article class="cover">`. O `id` do item permite
redirecionar endereços antigos para ele (`/publicacoes/#slug`).

```html
<div class="covers">
<article class="cover" id="guia-de-campo">
<a class="cover__media" href="/arquivos/guia-de-campo.pdf"><img src="/img/publicacoes/guia-de-campo.webp" alt="Capa do Guia de campo" loading="lazy" /></a>
<p class="cover__meta">Agosto de 2025 · Autor</p>
<h3 class="cover__title">Guia de campo</h3>
<a class="cover__link" href="/arquivos/guia-de-campo.pdf">Baixar PDF</a>
</article>
</div>
```

- `cover__media` e `cover__link` podem ser `<a>` (clicáveis) ou só `<div>`/omitidos.
- O link ganha "↓" (download); com `target="_blank"` ganha "↗" (fora do site).
- `covers--video`: miniaturas 16:9 (vídeos). `<p class="cover__nota">…</p>` para uma
  observação curta abaixo do título.
- Página que é só uma estante (sem ficha lateral) usa a largura toda.

## Tabela

Em Markdown, no formato do GitHub (a linha de traços separa o cabeçalho; `:` alinha):

```markdown
| Ano | Projetos | Pessoas atendidas |
|---|---:|---:|
| 2023 | 18 | 2.450 |
| 2024 | 21 | 3.100 |
```

Vira `<div class="tabela"><table><thead>…</thead><tbody>…</tbody></table></div>`. Sem a
linha de traços, a tabela sai sem cabeçalho. Células só com números (e `.`, `,`, `%`,
`()`, `+`, `-`) ganham `class="num"`: alinhadas à direita, em algarismos tabulares.
Tabelas complexas (células mescladas, legenda): escreva o HTML dentro do mesmo
`<div class="tabela">` — `<caption>`, `<th>` e `class="num"` já têm estilo.

## Âncoras

Links para `#nome` (na mesma página) ou `/pagina/#nome` (de outra) rolam até o bloco com
aquele `id` mesmo com a rolagem suave ligada, e o bloco não fica escondido atrás do menu.
