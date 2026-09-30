#!/usr/bin/env node
/**
 * CONTROLE DE QUALIDADE (roda sobre o site já compilado em out/)
 * ---------------------------------------------------------------
 *   npm run build && npm run checar
 *
 * Confere, sem depender de ninguém lembrar:
 *   1. SEO básico de cada página (title, description, 1 único h1, lang, canonical)
 *   2. Imagens sem "alt" e imagens pesadas demais
 *   3. Links internos e imagens quebradas
 *   4. Toda URL do site antigo tem destino (página nova ou redirect 301)
 *   5. O texto do site antigo foi aproveitado (cobertura de conteúdo)
 *   6. Sobras do molde (textos de exemplo que ninguém trocou)
 *
 * Gera relatorio-qa.md. Sai com código 1 se houver ERROS (bom para automação).
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('out'); // saída do next build (export estático)
const EXTRAIDO = path.resolve('extraido');
const LIMITE_IMAGEM_KB = 300;
const COBERTURA_MINIMA = 0.7;

const erros = [];
const avisos = [];
// avisos repetidos em muitas páginas (títulos longos das notícias antigas…) viram UMA linha
const agrupados = new Map();
const agrupar = (tipo, rota, detalhe) => {
  if (!agrupados.has(tipo)) agrupados.set(tipo, []);
  agrupados.get(tipo).push(`${rota} (${detalhe})`);
};
const infos = [];
const erro = (m) => erros.push(m);
const ehCliente = fs.existsSync('cliente.json');
const aviso = (m) => avisos.push(m);

if (!fs.existsSync(DIST)) {
  console.error('❌ Pasta out/ não existe. Rode "npm run build" antes de "npm run checar".');
  process.exit(1);
}

// ---------- utilidades ----------
function listar(dir, filtro) {
  const saida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...listar(p, filtro));
    else if (filtro(p)) saida.push(p);
  }
  return saida;
}

const rotaDe = (arquivo) => {
  let r = '/' + path.relative(DIST, arquivo).split(path.sep).join('/');
  r = r.replace(/index\.html$/, '').replace(/\.html$/, '');
  return r === '' ? '/' : r;
};

function existeNoDist(caminho) {
  let p = decodeURIComponent(caminho.split('#')[0].split('?')[0]);
  if (!p || p === '/') return fs.existsSync(path.join(DIST, 'index.html'));
  p = p.replace(/^\//, '');
  const alvo = path.join(DIST, p);
  return (
    (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) ||
    fs.existsSync(path.join(alvo, 'index.html')) ||
    fs.existsSync(alvo.replace(/\/$/, '') + '.html')
  );
}

const atributo = (tag, nome) => {
  const m = tag.match(new RegExp(`\\s${nome}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
};

const decodificar = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

const textoVisivel = (html) => decodificar(
  html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '),
);

const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- 1-3: páginas ----------
const paginas = listar(DIST, (p) => p.endsWith('.html') && !p.includes(`${path.sep}_next${path.sep}`) && !p.includes('_vazio') && !p.includes(`${path.sep}prancha${path.sep}`));
const titulos = new Map();
let textoDoSiteNovo = '';

for (const arq of paginas) {
  const html = fs.readFileSync(arq, 'utf8');
  const rota = rotaDe(arq);
  // páginas de redirecionamento geradas pelo Astro não contam
  if (/http-equiv=["']?refresh/i.test(html) && html.length < 1500) continue;

  textoDoSiteNovo += ' ' + textoVisivel(html);
  const e404 = /^\/(404|_not-found)(\/|$)/.test(rota);

  const titulo = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
  if (!titulo) erro(`${rota}: sem <title>`);
  else {
    if (titulo.length > 65) agrupar('título longo (ideal até 60 caracteres)', rota, titulo.length);
    if (!e404) {
      if (titulos.has(titulo)) aviso(`${rota}: título repetido de ${titulos.get(titulo)} ("${titulo}")`);
      titulos.set(titulo, rota);
    }
  }

  const metaDesc = (html.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [])[0];
  const desc = metaDesc ? atributo(metaDesc, 'content') : null;
  if (!desc) erro(`${rota}: sem meta description`);
  else if (desc.length < 50 || desc.length > 165) agrupar('meta description fora do ideal (50–160 caracteres)', rota, desc.length);

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s === 0) erro(`${rota}: nenhum <h1>`);
  if (h1s > 1) aviso(`${rota}: ${h1s} <h1> na mesma página (ideal: 1)`);

  if (!/<html[^>]+lang=/i.test(html)) erro(`${rota}: <html> sem atributo lang`);
  if (!e404 && !/rel=["']canonical["']/i.test(html)) aviso(`${rota}: sem link canonical`);

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = atributo(tag, 'src') || '';
    if (atributo(tag, 'alt') === null) erro(`${rota}: imagem sem alt → ${src}`);
    if (src.startsWith('/') && !src.startsWith('//')) {
      if (!existeNoDist(src)) erro(`${rota}: imagem não encontrada → ${src}`);
      else {
        const kb = fs.statSync(path.join(DIST, decodeURIComponent(src.split('?')[0]))).size / 1024;
        if (kb > LIMITE_IMAGEM_KB) aviso(`${rota}: imagem pesada (${Math.round(kb)} KB) → ${src}. Rode "npm run imagens".`);
      }
    }
  }

  for (const tag of html.match(/<a\b[^>]*>/gi) || []) {
    const href = atributo(tag, 'href');
    if (href === null) continue;
    if (!href || href === '#') { aviso(`${rota}: link vazio (href="${href}")`); continue; }
    if (/^(https?:)?\/\//i.test(href) || /^(mailto|tel|javascript):/i.test(href) || href.startsWith('#')) continue;
    const absoluto = href.startsWith('/') ? href : new URL(href, 'http://x' + rota).pathname;
    if (!existeNoDist(absoluto)) erro(`${rota}: link quebrado → ${href}`);
  }

  const og = (html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i) || [])[0];
  const ogUrl = og ? atributo(og, 'content') : null;
  if (ogUrl) {
    try {
      const p = new URL(ogUrl).pathname;
      if (!existeNoDist(p)) aviso(`${rota}: imagem de compartilhamento (og:image) não existe → ${p}`);
    } catch { /* ignore */ }
  }

  // No próprio molde (sem cliente.json) o texto de exemplo é esperado.
  if (ehCliente) for (const sobra of ['Estúdio Exemplo', 'exemplo.com.br', 'Imagem de exemplo', 'IMAGEM DE EXEMPLO', '/img/exemplo/', 'Cidade Exemplo', 'Lorem ipsum']) {
    if (html.includes(sobra)) { erro(`${rota}: ainda tem texto do molde ("${sobra}")`); break; }
  }
}
infos.push(`${paginas.length} página(s) HTML verificadas`);

