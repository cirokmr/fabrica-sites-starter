'use client';

import { useRef } from 'react';
import { ScrollTrigger, useGSAP, getSmoother, scrollToTop } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';
import { runPageMotion } from '@/lib/motion';

// O template remonta a cada navegação: zera o scroll, liga as animações
// declarativas da página (e do rodapé) e reordena os gatilhos depois dos pins.
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      getSmoother();
      scrollToTop(true);
      let dispose: (() => void) | undefined;
      const run = contextSafe!(() => {
        const scope = document.getElementById('smooth-content') ?? ref.current!;
        dispose = runPageMotion(scope);
        ScrollTrigger.refresh();
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        document.fonts?.ready.then(() => ScrollTrigger.refresh());
      });
      const off = onIntroDone(run);
      return () => {
        off();
        dispose?.();
      };
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
