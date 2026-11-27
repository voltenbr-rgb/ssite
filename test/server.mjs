// Servidor local que imita o Cloudflare (D1 via node:sqlite, KV em memória, ASSETS da pasta public).
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import worker from '../src/index.js';

const root = new URL('..', import.meta.url).pathname;
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(root + 'migrations/0001_init.sql', 'utf8'));
db.exec(readFileSync(root + 'migrations/0002_seed_vitoria.sql', 'utf8'));
db.exec(readFileSync(root + 'migrations/0003_site_events.sql', 'utf8'));
db.exec(readFileSync(root + 'migrations/0004_tiers_admin_log.sql', 'utf8'));
db.exec(readFileSync(root + 'migrations/0005_multi_pages.sql', 'utf8'));
db.exec(readFileSync(root + 'migrations/0006_avatar.sql', 'utf8'));

class Stmt {
  constructor(sql) { this.sql = sql; this.args = []; }
  bind(...a) { this.args = a.map((x) => (x === undefined ? null : x)); return this; }
  _s() { return db.prepare(this.sql); }
  async first() { return this._s().get(...this.args) ?? null; }
  async all() { return { results: this._s().all(...this.args) }; }
  async run() { const r = this._s().run(...this.args); return { meta: { changes: r.changes, last_row_id: r.lastInsertRowid } }; }
}
const DB = { prepare: (sql) => new Stmt(sql), batch: async (list) => Promise.all(list.map((s) => (/^\s*select/i.test(s.sql) ? s.all() : s.run()))) };
const kv = new Map();
const MEDIA = {
  put: async (k, v, o) => kv.set(k, { value: Buffer.from(v), metadata: o?.metadata }),
  getWithMetadata: async (k) => { const x = kv.get(k); return x ? { value: x.value, metadata: x.metadata } : { value: null }; },
  delete: async (k) => kv.delete(k),
};
const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.html': 'text/html', '.ico': 'image/x-icon', '.webp': 'image/webp' };
const ASSETS = { fetch: async (req) => {
  const p = path.join(root, 'public', decodeURIComponent(new URL(req.url).pathname));
  if (!p.startsWith(path.join(root, 'public')) || !existsSync(p) || statSync(p).isDirectory()) return new Response('404', { status: 404 });
  return new Response(readFileSync(p), { headers: { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' } });
} };
const env = { DB, MEDIA, ASSETS, BRAND_NAME: 'ssite', ROOT_DOMAIN: 'ssite.com.br', ADMIN_PASSWORD: 'admin-teste', SUPPORT_WHATSAPP: '5567999999999' };

http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const host = req.headers.host || 'localhost:8787';
  const request = new Request('http://' + host + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
  const r = await worker.fetch(request, env, {});
  const headers = {}; r.headers.forEach((v, k) => { headers[k] = v; });
  // cookies "Secure" não funcionam em http local
  if (headers['set-cookie']) headers['set-cookie'] = headers['set-cookie'].replace('; Secure', '');
  res.writeHead(r.status, headers);
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log('ouvindo em http://localhost:8787'));
