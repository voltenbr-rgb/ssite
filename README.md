# ssite

SaaS multi-assinante de páginas profissionais com agendamento, métricas e editor por seções.
Roda 100% na Cloudflare: **Workers** (código), **D1** (banco `ssite`) e **KV** (`ssite-media`, fotos e vídeos).

## O que tem

| Endereço | Para quem | O quê |
|---|---|---|
| `/` | público | Site de vendas com os planos Mensal e Anual |
| `/cadastro` | público | Cadastro com 7 dias grátis (escolhe plano, nome e endereço da página) |
| `/entrar` | assinante | Login por usuário, nome ou e-mail |
| `/painel` | assinante | Início (métricas), Agendamentos, Editar página (com prévia ao vivo), Fotos e vídeos, Minha conta |
| `/admin` | você | Lista de assinantes, ativar/bloquear, plano, datas, trocar senha, entrar na conta |
| `slug.ssite.com.br` ou `/s/slug` | clientes finais | Página pública do assinante |

Cadastro de exemplo já gravado no banco: **Vitória Carvalho** — login `Vitória Carvalho` (ou `vitoriacarvalho`), com a senha combinada.
Página: `/s/vitoriacarvalho` (e `vitoriacarvalho.ssite.com.br` depois do domínio). **Troque a senha em Minha conta.**

## Publicar (Cloudflare Workers + GitHub)

1. Cloudflare → **Workers & Pages → Create → Workers → Import a repository** → escolha `ssite`.
   - Build command: *(vazio)* · Deploy command: `npx wrangler deploy`
2. Em **Settings → Variables and Secrets** do Worker `ssite`, crie o segredo **`ADMIN_PASSWORD`** (senha do `/admin`, usuário `admin`).
   Opcional: variável `SUPPORT_WHATSAPP` (ex.: `5567999999999`) para o botão "Falar com o suporte" no painel.
3. O banco D1 `ssite` e o KV `ssite-media` já existem e estão ligados no `wrangler.jsonc`. As tabelas já foram criadas.

Cada push na branch `main` publica de novo.

## Domínio ssite.com.br (quando comprar)

1. Adicione `ssite.com.br` na Cloudflare e aponte os nameservers no Registro.br.
2. DNS: crie `A @ 192.0.2.1` e `A * 192.0.2.1` (ambos **com proxy laranja ligado**).
3. Worker `ssite` → **Settings → Domains & Routes → Add route**: `ssite.com.br/*` e `*.ssite.com.br/*`.

Pronto: `ssite.com.br` abre o site de vendas e `nome.ssite.com.br` abre a página de cada assinante.
Se mudar o domínio, troque `ROOT_DOMAIN` no `wrangler.jsonc`. O nome da marca fica em `BRAND_NAME`.

## Planos e cobrança

Os valores ficam em `src/defaults.js` (`PLANS`): Mensal R$ 39,90 e Anual R$ 399,00 (exemplos). Teste grátis: `TRIAL_DAYS` (7).
Ainda não há cobrança automática: você ativa no `/admin` (status **Ativo** + "Pago até"). Teste vencido ou conta bloqueada deixa a página fora do ar.

## Estrutura

```
src/index.js      rotas, API, admin
src/render.js     HTML da página pública a partir da configuração (JSON)
src/templates.js  site de vendas, cadastro, login
src/defaults.js   planos, modelo de página nova e a página da Vitória
src/auth.js       senhas (PBKDF2) e sessões
public/static/    CSS e JS (página, painel, admin)
public/seed/      fotos e vídeos da Vitória
migrations/       tabelas e cadastro de exemplo
test/             servidor local que imita a Cloudflare + testes de navegador
```

Rodar local sem Cloudflare: `node test/server.mjs` → http://localhost:8787 (admin: `admin` / `admin-teste`).
