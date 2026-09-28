'use client';

import { useEffect, useRef } from 'react';
import { gsap, finePointer, reducedMotion } from '@/lib/gsap';

// Cursor-ponto na cor de destaque que segue o mouse; cresce e mostra um rótulo
// sobre elementos com data-cursor="Ver", e vira um anel discreto sobre links.
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer() || reducedMotion()) return;
    const label = el.querySelector<HTMLElement>('.cursor__label')!;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    let shown = false;
    let mode = '';

    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      if (!shown) {
        shown = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: 0.3 });
      }
    };

    const setMode = (next: string, text = '') => {
      if (next === mode && next !== 'label') return;
      mode = next;
      el.dataset.mode = next;
      if (next === 'label') {
        label.textContent = text;
        gsap.to(el, { width: 92, height: 92, margin: -46, duration: 0.55, ease: 'expo.out' });
        gsap.to(label, { opacity: 1, duration: 0.3, delay: 0.1 });
      } else if (next === 'link') {
        gsap.to(el, { width: 40, height: 40, margin: -20, duration: 0.5, ease: 'expo.out' });
        gsap.to(label, { opacity: 0, duration: 0.15 });
      } else {
        gsap.to(el, { width: 12, height: 12, margin: -6, duration: 0.5, ease: 'expo.out' });
        gsap.to(label, { opacity: 0, duration: 0.15 });
      }
    };

    const over = (e: PointerEvent) => {
      const target = e.target as Element;
      const labeled = target.closest<HTMLElement>('[data-cursor]');
      if (labeled) return setMode('label', labeled.dataset.cursor || '');
      if (target.closest('a, button, input, textarea, label')) return setMode('link');
      setMode('idle');
    };
    const out = () => gsap.to(el, { opacity: 0, duration: 0.3 });
    const back = () => gsap.to(el, { opacity: 1, duration: 0.3 });

    window.addEventListener('pointermove', move);
    document.addEventListener('pointerover', over);
    document.documentElement.addEventListener('pointerleave', out);
    document.documentElement.addEventListener('pointerenter', back);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', out);
      document.documentElement.removeEventListener('pointerenter', back);
    };
  }, []);

  return (
    <div className="cursor" ref={ref} aria-hidden="true">
      <span className="cursor__label" />
    </div>
  );
}
