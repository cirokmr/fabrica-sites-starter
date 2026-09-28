'use client';

import { gsap, ScrollTrigger, SplitText, finePointer, reducedMotion } from './gsap';

/**
 * Runtime declarativo de animações. Os componentes de servidor apenas marcam o HTML:
 *
 *   data-split="lines|words|chars"  título entra por linhas/palavras/letras mascaradas
 *   data-delay="0.2"                atraso (s) para data-split / data-fade
 *   data-now                        anima já (primeira dobra), sem esperar o scroll
 *   data-fade                       sobe e aparece
 *   data-stagger                    filhos sobem em cascata
 *   data-reveal="img"               cortina de baixo p/ cima + zoom-out da imagem interna
 *   data-parallax="0.2"             deslocamento vertical com scrub (fração da altura)
 *   data-prose                      figuras/galerias do conteúdo herdado entram em lote
 *   data-magnetic                   elemento atraído pelo cursor (desktop)
 *
 * Deve rodar dentro de um gsap.context (useGSAP) para ser revertido na troca de página.
 * Retorna a limpeza dos listeners de DOM (o rodapé persiste entre páginas).
 */
export function runPageMotion(scope: HTMLElement): () => void {
  // Com "reduzir movimento", o CSS já mostra tudo estático: não anima nada.
  if (reducedMotion()) return () => {};
  const disposers: (() => void)[] = [];
  const trig = (el: Element, now: boolean, start = 'top 88%') =>
    now ? undefined : { trigger: el, start, once: true };

  // Títulos mascarados
  scope.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const mode = el.dataset.split as 'lines' | 'words' | 'chars';
    const now = el.hasAttribute('data-now');
    const delay = parseFloat(el.dataset.delay || '0');
    gsap.set(el, { visibility: 'visible' });
    SplitText.create(el, {
      type: mode === 'chars' ? 'lines,words,chars' : mode === 'words' ? 'lines,words' : 'lines',
      mask: mode === 'lines' ? 'lines' : mode,
      linesClass: 'sl',
      wordsClass: 'sw',
      charsClass: 'sc',
      autoSplit: true,
      onSplit(self) {
        const targets = mode === 'chars' ? self.chars : mode === 'words' ? self.words : self.lines;
        return gsap.from(targets, {
          yPercent: mode === 'chars' ? 150 : mode === 'words' ? 135 : 140,
          rotate: mode === 'lines' ? 2 : 0,
          duration: mode === 'chars' ? 1.2 : 1.35,
          stagger: mode === 'chars' ? 0.028 : mode === 'words' ? 0.04 : 0.09,
          delay,
          ease: 'expo.out',
          scrollTrigger: trig(el, now),
        });
      },
    });
  });

  scope.querySelectorAll<HTMLElement>('[data-fade]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 36, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1.3,
        delay: parseFloat(el.dataset.delay || '0'),
        scrollTrigger: trig(el, el.hasAttribute('data-now'), 'top 92%'),
      },
    );
  });

  scope.querySelectorAll<HTMLElement>('[data-stagger]').forEach((el) => {
    gsap.fromTo(
      el.children,
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1.2,
        stagger: 0.07,
        delay: parseFloat(el.dataset.delay || '0'),
        scrollTrigger: trig(el, el.hasAttribute('data-now'), 'top 90%'),
      },
    );
  });

  scope.querySelectorAll<HTMLElement>('[data-reveal="img"]').forEach((el) => {
    const now = el.hasAttribute('data-now');
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: trig(el, now, 'top 86%'), delay: parseFloat(el.dataset.delay || '0') });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
    if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.2);
  });

  scope.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax || '0.15') * 100;
    gsap.fromTo(
      el,
      { yPercent: -amt / 2 },
      {
        yPercent: amt / 2,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Conteúdo das páginas (Markdown/HTML): figuras e itens de galeria entram em lote.
  const proseItems = scope.querySelectorAll<HTMLElement>(
    '[data-prose] > figure, [data-prose] .wp-block-image, [data-prose] .wp-block-gallery > figure, [data-prose] .wp-block-embed, [data-prose] .wp-block-media-text',
  );
  if (proseItems.length) {
    gsap.set(proseItems, { autoAlpha: 0, y: 50 });
    ScrollTrigger.batch(proseItems, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }),
    });
  }

  if (finePointer()) {
    scope.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.35);
        y((e.clientY - (r.top + r.height / 2)) * 0.35);
      };
      const leave = () => {
        x(0);
        y(0);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      disposers.push(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
        gsap.set(el, { x: 0, y: 0 });
      });
    });
  }

  // Imagens carregando mudam alturas → recalcula as posições dos gatilhos.
  let t: ReturnType<typeof setTimeout>;
  const refresh = () => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 150);
  };
  scope.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', refresh, { once: true });
    disposers.push(() => img.removeEventListener('load', refresh));
  });
  disposers.push(() => clearTimeout(t));

  return () => disposers.forEach((d) => d());
}
