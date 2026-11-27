// Gera o HTML da página pública de um assinante a partir da configuração (JSON).
import { makeTatico } from './tpl-tatico.js';

export const e = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = (u) => {
  u = String(u || '').trim();
  return /^(\/(?!\/)|https:\/\/)/.test(u) ? u : '';
};
const color = (c, d) => (/^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : d);
const digits = (s) => String(s || '').replace(/\D/g, '');
const em = (t, h) => `${e(t)}${h ? ` <em style="color: var(--accent)">${e(h)}</em>` : ''}`;
const STAR = (fill, size = 18, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"${extra}><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="${fill}"></path></svg>`;
const CHAT = (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"></path></svg>`;
const ARROW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>`;

const head = (eyebrow, title, highlight, extra = '') => `
<div class="reveal sec-head">
<div>
${eyebrow ? `<p class="eyebrow">${e(eyebrow)}</p>` : ''}
<h2 class="h2">${em(title, highlight)}</h2>
</div>
${extra}
</div>`;

// Repete a lista até cobrir telas largas e duplica para o loop infinito.
function loop(items, minCount) {
  if (!items.length) return [];
  let base = [...items];
  while (base.length < minCount) base = base.concat(items);
  return base.concat(base).map((it, i) => ({ ...it, _dup: i >= base.length }));
}

function img(src, alt, cls = '', lazy = true) {
  const u = safeUrl(src);
  if (!u) return `<div class="ph ${cls}" role="img" aria-label="${e(alt || 'Foto')}"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="9" cy="10" r="2"></circle><path d="M21 16l-5-5-9 9"></path></svg></div>`;
  return `<img${cls ? ` class="${cls}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'} src="${e(u)}" alt="${e(alt || '')}">`;
}

function hero(c) {
  const h = c.hero || {};
  return `
<section id="inicio" class="hero">
<div class="hero-text">
${h.eyebrow ? `<p class="rise d1 eyebrow pin"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>${e(h.eyebrow)}</p>` : ''}
<h1 class="rise d2 h1">${e(h.title)} ${h.highlight ? `<em>${e(h.highlight)}</em>` : ''}</h1>
${h.subtitle ? `<p class="rise d3 lead">${e(h.subtitle)}</p>` : ''}
<div class="rise d4 btns">
<a href="#agendar" data-book="" class="btn btn-main shine pulse">${CHAT()} Agendar horário</a>
<a href="#trabalhos" class="btn btn-ghost">Ver trabalhos</a>
</div>
${h.address ? `<p class="rise d5 small">${e(h.address)}</p>` : ''}
</div>
<div class="rise d3 hero-media">
<div class="hero-photo">
<svg class="ring" viewBox="0 0 420 525" aria-hidden="true"><path d="M10 515 V210 A200 200 0 0 1 410 210 V515 Z" fill="none" stroke="var(--accent)" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="3 12"></path></svg>
<div class="halo" aria-hidden="true"></div>
<div class="rim" aria-hidden="true"></div>
<div class="arch">${img(h.photo, c.brand?.name || '', 'kb', false)}</div>
${STAR('var(--cream)', 34, ' class="spark" style="top: 6%; left: -6%"')}
${STAR('var(--accent2)', 22, ' class="spark" style="top: 30%; right: -7%; animation-delay: .9s"')}
${STAR('var(--accent2)', 28, ' class="spark" style="bottom: 14%; left: -9%; animation-delay: 1.6s"')}
${h.badge ? `<div class="badge">${STAR('#9B3AAE', 16)}<span>${e(h.badge)}</span></div>` : ''}
</div>
</div>
</section>`;
}

function marquee(c) {
  const m = c.marquee || {};
  if (!m.enabled || !(m.words || []).length) return '';
  const words = loop(m.words.map((w) => ({ w })), 8);
  return `<div class="marquee" aria-hidden="true"><div class="track fast mq">${words.map((x) => `<span>${e(x.w)}${STAR('#1A0B1D', 18)}</span>`).join('')}</div></div>`;
}

function gallery(c) {
  const g = c.gallery || {};
  if (!g.enabled) return '';
  const photos = (g.photos || []).filter((p) => safeUrl(p.src));
  const round = (g.round || []).filter((p) => safeUrl(p.src));
  if (!photos.length && !round.length) return '';
  const fig = (p, cls) => `<figure class="slide zoomable ${cls}"${p._dup ? ' aria-hidden="true"' : ''}>${img(p.src, p.alt)}</figure>`;
  return `
<section id="trabalhos" class="sec-full">
<div class="wrap">${head(g.eyebrow, g.title, g.highlight, g.note ? `<p class="muted side">${e(g.note)}</p>` : '')}</div>
${photos.length ? `<div class="lane"><div class="track">${loop(photos, 6).map((p) => fig(p, 'tall')).join('')}</div></div>` : ''}
${round.length ? `<div class="lane"><div class="track slow">${loop(round, 7).map((p) => fig(p, 'round')).join('')}</div></div>` : ''}
</section>`;
}

function videos(c) {
  const v = c.videos || {};
  const items = (v.items || []).filter((x) => safeUrl(x.src));
  if (!v.enabled || !items.length) return '';
  return `
<section id="videos" class="sec-full">
<div class="wrap">${head(v.eyebrow, v.title, v.highlight)}</div>
<div class="lane"><div class="track slow">${loop(items, 6).map((x) => `
<div class="slide vcard"${x._dup ? ' aria-hidden="true"' : ''}>
<video src="${e(safeUrl(x.src))}"${safeUrl(x.poster) ? ` poster="${e(safeUrl(x.poster))}"` : ''} muted loop playsinline preload="none" aria-label="${e(x.label)}"></video>
<div class="vshade" aria-hidden="true"></div>
${x.label ? `<span class="vlabel">${e(x.label)}</span>` : ''}
<button type="button" class="snd" aria-label="Ligar ou desligar o som"${x._dup ? ' tabindex="-1"' : ''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"></path></svg></button>
</div>`).join('')}</div></div>
</section>`;
}

function about(c) {
  const a = c.about || {};
  if (!a.enabled) return '';
  return `
<section id="sobre" class="wrap about">
${safeUrl(a.photo) ? `<div class="reveal about-media"><div class="float about-photo">${img(a.photo, a.eyebrow || 'Foto')}</div>${STAR('var(--accent2)', 30, ' class="spark" style="top: -10px; right: 8%; animation-delay: .4s"')}</div>` : ''}
<div class="reveal about-text">
${a.eyebrow ? `<p class="eyebrow">${e(a.eyebrow)}</p>` : ''}
<h2 class="h2">${em(a.title, a.highlight)}</h2>
${(a.paragraphs || []).filter(Boolean).map((p) => `<p class="body">${e(p)}</p>`).join('')}
${(a.tags || []).length ? `<div class="tags">${a.tags.map((t) => `<span>${e(t)}</span>`).join('')}</div>` : ''}
</div>
</section>`;
}

function services(c) {
  const s = c.services || {};
  if (!s.enabled) return '';
  const items = (s.items || []).filter((x) => x.name);
  const card = (x) => `<article class="svc-card"${x._dup ? ' aria-hidden="true"' : ''}>
${img(x.photo, 'Resultado: ' + x.name)}
${x.price ? `<span class="svc-price">R$ ${e(x.price)}</span>` : ''}
<div class="svc-info"><h3>${e(x.name)}</h3>${x.desc ? `<p>${e(x.desc)}</p>` : ''}
<a href="#agendar" data-book="${e(x.name)}" data-track="service" data-label="${e(x.name)}" class="svc-btn"${x._dup ? ' tabindex="-1"' : ''} aria-label="Agendar ${e(x.name)}">Agendar</a></div>
</article>`;
  const h = c.homeService || {};
  return `
<section id="servicos" class="wrap sec">
${head(s.eyebrow, s.title, s.highlight, s.intro ? `<p class="muted side">${e(s.intro)}</p>` : '')}
${items.length ? `<div class="svc-lane lane"><div class="track svc-track">${loop(items, 5).map(card).join('')}</div></div>` : ''}
${s.note ? `<p class="reveal note">${e(s.note)} <a href="#agendar" data-book="">Fale comigo</a>.</p>` : ''}
${h.enabled ? `<div class="reveal home-box">
<div class="home-l"><span class="float home-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path><path d="M10 20v-5h4v5"></path></svg></span>
<div><h3>${e(h.title)}</h3><p>${e(h.text)}</p></div></div>
<a href="#agendar" data-book="" data-note="Atendimento a domicílio" class="btn btn-dark">${e(h.button || 'Quero em casa')}</a>
</div>` : ''}
</section>`;
}

function info(c) {
  const f = c.info || {};
  const tabs = (f.tabs || []).filter((t) => t.label);
  if (!f.enabled || !tabs.length) return '';
  return `
<section id="cuidados" class="wrap sec">
${head(f.eyebrow, f.title, f.highlight)}
<div class="reveal tabs" role="tablist" aria-label="${e(f.eyebrow || 'Informações')}">
${tabs.map((t, i) => `<button type="button" role="tab" id="tab-${i}" aria-controls="pn-${i}" aria-selected="${i === 0}" class="tabbtn" data-tab="${i}">${e(t.label)}</button>`).join('')}
</div>
<div class="reveal panelbox">
${tabs.map((t, i) => `<div class="panel" role="tabpanel" id="pn-${i}" aria-labelledby="tab-${i}"${i ? ' hidden' : ''}>
<div class="panel-head">${t.big ? `<span class="panel-big">${e(t.big)}</span>` : ''}<h3>${e(t.title || t.label)}</h3>${t.intro ? `<p class="muted">${e(t.intro)}</p>` : ''}</div>
<ul class="panel-list">${(t.items || []).map((it, j) => `<li class="itm" style="animation-delay:${(j * 0.08).toFixed(2)}s">${STAR('var(--accent2)', 18)}<span><strong>${e(it.t)}</strong> <span class="muted">${e(it.d)}</span></span></li>`).join('')}</ul>
</div>`).join('')}
</div>
</section>`;
}

function feedback(c) {
  const f = c.feedback || {};
  const items = (f.items || []).filter((x) => x.text);
  if (!f.enabled || !items.length) return '';
  const stars = '<span class="stars" aria-label="Cinco estrelas">' + '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7 7 .6-5.3 4.6 1.6 7L12 17.4 5.7 21.2l1.6-7L2 9.6 9 9z" fill="currentColor"></path></svg>'.repeat(5) + '</span>';
  return `
<section id="feedback" class="sec-full">
<div class="wrap">${head(f.eyebrow, f.title, f.highlight)}</div>
<div class="lane"><div class="track slow">${loop(items, 4).map((x) => `<figure class="slide fb"${x._dup ? ' aria-hidden="true"' : ''}>
<svg width="40" height="30" viewBox="0 0 40 30" aria-hidden="true"><path d="M0 30V17Q0 4 14 0l2 4Q8 7 8 14h8v16zM22 30V17q0-13 14-17l2 4q-8 3-8 10h8v16z" fill="#9B3AAE"></path></svg>
<blockquote>${e(x.text)}</blockquote>
<figcaption>${stars}${e(x.author || 'Cliente')}</figcaption></figure>`).join('')}</div></div>
</section>`;
}

function contact(c) {
  const k = c.contact || {};
  const ig = String(k.instagram || '').replace(/^@/, '').replace(/[^\w.]/g, '');
  const wa = digits(k.whatsapp);
  const waFmt = wa.length >= 12 ? `(${wa.slice(2, 4)}) ${wa.slice(4, wa.length - 4)}-${wa.slice(-4)}` : wa;
  return `
<footer id="contato" class="foot">
<div class="wrap foot-in">
<div class="reveal foot-top">
<h2 class="h-big">${e(k.title || 'Agende')}${k.highlight ? `<br><em>${e(k.highlight)}</em>` : ''}</h2>
<a href="#agendar" data-book="" class="btn btn-dark btn-lg shine pulse">${CHAT(22)} Agendar horário</a>
</div>
<div class="foot-grid">
${k.address ? `<div><div class="lbl">Endereço</div>${e(k.address)}</div>` : ''}
${ig ? `<div><div class="lbl">Instagram</div><a href="https://www.instagram.com/${e(ig)}/" data-track="instagram" target="_blank" rel="noopener">@${e(ig)}</a></div>` : ''}
${wa ? `<div><div class="lbl">WhatsApp</div><a href="https://wa.me/${wa}" data-track="whatsapp" data-label="rodapé" target="_blank" rel="noopener">${e(waFmt)}</a></div>` : ''}
</div>
<p class="copy">© ${new Date().getFullYear()} ${e(c.brand?.name)}</p>
</div>
</footer>`;
}

// Como o botão "Agendar" funciona nesta página:
// form = formulário (fica na lista do painel e, se quiser, abre o WhatsApp para confirmar)
// whatsapp = vai direto para o WhatsApp escolhido com a mensagem pronta
export function bookingInfo(tenant, c) {
  const b = c.booking || {};
  const mode = b.mode || (b.enabled ? 'form' : 'whatsapp');
  const raw = digits(b.whatsapp || c.contact?.whatsapp || tenant.whatsapp);
  const wa = raw.length >= 10 && raw.length <= 11 ? '55' + raw : raw;
  return { wa, booking: mode === 'form' && !safeUrl(c.cta?.url), msg: String(b.message || '').slice(0, 600), thenWa: b.thenWhatsapp !== false };
}

function bookingModal(c) {
  const b = c.booking || {};
  if (!b.enabled) return '';
  const svc = (c.services?.items || []).filter((x) => x.name);
  const times = (b.times || []).filter(Boolean);
  return `
<div class="bk" id="bk" role="dialog" aria-modal="true" aria-labelledby="bkTitle" hidden>
<form class="bk-card" id="bkForm" novalidate>
<button type="button" class="bk-x" aria-label="Fechar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
<h2 id="bkTitle">${e(b.title || 'Agende seu horário')}</h2>
<p class="bk-sub">Preencha e envie. Abriremos o WhatsApp com tudo pronto para confirmar.</p>
<label>Seu nome<input name="name" required autocomplete="name" maxlength="80"></label>
<label>Seu WhatsApp<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="(67) 99999-9999" maxlength="20"></label>
${svc.length ? `<label>Serviço<select name="service">${svc.map((x) => `<option>${e(x.name)}</option>`).join('')}<option value="Outro">Outro / ainda não sei</option></select></label>` : '<input type="hidden" name="service" value="">'}
<div class="bk-row">
<label>Data<input type="date" name="date" required></label>
<label>Horário${times.length ? `<select name="time">${times.map((t) => `<option>${e(t)}</option>`).join('')}</select>` : '<input type="time" name="time" required>'}</label>
</div>
<label>Observação <span class="opt">(opcional)</span><textarea name="note" rows="2" maxlength="300"></textarea></label>
<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
<button type="submit" class="btn btn-main bk-send">${CHAT()} Enviar e abrir WhatsApp</button>
<p class="bk-msg" role="status" aria-live="polite"></p>
</form>
</div>`;
}

function renderGlamour(tenant, config, { preview = false, offline = false, embed = false } = {}) {
  const c = config || {};
  const t = c.theme || {};
  const name = c.brand?.name || tenant.business_name;
  const wa = digits(c.contact?.whatsapp || tenant.whatsapp);
  const svcNames = (c.services?.items || []).map((x) => x.name).filter(Boolean);
  const data = { slug: tenant.slug, wa, ...bookingInfo(tenant, c), preview, closed: c.booking?.closedWeekdays || [], services: svcNames, cta: safeUrl(c.cta?.url) };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const description = c.hero?.subtitle || `${name} · ${c.brand?.tagline || ''}`;
  const ogImg = safeUrl(c.hero?.photo);
  const body = offline
    ? `<main class="offline"><h1 class="h2">${e(name)}</h1><p class="muted">Esta página está temporariamente indisponível.</p></main>`
    : `
<header class="top"><nav class="wrap nav">
<a href="#inicio" class="logo"><span>${e(name)}</span>${c.brand?.tagline ? `<small>${e(c.brand.tagline)}</small>` : ''}</a>
<div class="links">
${c.gallery?.enabled ? '<a href="#trabalhos" class="navlink">Trabalhos</a>' : ''}
${c.services?.enabled ? '<a href="#servicos" class="navlink">Serviços</a>' : ''}
${c.about?.enabled ? '<a href="#sobre" class="navlink">Sobre</a>' : ''}
<a href="#contato" class="navlink">Contato</a>
<a href="#agendar" data-book="" class="btn btn-main btn-sm shine">Agendar</a>
</div></nav></header>
${hero(c)}
${marquee(c)}
${gallery(c)}
${videos(c)}
${about(c)}
${services(c)}
${info(c)}
${feedback(c)}
${contact(c)}
<a href="#agendar" data-book="" class="wa-float" aria-label="Agendar horário">${CHAT(28)}</a>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Foto ampliada"><button type="button" id="lbClose" aria-label="Fechar">✕</button><img id="lbImg" alt=""></div>
${safeUrl(c.cta?.url) ? '' : bookingModal(c)}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(name)}${c.brand?.tagline ? ' · ' + e(c.brand.tagline) : ''}</title>
<meta name="description" content="${e(description)}">
<meta property="og:title" content="${e(name)}">
<meta property="og:description" content="${e(description)}">
${ogImg ? `<meta property="og:image" content="${e(ogImg)}">` : ''}
<meta name="theme-color" content="${color(t.bg, '#0F0A10')}">
${preview ? '<meta name="robots" content="noindex">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/page.css">
<link rel="stylesheet" href="/static/page2.css">
<style>:root{--accent:${color(t.accent, '#D45AE8')};--accent2:${color(t.accent2, '#E58BF2')};--bg:${color(t.bg, '#0F0A10')};--cream:${color(t.cream, '#F3E9C6')}}</style>
</head>
<body${embed ? ' class="embed"' : ''}>
${body}
<script>window.__SS=${json}</script>
<script src="/static/page.js" defer></script>
</body>
</html>`;
}

/* ---------------- Modelos de página ----------------
   Cada modelo recebe a MESMA configuração (seções, fotos, serviços…) e desenha do seu jeito.
   Para adicionar um modelo: crie a função render e registre aqui. */
const tatico = makeTatico({ e, safeUrl, color, digits, bookingModal, loop, bookingInfo });

export const TEMPLATES = {
  glamour: {
    id: 'glamour',
    name: 'Glamour',
    desc: 'Escuro e elegante, com detalhes coloridos, carrosséis e animações suaves. Ótimo para beleza e estética.',
    thumb: '/static/models/glamour.jpg',
    tags: ['Beleza', 'Estética', 'Cílios', 'Unhas'],
    render: renderGlamour,
    theme: { accent: '#D45AE8', accent2: '#E58BF2', bg: '#0F0A10', cream: '#F3E9C6' },
  },
  tatico: {
    id: 'tatico',
    name: 'Tático',
    desc: 'Preto com neon laranja, fumaça animada e cartões com cantos de mira. Ótimo para airsoft, barbearia, tatuagem e lojas.',
    thumb: '/static/models/tatico.jpg',
    tags: ['Airsoft', 'Barbearia', 'Tatuagem', 'Loja'],
    render: tatico.render,
    theme: { accent: '#FF6A00', accent2: '#FF8F33', bg: '#070707', cream: '#F3F3F3' },
  },
};

export const templateList = () => Object.values(TEMPLATES).map(({ render, ...t }) => t);

export function renderPage(tenant, config, opts = {}) {
  const tpl = TEMPLATES[config?.template] || TEMPLATES.glamour;
  return tpl.render(tenant, config, opts);
}

// Termos de uso / Política de privacidade de cada página (texto editável no painel)
export function renderLegalPage(tenant, config, which, opts = {}) {
  return tatico.renderLegal(tenant, config, which, opts);
}
