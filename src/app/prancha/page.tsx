import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { site } from '@/lib/site';

// PRANCHA DE DIREÇÃO DE ARTE — página interna (fora do menu, do sitemap e do Google).
// Mostra o tema do cliente de verdade: paleta com contrastes calculados, fontes,
// títulos em duas vozes e fotos com o tratamento escolhido. É fotografada pelo
// workflow "Prints" para o usuário aprovar a direção antes da reconstrução.
// Textos e fotos em conteudo/prancha.json (opcional).

export const metadata: Metadata = { title: 'Prancha', robots: { index: false, follow: false } };

type Prancha = {
  conceito?: string;
  descricao?: string;
  frase?: { display: string; serif?: string };
  fotos?: { src: string; alt: string }[];
  notas?: string[];
};

function lerPrancha(): Prancha {
  const arq = path.join(process.cwd(), 'conteudo', 'prancha.json');
  try {
    return JSON.parse(fs.readFileSync(arq, 'utf8')) as Prancha;
  } catch {
    return {};
  }
}

function lerTokens(): Record<string, string> {
  const css = fs.readFileSync(path.join(process.cwd(), 'src', 'styles', 'tema.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens: Record<string, string> = {};
  for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

function luminancia(hex: string): number | null {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a?: string, b?: string): string {
  if (!a || !b) return '—';
  const la = luminancia(a);
  const lb = luminancia(b);
  if (la == null || lb == null) return '—';
  const r = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return `${r.toFixed(1)}:1 ${r >= 4.5 ? '✓' : r >= 3 ? '(só texto grande)' : '✗'}`;
}

export default function PranchaPage() {
  const p = lerPrancha();
  const t = lerTokens();
  const cores = ['escuro', 'escuro-3', 'claro', 'claro-2', 'destaque', 'destaque-2', 'destaque-sobre-claro', 'apoio', 'duo-sombra', 'duo-luz'].filter(
    (c) => t[c],
  );
  const pares: [string, string, string][] = [
    ['Texto claro sobre escuro', t.claro, t.escuro],
    ['Texto escuro sobre destaque', t.escuro, t.destaque],
    ['Destaque sobre escuro', t.destaque, t.escuro],
    ['Destaque sobre claro', t['destaque-sobre-claro'] ?? t.destaque, t.claro],
  ];
  const frase = p.frase ?? { display: 'Título em duas vozes', serif: 'com o acento em itálico.' };
  const fotos = p.fotos ?? [];

  return (
    <>
      <section className="page-hero tema-escuro">
        <div className="wrap">
          <p className="mono eyebrow muted">Prancha de direção de arte · {site.nomeCompleto}</p>
          <h1 className="page-hero__title">
            <span className="display fs-xxl">{site.nome}</span>
          </h1>
          {p.conceito && <p className="serif-i fs-xl accent" style={{ margin: '0.3em 0 0' }}>{p.conceito}</p>}
          {p.descricao && <p className="page-hero__lead fs-m">{p.descricao}</p>}
          <p className="mono muted" style={{ marginTop: 32 }}>
            Fotos: {site.fotos?.tratamento ?? 'natural'} · Fontes: {(t['font-sans'] ?? '').split(',')[0]} / {(t['font-serif'] ?? '').split(',')[0]} / {(t['font-mono'] ?? '').split(',')[0]}
          </p>
        </div>
      </section>

      <section className="section tema-claro">
        <div className="wrap">
          <p className="mono eyebrow">Paleta</p>
          <div className="prancha__cores">
            {cores.map((c) => (
              <div key={c} className="prancha__cor">
                <span className="prancha__amostra" style={{ background: `var(--${c})` }} />
                <span className="mono">--{c}</span>
                <span className="mono muted">{t[c]}</span>
              </div>
            ))}
          </div>
          <dl className="prancha__contrastes mono">
            {pares.map(([rotulo, a, b]) => (
              <div key={rotulo}>
                <dt className="muted">{rotulo}</dt>
                <dd>{contraste(a, b)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section tema-escuro">
        <div className="wrap prancha__tipos">
          <p className="mono eyebrow muted">Tipografia</p>
          <h2 className="sec-head__title" style={{ marginBottom: 48 }}>
            <span className="display fs-xl">{frase.display}</span>{' '}
            {frase.serif && <span className="serif-i fs-xl accent">{frase.serif}</span>}
          </h2>
          <p className="display-cond fs-l">Display condensado — títulos de cartão</p>
          <p className="serif-i fs-l">Serifa itálica — acentos, subtítulos e citações</p>
          <p className="mono">Mono — metadados · datas · rótulos · Nº 001</p>
          <p className="fs-m" style={{ maxWidth: '46ch' }}>
            Texto corrido: é assim que os parágrafos das páginas aparecem, com a entrelinha e o tamanho do corpo do site.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            <span className="btn">Botão principal →</span>
            <span className="btn btn--ghost">Botão secundário</span>
          </div>
        </div>
      </section>

      <section className="collage tema-destaque" style={{ minHeight: 'auto', padding: '14vh 0' }}>
        <div className="collage__text wrap">
          <p className="mono eyebrow">Seção de destaque</p>
          <h2 className="collage__title">
            <span className="display fs-xl">{frase.display}</span>
            {frase.serif && <span className="serif-i fs-xl">{frase.serif}</span>}
          </h2>
        </div>
      </section>

      {fotos.length > 0 && (
        <section className="section tema-claro">
          <div className="wrap">
            <p className="mono eyebrow">Fotos com o tratamento do site</p>
            <div className="prancha__fotos">
              {fotos.map((f) => (
                <figure key={f.src} className="media prancha__foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt={f.alt} loading="lazy" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {p.notas && p.notas.length > 0 && (
        <section className="section tema-escuro">
          <div className="wrap">
            <p className="mono eyebrow muted">Notas</p>
            <ul className="prancha__notas fs-m">
              {p.notas.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
