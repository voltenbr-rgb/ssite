/* Cadastro e login */
(function () {
  const post = (url, data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Algo deu errado. Tente de novo.'); return j; });

  const login = document.getElementById('login');
  if (login) login.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = login.querySelector('.err'), btn = login.querySelector('button[type=submit]');
    const d = Object.fromEntries(new FormData(login));
    if (!d.login || !d.password) { err.textContent = 'Preencha usuário e senha.'; return; }
    btn.disabled = true; err.textContent = '';
    try { await post('/api/login', d); location.href = '/painel'; }
    catch (x) { err.textContent = x.message; btn.disabled = false; }
  });

  const signup = document.getElementById('signup');
  if (!signup) return;
  const slug = signup.querySelector('[name=slug]'), biz = signup.querySelector('[name=business_name]'), msg = document.getElementById('slugMsg');
  const prev = document.getElementById('slugPreview');
  const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  let touched = false, timer = null, slugOk = null;
  const showPrev = () => { const s = slugify(slug.value) || 'seunegocio'; const r = prev.dataset.root; prev.textContent = r ? s + '.' + r : s; };
  const check = () => new Promise((resolve) => {
    clearTimeout(timer); showPrev();
    const s = slugify(slug.value);
    slugOk = null;
    if (!s) { msg.textContent = 'Só letras, números e hífen.'; msg.className = 'hint'; return resolve(false); }
    timer = setTimeout(async () => {
      const r = await fetch('/api/slug-check?s=' + encodeURIComponent(s)).then((x) => x.json()).catch(() => null);
      if (!r) return resolve(true);
      slugOk = r.available;
      msg.textContent = r.available ? 'Disponível!' : r.reason;
      msg.className = 'hint ' + (r.available ? 'ok' : 'bad');
      resolve(r.available);
    }, 250);
  });
  biz.addEventListener('input', () => { if (!touched) { slug.value = slugify(biz.value); check(); } });
  slug.addEventListener('input', () => { touched = true; check(); });
  slug.addEventListener('blur', () => { slug.value = slugify(slug.value); showPrev(); });

  const steps = [...signup.querySelectorAll('.step')];
  const err = signup.querySelector('.err'), back = document.getElementById('stepBack'), next = document.getElementById('stepNext');
  const count = document.getElementById('stepCount'), bar = document.getElementById('stepBar');
  let cur = 0;
  const RULES = {
    1: [['business_name', (v) => v.trim(), 'Digite o nome do seu negócio.']],
    2: [],
    3: [['slug', (v) => slugify(v).length >= 3, 'Escolha um link com pelo menos 3 letras.']],
    4: [['owner_name', (v) => v.trim(), 'Digite seu nome.'], ['whatsapp', (v) => v.replace(/\D/g, '').length >= 10, 'Digite seu WhatsApp com DDD.'], ['email', (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Digite um e-mail válido.']],
    5: [['password', (v) => v.length >= 4 && v.length <= 8, 'A senha precisa ter de 4 a 8 caracteres.'], ['password2', (v) => v === signup.querySelector('[name=password]').value, 'As senhas não são iguais.']],
  };
  function show(i) {
    cur = i;
    steps.forEach((st, j) => { st.hidden = j !== i; });
    count.textContent = `Etapa ${i + 1} de ${steps.length}`;
    bar.style.width = ((i + 1) / steps.length) * 100 + '%';
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Criar página' : 'Continuar';
    err.textContent = '';
    if (i === 2) { if (!slug.value) slug.value = slugify(biz.value); check(); }
    if (i === 1) { try { navigator.sendBeacon('/api/site-event', new Blob([JSON.stringify({ type: 'signup_start' })], { type: 'application/json' })); } catch (_) {} }
    const first = steps[i].querySelector('input:not([type=radio]), select') || steps[i].querySelector('input:checked');
    if (first) setTimeout(() => first.focus(), 60);
  }
  back.addEventListener('click', () => show(cur - 1));
  signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    signup.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    for (const [k, ok, m] of RULES[cur + 1]) {
      const el = signup.querySelector('[name=' + k + ']');
      if (!ok(el.value)) { el.setAttribute('aria-invalid', 'true'); el.focus(); err.textContent = m; return; }
    }
    if (cur === 2) {
      slug.value = slugify(slug.value);
      const free = slugOk === null ? await check() : slugOk;
      if (!free) { slug.setAttribute('aria-invalid', 'true'); slug.focus(); err.textContent = msg.textContent || 'Esse link já está em uso.'; return; }
    }
    if (cur < steps.length - 1) return show(cur + 1);
    const d = Object.fromEntries(new FormData(signup));
    delete d.password2;
    d.slug = slugify(d.slug || d.business_name);
    next.disabled = true; err.textContent = '';
    try { await post('/api/signup', d); location.href = '/painel?bemvinda=1'; }
    catch (x) {
      next.disabled = false;
      if (/link|endereço/i.test(x.message)) show(2); else if (/e-mail|whatsapp/i.test(x.message)) show(3); else if (/senha/i.test(x.message)) show(4);
      err.textContent = x.message;
    }
  });
  const pw = signup.querySelector('[name=password]'), pwBar = document.getElementById('pwBar'), pwHint = document.getElementById('pwHint');
  pw.addEventListener('input', () => {
    const v = pw.value;
    let sc = 0;
    if (v.length >= 6) sc++; if (v.length >= 8) sc++;
    if (/[a-zA-Z]/.test(v) && /\d/.test(v)) sc++;
    if (/[^a-zA-Z0-9]/.test(v) || (/[a-z]/.test(v) && /[A-Z]/.test(v))) sc++;
    if (/^(\d)\1+$/.test(v) || /^(0123|1234|2345|3456|4567|5678|6789)/.test(v)) sc = 0;
    const lv = !v ? null : v.length < 4 ? ['Muito curta', '#FF8A8A', 15] : sc <= 1 ? ['Senha fraca', '#FF8A8A', 33] : sc === 2 ? ['Senha média', '#F5C451', 66] : ['Senha forte', '#7FE0A3', 100];
    pwBar.style.width = lv ? lv[2] + '%' : '0'; pwBar.style.background = lv ? lv[1] : '';
    pwHint.textContent = lv ? lv[0] + (lv[2] < 100 ? ' · misture letras, números e símbolos para ficar mais forte.' : '') : 'De 4 a 8 caracteres.';
  });
  show(0);
})();
