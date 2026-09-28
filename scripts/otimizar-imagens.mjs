#!/usr/bin/env node
/**
 * Converte as imagens originais do site antigo (extraido/imagens, fora do Git)
 * em WebP otimizado (largura máx. 1920px) dentro de extraido/imagens-web/,
 * que VAI para o Git. O /reconstruir copia de lá para public/imagens só as
 * imagens que o site novo realmente usa.
 *
 *   npm run imagens              -> converte todas
 *   npm run imagens -- foto.jpg  -> converte só as indicadas
 *
 * SVG e ICO são copiados sem conversão. Gera extraido/imagens-web/mapa-imagens.json
 * (nome original -> nome otimizado).
 */
import { carregar } from './carregar.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sharp = (await carregar('sharp')).default;

const ORIGEM = path.resolve('extraido/imagens');
const DESTINO = path.resolve('extraido/imagens-web');
const LARGURA_MAX = 1920;
const QUALIDADE = 78;

if (!fs.existsSync(ORIGEM)) {
  console.error('❌ extraido/imagens não existe. Rode "npm run extrair -- URL" primeiro.');
  process.exit(1);
}
fs.mkdirSync(DESTINO, { recursive: true });

const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const arquivos = fs.readdirSync(ORIGEM).filter((f) => !pedidos.length || pedidos.includes(f));
const mapaArq = path.join(DESTINO, 'mapa-imagens.json');
const mapa = fs.existsSync(mapaArq) ? JSON.parse(fs.readFileSync(mapaArq, 'utf8')) : {};
let antes = 0, depois = 0;

for (const nome of arquivos) {
  const origem = path.join(ORIGEM, nome);
  const ext = path.extname(nome).toLowerCase();
  const tamanhoOriginal = fs.statSync(origem).size;
  try {
    if (['.svg', '.ico'].includes(ext)) {
      fs.copyFileSync(origem, path.join(DESTINO, nome));
      mapa[nome] = nome;
      continue;
    }
    const novoNome = nome.replace(/\.[a-z0-9]+$/i, '') + '.webp';
    const info = await sharp(origem, { animated: ext === '.gif' })
      .rotate()
      .resize({ width: LARGURA_MAX, withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toFile(path.join(DESTINO, novoNome));
    mapa[nome] = novoNome;
    antes += tamanhoOriginal;
    depois += info.size;
    console.log(`   ✓ ${nome} → ${novoNome}  (${Math.round(tamanhoOriginal / 1024)} KB → ${Math.round(info.size / 1024)} KB, ${info.width}x${info.height})`);
  } catch (e) {
    console.log(`   ✗ ${nome}: ${e.message}`);
  }
}

fs.writeFileSync(mapaArq, JSON.stringify(mapa, null, 2));
if (antes) console.log(`\n✅ ${Math.round(antes / 1024)} KB → ${Math.round(depois / 1024)} KB (${Math.round((1 - depois / antes) * 100)}% menor)`);
console.log('   Imagens otimizadas em extraido/imagens-web/ (mapa em mapa-imagens.json)');
