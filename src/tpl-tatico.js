// Modelo "Tático": preto, laranja neon, Oswald, fumaça, cartões com cantos de mira.
// Baseado na página Toy Master. Usa a mesma configuração (JSON) dos outros modelos.

export function makeTatico(H) {
  const { e, safeUrl, color, digits, bookingModal, loop } = H;
  const em = (t, hl) => `${e(t)}${hl ? ` <em>${e(hl)}</em>` : ''}`;
  const OK = '<svg aria-hidden="true"><use href="#ok"/></svg>';
  const WA = '<svg aria-hidden="true"><use href="#wa"/></svg>';
  const pic = (src, alt, cls = '', lazy = true) => {
    const u = safeUrl(src);
    return u ? `<img${cls ? ` class="${cls}"` : ''} src="${e(u)}" alt="${e(alt || '')}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>` : '';
  };
  const head = (tag, title, hl, sub, center) => `<div class="head${center ? ' center' : ''}">${tag ? `<span class="tag wipe">// ${e(tag)}</span>` : ''}<h2 class="wipe">${em(title, hl)}</h2>${sub ? `<p>${e(sub)}</p>` : ''}</div>`;

  return function renderTatico(tenant, c, { preview = false, offline = false, embed = false } = {}) {
    c = c || {};
    const t = c.theme || {};
    const name = c.brand?.name || tenant.business_name;
    const h = c.hero || {};
    const wa = digits(c.contact?.whatsapp || tenant.whatsapp);
    const svcNames = (c.services?.items || []).map((x) => x.name).filter(Boolean);
    const data = { slug: tenant.slug, wa, booking: !!c.booking?.enabled, preview, closed: c.booking?.closedWeekdays || [], services: svcNames };
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    const logo = safeUrl(h.photo) || safeUrl(c.about?.photo);
    const bg = safeUrl(h.bg) || safeUrl(c.gallery?.photos?.[0]?.src) || '';
    const words = (c.marquee?.enabled ? c.marquee.words || [] : []).filter(Boolean);
    const trust = (c.about?.tags || []).filter(Boolean).slice(0, 3);
    const parts = name.trim().split(/\s+/);
    const brandHtml = parts.length > 1 ? `${e(parts.slice(0, -1).join(' '))} <b>${e(parts[parts.length - 1])}</b>` : `<b>${e(name)}</b>`;

    // ----- seções -----
    const hero = `
<section class="hero">
<div class="hero-bg" aria-hidden="true">${bg ? `<img class="bgimg" src="${e(bg)}" alt="" fetchpriority="high">` : ''}<div class="smoke s1"></div><div class="smoke s2"></div><div class="scanline"></div></div>
<div class="wrap"><div class="hero-copy">
${logo ? `<div class="medal">${pic(logo, name, '', false)}</div>` : ''}
${h.badge ? `<div><span class="badge"><span class="dot"></span>${e(h.badge)}</span></div>` : ''}
<h1>${e(h.title)} ${h.highlight ? `<span class="hl">${e(h.highlight)}</span>` : ''}</h1>
${h.subtitle ? `<p class="lead">${e(h.subtitle)}</p>` : ''}
<div><a class="btn" href="#agendar" data-book="">${WA} Agendar horário</a></div>
${trust.length ? `<div class="trust">${trust.map((x) => `<span>${OK}${e(x)}</span>`).join('')}</div>` : ''}
${h.eyebrow || h.address ? `<p class="where">${e([h.eyebrow, h.address].filter(Boolean).join(' · '))}</p>` : ''}
</div></div>
</section>`;

    const sv = c.services || {};
    const svcItems = (sv.items || []).filter((x) => x.name);
    const services = sv.enabled && svcItems.length ? `
<section class="alt" id="servicos"><div class="wrap">
${head(sv.eyebrow || 'Serviços', sv.title, sv.highlight, sv.intro)}
<div class="grid g3">${svcItems.map((x) => `<article class="card svc reveal">
${safeUrl(x.photo) ? `<div class="svc-img zoomable">${pic(x.photo, 'Resultado: ' + x.name)}</div>` : ''}
<div class="svc-top"><h3>${e(x.name)}</h3>${x.price ? `<span class="price">R$ ${e(x.price)}</span>` : ''}</div>
${x.desc ? `<p>${e(x.desc)}</p>` : ''}
<a class="btn btn-sm" href="#agendar" data-book="${e(x.name)}" data-track="service" data-label="${e(x.name)}">Agendar</a>
</article>`).join('')}</div>
${sv.note ? `<p class="note-line">${e(sv.note)} <a href="#agendar" data-book="">Fale comigo</a>.</p>` : ''}
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
    const cta = `
<section id="contato"><div class="wrap"><div class="cta reveal">
<div class="cta-glow"></div>
${logo ? `<div class="radar">${pic(logo, name)}</div>` : ''}
<div class="limit"><span class="dot"></span>Agenda aberta</div>
<h2>${e(k.title || 'Garanta seu horário')} ${k.highlight ? `<span class="hl">${e(k.highlight)}</span>` : ''}</h2>
${k.address ? `<p>${e(k.address)}</p>` : ''}
<a class="btn" href="#agendar" data-book="">${WA} Agendar horário</a>
<div class="trust">${ig ? `<span>${OK}<a href="https://www.instagram.com/${e(ig)}/" target="_blank" rel="noopener" data-track="instagram">@${e(ig)}</a></span>` : ''}${wa ? `<span>${OK}<a href="https://wa.me/${wa}" target="_blank" rel="noopener" data-track="whatsapp" data-label="rodapé">${e(waFmt)}</a></span>` : ''}</div>
</div></div></section>`;

    const body = offline
      ? `<main class="offline"><h1>${e(name)}</h1><p>Esta página está temporariamente indisponível.</p></main>`
      : `
${words.length ? `<div class="announce">${e(words.slice(0, 3).join(' • '))}</div>` : ''}
<header class="top"><div class="wrap">
<a class="brand" href="#">${logo ? pic(logo, '', '', false) : ''}<span>${brandHtml}</span></a>
${c.brand?.tagline ? `<span class="pill"><span class="dot"></span>${e(c.brand.tagline)}</span>` : ''}
</div></header>
<main>${hero}${services}${gallery}${videos}${about}${home}${feedback}${info}${cta}</main>
<footer><div class="wrap">
<a class="brand" href="#">${logo ? pic(logo, '') : ''}<span>${brandHtml}</span></a>
${k.address ? `<p>${e(k.address)}</p>` : ''}
<p>© ${new Date().getFullYear()} ${e(name)}. Todos os direitos reservados.</p>
</div></footer>
<div class="sticky"><a class="btn" href="#agendar" data-book="">${WA} Agendar horário</a></div>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Foto ampliada"><button type="button" id="lbClose" aria-label="Fechar">✕</button><img id="lbImg" alt=""></div>
${bookingModal(c)}`;

    const ac = color(t.accent, '#FF6A00'), ac2 = color(t.accent2, '#FF8F33'), bgc = color(t.bg, '#070707');
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(name)}${c.brand?.tagline ? ' · ' + e(c.brand.tagline) : ''}</title>
<meta name="description" content="${e(h.subtitle || name)}">
<meta property="og:title" content="${e(name)}">
<meta property="og:description" content="${e(h.subtitle || '')}">
${logo ? `<meta property="og:image" content="${e(logo)}">` : ''}
<meta name="theme-color" content="${bgc}">
${preview ? '<meta name="robots" content="noindex">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/tatico/tatico.css">
<style>:root{--o:${ac};--o2:${ac2};--bg:${bgc};--bk:${ac};--cream:${color(t.cream, '#F3F3F3')}}</style>
</head>
<body class="${embed ? 'embed' : ''}">
<script>document.documentElement.classList.add('js')</script>
<div class="progress" aria-hidden="true"></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="wa" viewBox="0 0 24 24"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 0 1-1.44-5.02c0-5.2 4.23-9.44 9.44-9.44a9.38 9.38 0 0 1 9.43 9.45c0 5.2-4.23 9.43-9.44 9.43m8.03-17.47A11.27 11.27 0 0 0 12.05.7C5.8.7.7 5.8.7 12.04c0 2 .52 3.95 1.52 5.66L.6 23.6l6.04-1.58a11.3 11.3 0 0 0 5.4 1.38h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.32-8.02"/></symbol>
<symbol id="ok" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5"/></symbol>
</svg>
${body}
<script>window.__SS=${json}</script>
<script src="/static/page.js" defer></script>
<script src="/static/tatico/tatico.js" defer></script>
</body>
</html>`;
  };
}
