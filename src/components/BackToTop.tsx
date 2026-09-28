'use client';

import { scrollToTop } from '@/lib/gsap';

export default function BackToTop() {
  return (
    <button type="button" className="mono u-link" onClick={() => scrollToTop(false)}>
      Voltar ao topo ↑
    </button>
  );
}
