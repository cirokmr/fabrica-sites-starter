# Fábrica — produção em um clique

Depois de uma venda, o dono clica **Fábrica → Novo site (venda)** no Tombo CMS e a fábrica
faz o resto. A única pausa é a **aprovação da direção de arte**, também pelo painel.

```
Tombo CMS (dono)            GitHub                                    sessão agendada do Claude
─────────────────           ─────────────────────────────────         ─────────────────────────
"Criar site"  ───────────▶  site-<slug> (deste molde, privado)
                            + segredos CLOUDFLARE_* do Actions
              ───────────▶  tombo-prospeccao: fabrica/pedidos/<slug>.json  ◀── lê a fila, 4x por dia
                            (a fila; CRM: lead → "Fechou")                    extrai → direção de arte
linha do tempo  ◀──────────  pedido.json (etapa, proposta, erros)  ◀──────  grava a proposta e PARA
"Aprovar" / "Pedir ajuste" ─▶ pedido.json (direcao.status)          ──────▶  monta → revisa → libera
e-mails (Resend) ◀── workflow "Avisar o painel" (a cada mudança na fila)     Publicar (Cloudflare)
convite ao cliente quando "publicado"                                        https://<slug>.tomboprodutora.com
```

O roteiro da sessão (passo a passo, idempotente) está no repositório **`tombo-prospeccao`**:
`FABRICA.md` e a skill `/fabrica`. Aqui, no molde, ficam as peças que todo site usa.

## Peças do molde

| Peça | Papel |
|---|---|
| `cliente.json → publicacao` | onde e quando publicar (abaixo) |
| `wrangler.jsonc` | opções comuns do Worker (pasta `out/`, página 404, sem `*.workers.dev`) |
| `scripts/publicar.mjs` | monta a configuração do Worker a partir da ficha; confere o site (no ar ou a cópia compilada); autoteste |
| `.github/workflows/publicar.yml` | a cada push na `main` (inclusive as gravações do Tombo CMS): compila, confere, publica e confere no ar |
| `src/app/prancha/` + `conteudo/prancha.json` | a prancha da direção de arte, fotografada pelo **Prints** (`rotas: "/prancha/"`) |

### A ficha (`cliente.json`) de um site da fábrica

```json
{
  "cliente": "Clínica Bem Viver",
  "site_antigo": "https://clinicabemviver.com.br/",
  "criado_em": "2026-10-02",
  "status": "criado",
  "observacoes": "",
  "fabrica": { "pedido": "clinica-bem-viver", "amostra": "clinica-bem-viver" },
  "publicacao": {
    "plataforma": "cloudflare",
    "worker": "site-clinica-bem-viver",
    "dominios": ["clinica-bem-viver.tomboprodutora.com"],
    "liberada": false
  }
}
```

- `status` segue o fluxo de sempre: `criado → extraido → direcao → direcao-aprovada →
  reconstruido → revisado → publicado`.
- `fabrica.pedido` = o arquivo `fabrica/pedidos/<pedido>.json` da fila; `fabrica.amostra` =
  a prévia de prospecção que serviu de ponto de partida (branch `amostra/<slug>` de
  `tombo-amostras`), se houver.
- `publicacao.liberada` começa **false**: enquanto o site está em produção, o **Publicar**
  só avisa ("o site ainda está em produção") e não põe nada no ar. A fábrica muda para
  **true** depois da revisão — dali em diante, todo push na `main` publica.
- Sem `publicacao` (o próprio molde e os sites antigos da Vercel), o **Publicar** termina
  sem publicar nada. Nada muda para Cemear, Vianei e Ecoserra.

## Publicação na Cloudflare

Cada site é um **Worker só de arquivos estáticos** (grátis, uso comercial permitido), com o
domínio próprio `<slug>.tomboprodutora.com` (rota `custom_domain`: a Cloudflare cria o DNS e
o certificado sozinha; a zona `tomboprodutora.com` já está na conta da Tombo). O Worker se
chama `site-<slug>`. `public/_redirects` (gerado de `redirects.json`) e `public/_headers`
valem como na Cloudflare Pages.

O workflow **Publicar**:
1. lê a ficha (`node scripts/publicar.mjs config`) — sem ficha ou não liberado: pula (✅);
2. compila (`npm run build`) e confere a cópia compilada servida localmente
   (`verificar --dir out`: home, cada arquivo que ela cita e o 404);
3. publica com `npx wrangler@4 deploy` usando os segredos `CLOUDFLARE_API_TOKEN` e
   `CLOUDFLARE_ACCOUNT_ID` do repositório (gravados pelo Tombo CMS na criação). Sem os
   segredos: `::warning:: Site NÃO publicado` (a fábrica anota a pendência no pedido);
4. confere **no ar** (`verificar --url https://<domínio>`): na primeira publicação o
   certificado leva alguns minutos, então tenta por até ~10 minutos.
Erros viram anotações legíveis pela API (`check-runs/<id>/annotations`), como no Qualidade.

