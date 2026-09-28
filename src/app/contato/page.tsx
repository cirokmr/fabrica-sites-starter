import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import Marca from '@/components/Marca';
import { site, linkWhatsapp, linkTel } from '@/lib/site';

const t = site.contatoPagina;

export const metadata: Metadata = {
  title: 'Contato',
  description: t.descricao,
  alternates: { canonical: '/contato/' },
};

export default function ContatoPage() {
  const { contato, local } = site;
  const zap = linkWhatsapp(contato.whatsapp);
  return (
    <section className="contact tema-escuro">
      <div className="wrap">
        <p className="mono eyebrow muted" data-fade data-now>
          {t.rotulo}
        </p>
        <h1 className="contact__title">
          <span className="display fs-xxl" data-split="chars" data-now>
            {t.titulo.display}
          </span>
          {t.titulo.serif && (
            <span className="serif-i fs-xxl accent contact__title-serif" data-split="words" data-now data-delay="0.3">
              <Marca className="marca" /> {t.titulo.serif}
            </span>
          )}
        </h1>

        <div className={`contact__grid${contato.formEndpoint ? '' : ' contact__grid--sem-form'}`}>
          <aside className="contact__info" data-stagger data-now data-delay="0.5">
            <p className="fs-m">{t.texto}</p>
            {contato.email && (
              <div>
                <p className="mono muted">E-mail</p>
                <a className="contact__mail u-link" href={`mailto:${contato.email}`}>
                  {contato.email}
                </a>
              </div>
            )}
            {(contato.telefone || zap) && (
              <div>
                <p className="mono muted">Telefone</p>
                <ul className="contact__social">
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
                </ul>
              </div>
            )}
            {site.redes.length > 0 && (
              <div>
                <p className="mono muted">Redes</p>
                <ul className="contact__social">
                  {site.redes.map((s) => (
                    <li key={s.href}>
                      <a className="u-link" href={s.href} target="_blank" rel="noopener noreferrer">
                        {s.rotulo} {s.usuario && <span className="muted">{s.usuario}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(contato.endereco || local) && (
              <div>
                <p className="mono muted">Onde</p>
                {contato.endereco && <p>{contato.endereco}</p>}
                {local && !contato.endereco && (
                  <p>
                    {local.cidade}
                    {local.pais ? `, ${local.pais}` : ''}
                  </p>
                )}
              </div>
            )}
          </aside>

          <ContactForm campoMensagem={t.campoMensagem} />
        </div>
      </div>
    </section>
  );
}
