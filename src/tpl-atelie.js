// Modelo "Ateliê": escuro, dourado, serifada elegante (Fraunces), aurora animada, foto em arco,
// galeria por categorias com carrossel. Baseado na página da Érica Vitória.

const WA_PATH = 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z';

export function makeAtelie(H) {
  const { e, safeUrl, color, digits, bookingModal, bookingInfo } = H;
  const WA = `<svg viewBox="0 0 24 24"><path d="${WA_PATH}"/></svg>`;

  function render(tenant, c, { preview = false, offline = false, embed = false } = {}) {
    c = c || {};
    const t = c.theme || {};
    const name = c.brand?.name || tenant.business_name;
    const h = c.hero || {};
    const k = c.contact || {};
    const bi = bookingInfo(tenant, c);
    const wa = bi.wa;
    const prefix = k.waPrefix ?? '';
    const svcNames = (c.services?.items || []).map((x) => x.name).filter(Boolean);
    const data = { slug: tenant.slug, wa, ...bi, preview, closed: c.booking?.closedWeekdays || [], services: svcNames };
    const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
    const waHref = (msg) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(prefix + (msg || ''))}` : '#contato');
    // Botão de agendar: formulário (se ligado) ou WhatsApp com a mensagem do botão
    const book = (cls, text, msg, label, extra = '') => bi.booking
      ? `<a class="${cls}" href="#agendar" data-book="" data-track="booking_open" data-label="${e(label)}"${extra}>${text}</a>`
      : `<a class="${cls}" href="${e(waHref(msg))}" target="_blank" rel="noopener" data-track="whatsapp" data-label="${e(label)}"${extra}>${text}</a>`;
    const waBtn = (cls, text, msg, label, extra = '') => `<a class="${cls}" href="${e(waHref(msg))}" target="_blank" rel="noopener" data-track="whatsapp" data-label="${e(label)}"${extra}>${text}</a>`;
    const title = (tt, hl, brk, after, afterBrk = true) => `${e(tt)}${hl ? `${brk ? '<br>' : ' '}<em>${e(hl)}</em>` : ''}${after ? `${afterBrk ? '<br>' : ' '}${e(after)}` : ''}`;
    const img = (src, alt, attrs = '') => { const u = safeUrl(src); return u ? `<img src="${e(u)}" alt="${e(alt || '')}"${attrs}>` : ''; };

    // galeria por categorias
    const g = c.gallery || {};
    const groups = (g.groups || []).map((gr) => ({ label: gr.label, items: (gr.photos || []).filter((p) => safeUrl(p.src)).map((p) => ({ src: safeUrl(p.src), cap: p.alt || '' })) })).filter((gr) => gr.label && gr.items.length);
    const works = {};
    if (groups.length) {
      works.todos = { label: g.allLabel || 'Todos', items: groups.flatMap((gr) => gr.items) };
      groups.forEach((gr, i) => { works['g' + i] = gr; });
    }
    const at = { works, rotate: (h.rotate || []).filter(Boolean), marquee: c.marquee?.enabled ? (c.marquee.words || []).filter(Boolean) : [] };

    const nav = [['trabalhos', 'Trabalhos', g.enabled && groups.length], ['servicos', 'Serviços', c.services?.enabled], ['sobre', 'Sobre', c.about?.enabled], ['contato', 'Contato', true]].filter((x) => x[2]);
    const rot = at.rotate;
    const faces = (h.faces || []).map((x) => safeUrl(x && typeof x === 'object' ? x.src : x)).filter(Boolean).slice(0, 5);
    const chips = (h.trust || []).filter(Boolean);
    const badges = (h.badges || []).filter((b) => b && b.t).slice(0, 2);

    const hero = `
<section class="hero">
  <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="wrap hero-grid">
    <div>
      ${h.eyebrow ? `<p class="eyebrow rv">${e(h.eyebrow)}</p>` : ''}
      <h1><span class="ln"><span>${e(h.title)}</span></span>${h.highlight ? `<span class="ln"><span><em>${e(h.highlight)}</em></span></span>` : ''}${h.after || rot.length ? `<span class="ln"><span>${e(h.after)}${rot.length ? ` <span class="rotor" id="rotor"><span>${e(rot[0])}</span></span>` : ''}</span></span>` : ''}</h1>
      ${h.subtitle ? `<p class="lead rv d1">${e(h.subtitle)}</p>` : ''}
      <div class="cta-row rv d2">
        ${book('btn btn-primary', `${WA}${e(h.ctaText || 'Agendar pelo WhatsApp')}`, h.ctaMsg || 'Vim pelo site e quero agendar um horário', 'capa')}
        ${h.secondText && nav.length && nav[0][0] === 'trabalhos' ? `<a class="btn btn-ghost" href="#trabalhos">${e(h.secondText)}</a>` : ''}
      </div>
      ${faces.length || h.proofTitle ? `<div class="proof rv d3">
        ${faces.length ? `<div class="faces">${faces.map((f) => `<img src="${e(f)}" alt="">`).join('')}</div>` : ''}
        <p><b>${e(h.proofTitle)}</b>${e(h.proofText)}</p>
      </div>` : ''}
      ${chips.length ? `<ul class="chips rv d3">${chips.map((x) => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="stage rv d1">
      <div class="ring"></div><div class="ring r2"></div>
      ${safeUrl(h.side1) ? `<div class="cw cw1"><div class="card">${img(h.side1, h.side1Alt || '')}</div></div>` : ''}
      ${safeUrl(h.side2) ? `<div class="cw cw2"><div class="card">${img(h.side2, h.side2Alt || '')}</div></div>` : ''}
      <div class="arch">${img(h.photo, h.photoAlt || name, ' fetchpriority="high" onerror="this.style.opacity=0"')}</div>
      ${h.seal ? book('seal', `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text><textPath href="#circ" textLength="283" lengthAdjust="spacing">${e(h.seal)}</textPath></text></svg><b>↗</b>`, h.ctaMsg || 'Vim pelo site e quero agendar um horário', 'selo', ' aria-label="Agendar"') : ''}
      ${badges.map((b, i) => `<div class="badge b${i + 1}"><i>${e(b.icon || '✨')}</i><div><b>${e(b.t)}</b>${b.d ? `<span>${e(b.d)}</span>` : ''}</div></div>`).join('')}
    </div>
  </div>
  ${nav.length && nav[0][0] === 'trabalhos' ? '<a class="cue" href="#trabalhos" aria-label="Ver trabalhos"><i></i></a>' : ''}
</section>`;

    const marq = at.marquee.length ? '<div class="marq" aria-hidden="true"><div class="marq-track" id="marq"></div></div>' : '';

    const ig = String(k.instagram || '').replace(/^@/, '').replace(/[^\w.]/g, '');
    const igUrl = ig ? `https://www.instagram.com/${ig}/` : '';
    const gallery = g.enabled && groups.length ? `
<section id="trabalhos">
  <div class="wrap">
    <div class="sec-head">
      <div>
        ${g.eyebrow ? `<p class="eyebrow rv">${e(g.eyebrow)}</p>` : ''}
        <h2 class="rv d1">${title(g.title, g.highlight, false, g.after)}</h2>
      </div>
      ${g.note ? `<p class="lead rv d2" style="max-width:38ch">${e(g.note)}</p>` : ''}
    </div>
    <div class="tabs rv" role="tablist" id="tabs"></div>
    <div id="panels"></div>
    ${g.strip === false ? '' : '<div class="strip" aria-hidden="true"><div class="strip-track" id="strip"></div></div>'}
    ${igUrl && g.instagramText ? `<p style="text-align:center;margin-top:44px" class="rv"><a class="btn btn-ghost" href="${e(igUrl)}" target="_blank" rel="noopener" data-track="instagram">${e(g.instagramText)}</a></p>` : ''}
  </div>
</section>` : '';

    const sv = c.services || {};
    const svcItems = (sv.items || []).filter((x) => x.name);
    const services = sv.enabled && svcItems.length ? `
<section id="servicos" style="background:var(--surface);border-block:1px solid var(--line)">
  <div class="wrap">
    ${sv.eyebrow ? `<p class="eyebrow rv">${e(sv.eyebrow)}</p>` : ''}
    <h2 class="rv d1">${title(sv.title, sv.highlight, sv.brk !== false)}</h2>
    ${sv.intro ? `<p class="lead rv d2">${e(sv.intro)}</p>` : ''}
    <div class="svc-grid">${svcItems.map((x, i) => `
      <article class="svc rv${i % 3 ? ' d' + (i % 3) : ''}">
        ${safeUrl(x.photo) ? `<div class="ph">${img(x.photo, x.name, ' loading="lazy"')}</div>` : ''}
        <span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${e(x.name)}</h3>
        ${x.price ? `<p class="price">R$ ${e(x.price)}</p>` : ''}
        ${x.desc ? `<p>${e(x.desc)}</p>` : ''}
        ${(x.tags || []).filter(Boolean).length ? `<ul>${x.tags.filter(Boolean).map((tg) => `<li>${e(tg)}</li>`).join('')}</ul>` : ''}
        ${bi.booking ? `<a href="#agendar" data-book="${e(x.name)}" data-track="service" data-label="${e(x.name)}">${e(x.cta || 'Agendar ↗')}</a>` : waBtn('', e(x.cta || 'Pedir valores ↗'), x.msg || `Quero saber mais sobre ${x.name}`, x.name, ` data-svc="${e(x.name)}"`)}
      </article>`).join('')}
    </div>
    ${sv.note ? `<p class="lead rv" style="margin-top:28px">${e(sv.note)}</p>` : ''}
  </div>
</section>` : '';

    const a = c.about || {};
    const pillars = (a.pillars || []).filter((p) => p && p.t);
    const about = a.enabled ? `
<section id="sobre" class="about">
  <div class="wrap about-grid">
    <div class="collage rv">
      ${img(a.photo, a.photoAlt || name, ' class="c1" loading="lazy" onerror="this.style.opacity=0"')}
      ${img(a.photo2, a.photo2Alt || name, ' class="c2" loading="lazy" onerror="this.style.opacity=0"')}
    </div>
    <div>
      ${a.eyebrow ? `<p class="eyebrow rv">${e(a.eyebrow)}</p>` : ''}
      <h2 class="rv d1">${title(a.title, a.highlight, a.brk !== false)}</h2>
      ${(a.paragraphs || []).filter(Boolean).map((p) => `<p class="rv d2">${e(p)}</p>`).join('')}
      ${pillars.length ? `<div class="pillars rv d3">${pillars.map((p) => `<div class="pillar"><b>${e(p.t)}</b><span>${e(p.d)}</span></div>`).join('')}</div>` : ''}
      ${a.button ? book('btn btn-primary rv d3', e(a.button), a.buttonMsg || 'Quero agendar', 'sobre') : ''}
    </div>
  </div>
</section>` : '';

    const st = c.steps || {};
    const stItems = (st.items || []).filter((x) => x.t);
    const steps = st.enabled && stItems.length ? `
<section style="padding-top:${a.enabled ? '0' : 'clamp(64px,10vw,120px)'}">
  <div class="wrap">
    ${st.eyebrow ? `<p class="eyebrow rv">${e(st.eyebrow)}</p>` : ''}
    <h2 class="rv d1">${title(st.title, st.highlight, false)}</h2>
    <div class="steps">${stItems.map((x, i) => `<div class="step rv${i % 3 ? ' d' + (i % 3) : ''}"><h3>${e(x.t)}</h3><p>${e(x.d)}</p></div>`).join('')}</div>
  </div>
</section>` : '';

    const sp = c.spotlight || {};
    const spotlight = sp.enabled ? `
<section class="libras">
  <div class="wrap libras-in">
    <div>
      ${sp.eyebrow ? `<p class="eyebrow rv">${e(sp.eyebrow)}</p>` : ''}
      <h2 class="rv d1">${title(sp.title, sp.highlight, false)}</h2>
      ${sp.text ? `<p class="lead rv d2">${e(sp.text)}</p>` : ''}
    </div>
    ${sp.icon ? `<div class="ico rv d2">${e(sp.icon)}</div>` : ''}
  </div>
</section>` : '';

    const phone = digits(k.phone || wa);
    const phoneFmt = phone.length >= 12 ? `(${phone.slice(2, 4)}) ${phone.slice(4, phone.length - 4)}-${phone.slice(-4)}` : phone;
    const maps = safeUrl(k.mapsUrl) || (k.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k.address)}` : '');
    const email = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(k.email || '') ? k.email : '';
    const cards = [
      k.address ? `<a href="${e(maps)}" target="_blank" rel="noopener" data-track="maps"><small>Localização</small><b>${e(k.address)}</b></a>` : '',
      igUrl ? `<a href="${e(igUrl)}" target="_blank" rel="noopener" data-track="instagram"><small>Instagram</small><b>@${e(ig)}</b></a>` : '',
      phone && k.showPhone !== false ? `<a href="tel:+${e(phone)}" data-track="phone"><small>Telefone</small><b>${e(phoneFmt)}</b></a>` : '',
      email ? `<a href="mailto:${e(email)}" data-track="email"><small>E-mail</small><b>${e(email)}</b></a>` : '',
    ].filter(Boolean);
    const final = `
<section id="contato" class="final">
  <div class="wrap">
    ${k.eyebrow ? `<p class="eyebrow rv" style="justify-content:center">${e(k.eyebrow)}</p>` : ''}
    <h2 class="rv d1">${title(k.title || 'Vamos conversar?', k.highlight, k.brk !== false)}</h2>
    ${k.text ? `<p class="lead rv d2">${e(k.text)}</p>` : ''}
    ${book('btn btn-primary rv d2', e(k.ctaText || 'Agendar pelo WhatsApp ↗'), k.ctaMsg || 'Vim pelo site e quero agendar', 'contato', ' style="padding:20px 38px;font-size:1.05rem"')}
    ${cards.length ? `<div class="contacts rv d3">${cards.join('')}</div>` : ''}
  </div>
</section>`;

    const ft = c.footer || {};
    const body = offline
      ? `<main class="offline"><h1>${e(name)}</h1><p>Esta página está temporariamente indisponível.</p></main>`
      : `
<header id="top">
  <div class="wrap nav">
    <a href="#top" class="logo">${e(name)}${c.brand?.tagline ? `<small>${e(c.brand.tagline)}</small>` : ''}</a>
    ${nav.length > 1 ? `<nav class="links">${nav.map(([id, l]) => `<a href="#${id}">${e(l)}</a>`).join('')}</nav>` : ''}
    ${book('btn btn-primary', e(h.headerCta || 'Agendar'), h.headerMsg || 'Quero agendar um horário', 'topo')}
  </div>
</header>
<main>${hero}${marq}${gallery}${services}${about}${steps}${spotlight}${final}</main>
<footer><div class="wrap"><span>© ${new Date().getFullYear()} ${e(ft.left || [name, k.address].filter(Boolean).join(' • '))}</span>${ft.right ? `<span>${e(ft.right)}</span>` : ''}</div></footer>
${wa ? waBtn('wa-float', WA, k.floatMsg || 'Vim pelo site e gostaria de agendar', 'flutuante', ' aria-label="Falar no WhatsApp"') : ''}
<div class="bar-cta" id="barCta"><p><b>${e(name)}</b>${e(k.barText || 'Agende pelo WhatsApp')}</p>${book('btn btn-primary', e(h.headerCta || 'Agendar'), k.barMsg || 'Vim pelo site e quero agendar', 'barra')}</div>
<div class="lb" id="alb" role="dialog" aria-modal="true" aria-label="Foto ampliada">
  <button class="x" aria-label="Fechar">✕</button>
  <button class="arr prev" aria-label="Anterior">←</button>
  <figure><img alt=""><figcaption></figcaption></figure>
  <button class="arr next" aria-label="Próxima">→</button>
</div>
${bi.booking ? bookingModal(c) : ''}`;

    const g1 = color(t.accent, '#d9b98a');
    const custom = g1.toLowerCase() !== '#d9b98a' ? `--g1:${g1};--g2:${g1};` : '';
    const docTitle = c.brand?.title || `${name}${c.brand?.tagline ? ' | ' + c.brand.tagline : ''}`;
    const desc = c.brand?.description || h.subtitle || name;
    const og = safeUrl(c.brand?.ogImage) || safeUrl(h.photo);
    const fav = safeUrl(c.brand?.favicon);
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(docTitle)}</title>
<meta name="description" content="${e(desc)}">
<meta name="theme-color" content="${color(t.bg, '#0b0a0a')}">
<meta property="og:title" content="${e(docTitle)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:type" content="website">
${og ? `<meta property="og:image" content="${e(og)}">` : ''}
${fav ? `<link rel="icon" href="${e(fav)}">` : ''}
${preview ? '<meta name="robots" content="noindex">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,500&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/atelie/atelie.css">
<style>:root{--bg:${color(t.bg, '#0b0a0a')};--gold:${g1};--red:${color(t.accent2, '#c4122f')};--text:${color(t.cream, '#f4efe9')};${custom}}${custom ? '.btn-primary,.seal{background:linear-gradient(135deg,var(--g1),var(--g2))}' : ''}</style>
</head>
<body class="${embed ? 'embed' : ''}">
${body}
<script>window.__SS=${json(data)};window.__AT=${json(at)}</script>
<script src="/static/page.js" defer></script>
<script src="/static/atelie/atelie.js" defer></script>
</body>
</html>`;
  }

  return { render };
}
