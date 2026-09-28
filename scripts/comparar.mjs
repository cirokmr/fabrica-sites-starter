#!/usr/bin/env node
/**
 * PROPOSTA / ENTREGA — "antes × depois" do site do cliente.
 *   npm run build && node scripts/prints.mjs && node scripts/comparar.mjs
 * (roda sozinho no workflow "Proposta" do GitHub Actions)
 *
 * Entrada:
 *   extraido/screenshots/*.jpg     prints do site ANTIGO (feitos na extração)
 *   extraido/urls-antigas.json     qual página antiga virou qual página nova
 *   prints/*.jpg                   prints do site NOVO (scripts/prints.mjs)
 *   proposta.json                  textos da apresentação (opcional, ver skill /proposta)
 *   proposta/lighthouse-*.json     notas do Google Lighthouse (opcional)
 *   out/                           site compilado (a apresentação usa as fontes e cores dele)
 *
 * Saída em proposta/:
 *   antes-depois-01-inicio-computador.jpg, …-celular.jpg, …-<pagina>.jpg
 *   apresentacao.pdf               A4 deitado, no visual do site novo
 *   numeros.json                   números usados na apresentação
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { carregar } from './carregar.mjs';

const sharp = (await carregar('sharp')).default;
const { chromium } = await carregar('playwright');

const RAIZ = process.cwd();
const OUT = path.join(RAIZ, 'out');
const PRINTS = path.join(RAIZ, 'prints');
const ANTIGOS = path.join(RAIZ, 'extraido', 'screenshots');
const DEST = path.join(RAIZ, 'proposta');
fs.mkdirSync(DEST, { recursive: true });

const lerJSON = (arq, padrao) => {
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return padrao; }
};
for (const [p, msg] of [[OUT, 'rode "npm run build"'], [PRINTS, 'rode "node scripts/prints.mjs"'], [ANTIGOS, 'rode a extração do site antigo']]) {
  if (!fs.existsSync(p)) { console.error(`❌ Falta ${path.relative(RAIZ, p)}/ — ${msg}.`); process.exit(1); }
}

const site = lerJSON(path.join(RAIZ, 'conteudo', 'site.json'), {});
const cliente = lerJSON(path.join(RAIZ, 'cliente.json'), {});
const proposta = lerJSON(path.join(RAIZ, 'proposta.json'), {});
const urls = lerJSON(path.join(RAIZ, 'extraido', 'urls-antigas.json'), []);

// ---------- cores do cliente (tema.css) ----------
const tema = fs.readFileSync(path.join(RAIZ, 'src', 'styles', 'tema.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const token = (n, padrao) => (tema.match(new RegExp(`--${n}\\s*:\\s*(#[0-9a-fA-F]{3,8})`)) || [])[1] || padrao;
const COR = { escuro: token('escuro', '#111111'), claro: token('claro', '#f2f2f2'), destaque: token('destaque', '#ff5a36') };

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nomePrint = (rota) => (rota === '/' ? 'home' : rota.replace(/^\/|\/$/g, '').replace(/\//g, '__'));
const dominio = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u || ''; } };
const siteAntigo = cliente.site_antigo || urls[0]?.url || '';

// ---------- pares antigo → novo ----------
// título de uma página nova = <title> do HTML compilado, sem o " | Nome do site"
function tituloNovo(rota) {
  try {
    const h = fs.readFileSync(path.join(OUT, rota, 'index.html'), 'utf8');
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
    if (t) return t.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').split(/\s[|—–]\s/)[0].trim();
  } catch { /* sem out/ */ }
  return '';
}
const semCaixaAlta = (t) => (t && t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t);
// padrão: página inicial + até 3 páginas que existem nos dois lados; proposta.json → pares substitui.
function paresPadrao() {
  const pares = [];
  const vistos = new Set();
  for (const u of urls) {
    if (!u.arquivo || (!u.nova_url && u.caminho !== '/')) continue;
    const antigo = path.basename(u.arquivo, '.md');
    const novo = u.caminho === '/' ? '/' : u.nova_url;
    if (!novo || vistos.has(novo) || /^(category|tag|author)__|^\d{4}__\d{2}$/.test(antigo)) continue;
    if (!fs.existsSync(path.join(ANTIGOS, `${antigo}.jpg`)) || !fs.existsSync(path.join(PRINTS, `${nomePrint(novo)}--desktop.jpg`))) continue;
    vistos.add(novo);
    pares.push({ antigo, novo });
  }
  const home = pares.filter((p) => p.novo === '/');
  return [...home, ...pares.filter((p) => p.novo !== '/').slice(0, 3)];
}
const pares = (proposta.pares?.length ? proposta.pares : paresPadrao()).map((p, i) => {
  const velho = urls.find((u) => u.arquivo && path.basename(u.arquivo, '.md') === p.antigo);
  const titulo = p.titulo || (p.novo === '/' ? 'Página inicial' : tituloNovo(p.novo) || semCaixaAlta(velho?.titulo?.split(/\s[|–]\s/)[0]) || p.novo);
  return { ...p, titulo, nota: p.nota || proposta.notasPares?.[p.novo] || '', n: String(i + 1).padStart(2, '0') };
});

