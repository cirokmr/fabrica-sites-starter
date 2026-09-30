import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Detalhe from '@/components/Detalhe';
import { getPagina, paginas, paramsOuVazio, descricaoCurta } from '@/lib/content';

// Páginas institucionais: cada arquivo em conteudo/paginas/<slug>.md vira /<slug>/.
type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return paramsOuVazio(paginas, (p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getPagina(slug);
  if (!p) return {};
  return {
    title: p.titulo,
    description: descricaoCurta(p.descricao),
    alternates: { canonical: `/${p.slug}/` },
    openGraph: { images: p.capa ? [{ url: p.capa }] : undefined },
  };
}

export default async function Pagina({ params }: Params) {
  const { slug } = await params;
  const p = getPagina(slug);
  if (!p) notFound();

  return (
    <article>
      <header className="page-hero tema-escuro">
        <div className="wrap">
          {p.rotulo && (
            <p className="mono eyebrow muted" data-fade data-now>
              {p.rotulo}
            </p>
          )}
          <h1 className="page-hero__title">
            <span className="display fs-xxl" data-split="chars" data-now>
              {p.titulo}
            </span>
            {p.destaque && (
              <span className="serif-i fs-xl accent" data-split="words" data-now data-delay="0.35">
                {p.destaque}
              </span>
            )}
          </h1>
          {p.lead && (
            <p className="page-hero__lead fs-m" data-fade data-now data-delay="0.5">
              {p.lead}
            </p>
          )}
        </div>
      </header>

      {p.capa && (
        <div className="detail-cover tema-escuro">
          <div className="media detail-cover__media" data-reveal="img" data-now data-delay="0.2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.capa} alt="" data-parallax="0.16" fetchPriority="high" />
          </div>
        </div>
      )}

      <Detalhe html={p.html} ficha={[]} />
    </article>
  );
}
