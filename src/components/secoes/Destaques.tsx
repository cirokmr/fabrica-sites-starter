import Link from 'next/link';
import type { SecaoDestaques } from '@/lib/site';
import type { Noticia } from '@/lib/content';

// Três (ou N) notícias recentes em cartões com foto.
export default function Destaques({ dados, noticias, total }: { dados: SecaoDestaques; noticias: Noticia[]; total: number }) {
  if (!noticias.length) return null;
  return (
    <section className={`section tema-${dados.tema ?? 'claro'}`} aria-labelledby="destaques-title">
      <div className="wrap">
        <div className="sec-head">
          <div>
            {dados.rotulo && <p className="mono eyebrow">{dados.rotulo}</p>}
            <h2 id="destaques-title" className="sec-head__title">
              <span className="display fs-xl" data-split="lines">
                {dados.titulo.display}
              </span>
              {dados.titulo.serif && (
                <span className="serif-i fs-xl accent" data-split="words" data-delay="0.15">
                  {dados.titulo.serif}
                </span>
              )}
            </h2>
          </div>
          <Link href="/noticias/" className="arrow-link mono" data-fade>
            {dados.link ?? 'Ver todas'} ({total}) <span className="arrow">→</span>
          </Link>
        </div>
        <ul className="ncards" data-stagger>
          {noticias.map((n) => (
            <li key={n.slug}>
              <Link href={`/noticias/${n.slug}/`} className="ncard" data-cursor="Ler">
                <div className="media ncard__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {n.capa && <img src={n.capa} alt="" loading="lazy" decoding="async" />}
                </div>
                <p className="ncard__meta mono muted">
                  <time dateTime={n.data}>{n.dataFmt}</time>
                </p>
                <h3 className="ncard__title">{n.titulo}</h3>
                <p className="ncard__excerpt muted">{n.resumo}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
