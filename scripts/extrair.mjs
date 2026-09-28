#!/usr/bin/env node
/**
 * EXTRATOR DE SITE ANTIGO
 * -----------------------
 * Abre o site antigo num navegador de verdade (Playwright), percorre as páginas
 * e salva tudo o que precisamos para reconstruí-lo, SEM depender de memória:
 *
 *   extraido/
 *   ├── paginas/*.md          texto de cada página em Markdown (+ título, descrição)
 *   ├── screenshots/*.jpg     print de cada página (referência visual)
 *   ├── imagens/              imagens originais baixadas (fora do Git)
 *   ├── imagens.json          de onde veio cada imagem, alt, em quais páginas aparece
 *   ├── urls-antigas.json     TODAS as URLs antigas (base para os redirects 301)
 *   ├── identidade.json       cores, fontes, logo, contatos, redes, menu
 *   ├── documentos.json       PDFs e outros arquivos linkados
 *   └── RELATORIO.md          resumo legível do que foi encontrado
 *
 * Uso:
 *   npm run extrair -- https://www.siteantigo.com.br
 *   npm run extrair -- https://www.siteantigo.com.br --max 80
 *
 * Só use em sites de clientes que autorizaram a reconstrução.
 */
import { carregar } from './carregar.mjs';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ---------- argumentos ----------
const args = process.argv.slice(2);
const urlInicial = args.find((a) => /^https?:\/\//i.test(a));
if (!urlInicial) {
  console.error('Uso: npm run extrair -- https://www.siteantigo.com.br [--max 50]');
  process.exit(1);
}
const iMax = args.indexOf('--max');
const MAX_PAGINAS = iMax >= 0 ? Number(args[iMax + 1]) || 50 : 50;
const PAUSA_MS = 400; // gentileza com o servidor do cliente

const OUT = path.resolve('extraido');
const DIR = {
  paginas: path.join(OUT, 'paginas'),
  shots: path.join(OUT, 'screenshots'),
  imagens: path.join(OUT, 'imagens'),
};

const { chromium } = await carregar('playwright');

const base = new URL(urlInicial);
const hostBase = base.hostname.replace(/^www\./, '');
const EXT_DOCUMENTO = /\.(pdf|docx?|xlsx?|pptx?|zip|rar)$/i;
const EXT_IGNORAR = /\.(jpe?g|png|gif|webp|svg|ico|css|js|xml|txt|mp4|mp3|woff2?|ttf)$/i;
// Endereços que não são páginas de conteúdo (compartilhar, login, feeds, busca...)
function naoEPagina(u) {
  const url = new URL(u);
  if ([...url.searchParams.keys()].some((k) => /^(share|s|p|preview|print|action|redirect_to|attachment_id|lang)$/i.test(k))) return true;
  return /\/(wp-login\.php|wp-admin|wp-json|xmlrpc\.php|feed|comments\/feed|trackback|cdn-cgi)(\/|$)/i.test(url.pathname);
}

// ---------- utilidades ----------
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function mesmoSite(u) {
  try { return new URL(u).hostname.replace(/^www\./, '') === hostBase; } catch { return false; }
}

function normalizar(u) {
  try {
    const url = new URL(u, base);
    url.hash = '';
    for (const p of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref$|replytocom$|like_comment$|_wpnonce$|amp$|nb$)/i.test(p)) url.searchParams.delete(p);
    }
    return url.href;
  } catch { return null; }
}

