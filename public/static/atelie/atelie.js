/* Modelo Ateliê — animações, carrossel com abas, foto ampliada (baseado na página da Érica Vitória). */
(function(){
const AT = window.__AT || {};
const WORKS = AT.works || {};
const ROTATE = AT.rotate || [];
const MARQUEE = AT.marquee || [];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* ============ helpers ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* header / sticky bar */
const header=$("header"), bar=$("#barCta");
addEventListener("scroll",()=>{
  if(header)header.classList.toggle("solid",scrollY>30);
  if(bar)bar.classList.toggle("show",scrollY>innerHeight*.7);
},{passive:true});

/* reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.15});
$$(".rv").forEach(el=>io.observe(el));

/* rotating word */
(()=>{const box=$("#rotor"); let i=0; if(reduce||!box||ROTATE.length<2)return;
  setInterval(()=>{const s=box.firstElementChild; s.classList.add("out");
    setTimeout(()=>{i=(i+1)%ROTATE.length; s.textContent=ROTATE[i]; s.classList.remove("out")},450)},2400);
})();

/* marquee */
if($("#marq"))$("#marq").innerHTML = [...MARQUEE,...MARQUEE].map(t=>`<span>${esc(t)}</span>`).join("");

/* tilt do hero */
(()=>{const hero=$(".hero"); if(!hero||reduce||!matchMedia("(pointer:fine)").matches)return; let raf;
  hero.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1;
    cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{hero.style.setProperty("--mx",x.toFixed(3));hero.style.setProperty("--my",y.toFixed(3))})});
  hero.addEventListener("pointerleave",()=>{hero.style.setProperty("--mx",0);hero.style.setProperty("--my",0)});
})();

/* ============ Lightbox ============ */
const lb=$("#alb"), lbImg=$("img",lb), lbCap=$("figcaption",lb);
let lbItems=[], lbI=0;
function lbShow(i){lbI=(i+lbItems.length)%lbItems.length;lbImg.src=lbItems[lbI].src;lbImg.alt=lbItems[lbI].cap;lbCap.textContent=lbItems[lbI].cap}
function lbOpen(items,i){lbItems=items;lbShow(i);lb.classList.add("open");document.body.style.overflow="hidden"}
function lbClose(){lb.classList.remove("open");document.body.style.overflow=""}
$(".x",lb).onclick=lbClose; $(".prev",lb).onclick=()=>lbShow(lbI-1); $(".next",lb).onclick=()=>lbShow(lbI+1);
lb.addEventListener("click",e=>{if(e.target===lb)lbClose()});
addEventListener("keydown",e=>{if(!lb.classList.contains("open"))return;
  if(e.key==="Escape")lbClose(); if(e.key==="ArrowLeft")lbShow(lbI-1); if(e.key==="ArrowRight")lbShow(lbI+1)});
let tx=0; lb.addEventListener("touchstart",e=>tx=e.touches[0].clientX,{passive:true});
lb.addEventListener("touchend",e=>{const d=e.changedTouches[0].clientX-tx; if(Math.abs(d)>50)lbShow(lbI+(d<0?1:-1))});

