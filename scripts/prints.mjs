#!/usr/bin/env node
/**
 * PRINTS DO SITE NOVO — revisão visual sem abrir o navegador.
 *   npm run build && node scripts/prints.mjs [--max 14]
 *
 * Serve a pasta out/ localmente e tira prints de cada página:
 *   prints/<rota>--desktop.jpg   1440px, página inteira, SEM animações (reduced-motion)
 *   prints/<rota>--celular.jpg   390px, página inteira, sem animações
 *   prints/home--abertura.jpg    1440px, primeira tela COM animações (depois da abertura)
 *   prints/home--rolagem-N.jpg   1440px, telas ao rolar a home COM animações
 * Roda no GitHub Actions (workflow "Prints"), que salva tudo no branch "prints".
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { carregar } from './carregar.mjs';

const { chromium } = await carregar('playwright');
const OUT = path.resolve('out');
const DEST = path.resolve('prints');
const iMax = process.argv.indexOf('--max');
const MAX = iMax >= 0 ? Number(process.argv[iMax + 1]) || 14 : 14;
// --rotas "/noticias/x/,/projetos/y/": páginas a mais (além da home e de uma de cada tipo)
const iRotas = process.argv.indexOf('--rotas');
const EXTRAS = iRotas >= 0 ? (process.argv[iRotas + 1] || '').split(',').map((r) => r.trim()).filter(Boolean) : [];

if (!fs.existsSync(OUT)) {
  console.error('❌ out/ não existe. Rode "npm run build" antes.');
  process.exit(1);
}
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.txt': 'text/plain', '.mp4': 'video/mp4', '.xml': 'application/xml' };
const servidor = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let arq = path.join(OUT, p);
  if (fs.existsSync(arq) && fs.statSync(arq).isDirectory()) arq = path.join(arq, 'index.html');
  if (!fs.existsSync(arq)) arq = path.join(OUT, '404.html');
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((r) => servidor.listen(4173, r));
const BASE = 'http://localhost:4173';

// rotas: home primeiro, depois uma de cada tipo, depois o resto
function rotas() {
  const lista = [];
  const andar = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('_')) andar(p);
      else if (e.name === 'index.html') lista.push('/' + path.relative(OUT, path.dirname(p)).split(path.sep).join('/'));
    }
  };
  andar(OUT);
  const norm = lista.map((r) => (r === '/' ? '/' : r.replace(/\/?$/, '/'))).map((r) => r.replace('//', '/'));
  const prioridade = (r) => (r === '/' ? 0 : r.split('/').length <= 3 ? 1 : 2);
  const porTipo = new Map();
  const ordenadas = norm.sort((a, b) => prioridade(a) - prioridade(b) || a.localeCompare(b));
  // listas e páginas simples entram todas; detalhes (projetos/x, noticias/x): só 1 de cada tipo
  return ordenadas.filter((r) => {
    if (prioridade(r) < 2) return true;
    const tipo = r.split('/')[1];
    porTipo.set(tipo, (porTipo.get(tipo) || 0) + 1);
    return porTipo.get(tipo) === 1;
  });
}

const nome = (r) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/\//g, '__'));
const navegador = await chromium.launch();

async function estatico(rota, largura, sufixo) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + rota, { waitUntil: 'networkidle' });
  // rola até o fim para carregar as imagens "lazy" antes do print da página inteira
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(DEST, `${nome(rota)}--${sufixo}.jpg`), fullPage: true, type: 'jpeg', quality: 62 });
  await ctx.close();
}

const lista = [...new Set([...rotas().slice(0, MAX), ...EXTRAS.map((r) => (r.endsWith('/') ? r : r + '/'))])];
console.log(`📸 ${lista.length} página(s): ${lista.join(', ')}`);
for (const r of lista) {
  await estatico(r, 1440, 'desktop');
  await estatico(r, 390, 'celular');
  console.log(`   ✓ ${r}`);
}

// Home com movimento: abertura e algumas telas da rolagem
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(5200); // abertura + animações de entrada
await page.screenshot({ path: path.join(DEST, 'home--abertura.jpg'), type: 'jpeg', quality: 70 });
for (let i = 1; i <= 8; i++) {
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(DEST, `home--rolagem-${i}.jpg`), type: 'jpeg', quality: 62 });
}
await ctx.close();
await navegador.close();
servidor.close();
console.log(`✅ Prints em ${path.relative(process.cwd(), DEST)}/`);
