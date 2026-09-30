import type { Metadata, Viewport } from 'next';
// Fontes self-hosted (sem requisição externa). Para trocar, instale o pacote
// @fontsource do novo tipo e ajuste os imports abaixo + os tokens --font-* no CSS.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import '@/styles/tema.css';
import '@/styles/components.css';
import '@/styles/home.css';
import '@/styles/pages.css';

import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import Curtain from '@/components/Curtain';
import Cursor from '@/components/Cursor';
import SmootherInit from '@/components/SmootherInit';
import { site } from '@/lib/site';
import { noticias, projetos, preencher } from '@/lib/content';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.nomeCompleto}`, template: `%s — ${site.nome}` },
  description: site.descricao,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.nomeCompleto,
    images: [{ url: site.seo.og, width: 1200, height: 630, alt: site.seo.ogAlt }],
  },
  // site.json → icones (PNG em vários tamanhos + ícone da Apple); sem isso, /img/favicon.svg
  icons: site.icones
    ? {
        icon: site.icones.icon.map((i) => ({ url: i.src, ...(i.tamanho ? { sizes: i.tamanho } : {}) })),
        ...(site.icones.apple ? { apple: site.icones.apple } : {}),
      }
    : { icon: '/img/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: site.corTema,
  width: 'device-width',
  initialScale: 1,
};

// Roda antes da pintura: marca JS ativo, visita repetida (pula a abertura)
// e preferência por menos movimento.
const INIT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('site-intro'))d.classList.add('intro-seen')}catch(e){}if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('reduced')})();`;
const SEM_INTRO = `document.documentElement.classList.add('intro-seen');`;

// Dados estruturados (Schema.org): ajudam o Google a mostrar nome, contato e redes.
const schema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.nomeCompleto,
  url: site.url,
  description: site.descricao,
  email: site.contato.email || undefined,
  telephone: site.contato.telefone || undefined,
  address: site.contato.endereco || undefined,
  sameAs: site.redes.map((r) => r.href),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const contagens: Record<string, number> = { '/projetos/': projetos.length, '/noticias/': noticias.length };
  return (
    <html lang="pt-BR" className={`fotos-${site.fotos?.tratamento ?? 'natural'}${site.fotos?.hero === 'natural' ? ' hero-natural' : ''}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INIT + (site.intro.ativa ? '' : SEM_INTRO) }} />
        {/* "<" escapado: um texto com "</script>" no site.json não fecha a tag antes da hora */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      </head>
      <body>
        <SmootherInit />
        <a className="skip-link" href="#main">
          Pular para o conteúdo
        </a>
        {site.intro.ativa && <Loader esquerda={preencher(site.intro.esquerda)} direita={preencher(site.intro.direita)} rotulo={site.intro.rotulo} />}
        <Nav contagens={contagens} />
        <Curtain />
        <Cursor />
        <div className="grain" aria-hidden="true" />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <main id="main">{children}</main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
