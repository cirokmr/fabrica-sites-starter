import { site } from '@/lib/site';

// Símbolo gráfico da marca usado como ornamento (faixa, rodapé, contato).
// Vem de site.json → "marca" ({ viewBox, d, traco }). Sem marca definida,
// usa um asterisco de 8 pontas neutro.
const PADRAO = {
  viewBox: '0 0 100 100',
  d: 'M50 8 L50 92 M8 50 L92 50 M20 20 L80 80 M80 20 L20 80',
  traco: 9,
};

export default function Marca({ className = 'marca', strokeWidth }: { className?: string; strokeWidth?: number }) {
  const m = site.marca ?? PADRAO;
  return (
    <svg viewBox={m.viewBox} className={className} aria-hidden="true" fill="none">
      <path
        d={m.d}
        stroke="currentColor"
        strokeWidth={strokeWidth ?? m.traco ?? 8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
