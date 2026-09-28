'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { site } from '@/lib/site';

type Props = { contagens: Record<string, number> };

function useHoraLocal() {
  const [hora, setHora] = useState('--:--');
  useEffect(() => {
    if (!site.local) return;
    const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: site.local.fuso, hour: '2-digit', minute: '2-digit' });
    const tick = () => setHora(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return hora;
}

export default function Nav({ contagens }: Props) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const hora = useHoraLocal();

  // Esconde ao rolar para baixo, reaparece ao subir.
  useGSAP(() => {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        navRef.current?.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 240);
      },
    });
  });

  // Menu do celular em tela cheia.
  useGSAP(
    () => {
      tl.current = gsap
        .timeline({ paused: true })
        .set(menuRef.current, { visibility: 'visible' })
        .fromTo(menuRef.current, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
        .from('.menu__links a', { yPercent: 100, autoAlpha: 0, stagger: 0.06, duration: 0.9 }, 0.35)
        .from('.menu__foot > *', { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.8 }, 0.5);
    },
    { scope: menuRef },
  );

  useEffect(() => {
    if (!tl.current) return;
    if (open) tl.current.timeScale(1).play();
    else tl.current.timeScale(1.6).reverse();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const ativo = (href: string) => href !== '/' && pathname.startsWith(href);
  const redes = site.redes.map((r) => r.usuario || r.rotulo).join(' · ');

  return (
    <>
      <header className="nav" ref={navRef}>
        <Link href="/" className="nav__logo" aria-label={`${site.nome} — início`}>
          {site.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.logo.src} alt={site.nome} width={site.logo.largura} height={site.logo.altura} />
          ) : (
            <span className="nav__nome">{site.nome}</span>
          )}
        </Link>

        {site.local ? (
          <div className="nav__center mono" aria-label={`Horário local — ${site.local.cidade}`}>
            <span className="dot-live" aria-hidden="true" />
            <span>
              {site.local.cidade} {hora}
            </span>
          </div>
        ) : (
          <span />
        )}

        <nav className="nav__links" aria-label="Principal">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="u-link" aria-current={ativo(item.href) ? 'page' : undefined}>
              {item.rotulo}
              {contagens[item.href] ? <sup>{String(contagens[item.href]).padStart(2, '0')}</sup> : null}
            </Link>
          ))}
        </nav>

        <button className="nav__menu-btn mono" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((v) => !v)}>
          {open ? 'Fechar' : 'Menu'}
        </button>
      </header>

      <div id="menu" className="menu tema-claro" ref={menuRef} aria-hidden={!open}>
        <nav className="menu__links" aria-label="Menu">
          <Link href="/" className="display">
            Início <span className="mono">00</span>
          </Link>
          {site.nav.map((item, i) => (
            <Link key={item.href} href={item.href} className="display">
              {item.rotulo} <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            </Link>
          ))}
        </nav>
        <div className="menu__foot">
          {site.contato.email && (
            <a href={`mailto:${site.contato.email}`} className="mono">
              {site.contato.email}
            </a>
          )}
          {redes && <span className="mono muted">{redes}</span>}
          {site.local && (
            <span className="mono muted">
              {site.local.cidade} {hora}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
