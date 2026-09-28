import type { Titulo as T } from '@/lib/site';

type Props = {
  titulo: T;
  tamanho?: 'fs-l' | 'fs-xl' | 'fs-xxl';
  /** anima já (primeira dobra) em vez de esperar a rolagem */
  agora?: boolean;
  destaqueSerif?: boolean;
  delay?: number;
};

// Título em duas vozes: parte display (caixa-alta) + parte em serifa itálica.
export default function Titulo({ titulo, tamanho = 'fs-xl', agora, destaqueSerif = true, delay = 0.15 }: Props) {
  const now = agora ? { 'data-now': '' } : {};
  return (
    <>
      <span className={`display ${tamanho}`} data-split="lines" {...now}>
        {titulo.display}
      </span>
      {titulo.serif && (
        <>
          {' '}
          <span
            className={`serif-i ${tamanho}${destaqueSerif ? ' accent' : ''}`}
            data-split="words"
            data-delay={String(delay)}
            {...now}
          >
            {titulo.serif}
          </span>
        </>
      )}
    </>
  );
}
