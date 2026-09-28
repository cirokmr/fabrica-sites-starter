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

Imagens em blocos HTML: sempre `alt="…"` e `loading="lazy"`.
Todos os blocos animam sozinhos ao entrar na tela.
