type Props = {
  eyebrow: string;
  title: string;
  accent?: string; // complemento em serifa itálica
  lead?: string;
};

export default function PageHero({ eyebrow, title, accent, lead }: Props) {
  return (
    <section className="page-hero tema-escuro">
      <div className="wrap">
        <p className="mono eyebrow muted" data-fade data-now>
          {eyebrow}
        </p>
        <h1 className="page-hero__title">
          <span className="display fs-xxl" data-split="chars" data-now>
            {title}
          </span>
          {accent && (
            <span className="serif-i fs-xl accent" data-split="words" data-now data-delay="0.35">
              {accent}
            </span>
          )}
        </h1>
        {lead && (
          <p className="page-hero__lead fs-m" data-fade data-now data-delay="0.5">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
