#!/usr/bin/env node
/**
 * FASE 7 — PRODUÇÃO EM LOTE (use só depois de fazer alguns sites no modo manual!)
 * ------------------------------------------------------------------------------
 * Lê lote.txt (uma linha por cliente: "nome-do-cliente https://siteantigo.com.br")
 * e, para cada um, sem você digitar nada:
 *   1. cria a pasta do cliente a partir do molde
 *   2. npm install
 *   3. extrai o site antigo
 *   4. chama o Claude Code em modo headless para reconstruir e revisar
 *   5. roda o controle de qualidade e anota o resultado em lote-resultado.csv
 *
 *   npm run lote              (usa lote.txt)
 *   npm run lote -- outro.txt
 *
 * Você recebe RASCUNHOS prontos para revisão humana — nunca publique sem olhar.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arquivoLista = process.argv[2] || 'lote.txt';
if (!fs.existsSync(arquivoLista)) {
  console.error(`❌ ${arquivoLista} não encontrado. Crie com uma linha por cliente:\n   padaria-do-joao https://www.padariadojoao.com.br`);
  process.exit(1);
}

const MOLDE = process.cwd();
const winShell = process.platform === 'win32';
const rodar = (cmd, args, cwd) => {
  console.log(`   $ ${cmd} ${args.join(' ')}`);
  return spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: winShell }).status === 0;
};

const PROMPT = [
  'Você está numa pasta de cliente da fábrica de sites. Siga o CLAUDE.md.',
  'O site antigo já foi extraído em extraido/.',
  'Execute a skill reconstruir por completo e depois a skill revisar.',
  'Não pergunte nada: se faltar informação, deixe anotado em PENDENCIAS.md.',
].join(' ');

const linhas = fs.readFileSync(arquivoLista, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const csv = ['cliente,site_antigo,etapa_final,qa,inicio,fim'];

for (const linha of linhas) {
  const [nome, url] = linha.split(/\s+/);
  if (!nome || !/^https?:\/\//.test(url || '')) {
    console.log(`⚠️  Linha ignorada (formato: nome https://site): ${linha}`);
    continue;
  }
  const pasta = path.resolve(MOLDE, '..', 'clientes', nome);
  const inicio = new Date().toISOString();
  console.log(`\n==================== ${nome} ====================`);
  let etapa = 'criar';
  let qa = '-';

  if (rodar('node', ['scripts/novo-cliente.mjs', nome, url], MOLDE)) {
    etapa = 'instalar';
    if (rodar('npm', ['install'], pasta)) {
      etapa = 'extrair';
      if (rodar('node', ['scripts/extrair.mjs', url], pasta)) {
        etapa = 'reconstruir';
        // Claude Code headless: -p = executa o pedido e sai.
        // acceptEdits = pode criar/editar arquivos; os comandos liberados estão em .claude/settings.json
        if (rodar('claude', ['-p', PROMPT, '--permission-mode', 'acceptEdits'], pasta)) {
          etapa = 'checar';
          rodar('npm', ['run', 'build'], pasta);
          qa = rodar('node', ['scripts/checar.mjs'], pasta) ? 'aprovado' : 'com-erros';
          etapa = 'pronto-para-revisao-humana';
        }
      }
    }
  }
  csv.push([nome, url, etapa, qa, inicio, new Date().toISOString()].join(','));
  fs.writeFileSync('lote-resultado.csv', csv.join('\n') + '\n');
}

console.log('\n✅ Lote finalizado. Veja lote-resultado.csv');
