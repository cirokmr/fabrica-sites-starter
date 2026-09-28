#!/usr/bin/env node
/**
 * BUSCAR FOTOS — procura fotos de licença livre no Wikimedia Commons, para quando as
 * fotos do cliente são pequenas ou fracas (ex.: paisagem da cidade para o hero).
 * Precisa de internet: roda no workflow "Buscar fotos" do GitHub Actions.
 *
 *   node scripts/buscar-fotos.mjs --termos "Presidente Getúlio; Vale do Itajaí" [--min 1800] [--max 12]
 *
 * Saída em fotos-candidatas/:
 *   NN-<nome>.jpg      a foto em até 2400 px de largura
 *   folha.jpg          miniaturas numeradas (para escolher olhando)
 *   creditos.json      título, autor, licença e página de cada foto (o crédito é obrigatório
 *                      nas licenças CC BY / CC BY-SA)
 *
 * Só entram fotos na horizontal, com largura mínima e licença livre (CC0, domínio
 * público, CC BY, CC BY-SA). Nunca use foto de outro lugar como se fosse do cliente:
 * paisagem da região é contexto; foto de "trabalho do cliente" tem que ser do cliente.
 */
import fs from 'node:fs';
import path from 'node:path';
import { carregar } from './carregar.mjs';

const sharp = (await carregar('sharp')).default;

const arg = (n, padrao) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};
const termos = arg('termos', process.env.TERMOS || '').split(';').map((t) => t.trim()).filter(Boolean);
const MIN = Number(arg('min', process.env.MIN_LARGURA || 1800));
const MAX = Number(arg('max', process.env.MAX_POR_TERMO || 12));
if (!termos.length) { console.error('❌ Informe --termos "termo 1; termo 2"'); process.exit(1); }

const DEST = path.join(process.cwd(), 'fotos-candidatas');
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const UA = 'FabricaDeSites/1.0 (https://github.com/cirokmr/fabrica-sites-starter; busca de fotos livres)';
const API = 'https://commons.wikimedia.org/w/api.php';
const semHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const LIVRE = /^(cc0|pd|public domain|domínio público|cc[ -]by(-sa)?[ -]\d)/i;

async function buscar(termo) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2',
    generator: 'search', gsrsearch: `${termo} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '40',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '2400',
  });
  const r = await fetch(`${API}?${q}`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`Commons respondeu ${r.status}`);
  const j = await r.json();
  return (j.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

const vistas = new Set();
const creditos = [];
let n = 0;
for (const termo of termos) {
  let paginas = [];
  try { paginas = await buscar(termo); } catch (e) { console.warn(`⚠️  ${termo}: ${e.message}`); continue; }
  let deste = 0;
  for (const p of paginas) {
    const ii = p.imageinfo?.[0];
    if (!ii || vistas.has(p.title)) continue;
    const meta = ii.extmetadata ?? {};
    const licenca = semHtml(meta.LicenseShortName?.value || meta.License?.value);
    if (!/image\/(jpeg|png)/.test(ii.mime) || ii.width < MIN || ii.width < ii.height * 1.2 || !LIVRE.test(licenca)) continue;
    vistas.add(p.title);
    n += 1;
    const nome = `${String(n).padStart(2, '0')}-${p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50).replace(/^-|-$/g, '')}.jpg`;
    try {
      const r = await fetch(ii.thumburl || ii.url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(String(r.status));
      await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(path.join(DEST, nome));
    } catch (e) { console.warn(`⚠️  não baixei ${p.title}: ${e.message}`); n -= 1; continue; }
    creditos.push({
      n, arquivo: nome, termo,
      titulo: p.title.replace(/^File:/, ''),
      descricao: semHtml(meta.ImageDescription?.value).slice(0, 300),
      autor: semHtml(meta.Artist?.value) || 'autor desconhecido',
      licenca,
      licencaUrl: meta.LicenseUrl?.value || '',
      creditoObrigatorio: meta.AttributionRequired?.value !== 'false',
      pagina: ii.descriptionurl,
      larguraOriginal: ii.width, alturaOriginal: ii.height,
    });
    console.log(`   ${n}. ${p.title} (${ii.width}×${ii.height}, ${licenca})`);
    if (++deste >= MAX) break;
  }
}
fs.writeFileSync(path.join(DEST, 'creditos.json'), JSON.stringify(creditos, null, 2));
if (!creditos.length) { console.log('Nenhuma foto encontrada com esses critérios.'); process.exit(0); }

// folha de miniaturas numeradas
const T = { w: 480, h: 320, rot: 30 };
const cols = 4;
const linhas = Math.ceil(creditos.length / cols);
const pecas = [];
for (const [i, c] of creditos.entries()) {
  const x = (i % cols) * T.w, y = Math.floor(i / cols) * (T.h + T.rot);
  pecas.push({ input: await sharp(path.join(DEST, c.arquivo)).resize(T.w, T.h, { fit: 'cover' }).toBuffer(), left: x, top: y + T.rot });
  const rot = `${c.n} · ${c.licenca} · ${c.larguraOriginal}px`.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  pecas.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${T.w}" height="${T.rot}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="21" font-family="DejaVu Sans, Arial" font-size="16" fill="#fff">${rot}</text></svg>`), left: x, top: y });
}
await sharp({ create: { width: cols * T.w, height: linhas * (T.h + T.rot), channels: 3, background: '#333' } })
  .composite(pecas).jpeg({ quality: 78 }).toFile(path.join(DEST, 'folha.jpg'));
console.log(`\n✅ ${creditos.length} foto(s) em fotos-candidatas/ (veja folha.jpg e creditos.json)`);
