'use client';

import { useRef } from 'react';
import { gsap, reducedMotion } from '@/lib/gsap';
import { useScene } from '@/lib/useScene';
import type { SecaoColagem } from '@/lib/site';

// Colagem: até 5 fotos flutuam em velocidades diferentes em volta da frase
// (profundidade por parallax), sobre o campo na cor de destaque.
export default function Colagem({ dados }: { dados: SecaoColagem }) {
  const ref = useRef<HTMLElement>(null);
  const pecas = dados.imagens.slice(0, 5);

  useScene(() => {
    if (reducedMotion()) return;
    const q = gsap.utils.selector(ref.current);
    const factor = window.matchMedia('(max-width: 899px)').matches ? 0.35 : 1;
    q('.collage__piece').forEach((el) => {
      const speed = parseFloat((el as HTMLElement).dataset.speed || '0.5') * factor;
      gsap.fromTo(
        el,
        { y: () => window.innerHeight * speed * 0.5 },
        {
          y: () => -window.innerHeight * speed * 0.5,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        },
      );
    });
    gsap.fromTo(
      q('.collage__piece img'),
      { scale: 1.25 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'center center', scrub: true } },
    );
  }, ref);

  const velocidades = [0.9, 0.35, 0.6, 1.15, 0.5];

  return (
    <section className={`collage tema-${dados.tema ?? 'destaque'}`} ref={ref} aria-labelledby="colagem-title">
      {pecas.map((p, i) => (
        <figure key={p.src + i} className={`collage__piece media p${i + 1}`} data-speed={p.velocidade ?? velocidades[i]}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
        </figure>
      ))}
      <div className="collage__text wrap">
        {dados.rotulo && <p className="mono eyebrow">{dados.rotulo}</p>}
        <h2 id="colagem-title" className="collage__title">
          <span className="display fs-xl" data-split="lines">
            {dados.titulo.display}
          </span>
          {dados.titulo.serif && (
            <span className="serif-i fs-xl" data-split="words" data-delay="0.25">
              {dados.titulo.serif}
            </span>
          )}
        </h2>
        {dados.nota && (
          <p className="collage__note" data-fade>
            {dados.nota}
          </p>
        )}
      </div>
    </section>
  );
}
