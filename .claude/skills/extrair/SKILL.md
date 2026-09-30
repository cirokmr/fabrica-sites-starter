---
name: extrair
description: Captura um site antigo (textos, imagens, screenshots, cores, contatos e todas as URLs) para a pasta extraido/. Use quando o usuário pedir para extrair, capturar ou baixar o site antigo de um cliente, ou rodar /extrair com uma URL.
---

# /extrair — captura do site antigo

URL recebida: $ARGUMENTS

## Passos

1. **Descubra a URL.** Se `$ARGUMENTS` estiver vazio, use `site_antigo` de `cliente.json`.
   Se também estiver vazio, pergunte a URL ao usuário.
2. **Escolha onde extrair.** Teste se este ambiente acessa a internet:
   `curl -s -o /dev/null -m 10 -w "%{http_code}" <URL>`
   - **Respondeu 200/301/302 → extração aqui mesmo:**
     `node scripts/extrair.mjs <URL>` e depois `node scripts/otimizar-imagens.mjs`.
     (Se faltar o navegador: `npx playwright install chromium`.)
     Se o relatório disser que ficaram URLs não visitadas, rode de novo com `--max 150`.
   - **Respondeu 000/erro (nuvem sem internet) → extração pelo GitHub Actions.**
     a) Garanta que o branch atual existe no GitHub (`git push -u origin HEAD`).
     b) Tente disparar você mesmo (dono/repo vêm de `git remote get-url origin`):
     ```bash
     curl -sS -X POST -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" \
       https://api.github.com/repos/<dono>/<repo>/actions/workflows/extrair.yml/dispatches \
       -d '{"ref":"<branch atual>","inputs":{"url":"<URL>","max_paginas":"60"}}' -w "%{http_code}"
     ```
     `204` = disparou. Acompanhe a cada 15 s em
     `https://api.github.com/repos/<dono>/<repo>/actions/workflows/extrair.yml/runs?per_page=1`
     até `"status": "completed"`. Se `"conclusion": "success"`, rode `git pull` e siga.
     c) Se não conseguir disparar (qualquer código diferente de 204), peça ao usuário,
     com estas palavras:
     > No GitHub, abra este repositório → aba **Actions** → **Extrair site antigo** →
     > **Run workflow** → cole `<URL>` → **Run workflow**. Leva de 2 a 5 minutos.
     > Quando aparecer o ✅ verde, me avise.
     Quando ele avisar: `git pull` e siga para o passo 3.
     Se deu ❌, peça o print/erro da execução.
3. **Confira se veio tudo:** devem existir `extraido/RELATORIO.md`, `extraido/paginas/`,
   `extraido/screenshots/` e `extraido/imagens-web/`.
4. **Leia `extraido/RELATORIO.md`** e confira com os seus olhos:
   - Abra 2 ou 3 prints em `extraido/screenshots/` (inclusive `home-celular.jpg`).
   - Abra 2 ou 3 arquivos de `extraido/paginas/` e veja se o texto veio limpo.
   - Veja se o logo foi identificado e se os contatos fazem sentido.
5. **Ficha do cliente.** Se `cliente.json` não existir (repositório criado pelo template
   do GitHub), crie-o:
   ```json
   { "cliente": "<nome do repositório>", "site_antigo": "<URL>", "criado_em": "<AAAA-MM-DD>", "status": "extraido", "observacoes": "" }
   ```
   Se existir, atualize `"status": "extraido"` e `site_antigo` (a extração pelo GitHub já faz isso).
   *A partir daqui o checador trata o repositório como cliente: texto de exemplo vira erro.*
6. **Responda ao usuário** com um resumo curto:
   - quantas páginas, imagens e documentos;
   - problemas encontrados (páginas quebradas, texto vazio, logo não achado);
   - estrutura sugerida para o site novo (quais páginas manter, juntar ou virar seção da home);
   - próximo passo: `/direcao-de-arte` (a proposta visual, antes de construir).
7. **Salve no GitHub** (se extraiu aqui ou mudou algo):
   `git add -A && git commit -m "Extração do site antigo" && git push`
   (só as imagens originais ficam fora do Git; textos, prints e imagens-web vão).

## Arquivos avulsos (PDFs, capas originais, miniaturas de vídeo)
A extração não baixa tudo: PDFs de publicações, a imagem original de uma capa, a
miniatura de um vídeo. Monte uma lista JSON (ex.: `extraido/baixar.json`) e rode o mesmo
workflow com o campo **`lista`** (a `url` pode ficar vazia — aí ele só baixa a lista):
```json
[
  { "url": "https://site/arquivo.pdf", "destino": "public/arquivos/arquivo.pdf" },
  { "url": "https://site/foto.jpg", "destino": "public/img/noticias/foto.webp", "largura": 1600, "maxKB": 300 },
  { "url": "https://site/original.jpg", "alternativa": "https://site/original-1024x768.jpg", "destino": "public/img/capa.webp" }
]
```
```bash
curl -sS -X POST -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" \
  https://api.github.com/repos/<dono>/<repo>/actions/workflows/extrair.yml/dispatches \
  -d '{"ref":"<branch>","inputs":{"url":"","lista":"extraido/baixar.json"}}' -w "%{http_code}"
```
- Destino `.webp` → convertido com sharp (`largura`/`altura` máximas; a qualidade cai até
  caber em `maxKB`, padrão 300). Outros destinos → gravados como vieram.
- `alternativa`: URL de reserva se a primeira falhar (ex.: a cópia redimensionada do WordPress).
- PDF acima de `maxMB` (padrão 15) → comprimido com Ghostscript; `"dpi": 110` reduz mais
  as imagens do PDF. Arquivos que já existem são pulados (pode rodar de novo).
- Downloads em paralelo; o resultado (tamanhos, erros) sai em `<lista>.resultado.json`.
  O workflow faz commit de `extraido/` e `public/` — depois, `git pull`.
- Localmente, com internet: `node scripts/baixar-arquivos.mjs extraido/baixar.json`.

## Não faça
- Não edite nada em `src/` nesta etapa.
- Não extraia sites de quem não é cliente (o dono precisa ter autorizado).
