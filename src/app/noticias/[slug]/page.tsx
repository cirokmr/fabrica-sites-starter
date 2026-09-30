import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NextEntry from '@/components/NextEntry';
import Detalhe from '@/components/Detalhe';
import { getNoticia, noticias, proximoDe, paramsOuVazio, descricaoCurta } from '@/lib/content';
import { site } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };
const t = site.noticias;

export const dynamicParams = false;

export function generateStaticParams() {
  return paramsOuVazio(noticias, (n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const n = getNoticia(slug);
  if (!n) return {};
  return {
    title: n.titulo,
    description: descricaoCurta(n.resumo),
    alternates: { canonical: `/noticias/${n.slug}/` },
    openGraph: { type: 'article', publishedTime: n.data, images: n.capa ? [{ url: n.capa }] : undefined },
  };
}

export default async function NoticiaPage({ params }: Params) {
  const { slug } = await params;
  const n = getNoticia(slug);
  if (!n) notFound();
  const prox = proximoDe(noticias, slug);

  return (
    <>
      <article>
        <header className="detail-hero tema-escuro">
          <div className="wrap">
            <div className="detail-hero__meta mono" data-fade data-now>
              <Link href="/noticias/" className="u-link">
                {t.voltar}
              </Link>
              <time dateTime={n.data}>{n.dataFmt}</time>
              {n.categorias.length > 0 && <span className="muted">{n.categorias.join(' · ')}</span>}
            </div>
            <h1 className="title-long fs-xl detail-hero__title" data-split="lines" data-now>
              {n.titulo}
            </h1>
            {n.resumo && (
              <p className="detail-hero__excerpt fs-m muted" data-fade data-now data-delay="0.35">
                {n.resumo}
              </p>
            )}
          </div>
        </header>

        {n.capa && n.tipo !== 'clipping' && (
          <div className="detail-cover tema-escuro">
            <div
              className={`media detail-cover__media detail-cover__media--post${t.capaInteira ? ' detail-cover__media--inteira' : ''}`}
              data-reveal="img"
              data-now
              data-delay="0.2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.capa} alt="" data-parallax={t.capaInteira ? undefined : '0.14'} fetchPriority="high" />
            </div>
          </div>
        )}

        <Detalhe
          html={n.html}
          ficha={[
            { rotulo: 'Publicado', valor: n.dataFmt },
            { rotulo: 'Tipo', valor: n.tipo === 'clipping' ? 'Na imprensa' : '' },
            { rotulo: 'Arquivado em', valor: n.categorias.join(', ') },
          ]}
        />
      </article>

      {prox.slug !== n.slug && (
        <NextEntry href={`/noticias/${prox.slug}/`} label={`${t.proximo} — ${prox.dataFmt}`} title={prox.titulo} image={prox.capa} long cta="Ler" />
      )}
    </>
  );
}
