import Link from 'next/link';
import type { SecaoTexto } from '@/lib/site';

// Bloco simples de título + texto + botão (chamada, missão, aviso).
export default function Texto({ dados }: { dados: SecaoTexto }) {
  return (
    <section className={`section tema-${dados.tema ?? 'escuro'} secao-texto`}>
      <div className="wrap secao-texto__inner">
        {dados.rotulo && <p className="mono eyebrow muted">{dados.rotulo}</p>}
        <h2 className="secao-texto__title">
          <span className="display fs-xl" data-split="lines">
            {dados.titulo.display}
          </span>
          {dados.titulo.serif && (
            <span className="serif-i fs-xl accent" data-split="words" data-delay="0.15">
              {dados.titulo.serif}
            </span>
          )}
        </h2>
        {dados.texto && (
          <p className="secao-texto__body fs-m muted" data-fade>
            {dados.texto}
          </p>
        )}
        {dados.botao && (
          <div data-fade>
            <Link href={dados.botao.href} className="btn" data-magnetic>
              {dados.botao.rotulo} <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
