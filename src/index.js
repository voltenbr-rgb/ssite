// ssite — Worker principal (Cloudflare Workers + D1 + KV)
import { hashPassword, verifyPassword, createSession, readSession, destroySession, cookie, randomToken } from './auth.js';
import { renderPage } from './render.js';
import { defaultConfig, PLANS, TRIAL_DAYS, SEGMENTS } from './defaults.js';
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
});

async function getTenantBySlug(env, slug) {
  return env.DB.prepare('SELECT * FROM tenants WHERE slug = ?').bind(slug).first();
}
async function getConfig(env, tenantId) {
  const row = await env.DB.prepare('SELECT config FROM pages WHERE tenant_id = ?').bind(tenantId).first();
  return row ? JSON.parse(row.config) : null;
}

async function serveTenantPage(env, slug, embed = false) {
  const t = await getTenantBySlug(env, slug);
  if (!t) return html(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada</title><body style="font-family:system-ui;background:#0F0A10;color:#F7F0E6;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center"><div><h1>Página não encontrada</h1><p>Confira o endereço digitado.</p></div>`, 404);
  const state = tenantState(t);
  const cfg = (await getConfig(env, t.id)) || defaultConfig({ businessName: t.business_name, ownerName: t.owner_name, whatsapp: t.whatsapp });
  return html(renderPage(t, cfg, { offline: state === 'blocked' || state === 'expired', embed }), 200, { 'Cache-Control': 'no-cache' });
}

/* ---------------- validação da configuração ---------------- */
function sanitizeConfig(input) {
  // Mantém só estruturas JSON simples, limita tamanho de textos e listas.
  const walk = (v, depth = 0) => {
    if (depth > 6) return null;
    if (typeof v === 'string') return v.slice(0, 2000);
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
async function currentTenant(env, request) {
  const s = await readSession(env, request, 'ss_sess');
  if (!s || !s.tenant_id) return null;
  return env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(s.tenant_id).first();
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
    if (!t || !['trial', 'active'].includes(tenantState(t))) return err('Página indisponível.', 404);
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
    if (password.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
    const wa = whatsapp.startsWith('55') ? whatsapp : '55' + whatsapp;
    const dup = await env.DB.prepare('SELECT slug, email, username FROM tenants WHERE slug = ? OR email = ? OR username = ?').bind(slug, email, slug).first();
    if (dup) return err(dup.email === email ? 'Esse e-mail já tem cadastro. Entre na sua conta.' : 'Esse endereço já está em uso.', 409);
    const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
    const res = await env.DB.prepare('INSERT INTO tenants (slug, business_name, owner_name, username, email, whatsapp, segment, password_hash, plan, status, trial_ends) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
      .bind(slug, business, owner, slug, email, wa, clean(d.segment, 40), await hashPassword(password), plan, 'trial', trialEnds).first();
    await env.DB.prepare('INSERT INTO pages (tenant_id, config) VALUES (?, ?)').bind(res.id, JSON.stringify(defaultConfig({ businessName: business, ownerName: owner, whatsapp: wa, city: clean(d.city, 60) }))).run();
    const token = await createSession(env, { tenantId: res.id });
    return json({ ok: true, slug }, 200, { 'Set-Cookie': cookie('ss_sess', token, { secure }) });
  }
  if (p === '/api/login' && m === 'POST') {
    const d = await body(request);
    const login = clean(d.login, 120).toLowerCase();
    const key = slugify(login).replace(/-/g, ''); // "Vitória Carvalho" -> "vitoriacarvalho"
    const t = await env.DB.prepare("SELECT * FROM tenants WHERE replace(lower(username), '-', '') = ? OR lower(email) = ? OR replace(slug, '-', '') = ? LIMIT 1").bind(key, login, key).first();
    if (!t || !(await verifyPassword(String(d.password || ''), t.password_hash))) return err('Usuário ou senha incorretos.', 401);
    const token = await createSession(env, { tenantId: t.id });
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

  if (p === '/api/me' && m === 'GET') return json({ tenant: publicTenant(t, env, url), plans: PLANS, segments: SEGMENTS, brand: brand(env), support: String(env.SUPPORT_WHATSAPP || '').replace(/\D/g, ''), root: rootDomain(env) });
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
    if (!(await verifyPassword(String(d.current || ''), t.password_hash))) return err('Senha atual incorreta.', 401);
    if (String(d.next || '').length < 6) return err('A nova senha precisa ter pelo menos 6 caracteres.');
    await env.DB.prepare('UPDATE tenants SET password_hash = ? WHERE id = ?').bind(await hashPassword(String(d.next)), t.id).run();
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
  if (p === '/api/admin/tenants' && m === 'GET') {
    const from = brDay(new Date(Date.now() - 29 * 86400000));
    const r = await env.DB.prepare(`SELECT t.*,
      (SELECT COUNT(*) FROM events e WHERE e.tenant_id = t.id AND e.type = 'view' AND e.day >= ?) AS views30,
      (SELECT COUNT(*) FROM bookings b WHERE b.tenant_id = t.id) AS bookings
      FROM tenants t ORDER BY t.created_at DESC`).bind(from).all();
    const list = r.results.map((t) => ({ ...publicTenant(t, env, url), views30: t.views30, bookings: t.bookings }));
    const mrr = list.filter((t) => t.state === 'active').reduce((s, t) => s + (t.plan === 'anual' ? PLANS.anual.price / 12 : PLANS.mensal.price), 0);
    return json({ tenants: list, plans: PLANS, summary: { total: list.length, active: list.filter((t) => t.state === 'active').length, trial: list.filter((t) => t.state === 'trial').length, mrr } });
  }
  const tm = p.match(/^\/api\/admin\/tenants\/(\d+)(\/impersonate)?$/);
  if (tm && m === 'PATCH') {
    const d = await body(request);
    const t = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(Number(tm[1])).first();
    if (!t) return err('Assinante não encontrado.', 404);
    const status = ['trial', 'active', 'blocked'].includes(d.status) ? d.status : t.status;
    const plan = PLANS[d.plan] ? d.plan : t.plan;
    const paid = d.paid_until === '' ? null : /^\d{4}-\d{2}-\d{2}$/.test(d.paid_until || '') ? d.paid_until : t.paid_until;
    const trial = /^\d{4}-\d{2}-\d{2}$/.test(d.trial_ends || '') ? d.trial_ends + 'T23:59:59.000Z' : t.trial_ends;
    let slug = t.slug;
    if (d.slug && d.slug !== t.slug) {
      slug = slugify(d.slug);
      if (!validSlug(slug)) return err('Endereço inválido.');
      if (await getTenantBySlug(env, slug)) return err('Esse endereço já está em uso.', 409);
    }
    await env.DB.prepare('UPDATE tenants SET status = ?, plan = ?, paid_until = ?, trial_ends = ?, slug = ? WHERE id = ?').bind(status, plan, paid, trial, slug, t.id).run();
    if (d.new_password) {
      if (String(d.new_password).length < 4) return err('Senha muito curta.');
      await env.DB.prepare('UPDATE tenants SET password_hash = ? WHERE id = ?').bind(await hashPassword(String(d.new_password)), t.id).run();
    }
    return json({ ok: true });
  }
  if (tm && tm[2] && m === 'POST') {
    const t = await env.DB.prepare('SELECT id FROM tenants WHERE id = ?').bind(Number(tm[1])).first();
    if (!t) return err('Assinante não encontrado.', 404);
    const token = await createSession(env, { tenantId: t.id });
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
          id: '/painel', start_url: '/painel', scope: '/', display: 'standalone', background_color: '#E8F0FA', theme_color: '#1A1A1C', lang: 'pt-BR',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
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
          return Response.redirect(`https://${sub}.${root}/`, 302);
        }
      }

      const sm = p.match(/^\/s\/([a-z0-9-]+)\/?$/);
      if (sm) return await serveTenantPage(env, sm[1], url.searchParams.has('embed'));

      const B = brand(env);
      if (p === '/') return html(landingPage({ brand: B, trialDays: TRIAL_DAYS, demo: '/s/' + (env.DEMO_SLUG || 'vitoriacarvalho') }));
      if (p === '/cadastro') return html(signupPage({ brand: B, segments: SEGMENTS, trialDays: TRIAL_DAYS, root }));
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
