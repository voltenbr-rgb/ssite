// Páginas do próprio SaaS: site de vendas, cadastro, login e o "casco" do painel/admin.
import { e } from './render.js';

const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const shell = (title, bodyHtml, { scripts = '', desc = '', headExtra = '', viewport = '' } = {}) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="${viewport || 'width=device-width, initial-scale=1, viewport-fit=cover'}">
<title>${e(title)}</title>
${desc ? `<meta name="description" content="${e(desc)}">` : ''}
<meta name="theme-color" content="#ECECEC">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/app.css">
<link rel="icon" href="/favicon.ico">
${headExtra}
</head>
<body>
${bodyHtml}
${scripts}
</body>
</html>`;

const logo = (brand) => `<a href="/" class="brand"><span class="brand-dot" aria-hidden="true">${e(brand.slice(0, 1).toUpperCase())}</span>${e(brand)}</a>`;
const I = {
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"></path></svg>',
  cal: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg>',
  edit: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="M14 6l4 4"></path></svg>',
  chart: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>',
  phone: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"></rect><path d="M11 18h2"></path></svg>',
  chat: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"></path></svg>',
  link: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>',
};

export function landingPage({ brand, trialDays, demo }) {
  const year = new Date().getFullYear();
  const features = [
    [I.edit, 'Edite sozinha, pelo celular', 'Troque textos, cores, fotos, vídeos, serviços e preços em minutos, vendo a prévia ao vivo.'],
    [I.cal, 'Agendamento que chega pronto', 'A cliente escolhe serviço, data e horário. Você recebe no painel e no WhatsApp.'],
    [I.chart, 'Métricas de verdade', 'Veja visitas, cliques no WhatsApp, serviços mais procurados e agendamentos por dia.'],
    [I.phone, 'Linda no celular e no computador', 'Carrosséis animados, fotos que ampliam e vídeos leves, feitos para quem chega pelo Instagram.'],
    [I.link, 'Seu endereço próprio', 'Seu nome no link: seunegocio.' + brand + '.com.br, pronto para a bio do Instagram.'],
    [I.chat, 'Feito para o seu segmento', 'Studios de cílios, unhas, sobrancelhas, cabelo, barbearias, estética e mais.'],
  ];
  const included = ['Página profissional completa', 'Agendamentos ilimitados', 'Painel com métricas', 'Fotos e vídeos em carrosséis', 'Endereço com o seu nome', 'App do painel no celular e no computador'];
  return shell(`${brand} · Seu site com agendamento em minutos`, `