function slugDe(u) {
  const url = new URL(u);
  let p = decodeURIComponent(url.pathname).replace(/\/+$/, '');
  if (!p || p === '/index.html' || p === '/index.php') return 'home';
  p = p.replace(/^\//, '').replace(/\.(html?|php|aspx?)$/i, '');
  let slug = p.replace(/[^a-z0-9\-_/]/gi, '-').replace(/\//g, '__').toLowerCase();
  if (url.search) slug += '__' + url.search.replace(/[^a-z0-9]/gi, '-').slice(1, 40);
  return slug || 'home';
}

function nomeArquivoImagem(u, usados) {
  const url = new URL(u);
  let nome = decodeURIComponent(path.basename(url.pathname)) || 'imagem';
  nome = nome.replace(/[^a-z0-9.\-_]/gi, '-').toLowerCase();
  if (!/\.[a-z0-9]{2,5}$/.test(nome)) nome += '.jpg';
  let final = nome, n = 2;
  while (usados.has(final)) final = nome.replace(/(\.[a-z0-9]+)$/, `-${n++}$1`);
  usados.add(final);
  return final;
}

const yaml = (v) => JSON.stringify(v ?? '');

// Endereço do arquivo original: WordPress (wp-content/uploads) e CDNs comuns servem
// a imagem redimensionada via ?w=448 ou foto-448x336.jpg — tiramos isso.
function urlOriginal(u) {
  try {
    const url = new URL(u);
    if (/wp-content\/uploads|files\.wordpress\.com|wp\.com|\/uploads\//.test(url.href)) {
      url.search = '';
      url.pathname = url.pathname.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, '').replace(/-scaled(?=\.[a-z0-9]+$)/i, '');
    }
    return url.href;
  } catch { return u; }
}

// chave para detectar a mesma página com endereços diferentes
function chave(u) {
  const url = new URL(u);
  url.hostname = url.hostname.replace(/^www\./, '');
  url.pathname = url.pathname.replace(/\/(index|default|home)\.(html?|php|aspx?)$/i, '/').replace(/\/+$/, '') || '/';
  return url.href;
}

// ---------- sitemap ----------
async function lerSitemap(request) {
  const achadas = new Set();
  const fila = [new URL('/sitemap.xml', base).href, new URL('/sitemap_index.xml', base).href];
  const vistos = new Set();
  while (fila.length && vistos.size < 20) {
    const s = fila.shift();
    if (vistos.has(s)) continue;
    vistos.add(s);
    try {
      const r = await request.get(s, { timeout: 15000 });
      if (!r.ok()) continue;
      const xml = await r.text();
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
      for (const loc of locs) {
        if (/\.xml(\?|$)/i.test(loc)) fila.push(loc);
        else if (mesmoSite(loc)) achadas.add(normalizar(loc));
      }
    } catch { /* site sem sitemap: tudo bem, seguimos pelos links */ }
  }
  return [...achadas].filter(Boolean);
}

// ---------- o que roda DENTRO da página ----------
function coletarNaPagina() {
  const visivel = (el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
  };
  const limpar = (t) => (t || '').replace(/\s+/g, ' ').trim();

  // HTML -> Markdown simples
  const PULAR = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IFRAME', 'FORM', 'BUTTON', 'SELECT', 'TEMPLATE']);
  // Blocos que não são conteúdo: botões de compartilhar, curtidas, comentários,
  // posts relacionados, avisos de cookies, barras de plataforma (WordPress, Wix...)
  const RUIDO = /(sharedaddy|sd-sharing|share-?buttons|social-share|jp-relatedposts|wpl-likebox|sd-like|post-likes|comments-area|comment-respond|commentlist|(^|\s)comments(\s|$)|(^|\s)respond(\s|$)|wpcnt|cookie|lgpd|gdpr|wpadminbar|actionbar|marketing-bar|skip-link)/i;
  // Sites antigos montavam o LAYOUT com <table>. Só tratamos como tabela de dados
  // se não houver blocos (parágrafos, títulos, imagens...) dentro dela.
  const cacheLayout = new Map();
  const tabelaDeLayout = (t) => {
    if (!t) return true;
    if (!cacheLayout.has(t)) cacheLayout.set(t, !!t.querySelector('p, h1, h2, h3, h4, h5, h6, div, table, ul, ol, img, nav, form, footer, header'));
    return cacheLayout.get(t);
  };
  function md(no) {
    if (no.nodeType === Node.TEXT_NODE) return no.textContent.replace(/\s+/g, ' ');
    if (no.nodeType !== Node.ELEMENT_NODE) return '';
    if (PULAR.has(no.tagName) || !visivel(no)) return '';
    if (RUIDO.test(`${no.id || ''} ${typeof no.className === 'string' ? no.className : ''}`)) return '';
    const filhos = () => [...no.childNodes].map(md).join('');
    const tag = no.tagName;
    if (/^H[1-6]$/.test(tag)) return `\n\n${'#'.repeat(+tag[1])} ${limpar(filhos())}\n\n`;
    switch (tag) {
      case 'P': return `\n\n${limpar(filhos())}\n\n`;
      case 'BR': return '\n';
      case 'LI': return `\n- ${limpar(filhos())}`;
      case 'UL': case 'OL': return `\n${filhos()}\n\n`;
      case 'STRONG': case 'B': { const t = limpar(filhos()); return t ? ` **${t}** ` : ''; }
      case 'EM': case 'I': { const t = limpar(filhos()); return t ? ` *${t}* ` : ''; }
      case 'A': {
        const t = limpar(filhos());
        const href = no.getAttribute('href');
        return t && href && !href.startsWith('javascript') ? ` [${t}](${no.href}) ` : ` ${t} `;
      }
      case 'IMG': {
        const src = no.currentSrc || no.src;
        if (no.naturalWidth && no.naturalWidth < 24) return ''; // pixel de rastreamento
        return src && !src.startsWith('data:') ? `\n\n![${limpar(no.alt)}](${src})\n\n` : '';
      }
      case 'TR':
        if (tabelaDeLayout(no.closest('table'))) return `\n\n${filhos()}\n\n`;
        return `\n| ${[...no.children].map((c) => limpar(c.innerText)).join(' | ')} |`;
      case 'TD': case 'TH':
        return tabelaDeLayout(no.closest('table')) ? `\n\n${filhos()}\n\n` : filhos();
      case 'TABLE': return `\n\n${filhos()}\n\n`;
      case 'BLOCKQUOTE': return `\n\n> ${limpar(filhos())}\n\n`;
      default: return filhos();
    }
  }

  const principal = document.querySelector('main, [role=main], #content, #conteudo, .content, article') || document.body;
  const clone = principal === document.body;
  // Se não há <main>, tiramos cabeçalho/menu/rodapé do texto (eles vão para identidade.json)
  const ignorados = clone ? [...document.querySelectorAll('header, nav, footer')] : [];
  const salvos = ignorados.map((el) => { const d = el.style.display; el.style.display = 'none'; return d; });
  let markdown = md(principal);
  ignorados.forEach((el, i) => { el.style.display = salvos[i]; });
  markdown = markdown.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim();

  // Imagens (inclui background-image de CSS)
  const imagens = [];
  // Maior versão disponível de cada imagem: original do WordPress (data-orig-file),
  // maior item do srcset, ou o link <a href="foto-grande.jpg"> em volta da miniatura.
  const ehImagem = (u) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u || '');
  const maiorVersao = (img) => {
    const cands = [];
    const add = (u, w) => { if (u && !u.startsWith('data:')) cands.push({ u: new URL(u, document.baseURI).href, w }); };
    add(img.dataset.origFile, 1e6);
    const link = img.closest('a');
    if (link && ehImagem(link.getAttribute('href'))) add(link.getAttribute('href'), 5e5);
    add(img.dataset.largeFile, 1e5);
    for (const parte of (img.getAttribute('srcset') || '').split(',')) {
      const [u, d] = parte.trim().split(/\s+/);
      if (u) add(u, parseFloat(d) * (/x$/.test(d || '') ? 1000 : 1) || 0);
    }
    add(img.currentSrc || img.src, img.naturalWidth || 1);
    cands.sort((a, b) => b.w - a.w);
    return cands[0]?.u;
  };
  for (const img of document.images) {
    const src = maiorVersao(img);
    if (!src) continue;
    if (img.naturalWidth && img.naturalWidth < 24) continue; // pixels de rastreamento
    imagens.push({ src, miniatura: img.currentSrc || img.src, alt: limpar(img.alt), largura: img.naturalWidth, altura: img.naturalHeight });
  }
  for (const el of document.querySelectorAll('body *')) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (m && !m[1].startsWith('data:')) imagens.push({ src: new URL(m[1], document.baseURI).href, alt: '', fundo: true });
  }

  // Logo provável
  const logoEl =
    document.querySelector('.custom-logo, .site-logo img, #logo img, .logo img, .site-branding img, img[class*="logo" i], img[id*="logo" i]') ||
    [...document.querySelectorAll('img')].find((i) => /logo|logomarca/i.test(`${i.src} ${i.alt}`)) ||
    [...document.querySelectorAll('header img, #header img, #masthead img, #branding img')].find((i) => (i.naturalWidth || 0) < 700);

  // Links (para continuar navegando)
  const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);

  // Contatos e redes
  const html = document.body.innerHTML;
  const texto = document.body.innerText;
  const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') || '');
  const contatos = {
    telefones: [...new Set([
      ...hrefs.filter((h) => h.startsWith('tel:')).map((h) => h.slice(4)),
      ...(texto.match(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g) || []),
    ].map(limpar))],
    emails: [...new Set([
      ...hrefs.filter((h) => h.startsWith('mailto:')).map((h) => h.slice(7).split('?')[0]),
      ...(texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []),
    ].map((e) => e.toLowerCase()))],
    whatsapp: [...new Set(hrefs.filter((h) => /wa\.me|api\.whatsapp|whatsapp\.com\/send/i.test(h)))],
    redes: [...new Set(hrefs.filter((h) => /instagram\.com|facebook\.com|linkedin\.com|youtube\.com|tiktok\.com|twitter\.com|x\.com\//i.test(h)))],
    mapa: [...new Set([...document.querySelectorAll('iframe[src*="google.com/maps"], a[href*="maps.google"], a[href*="goo.gl/maps"]')].map((e) => e.src || e.href))],
    cnpj: [...new Set(texto.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g) || [])],
  };

  // Menu (do cabeçalho/nav)
  const candidatosMenu = [...document.querySelectorAll('nav, [role=navigation], #access, #nav, #menu, .menu, .main-navigation, .navbar, #navigation, .navigation, header')]
    .filter((el) => !el.closest('footer') && visivel(el));
  const linksInternos = (el) => [...el.querySelectorAll('a[href]')]
    .filter((a) => a.hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, '') && limpar(a.innerText));
  const nav = candidatosMenu
    .map((el) => ({ el, n: linksInternos(el).length }))
    .filter((c) => c.n >= 2 && c.n <= 40)
    .sort((a, b) => b.n - a.n)[0]?.el;
  const menu = nav ? [...new Map(linksInternos(nav).map((a) => [a.href, { texto: limpar(a.innerText), link: a.href }])).values()] : [];

  // Cores e fontes em uso
  const cores = {};
  const contar = (c, peso) => {
    if (!c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c)) return;
    cores[c] = (cores[c] || 0) + peso;
  };
  const amostras = document.querySelectorAll('body, header, footer, nav, h1, h2, h3, a, button, .btn, [class*=button], [class*=botao]');
  for (const el of amostras) {
    if (!visivel(el)) continue;
    const s = getComputedStyle(el);
    const peso = /^(BUTTON|A)$/.test(el.tagName) || /btn|button|botao/i.test(el.className) ? 3 : 1;
    contar(s.backgroundColor, peso * 2);
    contar(s.color, peso);
  }
  const fontes = {};
  for (const sel of ['body', 'h1', 'h2', 'p', 'a']) {
    const el = document.querySelector(sel);
    if (el) { const f = getComputedStyle(el).fontFamily; fontes[f] = (fontes[f] || 0) + 1; }
  }
  const googleFonts = [...document.querySelectorAll('link[href*="fonts.googleapis"]')].map((l) => l.href);

  const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content || '';
  return {
    titulo: limpar(document.title),
    descricao: meta('description'),
    palavrasChave: meta('keywords'),
    ogImagem: meta('og:image'),
    canonical: document.querySelector('link[rel=canonical]')?.href || '',
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll('h1')].map((h) => limpar(h.innerText)).filter(Boolean),
    markdown,
    imagens,
    logo: logoEl ? (logoEl.currentSrc || logoEl.src) : '',
    links,
    contatos,
    menu,
    cores,
    fontes,
    googleFonts,
    temFormulario: !!document.querySelector('form'),
  };
}

