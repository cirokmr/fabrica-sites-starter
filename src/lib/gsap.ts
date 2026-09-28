'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'expo.out', duration: 1.2 });
}

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * O ScrollSmoother é criado sob demanda por quem precisar primeiro. Isso importa
 * porque o React executa os efeitos dos filhos (páginas) antes dos do pai (layout):
 * as páginas precisam do smoother já existente ao criar seus ScrollTriggers.
 * O markup #smooth-wrapper/#smooth-content já está no DOM quando qualquer efeito roda.
 */
let smoother: ScrollSmoother | null = null;
export function getSmoother(): ScrollSmoother | null {
  if (typeof window === 'undefined') return null;
  if (smoother) return smoother;
  if (reducedMotion()) return null;
  const wrapper = document.getElementById('smooth-wrapper');
  const content = document.getElementById('smooth-content');
  if (!wrapper || !content) return null;
  smoother = ScrollSmoother.create({
    wrapper,
    content,
    smooth: 1.1,
    smoothTouch: 0.1,
    effects: false,
  });
  return smoother;
}

export function scrollToTop(immediate = true) {
  const s = getSmoother();
  if (s) s.scrollTo(0, !immediate);
  else window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' });
}
