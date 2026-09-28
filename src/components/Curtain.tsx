'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap, reducedMotion, scrollToTop } from '@/lib/gsap';
import { site } from '@/lib/site';

/**
 * Transição entre páginas em duas fases. Intercepta cliques em links internos
 * (inclusive os do conteúdo), cobre a tela com duas lâminas, navega e descobre
 * quando a nova rota monta. Voltar/avançar do navegador navegam direto.
 */
export default function Curtain() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const covering = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uncover = () => {
    const el = ref.current;
    if (!el) return;
    covering.current = false;
    if (fallback.current) clearTimeout(fallback.current);
    const [destaque, escuro] = el.querySelectorAll('.curtain__panel');
    gsap
      .timeline({
        onComplete: () => {
          gsap.set([destaque, escuro], { y: 0, yPercent: 100 });
          el.style.pointerEvents = 'none';
        },
      })
      .to(escuro, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, 0.05)
      .to(destaque, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, 0.13);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || !a.getAttribute('href')) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (/\.[a-z0-9]{2,4}$/i.test(url.pathname)) return; // arquivos (pdf, jpg…)

      if (url.pathname === window.location.pathname) {
        if (url.hash) return;
        e.preventDefault();
        e.stopPropagation();
        scrollToTop(false);
        return;
      }
      if (reducedMotion() || covering.current) return;

      e.preventDefault();
      e.stopPropagation();
      covering.current = true;

      const el = ref.current!;
      el.style.pointerEvents = 'auto';
      const [destaque, escuro] = el.querySelectorAll('.curtain__panel');
      gsap
        .timeline({
          onComplete: () => {
            router.push(url.pathname + url.search + url.hash);
            // segurança: se a rota não trocar, descobre mesmo assim
            fallback.current = setTimeout(uncover, 2500);
          },
        })
        .fromTo(destaque, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 0)
        .fromTo(escuro, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 0.08);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useLayoutEffect(() => {
    if (!covering.current) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(uncover));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div className="curtain" ref={ref} aria-hidden="true">
      <div className="curtain__panel curtain__panel--destaque" />
      <div className="curtain__panel curtain__panel--escuro">
        {site.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.logo.src} alt="" width={site.logo.largura} height={site.logo.altura} />
        ) : (
          <span className="display curtain__nome">{site.nome}</span>
        )}
      </div>
    </div>
  );
}
