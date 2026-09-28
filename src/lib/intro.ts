'use client';

// Controla quando as animações de entrada da página podem começar.
// Na primeira visita da sessão, o <Loader/> cobre a tela; as páginas esperam
// o fim dele para que a primeira dobra anime à vista do visitante.

const EVENT = 'site:intro-done';

export function introPending(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return !root.classList.contains('intro-seen') && !root.classList.contains('reduced') && !root.dataset.introDone;
}

export function markIntroDone() {
  document.documentElement.dataset.introDone = '1';
  try {
    sessionStorage.setItem('site-intro', '1');
  } catch {
    /* storage bloqueado: segue sem memorizar */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function onIntroDone(cb: () => void): () => void {
  if (!introPending()) {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(EVENT, handler, { once: true });
  return () => window.removeEventListener(EVENT, handler);
}
