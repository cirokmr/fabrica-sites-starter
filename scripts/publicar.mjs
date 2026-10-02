#!/usr/bin/env node
/**
 * PUBLICAÇÃO NA CLOUDFLARE (sites novos da fábrica)
 * --------------------------------------------------
 * Cada site novo é um Worker da Cloudflare só com arquivos estáticos (a pasta out/ do
 * build), num endereço próprio: https://<slug>.tomboprodutora.com (domínio do cliente
 * depois, à mão). Quem publica é o workflow "Publicar" (.github/workflows/publicar.yml);
 * este script tem as partes que não dependem da Cloudflare:
 *
 *   node scripts/publicar.mjs config  [--cliente cliente.json] [--base wrangler.jsonc] [--saida wrangler.publicar.json]
 *       Lê cliente.json → "publicacao" e monta a configuração do wrangler (nome do Worker,
 *       domínios). Escreve em $GITHUB_OUTPUT: pronto=true|false, motivo, worker, dominio, url.
 *       Sem "publicacao", plataforma diferente de "cloudflare" ou "liberada" ≠ true →
 *       pronto=false (o workflow só avisa e não publica nada). Sai com 1 só se a ficha
 *       estiver ERRADA (nome ou domínio inválido).
 *
 *   node scripts/publicar.mjs verificar --url https://slug.tomboprodutora.com [--tentativas 20] [--espera 30]
 *   node scripts/publicar.mjs verificar --dir out
 *       Confere o site publicado (ou a pasta out/ servida aqui mesmo, como a Cloudflare
 *       serve): a página inicial responde 200 com HTML, cada CSS/JS/imagem/fonte que ela
 *       cita (/_next/…, /img/…) responde 200 e um endereço inexistente responde 404.
 *       Primeira publicação: o domínio e o certificado levam alguns minutos — tenta de novo.
 *
 *   node scripts/publicar.mjs testar
 *       Autoteste das regras acima (usado no pull request do molde).
 *
 * Ficha (cliente.json) de um site publicado na Cloudflare:
 *   "publicacao": {
 *     "plataforma": "cloudflare",
 *     "worker": "site-padaria",                       // nome do Worker (único na conta)
 *     "dominios": ["padaria.tomboprodutora.com"],     // o 1º é o principal
 *     "liberada": true                                // false = ainda em produção: não publica
 *   }
 * Sites antigos (Vercel) não têm "publicacao": nada muda para eles.
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const comando = args[0];
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : padrao;
};

// ------------------------------------------------------------------ regras (puras)

const NOME_WORKER = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const DOMINIO = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Tira os comentários // e /* *\/ de um JSONC (fora de textos entre aspas). */
export function semComentarios(texto) {
  let saida = '';
  let i = 0;
  let aspas = false;
  while (i < texto.length) {
    const c = texto[i];
    const prox = texto[i + 1];
    if (aspas) {
      saida += c;
      if (c === '\\') {
        saida += prox ?? '';
        i += 2;
        continue;
      }
      if (c === '"') aspas = false;
      i++;
      continue;
    }
    if (c === '"') {
      aspas = true;
      saida += c;
      i++;
      continue;
    }
    if (c === '/' && prox === '/') {
      while (i < texto.length && texto[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && prox === '*') {
      const fim = texto.indexOf('*/', i + 2);
      i = fim === -1 ? texto.length : fim + 2;
      continue;
    }
    saida += c;
    i++;
  }
  // vírgula sobrando antes de } ou ] (permitida no JSONC)
  return saida.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Ficha → situação da publicação.
 * { pronto: boolean, motivo: string, erro?: string, worker?, dominios?, url? }
 * `erro` = ficha errada (o workflow falha); sem `erro` e pronto=false = só não é a hora.
 */
export function lerPublicacao(cliente) {
  const p = cliente && typeof cliente === 'object' ? cliente.publicacao : undefined;
  if (!p || typeof p !== 'object') {
    return { pronto: false, motivo: 'cliente.json não tem "publicacao": este site não é publicado na Cloudflare por este workflow (sites antigos seguem na Vercel).' };
  }
  if (p.plataforma !== 'cloudflare') {
    return { pronto: false, motivo: `cliente.json → publicacao.plataforma é "${p.plataforma ?? ''}", não "cloudflare": nada a publicar aqui.` };
  }
  const worker = String(p.worker ?? '').trim();
  if (!NOME_WORKER.test(worker)) {
    return { pronto: false, motivo: 'ficha inválida', erro: `cliente.json → publicacao.worker "${worker}" não é um nome válido de Worker (letras minúsculas, números e hífen, até 63).` };
  }
  const dominios = Array.isArray(p.dominios) ? p.dominios.map((d) => String(d ?? '').trim().toLowerCase()) : [];
  if (!dominios.length) {
    return { pronto: false, motivo: 'ficha inválida', erro: 'cliente.json → publicacao.dominios está vazio: informe ao menos o endereço principal (ex.: "padaria.tomboprodutora.com").' };
  }
  for (const d of dominios) {
    if (!DOMINIO.test(d)) {
      return { pronto: false, motivo: 'ficha inválida', erro: `cliente.json → publicacao.dominios: "${d}" não é um domínio válido (sem https:// e sem barra; ex.: padaria.tomboprodutora.com).` };
    }
  }
  if (new Set(dominios).size !== dominios.length) {
    return { pronto: false, motivo: 'ficha inválida', erro: 'cliente.json → publicacao.dominios tem domínio repetido.' };
  }
  const url = `https://${dominios[0]}`;
  if (p.liberada !== true) {
    return { pronto: false, worker, dominios, url, motivo: `o site ainda está em produção (cliente.json → publicacao.liberada não é true): ${url} não foi atualizado.` };
  }
  return { pronto: true, worker, dominios, url, motivo: `publicar em ${url}` };
}

/** Configuração final do wrangler: a base (wrangler.jsonc) + nome e domínios do cliente. */
export function montarConfig(base, pub) {
  const cfg = { ...base };
  cfg.name = pub.worker;
  cfg.workers_dev = false;
  cfg.preview_urls = false;
  cfg.routes = pub.dominios.map((d) => ({ pattern: d, custom_domain: true }));
  cfg.assets = { directory: './out', not_found_handling: '404-page', ...(base.assets ?? {}) };
  cfg.assets.directory = './out';
  if (!cfg.compatibility_date) cfg.compatibility_date = '2026-09-01';
  return cfg;
}

/** Endereços que a página inicial cita e que precisam existir (CSS, JS, imagens, fontes). */
export function recursosDaPagina(html, limite = 40) {
  const achados = new Set();
  const re = /(?:src|href|srcset|content)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    for (const parte of m[1].split(',')) {
      const url = parte.trim().split(/\s+/)[0];
      if (/^\/(?:_next\/static\/|img\/|fonts?\/|favicon)/.test(url) && !url.startsWith('//')) achados.add(url.split('#')[0]);
    }
  }
  // fontes e imagens dentro de CSS embutido: url(/_next/static/media/…)
  for (const u of html.matchAll(/url\(\s*["']?(\/_next\/static\/[^"')\s]+)["']?\s*\)/g)) achados.add(u[1]);
  return [...achados].slice(0, limite);
}

// ------------------------------------------------------------------ servidor local (como a Cloudflare serve out/)

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf',
};

/** Serve uma pasta como os "static assets" da Cloudflare: /x/ → x/index.html; sem arquivo → 404.html com 404. */
export function servirPasta(dir) {
  const raiz = path.resolve(dir);
  const servidor = http.createServer((req, res) => {
    let p;
    try {
      p = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const candidatos = p.endsWith('/') ? [path.join(raiz, p, 'index.html')] : [path.join(raiz, p), path.join(raiz, p, 'index.html'), path.join(raiz, `${p}.html`)];
    const arq = candidatos.find((c) => c.startsWith(raiz) && fs.existsSync(c) && fs.statSync(c).isFile());
    if (arq) {
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq).toLowerCase()] ?? 'application/octet-stream' });
      res.end(fs.readFileSync(arq));
      return;
    }
    const pag404 = path.join(raiz, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.existsSync(pag404) ? fs.readFileSync(pag404) : 'não encontrado');
  });
  return new Promise((resolve) => servidor.listen(0, '127.0.0.1', () => resolve({ servidor, url: `http://127.0.0.1:${servidor.address().port}` })));
}