// ---------- 4: URLs antigas ----------
const arqUrls = path.join(EXTRAIDO, 'urls-antigas.json');
if (fs.existsSync(arqUrls)) {
  const antigas = JSON.parse(fs.readFileSync(arqUrls, 'utf8'));
  const { redirects = {} } = JSON.parse(fs.readFileSync('redirects.json', 'utf8'));
  const semBarra = (s) => (s.length > 1 ? s.replace(/\/$/, '') : s);
  const destinos = new Set(Object.keys(redirects).map(semBarra));
  let cobertas = 0;
  for (const u of antigas) {
    if (u.status && u.status >= 400) continue; // já estava quebrada no site antigo
    const c = semBarra(u.caminho || '/');
    const cSemQuery = semBarra(c.split('?')[0]);
    if (destinos.has(c) || destinos.has(cSemQuery) || existeNoDist(cSemQuery)) cobertas++;
    else erro(`URL antiga sem destino: ${u.caminho} → crie a página ou adicione em redirects.json`);
  }
  for (const [de, para] of Object.entries(redirects)) {
    if (!existeNoDist(para) && !/^https?:/.test(para)) erro(`redirect ${de} aponta para página inexistente: ${para}`);
  }
  infos.push(`${cobertas}/${antigas.filter((u) => !(u.status >= 400)).length} URLs antigas com destino`);
} else {
  aviso('extraido/urls-antigas.json não existe — rode "npm run extrair -- URL" para checar redirects e conteúdo');
}

