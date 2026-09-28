#!/usr/bin/env node
/**
 * HOOK "Stop" do Claude Code (configurado em .claude/settings.json).
 * Toda vez que o Claude termina de trabalhar, este script:
 *   - verifica se algo em src/, public/ ou nos JSON mudou desde o último build bom;
 *   - se mudou, roda "npm run build";
 *   - se o build QUEBRAR, devolve o erro ao Claude (código 2), que corrige sozinho
 *     antes de te entregar.
 * Assim você nunca recebe um site que não compila.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let entrada = {};
try { entrada = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* sem entrada */ }
if (entrada.stop_hook_active) process.exit(0); // evita loop infinito

// Os arquivos de redirect (vercel.json e public/_redirects) não precisam de nada
// instalado: são gerados sempre, para irem junto no commit.
spawnSync(process.execPath, ['scripts/gerar-redirects.mjs'], { stdio: 'ignore' });

// Sem node_modules (ex.: nuvem sem acesso ao npm) não dá para compilar aqui.
// Tudo bem: o GitHub Actions e a Vercel compilam a cada envio.
if (!fs.existsSync('node_modules')) process.exit(0);

const MARCA = path.join('.claude', '.ultimo-build');
const ultimo = fs.existsSync(MARCA) ? fs.statSync(MARCA).mtimeMs : 0;

function maisRecente(alvo) {
  if (!fs.existsSync(alvo)) return 0;
  const st = fs.statSync(alvo);
  if (!st.isDirectory()) return st.mtimeMs;
  let max = 0;
  for (const nome of fs.readdirSync(alvo)) max = Math.max(max, maisRecente(path.join(alvo, nome)));
  return max;
}
const alvos = ['src', 'conteudo', 'public', 'redirects.json', 'next.config.ts'];
const mudou = Math.max(...alvos.map(maisRecente)) > ultimo;
if (!mudou) process.exit(0);

const r = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', shell: process.platform === 'win32' });
if (r.status === 0) {
  fs.writeFileSync(MARCA, new Date().toISOString());
  process.exit(0);
}
const log = `${r.stdout || ''}\n${r.stderr || ''}`.trim().split('\n').slice(-40).join('\n');
process.stderr.write(`O build do site falhou. Corrija o erro abaixo antes de encerrar:\n\n${log}\n`);
process.exit(2);
