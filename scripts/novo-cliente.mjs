#!/usr/bin/env node
/**
 * Cria a pasta de um novo cliente copiando este molde.
 *
 *   npm run novo -- padaria-do-joao
 *   npm run novo -- padaria-do-joao https://www.padariadojoao.com.br
 *
 * Resultado: ../clientes/padaria-do-joao/  (fora da pasta do molde).
 * Se passar a URL, ela fica anotada em cliente.json para o /extrair usar.
 */
import fs from 'node:fs';
import path from 'node:path';

const [nome, url] = process.argv.slice(2);
if (!nome || !/^[a-z0-9-]+$/.test(nome)) {
  console.error('Uso: npm run novo -- nome-do-cliente [https://siteantigo.com.br]');
  console.error('     (nome só com letras minúsculas, números e hífen)');
  process.exit(1);
}

const MOLDE = process.cwd();
const DESTINO = path.resolve(MOLDE, '..', 'clientes', nome);
if (fs.existsSync(DESTINO)) {
  console.error(`❌ Já existe: ${DESTINO}`);
  process.exit(1);
}

const IGNORAR = new Set(['node_modules', 'out', '.next', 'dist', 'extraido', '.git', 'relatorio-qa.md', 'clientes', '.ultimo-build', 'settings.local.json', 'lote.txt', 'lote-resultado.csv']);
fs.cpSync(MOLDE, DESTINO, {
  recursive: true,
  filter: (origem) => !IGNORAR.has(path.basename(origem)),
});

// ficha do cliente — a "ordem de produção" deste site
const ficha = {
  cliente: nome,
  site_antigo: url || '',
  criado_em: new Date().toISOString().slice(0, 10),
  status: 'criado', // criado -> extraido -> reconstruido -> revisado -> aprovado -> publicado
  observacoes: '',
};
fs.writeFileSync(path.join(DESTINO, 'cliente.json'), JSON.stringify(ficha, null, 2) + '\n');

const pkgArq = path.join(DESTINO, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgArq, 'utf8'));
pkg.name = nome;
fs.writeFileSync(pkgArq, JSON.stringify(pkg, null, 2) + '\n');

console.log(`✅ Cliente criado em ${DESTINO}

Próximos passos:
  cd ${path.relative(MOLDE, DESTINO)}
  npm install
  claude              (e dentro dele: /extrair${url ? '' : ' https://siteantigo...'}, depois /reconstruir e /revisar)
`);
