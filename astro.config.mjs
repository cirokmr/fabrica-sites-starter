// Configuração do Astro. Normalmente você NÃO precisa mexer aqui:
// o endereço do site vem de src/data/site.json.
// Os redirects (URLs antigas -> novas) ficam em redirects.json e são
// convertidos em 301 de verdade por scripts/gerar-redirects.mjs no build.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const site = JSON.parse(readFileSync('./src/data/site.json', 'utf8'));

export default defineConfig({
  site: site.seo.url,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
