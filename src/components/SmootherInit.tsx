'use client';

import { useLayoutEffect } from 'react';
import { getSmoother } from '@/lib/gsap';

/**
 * Cria o ScrollSmoother antes de qualquer outro efeito e FORA de qualquer
 * gsap.context. Precisa ser o primeiro filho do <body>: o React executa os
 * efeitos de irmãos em ordem, então este roda antes do Loader e das páginas.
 * Se o smoother nascesse dentro do contexto de um componente, seria revertido
 * (e o scroll suave morreria) quando esse componente desmontasse.
 */
export default function SmootherInit() {
  useLayoutEffect(() => {
    getSmoother();
  }, []);
  return null;
}
