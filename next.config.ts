import type { NextConfig } from 'next';

// Export 100% estático: o site não precisa de servidor. Sai tudo em ./out,
// que qualquer hospedagem estática publica (Vercel, Netlify, Cloudflare).
// O único recurso dinâmico — o formulário de contato — é resolvido no navegador.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
