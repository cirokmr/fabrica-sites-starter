'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, getSmoother } from '@/lib/gsap';
import { introPending, markIntroDone } from '@/lib/intro';

type Props = { esquerda: string; direita: string; rotulo: string };

// Abertura da primeira visita da sessão (~1,4 s): contador 000→100 e duas lâminas
// (escura e destaque) que sobem revelando o site. Textos em site.json → "intro".
export default function Loader({ esquerda, direita, rotulo }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      if (!introPending()) {
        setGone(true);
        return;
      }
      const smoother = getSmoother();
      smoother?.paused(true);
      // O contador é o maior texto da primeira tela: é ele que o Google mede como
      // "maior elemento" (LCP). Por isso ele já aparece pintado no HTML (sem fade)
      // e muda só o valor do MESMO nó de texto — trocar o textContent cria um nó
      // novo, que conta como uma pintura nova e empurra o LCP para o fim da abertura.
      const countEl = ref.current!.querySelector<HTMLElement>('.loader__count')!;
      const countText = countEl.firstChild as Text | null;
      const counter = { v: 0 };

      gsap
        .timeline({
          onComplete: () => {
            smoother?.paused(false);
            setGone(true);
          },
        })
        .from('.loader__row--topo', { autoAlpha: 0, y: 20, duration: 0.6, ease: 'power3.out' }, 0)
        .to(
          counter,
          {
            v: 100,
            duration: 0.9,
            ease: 'power3.inOut',
            onUpdate: () => {
              const txt = String(Math.round(counter.v)).padStart(3, '0');
              if (countText) countText.nodeValue = txt;
              else countEl.textContent = txt;
            },
          },
          0.1,
        )
        .to('.loader__bar i', { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.1)
        .to('.loader__panel--escuro', { yPercent: -100, duration: 0.85, ease: 'expo.inOut' })
        .to('.loader__panel--destaque', { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '<0.1')
        .call(markIntroDone, [], '<0.25');
    },
    { scope: ref },
  );

  if (gone) return null;

  return (
    <div className="loader" ref={ref} aria-hidden="true">
      <div className="loader__panel loader__panel--destaque" />
      <div className="loader__panel loader__panel--escuro">
        <div className="loader__row loader__row--topo mono">
          <span>{esquerda}</span>
          <span>{direita}</span>
        </div>
        <div>
          <div className="loader__bar">
            <i />
          </div>
          <div className="loader__row">
            <span className="loader__count">000</span>
            <span className="mono">{rotulo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
