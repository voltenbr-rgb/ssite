-- Uma conta (cadastro) pode ter várias páginas: páginas extras apontam para a principal
ALTER TABLE tenants ADD COLUMN parent_id INTEGER;
ALTER TABLE tenants ADD COLUMN max_pages INTEGER NOT NULL DEFAULT 1;
ALTER TABLE sessions ADD COLUMN account_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_tenants_parent ON tenants(parent_id);