// ---------- principal ----------
async function main() {
  if (existsSync(OUT)) {
    console.log('⚠️  A pasta extraido/ já existe e será sobrescrita.');
    await fs.rm(OUT, { recursive: true, force: true });
  }
  for (const d of Object.values(DIR)) await fs.mkdir(d, { recursive: true });

  let navegador;
  try {
    navegador = await chromium.launch();
  } catch (e) {
    if (/Executable doesn't exist|install/i.test(e.message)) {
      console.error('❌ Navegador do Playwright não instalado. Rode uma vez: npx playwright install chromium');
      process.exit(1);
    }
    throw e;
  }
  const contexto = await navegador.newContext({
    viewport: { width: 1366, height: 900 },
    locale: 'pt-BR',
    ignoreHTTPSErrors: true, // site antigo com certificado vencido é comum
  });
  const pagina = await contexto.newPage();

  console.log(`🔎 Extraindo ${base.href} (máx. ${MAX_PAGINAS} páginas)\n`);
  const doSitemap = await lerSitemap(contexto.request);
  if (doSitemap.length) console.log(`   sitemap.xml: ${doSitemap.length} URL(s) encontradas`);

  const fila = [normalizar(base.href), ...doSitemap];
  const visitadas = new Map(); // chave -> caminho já extraído
  const vistasExatas = new Set();
  const resultados = [];
  const documentos = new Set();
  const imagensGlobais = new Map(); // src -> { alt, paginas:Set }
  const coresGlobais = {};
  const fontesGlobais = {};
  const contatosGlobais = { telefones: new Set(), emails: new Set(), whatsapp: new Set(), redes: new Set(), mapa: new Set(), cnpj: new Set() };
  let menu = [], logo = '', googleFonts = new Set(), slugsUsados = new Set();

  while (fila.length && resultados.filter((r) => r.slug).length < MAX_PAGINAS) {
    const url = fila.shift();
    if (!url || vistasExatas.has(url)) continue;
    vistasExatas.add(url);

    const registro = { url, caminho: new URL(url).pathname + new URL(url).search, status: null };
    // "/", "/index.html" e "/index.php" costumam ser a MESMA página: extrai uma vez só,
    // mas guarda o endereço (ele também precisa de redirect no site novo).
    if (visitadas.has(chave(url))) {
      registro.duplicataDe = visitadas.get(chave(url));
      resultados.push(registro);
      continue;
    }
    visitadas.set(chave(url), registro.caminho);
    try {
      let resp;
      try {
        resp = await pagina.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch {
        resp = await pagina.goto(url, { waitUntil: 'load', timeout: 45000 });
      }
      registro.status = resp?.status() ?? null;
      const final = normalizar(pagina.url());
      if (final !== url) {
        registro.redirecionaPara = final;
        vistasExatas.add(final);
        if (chave(final) !== chave(url)) {
          if (visitadas.has(chave(final))) { resultados.push(registro); continue; }
          visitadas.set(chave(final), registro.caminho);
        }
      }
      if (!mesmoSite(final) || (registro.status && registro.status >= 400)) {
        resultados.push(registro);
        console.log(`   ✗ ${registro.caminho} (${registro.status ?? 'fora do site'})`);
        continue;
      }
      const tipo = resp?.headers()['content-type'] || '';
      if (!tipo.includes('html')) { resultados.push(registro); continue; }

      // rola até o fim para carregar imagens "lazy"
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
        window.scrollTo(0, 0);
      });
      await pagina.waitForTimeout(300);

      // Acentos quebrados ("PÃ£o" em vez de "Pão"): acontece quando o site antigo
      // está em UTF-8 mas não declara isso, e o navegador lê como Latin-1.
      // Solução: baixa o HTML cru, declara UTF-8 e recarrega a página.
      const textoAtual = await pagina.evaluate(() => document.body?.innerText || '');
      if ((textoAtual.match(/Ã[ -¿]/g) || []).length >= 2) {
        const bruto = await (await contexto.request.get(final)).body();
        let html = null;
        try { html = new TextDecoder('utf-8', { fatal: true }).decode(bruto); } catch { /* não é UTF-8 */ }
        if (html) {
          const cabeca = `<meta charset="utf-8"><base href="${final}">`;
          html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + cabeca) : cabeca + html;
          await pagina.setContent(html, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
          console.log('     (acentos corrigidos: página em UTF-8 sem declaração de charset)');
        }
      }

      const dados = await pagina.evaluate(coletarNaPagina);
      let slug = slugDe(final);
      while (slugsUsados.has(slug)) slug += '-2';
      slugsUsados.add(slug);

      // tira do print as barras e avisos flutuantes (cookies, barra do WordPress...)
      await pagina.evaluate(() => {
        for (const el of document.querySelectorAll('body *')) {
          const s = getComputedStyle(el);
          if (s.position !== 'fixed' && s.position !== 'sticky') continue;
          const id = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.innerText?.slice(0, 200) || ''}`;
          if (/cookie|privacidade|privacy|lgpd|gdpr|wpcom|wordpress\.com|actionbar|marketing|consent|aceit/i.test(id)) el.style.display = 'none';
        }
      }).catch(() => {});
      await pagina.screenshot({ path: path.join(DIR.shots, `${slug}.jpg`), fullPage: true, type: 'jpeg', quality: 60 }).catch(() => {});
      if (slug === 'home') {
        await pagina.setViewportSize({ width: 390, height: 844 });
        await pagina.screenshot({ path: path.join(DIR.shots, 'home-celular.jpg'), fullPage: true, type: 'jpeg', quality: 60 }).catch(() => {});
        await pagina.setViewportSize({ width: 1366, height: 900 });
      }

      const frontmatter = [
        '---',
        `url_antiga: ${yaml(final)}`,
        `titulo: ${yaml(dados.titulo)}`,
        `descricao: ${yaml(dados.descricao)}`,
        `h1: ${yaml(dados.h1.join(' | '))}`,
        `screenshot: ${yaml(`../screenshots/${slug}.jpg`)}`,
        `tem_formulario: ${dados.temFormulario}`,
        '---',
        '',
      ].join('\n');
      await fs.writeFile(path.join(DIR.paginas, `${slug}.md`), frontmatter + dados.markdown + '\n');

      Object.assign(registro, { slug, titulo: dados.titulo, descricao: dados.descricao, h1: dados.h1, palavras: dados.markdown.split(/\s+/).length });
      resultados.push(registro);
      console.log(`   ✓ ${registro.caminho}  →  paginas/${slug}.md  (${registro.palavras} palavras)`);

      // acumula dados globais
      for (const img of dados.imagens) {
        const k = img.src;
        if (!imagensGlobais.has(k)) imagensGlobais.set(k, { ...img, paginas: new Set() });
        const g = imagensGlobais.get(k);
        if (!g.alt && img.alt) g.alt = img.alt;
        g.paginas.add(slug);
      }
      for (const [c, n] of Object.entries(dados.cores)) coresGlobais[c] = (coresGlobais[c] || 0) + n;
      for (const [f, n] of Object.entries(dados.fontes)) fontesGlobais[f] = (fontesGlobais[f] || 0) + n;
      for (const k of Object.keys(contatosGlobais)) dados.contatos[k].forEach((v) => contatosGlobais[k].add(v));
      dados.googleFonts.forEach((g) => googleFonts.add(g));
      if (!menu.length && dados.menu.length) menu = dados.menu;
      if (!logo && dados.logo) logo = dados.logo;

      for (const l of dados.links) {
        const n = normalizar(l);
        if (!n || !mesmoSite(n)) continue;
        if (EXT_DOCUMENTO.test(new URL(n).pathname)) { documentos.add(n); continue; }
        if (EXT_IGNORAR.test(new URL(n).pathname) || naoEPagina(n)) continue;
        if (!vistasExatas.has(n)) fila.push(n);
      }
    } catch (erro) {
      registro.erro = String(erro.message || erro).split('\n')[0];
      resultados.push(registro);
      console.log(`   ✗ ${registro.caminho} (${registro.erro})`);
    }
    await dormir(PAUSA_MS);
  }
  const naoVisitadas = [...new Set(fila)].filter((u) => u && !vistasExatas.has(u) && !visitadas.has(chave(u)));

  // ---------- baixar imagens ----------
  console.log(`\n🖼️  Baixando ${imagensGlobais.size} imagem(ns)...`);
  const nomesUsados = new Set();
  const listaImagens = [];
  for (const [src, info] of imagensGlobais) {
    const item = { url_original: src, externa: !mesmoSite(src) && !/wp\.com|wordpress\.com|cloudfront|amazonaws|googleusercontent|wixstatic|squarespace/.test(src), arquivo: null, alt: info.alt, fundo_css: !!info.fundo, largura: info.largura, altura: info.altura, paginas: [...info.paginas], e_logo: src === logo };
    try {
      // tenta primeiro o arquivo original (sem o redimensionamento do WordPress/CDN)
      let r = null;
      for (const tentativa of [...new Set([urlOriginal(src), src, info.miniatura].filter(Boolean))]) {
        try {
          const resp = await contexto.request.get(tentativa, { timeout: 30000 });
          if (resp.ok() && /image|octet-stream/.test(resp.headers()['content-type'] || '')) { r = resp; item.url_baixada = tentativa; break; }
        } catch { /* tenta a próxima */ }
      }
      if (r) {
        const corpo = await r.body();
        if (corpo.length > 1500 || /\.svg/i.test(src)) {
          const nome = nomeArquivoImagem(src, nomesUsados);
          await fs.writeFile(path.join(DIR.imagens, nome), corpo);
          item.arquivo = `imagens/${nome}`;
          item.bytes = corpo.length;
        }
      }
    } catch { /* imagem quebrada no site antigo */ }
    if (item.arquivo) listaImagens.push(item);
  }

  // ---------- identidade visual ----------
  const paraHex = (rgb) => {
    const m = rgb.match(/\d+(\.\d+)?/g);
    if (!m) return rgb;
    return '#' + m.slice(0, 3).map((n) => Math.round(+n).toString(16).padStart(2, '0')).join('');
  };
  const coresHex = {};
  for (const [c, n] of Object.entries(coresGlobais)) { const h = paraHex(c); coresHex[h] = (coresHex[h] || 0) + n; }
  const cores = Object.entries(coresHex).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([hex, usos]) => ({ hex, usos }));
  const fontes = Object.entries(fontesGlobais).sort((a, b) => b[1] - a[1]).map(([f]) => f);

  const identidade = {
    site: base.href,
    extraido_em: new Date().toISOString(),
    logo: logo ? { url_original: logo, arquivo: listaImagens.find((i) => i.url_original === logo)?.arquivo || null } : null,
    cores_mais_usadas: cores,
    fontes,
    google_fonts: [...googleFonts],
    contatos: Object.fromEntries(Object.entries(contatosGlobais).map(([k, v]) => [k, [...v]])),
    menu: menu.map((m) => ({ texto: m.texto, link_antigo: m.link })),
  };

  // ---------- salvar ----------
  const urlsAntigas = resultados.map((r) => ({
    url: r.url,
    caminho: r.caminho,
    status: r.status,
    redireciona_para: r.redirecionaPara || null,
    titulo: r.titulo || null,
    arquivo: r.slug ? `paginas/${r.slug}.md` : null,
    erro: r.erro || null,
    mesma_pagina_que: r.duplicataDe || null,
    nova_url: null, // o /reconstruir preenche
  }));
  await fs.writeFile(path.join(OUT, 'urls-antigas.json'), JSON.stringify(urlsAntigas, null, 2));
  await fs.writeFile(path.join(OUT, 'imagens.json'), JSON.stringify(listaImagens, null, 2));
  await fs.writeFile(path.join(OUT, 'identidade.json'), JSON.stringify(identidade, null, 2));
  await fs.writeFile(path.join(OUT, 'documentos.json'), JSON.stringify([...documentos], null, 2));

  const ok = resultados.filter((r) => r.slug);
  const relatorio = `# Relatório de extração

- **Site:** ${base.href}
- **Data:** ${new Date().toLocaleString('pt-BR')}
- **Páginas extraídas:** ${ok.length}
- **URLs com erro ou fora do ar:** ${resultados.filter((r) => !r.slug && !r.duplicataDe).length}
- **Imagens baixadas:** ${listaImagens.length}
- **Documentos linkados (PDF etc.):** ${documentos.size}
${naoVisitadas.length ? `- ⚠️ **${naoVisitadas.length} URL(s) não visitadas** (limite de ${MAX_PAGINAS} páginas). Rode de novo com \`--max ${MAX_PAGINAS * 2}\`.` : '- Todas as URLs encontradas foram visitadas.'}

## Páginas

| Caminho antigo | Título | Palavras | Arquivo |
|---|---|---|---|
${ok.map((r) => `| ${r.caminho} | ${(r.titulo || '').replace(/\|/g, '/')} | ${r.palavras} | paginas/${r.slug}.md |`).join('\n')}

## Problemas

${resultados.filter((r) => !r.slug && !r.duplicataDe).map((r) => `- ${r.caminho}: ${r.erro || (r.redirecionaPara ? 'redireciona para ' + r.redirecionaPara : 'status ' + r.status)}`).join('\n') || 'Nenhum.'}

## Endereços alternativos da mesma página

${resultados.filter((r) => r.duplicataDe).map((r) => `- ${r.caminho} = ${r.duplicataDe}`).join('\n') || 'Nenhum.'}

## Identidade encontrada

- **Logo:** ${identidade.logo?.arquivo || 'não identificado — procure em imagens/'}
- **Cores mais usadas:** ${cores.slice(0, 6).map((c) => c.hex).join(', ')}
- **Fontes:** ${fontes.slice(0, 3).join(' / ') || '—'}
- **Telefones:** ${identidade.contatos.telefones.join(', ') || '—'}
- **E-mails:** ${identidade.contatos.emails.join(', ') || '—'}
- **WhatsApp:** ${identidade.contatos.whatsapp.join(', ') || '—'}
- **Redes:** ${identidade.contatos.redes.join(', ') || '—'}
- **CNPJ:** ${identidade.contatos.cnpj.join(', ') || '—'}

## Menu original

${identidade.menu.map((m) => `- ${m.texto} → ${m.link_antigo}`).join('\n') || '—'}
`;
  await fs.writeFile(path.join(OUT, 'RELATORIO.md'), relatorio);

  await navegador.close();
  console.log(`\n✅ Pronto! ${ok.length} página(s), ${listaImagens.length} imagem(ns). Veja extraido/RELATORIO.md`);
}

main().catch((e) => { console.error('❌ Erro na extração:', e); process.exit(1); });
