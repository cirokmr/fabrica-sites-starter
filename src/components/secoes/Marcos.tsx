'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { gsap, reducedMotion } from '@/lib/gsap';
import { useScene } from '@/lib/useScene';
import type { SecaoMarcos } from '@/lib/site';

// Linha do tempo (marcos de uma história): cada ano aparece gigante e "apagado"
// e se preenche de baixo para cima enquanto a pessoa rola, como algo que cresce;
// um fio vertical acompanha o progresso. Com "reduzir movimento", tudo já aparece
// preenchido (o CSS cuida disso).
export default function Marcos({ dados }: { dados: SecaoMarcos }) {
  const ref = useRef<HTMLElement>(null);
  const { rotulo, titulo, itens, link } = dados;

  useScene(() => {
    if (reducedMotion() || !ref.current) return;
    const q = gsap.utils.selector(ref.current);
    q('.marco').forEach((marco) => {
      const fill = (marco as HTMLElement).querySelector('.marco__ano-fill');
      if (!fill) return;
      gsap.fromTo(
        fill,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: marco, start: 'top 82%', end: 'top 38%', scrub: 0.6 },
        },
      );
    });
    const fio = q('.marcos__fio i')[0];
    if (fio) {
      gsap.fromTo(
        fio,
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: q('.marcos__lista')[0], start: 'top 70%', end: 'bottom 60%', scrub: true } },
      );
    }
  }, ref);

  if (!itens.length) return null;

  return (
    <section className={`section marcos tema-${dados.tema ?? 'escuro'}`} ref={ref} aria-labelledby="marcos-title">
      <div className="wrap">
        <div className="sec-head">
          <div>
            {rotulo && <p className="mono eyebrow muted">{rotulo}</p>}
            <h2 id="marcos-title" className="sec-head__title">
              <span className="display fs-xl" data-split="lines">
                {titulo.display}
              </span>
              {titulo.serif && (
                <span className="serif-i fs-xl accent" data-split="words" data-delay="0.15">
                  {titulo.serif}
                </span>
              )}
            </h2>
          </div>
          {link && (
            <Link href={link.href} className="arrow-link mono" data-fade>
              {link.rotulo} <span className="arrow">→</span>
            </Link>
          )}
        </div>

        <div className="marcos__corpo">
          <div className="marcos__fio" aria-hidden="true">
            <i />
          </div>
          <ol className="marcos__lista">
            {itens.map((m) => (
              <li className="marco" key={m.ano + m.titulo}>
                <p className="marco__ano display" aria-hidden="true">
                  <span className="marco__ano-base">{m.ano}</span>
                  <span className="marco__ano-fill">{m.ano}</span>
                </p>
                <div className="marco__texto" data-fade>
                  <h3 className="marco__titulo">
                    <span className="sr-only">{m.ano}: </span>
                    {m.titulo}
                  </h3>
                  {m.texto && <p className="marco__desc muted">{m.texto}</p>}
                </div>
                {m.imagem && (
                  <figure className="marco__fig">
                    <div className="media marco__img" data-reveal="img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.imagem.src} alt={m.imagem.alt} loading="lazy" decoding="async" />
                    </div>
                    {m.imagem.legenda && <figcaption className="mono muted">{m.imagem.legenda}</figcaption>}
                  </figure>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