// ------------------------------------------------------------------ conferência

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'fabrica-publicar/1.0' } });
    const corpo = Buffer.from(await r.arrayBuffer());
    return { status: r.status, tipo: r.headers.get('content-type') ?? '', corpo };
  } catch (e) {
    return { status: 0, tipo: '', corpo: Buffer.alloc(0), erro: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }
}

/** Confere a home, os arquivos que ela cita e o 404. Devolve a lista de problemas (vazia = tudo certo). */
export async function conferir(base, { tentativas = 1, esperaS = 30, log = console.log } = {}) {
  const raiz = base.replace(/\/+$/, '');
  let home;
  for (let i = 1; i <= tentativas; i++) {
    home = await pedir(`${raiz}/`);
    if (home.status === 200 && /text\/html/.test(home.tipo)) break;
    log(`  página inicial: ${home.status || home.erro} (tentativa ${i} de ${tentativas})`);
    if (i < tentativas) await esperar(esperaS * 1000);
  }
  const problemas = [];
  if (!home || home.status !== 200 || !/text\/html/.test(home.tipo)) {
    problemas.push(`${raiz}/ respondeu ${home?.status || home?.erro || 'nada'} (esperado: 200 com HTML)`);
    return { problemas, conferidos: 0 };
  }
  const html = home.corpo.toString('utf8');
  if (!/<title>[^<]+<\/title>/i.test(html)) problemas.push(`${raiz}/ não tem <title>`);
  const recursos = recursosDaPagina(html);
  if (!recursos.some((r) => r.startsWith('/_next/static/'))) problemas.push(`${raiz}/ não cita nenhum arquivo /_next/static/ (o build saiu certo?)`);
  for (const r of recursos) {
    const resp = await pedir(`${raiz}${r}`);
    if (resp.status !== 200) problemas.push(`${r} respondeu ${resp.status || resp.erro}`);
  }
  const inexistente = await pedir(`${raiz}/esta-pagina-nao-existe-${Date.now()}/`);
  if (inexistente.status !== 404) problemas.push(`um endereço inexistente respondeu ${inexistente.status || inexistente.erro} (esperado: 404)`);
  return { problemas, conferidos: recursos.length + 2 };
}

