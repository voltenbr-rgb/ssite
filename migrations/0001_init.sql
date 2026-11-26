-- ssite: esquema inicial (multi-tenant)

CREATE TABLE IF NOT EXISTS tenants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,            -- vira o subdomínio: slug.ssite.com.br
  business_name TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,            -- login (além do e-mail)
  email         TEXT UNIQUE,
  whatsapp      TEXT,
  segment       TEXT,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'mensal',  -- mensal | anual
  status        TEXT NOT NULL DEFAULT 'trial',   -- trial | active | blocked
  trial_ends    TEXT,
  paid_until    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
  tenant_id  INTEGER PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  config     TEXT NOT NULL,                      -- JSON com todas as seções da página
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_name  TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service      TEXT,
  date         TEXT,
  time         TEXT,
  note         TEXT,
  status       TEXT NOT NULL DEFAULT 'novo',     -- novo | confirmado | concluido | cancelado
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,                      -- view | whatsapp | service | booking_open | booking | instagram
  label      TEXT,
  day        TEXT NOT NULL,                      -- AAAA-MM-DD (horário de Brasília)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_tenant_day ON events(tenant_id, day);

CREATE TABLE IF NOT EXISTS media (
  id           TEXT PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,                    -- image | video
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  name         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_tenant ON media(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  tenant_id  INTEGER,
  is_admin   INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL
);
