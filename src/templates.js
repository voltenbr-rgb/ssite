// Páginas do próprio SaaS: site de vendas, cadastro, login e o "casco" do painel/admin.
import { e } from './render.js';

const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const shell = (title, bodyHtml, { scripts = '', desc = '' } = {}) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
${desc ? `<meta name="description" content="${e(desc)}">` : ''}
<meta name="theme-color" content="#0E0B12">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/app.css">
</head>
<body>
${bodyHtml}
${scripts}
</body>
</html>`;

const logo = (brand) => `<a href="/" class="brand"><span class="brand-dot" aria-hidden="true"></span>${e(brand)}</a>`;
const I = {
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"></path></svg>',
  cal: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg>',
  edit: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="M14 6l4 4"></path></svg>',
  chart: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>',
  phone: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"></rect><path d="M11 18h2"></path></svg>',
  chat: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"></path></svg>',
  link: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>',
};

export function landingPage({ brand, plans, trialDays, demo }) {
  const features = [
    [I.edit, 'Edite sozinha, pelo celular', 'Troque textos, cores, fotos, vídeos, serviços e preços em minutos, vendo a prévia ao vivo.'],
    [I.cal, 'Agendamento que chega pronto', 'A cliente escolhe serviço, data e horário. Você recebe no painel e no WhatsApp.'],
    [I.chart, 'Métricas de verdade', 'Veja visitas, cliques no WhatsApp, serviços mais procurados e agendamentos por dia.'],
    [I.phone, 'Linda no celular', 'Carrosséis animados, fotos que ampliam e vídeos leves, feitos para quem chega pelo Instagram.'],
    [I.link, 'Seu endereço próprio', 'Seu nome no link: seunegocio.' + brand + '.com.br, pronto para a bio do Instagram.'],
    [I.chat, 'Feito para o seu segmento', 'Studios de cílios, unhas, sobrancelhas, cabelo, barbearias, estética e mais.'],
  ];
  const plan = (p, featured) => `
<article class="plan${featured ? ' plan-hot' : ''}">
${featured ? '<span class="plan-tag">Mais econômico</span>' : ''}
<h3>${e(p.name)}</h3>
<p class="price"><strong>${money(p.price)}</strong><span>/${e(p.period)}</span></p>
<p class="plan-note">${e(p.note)}</p>
<ul>
<li>${I.check} Página profissional completa</li>
<li>${I.check} Agendamentos ilimitados</li>
<li>${I.check} Painel com métricas</li>
<li>${I.check} Fotos e vídeos no carrossel</li>
<li>${I.check} Endereço com o seu nome</li>
</ul>
<a href="/cadastro?plano=${e(p.id)}" class="btn ${featured ? 'btn-main' : 'btn-line'} btn-block">Testar ${trialDays} dias grátis</a>
</article>`;
  return shell(`${brand} · Seu site com agendamento em minutos`, `
<header class="topbar"><div class="wrap topbar-in">${logo(brand)}
<nav class="topnav"><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="/entrar" class="btn btn-line btn-sm">Entrar</a></nav></div></header>
<main>
<section class="wrap hero">
<div class="hero-copy">
<p class="kicker">Para profissionais da beleza e serviços</p>
<h1>Seu site lindo, com <span class="hl">agendamento</span> e métricas. Sem depender de ninguém.</h1>
<p class="lead">Monte sua página em minutos, mostre seus trabalhos em carrosséis animados e receba agendamentos direto no WhatsApp.</p>
<div class="row"><a href="/cadastro" class="btn btn-main btn-lg">Começar grátis por ${trialDays} dias</a><a href="${e(demo)}" class="btn btn-line btn-lg" target="_blank" rel="noopener">Ver exemplo real</a></div>
<p class="fine">Sem cartão de crédito para testar.</p>
</div>
<div class="hero-phone" aria-hidden="true">
<div class="phone"><iframe src="${e(demo)}" title="Exemplo" loading="lazy" tabindex="-1"></iframe></div>
</div>
</section>
<section id="recursos" class="wrap sec">
<h2 class="h2">Tudo que o seu negócio precisa numa página só</h2>
<div class="grid3">${features.map(([ic, t, d]) => `<div class="feat"><span class="feat-ic">${ic}</span><h3>${e(t)}</h3><p>${e(d)}</p></div>`).join('')}</div>
</section>
<section id="planos" class="wrap sec">
<h2 class="h2 center">Planos simples, sem surpresa</h2>
<p class="center muted">Teste grátis por ${trialDays} dias. Depois, escolha como prefere pagar.</p>
<div class="plans">${plan(plans.mensal, false)}${plan(plans.anual, true)}</div>
</section>
<section class="wrap sec faq">
<h2 class="h2">Perguntas frequentes</h2>
<details><summary>Preciso saber programar?</summary><p>Não. Você edita tudo pelo painel, com formulários simples e uma prévia ao vivo.</p></details>
<details><summary>Como as clientes agendam?</summary><p>Elas tocam em "Agendar", escolhem serviço, data e horário. O pedido aparece no seu painel e abre o WhatsApp com a mensagem pronta.</p></details>
<details><summary>Posso usar no link da bio do Instagram?</summary><p>Sim. Seu endereço fica com o nome do seu negócio.</p></details>
<details><summary>E depois do teste grátis?</summary><p>Fale com a gente para ativar o plano mensal ou anual. Sua página e seus dados ficam guardados.</p></details>
</section>
</main>
<footer class="foot"><div class="wrap foot-in">${logo(brand)}<span class="muted">© ${new Date().getFullYear()} ${e(brand)}</span></div></footer>`,
  { desc: 'Crie seu site com agendamento online, carrosséis de fotos e métricas. Teste grátis.' });
}

export function signupPage({ brand, plans, segments, trialDays, plan, root }) {
  const suffix = root ? `.${root}` : '';
  return shell(`Criar conta · ${brand}`, `
