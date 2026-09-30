'use client';

import { useRef } from 'react';
import { ScrollTrigger, useGSAP, getSmoother, scrollToTop } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';
import { runPageMotion } from '@/lib/motion';

// Âncoras (/pagina/#secao e links "#secao" no texto): o ScrollSmoother não rola
// sozinho até elas, então rolamos nós (sem smoother, o navegador faz o normal).
function irParaAncora(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  const s = getSmoother();
  if (s) s.scrollTo(el, false, 'top 96px');
  else el.scrollIntoView();
  return true;
}

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
        if (location.hash) irParaAncora(location.hash);
        document.fonts?.ready.then(() => {
          ScrollTrigger.refresh();
          if (location.hash) irParaAncora(location.hash);
        });
      });
      const off = onIntroDone(run);
      // clique num link para uma âncora desta mesma página
      const clique = (e: MouseEvent) => {
        const a = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
        // "Pular para o conteúdo" segue o comportamento do navegador (leva o foco junto)
        if (a.classList.contains('skip-link')) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
        if (irParaAncora(url.hash)) {
          e.preventDefault();
          history.pushState(null, '', url.hash);
        }
      };
      document.addEventListener('click', clique);
      return () => {
        off();
        dispose?.();
        document.removeEventListener('click', clique);
      };
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
