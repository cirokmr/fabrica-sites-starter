'use client';

import { useRef } from 'react';
import { gsap, reducedMotion } from '@/lib/gsap';
import { useScene } from '@/lib/useScene';
import type { SecaoManifesto } from '@/lib/site';

// Declaração de propósito: no desktop a seção fica presa enquanto o texto
// "acende" palavra a palavra; no celular acende sem prender.
export default function Manifesto({ dados }: { dados: SecaoManifesto }) {
  const ref = useRef<HTMLElement>(null);
  const { rotulo, titulo, texto, figura, icones } = dados;

  useScene(() => {
    if (reducedMotion()) return;
    const root = ref.current!;
    const words = root.querySelectorAll('.manifesto__body .w');
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', () => {
      if (root.scrollHeight > window.innerHeight) {
        gsap.fromTo(
          words,
          { opacity: 0.12 },
          { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: root, start: 'top 60%', end: 'center 55%', scrub: 0.6 } },
        );
        return;
      }
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: '+=130%', pin: true, scrub: 0.6 } })
        .fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.06, ease: 'none' })
        .to({}, { duration: 1.7 });
    });
    mm.add('(max-width: 899px)', () => {
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: root, start: 'top 70%', end: 'center 50%', scrub: 0.6 } },
      );
    });
  }, ref);

  return (
    <section className={`manifesto tema-${dados.tema ?? 'claro'}`} ref={ref} aria-labelledby="manifesto-title">
      <div className={`wrap manifesto__grid${figura ? '' : ' manifesto__grid--sem-figura'}`}>
        <div className="manifesto__head">
          {rotulo && <p className="mono eyebrow">{rotulo}</p>}
          <h2 id="manifesto-title" className="manifesto__title">
            <span className="display fs-xl" data-split="lines">
              {titulo.display}
            </span>
            {titulo.serif && (
              <span className="serif-i fs-xl accent" data-split="words" data-delay="0.2">
                {titulo.serif}
              </span>
            )}
          </h2>
        </div>

        <p className="manifesto__body fs-l">
          {texto.split(' ').map((w, i) => (
            <span className="w" key={i}>
              {w}{' '}
            </span>
          ))}
        </p>

        {figura && (
          <figure className="manifesto__fig">
            <div className="media manifesto__img" data-reveal="img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={figura.src} alt={figura.alt} loading="lazy" />
            </div>
            {figura.legenda && <figcaption className="mono muted">{figura.legenda}</figcaption>}
          </figure>
        )}

        {icones && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="manifesto__icons" src={icones.src} alt={icones.alt} loading="lazy" data-fade />
        )}
      </div>
    </section>
  );
}