<main class="auth">
<div class="auth-card wide">
${logo(brand)}
<h1>Crie sua página</h1>
<p class="muted">${trialDays} dias grátis. Leva 2 minutos.</p>
<form id="signup" class="form" novalidate>
<fieldset class="plan-pick"><legend>Plano</legend>
${Object.values(plans).map((p) => `<label class="pick"><input type="radio" name="plan" value="${e(p.id)}"${p.id === plan ? ' checked' : ''}><span><strong>${e(p.name)}</strong> ${money(p.price)}/${e(p.period)}<small>${e(p.note)}</small></span></label>`).join('')}
</fieldset>
<label>Nome do negócio<input name="business_name" required maxlength="80" placeholder="Ex.: Studio Vitória Lash"></label>
<label>Endereço da sua página
<span class="slug-field"><input name="slug" required maxlength="30" autocapitalize="off" spellcheck="false" placeholder="seunegocio"><span class="slug-suffix">${e(suffix || ' (link)')}</span></span>
<small id="slugMsg" class="hint" aria-live="polite">Só letras, números e hífen.</small></label>
<div class="two">
<label>Seu nome<input name="owner_name" required maxlength="80" autocomplete="name"></label>
<label>Segmento<select name="segment">${segments.map((s) => `<option>${e(s)}</option>`).join('')}</select></label>
</div>
<div class="two">
<label>E-mail<input name="email" type="email" required autocomplete="email"></label>
<label>WhatsApp<input name="whatsapp" required inputmode="tel" placeholder="(67) 99999-9999"></label>
</div>
<div class="two">
<label>Cidade<input name="city" maxlength="60" placeholder="Ex.: Campo Grande · MS"></label>
<label>Senha<input name="password" type="password" required minlength="6" autocomplete="new-password"></label>
</div>
<p class="err" role="alert"></p>
<button class="btn btn-main btn-block btn-lg" type="submit">Criar minha página</button>
<p class="muted center small">Já tem conta? <a href="/entrar">Entrar</a></p>
</form>
</div>
</main>`, { scripts: '<script src="/static/auth.js" defer></script>' });
}

export function loginPage({ brand }) {
  return shell(`Entrar · ${brand}`, `
<main class="auth">
<div class="auth-card">
${logo(brand)}
<h1>Entrar</h1>
<form id="login" class="form" novalidate>
<label>Usuário ou e-mail<input name="login" required autocapitalize="off" autocomplete="username"></label>
<label>Senha<input name="password" type="password" required autocomplete="current-password"></label>
<p class="err" role="alert"></p>
<button class="btn btn-main btn-block btn-lg" type="submit">Entrar</button>
<p class="muted center small">Ainda não tem conta? <a href="/cadastro">Teste grátis</a></p>
</form>
</div>
</main>`, { scripts: '<script src="/static/auth.js" defer></script>' });
}

export function appShell({ brand, kind }) {
  const isAdmin = kind === 'admin';
  return shell(`${isAdmin ? 'Admin' : 'Painel'} · ${brand}`, `<div id="app" data-brand="${e(brand)}"><p class="loading">Carregando…</p></div>`,
    { scripts: `<link rel="stylesheet" href="/static/panel.css"><script src="/static/${isAdmin ? 'admin' : 'panel'}.js" defer></script>` });
}
