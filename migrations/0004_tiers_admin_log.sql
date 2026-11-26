-- Plano Completo/Simples, observação do master e histórico de ações
ALTER TABLE tenants ADD COLUMN tier TEXT NOT NULL DEFAULT 'completo';
ALTER TABLE tenants ADD COLUMN admin_note TEXT;
CREATE TABLE IF NOT EXISTS admin_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  INTEGER,
  tenant     TEXT,
  action     TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_log_tenant ON admin_log(tenant_id, created_at);
