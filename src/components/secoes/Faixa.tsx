'use client';

import { Fragment, useRef } from 'react';
import { gsap, ScrollTrigger, reducedMotion } from '@/lib/gsap';
import { useScene } from '@/lib/useScene';
import type { SecaoFaixa } from '@/lib/site';
import Marca from '../Marca';

const REPEAT = 4; // cópias por grupo: o grupo precisa ser mais largo que a tela

// Duas faixas de palavras em sentidos opostos. A velocidade da rolagem acelera
// as faixas e o sentido da rolagem inverte a direção.
export default function Faixa({ dados }: { dados: SecaoFaixa }) {
  const ref = useRef<HTMLElement>(null);
  const palavras = dados.palavras.length ? dados.palavras : ['—'];
  // 2ª faixa: contorno (padrão) ou "apagado" — use apagado com fontes variáveis
  const segunda = dados.estilo === 'apagado' ? ' marquee__row--apagado' : ' marquee__row--outline';

  useScene(() => {
    if (reducedMotion()) return;
    const tracks = gsap.utils.toArray<HTMLElement>('.marquee__track', ref.current);
    const loops = tracks.map((t, i) =>
      gsap.fromTo(t, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 38, ease: 'none', repeat: -1 }),
    );
    ScrollTrigger.create({
      trigger: ref.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const dir = self.direction;
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 7);
        loops.forEach((loop) => {
          gsap.to(loop, {
            timeScale: boost * dir,
            duration: 0.2,
            overwrite: true,
            onComplete: () => {
              gsap.to(loop, { timeScale: dir, duration: 1.4, ease: 'power2.out', overwrite: true });
            },
          });
        });
      },
    });
  }, ref);

  const row = (outline: boolean, desloc: number) => (
    <div className={`marquee__row${outline ? segunda : ''}`} aria-hidden="true">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <div className="marquee__group" key={copy}>
            {Array.from({ length: REPEAT }, (_, i) => (
              <Fragment key={i}>
                <span className="display fs-xxl">{palavras[(i + desloc) % palavras.length]}</span>
                <Marca className="marca marquee__marca" />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="marquee tema-escuro" ref={ref} aria-label={dados.rotulo || palavras.join(', ')}>
      {row(false, 0)}
      {row(true, 1)}
    </section>
  );
}
