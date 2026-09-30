// Conversor de Markdown → HTML sem dependências (roda no build, no servidor).
// Cobre o que o conteúdo dos clientes usa: títulos, parágrafos, negrito, itálico,
// links, imagens (com legenda), listas, citações, tabelas (| a | b |), separador e blocos de HTML puro
// (linhas que começam com "<" passam direto — assim dá para usar os blocos
// especiais da prosa: .grid, .people, .facts, .chapter, .pull, .plate...).

export type Documento = { dados: Record<string, unknown>; html: string; texto: string };

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escaparAttr = (s: string) => escapar(s).replace(/"/g, '&quot;');
/** Atributo de um trecho que JÁ passou por `escapar` (no `inline`): só faltam as aspas.
 *  Usar `escaparAttr` ali escaparia o "&" duas vezes (`?a=1&amp;amp;b=2` quebra o link). */
const aspasAttr = (s: string) => s.replace(/"/g, '&quot;');

/** Links aceitos no Markdown: http(s), caminho do site (/…), âncora (#…), mailto: e tel:. */
const HREF_SEGURO = /^(?:https?:|mailto:|tel:|\/|#)/i;

function inline(texto: string): string {
  // trechos de código `assim` são protegidos das outras regras
  const codigos: string[] = [];
  let s = escapar(texto).replace(/`([^`]+)`/g, (_m, c: string) => {
    // aspas escapadas: o código pode acabar dentro de um atributo (alt/src/href)
    codigos.push(`<code>${c.replace(/"/g, "&quot;").replace(/'/g, "&#39;")}</code>`);
    return `\u0000${codigos.length - 1}\u0000`;
  });
  // imagens: ![alt](src "legenda")
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;|\s+"([^"]*)")?\)/g, (_m, alt, src) =>
    `<img src="${aspasAttr(src)}" alt="${aspasAttr(alt)}" loading="lazy" decoding="async" />`,
  );
  // links: [texto](url) — só endereços seguros (http/https, caminho do site, âncora,
  // e-mail, telefone); qualquer outro esquema (javascript:, data:…) vira só o texto
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt, href) => {
    if (!HREF_SEGURO.test(href)) return txt;
    const externo = /^https?:\/\//.test(href);
    return `<a href="${aspasAttr(href)}"${externo ? ' target="_blank" rel="noopener noreferrer"' : ''}>${txt}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/(^|\s)_([^_\s][^_]*)_(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => codigos[Number(i)]);
}

function bloco(b: string): string {
  const linhas = b.split('\n');
  const primeira = linhas[0].trim();

  if (primeira.startsWith('<')) return b; // HTML puro
  if (/^-{3,}$|^\*{3,}$/.test(primeira)) return '<hr />';

  const h = primeira.match(/^(#{1,4})\s+(.*)$/);
  if (h && linhas.length === 1) {
    // "#" vira h2: o h1 da página é o título, gerado pelo layout.
    const nivel = Math.min(4, Math.max(2, h[1].length + 1));
    return `<h${nivel}>${inline(h[2])}</h${nivel}>`;
  }

  if (linhas.every((l) => /^>\s?/.test(l))) {
    const dentro = linhas.map((l) => l.replace(/^>\s?/, '')).join(' ');
    return `<blockquote><p>${inline(dentro)}</p></blockquote>`;
  }

  // tabela (formato GFM): | a | b |  →  |---|---|  →  | 1 | 2 |  (sem a linha de traços: sem cabeçalho)
  if (linhas.length >= 1 && linhas.every((l) => /^\s*\|.*\|\s*$/.test(l))) {
    const celulas = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    const temCab = linhas.length >= 2 && celulas(linhas[1]).every((c) => /^:?-{3,}:?$/.test(c));
    const alin = temCab
      ? celulas(linhas[1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : ''))
      : [];
    const cel = (tag: 'th' | 'td', c: string, i: number) => {
      const num = /^[\d\s.,%()+–—-]+$/.test(c) && /\d/.test(c) ? ' class="num"' : '';
      const al = alin[i] ? ` style="text-align:${alin[i]}"` : '';
      return `<${tag}${num}${al}>${inline(c)}</${tag}>`;
    };
    const cab = temCab ? `<thead><tr>${celulas(linhas[0]).map((c, i) => cel('th', c, i)).join('')}</tr></thead>` : '';
    const corpo = (temCab ? linhas.slice(2) : linhas)
      .map((l) => `<tr>${celulas(l).map((c, i) => cel('td', c, i)).join('')}</tr>`)
      .join('');
    return `<div class="tabela"><table>${cab}<tbody>${corpo}</tbody></table></div>`;
  }

  if (linhas.every((l) => /^\s*[-*]\s+/.test(l))) {
    return `<ul>${linhas.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
  }
  if (linhas.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
    return `<ol>${linhas.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
  }

  // imagem sozinha no parágrafo → figura (o título entre aspas vira legenda)
  const fig = primeira.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
  if (fig && linhas.length === 1) {
    const [, alt, src, legenda] = fig;
    return `<figure><img src="${escaparAttr(src)}" alt="${escaparAttr(alt)}" loading="lazy" decoding="async" />${
      legenda ? `<figcaption>${inline(legenda)}</figcaption>` : ''
    }</figure>`;
  }

  return `<p>${linhas.map((l) => inline(l.trim())).join('<br />')}</p>`;
}

/** Converte o corpo Markdown em HTML. */
export function markdownParaHtml(md: string): string {
  const blocos: string[] = [];
  let atual: string[] = [];
  let emHtml = false;
  for (const linha of md.replace(/\r\n/g, '\n').split('\n')) {
    const vazia = linha.trim() === '';
    if (!emHtml && atual.length === 0 && linha.trim().startsWith('<')) emHtml = true;
    if (vazia && !emHtml) {
      if (atual.length) blocos.push(atual.join('\n'));
      atual = [];
      continue;
    }
    // bloco HTML termina numa linha vazia depois de uma tag de fechamento
    if (vazia && emHtml) {
      const ultimo = atual[atual.length - 1]?.trim() ?? '';
      if (/>$/.test(ultimo)) {
        blocos.push(atual.join('\n'));
        atual = [];
        emHtml = false;
        continue;
      }
    }
    atual.push(linha);
  }
  if (atual.length) blocos.push(atual.join('\n'));
  return blocos.map(bloco).join('\n');
}

function valor(v: string): unknown {
  const t = v.trim();
  if (t === '') return '';
  try {
    return JSON.parse(t);
  } catch {
    return t.replace(/^['"]|['"]$/g, '');
  }
}

/**
 * Lê um arquivo com "front matter":
 * ---
 * titulo: Minha página
 * tags: ["um", "dois"]
 * ---
 * Corpo em Markdown…
 */
export function lerDocumento(bruto: string): Documento {
  const txt = bruto.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const dados: Record<string, unknown> = {};
  let corpo = txt;
  const m = txt.match(/^---\n([\s\S]*?)\n---\n?/);
  if (m) {
    for (const linha of m[1].split('\n')) {
      const i = linha.indexOf(':');
      if (i <= 0 || linha.trim().startsWith('#')) continue;
      dados[linha.slice(0, i).trim()] = valor(linha.slice(i + 1));
    }
    corpo = txt.slice(m[0].length);
  }
  const html = markdownParaHtml(corpo.trim());
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { dados, html, texto };
}