// ------------------------------------------------------------------ comandos

function saida(chave, valor) {
  const arq = process.env.GITHUB_OUTPUT;
  const linha = `${chave}=${String(valor).replace(/\r?\n/g, ' ')}\n`;
  if (arq) fs.appendFileSync(arq, linha);
}

function lerJson(arq) {
  return JSON.parse(fs.readFileSync(arq, 'utf8').replace(/^﻿/, ''));
}

async function cmdConfig() {
  const arqCliente = opcao('cliente', 'cliente.json');
  const arqBase = opcao('base', 'wrangler.jsonc');
  const arqSaida = opcao('saida', 'wrangler.publicar.json');
  let cliente = null;
  if (fs.existsSync(arqCliente)) {
    try {
      cliente = lerJson(arqCliente);
    } catch (e) {
      console.log(`::error title=Publicar::${arqCliente} não é um JSON válido (${e.message}).`);
      saida('pronto', 'false');
      process.exit(1);
    }
  }
  const pub = cliente ? lerPublicacao(cliente) : { pronto: false, motivo: 'sem cliente.json (este é o molde): nada a publicar.' };
  if (pub.erro) {
    console.log(`::error title=Publicar — ficha errada::${pub.erro}`);
    saida('pronto', 'false');
    saida('motivo', pub.erro);
    process.exit(1);
  }
  saida('pronto', pub.pronto ? 'true' : 'false');
  saida('motivo', pub.motivo);
  if (pub.worker) {
    saida('worker', pub.worker);
    saida('dominio', pub.dominios[0]);
    saida('url', pub.url);
  }
  if (!pub.pronto) {
    console.log(`Publicação pulada: ${pub.motivo}`);
    return;
  }
  const base = fs.existsSync(arqBase) ? JSON.parse(semComentarios(fs.readFileSync(arqBase, 'utf8'))) : {};
  const cfg = montarConfig(base, pub);
  fs.writeFileSync(arqSaida, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Configuração em ${arqSaida}: Worker "${cfg.name}", ${cfg.routes.map((r) => r.pattern).join(', ')}`);
}

async function cmdVerificar() {
  const dir = opcao('dir');
  let url = opcao('url');
  let local = null;
  if (dir) {
    if (!fs.existsSync(path.join(dir, 'index.html'))) {
      console.log(`::error title=Conferência::${dir}/index.html não existe (rode npm run build).`);
      process.exit(1);
    }
    local = await servirPasta(dir);
    url = local.url;
  }
  if (!url) {
    console.error('Uso: publicar.mjs verificar --url https://… | --dir out');
    process.exit(2);
  }
  const tentativas = Number(opcao('tentativas', dir ? '1' : '20'));
  const esperaS = Number(opcao('espera', '30'));
  console.log(`Conferindo ${dir ? `${dir}/ (servido em ${url})` : url}…`);
  const r = await conferir(url, { tentativas, esperaS });
  local?.servidor.close();
  if (r.problemas.length) {
    const texto = r.problemas.slice(0, 30).join(' · ');
    console.log(`::error title=Conferência do site ${dir ? 'compilado' : 'no ar'}::${texto.replace(/%/g, '%25')}`);
    process.exit(1);
  }
  console.log(`✅ ${r.conferidos} endereços conferidos: página inicial, arquivos citados e 404.`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n✅ Conferido ${dir ? 'na cópia compilada' : `no ar: ${url}`} — ${r.conferidos} endereços (home, arquivos e 404).\n`);
  }
}