// ---------- servidor local do out/ (celular em alta e PDF) ----------
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const servidor = http.createServer((req, res) => {
  let arq = path.join(OUT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(arq) && fs.statSync(arq).isDirectory()) arq = path.join(arq, 'index.html');
  if (!fs.existsSync(arq)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((r) => servidor.listen(4175, r));
const navegador = await chromium.launch();
const BASE = 'http://localhost:4175';

// ---------- montagem das imagens ----------
const svgTexto = (w, h, partes) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${partes.join('')}</svg>`);
const txt = (x, y, s, tam, cor, peso = 400, extra = '') =>
  `<text x="${x}" y="${y}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="${tam}" font-weight="${peso}" fill="${cor}" ${extra}>${esc(s)}</text>`;

async function recorte(arq, largura, altura) {
  // redimensiona pela largura e corta do topo — mostra a página como ela abre na tela
  const buf = await sharp(arq).resize({ width: largura }).toBuffer();
  const hRedim = (await sharp(buf).metadata()).height;
  const alturaFinal = Math.min(altura, hRedim);
  let saida = sharp(buf).extract({ left: 0, top: 0, width: largura, height: alturaFinal });
  if (alturaFinal < altura) saida = sharp(await saida.toBuffer()).extend({ bottom: altura - alturaFinal, background: COR.escuro });
  return saida.png().toBuffer();
}
// cantos arredondados (tela de celular)
async function arredondar(buf, w, h, r) {
  const mascara = svgTexto(w, h, [`<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/>`]);
  return sharp(buf).composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
}
const cortar = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

async function painel({ antes, depois, titulo, arquivo, modo }) {
  const celular = modo === 'celular';
  const pw = celular ? 520 : 1180; // largura de cada lado
  const ph = celular ? Math.round(520 * (844 / 390)) : Math.round(1180 * 0.625);
  const gutter = celular ? 140 : 48, margem = celular ? 90 : 56, topo = 150, base = 70;
  const W = margem * 2 + pw * 2 + gutter;
  const H = topo + ph + base;
  let [a, d] = await Promise.all([recorte(antes, pw, ph), recorte(depois, pw, ph)]);
  const raio = celular ? 44 : 0;
  if (celular) [a, d] = await Promise.all([arredondar(a, pw, ph, raio), arredondar(d, pw, ph, raio)]);
  const xD = margem + pw + gutter;
  const moldura = (x) => celular
    ? `<rect x="${x - 10}" y="${topo - 10}" width="${pw + 20}" height="${ph + 20}" rx="${raio + 10}" fill="none" stroke="${COR.claro}" stroke-opacity="0.35" stroke-width="3"/>`
    : `<rect x="${x - 1}" y="${topo - 1}" width="${pw + 2}" height="${ph + 2}" fill="none" stroke="${COR.claro}" stroke-opacity="0.18"/>`;
  const rotulos = svgTexto(W, H, [
    txt(margem, 62, (site.nome || '').toUpperCase(), 22, COR.claro, 700, 'letter-spacing="2"'),
    txt(W - margem, 62, cortar(titulo, celular ? 40 : 90), 22, COR.claro, 400, 'text-anchor="end" opacity="0.7"'),
    txt(margem, 120, 'ANTES', 30, COR.claro, 800, 'letter-spacing="3" opacity="0.6"'),
    txt(margem + 140, 120, dominio(siteAntigo), 22, COR.claro, 400, 'opacity="0.55"'),
    txt(xD, 120, 'DEPOIS', 30, COR.destaque, 800, 'letter-spacing="3"'),
    txt(xD + 160, 120, proposta.urlNova ? dominio(proposta.urlNova) : 'site novo', 22, COR.claro, 400, 'opacity="0.8"'),
    celular ? '' : `<rect x="${xD}" y="${topo - 14}" width="${pw}" height="4" fill="${COR.destaque}"/>`,
    moldura(margem),
    moldura(xD),
    txt(margem, H - 22, celular ? 'No celular — a primeira tela que o visitante vê' : 'No computador — a primeira tela que o visitante vê', 20, COR.claro, 400, 'opacity="0.5"'),
  ]);
  await sharp({ create: { width: W, height: H, channels: 3, background: COR.escuro } })
    .composite([
      { input: a, left: margem, top: topo },
      { input: d, left: xD, top: topo },
      { input: rotulos, left: 0, top: 0 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(DEST, arquivo));
  return arquivo;
}

// primeira tela do site novo no celular, em alta (tela de retina, 2×)
async function telaCelular(rota, destino) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  try {
    await pg.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 30000 });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(800);
    await pg.screenshot({ path: destino, type: 'jpeg', quality: 88 });
    return destino;
  } catch (e) {
    console.warn(`   ⚠️  Não consegui fotografar ${rota} no celular (${e.message.split('\n')[0]}); uso o print comum.`);
    return path.join(PRINTS, `${nomePrint(rota)}--celular.jpg`);
  } finally {
    await ctx.close();
  }
}

const imagens = [];
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).replace(/-$/, '');
const TMP = fs.mkdtempSync(path.join(DEST, '.tmp-'));
for (const p of pares) {
  const antesDesk = path.join(ANTIGOS, `${p.antigo}.jpg`);
  // na página inicial, o "depois" é a primeira tela com animação (abertura)
  const depoisDesk = p.novo === '/' && fs.existsSync(path.join(PRINTS, 'home--abertura.jpg'))
    ? path.join(PRINTS, 'home--abertura.jpg')
    : path.join(PRINTS, `${nomePrint(p.novo)}--desktop.jpg`);
  if (!fs.existsSync(antesDesk) || !fs.existsSync(depoisDesk)) { console.warn(`   ⚠️  Pulei "${p.titulo}": falta print (${path.basename(antesDesk)} / ${path.basename(depoisDesk)})`); continue; }
  const base = `antes-depois-${p.n}-${slug(p.titulo)}`;
  imagens.push({ ...p, arquivo: await painel({ antes: antesDesk, depois: depoisDesk, titulo: p.titulo, arquivo: `${base}-computador.jpg` }) });
  // celular: só da página inicial (o antigo foi fotografado no celular só nela)
  const antesCel = path.join(ANTIGOS, `${p.antigo}-celular.jpg`);
  if (fs.existsSync(antesCel)) {
    const depoisCel = await telaCelular(p.novo, path.join(TMP, `${nomePrint(p.novo)}-celular.jpg`));
    const titulo = `${p.titulo} no celular`;
    imagens.push({ ...p, titulo, nota: proposta.notasPares?.celular || '', celular: true, arquivo: await painel({ antes: antesCel, depois: depoisCel, titulo, arquivo: `${base}-celular.jpg`, modo: 'celular' }) });
  }
  console.log(`   ✓ ${p.titulo}`);
}
fs.rmSync(TMP, { recursive: true, force: true });

// ---------- números ----------
const paginasNovas = [];
(function andar(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !/^(_next|_vazio|prancha|_proposta|404|_not-found)$/.test(e.name)) andar(p);
    else if (e.name === 'index.html') paginasNovas.push(p);
  }
})(OUT);
const celularAntigo = fs.existsSync(path.join(ANTIGOS, 'home-celular.jpg')) ? (await sharp(path.join(ANTIGOS, 'home-celular.jpg')).metadata()).width : 0;
const lh = (q) => {
  const j = lerJSON(path.join(DEST, `lighthouse-${q}.json`), null);
  if (!j?.categories) return null;
  const nota = (c) => (j.categories[c]?.score != null ? Math.round(j.categories[c].score * 100) : null);
  return {
    desempenho: nota('performance'),
    acessibilidade: nota('accessibility'),
    boasPraticas: nota('best-practices'),
    seo: nota('seo'),
    peso: j.audits?.['total-byte-weight']?.displayValue ?? null,
    bytes: j.audits?.['total-byte-weight']?.numericValue ?? null,
    lcp: j.audits?.['largest-contentful-paint']?.displayValue ?? null,
    url: j.finalDisplayedUrl || j.finalUrl || j.requestedUrl || '',
  };
};
// endereço antigo preservado = vira página nova com o mesmo caminho ou tem redirect
const redirects = lerJSON(path.join(RAIZ, 'redirects.json'), {}).redirects || {};
const semBarra = (c) => (c || '/').replace(/\/+$/, '') || '/';
const chavesRedirect = new Set(Object.keys(redirects).map(semBarra));
const vivas = urls.filter((u) => u.caminho && !(u.status >= 400));
const preservada = (u) => u.nova_url || chavesRedirect.has(semBarra(u.caminho)) ||
  fs.existsSync(path.join(OUT, decodeURIComponent(u.caminho), 'index.html'));
