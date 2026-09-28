// Identidade e textos do site. TUDO que muda de um cliente para outro está em
// conteudo/site.json — os componentes só leem daqui.
import dados from '@conteudo/site.json';

/** Título em duas vozes: parte "display" (caixa-alta pesada) + parte em serifa itálica. */
export type Titulo = { display: string; serif?: string };
export type Imagem = { src: string; alt: string };
export type Link = { rotulo: string; href: string };
export type Rede = { rotulo: string; usuario?: string; href: string };

export type SecaoHero = {
  tipo: 'hero';
  palavra: string;
  pergunta?: string;
  legenda: Titulo;
  topo?: string[];
  base?: string;
  imagens: Imagem[];
};
export type SecaoManifesto = {
  tipo: 'manifesto';
  rotulo?: string;
  titulo: Titulo;
  texto: string;
  figura?: Imagem & { legenda?: string };
};
export type SecaoFaixa = { tipo: 'faixa'; palavras: string[]; rotulo?: string; estilo?: 'contorno' | 'apagado' };
export type SecaoColecao = {
  tipo: 'colecao';
  rotulo?: string;
  titulo: string;
  texto?: string;
  prefixoNumero?: string;
  fim?: Titulo;
};
export type SecaoColagem = {
  tipo: 'colagem';
  rotulo?: string;
  titulo: Titulo;
  nota?: string;
  imagens: (Imagem & { velocidade?: number })[];
};
export type SecaoDestaques = {
  tipo: 'destaques';
  rotulo?: string;
  titulo: Titulo;
  quantidade?: number;
  link?: string;
};
export type SecaoTexto = { tipo: 'texto'; rotulo?: string; titulo: Titulo; texto?: string; botao?: Link };
export type Secao = SecaoHero | SecaoManifesto | SecaoFaixa | SecaoColecao | SecaoColagem | SecaoDestaques | SecaoTexto;

export type TextosLista = {
  rotulo: string;
  titulo: string;
  destaque?: string;
  lead?: string;
  descricao: string;
  voltar: string;
  proximo: string;
  cursor?: string;
};

export type Site = {
  nome: string;
  nomeCompleto: string;
  url: string;
  descricao: string;
  corTema: string;
  logo: { src: string; largura: number; altura: number } | null;
  marca?: { viewBox: string; d: string; traco?: number } | null;
  local?: { cidade: string; fuso: string; pais?: string } | null;
  contato: {
    email?: string;
    telefone?: string;
    whatsapp?: string;
    endereco?: string;
    formEndpoint?: string;
    assunto?: string;
  };
  redes: Rede[];
  nav: Link[];
  seo: { og: string; ogAlt: string };
  intro: { ativa: boolean; esquerda: string; direita: string; rotulo: string };
  home: { secoes: Secao[] };
  projetos: TextosLista & { prefixoNumero: string };
  noticias: TextosLista;
  contatoPagina: { rotulo: string; titulo: Titulo; texto: string; descricao: string; campoMensagem: string };
  rodape: { rotulo: string; titulo: Titulo; texto: string; botao: string; palavra: string };
  naoEncontrada: { titulo: string; texto: string; botao: string };
  /** tratamento das fotos; hero: 'natural' deixa a foto do hero colorida em qualquer modo */
  fotos?: { tratamento: 'natural' | 'duotone' | 'misto' | 'pb'; hero?: 'natural' | 'tratado' };
  /** créditos de fotos de terceiros (licenças CC BY / CC BY-SA exigem), mostrados no rodapé */
  creditos?: { texto: string; url?: string }[];
};

export const site = dados as unknown as Site;

/** Link de telefone no formato internacional (Brasil por padrão): tel:+554733520118 */
export const linkTel = (telefone?: string) => {
  const d = (telefone ?? '').replace(/\D/g, '');
  if (!d) return '';
  return `tel:+${d.startsWith('55') && d.length > 11 ? d : `55${d.replace(/^0/, '')}`}`;
};

/** Link de WhatsApp a partir do número (só dígitos). */
export const linkWhatsapp = (numero?: string) =>
  numero ? `https://wa.me/${numero.replace(/\D/g, '')}` : '';
