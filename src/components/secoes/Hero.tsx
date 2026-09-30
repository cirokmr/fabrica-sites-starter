'use client';

import { useRef } from 'react';
import { gsap, SplitText, reducedMotion } from '@/lib/gsap';
import { useScene } from '@/lib/useScene';
import type { SecaoHero } from '@/lib/site';

// Abertura da home: a palavra gigante (nome) sobe letra a letra; um círculo
// "projeta" uma sequência de fotos; ao rolar, a seção fica presa e o círculo
// se expande até a tela cheia, revelando a legenda. A última foto é a final.
export default function Hero({ dados }: { dados: SecaoHero }) {
  const ref = useRef<HTMLElement>(null);
  const { palavra, nomeH1, pergunta, legenda, topo = [], base, imagens } = dados;

  useScene(() => {
    const root = ref.current!;
    const q = gsap.utils.selector(root);
    const frames = q('.hero__frame');
    const last = frames[frames.length - 1];

    if (reducedMotion()) {
      gsap.set(q('.hero__media'), { clipPath: 'none' });
      gsap.set(frames, { autoAlpha: 0 });
      gsap.set(last, { autoAlpha: 1 });
      return;
    }

    // com nomeH1, a palavra fica num <span> próprio (o nome completo é só para leitores de tela)
    const word = SplitText.create(q('.hero__word-txt')[0] ?? q('.hero__word')[0], { type: 'chars', mask: 'chars', charsClass: 'sc' });
    const qEl = q('.hero__q')[0];
    const question = qEl ? SplitText.create(qEl, { type: 'words', mask: 'words', wordsClass: 'sw' }) : null;
    const caption = SplitText.create(q('.hero__caption')[0], { type: 'lines', mask: 'lines', linesClass: 'sl' });
    gsap.set(q('.hero__word, .hero__q, .hero__caption'), { visibility: 'visible' });
    gsap.set(caption.lines, { yPercent: 140 });
    gsap.set(frames, { autoAlpha: 0 });

    // --- abertura ---
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .from(word.chars, { yPercent: 150, duration: 1.6, stagger: 0.07 }, 0)
      .fromTo(
        q('.hero__media'),
        { clipPath: 'circle(0% at 50% 40%)' },
        { clipPath: 'circle(12% at 50% 40%)', duration: 1.6, ease: 'expo.inOut' },
        0.15,
      )
      .from(q('.hero__row > *'), { autoAlpha: 0, y: 12, duration: 1, stagger: 0.06 }, 0.8);
    if (question) intro.from(question.words, { yPercent: 135, duration: 1.2, stagger: 0.05 }, 0.6);
    frames.forEach((f, i) => {
      intro.set(f, { autoAlpha: 1 }, 0.2 + i * 0.16);
      if (i > 0) intro.set(frames[i - 1], { autoAlpha: 0 }, 0.2 + i * 0.16 + 0.01);
    });

    // --- rolagem presa: o círculo vira tela cheia ---
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: '+=170%', pin: true, scrub: 1, anticipatePin: 1 },
    });
    tl.to(q('.hero__media'), { clipPath: 'circle(80% at 50% 40%)', duration: 1 }, 0)
      .fromTo(last, { scale: 1.35 }, { scale: 1, duration: 1 }, 0)
      .to(word.chars, { yPercent: (i: number) => -60 - i * 28, autoAlpha: 0, duration: 0.55, stagger: 0.03 }, 0)
      .to(q('.hero__row'), { autoAlpha: 0, duration: 0.25 }, 0)
      .to(q('.hero__shade'), { opacity: 1, duration: 0.5 }, 0.45)
      .to(caption.lines, { yPercent: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' }, 0.62)
      .to({}, { duration: 0.2 });
    if (qEl) tl.to(qEl, { yPercent: -120, autoAlpha: 0, duration: 0.4 }, 0);
  }, ref);

  // A palavra gigante ocupa ~94% da largura: o tamanho depende do nº de letras.
  const letras = Math.max(3, [...palavra].length);

  return (
    <section
      className="hero tema-escuro"
      ref={ref}
      aria-label="Apresentação"
      style={{ '--letras': letras } as React.CSSProperties}
    >
      <div className="hero__media">
        {imagens.map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={f.src + i}
            src={f.src}
            alt={i === imagens.length - 1 ? f.alt : ''}
            className="hero__frame"
            fetchPriority={i === imagens.length - 1 ? 'high' : 'auto'}
            decoding="async"
          />
        ))}
        <div className="hero__shade" />
      </div>

      {topo.length > 0 && (
        <div className="hero__row hero__row--top wrap mono">
          {topo.map((t, i) => (
            <span key={i} className={i === 1 ? 'hero__row-mid' : undefined}>
              {t}
            </span>
          ))}
        </div>
      )}

      {pergunta && (
        <p className="hero__q serif-i">
          {/* aspas angulares « » saem na cor de destaque */}
          {pergunta.split(/([«»])/).map((parte, i) =>
            parte === '«' || parte === '»' ? (
              <span key={i} className="accent">
                {parte}
              </span>
            ) : (
              parte
            ),
          )}
        </p>
      )}

      {nomeH1 && nomeH1 !== palavra ? (
        <h1 className="hero__word display">
          <span className="sr-only">{nomeH1} — </span>
          <span className="hero__word-txt">{palavra}</span>
        </h1>
      ) : (
        <h1 className="hero__word display">{palavra}</h1>
      )}

      <p className="hero__caption">
        <span className="display">{legenda.display}</span> {legenda.serif && <span className="serif-i">{legenda.serif}</span>}
      </p>

      {base && (
        <div className="hero__row hero__row--bottom wrap mono">
          <span>{base}</span>
        </div>
      )}
    </section>
  );
}
