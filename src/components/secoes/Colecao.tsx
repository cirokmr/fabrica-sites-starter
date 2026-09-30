'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { gsap, reducedMotion } from '@/lib/gsap';
import { useScene } from '@/lib/useScene';
import type { SecaoColecao } from '@/lib/site';

export type ItemColecao = {
  slug: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  tipo: string;
  capa: string | null;
  video: { src: string; poster: string } | null;
};

// Coleção numerada (projetos, serviços, obras…). No desktop a seção fica presa
// e a rolagem vertical percorre os cartões na horizontal. No celular vira
// carrossel nativo com encaixe.
export default function Colecao({ dados, itens, base = '/projetos/' }: { dados: SecaoColecao; itens: ItemColecao[]; base?: string }) {
  const ref = useRef<HTMLElement>(null);
  const prefixo = dados.prefixoNumero ?? 'Nº';

  useScene(() => {
    if (reducedMotion() || !ref.current) return;
    const root = ref.current;
    const q = gsap.utils.selector(root);
    const track = q('.acervo__track')[0] as HTMLElement;
    const counter = q('.acervo__count')[0] as HTMLElement;
    const bar = q('.acervo__bar i')[0] as HTMLElement;
    const total = itens.length;
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', () => {
      const distance = () => track.scrollWidth - window.innerWidth;
      if (distance() <= 0) return; // tudo cabe na tela: não prende
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const n = Math.min(total, Math.max(1, Math.round(self.progress * (total - 1)) + 1));
            counter.textContent = String(n).padStart(2, '0');
            gsap.set(bar, { scaleX: self.progress });
          },
        },
      });

      q('.acard__media img, .acard__media video').forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -7 },
          {
            xPercent: 7,
            ease: 'none',
            scrollTrigger: {
              trigger: (img as HTMLElement).closest('.acard'),
              containerAnimation: slide,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        );
      });

      q('.acard').forEach((card) => {
        gsap.from(card, {
          rotate: 3,
          yPercent: 8,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 105%', end: 'left 78%', scrub: true },
        });
      });
    });
  }, ref);

  if (!itens.length) return null;

  return (
    <section className={`acervo tema-${dados.tema ?? 'escuro'}`} ref={ref} aria-labelledby="colecao-title">
      <div className="acervo__track">
        <div className="acervo__head">
          {dados.rotulo && <p className="mono eyebrow muted">{dados.rotulo}</p>}
          <h2 id="colecao-title" className="acervo__title">
            <span className="display fs-xl" data-split="lines">
              {dados.titulo}
            </span>
          </h2>
          {dados.texto && (
            <p className="muted acervo__lead" data-fade>
              {dados.texto.replace('{n}', String(itens.length))}
            </p>
          )}
        </div>

        {itens.map((p, i) => (
          <Link key={p.slug} href={`${base}${p.slug}/`} className={`acard${i % 2 ? ' acard--low' : ''}`} data-cursor="Ver">
            <div className="acard__meta mono">
              <span>
                {prefixo} {p.numero}
              </span>
              <span className="muted">{p.tipo}</span>
            </div>
            <div className="media acard__media">
              <div className="acard__inner">
                {p.video ? (
                  <video src={p.video.src} poster={p.video.poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  p.capa && <img src={p.capa} alt="" loading="lazy" decoding="async" />
                )}
              </div>
            </div>
            <h3 className="acard__title display-cond">{p.titulo}</h3>
            {p.subtitulo && <p className="acard__sub serif-i muted">{p.subtitulo}</p>}
          </Link>
        ))}

        {dados.fim && (
          <Link href={base} className="acard acard--all" data-cursor="Abrir">
            <span className="mono muted">Índice</span>
            <span className="display fs-l">
              {dados.fim.display}
              <br />
              {dados.fim.serif} <span className="accent">→</span>
            </span>
          </Link>
        )}
      </div>

      <div className="acervo__progress wrap mono" aria-hidden="true">
        <span>
          <span className="acervo__count">01</span> / {String(itens.length).padStart(2, '0')}
        </span>
        <div className="acervo__bar">
          <i />
        </div>
        <span className="muted">Role →</span>
      </div>
    </section>
  );
}
