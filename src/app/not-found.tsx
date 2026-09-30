import Link from 'next/link';
import { site } from '@/lib/site';

export default function NotFound() {
  const t = site.naoEncontrada;
  return (
    <section className="notfound tema-escuro">
      <div className="wrap">
        <p className="mono muted" data-fade data-now>
          Erro 404
        </p>
        <h1 className="notfound__title">
          <span className="display fs-mega" data-split="chars" data-now>
            404
          </span>
        </h1>
        <p className="serif-i fs-l" data-fade data-now data-delay="0.3">
          {t.texto}
        </p>
        <div className="notfound__links" data-fade data-now data-delay="0.45">
          <Link href="/" className="btn">
            {t.botao} <span aria-hidden="true">→</span>
          </Link>
          {t.link2 && (
            <Link href={t.link2.href} className="btn btn--ghost">
              {t.link2.rotulo}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