<header class="topbar"><div class="wrap topbar-in">${logo(brand)}
<nav class="topnav"><a href="#recursos">Recursos</a><a href="#exemplo">Exemplo</a><a href="/entrar" class="btn btn-line btn-sm">Entrar</a></nav></div></header>
<main>
<section class="wrap hero">
<div class="hero-copy">
<p class="kicker">Para profissionais da beleza e serviços</p>
<h1>Seu site lindo, com <span class="hl">agendamento</span> e métricas. Sem depender de ninguém.</h1>
<p class="lead">Monte sua página em minutos, mostre seus trabalhos em carrosséis animados e receba agendamentos direto no WhatsApp.</p>
<div class="row"><a href="/cadastro" class="btn btn-main btn-lg">Começar grátis</a><a href="${e(demo)}" class="btn btn-line btn-lg" target="_blank" rel="noopener">Ver exemplo real</a></div>
<div class="hero-stats"><div><b>2</b><span>minutos para criar</span></div><div><b>${trialDays}</b><span>dias grátis</span></div><div><b>0</b><span>cartão de crédito</span></div></div>
</div>
<div class="hero-phone" id="exemplo">
<a class="device" href="${e(demo)}" target="_blank" rel="noopener" aria-label="Abrir a página de exemplo da Vitória Carvalho">
<span class="device-btn b1" aria-hidden="true"></span><span class="device-btn b2" aria-hidden="true"></span><span class="device-btn b3" aria-hidden="true"></span>
<span class="device-screen"><iframe src="${e(demo)}?embed=1" title="Página de exemplo" loading="lazy" tabindex="-1" scrolling="no"></iframe><span class="device-notch" aria-hidden="true"></span></span>
</a>
<p class="device-cap">Página real de uma cliente · <a href="${e(demo)}" target="_blank" rel="noopener">abrir</a></p>
</div>
</section>
<section id="recursos" class="wrap sec">
<div class="sec-head"><h2 class="h2">Tudo numa página só</h2><a href="/cadastro" class="btn btn-main btn-sm">Começar grátis</a></div>
<div class="grid3">${features.map(([ic, t, d]) => `<div class="feat-wrap"><div class="feat"><span class="feat-ic">${ic}</span><h3>${e(t)}</h3><p>${e(d)}</p></div><a class="corner" href="/cadastro" aria-label="Começar grátis: ${e(t)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></a></div>`).join('')}</div>
</section>
<section class="wrap sec">
<div class="cta-box">
<div>
<h2 class="h2" style="margin-bottom:10px">Tudo incluso</h2>
<p class="muted" style="margin:0">Comece grátis por ${trialDays} dias com todos os recursos liberados.</p>
</div>
<ul class="incl">${included.map((x) => `<li>${I.check} ${e(x)}</li>`).join('')}</ul>
<a href="/cadastro" class="btn btn-main btn-lg">Começar grátis</a>
</div>
</section>
<section class="wrap sec faq">
<h2 class="h2" style="margin-bottom:18px">Perguntas frequentes</h2>
<details><summary>Preciso saber programar?</summary><p>Não. Você edita tudo pelo painel, com formulários simples e uma prévia ao vivo.</p></details>
<details><summary>Como as clientes agendam?</summary><p>Elas tocam em "Agendar", escolhem serviço, data e horário. O pedido aparece no seu painel e abre o WhatsApp com a mensagem pronta.</p></details>
<details><summary>Posso usar no link da bio do Instagram?</summary><p>Sim. Seu endereço fica com o nome do seu negócio.</p></details>
<details><summary>Minhas fotos e dados ficam seguros?</summary><p>Sim. Suas fotos, vídeos, textos e os dados das suas clientes ficam guardados com segurança e são só seus. Não vendemos nem compartilhamos com ninguém.</p></details>
</section>
</main>
<footer class="foot"><div class="wrap foot-in">
<div class="foot-l">${logo(brand)}<p class="muted small" style="margin:8px 0 0;max-width:460px">Seus dados, fotos e vídeos são protegidos e pertencem a você. Não vendemos nem compartilhamos as informações dos nossos clientes.</p></div>
<div class="foot-r"><span class="muted small">© ${year} ${e(brand)}. Todos os direitos reservados.</span><a href="/admin" class="master-link">Área master</a></div>
</div></footer>
<script>
try{navigator.sendBeacon('/api/site-event',new Blob([JSON.stringify({type:'landing',label:document.referrer?new URL(document.referrer).hostname:''})],{type:'application/json'}))}catch(_){}
/* encaixa a página de exemplo (390×844) dentro da tela do celular, sem distorcer */
(function(){var s=document.querySelector('.device-screen'),f=s&&s.querySelector('iframe');if(!f)return;
function fit(){var k=s.clientWidth/390;f.style.transform='scale('+k+')';}
fit();if(window.ResizeObserver)new ResizeObserver(fit).observe(s);else addEventListener('resize',fit);})();
</script>`,
  { desc: 'Crie seu site com agendamento online, carrosséis de fotos e métricas. Comece grátis.' });
}

export function signupPage({ brand, segments, trialDays, root, templates = [] }) {
  const suffix = root ? `.${root}` : '';
  const year = new Date().getFullYear();
  return shell(`Criar conta · ${brand}`, `
<main class="auth">
<div class="auth-card">
${logo(brand)}
<div class="steps-head">
<p class="step-count" id="stepCount" aria-live="polite">Etapa 1 de 5</p>
<div class="step-bar" aria-hidden="true"><span id="stepBar" style="width:20%"></span></div>
</div>
<form id="signup" class="form" novalidate>

<fieldset class="step" data-step="1">
<legend><h1>Sobre o seu negócio</h1><p class="muted">${trialDays} dias grátis, com tudo liberado.</p></legend>
<label>Nome do negócio<input name="business_name" required maxlength="80" autocomplete="organization" placeholder="Ex.: Studio Vitória Lash"></label>
<label>Segmento<select name="segment">${segments.map((s) => `<option>${e(s)}</option>`).join('')}</select></label>
<label>Cidade <span class="opt">(opcional)</span><input name="city" maxlength="60" autocomplete="address-level2" placeholder="Ex.: Campo Grande · MS"></label>
</fieldset>