**Token da Cloudflare** (o mesmo das prévias serve — `tombo-amostras/docs/PREVIA.md`, "Ligar a
publicação"): modelo *Edit Cloudflare Workers* + **Zone → DNS → Edit**, conta da Tombo,
zona `tomboprodutora.com`. O dono guarda o token e o Account ID
(`f17940cbbf7689b147ffce0396d5bb2b`) nas variáveis `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ACCOUNT_ID` do Tombo CMS na Vercel; o painel copia os dois para cada repositório
novo. Repositório criado antes de configurar? Na linha do tempo do pedido, **Gravar os
segredos de novo**.

## Ligar o domínio do cliente (depois, à mão)

O site nasce em `https://<slug>.tomboprodutora.com`. Para usar o domínio do cliente (ex.:
`clinicabemviver.com.br`) — o painel mostra este roteiro na página do pedido publicado:

> ⚠️ **Não mexa nos registros de e-mail do cliente.** O e-mail dele (`@clinicabemviver.com.br`)
> depende de registros no mesmo DNS: **MX**, **TXT** (SPF `v=spf1…`, DMARC em `_dmarc`,
> verificações do Google/Microsoft), **DKIM** (`…._domainkey`) e às vezes **CNAMEs** como
> `autodiscover`. Ao levar o DNS para a Cloudflare eles precisam ir **iguais**, e depois
> ninguém apaga nem altera nenhum deles. Se um registro faltar ou mudar, o cliente para de
> receber e-mail sem nenhum aviso. O site só precisa do nome raiz e do `www`.

1. **DNS do domínio na Cloudflare** (necessário para o Worker responder nele): Cloudflare →
   **Add a domain** → `clinicabemviver.com.br` → plano Free. A Cloudflare importa os registros
   que encontra. **Antes de continuar**, compare a lista dela com a do DNS atual (Registro.br
   ou onde estiver) e acrescente à mão o que faltar, principalmente os registros de e-mail do
   aviso acima. Na dúvida, peça ao cliente (ou a quem cuida do e-mail dele) a lista dos
   registros. Só então pegue os **dois nameservers** que a Cloudflare mostra. No Registro.br
   (ou onde o domínio foi comprado) → o domínio → **DNS** → **Alterar servidores DNS** → cole
   os dois → Salvar. Leva de minutos a algumas horas; espere o domínio ficar **Active** na
   Cloudflare. Depois, mande um e-mail de teste para um endereço do cliente e confira se chegou.
2. No repositório do site, `cliente.json → publicacao.dominios`: acrescente
   `"clinicabemviver.com.br"` e `"www.clinicabemviver.com.br"` **depois** do endereço da Tombo
   (o 1º continua sendo o conferido). Commit na `main` → o **Publicar** liga os domínios.
   Se ele acusar que o nome já tem registro, apague na Cloudflare **só** os registros A, AAAA
   ou CNAME do nome raiz e do `www` (eram do site antigo) e rode de novo. MX, TXT e os outros
   nomes ficam como estão.
3. `conteudo/site.json → url` = `https://clinicabemviver.com.br` (sitemap, robots, links de
   compartilhamento) e, no Tombo CMS, **Sites → o site → Endereço público do site** = o mesmo
   (o formulário de contato passa a aceitar envios dele).
4. Google Search Console: adicione o domínio e envie `/sitemap.xml`.

## A fábrica nas skills (modo automático)

As skills de sempre valem, com estas diferenças quando há um pedido da fila:
- **/extrair**: disparado pela sessão; `max_paginas` 60.
- **Amostra** (se o pedido tem `amostra`): o ponto de partida é o branch `amostra/<slug>` de
  `tombo-amostras` — tema (`src/styles/tema.css`), fontes (imports em `src/app/layout.tsx` e
  pacotes no `package.json`), imagens usadas, `favicon.svg`/`og.jpg`, as seções da home do
  `site.json` (sem o bloco `previa` e com o menu trocado por páginas de verdade) e o
  `DIRECAO.md` (vira a base do novo). O site inteiro continua sendo extraído e construído.
- **/direcao-de-arte**: em vez de perguntar no chat, a sessão monta a prancha
  (`conteudo/prancha.json` + o tema), fotografa (`Prints`, `rotas: "/prancha/"`), copia as
  imagens para o branch `prints`, pasta `direcao/r<rodada>/`, grava a proposta no pedido
  (conceito, paleta, fontes, imagens, commit do `DIRECAO.md`) e **para**. Proposta baseada
  na amostra diz isso no começo do `DIRECAO.md` ("a partir da prévia aprovada pelo cliente").
  "Pedir ajuste" volta com o comentário do dono: a próxima rodada aplica o ajuste.
- **/reconstruir** e **/revisar**: iguais; `site.json → url` = `https://<slug>.tomboprodutora.com`.
- **Publicar**: `publicacao.liberada = true` + push; a sessão espera o **Publicar** ✅ e
  anota no pedido `publicado: { url, em }` — o painel manda o convite ao cliente.
- Sem **/proposta** (o cliente já comprou).

## Decisões (e por quê)

- **Cloudflare, não Vercel**, para os sites novos: grátis com uso comercial, sem limite
  diário de deploys, mesma conta e mesmo padrão das prévias e do site do Tombô. Os antigos
  ficam na Vercel (nada quebra).
- **Domínio `<slug>.tomboprodutora.com`** já no primeiro dia: o cliente vê o site no ar sem
  depender de DNS; o domínio dele entra depois, à mão (roteiro acima).
- **Publicar só com `liberada: true`**: o repositório nasce com o conteúdo de exemplo do
  molde; nada vai ao ar antes da revisão.
- **Configuração gerada a cada publicação** (`wrangler.publicar.json`, fora do Git): nome e
  domínios moram só na ficha — uma fonte só, que a fábrica e o dono editam.
