---
name: revisar
description: Controle de qualidade do site reconstruído antes de mostrar ao cliente (build, checagem automática, revisão independente por agente, pendências). Use quando o usuário pedir para revisar, conferir, testar ou aprovar o site.
---

# /revisar — controle de qualidade

## 1. Checagem automática
1. `npm run build` — tem que passar sem erro.
2. `npm run checar` — leia `relatorio-qa.md`.
   *Sem `node_modules/` (nuvem sem npm):* peça ao usuário o resultado da última execução
   na aba **Actions** do GitHub (o relatório aparece no resumo da execução) ou o erro da
   Vercel, e trabalhe a partir dele.
3. Corrija todos os **erros**. Para cada **aviso**, corrija ou justifique em `PENDENCIAS.md`.

## 2. Revisão independente
Chame o agente **revisor-qa** (ele não participou da construção, então enxerga o que
passou batido). Passe para ele apenas: "Revise este site conforme suas instruções".
Aplique as correções que ele apontar como **bloqueantes**; as demais, avalie.

## 3. Checagens manuais sugeridas ao usuário
Liste no final, para o humano fazer (não dá para automatizar 100%):
- PageSpeed Insights (https://pagespeed.web.dev) no link de prévia — meta 90+ em tudo;
- testar o formulário e o botão de WhatsApp no celular de verdade;
- ler os textos da home em voz alta (se soar estranho, está estranho).

## 4. Fechamento
- Rode `npm run build && npm run checar` de novo até sair sem erros (ou confira o Actions).
- Atualize `cliente.json → "status": "revisado"`.
- `git add -A && git commit -m "Revisão de qualidade" && git push`
- Entregue um resumo: status do QA, o que foi corrigido, pendências do cliente
  (conteúdo de `PENDENCIAS.md`) e próximo passo (publicar a prévia e enviar ao cliente).
