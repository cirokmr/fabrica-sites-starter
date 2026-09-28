'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { gsap, useGSAP, finePointer } from '@/lib/gsap';

export type HoverItem = {
  href: string;
  title: string;
  lead: string; // coluna esquerda (número/data)
  meta?: string; // coluna direita (tipo/categorias)
  sub?: string; // subtítulo em serifa
  image: string | null;
};

// Lista editorial em linhas. No desktop, uma prévia da imagem segue o cursor
// e troca de quadro a cada linha; no toque, cada linha mostra sua miniatura.
export default function HoverList({ items, cursor = 'Ver' }: { items: HoverItem[]; cursor?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!finePointer()) return;
      const root = ref.current!;
      const preview = root.querySelector<HTMLElement>('.hlist__preview')!;
      const frames = gsap.utils.toArray<HTMLElement>('.hlist__frame', root);
      const xTo = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' });
      const yTo = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' });
      const rotTo = gsap.quickTo(preview, 'rotate', { duration: 0.9, ease: 'power3' });
      let lastX = 0;

      const move = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const x = e.clientX - r.left;
        xTo(x);
        yTo(e.clientY - r.top);
        rotTo(gsap.utils.clamp(-10, 10, (x - lastX) * 0.6));
        lastX = x;
      };
      const show = (i: number) => {
        frames.forEach((f, j) => gsap.to(f, { autoAlpha: j === i ? 1 : 0, duration: 0.35, overwrite: true }));
        gsap.to(preview, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      };
      const hide = () => gsap.to(preview, { scale: 0.6, autoAlpha: 0, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });

      gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
      const rows = root.querySelectorAll<HTMLElement>('.hlist__row');
      rows.forEach((row, i) => row.addEventListener('pointerenter', () => (items[i].image ? show(i) : hide())));
      root.addEventListener('pointermove', move);
      root.addEventListener('pointerleave', hide);
    },
    { scope: ref },
  );

  return (
    <div className="hlist" ref={ref}>
      <ul className="hlist__list" data-stagger>
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="hlist__row" data-cursor={cursor}>
              <span className="hlist__lead mono">{it.lead}</span>
              <span className="hlist__main">
                <span className="hlist__title">{it.title}</span>
                {it.sub && <span className="hlist__sub serif-i">{it.sub}</span>}
              </span>
              <span className="hlist__meta mono muted">{it.meta}</span>
              <span className="hlist__thumb media" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image && <img src={it.image} alt="" loading="lazy" decoding="async" />}
              </span>
              <span className="hlist__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hlist__preview" aria-hidden="true">
        {items.map((it) =>
          it.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={it.href} className="hlist__frame" src={it.image} alt="" loading="lazy" decoding="async" />
          ) : (
            <span key={it.href} className="hlist__frame" />
          ),
        )}
      </div>
    </div>
  );
}
