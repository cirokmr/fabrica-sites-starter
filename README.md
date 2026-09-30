# Fábrica de Sites — molde

Molde para **reconstruir sites antigos** com direção de arte própria e acabamento de
estúdio: tipografia editorial, rolagem suave, seções que "prendem" a tela, transições
entre páginas — o mesmo motor do site do Tombô, pronto para qualquer cliente.

```
site antigo ─/extrair─▶ extraido/ ─/direcao-de-arte─▶ DIRECAO.md (você aprova) ─/reconstruir─▶ site ─/revisar─▶ prévia ─▶ cliente
```

**Tudo roda na nuvem — nada para instalar no seu computador.**

| Peça | Papel |
|---|---|
| **GitHub** | Guarda o molde e um repositório por cliente |
| **Claude Code (nuvem)** | Extrai, propõe a direção de arte, monta, revisa e salva |
| **GitHub Actions** | *Extrair site antigo*, *Qualidade* (build + checagem a cada envio) e *Prints* (fotos do site) |
| **Vercel** | Publica cada versão num link de prévia |

---

## Fluxo de um cliente

1. **Criar o repositório:** neste molde, botão **Use this template → Create a new
   repository** → `site-nomedocliente` → **Private**.
2. **Conectar à Vercel:** *Add New… → Project* → importe o repositório → **Deploy**.
3. **No Claude Code, uma etapa por vez:**

| Comando | O que acontece | Sua parte |
|---|---|---|
| `/extrair https://siteantigo…` | O GitHub captura textos, fotos, prints, cores, contatos e URLs | Ler o resumo |
| `/direcao-de-arte` | Proposta de conceito, paleta, fontes e seções, com uma prancha visual | **Aprovar ou ajustar** |
| `/reconstruir` | Site montado, compilado e fotografado (desktop e celular) | Abrir o link de prévia |
| `/revisar` | Checagem automática + inspetor independente | Testar no celular |

4. **Publicar:** aprovado pelo cliente → *Settings → Domains* na Vercel → domínio dele.
   Depois, envie `/sitemap.xml` no Google Search Console.

---

## Onde fica cada coisa

```
conteudo/                ← TUDO que muda por cliente (textos e dados)
├── site.json            nome, contatos, menu, seções da home, rodapé, SEO
├── paginas/*.md         páginas institucionais  → /sobre/, /historia/…
├── projetos/*.md        coleção numerada        → /projetos/<nome>/
└── noticias/*.md        notícias                → /noticias/<nome>/
src/styles/tema.css      ← cores, fontes e proporções do cliente
public/img/              ← imagens do site
src/lib/                 motor de movimento (GSAP) — igual para todos
src/components/secoes/   seções da home: hero, manifesto, faixa, coleção, colagem, destaques, texto, marcos
scripts/                 extrator, otimizador de imagens, checador, prints, redirects
.claude/                 regras, skills (/extrair /direcao-de-arte /reconstruir /revisar) e o agente revisor
.github/workflows/       extrair.yml · qualidade.yml · prints.yml
docs/                    blocos da prosa, checklist de entrega, planilha de controle
```

Os textos são **Markdown** — dá para corrigir uma vírgula direto no GitHub (ícone de
lápis no arquivo) e a Vercel publica sozinha.

## Como saber se está tudo certo

- **Actions → Qualidade:** ✅ = compilou e passou na checagem; ❌ = abra e leia o erro.
- **Actions → Prints:** gera fotos de todas as páginas no branch `prints`.
- **Vercel:** cada envio mostra *Ready* (no ar) ou *Error*.
- Em qualquer erro, peça ao Claude: "corrija o erro do último build".

## Evolução da fábrica

1. Faça 2–3 clientes pelo fluxo acima e anote tempos em `docs/controle-fabrica.csv`.
2. Toda correção que se repetir vira regra no `CLAUDE.md`, melhoria de skill ou seção
   nova **aqui no molde** — os próximos clientes já nascem melhores.
3. Com o fluxo previsível, dá para automatizar a produção em lote.

<details>
<summary><b>Opcional: rodar no seu computador</b></summary>

Precisa de Node.js 22 e Git.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # gera o site estático em out/
npm run checar     # controle de qualidade (depois do build)
```
</details>
