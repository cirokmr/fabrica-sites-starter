import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import HoverList from '@/components/HoverList';
import { projetos } from '@/lib/content';
import { site } from '@/lib/site';

const t = site.projetos;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descricao,
  alternates: { canonical: '/projetos/' },
};

export default function ProjetosPage() {
  const items = projetos.map((p) => ({
    href: `/projetos/${p.slug}/`,
    title: p.titulo,
    sub: p.subtitulo,
    lead: `${t.prefixoNumero} ${p.numero}`,
    meta: p.tipo,
    image: p.capa,
  }));

  return (
    <>
      <PageHero eyebrow={t.rotulo.replace('{n}', String(projetos.length))} title={t.titulo} accent={t.destaque} lead={t.lead} />
      <section className="section tema-escuro section--flush-top">
        <div className="wrap">
          <HoverList items={items} cursor={t.cursor ?? 'Ver'} />
        </div>
      </section>
    </>
  );
}