async function cmdTestar() {
  let falhas = 0;
  const ok = (cond, nome) => {
    console.log(`${cond ? '✓' : '✗'} ${nome}`);
    if (!cond) falhas++;
  };
  const base = { name: 'site-molde', compatibility_date: '2026-09-01', assets: { directory: './out', not_found_handling: '404-page' } };
  ok(!lerPublicacao({ cliente: 'x' }).pronto && !lerPublicacao({ cliente: 'x' }).erro, 'sem "publicacao" (site da Vercel): não publica e não é erro');
  ok(!lerPublicacao({ publicacao: { plataforma: 'vercel' } }).pronto, 'plataforma vercel: não publica');
  const emProducao = lerPublicacao({ publicacao: { plataforma: 'cloudflare', worker: 'site-padaria', dominios: ['padaria.tomboprodutora.com'], liberada: false } });
  ok(!emProducao.pronto && !emProducao.erro && emProducao.url === 'https://padaria.tomboprodutora.com', 'liberada false: ainda em produção (não publica, sem erro)');
  const pronta = lerPublicacao({ publicacao: { plataforma: 'cloudflare', worker: 'site-padaria', dominios: ['Padaria.TomboProdutora.com', 'www.padaria.com.br'], liberada: true } });
  ok(pronta.pronto && pronta.dominios[0] === 'padaria.tomboprodutora.com', 'liberada true: publica; domínio em minúsculas');
  ok(Boolean(lerPublicacao({ publicacao: { plataforma: 'cloudflare', worker: 'Site Padaria', dominios: ['a.b.com'], liberada: true } }).erro), 'nome de Worker inválido é erro');
  ok(Boolean(lerPublicacao({ publicacao: { plataforma: 'cloudflare', worker: 'site-a', dominios: ['https://a.b.com/'], liberada: true } }).erro), 'domínio com https:// é erro');
  ok(Boolean(lerPublicacao({ publicacao: { plataforma: 'cloudflare', worker: 'site-a', dominios: [], liberada: true } }).erro), 'sem domínio é erro');
  const cfg = montarConfig(base, pronta);
  ok(cfg.name === 'site-padaria' && cfg.workers_dev === false && cfg.routes.length === 2 && cfg.routes.every((r) => r.custom_domain === true), 'config: nome e domínios próprios (custom_domain)');
  ok(cfg.assets.directory === './out' && cfg.assets.not_found_handling === '404-page', 'config: pasta out/ e página 404');
  const jsonc = '{\n // comentário\n "name": "x", /* bloco */ "a": "http://nao//e/comentario",\n}';
  ok(JSON.parse(semComentarios(jsonc)).a === 'http://nao//e/comentario', 'JSONC: tira comentários sem estragar textos com //');
  const html = '<link rel="stylesheet" href="/_next/static/css/a.css"><script src="/_next/static/chunks/b.js"></script><img src="/img/x.webp" srcset="/img/x.webp 1x, /img/y.webp 2x"><a href="https://fora.com/img/z.webp">';
  const rec = recursosDaPagina(html);
  ok(rec.includes('/_next/static/css/a.css') && rec.includes('/img/y.webp') && !rec.some((r) => r.includes('fora.com')), 'recursos da página: CSS, JS, imagens e srcset (sem links externos)');
  // conferência contra uma pasta de mentira
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'publicar-'));
  fs.mkdirSync(path.join(tmp, '_next/static/css'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '_next/static/css/a.css'), 'body{}');
  fs.writeFileSync(path.join(tmp, 'index.html'), '<html><head><title>Teste</title><link href="/_next/static/css/a.css"></head><body><img src="/img/falta.webp"></body></html>');
  fs.writeFileSync(path.join(tmp, '404.html'), 'não achei');
  const local = await servirPasta(tmp);
  const r1 = await conferir(local.url, { log: () => {} });
  ok(r1.problemas.length === 1 && r1.problemas[0].includes('/img/falta.webp'), 'conferência acusa a imagem que falta');
  fs.mkdirSync(path.join(tmp, 'img'));
  fs.writeFileSync(path.join(tmp, 'img/falta.webp'), 'x');
  const r2 = await conferir(local.url, { log: () => {} });
  ok(r2.problemas.length === 0, 'conferência passa com tudo no lugar (e o 404 responde 404)');
  local.servidor.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (falhas) {
    console.log(`::error title=Autoteste do publicar.mjs::${falhas} verificação(ões) falharam.`);
    process.exit(1);
  }
  console.log('Autoteste: tudo certo.');
}

const COMANDOS = { config: cmdConfig, verificar: cmdVerificar, testar: cmdTestar };
const executar = COMANDOS[comando];
if (!executar) {
  console.error('Uso: node scripts/publicar.mjs config | verificar --url … | verificar --dir out | testar');
  process.exit(2);
}
await executar();
