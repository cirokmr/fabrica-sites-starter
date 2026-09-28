import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { noticias, paginas, projetos } from '@/lib/content';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (p: string) => new URL(p, site.url).href;
  return [
    { url: url('/'), priority: 1 },
    ...paginas.map((p) => ({ url: url(`/${p.slug}/`), priority: 0.8 })),
    ...(projetos.length ? [{ url: url('/projetos/'), priority: 0.8 }] : []),
    ...projetos.map((p) => ({ url: url(`/projetos/${p.slug}/`), priority: 0.7 })),
    ...(noticias.length ? [{ url: url('/noticias/'), priority: 0.7 }] : []),
    ...noticias.map((n) => ({ url: url(`/noticias/${n.slug}/`), lastModified: n.data, priority: 0.6 })),
    { url: url('/contato/'), priority: 0.6 },
  ];
}
