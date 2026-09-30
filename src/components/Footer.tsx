import Link from 'next/link';
import { site, linkWhatsapp, linkTel } from '@/lib/site';
import { noticias, projetos, periodo } from '@/lib/content';
import BackToTop from './BackToTop';
import Marca from './Marca';

export default function Footer() {
  const ano = new Date().getFullYear();
  const { rodape, contato, local } = site;
  const zap = linkWhatsapp(contato.whatsapp);
  const colunas: NonNullable<typeof rodape.colunas> = rodape.colunas ?? {};
  return (
    <footer className="footer tema-escuro">
      <div className="wrap">
        <p className="mono eyebrow muted">{rodape.rotulo}</p>

        <div className="footer__lead">
          <h2 className="footer__title">
            <span className="display fs-xl" data-split="lines">
              {rodape.titulo.display}
            </span>
            {rodape.titulo.serif && (
              <span className="serif-i fs-xl footer__title-serif" data-split="words">
                <Marca className="marca" /> {rodape.titulo.serif}
              </span>
            )}
          </h2>
          <div className="footer__cta" data-fade>
            <p className="muted">{rodape.texto}</p>
            <Link href="/contato/" className="btn" data-magnetic>
              {rodape.botao} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {rodape.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="footer__logo"
            src={rodape.logo.src}
            alt={rodape.logo.alt}
            width={rodape.logo.largura}
            height={rodape.logo.altura}
            loading="lazy"
            data-fade
          />
        )}

        {contato.email && (
          <a className="footer__mail u-link" href={`mailto:${contato.email}`} data-cursor="E-mail">
            {contato.email}
          </a>
        )}

        <div className="footer__cols" data-stagger>
          <div>
            <p className="mono muted">Navegação</p>
            <ul>
              <li>
                <Link className="u-link" href="/">
                  Início
                </Link>
              </li>
              {site.nav.map((n) => (
                <li key={n.href}>
                  <Link className="u-link" href={n.href}>
                    {n.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mono muted">{colunas.contato ?? 'Contato'}</p>
            <ul>
              {contato.telefone && (
                <li>
                  <a className="u-link" href={linkTel(contato.telefone)}>
                    {contato.telefone}
                  </a>
                </li>
              )}
              {zap && (
                <li>
                  <a className="u-link" href={zap} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
              )}
              {site.redes.map((s) => (
                <li key={s.href}>
                  <a className="u-link" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.rotulo} {s.usuario && <span className="muted">{s.usuario}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mono muted">Onde</p>
            <ul>
              {contato.endereco && <li>{contato.endereco}</li>}
              {local && !contato.endereco && <li>{local.cidade}</li>}
              {local?.pais && <li className="muted">{local.pais}</li>}
            </ul>
          </div>
          {(projetos.length > 0 || noticias.length > 0) && (
            <div>
              <p className="mono muted">{colunas.registro ?? 'Registro'}</p>
              <ul>
                {projetos.length > 0 && (
                  <li>
                    {String(projetos.length).padStart(2, '0')} {colunas.itens ?? site.projetos.titulo.toLowerCase()}
                  </li>
                )}
                {noticias.length > 0 && <li>{noticias.length} notícias</li>}
                {periodo.de && (
                  <li className="muted">
                    {periodo.de} — {periodo.ate}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="footer__word" aria-hidden="true" style={{ '--letras': Math.max(3, [...rodape.palavra].length) } as React.CSSProperties}>
        <span className="display" data-split="chars">
          {rodape.palavra}
        </span>
      </div>

      <div className="wrap footer__bar mono muted">
        <span>
          © {ano} {site.nomeCompleto}
        </span>
        {local && (
          <span>
            {local.cidade}
            {local.pais ? ` · ${local.pais}` : ''}
          </span>
        )}
        <BackToTop />
      </div>
      {site.creditos && site.creditos.length > 0 && (
        <p className="wrap footer__creditos mono muted">
          {site.creditos.map((c, i) => (
            <span key={i}>
              {c.url ? (
                <a className="u-link" href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.texto}
                </a>
              ) : (
                c.texto
              )}
            </span>
          ))}
        </p>
      )}
    </footer>
  );
}
