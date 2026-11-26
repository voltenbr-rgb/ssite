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
  const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  let touched = false, timer = null;
  const prev = document.getElementById('slugPreview');
  const showPrev = () => { const s = slugify(slug.value) || 'seunegocio'; const r = prev.dataset.root; prev.textContent = r ? s + '.' + r : s; };
  const check = () => {
    clearTimeout(timer);
    showPrev();
    const s = slugify(slug.value);
    if (!s) { msg.textContent = 'Só letras, números e hífen.'; msg.className = 'hint'; return; }
    timer = setTimeout(async () => {
      const r = await fetch('/api/slug-check?s=' + encodeURIComponent(s)).then((x) => x.json()).catch(() => null);
      if (!r) return;
      msg.textContent = r.available ? 'Disponível: ' + r.slug : r.reason;
      msg.className = 'hint ' + (r.available ? 'ok' : 'bad');
    }, 300);
  };
  biz.addEventListener('input', () => { if (!touched) { slug.value = slugify(biz.value); check(); } });
  slug.addEventListener('input', () => { touched = true; check(); });
  slug.addEventListener('blur', () => { slug.value = slugify(slug.value); });

  signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = signup.querySelector('.err'), btn = signup.querySelector('button[type=submit]');
    const d = Object.fromEntries(new FormData(signup));
    d.slug = slugify(d.slug || d.business_name);
    signup.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    const need = [['business_name', 'Digite o nome do negócio.'], ['slug', 'Escolha o endereço da página.'], ['owner_name', 'Digite seu nome.'], ['email', 'Digite seu e-mail.'], ['whatsapp', 'Digite seu WhatsApp com DDD.'], ['password', 'Crie uma senha com 6+ caracteres.']];
    for (const [k, m] of need) {
      if (!d[k] || (k === 'password' && d[k].length < 6) || (k === 'whatsapp' && d[k].replace(/\D/g, '').length < 10)) {
        const el = signup.querySelector('[name=' + k + ']'); el.setAttribute('aria-invalid', 'true'); el.focus(); err.textContent = m; return;
      }
    }
    btn.disabled = true; err.textContent = '';
    try { await post('/api/signup', d); location.href = '/painel?bemvinda=1'; }
    catch (x) { err.textContent = x.message; btn.disabled = false; }
  });
})();
