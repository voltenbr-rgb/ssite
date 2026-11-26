/* Página pública: carrosséis arrastáveis, abas, fotos ampliadas, vídeos, métricas e agendamento. */
(function () {
  const SS = window.__SS || {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- métricas ---------- */
  function track(type, label) {
    if (SS.preview) return;
    try { if (window.self !== window.top) return; } catch (_) { return; }
    const body = JSON.stringify({ slug: SS.slug, type, label: label || '' });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/t', new Blob([body], { type: 'application/json' }));
      else fetch('/api/t', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    } catch (_) {}
  }
  track('view');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-track]');
    if (a) track(a.dataset.track, a.dataset.label || '');
  });

  /* ---------- carrosséis ---------- */
  document.querySelectorAll('.lane, .marquee').forEach((lane) => {
    const track = lane.querySelector('.track'); if (!track) return;
    const draggable = lane.classList.contains('lane');
    const dur = parseFloat(getComputedStyle(track).animationDuration) || 40;
    track.classList.add('js-drive');
    let half = track.scrollWidth / 2;
    const auto = reduce ? 0 : -(half / dur);
    let x = 0, v = auto, target = auto, last = performance.now(), hold = null, hovering = false;
    let down = false, dragged = false, startX = 0, startPos = 0, lastX = 0, lastT = 0;
    const wrap = () => { if (half > 0) { while (x <= -half) x += half; while (x > 0) x -= half; } };
    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!down) { v += (target - v) * Math.min(1, dt * (target === 0 ? 5 : 1.5)); x += v * dt; wrap(); }
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.addEventListener('resize', () => { half = track.scrollWidth / 2; });
    window.addEventListener('load', () => { half = track.scrollWidth / 2; });
    if (!draggable) return;
    const resume = (ms) => { clearTimeout(hold); hold = setTimeout(() => { if (!hovering) target = auto; }, ms); };
    lane.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; dragged = false; startX = lastX = e.clientX; startPos = x; lastT = performance.now(); v = 0; clearTimeout(hold);
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 6) { dragged = true; lane.classList.add('dragging'); }
      lastT = performance.now();
      if (!dragged) return;
      const now = lastT, dt = (now - (lane._pt || now)) / 1000; lane._pt = now;
      if (dt > 0) v = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      x = startPos + dx; wrap(); startPos = x - dx;
    });
    const up = () => {
      if (!down) return; down = false; lane.classList.remove('dragging'); lane._pt = 0;
      v = dragged ? Math.max(-2500, Math.min(2500, v)) : 0;
      target = 0; resume(1000);
    };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    window.addEventListener('touchend', up, { passive: true }); window.addEventListener('touchcancel', up, { passive: true });
    window.addEventListener('blur', up);
    window.addEventListener('scroll', () => { if (down && !dragged) up(); }, { passive: true });
    setInterval(() => { if (down && performance.now() - lastT > 1200) up(); }, 400);
    lane.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    lane.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; target = 0; } });
    lane.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovering = false; if (!down) resume(1000); } });
  });

  /* ---------- abas ---------- */
  document.querySelectorAll('.tabbtn').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tabbtn').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.id !== 'pn-' + b.dataset.tab; });
  }));

  /* ---------- vídeos ---------- */
  document.querySelectorAll('.snd').forEach((b) => b.addEventListener('click', () => {
    const v = b.parentElement.querySelector('video'); if (!v) return;
    v.muted = !v.muted; if (v.paused) v.play();
  }));
  const visible = new Set();
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { visible.add(v); if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    else { visible.delete(v); v.pause(); }
  }), { threshold: 0.25 });
  document.querySelectorAll('video').forEach((v) => { v.muted = true; vio.observe(v); });
  setInterval(() => visible.forEach((v) => { if (v.paused && !document.hidden) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } }), 1500);

  /* ---------- fotos ampliadas ---------- */
  const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg');
  if (lb) {
    const closeLb = () => lb.classList.remove('open');
    document.querySelectorAll('.zoomable img').forEach((img) => img.addEventListener('click', () => {
      lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add('open');
    }));
    lb.addEventListener('click', (e) => { if (e.target !== lbImg) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }

  /* ---------- agendamento ---------- */
  const bk = document.getElementById('bk');
  const form = document.getElementById('bkForm');
  const waLink = (text) => 'https://wa.me/' + SS.wa + '?text=' + encodeURIComponent(text);
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  let lastFocus = null;

  function openBooking(service, note) {
    if (SS.cta) { track('whatsapp', service || 'botão'); if (!SS.preview) window.open(SS.cta, '_blank', 'noopener'); return; }
    if (!bk) {
      const text = 'Olá! Vim pelo site e quero agendar' + (service ? ': ' + service : ' um horário') + '.';
      track('whatsapp', service || 'agendar');
      if (!SS.preview) window.open(waLink(text), '_blank', 'noopener');
      return;
    }
    track('booking_open', service || '');
    lastFocus = document.activeElement;
    bk.hidden = false; document.body.style.overflow = 'hidden';
    const sel = form.querySelector('[name=service]');
    if (service && sel && sel.tagName === 'SELECT') sel.value = [...sel.options].some((o) => o.value === service) ? service : sel.value;
    const d = form.querySelector('[name=date]'); d.min = today(); if (!d.value) d.value = today();
    form.querySelector('[name=note]').value = note || '';
    form.querySelector('.bk-msg').textContent = ''; form.querySelector('.bk-msg').className = 'bk-msg';
    setTimeout(() => form.querySelector('[name=name]').focus(), 50);
  }
  function closeBooking() {
    if (!bk) return; bk.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-book]');
    if (!a) return;
    e.preventDefault();
    openBooking(a.dataset.book, a.dataset.note);
  });
  if (bk) {
    bk.querySelector('.bk-x').addEventListener('click', closeBooking);
    bk.addEventListener('click', (e) => { if (e.target === bk) closeBooking(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !bk.hidden) closeBooking(); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = form.querySelector('.bk-msg');
      const f = Object.fromEntries(new FormData(form));
      let bad = null;
      const phone = String(f.phone || '').replace(/\D/g, '');
      form.querySelectorAll('input').forEach((i) => i.removeAttribute('aria-invalid'));
      if (!f.name.trim()) bad = ['name', 'Digite seu nome.'];
      else if (phone.length < 10) bad = ['phone', 'Digite seu WhatsApp com DDD.'];
      else if (!f.date) bad = ['date', 'Escolha a data.'];
      else if (SS.closed && SS.closed.includes(new Date(f.date + 'T12:00:00').getDay())) bad = ['date', 'Não atendemos nesse dia da semana. Escolha outra data.'];
      if (bad) { const el = form.querySelector('[name=' + bad[0] + ']'); el.setAttribute('aria-invalid', 'true'); el.focus(); msg.textContent = bad[1]; return; }
      const btn = form.querySelector('.bk-send'); btn.disabled = true;
      const dateBR = f.date.split('-').reverse().join('/');
      const text = 'Olá! Vim pelo site e quero agendar.\n\n' +
        'Nome: ' + f.name.trim() + '\n' +
        (f.service ? 'Serviço: ' + f.service + '\n' : '') +
        'Data: ' + dateBR + (f.time ? ' às ' + f.time : '') + '\n' +
        (f.note ? 'Obs.: ' + f.note.trim() + '\n' : '');
      // abre a janela já no clique (celulares bloqueiam janelas abertas depois de esperar a rede)
      const win = SS.preview ? null : window.open('', '_blank');
      if (!SS.preview) {
        try {
          const r = await fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SS.slug, ...f, phone }) });
          if (!r.ok) throw new Error();
        } catch (_) { /* mesmo se falhar, segue para o WhatsApp */ }
      }
      msg.className = 'bk-msg ok';
      msg.textContent = SS.preview ? 'Pré-visualização: na página real o WhatsApp abriria agora.' : 'Pedido enviado! Confirme a mensagem no WhatsApp.';
      if (win) win.location.href = waLink(text); else if (!SS.preview) location.href = waLink(text);
      btn.disabled = false;
      setTimeout(() => { if (!SS.preview) { form.reset(); closeBooking(); } }, 2500);
    });
  }
})();
