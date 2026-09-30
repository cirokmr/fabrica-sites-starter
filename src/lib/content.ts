// Conteúdo do site, lido no BUILD a partir de conteudo/ (Markdown com front matter).
//   conteudo/projetos/*.md   → /projetos/<arquivo>/
//   conteudo/noticias/*.md   → /noticias/<arquivo>/
//   conteudo/paginas/*.md    → /<arquivo>/  (sobre, história, equipe…)
// Só importe este arquivo em componentes de servidor (páginas, layout, rodapé).
import fs from 'node:fs';
import path from 'node:path';
import { lerDocumento } from './markdown';
import { site } from './site';

const RAIZ = path.join(process.cwd(), 'conteudo');

function lerPasta(pasta: string) {
  const dir = path.join(RAIZ, pasta);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => ({ slug: f.replace(/\.md$/, ''), ...lerDocumento(fs.readFileSync(path.join(dir, f), 'utf8')) }));
}

const str = (v: unknown, padrao = '') => (typeof v === 'string' ? v : v == null ? padrao : String(v));
const lista = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)) : typeof v === 'string' && v ? [v] : []);
const num = (v: unknown, padrao: number) => (typeof v === 'number' ? v : Number(v) || padrao);

// ---------- Projetos (coleção numerada) ----------
export type Projeto = {
  slug: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  tipo: string;
  quando: string; // data/período legível, ex.: "Março de 2012" (opcional)
  resumo: string;
  tags: string[];
  capa: string | null;
  hero: { src: string; proporcao: string } | null;
  video: { src: string; poster: string } | null;
  ordem: number;
  html: string;
};

export const projetos: Projeto[] = lerPasta('projetos')
  .map(({ slug, dados, html }, i) => ({
    slug,
    numero: str(dados.numero, String(i + 1).padStart(3, '0')),
    titulo: str(dados.titulo, slug),
    subtitulo: str(dados.subtitulo),
    tipo: str(dados.tipo),
    quando: str(dados.quando),
    resumo: str(dados.resumo),
    tags: lista(dados.tags),
    capa: str(dados.capa) || null,
    hero: dados.hero ? { src: str(dados.hero), proporcao: str(dados.heroProporcao, '16 / 8') } : null,
    video: dados.video ? { src: str(dados.video), poster: str(dados.poster) } : null,
    ordem: num(dados.ordem, 999),
    html,
  }))
  .sort((a, b) => a.ordem - b.ordem || a.numero.localeCompare(b.numero));

// ---------- Notícias (diário, por data) ----------
export type Noticia = {
  slug: string;
  titulo: string;
  data: string; // AAAA-MM-DD
  ano: string;
  dataFmt: string;
  resumo: string;
  tipo: 'artigo' | 'clipping';
  categorias: string[];
  capa: string | null;
  html: string;
};

// site.json → noticias.formatoData: "curto" (08 mai 2026, padrão) ou "longo" (8 de maio de 2026)
const fmtData =
  site.noticias.formatoData === 'longo'
    ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const noticias: Noticia[] = lerPasta('noticias')
  .map(({ slug, dados, html, texto }) => {
    const data = str(dados.data, '1970-01-01').slice(0, 10);
    return {
      slug,
      titulo: str(dados.titulo, slug),
      data,
      ano: data.slice(0, 4),
      dataFmt: fmtData.format(new Date(`${data}T12:00:00Z`)).replace(/\./g, ''),
      resumo: str(dados.resumo) || texto.slice(0, 180).replace(/\s+\S*$/, '') + '…',
      tipo: (dados.tipo === 'clipping' ? 'clipping' : 'artigo') as Noticia['tipo'],
      categorias: lista(dados.categorias),
      capa: str(dados.capa) || null,
      html,
    };
  })
  .sort((a, b) => b.data.localeCompare(a.data));

// ---------- Páginas institucionais ----------
export type Pagina = {
  slug: string;
  titulo: string;
  destaque: string;
  rotulo: string;
  lead: string;
  descricao: string;
  capa: string | null;
  ordem: number;
  html: string;
};

export const paginas: Pagina[] = lerPasta('paginas')
  .map(({ slug, dados, html, texto }) => ({
    slug,
    titulo: str(dados.titulo, slug),
    destaque: str(dados.destaque),
    rotulo: str(dados.rotulo),
    lead: str(dados.lead),
    descricao: str(dados.descricao) || texto.slice(0, 155),
    capa: str(dados.capa) || null,
    ordem: num(dados.ordem, 999),
    html,
  }))
  .sort((a, b) => a.ordem - b.ordem);

/** Texto para a meta description: até ~155 caracteres, cortado no fim de uma palavra. */
export const descricaoCurta = (texto: string, max = 155) => {
  const t = texto.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/[\s,;:.—–-]+\S*$/, '') + '…';
};

export const getProjeto = (slug: string) => projetos.find((p) => p.slug === slug);
export const getNoticia = (slug: string) => noticias.find((n) => n.slug === slug);
export const getPagina = (slug: string) => paginas.find((p) => p.slug === slug);

export function noticiasPorAno() {
  const grupos = new Map<string, Noticia[]>();
  for (const n of noticias) {
    if (!grupos.has(n.ano)) grupos.set(n.ano, []);
    grupos.get(n.ano)!.push(n);
  }
  return [...grupos.entries()];
}

/** Próximo item em loop (fecho das páginas de detalhe). */
export function proximoDe<T extends { slug: string }>(lista: T[], slug: string): T {
  const i = lista.findIndex((x) => x.slug === slug);
  return lista[(i + 1) % lista.length];
}

export const periodo = {
  de: noticias[noticias.length - 1]?.ano ?? '',
  ate: noticias[0]?.ano ?? '',
};

/** Troca {de} e {ate} pelo 1º e pelo último ano das notícias (textos do site.json). */
export const preencher = (texto: string) => texto.replace(/\{de\}/g, periodo.de).replace(/\{ate\}/g, periodo.ate);

/** Quantas imagens um HTML de conteúdo tem (ficha lateral dos projetos). */
export const contarImagens = (html: string) => (html.match(/<img\b/gi) || []).length;

/**
 * Para rotas dinâmicas com export estático: se a lista estiver vazia, o Next
 * exige ao menos um parâmetro. Geramos um marcador que vira 404.
 */
export const VAZIO = '_vazio';
export const paramsOuVazio = <T,>(itens: T[], map: (x: T) => { slug: string }) =>
  itens.length ? itens.map(map) : [{ slug: VAZIO }];
