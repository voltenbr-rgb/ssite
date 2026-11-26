// Imprime os valores (hash e configuração) usados para gravar a Vitória no D1 remoto.
import { readFileSync } from 'node:fs';
import { vitoriaConfig } from '../src/defaults.js';
const seed = readFileSync(new URL('../migrations/0002_seed_vitoria.sql', import.meta.url), 'utf8');
const hash = seed.match(/'(pbkdf2[^']+)'/)[1];
console.log(JSON.stringify([hash, JSON.stringify(vitoriaConfig())]));
