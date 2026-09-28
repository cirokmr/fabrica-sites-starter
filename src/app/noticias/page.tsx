import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import HoverList from '@/components/HoverList';
import { noticias, noticiasPorAno, periodo } from '@/lib/content';
import { site } from '@/lib/site';

const t = site.noticias;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descricao,
  alternates: { canonical: '/noticias/' },
};

export default function NoticiasPage() {
  const intervalo = periodo.de && periodo.de !== periodo.ate ? `${periodo.de} — ${periodo.ate}` : periodo.ate;
  return (
    <>
      <PageHero
        eyebrow={t.rotulo.replace('{n}', String(noticias.length))}
        title={t.titulo}
        accent={t.destaque ?? intervalo}
        lead={t.lead}
      />
      <section className="section tema-escuro section--flush-top">
        <div className="wrap">
          {noticiasPorAno().map(([ano, posts]) => (
            <div className="year" key={ano}>
              <div className="year__label">
                <span className="display fs-xl" data-split="chars">
                  {ano}
                </span>
                <span className="mono muted">{String(posts.length).padStart(2, '0')} registros</span>
              </div>
              <HoverList
                cursor={t.cursor ?? 'Ler'}
                items={posts.map((n) => ({
                  href: `/noticias/${n.slug}/`,
                  title: n.titulo,
                  lead: n.dataFmt,
                  meta: n.categorias.slice(0, 2).join(' · '),
                  image: n.capa,
                }))}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
