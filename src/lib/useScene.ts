'use client';

import type { RefObject } from 'react';
import { useGSAP, getSmoother } from './gsap';
import { onIntroDone } from './intro';

/**
 * useGSAP para cenas com scroll: garante o ScrollSmoother antes de criar pins,
 * espera o fim da intro e registra tudo no contexto (revertido ao sair da página).
 */
export function useScene(setup: () => void, scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    (_ctx, contextSafe) => {
      getSmoother();
      const run = contextSafe ? contextSafe(setup) : setup;
      return onIntroDone(run);
    },
    { scope, dependencies: deps },
  );
}
