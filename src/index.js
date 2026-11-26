// ssite — Worker principal (Cloudflare Workers + D1 + KV)
import { hashPassword, verifyPassword, createSession, readSession, destroySession, cookie, randomToken } from './auth.js';
import { renderPage, renderLegalPage, TEMPLATES, templateList } from './render.js';
import { defaultConfig, PLANS, TRIAL_DAYS, SEGMENTS, TIERS } from './defaults.js';
import { landingPage, signupPage, loginPage, appShell } from './templates.js';

const RESERVED = new Set(['www', 'app', 'api', 'admin', 'painel', 'static', 'seed', 'm', 's', 'cadastro', 'entrar', 'sair', 'suporte', 'blog', 'mail', 'email', 'ajuda', 'planos', 'ssite']);
const EVENT_TYPES = new Set(['view', 'whatsapp', 'service', 'booking_open', 'booking', 'instagram']);
const BOOKING_STATUS = new Set(['novo', 'confirmado', 'concluido', 'cancelado']);
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 24 * 1024 * 1024;

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const html = (body, status = 200, headers = {}) => new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers } });
const err = (message, status = 400) => json({ error: message }, status);
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
const validSlug = (s) => /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(s) && !RESERVED.has(s);
const brDay = (d = new Date()) => new Date(d.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10); // America/Campo_Grande
const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const PASS_MIN = 4, PASS_MAX = 8;
const passError = (pw) => (pw.length < PASS_MIN || pw.length > PASS_MAX ? `A senha precisa ter de ${PASS_MIN} a ${PASS_MAX} caracteres.` : '');
const phoneKey = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.length >= 10 && d.length <= 11 ? '55' + d : d; };
async function siteEvent(env, type, label = '') {
  try { await env.DB.prepare('INSERT INTO site_events (type, label, day) VALUES (?, ?, ?)').bind(type, label, brDay()).run(); } catch (_) {}
}

async function body(request) {
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) throw new Error('Formato inválido.');
  return request.json();
}

function brand(env) { return env.BRAND_NAME || 'ssite'; }
function rootDomain(env) { return (env.ROOT_DOMAIN || '').toLowerCase(); }

function publicUrl(env, url, slug) {
  const root = rootDomain(env);
  if (root && url.hostname.endsWith(root)) return `https://${slug}.${root}`;
  return `${url.origin}/s/${slug}`;
}

function tenantState(t) {
  if (!t) return 'missing';
  if (t.status === 'blocked') return 'blocked';
  if (t.status === 'trial' && t.trial_ends && t.trial_ends < new Date().toISOString()) return 'expired';
  return t.status; // trial | active
}

const publicTenant = (t, env, url) => ({
  id: t.id, slug: t.slug, business_name: t.business_name, owner_name: t.owner_name, username: t.username, email: t.email,
  whatsapp: t.whatsapp, segment: t.segment, plan: t.plan, status: t.status, state: tenantState(t),
  trial_ends: t.trial_ends, paid_until: t.paid_until, created_at: t.created_at, url: publicUrl(env, url, t.slug),
  tier: t.tier || 'completo',
});

async function getTenantBySlug(env, slug) {
  return env.DB.prepare('SELECT * FROM tenants WHERE slug = ?').bind(slug).first();
}
async function getConfig(env, tenantId) {
  const row = await env.DB.prepare('SELECT config FROM pages WHERE tenant_id = ?').bind(tenantId).first();
  return row ? JSON.parse(row.config) : null;
}

