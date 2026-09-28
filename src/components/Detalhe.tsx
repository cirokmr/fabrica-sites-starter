// Corpo das páginas de detalhe (projeto, notícia, página institucional):
// ficha lateral + texto (prosa) com as animações declarativas.
type Item = { rotulo: string; valor: string; grande?: boolean };

export default function Detalhe({ ficha, html }: { ficha: Item[]; html: string }) {
  return (
    <section className="section tema-claro">
      <div className="wrap detail-body">
        <aside className="detail-aside" data-stagger>
          {ficha
            .filter((f) => f.valor)
            .map((f) => (
              <div key={f.rotulo}>
                <p className="mono muted">{f.rotulo}</p>
                <p className={f.grande ? 'detail-aside__big' : undefined}>{f.valor}</p>
              </div>
            ))}
        </aside>
        <div className="prose" data-prose dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}
