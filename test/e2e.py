from playwright.sync_api import sync_playwright
import json, re
B='http://localhost:8787'
S='/home/claude/shots/'
out=[]
def log(*a): out.append(' '.join(str(x) for x in a)); print(*a, flush=True)
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    errs=[]
    def mk(**kw):
        ctx=br.new_context(**kw); pg=ctx.new_page()
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e)))
        pg.on('console',lambda m: errs.append('console '+m.text) if m.type=='error' and 'fonts' not in m.text and 'ERR_' not in m.text else None)
        return ctx,pg
    # 1. página pública + agendamento
    ctx,pg=mk(viewport={'width':390,'height':844},has_touch=True)
    pg.add_init_script("window.open=function(u){window.__opened=(window.__opened||[]);window.__opened.push(u||'');return {location:{set href(v){window.__opened.push(v)}}}}")
    pg.goto(B+'/s/vitoriacarvalho'); pg.wait_for_timeout(1200)
    pg.screenshot(path=S+'pub_m.png')
    pg.click('.svc-btn >> nth=0',force=True); pg.wait_for_timeout(400)
    log('modal visible', pg.is_visible('#bk'), 'service', pg.input_value('#bkForm [name=service]'))
    pg.fill('[name=name]','Maria Teste'); pg.fill('[name=phone]','(67) 98888-7777')
    # garante dia útil
    pg.evaluate("""()=>{const d=new Date();d.setDate(d.getDate()+((8-d.getDay())%7||7));document.querySelector('[name=date]').value=d.toISOString().slice(0,10)}""")
    pg.screenshot(path=S+'bk_m.png')
    pg.click('.bk-send'); pg.wait_for_timeout(1000)
    log('msg', pg.text_content('.bk-msg')); log('opened', pg.evaluate('window.__opened'))
    ctx.close()
    # 2. painel da Vitória
    ctx,pg=mk(viewport={'width':1366,'height':900})
    pg.goto(B+'/entrar'); pg.fill('[name=login]','Vitória Carvalho'); pg.fill('[name=password]',__import__('os').environ['SEED_PASSWORD']); pg.click('button[type=submit]')
    pg.wait_for_url('**/painel**'); pg.wait_for_timeout(1500)
    pg.screenshot(path=S+'painel_inicio.png',full_page=True)
    log('kpis', pg.eval_on_selector_all('.kpi .num','els=>els.map(e=>e.textContent)'))
    pg.goto(B+'/painel#agendamentos'); pg.wait_for_timeout(1000)
    log('bookings', pg.eval_on_selector_all('.bk-main h3','els=>els.map(e=>e.textContent)'))
    pg.screenshot(path=S+'painel_bk.png',full_page=True)
    pg.click('text=Confirmar'); pg.wait_for_timeout(800)
    log('after confirm', pg.eval_on_selector_all('.pill','els=>els.map(e=>e.textContent)'))
    # 3. editor
    pg.goto(B+'/painel#pagina'); pg.wait_for_timeout(2500)
    pg.click('summary:has-text("Capa")'); pg.wait_for_timeout(300)
    inp=pg.locator('.sec-card[open] input[type=text]').nth(1)
    inp.fill('Venha ficar TESTE'); pg.wait_for_timeout(2000)
    log('savebar', pg.is_visible('.savebar.show'))
    fr=pg.frame_locator('.pv-frame iframe')
    log('preview h1', fr.locator('h1').text_content())
    pg.screenshot(path=S+'painel_editor.png')
    pg.click('text=Publicar alterações'); pg.wait_for_timeout(800)
    # upload de foto
    pg.goto(B+'/painel#midia'); pg.wait_for_timeout(800)
    pg.set_input_files('.dropzone input[type=file]','/home/claude/ssite/public/seed/vitoria/foto1.jpg'); pg.wait_for_timeout(2500)
    log('media count', pg.locator('.media-item').count())
    src=pg.get_attribute('.media-item img','src'); log('media src', src, pg.request.get(B+src).status)
    ctx.close()
    ctx,pg=mk(viewport={'width':1280,'height':800})
    pg.goto(B+'/s/vitoriacarvalho'); log('public h1 after publish', pg.text_content('h1'))
    ctx.close()
    # 4. cadastro novo
    ctx,pg=mk(viewport={'width':390,'height':844})
    pg.goto(B+'/cadastro'); pg.fill('[name=business_name]','Estúdio Ana Nails'); pg.wait_for_timeout(600)
    log('slug auto', pg.input_value('[name=slug]'), pg.text_content('#slugMsg'))
    pg.fill('[name=owner_name]','Ana Souza'); pg.fill('[name=email]','ana@teste.com'); pg.fill('[name=whatsapp]','67 99111-2222'); pg.fill('[name=password]','senha123')
    pg.screenshot(path=S+'cadastro_m.png',full_page=True)
    pg.click('button[type=submit]'); pg.wait_for_url('**/painel**'); pg.wait_for_timeout(2500)
    log('after signup url', pg.url)
    pg.screenshot(path=S+'novo_editor_m.png',full_page=False)
    ctx.close()
    ctx,pg=mk(viewport={'width':390,'height':844})
    r=pg.goto(B+'/s/estudio-ana-nails'); log('new page', r.status); pg.wait_for_timeout(800); pg.screenshot(path=S+'novo_pub_m.png')
    ctx.close()
    # 5. admin
    ctx,pg=mk(viewport={'width':1366,'height':900})
    pg.goto(B+'/admin'); pg.wait_for_timeout(500)
    pg.fill('[name=login]','admin'); pg.fill('[name=password]','admin-teste'); pg.click('button[type=submit]'); pg.wait_for_timeout(1200)
    log('admin rows', pg.locator('tbody tr').count(), pg.eval_on_selector_all('.kpi .num','e=>e.map(x=>x.textContent)'))
    pg.screenshot(path=S+'admin.png',full_page=True)
    ctx.close()
    # 6. landing
    ctx,pg=mk(viewport={'width':1366,'height':900})
    pg.goto(B+'/'); pg.wait_for_timeout(1500); pg.screenshot(path=S+'landing.png',full_page=True)
    ctx.close()
    log('ERRORS', errs)
    br.close()
