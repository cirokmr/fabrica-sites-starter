# Fábrica de Sites — molde (starter)

Molde para **reconstruir sites antigos** em um padrão moderno (Astro + Tailwind), rápido
e sempre do mesmo jeito. Cada cliente novo nasce de uma cópia deste repositório.

```
site antigo ──/extrair──▶ extraido/ ──/reconstruir──▶ site novo ──/revisar──▶ prévia (Vercel) ──▶ cliente aprova ──▶ domínio
```

**Tudo roda na nuvem. Você não precisa instalar nada no seu computador.**

| Peça | Papel |
|---|---|
| **GitHub** | Guarda o molde e um repositório por cliente (nada se perde) |
| **Claude Code (nuvem)** | Faz o trabalho: extrai, reconstrói, revisa e salva no GitHub |
| **GitHub Actions** | Compila e roda o controle de qualidade a cada envio (aba *Actions*) |
| **Vercel** | Publica cada versão num link de prévia para você e o cliente verem |

---

## 1. Configuração inicial (uma vez só)

1. **Transforme este repositório em template:** no GitHub, *Settings → General* →
   marque **Template repository**.
2. **Crie uma conta na Vercel** (https://vercel.com, entre com o GitHub, plano Hobby é grátis
   para começar) → *Add New… → Project* → importe `fabrica-sites-starter` → **Deploy**.
   A Vercel detecta Astro sozinha. Em ~1 minuto você vê a "Empresa Exemplo" no ar.
3. Pronto. Esse link é a prova de que o molde funciona.

---

## 2. Fluxo de um cliente

### a) Criar o repositório do cliente
No GitHub, abra este repositório → botão verde **Use this template → Create a new repository**
→ nome do cliente (ex.: `site-padaria-do-joao`) → **Private** → *Create*.

### b) Trabalhar com o Claude Code na nuvem
Abra uma sessão do Claude Code no repositório do cliente e rode **uma etapa de cada vez**,
conferindo o resultado de cada uma:

| Comando | O que faz | O que você confere |
|---|---|---|
| `/extrair https://siteantigo.com.br` | Captura textos, imagens, prints, cores, contatos e URLs | O resumo que o Claude te dá e `extraido/RELATORIO.md` |
| `/reconstruir` | Monta o site novo com o conteúdo extraído | O link de prévia da Vercel, no celular e no computador |
| `/revisar` | Checagem automática + agente revisor independente | `relatorio-qa.md` e `PENDENCIAS.md` |

Ao fim de cada etapa o Claude salva (commit + push) no GitHub.

### c) Publicar
1. Na Vercel: *Add New… → Project* → importe o repositório do cliente → **Deploy**.
2. Cada envio para o GitHub gera um **link de prévia** → mande ao cliente.
3. Aprovado: *Settings → Domains* na Vercel → adicione o domínio do cliente e siga as
   instruções de DNS que ela mostra.
4. Depois de publicar: envie o sitemap (`/sitemap-index.xml`) no Google Search Console.

---

## 3. O que tem aqui dentro

```
CLAUDE.md                  ← regras da fábrica (o Claude lê em toda sessão)
.claude/
├── settings.json          ← comandos liberados + hook que confere o build
├── skills/                ← /extrair, /reconstruir, /revisar
└── agents/revisor-qa.md   ← inspetor de qualidade independente
.github/workflows/         ← controle de qualidade automático a cada envio
src/
├── data/site.json         ← TODO o conteúdo do cliente (textos, contatos, SEO)
├── styles/global.css      ← cores e fontes da marca (bloco @theme)
├── components/            ← Header, Footer, Hero, Servicos, Sobre, Depoimentos, FAQ, CTA, Contato, BotaoWhatsApp
├── layouts/Layout.astro   ← SEO, Open Graph, dados estruturados (Schema.org)
└── pages/                 ← index, sobre, contato, 404
scripts/
├── extrair.mjs            ← extrator do site antigo (Playwright)
├── otimizar-imagens.mjs   ← converte imagens para WebP
├── checar.mjs             ← controle de qualidade do build
├── gerar-redirects.mjs    ← redirects.json → 301 na Vercel/Netlify/Cloudflare
├── hook-build.mjs         ← confere o build ao fim de cada tarefa do Claude
├── novo-cliente.mjs       ← (modo local) cria pasta de cliente a partir do molde
└── lote.mjs               ← (avançado) produção em lote
redirects.json             ← URLs antigas → novas (preserva o Google do cliente)
docs/                      ← checklist de entrega e planilha de controle
```

**Ideia central:** o layout (componentes) é fixo e testado; o que muda por cliente é só
`site.json` (conteúdo), `global.css` (cores/fontes) e `public/imagens`. Por isso é rápido.

## 4. Como saber se está tudo certo

- **Aba Actions do GitHub:** ✅ verde = compilou e passou na checagem. ❌ vermelho = clique
  para ver o relatório (erros listados no resumo da execução).
- **Vercel:** cada envio mostra *Ready* (no ar) ou *Error* (o log mostra o motivo).
- Em qualquer erro, copie a mensagem e peça ao Claude: "corrija este erro: …".

> No próprio molde, o checador ignora os textos "Empresa Exemplo". Num repositório de
> cliente (com `cliente.json`), sobra de texto do molde é **erro**.

## 5. Evolução da fábrica

1. **Agora:** faça 2–3 sites no fluxo acima. Anote em `docs/controle-fabrica.csv` o tempo
   de cada etapa e o que você precisou corrigir na mão.
2. **Toda correção repetida vira regra** no `CLAUDE.md` ou melhoria em uma skill/componente
   **aqui no molde** (não só no cliente). Os próximos clientes já nascem melhores.
3. **Quando o fluxo estiver previsível:** automatize a produção em lote (`scripts/lote.mjs`)
   ou com tarefas agendadas. A revisão humana continua obrigatória.

---

<details>
<summary><b>Opcional: trabalhar no seu computador</b></summary>

Só se um dia quiser ver alterações instantaneamente, sem esperar a Vercel. Precisa de
Node.js 20+ (https://nodejs.org) e Git.

```bash
git clone https://github.com/SEU-USUARIO/site-do-cliente
cd site-do-cliente
npm install
npm run navegador      # baixa o navegador do extrator (uma vez)
npm run dev            # http://localhost:4321
```

| Comando | Para quê |
|---|---|
| `npm run dev` | Ver o site enquanto edita |
| `npm run build` | Gerar o site final em `dist/` |
| `npm run extrair -- URL [--max 100]` | Capturar site antigo |
| `npm run imagens` | Converter imagens extraídas para WebP |
| `npm run checar` | Controle de qualidade (depois do build) |
| `npm run redirects` | Regerar `vercel.json` e `public/_redirects` |
</details>