async function accountOf(env, t) {
  if (!t || !t.parent_id) return t;
  return (await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(t.parent_id).first()) || t;
}
async function serveTenantPage(env, slug, embed = false, base = '', legal = null) {
  const t = await getTenantBySlug(env, slug);
  if (!t) return html(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada</title><body style="font-family:system-ui;background:#0F0A10;color:#F7F0E6;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center"><div><h1>Página não encontrada</h1><p>Confira o endereço digitado.</p></div>`, 404);
  const state = tenantState(await accountOf(env, t));
  const cfg = (await getConfig(env, t.id)) || defaultConfig({ businessName: t.business_name, ownerName: t.owner_name, whatsapp: t.whatsapp });
  const offline = state === 'blocked' || state === 'expired';
  if (legal) {
    const doc = offline ? null : renderLegalPage(t, cfg, legal, { base });
    if (!doc) return html('<!doctype html><meta charset="utf-8"><title>Não encontrado</title><p style="font-family:system-ui">Página não encontrada.</p>', 404);
    return html(doc, 200, { 'Cache-Control': 'no-cache' });
  }
  return html(renderPage(t, cfg, { offline, embed, base }), 200, { 'Cache-Control': 'no-cache' });
}

/* ---------------- validação da configuração ---------------- */
function sanitizeConfig(input) {
  // Mantém só estruturas JSON simples, limita tamanho de textos e listas.
  const walk = (v, depth = 0) => {
    if (depth > 6) return null;
    if (typeof v === 'string') return v.slice(0, 12000);
    if (typeof v === 'number' || typeof v === 'boolean' || v === null) return v;
    if (Array.isArray(v)) return v.slice(0, 60).map((x) => walk(x, depth + 1));
    if (typeof v === 'object') {
      const o = {};
      for (const [k, x] of Object.entries(v).slice(0, 60)) if (/^[a-zA-Z0-9_]{1,30}$/.test(k)) o[k] = walk(x, depth + 1);
      return o;
    }
    return null;
  };
  const out = walk(input);
  if (!out || typeof out !== 'object' || Array.isArray(out)) throw new Error('Configuração inválida.');
  const s = JSON.stringify(out);
  if (s.length > 200000) throw new Error('Página grande demais.');
  return out;
}

/* ---------------- autenticação ---------------- */
async function currentCtx(env, request) {
  const s = await readSession(env, request, 'ss_sess');
  if (!s || !s.tenant_id) return null;
  const accId = s.account_id || s.tenant_id;
  const account = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(accId).first();
  if (!account) return null;
  let page = s.tenant_id === account.id ? account : await env.DB.prepare('SELECT * FROM tenants WHERE id = ? AND parent_id = ?').bind(s.tenant_id, account.id).first();
  if (!page) page = account;
  return { session: s, account, page };
}
async function currentTenant(env, request) {
  const c = await currentCtx(env, request);
  return c ? c.page : null;
}
async function accountPages(env, account) {
  const r = await env.DB.prepare('SELECT * FROM tenants WHERE id = ? OR parent_id = ? ORDER BY (parent_id IS NOT NULL), id').bind(account.id, account.id).all();
  return r.results;
}
async function isAdmin(env, request) {
  const s = await readSession(env, request, 'ss_admin');
  return !!(s && s.is_admin);
}

/* ---------------- API ---------------- */
async function api(request, env, url) {
  const p = url.pathname;
  const m = request.method;
  const secure = url.protocol === 'https:';

  // ---- público: métricas e agendamentos da página ----
  if (p === '/api/t' && m === 'POST') {
    let d; try { d = JSON.parse(await request.text()); } catch { return new Response(null, { status: 204 }); }
    if (!EVENT_TYPES.has(d.type)) return new Response(null, { status: 204 });
    const t = await getTenantBySlug(env, clean(d.slug, 40));
    if (t) await env.DB.prepare('INSERT INTO events (tenant_id, type, label, day) VALUES (?, ?, ?, ?)').bind(t.id, d.type, clean(d.label, 80), brDay()).run();
    return new Response(null, { status: 204 });
  }
  if (p === '/api/book' && m === 'POST') {
    const d = await body(request);
    if (d.website) return json({ ok: true }); // robô (campo escondido preenchido)
    const t = await getTenantBySlug(env, clean(d.slug, 40));
    if (!t || !['trial', 'active'].includes(tenantState(await accountOf(env, t)))) return err('Página indisponível.', 404);
    const name = clean(d.name, 80), phone = String(d.phone || '').replace(/\D/g, '').slice(0, 15);
    if (!name || phone.length < 10) return err('Nome e WhatsApp são obrigatórios.');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') ? d.date : null;
    const time = /^\d{2}:\d{2}$/.test(d.time || '') ? d.time : null;
    await env.DB.batch([
      env.DB.prepare('INSERT INTO bookings (tenant_id, client_name, client_phone, service, date, time, note) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(t.id, name, phone, clean(d.service, 80), date, time, clean(d.note, 300)),
      env.DB.prepare('INSERT INTO events (tenant_id, type, label, day) VALUES (?, ?, ?, ?)').bind(t.id, 'booking', clean(d.service, 80), brDay()),
    ]);
    return json({ ok: true });
  }

  if (p === '/api/site-event' && m === 'POST') {
    let d; try { d = JSON.parse(await request.text()); } catch { return new Response(null, { status: 204 }); }
    if (['landing', 'signup_start', 'demo_click'].includes(d.type)) await siteEvent(env, d.type, clean(d.label, 60));
    return new Response(null, { status: 204 });
  }
  if (p === '/api/templates' && m === 'GET') return json({ templates: templateList() });

  // ---- cadastro / login ----
  if (p === '/api/slug-check' && m === 'GET') {
    const s = slugify(url.searchParams.get('s'));
    if (!validSlug(s)) return json({ slug: s, available: false, reason: 'Use de 3 a 30 letras, números ou hífen.' });
    const exists = await getTenantBySlug(env, s);
    const mine = exists ? await currentTenant(env, request) : null;
    const ok = !exists || (mine && mine.id === exists.id);
    return json({ slug: s, available: ok, reason: ok ? '' : 'Esse link já está em uso.' });
  }
  if (p === '/api/signup' && m === 'POST') {
    const d = await body(request);
    const business = clean(d.business_name, 80), owner = clean(d.owner_name, 80);
    const email = clean(d.email, 120).toLowerCase(), whatsapp = String(d.whatsapp || '').replace(/\D/g, '').slice(0, 15);
    const slug = slugify(d.slug || business), plan = PLANS[d.plan] ? d.plan : 'mensal';
    const password = String(d.password || '');
    if (!business || !owner) return err('Preencha o nome do negócio e o seu nome.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('E-mail inválido.');
    if (whatsapp.length < 10) return err('WhatsApp inválido (use DDD).');
    if (!validSlug(slug)) return err('Endereço inválido. Use de 3 a 30 letras, números ou hífen.');
    if (passError(password)) return err(passError(password));
    const wa = whatsapp.startsWith('55') ? whatsapp : '55' + whatsapp;
    const dup = await env.DB.prepare('SELECT slug, email, username, whatsapp FROM tenants WHERE slug = ? OR email = ? OR username = ? OR (whatsapp = ? AND parent_id IS NULL)').bind(slug, email, slug, wa).first();
    if (dup) return err(dup.email === email ? 'Esse e-mail já tem cadastro. Entre na sua conta.' : dup.whatsapp === wa ? 'Esse WhatsApp já tem cadastro. Entre na sua conta.' : 'Esse link já está em uso.', 409);
    const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
    const res = await env.DB.prepare("INSERT INTO tenants (slug, business_name, owner_name, username, email, whatsapp, segment, password_hash, plan, status, trial_ends, tier, max_pages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'simples', 1) RETURNING id")
      .bind(slug, business, owner, slug, email, wa, clean(d.segment, 40), await hashPassword(password), plan, 'trial', trialEnds).first();
    const cfg0 = defaultConfig({ businessName: business, ownerName: owner, whatsapp: wa, city: clean(d.city, 60) });
    if (TEMPLATES[d.template]) cfg0.template = d.template;
    await env.DB.prepare('INSERT INTO pages (tenant_id, config) VALUES (?, ?)').bind(res.id, JSON.stringify(cfg0)).run();
    await siteEvent(env, 'signup', slug);
    const token = await createSession(env, { tenantId: res.id });
    return json({ ok: true, slug }, 200, { 'Set-Cookie': cookie('ss_sess', token, { secure }) });
  }
  if (p === '/api/login' && m === 'POST') {
    const d = await body(request);
    const login = clean(d.login, 120).toLowerCase();
    const key = slugify(login).replace(/-/g, ''); // "Vitória Carvalho" -> "vitoriacarvalho"
    const digits = login.replace(/\D/g, '');
    const isPhone = digits.length >= 10 && digits.length <= 13 && /^[\d\s()+.-]+$/.test(login);
    const t = isPhone
      ? await env.DB.prepare('SELECT * FROM tenants WHERE (whatsapp = ? OR whatsapp = ?) ORDER BY (parent_id IS NOT NULL) LIMIT 1').bind(phoneKey(digits), digits).first()
      : await env.DB.prepare("SELECT * FROM tenants WHERE replace(lower(username), '-', '') = ? OR lower(email) = ? OR replace(slug, '-', '') = ? ORDER BY (parent_id IS NOT NULL) LIMIT 1").bind(key, login, key).first();
    const acc = await accountOf(env, t);
    if (!acc || !(await verifyPassword(String(d.password || ''), acc.password_hash))) return err('Usuário ou senha incorretos.', 401);
    const token = await createSession(env, { tenantId: t.id, accountId: acc.id });
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('ss_sess', token, { secure }) });
  }
  if (p === '/api/logout' && m === 'POST') {
    await destroySession(env, request, 'ss_sess');
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('ss_sess', '', { maxAge: 0, secure }) });
  }

  // ---- admin ----
  if (p.startsWith('/api/admin/')) return adminApi(request, env, url, secure);

  // ---- painel do assinante (precisa de login) ----
  const t = await currentTenant(env, request);
  if (!t) return err('Faça login novamente.', 401);

  const ctx = await currentCtx(env, request);
  const acc = ctx.account;
  if (p === '/api/pages' && m === 'GET') {
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30));
    const from = brDay(new Date(Date.now() - (days - 1) * 86400000));
    const pages = await accountPages(env, acc);
    const ids = pages.map((x) => x.id);
    const qs = ids.map(() => '?').join(',');
    const [ev, bk] = await env.DB.batch([
      env.DB.prepare(`SELECT tenant_id, type, COUNT(*) AS n FROM events WHERE tenant_id IN (${qs}) AND day >= ? GROUP BY tenant_id, type`).bind(...ids, from),
      env.DB.prepare(`SELECT tenant_id, COUNT(*) AS n, SUM(CASE WHEN status = 'novo' THEN 1 ELSE 0 END) AS pending FROM bookings WHERE tenant_id IN (${qs}) GROUP BY tenant_id`).bind(...ids),
    ]);
    const stats = {}; ev.results.forEach((r) => { (stats[r.tenant_id] = stats[r.tenant_id] || {})[r.type] = r.n; });
    const bks = {}; bk.results.forEach((r) => { bks[r.tenant_id] = r; });
    return json({
      days, current: t.id, max: acc.max_pages || 1, tier: acc.tier || 'simples',
      pages: pages.map((x) => ({ id: x.id, slug: x.slug, business_name: x.business_name, url: publicUrl(env, url, x.slug), main: !x.parent_id,
        views: stats[x.id]?.view || 0, clicks: (stats[x.id]?.whatsapp || 0) + (stats[x.id]?.booking_open || 0), services: stats[x.id]?.service || 0,
        bookings_period: stats[x.id]?.booking || 0, bookings: bks[x.id]?.n || 0, pending: bks[x.id]?.pending || 0 })),
    });
  }
  if (p === '/api/pages/switch' && m === 'POST') {
    const d = await body(request);
    const pg = (await accountPages(env, acc)).find((x) => x.id === Number(d.id));
    if (!pg) return err('Página não encontrada.', 404);
    await env.DB.prepare('UPDATE sessions SET tenant_id = ? WHERE token = ?').bind(pg.id, ctx.session.token).run();
    return json({ ok: true });
  }
  if (p === '/api/pages' && m === 'POST') {
    const d = await body(request);
    const pages = await accountPages(env, acc);
    if (pages.length >= (acc.max_pages || 1)) return err(`Seu plano permite ${acc.max_pages || 1} página${(acc.max_pages || 1) > 1 ? 's' : ''}. Fale com o suporte para liberar mais.`, 403);
    const business = clean(d.business_name, 80);
    const slug = slugify(d.slug || business);
    if (!business) return err('Digite o nome da página.');
    if (!validSlug(slug)) return err('Link inválido. Use de 3 a 30 letras, números ou hífen.');
    if (await env.DB.prepare('SELECT id FROM tenants WHERE slug = ? OR username = ?').bind(slug, slug).first()) return err('Esse link já está em uso.', 409);
    const wa = String(d.whatsapp || '').replace(/\D/g, '') || acc.whatsapp;
    const res = await env.DB.prepare('INSERT INTO tenants (slug, business_name, owner_name, username, email, whatsapp, segment, password_hash, plan, status, trial_ends, paid_until, tier, max_pages, parent_id) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?) RETURNING id')
      .bind(slug, business, acc.owner_name, slug, wa.startsWith('55') ? wa : '55' + wa, clean(d.segment, 40) || acc.segment, acc.password_hash, acc.plan, acc.status, acc.trial_ends, acc.paid_until, acc.tier || 'simples', acc.id).first();
    const cfg0 = defaultConfig({ businessName: business, ownerName: acc.owner_name, whatsapp: wa.startsWith('55') ? wa : '55' + wa, city: clean(d.city, 60) });
    if (TEMPLATES[d.template]) { cfg0.template = d.template; if (TEMPLATES[d.template].theme) cfg0.theme = { ...TEMPLATES[d.template].theme }; }
    await env.DB.prepare('INSERT INTO pages (tenant_id, config) VALUES (?, ?)').bind(res.id, JSON.stringify(cfg0)).run();
    await env.DB.prepare('UPDATE sessions SET tenant_id = ? WHERE token = ?').bind(res.id, ctx.session.token).run();
    return json({ ok: true, id: res.id, slug });
  }

  if (p === '/api/me' && m === 'GET') return json({ tenant: { ...publicTenant(t, env, url), state: tenantState(acc), plan: acc.plan, tier: acc.tier || 'simples', trial_ends: acc.trial_ends, paid_until: acc.paid_until, status: acc.status, main: !t.parent_id, account_username: acc.username, max_pages: acc.max_pages || 1 }, plans: PLANS, segments: SEGMENTS, brand: brand(env), support: String(env.SUPPORT_WHATSAPP || '').replace(/\D/g, ''), root: rootDomain(env) });
  if (p === '/api/me' && m === 'PUT') {
    const d = await body(request);
    const email = clean(d.email, 120).toLowerCase();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('E-mail inválido.');
    const wa = String(d.whatsapp || '').replace(/\D/g, '').slice(0, 15);
    if (d.slug != null && slugify(d.slug) !== t.slug) {
      const ns = slugify(d.slug);
      if (!validSlug(ns)) return err('Link inválido. Use de 3 a 30 letras, números ou hífen.');
      const taken = await env.DB.prepare('SELECT id FROM tenants WHERE (slug = ? OR username = ?) AND id != ?').bind(ns, ns, t.id).first();
      if (taken) return err('Esse link já está em uso.', 409);
      // o usuário de login acompanha o link (se ainda era igual ao link antigo)
      await env.DB.prepare('UPDATE tenants SET slug = ?, username = CASE WHEN username = ? THEN ? ELSE username END WHERE id = ?').bind(ns, t.slug, ns, t.id).run();
    }
    try {
      await env.DB.prepare('UPDATE tenants SET business_name = ?, owner_name = ?, email = ?, whatsapp = ?, segment = ? WHERE id = ?')
        .bind(clean(d.business_name, 80) || t.business_name, clean(d.owner_name, 80) || t.owner_name, email || null, wa || t.whatsapp, clean(d.segment, 40), t.id).run();
    } catch { return err('Esse e-mail já está em uso.', 409); }
    return json({ ok: true });
  }
  if (p === '/api/me/password' && m === 'POST') {
    const d = await body(request);
    if (!(await verifyPassword(String(d.current || ''), acc.password_hash))) return err('Senha atual incorreta.', 401);
    if (passError(String(d.next || ''))) return err(passError(String(d.next || '')));
    const nh = await hashPassword(String(d.next));
    await env.DB.prepare('UPDATE tenants SET password_hash = ? WHERE id = ? OR parent_id = ?').bind(nh, acc.id, acc.id).run();
    return json({ ok: true });
  }

  if (p === '/api/page' && m === 'GET') {
    const cfg = (await getConfig(env, t.id)) || defaultConfig({ businessName: t.business_name, ownerName: t.owner_name, whatsapp: t.whatsapp });
    return json({ config: cfg });
  }
  if (p === '/api/page' && m === 'PUT') {
    const d = await body(request);
    let cfg; try { cfg = sanitizeConfig(d.config); } catch (e2) { return err(e2.message); }
    await env.DB.prepare('INSERT INTO pages (tenant_id, config, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(tenant_id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at').bind(t.id, JSON.stringify(cfg)).run();
    return json({ ok: true });
  }
  if (p === '/api/page/preview' && m === 'POST') {
    const d = await body(request);
    let cfg; try { cfg = sanitizeConfig(d.config); } catch (e2) { return err(e2.message); }
    return html(renderPage(t, cfg, { preview: true }), 200, { 'Cache-Control': 'no-store' });
  }

  if (p === '/api/media' && m === 'GET') {
    const r = await env.DB.prepare('SELECT * FROM media WHERE tenant_id = ? ORDER BY created_at DESC').bind(t.id).all();
    return json({ media: r.results.map((x) => ({ ...x, url: `/m/${x.id}` })) });
  }
  if (p === '/api/media' && m === 'POST') {
    const ct = (request.headers.get('Content-Type') || '').split(';')[0];
    const kind = ct.startsWith('image/') ? 'image' : ct === 'video/mp4' || ct === 'video/webm' || ct === 'video/quicktime' ? 'video' : null;
    if (!kind) return err('Envie uma foto (JPG, PNG, WEBP) ou vídeo (MP4).');
    const buf = await request.arrayBuffer();
    if (buf.byteLength > (kind === 'image' ? MAX_IMAGE : MAX_VIDEO)) return err(kind === 'image' ? 'Foto grande demais (máx. 8 MB).' : 'Vídeo grande demais (máx. 24 MB).', 413);
    const id = randomToken(12);
    await env.MEDIA.put(`m/${id}`, buf, { metadata: { ct, tenant: t.id } });
    const name = clean(decodeURIComponent(request.headers.get('X-File-Name') || ''), 120);
    await env.DB.prepare('INSERT INTO media (id, tenant_id, kind, content_type, size, name) VALUES (?, ?, ?, ?, ?, ?)').bind(id, t.id, kind, ct, buf.byteLength, name).run();
    return json({ ok: true, media: { id, kind, url: `/m/${id}`, name } });
  }
  const mediaDel = p.match(/^\/api\/media\/([a-f0-9]+)$/);
  if (mediaDel && m === 'DELETE') {
    const row = await env.DB.prepare('SELECT id FROM media WHERE id = ? AND tenant_id = ?').bind(mediaDel[1], t.id).first();
    if (!row) return err('Arquivo não encontrado.', 404);
    await env.MEDIA.delete(`m/${row.id}`);
    await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(row.id).run();
    return json({ ok: true });
  }

  if (p === '/api/bookings' && m === 'GET') {
    const st = url.searchParams.get('status');
    const r = BOOKING_STATUS.has(st)
      ? await env.DB.prepare('SELECT * FROM bookings WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC LIMIT 300').bind(t.id, st).all()
      : await env.DB.prepare('SELECT * FROM bookings WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 300').bind(t.id).all();
    const counts = await env.DB.prepare('SELECT status, COUNT(*) AS n FROM bookings WHERE tenant_id = ? GROUP BY status').bind(t.id).all();
    return json({ bookings: r.results, counts: Object.fromEntries(counts.results.map((x) => [x.status, x.n])) });
  }
  const bk = p.match(/^\/api\/bookings\/(\d+)$/);
  if (bk && m === 'PATCH') {
    const d = await body(request);
    if (!BOOKING_STATUS.has(d.status)) return err('Status inválido.');
    await env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ? AND tenant_id = ?').bind(d.status, Number(bk[1]), t.id).run();
    return json({ ok: true });
  }
  if (bk && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM bookings WHERE id = ? AND tenant_id = ?').bind(Number(bk[1]), t.id).run();
    return json({ ok: true });
  }

  if (p === '/api/stats' && m === 'GET') {
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30));
    const from = brDay(new Date(Date.now() - (days - 1) * 86400000));
    const [byType, byDay, topSvc, bks] = await env.DB.batch([
      env.DB.prepare('SELECT type, COUNT(*) AS n FROM events WHERE tenant_id = ? AND day >= ? GROUP BY type').bind(t.id, from),
      env.DB.prepare('SELECT day, type, COUNT(*) AS n FROM events WHERE tenant_id = ? AND day >= ? GROUP BY day, type').bind(t.id, from),
      env.DB.prepare("SELECT label, COUNT(*) AS n FROM events WHERE tenant_id = ? AND day >= ? AND type IN ('service','booking') AND label != '' GROUP BY label ORDER BY n DESC LIMIT 6").bind(t.id, from),
      env.DB.prepare("SELECT COUNT(*) AS n FROM bookings WHERE tenant_id = ? AND status = 'novo'").bind(t.id),
    ]);
    return json({ days, from, totals: Object.fromEntries(byType.results.map((x) => [x.type, x.n])), daily: byDay.results, top: topSvc.results, pending: bks.results[0]?.n || 0 });
  }

  return err('Rota não encontrada.', 404);
}

async function adminApi(request, env, url, secure) {
  const p = url.pathname, m = request.method;
  if (p === '/api/admin/login' && m === 'POST') {
    const d = await body(request);
    const user = env.ADMIN_USER || 'admin';
    if (!env.ADMIN_PASSWORD) return err('Defina o segredo ADMIN_PASSWORD no Cloudflare para usar o admin.', 503);
    const okUser = clean(d.login, 80) === user;
    const okPass = String(d.password || '') === String(env.ADMIN_PASSWORD);
    if (!okUser || !okPass) return err('Usuário ou senha incorretos.', 401);
    const token = await createSession(env, { isAdmin: true });
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('ss_admin', token, { secure, maxAge: 60 * 60 * 12 }) });
  }
  if (!(await isAdmin(env, request))) return err('Faça login como administrador.', 401);
  if (p === '/api/admin/logout' && m === 'POST') {
    await destroySession(env, request, 'ss_admin');
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('ss_admin', '', { maxAge: 0, secure }) });
  }
  if (p === '/api/admin/overview' && m === 'GET') {
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get('days')) || 30));
    const from = brDay(new Date(Date.now() - (days - 1) * 86400000));
    const [site, siteDay, ev, evDay, bkDay, tCount, recent, top, bkTotal] = await env.DB.batch([
      env.DB.prepare('SELECT type, COUNT(*) AS n FROM site_events WHERE day >= ? GROUP BY type').bind(from),
      env.DB.prepare('SELECT day, type, COUNT(*) AS n FROM site_events WHERE day >= ? GROUP BY day, type').bind(from),
      env.DB.prepare('SELECT type, COUNT(*) AS n FROM events WHERE day >= ? GROUP BY type').bind(from),
      env.DB.prepare("SELECT day, COUNT(*) AS n FROM events WHERE day >= ? AND type = 'view' GROUP BY day").bind(from),
      env.DB.prepare("SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n FROM bookings WHERE created_at >= ? GROUP BY day").bind(from),
      env.DB.prepare('SELECT status, plan, trial_ends, COUNT(*) AS n FROM tenants WHERE parent_id IS NULL GROUP BY status, plan, trial_ends < ?').bind(new Date().toISOString()),
      env.DB.prepare('SELECT id, slug, business_name, owner_name, segment, whatsapp, status, trial_ends, created_at FROM tenants WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT 8'),
      env.DB.prepare(`SELECT t.id, t.slug, t.business_name,
        SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END) AS views,
        SUM(CASE WHEN e.type IN ('whatsapp','booking_open') THEN 1 ELSE 0 END) AS clicks,
        SUM(CASE WHEN e.type = 'booking' THEN 1 ELSE 0 END) AS bookings
        FROM events e JOIN tenants t ON t.id = e.tenant_id WHERE e.day >= ? GROUP BY t.id ORDER BY views DESC LIMIT 6`).bind(from),
      env.DB.prepare('SELECT COUNT(*) AS n FROM bookings'),
    ]);
    const now = new Date().toISOString();
    const st = { total: 0, active: 0, trial: 0, expired: 0, blocked: 0, mrr: 0 };
    for (const r of tCount.results) {
      st.total += r.n;
      const state = r.status === 'blocked' ? 'blocked' : r.status === 'trial' && r.trial_ends && r.trial_ends < now ? 'expired' : r.status;
      st[state] = (st[state] || 0) + r.n;
      if (state === 'active') st.mrr += r.n * (r.plan === 'anual' ? PLANS.anual.price / 12 : PLANS.mensal.price);
    }
    return json({
      days, from,
      site: Object.fromEntries(site.results.map((x) => [x.type, x.n])),
      siteDaily: siteDay.results,
      pages: Object.fromEntries(ev.results.map((x) => [x.type, x.n])),
      pagesDaily: evDay.results,
      bookingsDaily: bkDay.results,
      tenants: st,
      bookingsTotal: bkTotal.results[0]?.n || 0,
      recent: recent.results.map((t) => ({ ...t, state: tenantState(t), url: publicUrl(env, url, t.slug) })),
      top: top.results.map((t) => ({ ...t, url: publicUrl(env, url, t.slug) })),
    });
  }
  if (p === '/api/admin/tenants' && m === 'GET') {
    const from = brDay(new Date(Date.now() - 29 * 86400000));
    const r = await env.DB.prepare(`SELECT t.*,
      (SELECT COUNT(*) FROM events e WHERE e.tenant_id = t.id AND e.type = 'view' AND e.day >= ?) AS views30,
      (SELECT COUNT(*) FROM bookings b WHERE b.tenant_id = t.id) AS bookings,
      (SELECT COUNT(*) FROM tenants c WHERE c.parent_id = t.id) AS extra_pages,
      (SELECT business_name FROM tenants pp WHERE pp.id = t.parent_id) AS parent_name
      FROM tenants t ORDER BY COALESCE(t.parent_id, t.id) DESC, t.parent_id IS NOT NULL, t.id`).bind(from).all();
    const list = r.results.map((t) => ({ ...publicTenant(t, env, url), views30: t.views30, bookings: t.bookings, admin_note: t.admin_note || '', parent_id: t.parent_id, parent_name: t.parent_name, pages: 1 + (t.extra_pages || 0), max_pages: t.max_pages || 1 }));
    const mains = list.filter((t) => !t.parent_id);
    const mrr = mains.filter((t) => t.state === 'active').reduce((s, t) => s + (t.plan === 'anual' ? PLANS.anual.price / 12 : PLANS.mensal.price), 0);
    return json({ tenants: list, plans: PLANS, tiers: TIERS, summary: { total: mains.length, pages: list.length, active: mains.filter((t) => t.state === 'active').length, trial: mains.filter((t) => t.state === 'trial').length, mrr } });
  }
  const tm = p.match(/^\/api\/admin\/tenants\/(\d+)(\/impersonate)?$/);
  if (tm && m === 'PATCH') {
    const d = await body(request);
    const t = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(Number(tm[1])).first();
    if (!t) return err('Assinante não encontrado.', 404);
    const status = ['trial', 'active', 'blocked'].includes(d.status) ? d.status : t.status;
    const plan = PLANS[d.plan] ? d.plan : t.plan;
    const paid = d.paid_until === '' ? null : /^\d{4}-\d{2}-\d{2}$/.test(d.paid_until || '') ? d.paid_until : t.paid_until;
    const trial = /^\d{4}-\d{2}-\d{2}$/.test(d.trial_ends || '') && d.trial_ends !== (t.trial_ends || '').slice(0, 10) ? d.trial_ends + 'T23:59:59.000Z' : t.trial_ends;
    let slug = t.slug;
    if (d.slug && d.slug !== t.slug) {
      slug = slugify(d.slug);
      if (!validSlug(slug)) return err('Endereço inválido.');
      if (await getTenantBySlug(env, slug)) return err('Esse endereço já está em uso.', 409);
    }
    const changes0 = [];
    const tier = TIERS[d.tier] ? d.tier : (t.tier || 'completo');
    const note = clean(d.note, 500);
    const maxPages = Number.isInteger(Number(d.max_pages)) && Number(d.max_pages) >= 1 && Number(d.max_pages) <= 50 ? Number(d.max_pages) : (t.max_pages || 1);
    await env.DB.prepare('UPDATE tenants SET status = ?, plan = ?, tier = ?, paid_until = ?, trial_ends = ?, slug = ?, admin_note = COALESCE(?, admin_note), max_pages = ? WHERE id = ?').bind(status, plan, tier, paid, trial, slug, note || null, t.parent_id ? 0 : maxPages, t.id).run();
    if (!t.parent_id) await env.DB.prepare('UPDATE tenants SET status = ?, plan = ?, tier = ?, paid_until = ?, trial_ends = ? WHERE parent_id = ?').bind(status, plan, tier, paid, trial, t.id).run();
    if (!t.parent_id && maxPages !== (t.max_pages || 1)) changes0.push(`Limite de páginas: ${t.max_pages || 1} → ${maxPages}`);
    const STL = { trial: 'Teste', active: 'Ativo', blocked: 'Fora do ar' };
    const changes = changes0;
    if (status !== t.status) changes.push(`Status: ${STL[t.status] || t.status} → ${STL[status]}`);
    if (tier !== (t.tier || 'completo')) changes.push(`Plano: ${TIERS[t.tier || 'completo']} → ${TIERS[tier]}`);
    if (plan !== t.plan) changes.push(`Cobrança: ${PLANS[t.plan]?.name || t.plan} → ${PLANS[plan].name}`);
    if ((paid || '').slice(0, 10) !== (t.paid_until || '').slice(0, 10)) changes.push(`Pago até: ${paid ? paid.split('-').reverse().join('/') : '—'}`);
    if (trial !== t.trial_ends) changes.push(`Teste até: ${(trial || '').slice(0, 10).split('-').reverse().join('/')}`);
    if (slug !== t.slug) changes.push(`Link: ${t.slug} → ${slug}`);
    if (d.new_password) changes.push('Senha redefinida');
    if (changes.length || note) await env.DB.prepare('INSERT INTO admin_log (tenant_id, tenant, action, note) VALUES (?, ?, ?, ?)').bind(t.id, t.business_name, changes.join(' · ') || 'Observação', note || null).run();
    if (d.new_password) {
      if (passError(String(d.new_password))) return err(passError(String(d.new_password)));
      await env.DB.prepare('UPDATE tenants SET password_hash = ? WHERE id = ?').bind(await hashPassword(String(d.new_password)), t.id).run();
    }
    return json({ ok: true });
  }
  const lg = p.match(/^\/api\/admin\/tenants\/(\d+)\/log$/);
  if (lg && m === 'GET') {
    const r = await env.DB.prepare('SELECT action, note, created_at FROM admin_log WHERE tenant_id = ? ORDER BY id DESC LIMIT 30').bind(Number(lg[1])).all();
    return json({ log: r.results });
  }
  if (tm && !tm[2] && m === 'DELETE') {
    const d = await body(request);
    const t = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(Number(tm[1])).first();
    if (!t) return err('Assinante não encontrado.', 404);
    if (clean(d.confirm, 40) !== t.slug) return err('Digite o link da página para confirmar a exclusão.');
    const kids = await env.DB.prepare('SELECT id FROM tenants WHERE parent_id = ?').bind(t.id).all();
    for (const k of kids.results) {
      const km = await env.DB.prepare('SELECT id FROM media WHERE tenant_id = ?').bind(k.id).all();
      for (const x of km.results) { try { await env.MEDIA.delete(`m/${x.id}`); } catch (_) {} }
      await env.DB.batch(['media', 'events', 'bookings', 'pages'].map((tb) => env.DB.prepare(`DELETE FROM ${tb} WHERE tenant_id = ?`).bind(k.id)).concat([env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(k.id)]));
    }
    const media = await env.DB.prepare('SELECT id FROM media WHERE tenant_id = ?').bind(t.id).all();
    for (const x of media.results) { try { await env.MEDIA.delete(`m/${x.id}`); } catch (_) {} }
    await env.DB.batch([
      env.DB.prepare('DELETE FROM media WHERE tenant_id = ?').bind(t.id),
      env.DB.prepare('DELETE FROM events WHERE tenant_id = ?').bind(t.id),
      env.DB.prepare('DELETE FROM bookings WHERE tenant_id = ?').bind(t.id),
      env.DB.prepare('DELETE FROM pages WHERE tenant_id = ?').bind(t.id),
      env.DB.prepare('DELETE FROM sessions WHERE tenant_id = ?').bind(t.id),
      env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(t.id),
      env.DB.prepare('INSERT INTO admin_log (tenant_id, tenant, action, note) VALUES (?, ?, ?, ?)').bind(t.id, t.business_name, `Conta excluída (${t.slug})`, clean(d.note, 500) || null),
    ]);
    return json({ ok: true });
  }
  if (tm && tm[2] && m === 'POST') {
    const t = await env.DB.prepare('SELECT id, parent_id FROM tenants WHERE id = ?').bind(Number(tm[1])).first();
    if (!t) return err('Assinante não encontrado.', 404);
    const token = await createSession(env, { tenantId: t.id, accountId: t.parent_id || t.id });
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('ss_sess', token, { secure }) });
  }
  return err('Rota não encontrada.', 404);
}

/* ---------------- roteamento ---------------- */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const root = rootDomain(env);
    const p = url.pathname;

    try {
      // arquivos estáticos
      if (p.startsWith('/static/') || p.startsWith('/seed/') || p.startsWith('/icons/') || p === '/sw.js' || p === '/favicon.ico' || p === '/robots.txt') return env.ASSETS.fetch(request);

      // manifesto do app do painel (PWA), com o nome da marca
      if (p === '/manifest.webmanifest') {
        const B = brand(env);
        return new Response(JSON.stringify({
          name: `${B} · Painel`, short_name: B, description: 'Seu painel: agendamentos, métricas e edição da sua página.',
          id: '/painel', start_url: '/painel', scope: '/', display: 'standalone', orientation: 'any', background_color: '#ECECEC', theme_color: '#ECECEC', lang: 'pt-BR',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Agendamentos', url: '/painel#agendamentos', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Editar página', url: '/painel#pagina', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        }), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
      }

      // mídia enviada pelos assinantes
      const mm = p.match(/^\/m\/([a-f0-9]+)$/);
      if (mm && request.method === 'GET') {
        const obj = await env.MEDIA.getWithMetadata(`m/${mm[1]}`, { type: 'arrayBuffer' });
        if (!obj || !obj.value) return new Response('Não encontrado', { status: 404 });
        return new Response(obj.value, { headers: { 'Content-Type': obj.metadata?.ct || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'none' } });
      }

      if (p.startsWith('/api/')) return await api(request, env, url);

      // subdomínio do assinante: slug.ssite.com.br
      if (root && host.endsWith('.' + root)) {
        const sub = host.slice(0, -(root.length + 1));
        if (sub && sub !== 'www' && sub !== 'app') {
          if (p === '/' || p === '') return await serveTenantPage(env, sub);
          if (p === '/termos' || p === '/privacidade') return await serveTenantPage(env, sub, false, '', p.slice(1));
          return Response.redirect(`https://${sub}.${root}/`, 302);
        }
      }

      const sm = p.match(/^\/s\/([a-z0-9-]+)(?:\/(termos|privacidade))?\/?$/);
      if (sm) return await serveTenantPage(env, sm[1], url.searchParams.has('embed'), `/s/${sm[1]}`, sm[2] || null);

      const B = brand(env);
      if (p === '/') return html(landingPage({ brand: B, trialDays: TRIAL_DAYS, demo: '/s/' + (env.DEMO_SLUG || 'vitoriacarvalho') }));
      if (p === '/cadastro') return html(signupPage({ brand: B, segments: SEGMENTS, trialDays: TRIAL_DAYS, root, templates: templateList() }));
      if (p === '/entrar') return html(loginPage({ brand: B }));
      if (p === '/painel' || p.startsWith('/painel/')) return html(appShell({ brand: B, kind: 'panel' }), 200, { 'Cache-Control': 'no-store' });
      if (p === '/admin') return html(appShell({ brand: B, kind: 'admin' }), 200, { 'Cache-Control': 'no-store' });

      return html('<!doctype html><meta charset="utf-8"><title>404</title><p style="font-family:system-ui">Página não encontrada. <a href="/">Voltar</a></p>', 404);
    } catch (e) {
      if (p.startsWith('/api/')) return err(e.message && e.message.length < 120 ? e.message : 'Erro inesperado. Tente de novo.', 500);
      return html('<p style="font-family:system-ui">Erro inesperado. Tente de novo em instantes.</p>', 500);
    }
  },
};
