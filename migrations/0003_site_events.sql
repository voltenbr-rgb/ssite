-- Métricas do próprio site (página inicial, cadastro) para a área master
CREATE TABLE IF NOT EXISTS site_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,      -- landing | signup_start | signup | login
  label      TEXT,
  day        TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_site_events_day ON site_events(day, type);
CREATE INDEX IF NOT EXISTS idx_tenants_whatsapp ON tenants(whatsapp);