/* ============ Carousel ============ */
class Carousel{
  constructor(root,items){
    this.root=root; this.items=items; this.i=0; this.paused=false; this.userUntil=0; this.visible=false;
    root.classList.add("car");
    root.innerHTML=`<div class="track" tabindex="0" aria-label="Carrossel de trabalhos">${items.map((it,k)=>
      `<figure class="slide" data-k="${k}"><img src="${esc(it.src)}" alt="${esc(it.cap)}" loading="lazy" draggable="false"><figcaption>${esc(it.cap)}</figcaption></figure>`).join("")}</div>
      <div class="ctl"><button class="arr prev" aria-label="Anterior">←</button><div class="dots">${items.map((_,k)=>`<button aria-label="Foto ${k+1}" data-k="${k}"></button>`).join("")}</div><button class="arr next" aria-label="Próxima">→</button></div>
      <div class="bar"><i></i></div>`;
    this.track=$(".track",root); this.slides=$$(".slide",root); this.dots=$$(".dots button",root); this.prog=$(".bar i",root);
    $$("img",root).forEach(im=>im.addEventListener("error",()=>im.parentNode.classList.add("noimg")));
    $(".prev",root).onclick=()=>{this.touch();this.go(this.i-1)};
    $(".next",root).onclick=()=>{this.touch();this.go(this.i+1)};
    this.dots.forEach(d=>d.onclick=()=>{this.touch();this.go(+d.dataset.k)});
    this.track.addEventListener("scroll",()=>this.sync(),{passive:true});
    this.track.addEventListener("keydown",e=>{if(e.key==="ArrowRight")this.go(this.i+1);if(e.key==="ArrowLeft")this.go(this.i-1)});
    this.track.addEventListener("pointerenter",()=>this.paused=true);
    this.track.addEventListener("pointerleave",()=>this.paused=false);
    this.track.addEventListener("touchstart",()=>this.touch(),{passive:true});
    this.drag();
    new IntersectionObserver(e=>this.visible=e[0].isIntersecting,{threshold:.35}).observe(root);
    if(!reduce) setInterval(()=>this.tick(),3600);
    requestAnimationFrame(()=>{this.sync()});
  }
  touch(){this.userUntil=Date.now()+9000}
  tick(){ if(this.paused||!this.visible||this.root.offsetParent===null||Date.now()<this.userUntil||lb.classList.contains("open"))return;
    this.go(this.i+1) }
  go(k){ k=(k+this.items.length)%this.items.length; const s=this.slides[k];
    this.track.scrollTo({left:s.offsetLeft-(this.track.clientWidth-s.clientWidth)/2,behavior:reduce?"auto":"smooth"}); }
  sync(){ const c=this.track.scrollLeft+this.track.clientWidth/2; let best=0,bd=1e9;
    this.slides.forEach((s,k)=>{const d=Math.abs(s.offsetLeft+s.clientWidth/2-c); if(d<bd){bd=d;best=k}});
    this.i=best; this.slides.forEach((s,k)=>s.classList.toggle("on",k===best));
    this.dots.forEach((d,k)=>d.classList.toggle("on",k===best));
    this.prog.style.width=((best+1)/this.items.length*100)+"%"; }
  drag(){ let down=false,sx=0,sl=0,moved=0; const t=this.track;
    t.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")return; down=true;moved=0;sx=e.clientX;sl=t.scrollLeft;t.classList.add("drag");this.touch()});
    addEventListener("pointermove",e=>{if(!down)return;const d=e.clientX-sx;moved=Math.max(moved,Math.abs(d));t.scrollLeft=sl-d});
    addEventListener("pointerup",()=>{if(!down)return;down=false;t.classList.remove("drag");this.go(this.i)});
    t.addEventListener("click",e=>{ if(moved>6)return; const s=e.target.closest(".slide"); if(!s)return;
      const k=+s.dataset.k; if(k!==this.i){this.go(k)} else lbOpen(this.items,k) }); }
  reset(){ this.track.scrollLeft=0; this.sync() }
}

/* ============ Tabs + panels ============ */
const tabs=$("#tabs"), panels=$("#panels"), cars={};
if(tabs&&panels){
Object.entries(WORKS).forEach(([key,w],n)=>{
  tabs.insertAdjacentHTML("beforeend",`<button class="tab" role="tab" aria-selected="${n===0}" data-k="${key}">${esc(w.label)}</button>`);
  panels.insertAdjacentHTML("beforeend",`<div class="panel" role="tabpanel" id="p-${key}" ${n?"hidden":""}></div>`);
  cars[key]=new Carousel($("#p-"+key),w.items);
});
tabs.addEventListener("click",e=>{const b=e.target.closest(".tab"); if(!b)return;
  $$(".tab",tabs).forEach(t=>t.setAttribute("aria-selected",t===b));
  $$(".panel",panels).forEach(p=>p.hidden=p.id!=="p-"+b.dataset.k);
  const c=cars[b.dataset.k]; c.reset(); c.touch(); setTimeout(()=>c.go(0),30);
});
}

/* faixa infinita */
if($("#strip")&&WORKS.todos)$("#strip").innerHTML=[...WORKS.todos.items,...WORKS.todos.items].map(it=>`<img src="${esc(it.src)}" alt="" loading="lazy" onerror="this.style.opacity=.15">`).join("");
})();