// ---------- 5: cobertura de conteúdo ----------
const dirPaginas = path.join(EXTRAIDO, 'paginas');
if (fs.existsSync(dirPaginas)) {
  const novo = normalizar(textoDoSiteNovo);
  const linhaTabela = ['| Página antiga | Trechos encontrados no site novo |', '|---|---|'];
  // listagens (home antiga, categorias, arquivos por mês) só repetem as matérias
  const ehListagem = (f) => /^(category|tag|author|page)__|^\d{4}__\d{2}\.md$|^\d{4}\.md$/.test(f);
  for (const arq of fs.readdirSync(dirPaginas).filter((f) => f.endsWith('.md') && !ehListagem(f))) {
    const corpo = fs.readFileSync(path.join(dirPaginas, arq), 'utf8').replace(/^---[\s\S]*?---/, '');
    const trechos = corpo.split('\n')
      .map((l) => l.trim())
      // parágrafos de texto de verdade: tira títulos, imagens, tabelas, citações e linhas
      // que são só links (navegação "anterior/próxima" do WordPress, menus, rodapés)
      .filter((l) => l.length > 60 && !/^(#|!\[|\||>|\[)/.test(l))
      .filter((l) => l.replace(/\[([^\]]*)\]\([^)]*\)/g, '').replace(/[\s·|—-]/g, '').length > 40)
      .map((l) => normalizar(l.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '')).slice(0, 60))
      .filter((t) => t.length > 30);
    if (!trechos.length) continue;
    const achados = trechos.filter((t) => novo.includes(t)).length;
    const pct = achados / trechos.length;
    linhaTabela.push(`| ${arq} | ${Math.round(pct * 100)}% (${achados}/${trechos.length}) |`);
    if (pct < COBERTURA_MINIMA) {
      aviso(`Conteúdo: só ${Math.round(pct * 100)}% dos parágrafos de ${arq} aparecem no site novo (texto reescrito ou faltando?)`);
    }
  }
  infos.push('Cobertura de conteúdo:\n\n' + linhaTabela.join('\n'));
}

for (const [tipo, lista] of agrupados) {
  aviso(`${lista.length} página(s) com ${tipo}: ${lista.slice(0, 4).join(', ')}${lista.length > 4 ? ` e mais ${lista.length - 4}` : ''}`);
}

// ---------- relatório ----------
const status = erros.length ? '❌ REPROVADO' : avisos.length ? '⚠️ APROVADO COM AVISOS' : '✅ APROVADO';
const relatorio = `# Relatório de qualidade — ${status}

Gerado em ${new Date().toLocaleString('pt-BR')}

## Erros (${erros.length}) — precisam ser corrigidos
${erros.map((e) => `- ${e}`).join('\n') || 'Nenhum.'}

## Avisos (${avisos.length}) — revisar
${avisos.map((a) => `- ${a}`).join('\n') || 'Nenhum.'}

## Resumo
${infos.map((i) => `- ${i}`).join('\n')}

## Não é checado aqui (faça manualmente ou com o agente revisor)
- Nota do Lighthouse / PageSpeed (meta: 90+ em Performance, SEO e Acessibilidade)
- Aparência no celular comparada com os screenshots em extraido/screenshots/
- Formulário enviando de verdade
`;
fs.writeFileSync('relatorio-qa.md', relatorio);

console.log(`\n${status}`);
console.log(`   ${erros.length} erro(s), ${avisos.length} aviso(s)`);
erros.slice(0, 15).forEach((e) => console.log('   ❌ ' + e));
if (erros.length > 15) console.log(`   ... e mais ${erros.length - 15}`);
avisos.slice(0, 10).forEach((a) => console.log('   ⚠️  ' + a));
if (avisos.length > 10) console.log(`   ... e mais ${avisos.length - 10}`);
console.log('\n   Relatório completo: relatorio-qa.md\n');
process.exit(erros.length ? 1 : 0);
