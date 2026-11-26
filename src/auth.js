// Senhas (PBKDF2-SHA256) e sessões por cookie.
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16)), iterations = 100000) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return `pbkdf2$${iterations}$${b64(salt)}$${b64(bits)}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const [, iter, salt] = stored.split('$');
  const again = await hashPassword(password, unb64(salt), Number(iter));
  if (again.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < again.length; i++) diff |= again.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

export function randomToken(bytes = 32) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function cookie(name, value, { maxAge = 60 * 60 * 24 * 30, secure = true } = {}) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

const DAYS30 = 30 * 24 * 60 * 60 * 1000;

export async function createSession(env, { tenantId = null, isAdmin = false }) {
  const token = randomToken();
  const expires = new Date(Date.now() + DAYS30).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, tenant_id, is_admin, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, tenantId, isAdmin ? 1 : 0, expires).run();
  return token;
}

export async function readSession(env, request, cookieName) {
  const token = getCookie(request, cookieName);
  if (!token) return null;
  const row = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!row || row.expires_at < new Date().toISOString()) return null;
  return row;
}

export async function destroySession(env, request, cookieName) {
  const token = getCookie(request, cookieName);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}
