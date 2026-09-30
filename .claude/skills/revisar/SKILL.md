---
name: revisar
description: Controle de qualidade do site reconstruído antes de mostrar ao cliente (workflow Qualidade, prints de desktop e celular, revisão independente pelo agente revisor-qa, pendências). Use quando o usuário pedir para revisar, conferir, testar ou aprovar o site.
---

# /revisar — controle de qualidade

## 1. Automático
1. Último workflow **Qualidade** do branch: tem que estar ✅. Leia a anotação
   "Relatório de qualidade" (check-run annotations) — é o `relatorio-qa.md`.
   (Com npm local: `npm run build && npm run checar`.)
2. Corrija todos os **erros**. Para cada **aviso**, corrija ou justifique em `PENDENCIAS.md`.

## 2. Visual
Dispare o workflow **Prints**, baixe (`git fetch origin prints`) e confira com os olhos
(para ver páginas que não entram sozinhas — uma notícia com tabela, a estante de
publicações —, use o campo `rotas`: `"rotas": "/noticias/x/,/publicacoes/"`):
- abertura e rolagens da home (o hero expande? a coleção corre na horizontal? nada
  some ou fica por cima de outra coisa?);
- **todas** as páginas no celular (texto cortado, palavra gigante saindo da tela,
  botão fora do lugar);
- contraste do texto sobre as fotos e sobre a cor de destaque;
- tabelas no celular (rolam na horizontal, sem cortar números) e âncoras (`/pagina/#id`).

## 3. Revisão independente
Chame o agente **revisor-qa** (ele não participou da construção). Passe apenas:
"Revise este site conforme suas instruções. Os prints estão em <pasta>."
Aplique os **bloqueantes**; avalie as melhorias.

## 4. Checagens para o humano (liste no final)
- PageSpeed Insights (https://pagespeed.web.dev) no link de prévia — meta 90+;
- abrir no celular de verdade: menu, WhatsApp, telefone, formulário (a 1ª mensagem do
  Formsubmit pede ativação por e-mail);
- ler os textos da home em voz alta.

## 5. Fechamento
- Tudo verde de novo depois das correções (Qualidade + Prints revisados).
- `cliente.json → "status": "revisado"`, commit e push.
- Resumo: status do QA, o que foi corrigido, pendências do cliente (`PENDENCIAS.md`),
  próximo passo (mandar o link de prévia ao cliente).
