// Modelo "Tático": preto, laranja neon, Oswald, fumaça, cartões com cantos de mira.
// Baseado na página Toy Master. Usa a mesma configuração (JSON) dos outros modelos.

export const TATICO_ICONS = {
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  cupom: '<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M14 5v2M14 11v2M14 17v2"/>',
  sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  sorriso: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>',
  estrela: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  local: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  coracao: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  presente: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
  tesoura: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  carrinho: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L21 8H6"/>',
};

// Texto simples com "## título", "- item" e **negrito** -> HTML seguro
export function mdLite(text, e) {
  const inline = (s) => e(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const out = []; let list = null;
  for (const raw of String(text || '').split(/\n/)) {
    const line = raw.trim();
    if (/^- /.test(line)) { (list = list || []).push(`<li>${inline(line.slice(2))}</li>`); continue; }
    if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null; }
    if (!line) continue;
    if (/^## /.test(line)) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push(`<ul>${list.join('')}</ul>`);
  return out.join('\n');
}

export function makeTatico(H) {
  const { e, safeUrl, color, digits, bookingModal, loop, bookingInfo } = H;
  const em = (t, hl) => `${e(t)}${hl ? ` <em>${e(hl)}</em>` : ''}`;
  const strong = (s) => e(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const OK = '<svg aria-hidden="true"><use href="#ok"/></svg>';
  const WA = '<svg aria-hidden="true"><use href="#wa"/></svg>';
  const ico = (k) => `<div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TATICO_ICONS[k] || TATICO_ICONS.alvo}</svg></div>`;
  const pic = (src, alt, cls = '', lazy = true, extra = '') => {
    const u = safeUrl(src);
    return u ? `<img${cls ? ` class="${cls}"` : ''} src="${e(u)}" alt="${e(alt || '')}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}${extra}>` : '';
  };
  const head = (tag, title, hl, sub, center, inline) => `<div class="head${center ? ' center' : ''}"${inline ? ' style="margin:0"' : ''}>${tag ? `<span class="tag wipe">// ${e(tag)}</span>` : ''}<h2 class="wipe">${em(title, hl)}</h2>${sub ? `<p>${e(sub)}</p>` : ''}</div>`;
  const brandSpan = (name) => {
    const parts = String(name || '').trim().split(/\s+/);
    return parts.length > 1 ? `${e(parts.slice(0, -1).join(' '))} <b>${e(parts[parts.length - 1])}</b>` : `<b>${e(name)}</b>`;
  };
  const symbols = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="wa" viewBox="0 0 24 24"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 0 1-1.44-5.02c0-5.2 4.23-9.44 9.44-9.44a9.38 9.38 0 0 1 9.43 9.45c0 5.2-4.23 9.43-9.44 9.43m8.03-17.47A11.27 11.27 0 0 0 12.05.7C5.8.7.7 5.8.7 12.04c0 2 .52 3.95 1.52 5.66L.6 23.6l6.04-1.58a11.3 11.3 0 0 0 5.4 1.38h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.32-8.02"/></symbol>
<symbol id="ok" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5"/></symbol>
</svg>`;

  function docHead(c, title, desc, preview) {
    const t = c.theme || {};
    const fav = safeUrl(c.brand?.favicon) || safeUrl(c.hero?.photo);
    const og = safeUrl(c.brand?.ogImage) || safeUrl(c.hero?.photo);
    return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(desc)}">
${og ? `<meta property="og:image" content="${e(og)}">` : ''}
${fav ? `<link rel="icon" href="${e(fav)}">` : ''}
<meta name="theme-color" content="${color(t.bg, '#070707')}">
${preview ? '<meta name="robots" content="noindex">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>:root{--o:${color(t.accent, '#FF6A00')};--o2:${color(t.accent2, '#FF8F33')};--bg:${color(t.bg, '#070707')};--cream:${color(t.cream, '#F3F3F3')}}</style>`;
  }

  function render(tenant, c, { preview = false, offline = false, embed = false, base = '' } = {}) {
    c = c || {};
    const name = c.brand?.name || tenant.business_name;
    const h = c.hero || {};
    const wa = digits(c.contact?.whatsapp || tenant.whatsapp);
    const ctaUrl = safeUrl(c.cta?.url);
    const ctaText = c.cta?.text || (ctaUrl ? 'Fale conosco' : 'Agendar horário');
    const svcNames = (c.services?.items || []).map((x) => x.name).filter(Boolean);
    const data = { slug: tenant.slug, wa, ...bookingInfo(tenant, c), preview, closed: c.booking?.closedWeekdays || [], services: svcNames, cta: ctaUrl };
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    const logo = safeUrl(h.photo) || safeUrl(c.about?.photo);
    const bg = safeUrl(h.bg) || safeUrl(c.gallery?.photos?.[0]?.src) || '';
    const bgM = safeUrl(h.bgMobile);
    const announce = c.brand?.announce || (c.marquee?.enabled ? (c.marquee.words || []).filter(Boolean).slice(0, 3).join(' • ') : '');
    const heroTrust = (h.trust && h.trust.length ? h.trust : (c.about?.tags || [])).filter(Boolean).slice(0, 4);
    const btn = (label, text, extra = '') => ctaUrl
      ? `<a class="btn${extra}" data-b="${e(label)}" href="${e(ctaUrl)}" target="_blank" rel="noopener" data-track="whatsapp" data-label="${e(label)}">${WA} ${e(text)}</a>`
      : `<a class="btn${extra}" href="#agendar" data-book="">${WA} ${e(text)}</a>`;
    const legal = c.legal || {};
    const hasTermos = !!(legal.termos && legal.termos.body), hasPriv = !!(legal.privacidade && legal.privacidade.body);

    const hero = `
<section class="hero">
<div class="hero-bg" aria-hidden="true">${bg ? `<img class="bgimg" src="${e(bg)}"${bgM ? ` srcset="${e(bgM)} 820w, ${e(bg)} 1254w" sizes="100vw"` : ''} alt="" fetchpriority="high">` : ''}<div class="smoke s1"></div><div class="smoke s2"></div><div class="scanline"></div></div>
<div class="wrap"><div class="hero-copy">
${logo ? `<div class="medal">${pic(logo, name, '', false, ' width="168" height="168"')}</div>` : ''}
${h.badge ? `<div><span class="badge"><span class="dot"></span>${e(h.badge)}</span></div>` : ''}
<h1>${e(h.title)}${h.highlight ? ` <span class="hl">${e(h.highlight)}</span>` : ''}${h.after ? ` ${e(h.after)}` : ''}</h1>
${h.subtitle ? `<p class="lead">${e(h.subtitle)}</p>` : ''}
<div>${btn('hero', ctaText)}</div>
${heroTrust.length ? `<div class="trust">${heroTrust.map((x) => `<span>${OK}${e(x)}</span>`).join('')}</div>` : ''}
${h.eyebrow || h.address ? `<p class="where">${e([h.eyebrow, h.address].filter(Boolean).join(' · '))}</p>` : ''}
</div></div>
</section>`;

    const blocks = (c.blocks || []).filter((b) => b && b.enabled !== false && (b.items || []).some((x) => x.t)).map((b) => {
      const items = b.items.filter((x) => x.t);
      const cls = b.alt ? ' class="alt"' : '';
      if (b.kind === 'checks') {
        return `<section${cls}><div class="wrap safe">${head(b.eyebrow, b.title, b.highlight, b.sub, false, true)}
<ul class="checks">${items.map((x) => `<li class="card reveal">${OK}<div><b>${e(x.t)}</b>${x.d ? `<span>${e(x.d)}</span>` : ''}</div></li>`).join('')}</ul></div></section>`;
      }
      const cols = items.length >= 4 && b.kind !== 'steps' ? 'g4' : 'g3';
      const body = b.kind === 'steps'
        ? items.map((x, i) => `<div class="card step reveal"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${e(x.t)}</h3>${x.d ? `<p>${strong(x.d)}</p>` : ''}</div>`).join('')
        : items.map((x) => `<div class="card${x.note ? ' cat' : ''} reveal">${ico(x.icon)}<h3>${e(x.t)}</h3>${x.d ? `<p>${strong(x.d)}</p>` : ''}${x.note ? `<span class="note">${e(x.note)}</span>` : ''}</div>`).join('');
      return `<section${cls}><div class="wrap">${head(b.eyebrow, b.title, b.highlight, b.sub, b.center)}<div class="grid ${cols}">${body}</div></div></section>`;
    }).join('');

    const sv = c.services || {};
    const svcItems = (sv.items || []).filter((x) => x.name);
    const services = sv.enabled && svcItems.length ? `
<section class="alt" id="servicos"><div class="wrap">
${head(sv.eyebrow || 'Serviços', sv.title, sv.highlight, sv.intro)}
<div class="grid g3">${svcItems.map((x) => `<article class="card svc reveal">
${safeUrl(x.photo) ? `<div class="svc-img zoomable">${pic(x.photo, 'Resultado: ' + x.name)}</div>` : ''}
<div class="svc-top"><h3>${e(x.name)}</h3>${x.price ? `<span class="price">R$ ${e(x.price)}</span>` : ''}</div>
${x.desc ? `<p>${e(x.desc)}</p>` : ''}
${ctaUrl ? `<a class="btn btn-sm" href="${e(ctaUrl)}" target="_blank" rel="noopener" data-track="service" data-label="${e(x.name)}">${e(ctaText)}</a>` : `<a class="btn btn-sm" href="#agendar" data-book="${e(x.name)}" data-track="service" data-label="${e(x.name)}">Agendar</a>`}
</article>`).join('')}</div>
${sv.note ? `<p class="note-line">${e(sv.note)}</p>` : ''}
</div></section>` : '';

    const g = c.gallery || {};
    const photos = (g.photos || []).concat(g.round || []).filter((p) => safeUrl(p.src));
    const gallery = g.enabled && photos.length ? `
<section id="trabalhos"><div class="wrap">${head(g.eyebrow || 'Portfólio', g.title, g.highlight, g.note, true)}</div>
<div class="lane"><div class="track">${loop(photos, 6).map((p) => `<figure class="slide shot zoomable"${p._dup ? ' aria-hidden="true"' : ''}>${pic(p.src, p.alt)}</figure>`).join('')}</div></div>
</section>` : '';

    const v = c.videos || {};
    const vids = (v.items || []).filter((x) => safeUrl(x.src));
    const videos = v.enabled && vids.length ? `
<section class="alt"><div class="wrap">${head(v.eyebrow || 'Vídeos', v.title, v.highlight, '', true)}</div>
<div class="lane"><div class="track slow">${loop(vids, 6).map((x) => `<div class="slide vshot"${x._dup ? ' aria-hidden="true"' : ''}>
<video src="${e(safeUrl(x.src))}"${safeUrl(x.poster) ? ` poster="${e(safeUrl(x.poster))}"` : ''} muted loop playsinline preload="none" aria-label="${e(x.label)}"></video>
${x.label ? `<span class="vlabel">${e(x.label)}</span>` : ''}
<button type="button" class="snd" aria-label="Ligar ou desligar o som"${x._dup ? ' tabindex="-1"' : ''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"></path></svg></button>
</div>`).join('')}</div></div>
</section>` : '';

    const a = c.about || {};
    const about = a.enabled ? `
<section id="sobre"><div class="wrap safe">
<div class="head" style="margin:0">${a.eyebrow ? `<span class="tag wipe">// ${e(a.eyebrow)}</span>` : ''}<h2 class="wipe">${em(a.title, a.highlight)}</h2>
${(a.paragraphs || []).filter(Boolean).map((p) => `<p>${e(p)}</p>`).join('')}</div>
<div>${safeUrl(a.photo) && safeUrl(a.photo) !== logo ? `<div class="card about-pic reveal zoomable">${pic(a.photo, a.eyebrow || name)}</div>` : ''}
${(a.tags || []).length ? `<ul class="checks">${a.tags.map((x) => `<li class="card reveal">${OK}<div><b>${e(x)}</b></div></li>`).join('')}</ul>` : ''}</div>
</div></section>` : '';

    const hs = c.homeService || {};
    const home = hs.enabled ? `
<section class="tight"><div class="wrap"><div class="card home reveal">
<div><span class="tag">// EM CASA</span><h3>${e(hs.title)}</h3><p>${e(hs.text)}</p></div>
<a class="btn" href="#agendar" data-book="" data-note="Atendimento a domicílio">${e(hs.button || 'Quero em casa')}</a>
</div></div></section>` : '';

    const fb = c.feedback || {};
    const quotes = (fb.items || []).filter((x) => x.text);
    const feedback = fb.enabled && quotes.length ? `
<section class="alt"><div class="wrap">${head(fb.eyebrow || 'Feedback', fb.title, fb.highlight, '', true)}
<div class="grid g3">${quotes.map((x, i) => `<figure class="card step quote reveal"><span class="n">${String(i + 1).padStart(2, '0')}</span><blockquote>${e(x.text)}</blockquote><figcaption>— ${e(x.author || 'Cliente')}</figcaption></figure>`).join('')}</div>
</div></section>` : '';

    const inf = c.info || {};
    const tabs = (inf.tabs || []).filter((x) => x.label);
    const info = inf.enabled && tabs.length ? `
<section id="cuidados"><div class="wrap">${head(inf.eyebrow || 'Informações', inf.title, inf.highlight, '', true)}
<div class="faq">${tabs.map((x) => `<details class="reveal"><summary>${e(x.title || x.label)}</summary>${x.intro ? `<p>${e(x.intro)}</p>` : ''}<ul class="mini-list">${(x.items || []).map((it) => `<li><b>${e(it.t)}</b> ${e(it.d)}</li>`).join('')}</ul></details>`).join('')}</div>
</div></section>` : '';

    const k = c.contact || {};
    const ig = String(k.instagram || '').replace(/^@/, '').replace(/[^\w.]/g, '');
    const waFmt = wa.length >= 12 ? `(${wa.slice(2, 4)}) ${wa.slice(4, wa.length - 4)}-${wa.slice(-4)}` : wa;
    const ctrust = (k.trust || []).filter(Boolean);
    const cta = `
<section id="contato"><div class="wrap"><div class="cta reveal">
<div class="cta-glow"></div>
${logo ? `<div class="radar">${pic(logo, name, '', true, ' width="96" height="96"')}</div>` : ''}
<div class="limit"><span class="dot"></span>${e(k.limit || 'Agenda aberta')}</div>
<h2>${e(k.title || 'Garanta seu horário')}${k.highlight ? ` <span class="hl">${e(k.highlight)}</span>` : ''}</h2>
${k.text ? `<p>${e(k.text)}</p>` : k.address ? `<p>${e(k.address)}</p>` : ''}
${btn('cta', k.ctaText || ctaText)}
<div class="trust">${ctrust.length ? ctrust.map((x) => `<span>${OK}${e(x)}</span>`).join('') : `${ig ? `<span>${OK}<a href="https://www.instagram.com/${e(ig)}/" target="_blank" rel="noopener" data-track="instagram">@${e(ig)}</a></span>` : ''}${wa ? `<span>${OK}<a href="https://wa.me/${wa}" target="_blank" rel="noopener" data-track="whatsapp" data-label="rodapé">${e(waFmt)}</a></span>` : ''}`}</div>
</div></div></section>`;

    const fq = c.faq || {};
    const fqi = (fq.items || []).filter((x) => x.q);
    const faq = fq.enabled && fqi.length ? `
<section class="alt"><div class="wrap">${head(fq.eyebrow || 'Dúvidas', fq.title || 'Perguntas', fq.highlight ?? 'frequentes', '', true)}
<div class="faq">${fqi.map((x) => `<details class="reveal"><summary>${e(x.q)}</summary><p>${e(x.a)}</p></details>`).join('')}</div>
</div></section>` : '';

    const topbar = c.brand?.topbar === false ? '' : `<header class="top"><div class="wrap">
<a class="brand" href="#">${logo ? pic(logo, '', '', false, ' width="40" height="40"') : ''}<span>${brandSpan(name)}</span></a>
${c.brand?.tagline ? `<span class="pill"><span class="dot"></span>${e(c.brand.tagline)}</span>` : ''}
</div></header>`;

    const body = offline
      ? `<main class="offline"><h1>${e(name)}</h1><p>Esta página está temporariamente indisponível.</p></main>`
      : `
${announce ? `<div class="announce">${e(announce)}</div>` : ''}
${topbar}
<main>${hero}${blocks}${services}${gallery}${videos}${about}${home}${feedback}${info}${cta}${faq}</main>
<footer><div class="wrap">
<a class="brand" href="#">${logo ? pic(logo, '', '', true, ' width="40" height="40"') : ''}<span>${brandSpan(name)}</span></a>
${c.footer?.disclaimer ? `<p>${e(c.footer.disclaimer)}</p>` : k.address ? `<p>${e(k.address)}</p>` : ''}
${hasTermos || hasPriv ? `<nav class="legal">${hasTermos ? `<a href="${e(base)}/termos">Termos de uso</a>` : ''}${hasPriv ? `<a href="${e(base)}/privacidade">Política de privacidade</a>` : ''}</nav>` : ''}
<p>© ${new Date().getFullYear()} ${e(c.footer?.owner || tenant.business_name || name)}. Todos os direitos reservados.</p>
</div></footer>
<div class="sticky">${btn('sticky', ctaText)}</div>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Foto ampliada"><button type="button" id="lbClose" aria-label="Fechar">✕</button><img id="lbImg" alt=""></div>
${ctaUrl ? '' : bookingModal(c)}`;

    return `<!doctype html>
<html lang="pt-BR">
<head>
${docHead(c, c.brand?.title || `${name}${c.brand?.tagline ? ' | ' + c.brand.tagline : ''}`, c.brand?.description || h.subtitle || name, preview)}
<link rel="stylesheet" href="/static/tatico/tatico.css">
</head>
<body class="${embed ? 'embed' : ''}">
<script>document.documentElement.classList.add('js')</script>
<div class="progress" aria-hidden="true"></div>
${symbols}
${body}
<script>window.__SS=${json}</script>
<script src="/static/page.js" defer></script>
<script src="/static/tatico/tatico.js" defer></script>
</body>
</html>`;
  }

  // Páginas de Termos e Privacidade
  function renderLegal(tenant, c, which, { base = '' } = {}) {
    c = c || {};
    const name = c.brand?.name || tenant.business_name;
    const L = (c.legal || {})[which];
    if (!L || !L.body) return null;
    const logo = safeUrl(c.hero?.photo);
    const titles = { termos: ['Termos de', 'uso', 'TERMOS'], privacidade: ['Política de', 'privacidade', 'PRIVACIDADE'] };
    const [t1, t2, tag] = titles[which];
    const legal = c.legal || {};
    return `<!doctype html>
<html lang="pt-BR">
<head>
${docHead(c, `${L.title || t1} ${L.highlight || t2} | ${name}`, L.description || `${t1} ${t2} — ${name}`, false)}
<link rel="stylesheet" href="/static/tatico/legal.css">
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="${e(base)}/">${logo ? `<img src="${e(logo)}" alt="Logo ${e(name)}" width="40" height="40">` : ''}<span>${brandSpan(name)}</span></a>
<a class="back" href="${e(base)}/">← Voltar</a>
</div></header>
<main class="wrap doc">
<span class="tag">// ${tag}</span>
<h1>${e(L.title || t1)} <em>${e(L.highlight || t2)}</em></h1>
${L.updated ? `<p class="upd">${e(L.updated)}</p>` : ''}
${mdLite(L.body, e)}
</main>
<footer><div class="wrap">
<nav><a href="${e(base)}/">Início</a>${legal.termos?.body ? `<a href="${e(base)}/termos">Termos de uso</a>` : ''}${legal.privacidade?.body ? `<a href="${e(base)}/privacidade">Política de privacidade</a>` : ''}</nav>
<p>© ${new Date().getFullYear()} ${e(c.footer?.owner || tenant.business_name || name)}. Todos os direitos reservados.</p>
</div></footer>
</body>
</html>`;
  }

  return { render, renderLegal };
}
