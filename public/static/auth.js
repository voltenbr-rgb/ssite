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
    2: [['slug', (v) => slugify(v).length >= 3, 'Escolha um link com pelo menos 3 letras.']],
    3: [['owner_name', (v) => v.trim(), 'Digite seu nome.'], ['whatsapp', (v) => v.replace(/\D/g, '').length >= 10, 'Digite seu WhatsApp com DDD.'], ['email', (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Digite um e-mail válido.']],
    4: [['password', (v) => v.length >= 6, 'A senha precisa ter pelo menos 6 caracteres.'], ['password2', (v) => v === signup.querySelector('[name=password]').value, 'As senhas não são iguais.']],
  };
  function show(i) {
    cur = i;
    steps.forEach((st, j) => { st.hidden = j !== i; });
    count.textContent = `Etapa ${i + 1} de ${steps.length}`;
    bar.style.width = ((i + 1) / steps.length) * 100 + '%';
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Criar página' : 'Continuar';
    err.textContent = '';
    if (i === 1) { if (!slug.value) slug.value = slugify(biz.value); check(); }
    const first = steps[i].querySelector('input, select');
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
    if (cur === 1) {
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
      if (/link|endereço/i.test(x.message)) show(1); else if (/e-mail|whatsapp/i.test(x.message)) show(2);
      err.textContent = x.message;
    }
  });
  show(0);
})();