const numeros = {
  paginasAntigas: urls.filter((u) => u.arquivo).length,
  paginasNovas: paginasNovas.length,
  enderecosPreservados: vivas.filter(preservada).length,
  enderecosAntigos: vivas.length,
  antigoAdaptaCelular: celularAntigo ? celularAntigo <= 500 : null,
  lighthouse: { antes: lh('antes'), depois: lh('depois') },
};
fs.writeFileSync(path.join(DEST, 'numeros.json'), JSON.stringify(numeros, null, 2));

// ---------- apresentação (HTML no estilo do site → PDF) ----------
const css = [];
(function acharCss(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) acharCss(p);
    else if (e.name.endsWith('.css')) css.push('/' + path.relative(OUT, p).split(path.sep).join('/'));
  }
})(path.join(OUT, '_next', 'static'));

const data = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
const destaques = proposta.destaques?.length ? proposta.destaques : [
  numeros.antigoAdaptaCelular === false ? 'O site antigo não se adapta ao celular; o novo foi desenhado primeiro para ele.' : 'Desenhado primeiro para o celular.',
  numeros.enderecosPreservados === numeros.enderecosAntigos
    ? `Todos os ${numeros.enderecosAntigos} endereços do site antigo têm destino no site novo: quando o domínio apontar para ele, quem chega pelo Google ou por um link antigo não cai em página quebrada.`
    : `${numeros.enderecosPreservados} de ${numeros.enderecosAntigos} endereços do site antigo já têm destino no site novo.`,
  'Site estático, sem banco de dados nem plugins: mais rápido, mais seguro e sem manutenção de servidor.',
];
const passos = proposta.proximosPassos?.length ? proposta.proximosPassos : [];
const notas = numeros.lighthouse;
// notas só aparecem se os dois lados foram medidos na internet (a cópia local não vale como "depois")
const mostrarNotas = proposta.mostrarNotas !== false && notas.antes && notas.depois && !/localhost|127\.0\.0\.1/.test(notas.depois.url);
const mb = (b) => (b == null ? null : `${(b / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`);
const linhaNota = (rotulo, a, d) => `<tr><td class="mono">${rotulo}</td><td>${a ?? '—'}</td><td class="accent">${d ?? '—'}</td></tr>`;

