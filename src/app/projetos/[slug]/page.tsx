import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NextEntry from '@/components/NextEntry';
import Detalhe from '@/components/Detalhe';
import { getProjeto, proximoDe, projetos, paramsOuVazio, descricaoCurta, contarImagens } from '@/lib/content';
import { site } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };
const t = site.projetos;

export const dynamicParams = false;

export function generateStaticParams() {
  return paramsOuVazio(projetos, (p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getProjeto(slug);
  if (!p) return {};
  const img = p.hero?.src ?? p.capa;
  return {
    title: p.titulo,
    description: descricaoCurta(p.resumo || p.subtitulo || site.descricao),
    alternates: { canonical: `/projetos/${p.slug}/` },
    openGraph: { images: img ? [{ url: img }] : undefined },
  };
}

export default async function ProjetoPage({ params }: Params) {
  const { slug } = await params;
  const p = getProjeto(slug);
  if (!p) notFound();
  const prox = proximoDe(projetos, slug);

  return (
    <>
      <article>
        <header className="detail-hero tema-escuro">
          <div className="wrap">
            <div className="detail-hero__meta mono" data-fade data-now>
              <Link href="/projetos/" className="u-link">
                {t.voltar}
              </Link>
              <span>
                {t.rotuloNumero ?? t.prefixoNumero} {p.numero}
              </span>
              {p.quando && <span>{p.quando}</span>}
              {p.tipo && <span className="muted">{p.tipo}</span>}
            </div>
            <h1 className="display fs-xxl detail-hero__title" data-split="lines" data-now>
              {p.titulo}
            </h1>
            {(p.subtitulo || p.resumo) && (
              <div className="detail-hero__row">
                <p className="serif-i fs-l detail-hero__sub" data-fade data-now data-delay="0.3">
                  {p.subtitulo}
                </p>
                <div className="detail-hero__summary" data-fade data-now data-delay="0.45">
                  {p.resumo && <p>{p.resumo}</p>}
                  {p.tags.length > 0 && (
                    <ul className="tags">
                      {p.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {p.video ? (
          <div className="detail-cover tema-escuro">
            <div className="media detail-cover__media detail-cover__media--video" data-reveal="img" data-now data-delay="0.2">
              <video src={p.video.src} poster={p.video.poster} autoPlay muted loop playsInline preload="auto" aria-label={p.titulo} />
            </div>
          </div>
        ) : (
          (p.hero || p.capa) && (
            <div className="detail-cover tema-escuro">
              <div
                className="media detail-cover__media"
                style={p.hero ? { aspectRatio: p.hero.proporcao } : undefined}
                data-reveal="img"
                data-now
                data-delay="0.2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.hero?.src ?? p.capa!} alt={`${p.titulo}${p.subtitulo ? ` — ${p.subtitulo}` : ''}`} data-parallax="0.16" fetchPriority="high" />
              </div>
            </div>
          )
        )}

        <Detalhe
          html={p.html}
          ficha={[
            { rotulo: 'Registro', valor: `${t.prefixoNumero} ${p.numero}`, grande: true },
            { rotulo: 'Quando', valor: p.quando },
            { rotulo: 'Tipo', valor: p.tipo },
            { rotulo: 'Temas', valor: p.tags.join(', ') },
            { rotulo: 'Imagens', valor: t.contarImagens && contarImagens(p.html) > 0 ? String(contarImagens(p.html)) : '' },
          ]}
        />
      </article>

      {prox.slug !== p.slug && (
        <NextEntry
          href={`/projetos/${prox.slug}/`}
          label={`${t.proximo} — ${t.prefixoNumero} ${prox.numero}`}
          title={prox.titulo}
          sub={prox.subtitulo}
          image={prox.hero?.src ?? prox.capa}
        />
      )}
    </>
  );
}
