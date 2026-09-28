// Carrega um pacote do projeto (node_modules) ou, se não estiver instalado,
// a versão global do ambiente (útil na nuvem, onde o Playwright e o sharp já
// vêm instalados e às vezes o "npm install" não é permitido).
import { execSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

export async function carregar(pacote) {
  try {
    return await import(pacote);
  } catch { /* não está no projeto: tenta o global */ }
  try {
    const raiz = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const pasta = path.join(raiz, pacote);
    const entrada = ['index.mjs', 'lib/index.js', 'index.js'].map((f) => path.join(pasta, f)).find(existsSync);
    if (entrada) return await import(pathToFileURL(entrada).href);
  } catch { /* segue para o erro */ }
  console.error(`❌ O pacote "${pacote}" não está instalado. Rode "npm install" (e, para o extrator, "npx playwright install chromium").`);
  process.exit(1);
}