const capaSite = fs.existsSync(path.join(PRINTS, 'home--abertura.jpg'));
const pagina = (conteudo, tema = 'tema-escuro') => `<section class="pg ${tema}">${conteudo}</section>`;
const html = `<!doctype html>
<html lang="pt-BR" class="fotos-natural js reduced intro-seen">
<head>
<meta charset="utf-8" />
<title>Antes e depois — ${esc(site.nome)}</title>
${css.map((h) => `<link rel="stylesheet" href="${h}" />`).join('\n')}
<style>
  @page { size: 297mm 210mm; margin: 0; }
  html, body { background: var(--escuro); margin: 0; }
  body { overflow: visible !important; font-size: 13pt; }
  .pg { width: 297mm; height: 210mm; box-sizing: border-box; padding: 14mm 16mm; display: flex; flex-direction: column;
        page-break-after: always; break-after: page; overflow: hidden; position: relative; }
  .pg:last-child { page-break-after: auto; }
  .topo { display: flex; justify-content: space-between; gap: 10mm; margin-bottom: 8mm; }
  .capa { justify-content: space-between; }
  .capa__meio { display: grid; grid-template-columns: 1fr 1.15fr; gap: 12mm; align-items: center; }
  .capa__site { width: 100%; display: block; border: 1px solid var(--line); box-shadow: 0 6mm 14mm rgb(0 0 0 / 0.35); }
  .comp__cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10mm; margin: 0 0 5mm; }
  .comp__cab h2 { margin: 0; font-size: 26pt; }
  .comp__cab p { margin: 0; max-width: 120mm; font-size: 12pt; line-height: 1.35; text-align: right; }
  .capa h1 { margin: 0; font-size: 58pt; line-height: 0.9; }
  .capa .serif-i { font-size: 30pt; margin: 4mm 0 0; }
  .img { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .img img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  h2 { margin: 0 0 6mm; font-size: 30pt; line-height: 1; }
  ul.lista { margin: 0; padding: 0; list-style: none; display: grid; gap: 4mm; max-width: 200mm; }
  ul.lista li { padding-top: 3mm; border-top: 1px solid var(--line); font-size: 14pt; line-height: 1.35; }
  .cols { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14mm; flex: 1; }
  table { border-collapse: collapse; width: 100%; font-size: 13pt; }
  td { padding: 2.2mm 0; border-top: 1px solid var(--line); }
  td:not(:first-child) { text-align: right; font-weight: 600; }
  .numeros { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin-top: 8mm; }
  .numeros b { display: block; font-size: 34pt; line-height: 1; font-family: var(--font-sans); }
  .rodape { margin-top: auto; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 3mm 12mm; padding-top: 5mm; }
</style>
</head>
<body>
${pagina(`
  <div class="topo mono"><span>${esc(proposta.assinatura || '')}</span><span>${esc(data)}</span></div>
  <div class="capa__meio">
    <div>
      <p class="mono muted">${esc(proposta.rotulo || 'Novo site')}</p>
      <h1 class="display">${esc(site.nome || cliente.cliente || '')}</h1>
      <p class="serif-i accent">${esc(proposta.titulo || 'Antes e depois do novo site')}</p>
      ${proposta.resumo ? `<p style="margin-top:8mm;font-size:13pt;line-height:1.4">${esc(proposta.resumo)}</p>` : ''}
    </div>
    ${capaSite ? '<img class="capa__site" src="/_proposta/capa-site.jpg" alt="" />' : ''}
  </div>
  <div class="rodape mono muted"><span>${esc(dominio(siteAntigo))} → ${esc(proposta.urlNova ? dominio(proposta.urlNova) : 'site novo')}</span><span>${esc(site.nomeCompleto || '')}</span></div>
