// Identidade e textos do site. TUDO que muda de um cliente para outro está em
// conteudo/site.json — os componentes só leem daqui.
import dados from '@conteudo/site.json';

/** Título em duas vozes: parte "display" (caixa-alta pesada) + parte em serifa itálica. */
export type Titulo = { display: string; serif?: string };
export type Imagem = { src: string; alt: string };
export type Link = { rotulo: string; href: string };
export type Rede = { rotulo: string; usuario?: string; href: string };
/** Fundo de uma seção da home (cada seção tem um padrão; o site.json pode trocar). */
export type Tema = 'escuro' | 'claro' | 'destaque';

export type SecaoHero = {
  tipo: 'hero';
  palavra: string;
  /** nome completo lido por leitores de tela e buscadores no <h1> (a palavra gigante continua curta) */
  nomeH1?: string;
  /** frase em itálico; trechos entre « » saem na cor de destaque */
  pergunta?: string;
  legenda: Titulo;
  /** em topo e base, {de} e {ate} viram o 1º e o último ano das notícias */
  topo?: string[];
  base?: string;
  imagens: Imagem[];
};
export type SecaoManifesto = {
  tipo: 'manifesto';
  tema?: Tema;
  rotulo?: string;
  titulo: Titulo;
  texto: string;
  figura?: Imagem & { legenda?: string };
  /** faixa de ícones/ilustração da marca abaixo do texto (imagem clara, invertida no fundo claro) */
  icones?: Imagem;
};
export type SecaoFaixa = {
  tipo: 'faixa';
  tema?: Tema;
  palavras: string[];
  rotulo?: string;
  /** mostra o rótulo acima das faixas (senão ele só é lido por leitores de tela) */
  mostrarRotulo?: boolean;
  /** "medio" para palavras longas (nomes de parceiros); padrão: grande */
  tamanho?: 'grande' | 'medio';
  estilo?: 'contorno' | 'apagado';
};
export type SecaoColecao = {
  tipo: 'colecao';
  tema?: Tema;
  rotulo?: string;
  titulo: string;
  texto?: string;
  prefixoNumero?: string;
  fim?: Titulo;
};
export type SecaoColagem = {
  tipo: 'colagem';
  tema?: Tema;
  rotulo?: string;
  titulo: Titulo;
  nota?: string;
  imagens: (Imagem & { velocidade?: number })[];
};
export type SecaoDestaques = {
  tipo: 'destaques';
  tema?: Tema;
  rotulo?: string;
  titulo: Titulo;
  quantidade?: number;
  link?: string;
  /** só notícias com foto de capa */
  soComCapa?: boolean;
  /** no máximo uma notícia por categoria (a 1ª categoria de cada uma), para variar os temas */
  umaPorCategoria?: boolean;
};
export type SecaoTexto = { tipo: 'texto'; tema?: Tema; rotulo?: string; titulo: Titulo; texto?: string; botao?: Link };
/** Linha do tempo: anos grandes que "acendem" com a rolagem, cada um com título e texto. */
export type Marco = { ano: string; titulo: string; texto?: string; imagem?: Imagem & { legenda?: string } };
export type SecaoMarcos = { tipo: 'marcos'; tema?: Tema; rotulo?: string; titulo: Titulo; itens: Marco[]; link?: Link };
export type Secao =
  | SecaoHero
  | SecaoManifesto
  | SecaoFaixa
  | SecaoColecao
  | SecaoColagem
  | SecaoDestaques
  | SecaoTexto
  | SecaoMarcos;

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

/** Ícones da aba do navegador em PNG (sem isso, usa /img/favicon.svg). */
export type Icones = { icon: { src: string; tamanho?: string }[]; apple?: string };

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
  /** Textos da abertura. Em esquerda e direita, {de} e {ate} viram o 1º e o último ano das notícias. */
  intro: { ativa: boolean; esquerda: string; direita: string; rotulo: string };
  home: { secoes: Secao[] };
  projetos: TextosLista & {
    prefixoNumero: string;
    /** rótulo do número no topo da página do projeto (padrão: prefixoNumero), ex.: "Nº de registro" */
    rotuloNumero?: string;
    /** mostra na ficha lateral quantas imagens o projeto tem */
    contarImagens?: boolean;
  };
  /**
   * formatoData: "curto" = 08 mai 2026 (padrão) · "longo" = 8 de maio de 2026.
   * capaInteira: a capa da notícia aparece inteira, sem corte (cartazes, convites com texto).
   */
  noticias: TextosLista & { formatoData?: 'curto' | 'longo'; capaInteira?: boolean };
  contatoPagina: { rotulo: string; titulo: Titulo; texto: string; descricao: string; campoMensagem: string };
  rodape: {
    rotulo: string;
    titulo: Titulo;
    texto: string;
    botao: string;
    palavra: string;
    /** títulos das colunas do rodapé (padrão: Contato, Registro) e o nome dos itens contados */
    colunas?: { contato?: string; registro?: string; itens?: string };
    /** logotipo mostrado no rodapé (arquivo para fundo escuro) */
    logo?: Imagem & { largura: number; altura: number };
  };
  /** link2: segundo botão da página 404 (ex.: { "rotulo": "Ver notícias", "href": "/noticias/" }) */
  naoEncontrada: { titulo: string; texto: string; botao: string; link2?: Link };
  /** ícones da aba em PNG + ícone da Apple (sem isso, /img/favicon.svg) */
  icones?: Icones;
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
