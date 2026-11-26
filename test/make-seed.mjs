import { hashPassword } from '../src/auth.js';
import { vitoriaConfig } from '../src/defaults.js';
import { writeFileSync } from 'node:fs';
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const hash = await hashPassword(process.env.SEED_PASSWORD || 'troque-esta-senha');
const sql = `-- Cadastro de exemplo: Vitória Carvalho (login: vitoriacarvalho — troque a senha no painel)
INSERT INTO tenants (slug, business_name, owner_name, username, email, whatsapp, segment, password_hash, plan, status, trial_ends)
VALUES ('vitoriacarvalho', 'Studio Vitoria Carvalho', 'Vitória Carvalho', 'vitoriacarvalho', NULL, '5567992604640', 'Cílios e sobrancelhas', ${q(hash)}, 'mensal', 'active', NULL);
INSERT INTO pages (tenant_id, config) VALUES ((SELECT id FROM tenants WHERE slug = 'vitoriacarvalho'), ${q(JSON.stringify(vitoriaConfig()))});
`;
writeFileSync(new URL('../migrations/0002_seed_vitoria.sql', import.meta.url), sql);
console.log('ok', hash.slice(0, 20));
