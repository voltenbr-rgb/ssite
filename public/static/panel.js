/* Painel do assinante */
(function () {
  const $app = document.getElementById('app');
  const BRAND = $app.dataset.brand || 'ssite';
  const S = { me: null, cfg: null, saved: '', dirty: false, media: null, page: 'inicio', statDays: 30, bkFilter: '' };

  /* ---------- utilidades ---------- */
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.setAttribute('style', v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const icon = (d, size = 20) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
  const IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
    click: '<path d="M9 9l11 4-5 2-2 5z"/><path d="M5 3v3M3 5h3M7.5 7.5L5.5 5.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="M9 18l6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    desk: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16" cy="10" r="1.2" fill="currentColor"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.3 9.2l6.1-.6z"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    tag: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    quote: '<path d="M7 7h4v6H5v-2a4 4 0 0 1 2-4zM15 7h4v6h-6v-2a4 4 0 0 1 2-4z"/>',
    pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    wave: '<path d="M2 12c3-4 5-4 8 0s5 4 8 0 3-2 4-2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
  };
  const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    if (r.status === 401) { location.href = '/entrar'; throw new Error('Sessão expirada'); }
    const ct = r.headers.get('Content-Type') || '';
    const data = ct.includes('json') ? await r.json() : await r.text();
    if (!r.ok) throw new Error((data && data.error) || 'Algo deu errado.');
    return data;
  };
  let toastT;
  const toast = (msg, bad) => {
    let t = document.querySelector('.toast'); if (!t) { t = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
    t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  };
  const fmtDate = (iso) => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '';
  const phoneFmt = (p) => { p = String(p || '').replace(/\D/g, ''); if (p.startsWith('55') && p.length >= 12) p = p.slice(2); return p.length >= 10 ? `(${p.slice(0, 2)}) ${p.slice(2, p.length - 4)}-${p.slice(-4)}` : p; };
  const waNum = (p) => { p = String(p || '').replace(/\D/g, ''); return p.startsWith('55') ? p : '55' + p; };
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const set = (obj, path, val) => { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); o[ks[ks.length - 1]] = val; };

  /* ---------- estrutura ---------- */
  const NAV = [['inicio', 'Início', IC.home], ['agendamentos', 'Agendamentos', IC.cal], ['pagina', 'Editar página', IC.edit], ['midia', 'Fotos e vídeos', IC.img], ['conta', 'Minha conta', IC.user]];
  let pendingCount = 0;

  function layout(content) {
    const initials = (S.me.owner_name || S.me.business_name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const side = h('nav', { class: 'side', 'aria-label': 'Menu do painel' },
      h('a', { href: '#inicio', class: 'logo-sq', 'aria-label': BRAND, title: BRAND }, BRAND.slice(0, 1).toUpperCase()),
      NAV.map(([id, label, ic]) => h('a', { href: '#' + id, class: 'navi', 'aria-label': label, 'aria-current': S.page === id ? 'page' : null }, icon(ic, 22), h('span', { class: 'lbl', 'aria-hidden': 'true' }, label), id === 'agendamentos' && pendingCount ? h('span', { class: 'count', 'aria-label': pendingCount + ' novos' }, pendingCount) : null)),
      h('div', { class: 'side-foot' },
        h('a', { href: S.me.url, target: '_blank', rel: 'noopener', class: 'navi', 'aria-label': 'Ver minha página' }, icon(IC.eye, 22), h('span', { class: 'lbl', 'aria-hidden': 'true' }, 'Ver minha página')),
        h('button', { class: 'navi', 'aria-label': 'Sair', onclick: logout }, icon(IC.out, 22), h('span', { class: 'lbl', 'aria-hidden': 'true' }, 'Sair'))));
    const main = h('main', { class: 'main', id: 'main' });
    S._user = h('div', { class: 'topright' },
      h('a', { href: S.me.url, target: '_blank', rel: 'noopener', class: 'circle', 'aria-label': 'Ver minha página', title: 'Ver minha página' }, icon(IC.eye, 19)),
      h('a', { href: '#agendamentos', class: 'circle', 'aria-label': pendingCount ? pendingCount + ' agendamentos novos' : 'Agendamentos', title: 'Agendamentos' }, icon(IC.bell, 19), pendingCount ? h('span', { class: 'dot' }) : null),
      h('a', { href: '#conta', class: 'user' }, h('span', { class: 'avatar', 'aria-hidden': 'true' }, initials), h('span', { class: 'nm' }, (S.me.owner_name || '').split(' ')[0]), icon(IC.chev, 16)));
    const st = S.me.state;
    if (st === 'trial') {
      const left = Math.max(0, Math.ceil((new Date(S.me.trial_ends) - Date.now()) / 86400000));
      main.append(h('div', { class: 'banner info' }, h('span', {}, `Você está no teste grátis: falta${left === 1 ? '' : 'm'} ${left} dia${left === 1 ? '' : 's'}.`), h('a', { href: '#conta', class: 'btn btn-line btn-sm' }, 'Ver plano')));
    } else if (st === 'expired' || st === 'blocked') {
      main.append(h('div', { class: 'banner' }, h('span', {}, st === 'expired' ? 'Seu teste grátis terminou e sua página está fora do ar. Ative seu plano para voltar.' : 'Sua conta está bloqueada e a página está fora do ar. Fale com o suporte.'), h('a', { href: '#conta', class: 'btn btn-line btn-sm' }, 'Ativar plano')));
    }
    main.append(content);
    $app.replaceChildren(h('div', { class: 'app' }, side, main));
  }

  async function logout() { await api('/api/logout', { method: 'POST' }).catch(() => {}); location.href = '/entrar'; }

  function topline(title, sub, ...right) {
    return h('div', { class: 'topline' }, h('div', {}, h('h1', {}, title), sub ? h('p', { class: 'sub' }, sub) : null), h('div', { class: 'topright' }, ...right, S._user));
  }

  /* ---------- Início (métricas) ---------- */
  async function pageInicio() {
    const box = h('div');
    layout(box);
    const firstName = (S.me.owner_name || '').split(' ')[0];
    box.append(topline('Visão geral', `Olá, ${firstName}! Veja como sua página está indo.`));
    const holder = h('div', {}, h('p', { class: 'muted' }, 'Carregando números…'));
    box.append(holder);
    let st, bks;
    try { [st, bks] = await Promise.all([api('/api/stats?days=' + S.statDays), api('/api/bookings')]); } catch (e) { holder.replaceChildren(h('p', { class: 'muted' }, e.message)); return; }
    const T = st.totals || {};
    const views = T.view || 0, wa = (T.whatsapp || 0) + (T.booking_open || 0), bk = T.booking || 0, svc = T.service || 0;
    const pct = (n) => (views ? Math.round((n / views) * 100) + '% das visitas' : 'sem visitas ainda');

    // gráfico de visitas (linha)
    const days = [];
    for (let i = st.days - 1; i >= 0; i--) days.push(new Date(Date.now() - 4 * 3600e3 - i * 86400e3).toISOString().slice(0, 10));
    const byDay = {}; (st.daily || []).forEach((r) => { byDay[r.day] = byDay[r.day] || {}; byDay[r.day][r.type] = r.n; });
    const vals = days.map((d) => (byDay[d] || {}).view || 0);
    const max = Math.max(1, ...vals);
    const W = 600, H = 150, n = vals.length;
    const pts = vals.map((v, i) => [n === 1 ? W / 2 : (i / (n - 1)) * W, H - 8 - (v / max) * (H - 28)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'chart-svg');
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `Visitas por dia: ${views} no total em ${st.days} dias`);
    svg.innerHTML = `<defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7DB6F2" stop-opacity=".45"/><stop offset="1" stop-color="#7DB6F2" stop-opacity="0"/></linearGradient></defs>
      <path d="${line} L ${W} ${H} L 0 ${H} Z" fill="url(#ga)"/>
      <path d="${line}" fill="none" stroke="#5A9BE0" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <line id="vl" x1="0" x2="0" y1="0" y2="${H}" stroke="#5A9BE0" stroke-dasharray="3 4" vector-effect="non-scaling-stroke" opacity="0"/>
      <circle id="vd" r="5" fill="#5A9BE0" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" opacity="0"/>`;
    const tip = h('div', { class: 'tip' });
    const chartWrap = h('div', { style: 'position:relative' }, svg, tip);
    const showAt = (i) => {
      const [x, y] = pts[i]; const r = svg.getBoundingClientRect();
      const px = (x / W) * r.width, py = (y / H) * r.height;
      svg.querySelector('#vl').setAttribute('x1', x); svg.querySelector('#vl').setAttribute('x2', x); svg.querySelector('#vl').setAttribute('opacity', 1);
      svg.querySelector('#vd').setAttribute('cx', x); svg.querySelector('#vd').setAttribute('cy', y); svg.querySelector('#vd').setAttribute('opacity', 1);
      tip.textContent = `${fmtDate(days[i]).slice(0, 5)} · ${vals[i]} visita${vals[i] === 1 ? '' : 's'}`;
      tip.style.left = px + 'px'; tip.style.top = (py + 6) + 'px'; tip.style.opacity = 1;
    };
    svg.addEventListener('pointermove', (e) => { const r = svg.getBoundingClientRect(); showAt(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))))); });
    svg.addEventListener('pointerleave', () => { tip.style.opacity = 0; svg.querySelector('#vl').setAttribute('opacity', 0); svg.querySelector('#vd').setAttribute('opacity', 0); });
    const periods = h('div', { class: 'periods', role: 'group', 'aria-label': 'Período' }, [[7, '7D'], [30, '30D'], [90, '90D']].map(([d, l]) => h('button', { type: 'button', 'aria-pressed': String(S.statDays === d), onclick: () => { S.statDays = d; pageInicio(); } }, l)));
    const chartCard = h('div', { class: 'chart-card' },
      h('div', { class: 'big' }, views.toLocaleString('pt-BR')), h('div', { class: 'big-sub' }, `Visitas na página · últimos ${st.days} dias`),
      chartWrap, periods);

    // cartões pastel
    const tile = (cls, value, label, ic, foot) => h('div', { class: 'tile ' + cls }, h('div', { class: 'tv' }, value.toLocaleString('pt-BR')), h('div', { class: 'tl' }, label), h('div', { class: 'tf' }, h('span', { class: 'ti' }, icon(ic, 22)), h('span', { class: 'tp' }, foot)));
    const tiles = h('div', { class: 'tiles' },
      tile('t-lav', wa, 'Cliques para agendar', IC.chat, pct(wa)),
      tile('t-mint', bk, 'Agendamentos', IC.cal, pct(bk)),
      tile('t-cream', svc, 'Cliques em serviços', IC.click, pct(svc)));

    // tabela de agendamentos recentes
    const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const STL = { novo: 'Novo', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' };
    const recent = (bks.bookings || []).slice(0, 5);
    const table = recent.length ? h('table', { class: 'tbl' },
      h('thead', {}, h('tr', {}, ['Cliente', 'Serviço', 'Data', 'Status', ''].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', {}, recent.map((b) => {
        const [, mo, d] = (b.date || '').split('-');
        return h('tr', {},
          h('td', {}, h('div', { class: 'who' }, h('span', { class: 'sq', 'aria-hidden': 'true' }, (b.client_name || '?')[0].toUpperCase()), h('div', {}, h('b', {}, b.client_name), h('small', {}, phoneFmt(b.client_phone))))),
          h('td', {}, b.service || '—'),
          h('td', {}, d ? `${d} ${MES[Number(mo) - 1]}${b.time ? ' · ' + b.time : ''}` : '—'),
          h('td', {}, h('span', { class: 'st ' + b.status }, STL[b.status])),
          h('td', {}, h('a', { href: `https://wa.me/${waNum(b.client_phone)}`, target: '_blank', rel: 'noopener', class: 'circle', style: 'width:38px;height:38px', 'aria-label': 'WhatsApp de ' + b.client_name }, icon(IC.chat, 17))));
      }))) : h('div', { class: 'empty' }, icon(IC.cal, 36), h('p', {}, 'Os agendamentos feitos pela sua página aparecem aqui.'));

    // cartão escuro: compartilhar link
    const promo = h('div', { class: 'promo' },
      h('h3', {}, 'Leve ', h('span', { class: 'pill-o' }, 'mais'), ' clientes para a sua página'),
      h('p', {}, 'Coloque o link na bio do Instagram e mande no WhatsApp. Cada visita vira número aqui.'),
      h('div', { class: 'linkbox' }, h('a', { href: S.me.url, target: '_blank', rel: 'noopener' }, S.me.url.replace(/^https?:\/\//, ''))),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-sky', type: 'button', onclick: () => navigator.clipboard.writeText(S.me.url).then(() => toast('Link copiado! Cole na bio do Instagram.')) }, icon(IC.copy, 16), 'Copiar link')));

    const tops = st.top || []; const tmax = Math.max(1, ...tops.map((t) => t.n));
    const topCard = h('div', { class: 'card' }, h('h2', {}, 'Serviços mais procurados'),
      tops.length ? h('ul', { class: 'top-list' }, tops.map((t) => h('li', {}, h('div', { class: 'tlr' }, h('span', {}, t.label), h('b', {}, t.n)), h('div', { class: 'meter' }, h('span', { style: `width:${(t.n / tmax) * 100}%` }))))) : h('p', { class: 'muted', style: 'margin:0' }, 'Ainda sem cliques em serviços neste período.'));

    holder.replaceChildren(
      st.pending ? h('div', { class: 'banner info' }, h('span', {}, `Você tem ${st.pending} agendamento${st.pending > 1 ? 's' : ''} novo${st.pending > 1 ? 's' : ''} para confirmar.`), h('a', { href: '#agendamentos', class: 'btn btn-main btn-sm' }, 'Ver agora')) : '',
      h('div', { class: 'ov' },
        h('div', { class: 'ov-l' }, h('div', { class: 'sec-t' }, h('h2', {}, 'Sua página')), chartCard),
        h('div', { class: 'ov-r' }, h('div', { class: 'sec-t' }, h('h2', {}, 'Seus números')), tiles),
        h('div', { class: 'ov-l' }, h('div', { class: 'sec-t' }, h('h2', {}, 'Agendamentos recentes'), h('a', { href: '#agendamentos', class: 'btn btn-line btn-sm' }, 'Ver todos')), table),
        h('div', { class: 'ov-r' }, promo, topCard)));
  }

  /* ---------- Agendamentos ---------- */
  async function pageAgendamentos() {
    const box = h('div'); layout(box);
    box.append(topline('Agendamentos', 'Pedidos feitos pela sua página.'));
    const list = h('div', { class: 'bks' }, h('p', { class: 'muted' }, 'Carregando…'));
    const chipsEl = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar' });
    box.append(chipsEl, list);
    let data;
    try { data = await api('/api/bookings' + (S.bkFilter ? '?status=' + S.bkFilter : '')); } catch (e) { list.replaceChildren(h('p', {}, e.message)); return; }
    const c = data.counts || {};
    const all = Object.values(c).reduce((a, b) => a + b, 0);
    pendingCount = c.novo || 0;
    [['', 'Todos', all], ['novo', 'Novos', c.novo || 0], ['confirmado', 'Confirmados', c.confirmado || 0], ['concluido', 'Concluídos', c.concluido || 0], ['cancelado', 'Cancelados', c.cancelado || 0]]
      .forEach(([k, l, n]) => chipsEl.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(S.bkFilter === k), onclick: () => { S.bkFilter = k; pageAgendamentos(); } }, `${l} (${n})`)));
    if (!data.bookings.length) {
      list.replaceChildren(h('div', { class: 'card empty' }, icon(IC.cal, 40), h('p', {}, S.bkFilter ? 'Nada por aqui neste filtro.' : 'Ainda não há agendamentos. Compartilhe o link da sua página!')));
      return;
    }
    const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const STL = { novo: 'Novo', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' };
    list.replaceChildren(...data.bookings.map((b) => {
      const [y, mo, d] = (b.date || '').split('-');
      const setStatus = async (s) => { try { await api('/api/bookings/' + b.id, { method: 'PATCH', body: JSON.stringify({ status: s }) }); toast('Agendamento ' + STL[s].toLowerCase() + '.'); pageAgendamentos(); } catch (e) { toast(e.message, true); } };
      const msg = `Olá, ${b.client_name.split(' ')[0]}! Aqui é ${S.me.owner_name.split(' ')[0]}, do ${S.me.business_name}. ` + (b.status === 'cancelado' ? 'Sobre o seu pedido de agendamento' : `Confirmando seu horário${b.service ? ' de ' + b.service : ''}${b.date ? ' em ' + fmtDate(b.date) : ''}${b.time ? ' às ' + b.time : ''}.`);
      return h('div', { class: 'card bk-item' },
        h('div', { class: 'bk-date', 'aria-hidden': 'true' }, h('b', {}, d || '—'), h('small', {}, mo ? MES[Number(mo) - 1] : '')),
        h('div', { class: 'bk-main' },
          h('h3', {}, b.client_name, h('span', { class: 'pill ' + b.status }, STL[b.status])),
          h('p', {}, [b.service, b.date ? fmtDate(b.date) + (b.time ? ' às ' + b.time : '') : null, phoneFmt(b.client_phone)].filter(Boolean).join(' · ')),
          b.note ? h('p', {}, 'Obs.: ' + b.note) : null,
          h('p', { style: 'font-size:12px' }, 'Pedido em ' + fmtDate(b.created_at) + ' ' + (b.created_at || '').slice(11, 16) + ' (UTC)')),
        h('div', { class: 'bk-actions' },
          h('a', { class: 'btn btn-wa btn-ic', href: `https://wa.me/${waNum(b.client_phone)}?text=${encodeURIComponent(msg)}`, target: '_blank', rel: 'noopener' }, icon(IC.chat, 16), 'WhatsApp'),
          b.status === 'novo' ? h('button', { class: 'btn btn-main btn-ic', onclick: () => setStatus('confirmado') }, 'Confirmar') : null,
          b.status === 'confirmado' ? h('button', { class: 'btn btn-main btn-ic', onclick: () => setStatus('concluido') }, 'Concluir') : null,
          b.status !== 'cancelado' && b.status !== 'concluido' ? h('button', { class: 'btn btn-line btn-ic', onclick: () => setStatus('cancelado') }, 'Cancelar') : null,
          h('button', { class: 'btn btn-danger btn-ic', 'aria-label': 'Excluir agendamento de ' + b.client_name, onclick: async () => { if (!confirm('Excluir este agendamento?')) return; await api('/api/bookings/' + b.id, { method: 'DELETE' }); toast('Excluído.'); pageAgendamentos(); } }, icon(IC.trash, 16))));
    }));
  }

  /* ---------- Mídia ---------- */
  async function loadMedia(force) {
    if (!S.media || force) S.media = (await api('/api/media')).media;
    return S.media;
  }
  function resizeImage(file, max = 1600) {
    return new Promise((resolve) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        if (k === 1 && file.size < 1.5e6) return resolve(file);
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => resolve(b ? new File([b], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', 0.85);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }
  async function uploadFiles(files, onProgress) {
    const out = [];
    let i = 0;
    for (let f of files) {
      i++;
      if (f.type.startsWith('image/')) f = await resizeImage(f);
      else if (!/^video\/(mp4|webm|quicktime)$/.test(f.type)) { toast('Formato não aceito: ' + f.name, true); continue; }
      if (f.type.startsWith('video/') && f.size > 24 * 1024 * 1024) { toast('Vídeo acima de 24 MB: ' + f.name, true); continue; }
      onProgress && onProgress(i, files.length);
      try {
        const r = await fetch('/api/media', { method: 'POST', headers: { 'Content-Type': f.type, 'X-File-Name': encodeURIComponent(f.name) }, body: f });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        out.push(j.media);
      } catch (e) { toast(e.message || 'Falha ao enviar ' + f.name, true); }
    }
    await loadMedia(true);
    return out;
  }
  function uploader(accept, onDone) {
    const input = h('input', { type: 'file', accept, multiple: true, hidden: true });
    const bar = h('span');
    const prog = h('div', { class: 'progress', hidden: true }, bar);
    const status = h('p', { class: 'muted', 'aria-live': 'polite', style: 'margin:6px 0 0' });
    const run = async (files) => {
      if (!files.length) return;
      prog.hidden = false;
      const res = await uploadFiles([...files], (i, n) => { bar.style.width = ((i - 1) / n) * 100 + '%'; status.textContent = `Enviando ${i} de ${n}…`; });
      bar.style.width = '100%'; status.textContent = res.length ? `${res.length} arquivo${res.length > 1 ? 's' : ''} enviado${res.length > 1 ? 's' : ''}.` : '';
      setTimeout(() => { prog.hidden = true; bar.style.width = '0'; }, 800);
      onDone(res);
    };
    input.addEventListener('change', () => run(input.files));
    const zone = h('div', { class: 'dropzone' },
      h('p', { style: 'margin:0 0 10px' }, 'Arraste aqui ou escolha do celular/computador'),
      h('button', { type: 'button', class: 'btn btn-main', onclick: () => input.click() }, icon(IC.plus, 18), 'Enviar arquivos'),
      h('p', { class: 'muted small', style: 'margin:10px 0 0' }, 'Fotos JPG/PNG/WEBP (reduzimos automaticamente) · Vídeos MP4 até 24 MB'),
      input, prog, status);
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag'); run(e.dataTransfer.files); });
    return zone;
  }
  const mediaTile = (m, extra) => h('div', { class: 'media-item' }, m.kind === 'video' ? h('video', { src: m.url, muted: true, preload: 'metadata' }) : h('img', { src: m.url, alt: m.name || '', loading: 'lazy' }), h('span', { class: 'kind' }, m.kind === 'video' ? 'Vídeo' : 'Foto'), extra);

  async function pageMidia() {
    const box = h('div'); layout(box);
    box.append(topline('Fotos e vídeos', 'Tudo que você enviar fica aqui para usar na página.'));
    const grid = h('div', { class: 'media-grid' });
    box.append(uploader('image/*,video/mp4,video/webm,video/quicktime', () => draw()), grid);
    async function draw() {
      const list = await loadMedia();
      if (!list.length) { grid.replaceChildren(h('p', { class: 'muted' }, 'Nenhum arquivo ainda.')); return; }
      grid.replaceChildren(...list.map((m) => mediaTile(m, h('div', { class: 'tb' }, h('button', { class: 'tbtn', type: 'button', 'aria-label': 'Apagar ' + (m.name || 'arquivo'), onclick: async () => {
        if (!confirm('Apagar este arquivo? Se ele estiver na página, vai sumir de lá.')) return;
        await api('/api/media/' + m.id, { method: 'DELETE' }); await loadMedia(true); draw(); toast('Arquivo apagado.');
      } }, icon(IC.trash, 15))))));
    }
    draw();
  }

  /* Seletor de mídia (modal) */
  function pickMedia({ kind = 'image', multiple = false }) {
    return new Promise(async (resolve) => {
      const chosen = new Set();
      const grid = h('div', { class: 'media-grid' });
      const okBtn = h('button', { class: 'btn btn-main', type: 'button', disabled: true }, multiple ? 'Adicionar selecionadas' : 'Usar esta');
      const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': kind === 'video' ? 'Escolher vídeo' : 'Escolher foto' },
        h('div', { class: 'modal-card' },
          h('div', { class: 'modal-h' }, h('h2', {}, kind === 'video' ? 'Escolher vídeo' : multiple ? 'Escolher fotos' : 'Escolher foto'), h('button', { class: 'tbtn', type: 'button', 'aria-label': 'Fechar', onclick: () => close(null) }, icon(IC.x, 16))),
          uploader(kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*', (res) => { res.filter((r) => r.kind === kind).forEach((r) => { if (multiple) chosen.add(r.url); else { chosen.clear(); chosen.add(r.url); } }); draw(); }),
          grid,
          h('div', { class: 'row', style: 'justify-content:flex-end' }, h('button', { class: 'btn btn-line', type: 'button', onclick: () => close(null) }, 'Cancelar'), okBtn)));
      const close = (val) => { modal.remove(); document.removeEventListener('keydown', esc); resolve(val); };
      const esc = (e) => { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', esc);
      okBtn.addEventListener('click', () => close(multiple ? [...chosen] : [...chosen][0]));
      document.body.append(modal);
      async function draw() {
        const list = (await loadMedia()).filter((m) => m.kind === kind);
        okBtn.disabled = !chosen.size;
        okBtn.textContent = multiple ? (chosen.size ? `Adicionar ${chosen.size}` : 'Adicionar selecionadas') : 'Usar esta';
        if (!list.length) { grid.replaceChildren(h('p', { class: 'muted' }, kind === 'video' ? 'Envie um vídeo acima.' : 'Envie fotos acima.')); return; }
        grid.replaceChildren(...list.map((m) => {
          const t = mediaTile(m, h('button', { class: 'pickbtn', type: 'button', 'aria-pressed': String(chosen.has(m.url)), 'aria-label': 'Selecionar ' + (m.name || 'arquivo'), onclick: () => { if (chosen.has(m.url)) chosen.delete(m.url); else { if (!multiple) chosen.clear(); chosen.add(m.url); } draw(); } }));
          if (chosen.has(m.url)) t.classList.add('sel');
          return t;
        }));
      }
      draw();
    });
  }

  /* ---------- Editor da página ---------- */
  const PRESETS = [
    ['Lilás', { accent: '#D45AE8', accent2: '#E58BF2', bg: '#0F0A10', cream: '#F3E9C6' }],
    ['Rosé', { accent: '#F08BB0', accent2: '#F7B7CE', bg: '#140C10', cream: '#F7E7DC' }],
    ['Dourado', { accent: '#E2B65C', accent2: '#F0D08E', bg: '#0E0D0B', cream: '#F4EBD6' }],
    ['Azul', { accent: '#6FA8FF', accent2: '#A8C9FF', bg: '#0A0E16', cream: '#E6EEF9' }],
    ['Verde', { accent: '#5ED3A0', accent2: '#9BE8C4', bg: '#0A110E', cream: '#E5F3EA' }],
    ['Terracota', { accent: '#E07A5F', accent2: '#F0A58F', bg: '#120C0A', cream: '#F5E6DA' }],
  ];
  const T = (path, label, opts = {}) => ({ type: opts.area ? 'textarea' : 'text', path, label, ...opts });
  const SECTIONS = [
    { key: 'theme', title: 'Cores', ic: IC.palette, fields: [{ type: 'theme' }] },
    { key: 'brand', title: 'Nome e menu', ic: IC.tag, fields: [T('brand.name', 'Nome que aparece no topo'), T('brand.tagline', 'Subtítulo pequeno', { hint: 'Ex.: Lash Designer' })] },
    { key: 'hero', title: 'Capa', ic: IC.home, fields: [
      { type: 'image', path: 'hero.photo', label: 'Sua foto principal' },
      T('hero.eyebrow', 'Cidade / chamada acima do título'), T('hero.title', 'Título'), T('hero.highlight', 'Palavra em destaque', { hint: 'Aparece colorida e em itálico' }),
      T('hero.subtitle', 'Frase de apresentação', { area: true }), T('hero.address', 'Endereço curto'), T('hero.badge', 'Selo sobre a foto')] },
    { key: 'marquee', title: 'Faixa animada', ic: IC.wave, toggle: true, fields: [{ type: 'strings', path: 'marquee.words', label: 'Palavras que passam na faixa', placeholder: 'Ex.: Autoestima' }] },
    { key: 'gallery', title: 'Galeria de fotos', ic: IC.img, toggle: true, fields: [
      { type: 'images', path: 'gallery.photos', label: 'Carrossel principal (fotos altas)' },
      { type: 'images', path: 'gallery.round', label: 'Carrossel de fotos redondas' },
      T('gallery.eyebrow', 'Chamada'), T('gallery.title', 'Título'), T('gallery.highlight', 'Destaque'), T('gallery.note', 'Texto ao lado')] },
    { key: 'videos', title: 'Vídeos', ic: IC.video, toggle: true, fields: [
      { type: 'list', path: 'videos.items', label: 'Vídeos', itemLabel: (x, i) => x.label || 'Vídeo ' + (i + 1), add: () => ({ src: '', poster: '', label: '' }), fields: [{ type: 'video', path: 'src', label: 'Vídeo' }, T('label', 'Legenda'), { type: 'image', path: 'poster', label: 'Capa (opcional)' }] },
      T('videos.eyebrow', 'Chamada'), T('videos.title', 'Título'), T('videos.highlight', 'Destaque')] },
    { key: 'about', title: 'Sobre você', ic: IC.user, toggle: true, fields: [
      { type: 'image', path: 'about.photo', label: 'Foto' }, T('about.eyebrow', 'Chamada'), T('about.title', 'Título'), T('about.highlight', 'Destaque'),
      { type: 'list', path: 'about.paragraphs', label: 'Parágrafos', simple: true, itemLabel: (x, i) => (x || '').slice(0, 40) || 'Parágrafo ' + (i + 1), add: () => '' },
      { type: 'strings', path: 'about.tags', label: 'Etiquetas', placeholder: 'Ex.: Cuidado' }] },
    { key: 'services', title: 'Serviços e preços', ic: IC.list, toggle: true, fields: [
      { type: 'list', path: 'services.items', label: 'Serviços', itemLabel: (x, i) => (x.name || 'Serviço ' + (i + 1)) + (x.price ? ' · R$ ' + x.price : ''), add: () => ({ name: '', price: '', desc: '', photo: '' }), fields: [T('name', 'Nome do serviço'), T('price', 'Preço', { hint: 'Ex.: 120,00' }), T('desc', 'Descrição curta', { area: true }), { type: 'image', path: 'photo', label: 'Foto do resultado' }] },
      T('services.eyebrow', 'Chamada'), T('services.title', 'Título'), T('services.highlight', 'Destaque'), T('services.intro', 'Texto de introdução', { area: true }), T('services.note', 'Observação abaixo do carrossel')] },
    { key: 'homeService', title: 'Atendimento a domicílio', ic: IC.pin, toggle: true, fields: [T('homeService.title', 'Título'), T('homeService.text', 'Texto', { area: true }), T('homeService.button', 'Texto do botão')] },
    { key: 'info', title: 'Informações (abas)', ic: IC.info, toggle: true, fields: [
      T('info.eyebrow', 'Chamada'), T('info.title', 'Título'), T('info.highlight', 'Destaque'),
      { type: 'list', path: 'info.tabs', label: 'Abas', itemLabel: (x, i) => x.label || 'Aba ' + (i + 1), add: () => ({ label: '', big: '', title: '', intro: '', items: [] }), fields: [
        T('label', 'Nome da aba'), T('big', 'Destaque grande', { hint: 'Ex.: 24h' }), T('title', 'Título'), T('intro', 'Introdução', { area: true }),
        { type: 'list', path: 'items', label: 'Itens', itemLabel: (x, i) => x.t || 'Item ' + (i + 1), add: () => ({ t: '', d: '' }), fields: [T('t', 'Texto em negrito'), T('d', 'Complemento')] }] }] },
    { key: 'feedback', title: 'Depoimentos', ic: IC.quote, toggle: true, fields: [
      { type: 'list', path: 'feedback.items', label: 'Depoimentos', itemLabel: (x, i) => (x.text || '').slice(0, 38) || 'Depoimento ' + (i + 1), add: () => ({ text: '', author: '' }), fields: [T('text', 'Depoimento', { area: true }), T('author', 'Quem disse (opcional)', { hint: 'Vazio aparece "Cliente"' })] },
      T('feedback.eyebrow', 'Chamada'), T('feedback.title', 'Título'), T('feedback.highlight', 'Destaque')] },
    { key: 'booking', title: 'Agendamento', ic: IC.clock, toggle: true, toggleHint: 'Desligado: os botões abrem direto o WhatsApp.', fields: [
      T('booking.title', 'Título do formulário'), { type: 'strings', path: 'booking.times', label: 'Horários oferecidos', placeholder: 'Ex.: 14:30', time: true }, { type: 'weekdays', path: 'booking.closedWeekdays', label: 'Dias sem atendimento' }] },
    { key: 'contact', title: 'Contato e rodapé', ic: IC.chat, fields: [
      T('contact.whatsapp', 'WhatsApp que recebe os agendamentos', { hint: 'Com DDD. Ex.: 67 99999-9999' }), T('contact.instagram', 'Instagram (sem @)'), T('contact.address', 'Endereço completo'), T('contact.title', 'Título do rodapé'), T('contact.highlight', 'Destaque do rodapé')] },
  ];

  let pvTimer, pvFrame, saveBar;
  function changed() {
    S.dirty = JSON.stringify(S.cfg) !== S.saved;
    if (saveBar) saveBar.classList.toggle('show', S.dirty);
    clearTimeout(pvTimer); pvTimer = setTimeout(refreshPreview, 500);
  }
  async function refreshPreview() {
    if (!pvFrame) return;
    try {
      const htmlStr = await api('/api/page/preview', { method: 'POST', body: JSON.stringify({ config: S.cfg }) });
      const y = (() => { try { return pvFrame.contentWindow.scrollY; } catch (_) { return 0; } })();
      pvFrame.srcdoc = htmlStr.replace('</body>', `<script>addEventListener('load',()=>scrollTo(0,${y || 0}))<\/script></body>`);
    } catch (e) { /* ignora erro de prévia */ }
  }

  function fieldText(obj, f) {
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    const input = f.type === 'textarea' ? h('textarea', { id, rows: 3 }) : h('input', { id, type: 'text', placeholder: f.placeholder || '' });
    input.value = get(obj, f.path) ?? '';
    input.addEventListener('input', () => { set(obj, f.path, input.value); changed(); f.onInput && f.onInput(); });
    return h('div', { class: 'f' }, h('label', { for: id }, f.label), input, f.hint ? h('small', {}, f.hint) : null);
  }
  function fieldMedia(obj, f) {
    const kind = f.type === 'video' ? 'video' : 'image';
    const wrap = h('div', { class: 'f' });
    const draw = () => {
      const url = get(obj, f.path);
      const thumb = h('div', { class: 'thumb' }, url ? (kind === 'video' ? h('video', { src: url, muted: true, preload: 'metadata' }) : h('img', { src: url, alt: '' })) : h('div', { style: 'display:flex;align-items:center;justify-content:center;height:100%;color:#6B5A6E' }, icon(kind === 'video' ? IC.video : IC.img, 26)));
      wrap.replaceChildren(h('span', {}, f.label), h('div', { class: 'pick-one' }, thumb,
        h('button', { type: 'button', class: 'btn btn-line btn-sm', onclick: async () => { const u = await pickMedia({ kind }); if (u) { set(obj, f.path, u); changed(); draw(); } } }, url ? 'Trocar' : (kind === 'video' ? 'Escolher vídeo' : 'Escolher foto')),
        url ? h('button', { type: 'button', class: 'mini', 'aria-label': 'Remover', onclick: () => { set(obj, f.path, ''); changed(); draw(); } }, icon(IC.trash, 16)) : null));
    };
    draw();
    return wrap;
  }
  function fieldImages(obj, f) {
    const wrap = h('div', { class: 'f' });
    const draw = () => {
      const arr = get(obj, f.path) || [];
      const tiles = arr.map((p, i) => h('div', { class: 'thumb' }, h('img', { src: p.src, alt: p.alt || '' }),
        h('div', { class: 'tb' },
          i > 0 ? h('button', { type: 'button', class: 'tbtn', 'aria-label': 'Mover para a esquerda', onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); changed(); draw(); } }, icon(IC.left, 14)) : null,
          h('button', { type: 'button', class: 'tbtn', 'aria-label': 'Remover foto', onclick: () => { arr.splice(i, 1); changed(); draw(); } }, icon(IC.x, 14)))));
      const add = h('button', { type: 'button', class: 'add-tile', onclick: async () => {
        const urls = await pickMedia({ kind: 'image', multiple: true });
        if (urls && urls.length) { const a = get(obj, f.path) || []; urls.forEach((u) => a.push({ src: u, alt: 'Foto' })); set(obj, f.path, a); changed(); draw(); }
      } }, icon(IC.plus, 22), 'Adicionar');
      wrap.replaceChildren(h('span', {}, f.label, h('small', {}, ` · ${arr.length} foto${arr.length === 1 ? '' : 's'}`)), h('div', { class: 'thumbs' }, ...tiles, add));
    };
    draw();
    return wrap;
  }
  function fieldStrings(obj, f) {
    const wrap = h('div', { class: 'f' });
    const draw = () => {
      const arr = get(obj, f.path) || [];
      const input = h('input', { type: f.time ? 'time' : 'text', placeholder: f.placeholder || '', 'aria-label': 'Novo item: ' + f.label });
      const addIt = () => { const v = input.value.trim(); if (!v) return; arr.push(v); if (f.time) arr.sort(); set(obj, f.path, arr); changed(); draw(); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addIt(); } });
      wrap.replaceChildren(h('span', {}, f.label),
        h('div', { class: 'strs' }, arr.map((s, i) => h('span', { class: 'str' }, s, h('button', { type: 'button', 'aria-label': 'Remover ' + s, onclick: () => { arr.splice(i, 1); changed(); draw(); } }, '×')))),
        h('div', { class: 'str-add' }, input, h('button', { type: 'button', class: 'btn btn-line btn-sm', onclick: addIt }, 'Adicionar')));
    };
    draw();
    return wrap;
  }
  function fieldWeekdays(obj, f) {
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const arr = get(obj, f.path) || [];
    return h('fieldset', { class: 'f', style: 'border:0;padding:0;margin:0' }, h('legend', { style: 'margin-bottom:6px' }, f.label),
      h('div', { class: 'days' }, names.map((n, i) => {
        const cb = h('input', { type: 'checkbox', checked: arr.includes(i) });
        cb.addEventListener('change', () => { const a = new Set(get(obj, f.path) || []); cb.checked ? a.add(i) : a.delete(i); set(obj, f.path, [...a].sort()); changed(); });
        return h('label', { class: 'day' }, cb, h('span', {}, n));
      })), h('small', {}, 'Marcados = fechado. A cliente não consegue escolher esses dias.'));
  }
  function fieldTheme(obj) {
    const wrap = h('div', { class: 'f' });
    const draw = () => {
      const t = obj.theme = obj.theme || {};
      const color = (k, label) => { const inp = h('input', { type: 'color', value: t[k] || '#000000', 'aria-label': label }); inp.addEventListener('input', () => { t[k] = inp.value; changed(); }); return h('label', { class: 'color' }, inp, label); };
      wrap.replaceChildren(
        h('span', {}, 'Combinações prontas'),
        h('div', { class: 'presets' }, PRESETS.map(([n, p]) => h('button', { type: 'button', class: 'preset', title: n, 'aria-label': 'Usar combinação ' + n, style: `background:linear-gradient(135deg,${p.accent} 0 50%,${p.bg} 50%)`, onclick: () => { Object.assign(t, p); changed(); draw(); } }))),
        h('span', { style: 'margin-top:8px' }, 'Ajuste fino'),
        h('div', { class: 'colors' }, color('accent', 'Cor principal'), color('accent2', 'Cor de apoio'), color('bg', 'Fundo'), color('cream', 'Cor clara')));
    };
    draw();
    return wrap;
  }
  function fieldList(obj, f) {
    const wrap = h('div', { class: 'f' });
    const open = new Set();
    const draw = () => {
      const arr = get(obj, f.path) || [];
      set(obj, f.path, arr);
      const items = arr.map((it, i) => {
        const body = h('div', { class: 'item-b' });
        if (f.simple) {
          const ta = h('textarea', { rows: 4, 'aria-label': f.label + ' ' + (i + 1) }); ta.value = it || '';
          ta.addEventListener('input', () => { arr[i] = ta.value; changed(); lbl.textContent = f.itemLabel(arr[i], i); });
          body.append(ta);
        } else {
          f.fields.forEach((sf) => body.append(renderField(it, { ...sf, onInput: () => { lbl.textContent = f.itemLabel(it, i); } })));
        }
        const lbl = h('b', {}, f.itemLabel(it, i));
        const item = h('div', { class: 'item', 'data-closed': open.has(i) ? null : '' },
          h('div', { class: 'item-h', onclick: (e) => { if (e.target.closest('button')) return; open.has(i) ? open.delete(i) : open.add(i); item.toggleAttribute('data-closed'); } }, lbl,
            h('button', { type: 'button', class: 'mini', 'aria-label': 'Subir', disabled: i === 0, onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); open.clear(); changed(); draw(); } }, icon(IC.up, 15)),
            h('button', { type: 'button', class: 'mini', 'aria-label': 'Descer', disabled: i === arr.length - 1, onclick: () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); open.clear(); changed(); draw(); } }, icon(IC.down, 15)),
            h('button', { type: 'button', class: 'mini', 'aria-label': 'Remover', onclick: () => { if (!confirm('Remover este item?')) return; arr.splice(i, 1); open.clear(); changed(); draw(); } }, icon(IC.trash, 15))),
          body);
        return item;
      });
      wrap.replaceChildren(h('span', {}, f.label), h('div', { class: 'items' }, ...items,
        h('button', { type: 'button', class: 'add-row', onclick: () => { arr.push(f.add()); open.add(arr.length - 1); changed(); draw(); } }, '+ Adicionar')));
    };
    draw();
    return wrap;
  }
  function renderField(obj, f) {
    switch (f.type) {
      case 'text': case 'textarea': return fieldText(obj, f);
      case 'image': case 'video': return fieldMedia(obj, f);
      case 'images': return fieldImages(obj, f);
      case 'strings': return fieldStrings(obj, f);
      case 'weekdays': return fieldWeekdays(obj, f);
      case 'theme': return fieldTheme(obj);
      case 'list': return fieldList(obj, f);
      default: return h('span');
    }
  }

  async function pagePagina() {
    if (!S.cfg) { const r = await api('/api/page'); S.cfg = r.config; S.saved = JSON.stringify(S.cfg); }
    const box = h('div'); layout(box);
    const save = async () => {
      try { await api('/api/page', { method: 'PUT', body: JSON.stringify({ config: S.cfg }) }); S.saved = JSON.stringify(S.cfg); changed(); toast('Página publicada!'); }
      catch (e) { toast(e.message, true); }
    };
    const pvCol = h('div', { class: 'preview-col' });
    box.append(topline('Editar página', 'Toque numa seção para editar. A prévia atualiza sozinha.',
      h('button', { class: 'btn btn-line pv-open', type: 'button', onclick: () => { pvCol.classList.add('open'); refreshPreview(); } }, icon(IC.eye, 18), 'Pré-visualizar'),
      h('a', { class: 'btn btn-line', href: S.me.url, target: '_blank', rel: 'noopener' }, 'Abrir página')));
    const sections = h('div', { class: 'sections' }, SECTIONS.map((sec) => {
      const enabled = sec.toggle ? !!get(S.cfg, sec.key + '.enabled') : true;
      const off = h('span', { class: 'off', hidden: enabled }, 'Desligada');
      const body = h('div', { class: 'sec-body' });
      if (sec.toggle) {
        const cb = h('input', { type: 'checkbox', checked: enabled, 'aria-label': 'Mostrar ' + sec.title });
        cb.addEventListener('change', () => { set(S.cfg, sec.key + '.enabled', cb.checked); off.hidden = cb.checked; changed(); });
        body.append(h('label', { class: 'toggle' }, h('span', {}, 'Mostrar na página', sec.toggleHint ? h('small', { class: 'muted', style: 'display:block;font-weight:400' }, sec.toggleHint) : null), h('span', { class: 'switch' }, cb, h('span'))));
      }
      sec.fields.forEach((f) => body.append(renderField(S.cfg, f)));
      return h('details', { class: 'sec-card' }, h('summary', { class: 'sec-sum' }, h('span', { class: 'ic' }, icon(sec.ic, 18)), sec.title, off, h('span', { class: 'chev' }, icon(IC.chev, 18))), body);
    }));
    pvFrame = h('iframe', { title: 'Prévia da página', sandbox: 'allow-scripts allow-popups' });
    const frameBox = h('div', { class: 'pv-frame mobile' }, pvFrame);
    const sizeSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Tamanho da prévia' },
      h('button', { type: 'button', 'aria-pressed': 'true', onclick: (e) => { frameBox.classList.add('mobile'); sizeSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, icon(IC.phone, 16), ' Celular'),
      h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => { frameBox.classList.remove('mobile'); sizeSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, icon(IC.desk, 16), ' Computador'));
    pvCol.append(h('div', { class: 'pv-bar' }, sizeSeg, h('button', { class: 'btn btn-line btn-sm pv-open', type: 'button', onclick: () => pvCol.classList.remove('open') }, 'Fechar prévia')), frameBox);
    box.append(h('div', { class: 'editor' }, sections, pvCol));
    saveBar = h('div', { class: 'savebar' + (S.dirty ? ' show' : '') }, h('span', {}, 'Você tem alterações não publicadas.'),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: () => { if (!confirm('Descartar as alterações?')) return; S.cfg = JSON.parse(S.saved); changed(); pagePagina(); } }, 'Descartar'),
        h('button', { class: 'btn btn-main btn-sm', type: 'button', onclick: save }, 'Publicar alterações')));
    document.querySelector('.app').append(saveBar);
    refreshPreview();
  }

  /* ---------- Conta ---------- */
  async function pageConta() {
    const box = h('div'); layout(box);
    const me = S.me;
    box.append(topline('Minha conta', ''));
    const F = (name, label, val, attrs = {}) => { const id = 'c_' + name; return h('div', { class: 'f' }, h('label', { for: id }, label), h('input', { id, name, type: 'text', value: val || '', ...attrs })); };
    const segSel = h('select', { id: 'c_segment', name: 'segment' }, S.segments.map((s) => h('option', { selected: s === me.segment }, s)));
    // link da página (vira o subdomínio) com prévia ao vivo
    const slugify = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    const slugIn = h('input', { id: 'c_slug', name: 'slug', type: 'text', value: me.slug, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'data-lpignore': 'true', 'aria-describedby': 'c_slug_msg c_slug_prev' });
    const slugMsg = h('small', { id: 'c_slug_msg', 'aria-live': 'polite' });
    const root = S.root;
    const slugPrev = h('b', {}, '');
    const showSlug = () => { const v = slugify(slugIn.value) || me.slug; slugPrev.textContent = root ? `${v}.${root}` : `${location.host}/s/${v}`; };
    let slugT;
    slugIn.addEventListener('input', () => {
      showSlug(); clearTimeout(slugT);
      const v = slugify(slugIn.value);
      if (!v) { slugMsg.textContent = 'Só letras, números e hífen.'; slugMsg.style.color = ''; return; }
      slugT = setTimeout(async () => { const r = await fetch('/api/slug-check?s=' + encodeURIComponent(v)).then((x) => x.json()).catch(() => null); if (!r) return; slugMsg.textContent = r.available ? (v === me.slug ? 'Este é o seu link atual.' : 'Disponível!') : r.reason; slugMsg.style.color = r.available ? 'var(--pos)' : 'var(--neg)'; }, 300);
    });
    slugIn.addEventListener('blur', () => { slugIn.value = slugify(slugIn.value) || me.slug; showSlug(); });
    showSlug();
    const slugField = h('div', { class: 'f', style: 'grid-column:1/-1' }, h('label', { for: 'c_slug' }, 'Link da sua página'),
      h('div', { class: 'slug-row' }, slugIn, root ? h('span', { class: 'slug-sfx' }, '.' + root) : null),
      h('span', { id: 'c_slug_prev', class: 'url-prev' }, 'Sua página: ', slugPrev), slugMsg,
      h('small', {}, `Para entrar no painel, use seu e-mail ou o nome do link (hoje: ${me.username}).`));
    const form = h('form', { class: 'card', style: 'display:flex;flex-direction:column;gap:14px;margin-bottom:16px' },
      h('h2', {}, 'Seus dados'),
      h('div', { class: 'formgrid' }, F('business_name', 'Nome do negócio', me.business_name), F('owner_name', 'Seu nome', me.owner_name), F('email', 'E-mail', me.email, { type: 'email' }), F('whatsapp', 'WhatsApp', phoneFmt(me.whatsapp), { inputmode: 'tel' }), h('div', { class: 'f' }, h('label', { for: 'c_segment' }, 'Segmento'), segSel),
        slugField),
      h('div', {}, h('button', { class: 'btn btn-main', type: 'submit' }, 'Salvar dados')));
    form.addEventListener('submit', async (e) => { e.preventDefault(); try { const d = Object.fromEntries(new FormData(form)); d.slug = slugify(d.slug || me.slug); const changedSlug = d.slug !== me.slug; await api('/api/me', { method: 'PUT', body: JSON.stringify(d) }); await loadMe(); toast(changedSlug ? 'Link da página atualizado!' : 'Dados salvos.'); if (changedSlug) pageConta(); } catch (x) { toast(x.message, true); } });
    const pw = h('form', { class: 'card', style: 'display:flex;flex-direction:column;gap:14px;margin-bottom:16px' }, h('h2', {}, 'Trocar senha'),
      h('div', { class: 'formgrid' }, F('current', 'Senha atual', '', { type: 'password', autocomplete: 'current-password' }), F('next', 'Nova senha (6+ caracteres)', '', { type: 'password', autocomplete: 'new-password' })),
      h('div', {}, h('button', { class: 'btn btn-main', type: 'submit' }, 'Trocar senha')));
    pw.addEventListener('submit', async (e) => { e.preventDefault(); try { await api('/api/me/password', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(pw))) }); pw.reset(); toast('Senha alterada.'); } catch (x) { toast(x.message, true); } });
    const plan = S.plans[me.plan] || {};
    const STL = { trial: 'Teste grátis', active: 'Ativo', blocked: 'Bloqueado', expired: 'Teste encerrado' };
    const planCard = h('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px' }, h('h2', {}, 'Plano'),
      h('p', { style: 'margin:0' }, h('b', {}, plan.name || me.plan), ` · R$ ${(plan.price || 0).toFixed(2).replace('.', ',')}/${plan.period || ''}`, h('span', { class: 'pill ' + me.state }, STL[me.state] || me.state)),
      me.state === 'trial' ? h('p', { class: 'muted', style: 'margin:0' }, 'Teste grátis até ' + fmtDate(me.trial_ends) + '.') : null,
      me.paid_until ? h('p', { class: 'muted', style: 'margin:0' }, 'Pago até ' + fmtDate(me.paid_until) + '.') : null,
      h('p', { class: 'muted', style: 'margin:0' }, 'Para ativar ou trocar de plano (mensal ou anual), fale com o suporte.'),
      S.support ? h('div', {}, h('a', { class: 'btn btn-wa', href: `https://wa.me/${S.support}?text=${encodeURIComponent('Olá! Quero ativar o plano ' + (plan.name || '') + ' da página ' + me.slug + '.')}`, target: '_blank', rel: 'noopener' }, icon(IC.chat, 16), 'Falar com o suporte')) : null);
    box.append(form, pw, planCard);
  }

  /* ---------- roteamento ---------- */
  async function loadMe() { const r = await api('/api/me'); S.me = r.tenant; S.plans = r.plans; S.segments = r.segments; S.support = r.support; S.root = r.root; }
  const PAGES = { inicio: pageInicio, agendamentos: pageAgendamentos, pagina: pagePagina, midia: pageMidia, conta: pageConta };
  async function route() {
    const id = (location.hash || '#inicio').slice(1);
    if (S.page === 'pagina' && id !== 'pagina' && S.dirty && !confirm('Você tem alterações não publicadas na página. Sair mesmo assim?')) { history.replaceState(null, '', '#pagina'); return; }
    S.page = PAGES[id] ? id : 'inicio';
    if (S.page !== 'pagina') { saveBar = null; pvFrame = null; }
    window.scrollTo(0, 0); const mm = document.getElementById('main'); if (mm) mm.scrollTop = 0;
    try { await PAGES[S.page](); } catch (e) { if (e.message !== 'Sessão expirada') toast(e.message, true); }
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
  (async () => {
    try { await loadMe(); } catch (_) { return; }
    try { const b = await api('/api/bookings?status=novo'); pendingCount = (b.counts || {}).novo || 0; } catch (_) {}
    if (new URLSearchParams(location.search).get('bemvinda')) { history.replaceState(null, '', '/painel#pagina'); setTimeout(() => toast('Conta criada! Comece colocando sua foto e seus serviços.'), 400); }
    route();
  })();
})();
