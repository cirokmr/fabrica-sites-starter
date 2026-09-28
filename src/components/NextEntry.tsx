import Link from 'next/link';

type Props = {
  href: string;
  label: string;
  title: string;
  sub?: string;
  image: string | null;
  long?: boolean; // títulos longos (notícias) usam a versão não expandida
  cta?: string;
};

// Fecho das páginas de detalhe: o próximo item ocupa a tela inteira.
export default function NextEntry({ href, label, title, sub, image, long, cta = "Abrir" }: Props) {
  return (
    <Link href={href} className="next tema-escuro" data-cursor="Abrir">
      {image && (
        <div className="next__media media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" loading="lazy" decoding="async" data-parallax="0.25" />
        </div>
      )}
      <div className="wrap next__inner">
        <p className="mono">{label}</p>
        <h2 className={long ? 'title-long fs-xl next__title' : 'display fs-xxl next__title'} data-split="lines">
          {title}
        </h2>
        {sub && <p className="serif-i fs-m">{sub}</p>}
        <span className="next__cta mono">
          {cta} <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
