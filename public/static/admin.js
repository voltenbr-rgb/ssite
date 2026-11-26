/* Área master (super admin) */
(function () {
  const $app = document.getElementById('app');
  const BRAND = $app.dataset.brand || 'ssite';
  const A = { tab: 'geral', days: 30, list: null };
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const icon = (d, size = 20) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
  const IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    add: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  };
  const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'Erro'); e.status = r.status; throw e; }
    return j;
  };
  let toastT;
  const toast = (msg, bad) => {
    let t = document.querySelector('.toast'); if (!t) { t = h('div', { class: 'toast', role: 'status' }); document.body.append(t); }
    t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  };
  const fmt = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
  const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = (n) => (n || 0).toLocaleString('pt-BR');
  const phone = (p) => { p = String(p || '').replace(/\D/g, ''); if (p.startsWith('55') && p.length >= 12) p = p.slice(2); return p.length >= 10 ? `(${p.slice(0, 2)}) ${p.slice(2, p.length - 4)}-${p.slice(-4)}` : p; };
  const STL = { trial: 'Teste', active: 'Ativo', blocked: 'Bloqueado', expired: 'Teste vencido' };

  function loginView(msg) {
    const form = h('form', { class: 'form', novalidate: true },
      h('label', {}, 'Usuário', h('input', { name: 'login', required: true, autocomplete: 'username', autocapitalize: 'off' })),
      h('label', {}, 'Senha', h('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password' })),
      h('p', { class: 'err', role: 'alert' }, msg || ''),
      h('button', { class: 'btn btn-main btn-block btn-lg', type: 'submit' }, 'Entrar'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); route(); }
      catch (x) { form.querySelector('.err').textContent = x.message; }
    });
    $app.replaceChildren(h('main', { class: 'auth' }, h('div', { class: 'auth-card' }, h('a', { href: '/', class: 'brand' }, h('span', { class: 'brand-dot' }), BRAND), h('h1', {}, 'Área master'), form)));
  }

  function frame(content) {
    const nav = [['geral', 'Visão geral', IC.home], ['assinantes', 'Assinantes', IC.users]];
    const side = h('nav', { class: 'side', 'aria-label': 'Menu master' },
      h('a', { href: '#geral', class: 'logo-sq', 'aria-label': BRAND }, 'M'),
      nav.map(([id, label, ic]) => h('a', { href: '#' + id, class: 'navi', 'aria-label': label, 'aria-current': A.tab === id ? 'page' : null }, icon(ic, 22), h('span', { class: 'lbl', 'aria-hidden': 'true' }, label))),
      h('div', { class: 'side-foot' },
        h('a', { href: '/', target: '_blank', rel: 'noopener', class: 'navi', 'aria-label': 'Abrir o site' }, icon(IC.site, 22), h('span', { class: 'lbl', 'aria-hidden': 'true' }, 'Abrir o site')),
        h('button', { class: 'navi', 'aria-label': 'Sair', onclick: async () => { await api('/api/admin/logout', { method: 'POST' }); loginView(); } }, icon(IC.out, 22), h('span', { class: 'lbl', 'aria-hidden': 'true' }, 'Sair'))));
    $app.replaceChildren(h('div', { class: 'app' }, side, h('main', { class: 'main', id: 'main' }, content)));
  }
  const top = (title, sub, ...right) => h('div', { class: 'topline' }, h('div', {}, h('h1', {}, title), sub ? h('p', { class: 'sub' }, sub) : null), h('div', { class: 'topright' }, ...right, h('span', { class: 'user' }, h('span', { class: 'avatar' }, 'M'), h('span', { class: 'nm' }, 'Master'))));

  function lineChart(series, days, label) {
    // series: [{ name, color, vals[] }]
    const W = 600, H = 170, n = days.length;
    const max = Math.max(1, ...series.flatMap((s) => s.vals));
    const pt = (v, i) => [n === 1 ? W / 2 : (i / (n - 1)) * W, H - 10 - (v / max) * (H - 30)];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'chart-svg'); svg.style.height = '170px';
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label);
    svg.innerHTML = series.map((s, k) => {
      const d = s.vals.map((v, i) => (i ? 'L' : 'M') + pt(v, i).map((x) => x.toFixed(1)).join(' ')).join(' ');
      return (k === 0 ? `<path d="${d} L ${W} ${H} L 0 ${H} Z" fill="${s.color}" opacity=".14"/>` : '') + `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
    }).join('');
    const tip = h('div', { class: 'tip' });
    svg.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect(); const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
      tip.textContent = fmt(days[i]).slice(0, 5) + ' · ' + series.map((s) => `${s.name}: ${s.vals[i]}`).join(' · ');
      tip.style.left = (pt(0, i)[0] / W) * r.width + 'px'; tip.style.top = '30px'; tip.style.opacity = 1;
    });
    svg.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
    return h('div', { style: 'position:relative' }, svg, tip,
      h('div', { class: 'legend', style: 'display:flex;gap:16px;margin-top:8px;font-size:13px;color:#4B5563' }, series.map((s) => h('span', { style: 'display:inline-flex;align-items:center;gap:6px' }, h('span', { style: `width:10px;height:10px;border-radius:50%;background:${s.color}` }), s.name))));
  }

  async function viewGeral() {
    const box = h('div'); frame(box);
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Período' }, [7, 30, 90].map((d) => h('button', { type: 'button', 'aria-pressed': String(A.days === d), onclick: () => { A.days = d; viewGeral(); } }, d + ' dias')));
    box.append(top('Visão geral', 'Tudo o que está acontecendo no site e nas páginas dos assinantes.', seg));
    const holder = h('p', { class: 'muted' }, 'Carregando…'); box.append(holder);
    let d;
    try { d = await api('/api/admin/overview?days=' + A.days); } catch (e) { if (e.status === 401) return loginView(); holder.textContent = e.message; return; }
    const days = []; for (let i = d.days - 1; i >= 0; i--) days.push(new Date(Date.now() - 4 * 3600e3 - i * 86400e3).toISOString().slice(0, 10));
    const by = (rows, type) => { const m = {}; rows.forEach((r) => { if (!type || r.type === type) m[r.day] = (m[r.day] || 0) + r.n; }); return days.map((x) => m[x] || 0); };
    const S = d.site || {}, P = d.pages || {}, T = d.tenants;
    const conv = S.landing ? Math.round(((S.signup || 0) / S.landing) * 100) + '% das visitas' : '—';
    const tile = (cls, v, l, ic, f) => h('div', { class: 'tile ' + cls }, h('div', { class: 'tv' }, v), h('div', { class: 'tl' }, l), h('div', { class: 'tf' }, h('span', { class: 'ti' }, icon(ic, 22)), h('span', { class: 'tp' }, f)));
    const recent = d.recent.length ? h('table', { class: 'tbl' }, h('thead', {}, h('tr', {}, ['Assinante', 'Segmento', 'Cadastro', 'Status', ''].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', {}, d.recent.map((t) => h('tr', {},
        h('td', {}, h('div', { class: 'who' }, h('span', { class: 'sq' }, (t.business_name || '?')[0].toUpperCase()), h('div', {}, h('b', {}, t.business_name), h('small', {}, t.owner_name + ' · ' + phone(t.whatsapp))))),
        h('td', {}, t.segment || '—'), h('td', {}, fmt(t.created_at)), h('td', {}, h('span', { class: 'pill ' + t.state }, STL[t.state] || t.state)),
        h('td', {}, h('a', { href: t.url, target: '_blank', rel: 'noopener', class: 'circle', style: 'width:38px;height:38px', 'aria-label': 'Abrir página de ' + t.business_name }, icon(IC.ext, 17)))))))
      : h('div', { class: 'empty' }, 'Nenhum cadastro ainda.');
    const tmax = Math.max(1, ...d.top.map((t) => t.views));
    const topCard = h('div', { class: 'card' }, h('h2', {}, 'Páginas mais visitadas'),
      d.top.length ? h('ul', { class: 'top-list' }, d.top.map((t) => h('li', {}, h('div', { class: 'tlr' }, h('a', { href: t.url, target: '_blank', rel: 'noopener', style: 'color:inherit' }, t.business_name), h('b', {}, `${t.views} visitas · ${t.clicks} cliques · ${t.bookings} agend.`)), h('div', { class: 'meter' }, h('span', { style: `width:${(t.views / tmax) * 100}%` }))))) : h('p', { class: 'muted', style: 'margin:0' }, 'Sem visitas neste período.'));
    const statusCard = h('div', { class: 'promo' },
      h('h3', {}, 'Receita mensal estimada'),
      h('div', { style: 'font:700 40px Space Grotesk,sans-serif;position:relative' }, money(T.mrr)),
      h('p', {}, `${T.active} ativos · ${T.trial} em teste · ${T.expired} com teste vencido · ${T.blocked} bloqueados`),
      h('div', { class: 'row' }, h('a', { href: '#assinantes', class: 'btn btn-sky' }, 'Gerenciar assinantes')));
    holder.replaceWith(
      h('div', { class: 'ov' },
        h('div', { class: 'ov-l' }, h('div', { class: 'sec-t' }, h('h2', {}, 'O site')),
          h('div', { class: 'chart-card' }, h('div', { class: 'big' }, num(S.landing)), h('div', { class: 'big-sub' }, `Visitas na página inicial · últimos ${d.days} dias`),
            lineChart([{ name: 'Visitas', color: '#5A9BE0', vals: by(d.siteDaily, 'landing') }, { name: 'Cadastros', color: '#111318', vals: by(d.siteDaily, 'signup') }], days, 'Visitas e cadastros por dia'))),
        h('div', { class: 'ov-r' }, h('div', { class: 'sec-t' }, h('h2', {}, 'Os números')),
          h('div', { class: 'tiles' },
            tile('t-lav', num(T.total), 'Assinantes', IC.users, `${num(S.signup)} novos no período`),
            tile('t-mint', num(S.signup), 'Cadastros', IC.add, conv),
            tile('t-cream', num(S.signup_start), 'Começaram o cadastro', IC.chat, S.signup_start ? Math.round(((S.signup || 0) / S.signup_start) * 100) + '% concluíram' : '—'))),
        h('div', { class: 'ov-l' }, h('div', { class: 'sec-t' }, h('h2', {}, 'Páginas dos assinantes')),
          h('div', { class: 'card' }, h('div', { class: 'tiles', style: 'margin-bottom:16px' },
            h('div', { class: 'mini-k' }, h('b', {}, num(P.view)), h('span', {}, 'visitas')),
            h('div', { class: 'mini-k' }, h('b', {}, num((P.whatsapp || 0) + (P.booking_open || 0))), h('span', {}, 'cliques para agendar')),
            h('div', { class: 'mini-k' }, h('b', {}, num(P.booking)), h('span', {}, 'agendamentos'))),
            lineChart([{ name: 'Visitas', color: '#8B6FD6', vals: by(d.pagesDaily) }, { name: 'Agendamentos', color: '#2E9E5B', vals: by(d.bookingsDaily) }], days, 'Visitas e agendamentos nas páginas'))),
        h('div', { class: 'ov-r' }, statusCard, topCard),
        h('div', { class: 'ov-l', style: 'grid-column:1/-1' }, h('div', { class: 'sec-t' }, h('h2', {}, 'Cadastros recentes'), h('a', { href: '#assinantes', class: 'btn btn-line btn-sm' }, 'Ver todos')), recent)));
  }

  async function viewAssinantes() {
    const box = h('div'); frame(box);
    let d;
    try { d = await api('/api/admin/tenants'); } catch (e) { if (e.status === 401) return loginView(); return; }
    const search = h('input', { type: 'search', placeholder: 'Buscar por nome, link, telefone ou e-mail', 'aria-label': 'Buscar assinante', class: 'search' });
    const tbody = h('tbody');
    const draw = () => {
      const q = search.value.trim().toLowerCase(); const qd = q.replace(/\D/g, '');
      tbody.replaceChildren(...d.tenants.filter((t) => !q || [t.business_name, t.slug, t.email, t.owner_name].join(' ').toLowerCase().includes(q) || (qd.length > 3 && String(t.whatsapp).includes(qd))).map(row));
    };
    search.addEventListener('input', draw);
    function row(t) {
      const status = h('select', { 'aria-label': 'Status de ' + t.business_name }, [['trial', 'Teste'], ['active', 'Ativo'], ['blocked', 'Bloqueado']].map(([v, l]) => h('option', { value: v, selected: t.status === v }, l)));
      const plan = h('select', { 'aria-label': 'Plano de ' + t.business_name }, Object.values(d.plans).map((p) => h('option', { value: p.id, selected: t.plan === p.id }, p.name)));
      const paid = h('input', { type: 'date', value: (t.paid_until || '').slice(0, 10), 'aria-label': 'Pago até' });
      const trial = h('input', { type: 'date', value: (t.trial_ends || '').slice(0, 10), 'aria-label': 'Teste até' });
      const save = async (extra = {}) => {
        try { await api('/api/admin/tenants/' + t.id, { method: 'PATCH', body: JSON.stringify({ status: status.value, plan: plan.value, paid_until: paid.value, trial_ends: trial.value, ...extra }) }); toast('Salvo.'); viewAssinantes(); }
        catch (e) { toast(e.message, true); }
      };
      return h('tr', {},
        h('td', {}, h('div', { class: 'who' }, h('span', { class: 'sq' }, (t.business_name || '?')[0].toUpperCase()), h('div', {}, h('b', {}, t.business_name), h('small', {}, t.owner_name), h('small', { style: 'display:block' }, phone(t.whatsapp) + (t.email ? ' · ' + t.email : ''))))),
        h('td', {}, h('a', { href: t.url, target: '_blank', rel: 'noopener' }, t.slug), h('div', {}, h('span', { class: 'pill ' + t.state, style: 'margin:4px 0 0' }, STL[t.state] || t.state))),
        h('td', {}, status), h('td', {}, plan), h('td', {}, trial), h('td', {}, paid),
        h('td', {}, num(t.views30)), h('td', {}, num(t.bookings)), h('td', {}, fmt(t.created_at)),
        h('td', {}, h('div', { class: 'row', style: 'gap:6px;flex-wrap:nowrap' },
          h('button', { class: 'btn btn-main btn-sm', type: 'button', onclick: () => save() }, 'Salvar'),
          h('button', { class: 'btn btn-line btn-sm', type: 'button', title: 'Abrir o painel desta conta', onclick: async () => { await api('/api/admin/tenants/' + t.id + '/impersonate', { method: 'POST' }); window.open('/painel', '_blank'); } }, 'Entrar'),
          h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: () => { const np = prompt('Nova senha para ' + t.business_name + ' (4 a 8 caracteres):'); if (np) save({ new_password: np }); } }, 'Senha'))));
    }
    const s = d.summary;
    box.append(top('Assinantes', `${s.total} no total · ${s.active} ativos · ${s.trial} em teste`),
      h('div', { class: 'row', style: 'margin:0 0 14px;justify-content:space-between;align-items:center' }, search, h('span', { class: 'muted small' }, 'Altere status, plano e datas e clique em Salvar.')),
      h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Assinante', 'Link', 'Status', 'Plano', 'Teste até', 'Pago até', 'Visitas 30d', 'Agend.', 'Criado', ''].map((c) => h('th', { scope: 'col' }, c)))), tbody)));
    draw();
  }

  function route() {
    A.tab = (location.hash || '#geral').slice(1) === 'assinantes' ? 'assinantes' : 'geral';
    (A.tab === 'assinantes' ? viewAssinantes : viewGeral)();
  }
  window.addEventListener('hashchange', route);
  route();
})();
