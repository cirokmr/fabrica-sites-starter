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
