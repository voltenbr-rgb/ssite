/* Painel super admin */
(function () {
  const $app = document.getElementById('app');
  const BRAND = $app.dataset.brand || 'ssite';
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
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

  function loginView(msg) {
    const form = h('form', { class: 'form', novalidate: true },
      h('label', {}, 'Usuário', h('input', { name: 'login', required: true, autocomplete: 'username', autocapitalize: 'off' })),
      h('label', {}, 'Senha', h('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password' })),
      h('p', { class: 'err', role: 'alert' }, msg || ''),
      h('button', { class: 'btn btn-main btn-block btn-lg', type: 'submit' }, 'Entrar'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); load(); }
      catch (x) { form.querySelector('.err').textContent = x.message; }
    });
    $app.replaceChildren(h('main', { class: 'auth' }, h('div', { class: 'auth-card' }, h('a', { href: '/', class: 'brand' }, h('span', { class: 'brand-dot' }), BRAND), h('h1', {}, 'Admin'), form)));
  }

  async function load() {
    let d;
    try { d = await api('/api/admin/tenants'); } catch (e) { if (e.status === 401) return loginView(); return loginView(e.message); }
    const s = d.summary;
    const kpi = (l, n) => h('div', { class: 'card kpi' }, h('div', { class: 'lbl' }, l), h('div', { class: 'num' }, n));
    const search = h('input', { type: 'search', placeholder: 'Buscar por nome, endereço ou e-mail', 'aria-label': 'Buscar assinante', style: 'font:inherit;font-size:15px;color:#fff;background:#1F1826;border:1px solid #3A2F42;border-radius:12px;padding:10px 14px;min-height:44px;width:min(420px,100%)' });
    const tbody = h('tbody');
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      tbody.replaceChildren(...d.tenants.filter((t) => !q || [t.business_name, t.slug, t.email, t.owner_name].join(' ').toLowerCase().includes(q)).map(row));
    };
    search.addEventListener('input', draw);
    function row(t) {
      const status = h('select', { 'aria-label': 'Status de ' + t.business_name }, [['trial', 'Teste'], ['active', 'Ativo'], ['blocked', 'Bloqueado']].map(([v, l]) => h('option', { value: v, selected: t.status === v }, l)));
      const plan = h('select', { 'aria-label': 'Plano de ' + t.business_name }, Object.values(d.plans).map((p) => h('option', { value: p.id, selected: t.plan === p.id }, p.name)));
      const paid = h('input', { type: 'date', value: (t.paid_until || '').slice(0, 10), 'aria-label': 'Pago até' });
      const trial = h('input', { type: 'date', value: (t.trial_ends || '').slice(0, 10), 'aria-label': 'Teste até' });
      const save = async (extra = {}) => {
        try { await api('/api/admin/tenants/' + t.id, { method: 'PATCH', body: JSON.stringify({ status: status.value, plan: plan.value, paid_until: paid.value, trial_ends: trial.value, ...extra }) }); toast('Salvo.'); load(); }
        catch (e) { toast(e.message, true); }
      };
      const STL = { trial: 'Teste', active: 'Ativo', blocked: 'Bloqueado', expired: 'Teste vencido' };
      return h('tr', {},
        h('td', {}, h('b', {}, t.business_name), h('div', { class: 'muted small' }, t.owner_name + ' · ' + (t.email || 'sem e-mail')), h('div', { class: 'muted small' }, t.whatsapp || '')),
        h('td', {}, h('a', { href: t.url, target: '_blank', rel: 'noopener' }, t.slug), h('div', {}, h('span', { class: 'pill ' + t.state }, STL[t.state] || t.state))),
        h('td', {}, status), h('td', {}, plan), h('td', {}, trial), h('td', {}, paid),
        h('td', {}, String(t.views30)), h('td', {}, String(t.bookings)), h('td', {}, fmt(t.created_at)),
        h('td', {}, h('div', { class: 'row', style: 'gap:6px;flex-wrap:nowrap' },
          h('button', { class: 'btn btn-main btn-sm', type: 'button', onclick: () => save() }, 'Salvar'),
          h('button', { class: 'btn btn-line btn-sm', type: 'button', title: 'Abrir o painel desta conta', onclick: async () => { await api('/api/admin/tenants/' + t.id + '/impersonate', { method: 'POST' }); window.open('/painel', '_blank'); } }, 'Entrar'),
          h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: () => { const np = prompt('Nova senha para ' + t.business_name + ' (mín. 4 caracteres):'); if (np) save({ new_password: np }); } }, 'Senha'))));
    }
    const table = h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Assinante', 'Endereço', 'Status', 'Plano', 'Teste até', 'Pago até', 'Visitas 30d', 'Agend.', 'Criado', ''].map((c) => h('th', { scope: 'col' }, c)))), tbody));
    $app.replaceChildren(h('main', { class: 'main', style: 'padding:28px clamp(16px,3vw,40px) 60px' },
      h('div', { class: 'topline' }, h('div', {}, h('a', { href: '/', class: 'brand' }, h('span', { class: 'brand-dot' }), BRAND + ' · admin')),
        h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: async () => { await api('/api/admin/logout', { method: 'POST' }); loginView(); } }, 'Sair')),
      h('div', { class: 'cards' }, kpi('Assinantes', s.total), kpi('Ativos', s.active), kpi('Em teste', s.trial), kpi('Receita mensal (ativos)', money(s.mrr))),
      h('div', { class: 'row', style: 'margin:6px 0 14px;justify-content:space-between' }, search, h('span', { class: 'muted small' }, 'Altere status, plano e datas e clique em Salvar.')),
      table));
    draw();
  }
  load();
})();