`, 'tema-escuro capa')}
${imagens.map((im) => pagina(`
  <div class="topo mono"><span>${esc(im.n)} · Antes → depois</span><span class="muted">${esc(site.nome || '')}</span></div>
  <div class="comp__cab"><h2 class="display">${esc(im.titulo)}</h2>${im.nota ? `<p>${esc(im.nota)}</p>` : ''}</div>
  <div class="img"><img src="/_proposta/${esc(im.arquivo)}" alt="" /></div>
`)).join('\n')}
${pagina(`
  <div class="topo mono"><span>O que muda</span><span class="muted">${esc(site.nome || '')}</span></div>
  <div class="cols">
    <div>
      <h2 class="display">${esc(proposta.tituloMudancas || 'O que muda')}</h2>
      <ul class="lista">${destaques.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    </div>
    <div>
      ${mostrarNotas ? `<p class="mono muted">Notas do Google Lighthouse (0–100, celular)</p>
      <table>
        <tr><td></td><td class="mono muted">Antes</td><td class="mono muted">Depois</td></tr>
        ${linhaNota('Desempenho', notas.antes.desempenho, notas.depois.desempenho)}
        ${linhaNota('Acessibilidade', notas.antes.acessibilidade, notas.depois.acessibilidade)}
        ${linhaNota('Boas práticas', notas.antes.boasPraticas, notas.depois.boasPraticas)}
        ${linhaNota('SEO', notas.antes.seo, notas.depois.seo)}
        ${notas.antes.bytes && notas.depois.bytes ? linhaNota('Peso da página inicial', mb(notas.antes.bytes), mb(notas.depois.bytes)) : ''}
      </table>` : ''}
      <div class="numeros">
        <div><b>${numeros.paginasNovas}</b><span class="mono muted">páginas no site novo</span></div>
        <div><b>${numeros.enderecosPreservados}/${numeros.enderecosAntigos}</b><span class="mono muted">endereços antigos preservados</span></div>
        <div><b>${numeros.paginasAntigas}</b><span class="mono muted">páginas antigas revisadas</span></div>
      </div>
    </div>
  </div>
`, 'tema-claro')}
${passos.length ? pagina(`
  <div class="topo mono"><span>Próximos passos</span><span class="muted">${esc(site.nome || '')}</span></div>
  <h2 class="display">${esc(proposta.tituloPassos || 'Próximos passos')}</h2>
  <ul class="lista">${passos.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
  <div class="rodape mono muted"><span>${esc(proposta.assinatura || '')}</span><span>${esc(proposta.contato || '')}</span></div>
`) : ''}
</body>
</html>`;

// serve out/ + as imagens geradas e imprime o PDF
const pastaHtml = path.join(OUT, '_proposta');
fs.mkdirSync(pastaHtml, { recursive: true });
fs.writeFileSync(path.join(pastaHtml, 'index.html'), html);
for (const im of imagens) fs.copyFileSync(path.join(DEST, im.arquivo), path.join(pastaHtml, im.arquivo));
if (capaSite) fs.copyFileSync(path.join(PRINTS, 'home--abertura.jpg'), path.join(pastaHtml, 'capa-site.jpg'));

const pg = await navegador.newPage({ viewport: { width: 1123, height: 794 } });
await pg.goto('http://localhost:4175/_proposta/', { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
await pg.pdf({ path: path.join(DEST, 'apresentacao.pdf'), width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
// capa em imagem (para mandar no WhatsApp junto com o PDF)
await pg.screenshot({ path: path.join(DEST, 'capa.jpg'), type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1123, height: 794 } });
await navegador.close();
servidor.close();
fs.rmSync(pastaHtml, { recursive: true, force: true });

console.log(`\n✅ Proposta em proposta/: ${imagens.length} comparação(ões), apresentacao.pdf, capa.jpg, numeros.json`);