<fieldset class="step" data-step="2" hidden>
<legend><h1>Escolha o modelo</h1><p class="muted">Você pode trocar quando quiser, sem perder nada.</p></legend>
<div class="models">${templates.map((t, i) => `<label class="model"><input type="radio" name="template" value="${e(t.id)}"${i === 0 ? ' checked' : ''}><span class="model-card"><span class="model-img"><img src="${e(t.thumb)}" alt="" loading="lazy"></span><span class="model-txt"><b>${e(t.name)}</b><small>${e(t.desc)}</small></span><span class="model-ok" aria-hidden="true">${I.check}</span></span></label>`).join('')}</div>
</fieldset>

<fieldset class="step" data-step="3" hidden>
<legend><h1>O link da sua página</h1><p class="muted">É o endereço que você vai colocar na bio do Instagram.</p></legend>
<label>Link da sua página
<span class="slug-field"><input name="slug" required maxlength="30" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-1p-ignore placeholder="seunegocio"><span class="slug-suffix">${e(suffix || ' (link)')}</span></span>
<small id="slugMsg" class="hint" aria-live="polite">Só letras, números e hífen.</small></label>
<div class="url-card"><span class="muted small">Sua página vai ficar assim:</span><b id="slugPreview" data-root="${e(root)}">${root ? 'seunegocio.' + e(root) : 'seunegocio'}</b></div>
</fieldset>

<fieldset class="step" data-step="4" hidden>
<legend><h1>Seus dados</h1><p class="muted">Para os agendamentos chegarem até você.</p></legend>
<label>Seu nome<input name="owner_name" required maxlength="80" autocomplete="name"></label>
<label>WhatsApp<input name="whatsapp" required inputmode="tel" autocomplete="tel" placeholder="(67) 99999-9999"></label>
<label>E-mail<input name="email" type="email" required autocomplete="email"></label>
</fieldset>

<fieldset class="step" data-step="5" hidden>
<legend><h1>Crie sua senha</h1><p class="muted">Para entrar no painel com seu telefone ou e-mail.</p></legend>
<label>Senha<input name="password" type="password" required minlength="4" maxlength="8" autocomplete="new-password" aria-describedby="pwHint">
<span class="pw-meter" aria-hidden="true"><span id="pwBar"></span></span>
<small class="hint" id="pwHint" aria-live="polite">De 4 a 8 caracteres.</small></label>
<label>Repita a senha<input name="password2" type="password" required minlength="4" maxlength="8" autocomplete="new-password"></label>
</fieldset>

<p class="err" role="alert"></p>
<div class="step-nav">
<button class="btn btn-line btn-lg" type="button" id="stepBack" hidden>Voltar</button>
<button class="btn btn-main btn-lg" type="submit" id="stepNext">Continuar</button>
</div>
<p class="muted center small">Já tem conta? <a href="/entrar">Entrar</a></p>
</form>
</div>
<p class="auth-foot">© ${year} ${e(brand)}. Todos os direitos reservados.</p>
</main>`, { scripts: '<script src="/static/auth.js" defer></script>' });
}

export function loginPage({ brand }) {
  return shell(`Entrar · ${brand}`, `
<main class="auth">
<div class="auth-card">
${logo(brand)}
<h1>Entrar</h1>
<form id="login" class="form" novalidate>
<label>Telefone, e-mail ou usuário<input name="login" required autocapitalize="off" autocomplete="username" placeholder="Ex.: (67) 99999-9999"></label>
<label>Senha<input name="password" type="password" required autocomplete="current-password"></label>
<p class="err" role="alert"></p>
<button class="btn btn-main btn-block btn-lg" type="submit">Entrar</button>
<p class="muted center small">Ainda não tem conta? <a href="/cadastro">Começar grátis</a></p>
</form>
</div>
<p class="auth-foot">© ${new Date().getFullYear()} ${e(brand)}. Todos os direitos reservados.</p>
</main>`, { scripts: '<script src="/static/auth.js" defer></script>' });
}

export function appShell({ brand, kind }) {
  const isAdmin = kind === 'admin';
  const pwa = isAdmin ? '' : `<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icons/icon-180.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="${e(brand)}"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="mobile-web-app-capable" content="yes">`;
  return shell(`${isAdmin ? 'Admin' : 'Painel'} · ${brand}`, `<div id="app" data-brand="${e(brand)}"><p class="loading">Carregando…</p></div>`,
    { viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover', headExtra: `${pwa}<link rel="stylesheet" href="/static/panel.css">`, scripts: `<script src="/static/${isAdmin ? 'admin' : 'panel'}.js" defer></script>` });
}
