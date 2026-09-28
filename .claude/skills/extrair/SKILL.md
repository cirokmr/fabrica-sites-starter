---
name: extrair
description: Captura um site antigo (textos, imagens, screenshots, cores, contatos e todas as URLs) para a pasta extraido/. Use quando o usuário pedir para extrair, capturar ou baixar o site antigo de um cliente, ou rodar /extrair com uma URL.
---

# /extrair — captura do site antigo

URL recebida: $ARGUMENTS

## Passos

1. **Descubra a URL.** Se `$ARGUMENTS` estiver vazio, use `site_antigo` de `cliente.json`.
   Se também estiver vazio, pergunte a URL ao usuário.
2. **Confira a instalação.** Se não existir `node_modules/`, tente `npm install`.
   Se falhar (comum na nuvem), siga assim mesmo: o extrator usa o Playwright do ambiente.
   Se o erro for "navegador não instalado", rode `npx playwright install chromium`.
3. **Rode a extração:** `node scripts/extrair.mjs <URL>`
   - Se o relatório disser que ficaram URLs não visitadas, rode de novo com `--max 150`.
   - Se o site bloquear ou der timeout, tente a URL com/sem `www` e com/sem `https`.
4. **Leia `extraido/RELATORIO.md`** e confira com os seus olhos:
   - Abra 2 ou 3 screenshots em `extraido/screenshots/` (inclusive `home-celular.png`).
   - Abra 2 ou 3 arquivos de `extraido/paginas/` e veja se o texto veio limpo.
   - Veja se o logo foi identificado e se os contatos fazem sentido.
5. **Ficha do cliente.** Se `cliente.json` não existir (repositório criado pelo template
   do GitHub), crie-o:
   ```json
   { "cliente": "<nome do repositório>", "site_antigo": "<URL>", "criado_em": "<AAAA-MM-DD>", "status": "extraido", "observacoes": "" }
   ```
   Se existir, atualize `"status": "extraido"` e `site_antigo`.
   *A partir daqui o checador trata o repositório como cliente: texto de exemplo vira erro.*
6. **Responda ao usuário** com um resumo curto:
   - quantas páginas, imagens e documentos;
   - problemas encontrados (páginas quebradas, texto vazio, logo não achado);
   - estrutura sugerida para o site novo (quais páginas manter, juntar ou virar seção da home);
   - próximo passo: `/reconstruir`.
7. **Salve no GitHub:** `git add -A && git commit -m "Extração do site antigo" && git push`
   (os prints e imagens originais ficam fora do Git de propósito; os textos vão).

## Não faça
- Não edite nada em `src/` nesta etapa.
- Não extraia sites de quem não é cliente (o dono precisa ter autorizado).
